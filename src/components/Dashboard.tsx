"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Gift,
  LayoutGrid,
  Loader2,
  MessageCircle,
  PiggyBank,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ConfirmDialog, Overlay } from "@/components/Overlay";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { HelperAvatar } from "@/components/HelperAvatar";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useBuddy } from "@/lib/buddy-context";
import { createClient } from "@/lib/supabase/client";
import { formatBookingDay } from "@/lib/booking";
import { buildTodoList } from "@/lib/todo";
import { computeTrustScore } from "@/lib/trust-score";
import { buildHealthCheck } from "@/lib/health-check";
import {
  createItemId,
  groupForKind,
  isComparableItem,
  ITEM_CATEGORIES,
  ITEM_GROUPS,
  itemSummary,
  itemTitle,
  type InsuranceItem,
  type ItemGroupId,
} from "@/lib/items";
import { computeMoveStatus, effectiveQuote, MOVE_STATUS_LABELS, type Quote } from "@/lib/quote";

type ItemStatus = "saved" | "added" | "uncompared" | "compared" | "fetched" | "pending";
type HouseholdMemberItem = { memberUserId: string; memberName: string; item: InsuranceItem; policy: Quote | null };

// Vem ska Buddy höra av sig till för att säga upp? Finns redan ett
// tecknat/auto-hämtat avtal (signed) används det bolagsnamnet. Annars
// försöker vi hitta ett rimligt namn direkt på saken själv (operatör/
// leverantör/elbolag) — täcker abonnemang som lagts till manuellt och
// aldrig fått en Quote. Försäkringsposter utan vare sig Quote eller ett
// sånt fält har inget känt bolag att säga upp hos, så knappen döljs då.
export function getCancelTarget(item: InsuranceItem, signed?: Quote): { name: string; price?: number } | null {
  if (signed) return { name: signed.name, price: signed.price };
  if (item.kind === "telekom") {
    if (item.typ === "tv_streaming") return { name: item.tjanst, price: item.prisPerManad };
    return { name: item.operator, price: item.prisPerManad };
  }
  if (item.kind === "prenumeration") return { name: item.leverantor || item.namn, price: item.prisPerManad };
  if (item.kind === "el") return { name: item.elbolag };
  if (item.kind === "kreditkort" && item.harReddan && item.utgivare) return { name: item.utgivare };
  return null;
}

// Kategorinamnet syns redan som rubrik på kortet, men "Inget tillagt än"
// under den var ändå för generiskt för att kunden skulle koppla ihop det
// direkt — nämner nu vad det faktiskt är kategorin saknar.
const EMPTY_GROUP_LABEL: Record<ItemGroupId, string> = {
  forsakring: "Ingen försäkring tillagd än",
  mobil: "Inget mobilabonnemang tillagt än",
  prenumeration: "Ingen prenumeration tillagd än",
  ekonomi: "Inget ekonomiavtal tillagt än",
};

const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string }> = {
  saved: { label: "Sparad — jämförelse kommer snart", color: "var(--color-slate)" },
  added: { label: "Tillagd", color: "var(--color-slate)" },
  uncompared: { label: "Ej jämförd ännu", color: "var(--color-amber-deep)" },
  compared: { label: "Tecknad", color: "var(--color-forest)" },
  fetched: { label: "Auto-hämtad", color: "var(--color-forest)" },
  pending: { label: "Väntar på uppgifter", color: "var(--color-amber-deep)" },
};

// Ersätter de tidigare utspridda "● text"-strängarna (en per fall, lite olika
// skrivna) med en konsekvent pill — ren presentation, ingen egen state.
function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

const INTRO_POINTS = [
  {
    icon: LayoutGrid,
    text: "Lägg till det du vill hålla koll på — försäkring, mobil, kreditkort, el och mer, i fyra kategorier.",
  },
  {
    icon: ShieldCheck,
    text: "Har du redan en försäkring? Hämta den automatiskt från ditt bolag istället för att fylla i allt själv.",
  },
  {
    icon: Sparkles,
    text: "När du är redo kan du jämföra, få en rekommendation, eller boka ett samtal med en rådgivare.",
  },
];

export function Dashboard({ showIntro: initialShowIntro }: { showIntro?: boolean }) {
  const router = useRouter();
  const {
    userType,
    loading,
    userId,
    profile,
    items,
    removeItem,
    policies,
    setPolicy,
    readyToCompare,
    setReadyToCompare,
    bookings,
    missingInsuranceRequests,
    householdRequests,
    household,
    referralStats,
    hasClaimPerk,
  } = useBuddy();
  const [activeGroup, setActiveGroup] = useState<ItemGroupId | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [showIntro, setShowIntro] = useState(!!initialShowIntro);
  const [introStep, setIntroStep] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [showTrustChecklist, setShowTrustChecklist] = useState(false);
  const [householdItems, setHouseholdItems] = useState<HouseholdMemberItem[] | null>(null);

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  // Hushållets övriga medlemmars saker, separat från kundens egna — samma
  // RPC och filtrering som HouseholdView.tsx:s "FAMILJENS SAKER", bara
  // hämtad här också så det syns direkt på översikten istället för att
  // kräva ett extra klick in till /hushall.
  useEffect(() => {
    if (!household) return;
    const supabase = createClient();
    supabase
      .rpc("get_household_items")
      .then(({ data }) => {
        const rows = (data ?? []) as { member_user_id: string; member_name: string; kind: string; data: InsuranceItem; policy: Quote | null }[];
        setHouseholdItems(
          rows
            .filter((r) => r.member_user_id !== userId)
            .map((r) => ({ memberUserId: r.member_user_id, memberName: r.member_name, item: r.data, policy: r.policy }))
        );
      });
  }, [household, userId]);

  // Nollställ sökrutan när kunden byter grupp — justerat under rendering
  // (samma mönster som ProfilePage.tsx:s syncedLoading) istället för i en
  // effekt, för att undvika en extra rendering-cykel.
  const [syncedGroup, setSyncedGroup] = useState(activeGroup);
  if (activeGroup !== syncedGroup) {
    setSyncedGroup(activeGroup);
    setItemSearch("");
  }

  const closeIntro = () => {
    setShowIntro(false);
    setIntroStep(0);
    router.replace("/dashboard");
  };

  if (loading) return <PageSkeleton />;
  if (!userType) return null;

  if (switching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-forest">
          <Loader2 size={24} color="white" className="bd-spin" />
        </div>
        <div className="text-center">
          <div className="bd-display text-xl mb-1">Ställer om till jämförelseläge…</div>
          <div className="text-sm text-slate">Nu kan du jämföra allt du lagt in</div>
        </div>
      </div>
    );
  }

  const groups = ITEM_GROUPS.map((g) => {
    const groupItems = items.filter(g.matchesItem);
    const comparableItems = groupItems.filter(isComparableItem);
    const signedCount = comparableItems.filter((i) => policies[i.id]?.source === "compared").length;
    return { ...g, items: groupItems, comparableCount: comparableItems.length, signedCount };
  });

  const active = activeGroup ? groups.find((g) => g.id === activeGroup) : undefined;

  const searchQuery = itemSearch.trim().toLowerCase();
  const filteredItems = active
    ? searchQuery
      ? active.items.filter(
          (item) =>
            itemTitle(item).toLowerCase().includes(searchQuery) || itemSummary(item).toLowerCase().includes(searchQuery)
        )
      : active.items
    : [];

  // Hushållets saker i den aktiva kategorin — grupperas per medlem och
  // visas under samma rubrik som kundens egna, inte i en separat
  // fristående sektion (se Dashboard.tsx:s rendering nedan).
  const householdItemsByMemberInActiveGroup = active
    ? Object.entries(
        (householdItems ?? [])
          .filter((mi) => groupForKind(mi.item.kind) === active.id)
          .reduce<Record<string, HouseholdMemberItem[]>>((acc, mi) => {
            (acc[mi.memberName] ??= []).push(mi);
            return acc;
          }, {})
      )
    : [];

  // Kundens registrerade nummer (obligatoriskt vid registrering, se
  // src/lib/phone.ts) blir automatiskt en ofullständig post i
  // Mobilabonnemang-sektionen tills kunden kompletterar operatör/pris —
  // se Del D i docs/kundresa-v2-steg2-plan.md. Ingen egen InsuranceItem
  // (skulle kräva tomma required-fält); helt härledd från profile.phone +
  // frånvaron av en riktig mobilpost, så den försvinner av sig själv när
  // kunden sparar en.
  const pendingMobilNumber =
    profile?.phone && !items.some((i) => i.kind === "telekom" && i.typ === "mobil") ? profile.phone : null;

  const todoList = buildTodoList({ items, policies, profile, missingInsuranceRequests, pendingMobilNumber, householdRequests });
  const hasUrgentRenewal = todoList.some((row) => row.id.startsWith("renewal-") && row.urgent);
  const trustScore = computeTrustScore({ items, policies, profile, hasUrgentRenewal });
  // Redan beräknat för /halsokoll, men syntes bara där bakom "Fler
  // genvägar" — lyfts fram direkt på Trygghetspoäng-kortet så den konkreta
  // besparingen syns utan att kunden behöver leta efter den.
  const healthCheck = buildHealthCheck(items, policies);

  // Bara nästa kommande bokning visas som banner — ISO-datum (YYYY-MM-DD)
  // går att jämföra direkt som strängar, ingen datumparsning behövs här.
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const upcomingBooking = [...bookings]
    .filter((b) => b.day >= todayIso && b.status !== "avbokad")
    .sort((a, b) => (a.day === b.day ? a.time.localeCompare(b.time) : a.day.localeCompare(b.day)))[0];

  return (
    <div className="min-h-screen w-full">
      {showIntro && (
        <Overlay onClose={closeIntro}>
          <span className="bd-eyebrow">Välkommen</span>
          <h2 className="bd-display text-2xl mt-2 mb-1">Såhär funkar Buddy</h2>
          <div className="flex items-center gap-1.5 mb-5">
            {INTRO_POINTS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === introStep ? "w-6 bg-forest" : "w-1.5 bg-frost-2"
                }`}
              />
            ))}
          </div>
          {(() => {
            const point = INTRO_POINTS[introStep];
            return (
              <div key={point.text} className="flex items-start gap-3 mb-8 bd-fade">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                  <point.icon size={18} className="text-forest" />
                </div>
                <p className="text-[15px] text-ink pt-1.5">{point.text}</p>
              </div>
            );
          })()}
          <div className="flex items-center gap-3">
            {introStep > 0 && (
              <button
                onClick={() => setIntroStep((s) => s - 1)}
                className="flex-none px-4 py-3.5 rounded-full font-semibold text-sm border border-line"
              >
                Tillbaka
              </button>
            )}
            {introStep < INTRO_POINTS.length - 1 ? (
              <button
                onClick={() => setIntroStep((s) => s + 1)}
                className="bd-btn flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
              >
                Nästa <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={closeIntro}
                className="bd-btn flex-1 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
              >
                Kom igång
              </button>
            )}
          </div>
        </Overlay>
      )}
      {confirmDeleteId && (
        <ConfirmDialog
          title="Ta bort den här saken?"
          body="Den försvinner från din översikt och tas bort permanent."
          confirmLabel="Ta bort"
          onConfirm={() => {
            removeItem(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      {confirmCancelId && (
        <ConfirmDialog
          title="Säg upp den här saken?"
          body="Buddy tar kontakt med bolaget och sköter uppsägningen åt dig. Du ser status under Att göra tills den är klar."
          confirmLabel="Säg upp åt mig"
          onConfirm={() => {
            const existing = policies[confirmCancelId];
            const now = new Date().toISOString();
            if (existing) {
              setPolicy(confirmCancelId, { ...existing, cancellationPending: true, cancellationRequestedAt: now });
            } else {
              const item = items.find((i) => i.id === confirmCancelId);
              const target = item ? getCancelTarget(item) : null;
              if (target) {
                setPolicy(confirmCancelId, {
                  id: createItemId(),
                  name: target.name,
                  price: target.price ?? 0,
                  highlights: [],
                  cancellationPending: true,
                  cancellationRequestedAt: now,
                });
              }
            }
            setConfirmCancelId(null);
          }}
          onCancel={() => setConfirmCancelId(null)}
        />
      )}
      <TopBar right={<ProfileMenu />} showTabs />
      <div className="max-w-4xl mx-auto px-5 md:px-10 py-10 bd-fade">
        <div className="flex items-center gap-4 mb-1">
          <HelperAvatar size={72} />
          <div>
            <span className="bd-eyebrow">Din översikt</span>
            <h1 className="bd-display text-3xl mt-1">Hej {profile?.name || "där"} 👋</h1>
          </div>
        </div>
        <p className="text-sm mb-8 text-slate">Här är läget på dina saker.</p>

        {trustScore && (
          <div className="rounded-2xl border border-line p-4 mb-4 bg-white">
            <button onClick={() => setShowTrustChecklist((v) => !v)} className="w-full text-left flex items-center gap-4">
              <div className="bd-display text-2xl text-ink flex-none" style={{ fontVariantNumeric: "proportional-nums" }}>
                {trustScore.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium text-ink">Trygghetspoäng</span>
                  <span className="text-xs flex items-center gap-1 flex-none text-slate">
                    {showTrustChecklist ? "Dölj" : "Mer"}
                    <ChevronDown size={12} className={`transition-transform ${showTrustChecklist ? "rotate-180" : ""}`} />
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-frost-2">
                  <div
                    className="h-full rounded-full bg-forest"
                    style={{ width: `${trustScore.score}%`, transition: "width 500ms ease" }}
                  />
                </div>
                <div className="text-xs mt-1.5 text-slate">
                  {trustScore.comparedCount < trustScore.comparableCount
                    ? `${trustScore.comparedCount} av ${trustScore.comparableCount} avtal jämförda`
                    : "Alla avtal jämförda"}
                  {trustScore.hasUrgentRenewal && <> · en förnyelse brådskar</>}
                  {!trustScore.fullmaktSigned && <> · fullmakt inte signerad</>}
                </div>
              </div>
            </button>
            {(healthCheck.potentialSavings > 0 || healthCheck.upcomingRenewals > 0) && (
              <button
                onClick={() => router.push("/halsokoll")}
                className="w-full flex items-center gap-2 mt-3 pt-3 border-t border-line text-left text-sm"
              >
                <PiggyBank size={15} className="text-forest flex-none" />
                <span className="flex-1 text-ink">
                  {healthCheck.potentialSavings > 0 && `Spara ca ${healthCheck.potentialSavings} kr/mån`}
                  {healthCheck.potentialSavings > 0 && healthCheck.upcomingRenewals > 0 && " · "}
                  {healthCheck.upcomingRenewals > 0 && `${healthCheck.upcomingRenewals} avtal förnyas snart`}
                </span>
                <ArrowRight size={14} className="text-forest flex-none" />
              </button>
            )}
            {showTrustChecklist && (
              <div className="mt-4 pt-4 border-t border-line space-y-1">
                {trustScore.score === 100 ? (
                  <div className="text-sm text-forest font-medium py-1.5">Allt i toppskick — inget mer att göra just nu.</div>
                ) : (
                  <>
                    {trustScore.comparedCount < trustScore.comparableCount &&
                      (readyToCompare ? (
                        <button
                          onClick={() => {
                            const next = items.find((i) => isComparableItem(i) && policies[i.id]?.source !== "compared");
                            if (next) router.push(`/compare/${next.id}`);
                          }}
                          className="w-full flex items-center justify-between gap-3 text-left text-sm py-1.5"
                        >
                          <span className="text-ink">
                            Jämför {trustScore.comparableCount - trustScore.comparedCount} kvarvarande avtal
                          </span>
                          <ArrowRight size={14} className="text-forest flex-none" />
                        </button>
                      ) : (
                        <div className="text-sm text-slate py-1.5">Bli klar med att lägga till dina saker för att kunna jämföra</div>
                      ))}
                    {trustScore.hasUrgentRenewal && (
                      <div className="text-sm text-ink py-1.5">En förnyelse brådskar — se Att göra-listan nedan</div>
                    )}
                    {!trustScore.fullmaktSigned && (
                      <button
                        onClick={() => router.push("/importera")}
                        className="w-full flex items-center justify-between gap-3 text-left text-sm py-1.5"
                      >
                        <span className="text-ink">Signera fullmakten</span>
                        <ArrowRight size={14} className="text-forest flex-none" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => router.push("/livshandelser")}
          className="bd-card w-full rounded-2xl border border-dashed border-line p-4 mb-6 flex items-center gap-3 text-left bg-transparent"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost">
            <Sparkles size={16} className="text-forest" />
          </div>
          <div>
            <div className="text-sm font-medium">Ny sak på gång?</div>
            <div className="text-xs text-slate">Ska du köpa, flytta eller skaffa nåt nytt? Vi hjälper dig komma igång.</div>
          </div>
        </button>

        <div className="flex items-center justify-between mb-4">
          {active ? (
            <button
              onClick={() => setActiveGroup(null)}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-ink"
            >
              <ArrowLeft size={15} /> Alla kategorier
            </button>
          ) : (
            <div className="text-sm font-semibold text-slate">Dina saker</div>
          )}
          {!active && (
            <button
              onClick={() => router.push("/livshandelser")}
              className="bd-btn flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full text-white bg-forest"
            >
              <Plus size={14} /> Lägg till en sak
            </button>
          )}
        </div>

        {!readyToCompare && items.length > 0 && (
          <div className="rounded-2xl border border-line p-5 mb-6 flex items-center justify-between gap-4 flex-wrap bg-frost-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-white">
                <Sparkles size={16} className="text-forest" />
              </div>
              <div>
                <div className="text-sm font-semibold">Du lägger till dina saker just nu</div>
                <div className="text-xs text-slate">Lägg in allt du vill hålla koll på — jämförelsen väntar tills du är redo.</div>
              </div>
            </div>
            <button
              onClick={() => {
                setSwitching(true);
                setTimeout(() => {
                  setReadyToCompare(true);
                  setSwitching(false);
                }, 900);
              }}
              className="bd-btn flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-full text-white bg-forest flex-none"
            >
              Klar? Nu jämför vi allt <ArrowRight size={14} />
            </button>
          </div>
        )}

        {upcomingBooking && (
          <div className="rounded-2xl border border-line p-5 mb-6 flex items-center justify-between gap-4 flex-wrap bg-frost-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-white">
                <CalendarDays size={16} className="text-forest" />
              </div>
              <div>
                <div className="text-sm font-semibold">
                  Du har ett bokat {upcomingBooking.meetingType === "video" ? "videosamtal" : "telefonsamtal"}
                </div>
                <div className="text-xs text-slate">
                  {formatBookingDay(upcomingBooking.day)} kl. {upcomingBooking.time} · med en rådgivare från Buddy
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/mina-arenden")}
              className="bd-btn flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-full text-white bg-forest flex-none"
            >
              Se detaljer <ArrowRight size={14} />
            </button>
          </div>
        )}

        {items.length === 0 && (
          <div className="rounded-2xl p-6 mb-6 text-center bg-ink">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 mx-auto mb-4">
              <Smartphone size={22} className="text-white" />
            </div>
            <h2 className="bd-display text-xl text-white mb-2">Kom igång med Buddy</h2>
            <p className="text-sm mb-5 text-white/70 max-w-sm mx-auto">
              Importera dina befintliga försäkringar med BankID, så gör vi det mesta av jobbet åt dig.
            </p>
            <button
              onClick={() => router.push("/importera")}
              className="bd-btn px-5 py-3 rounded-full font-semibold text-sm text-ink bg-white"
            >
              Importera med BankID
            </button>
            <div className="mt-3">
              <button
                onClick={() => router.push("/onboarding")}
                className="text-sm font-medium text-white/70 hover:text-white"
              >
                Eller lägg in det du har manuellt
              </button>
            </div>
          </div>
        )}

        {todoList.length > 0 && (
          <div className="rounded-2xl border border-line bg-white mb-6 overflow-hidden">
            <div className="px-5 pt-4 pb-2 text-sm font-semibold">Att göra</div>
            <div className="divide-y divide-line">
              {todoList.map((row) => {
                const Icon = row.icon;
                const content = (
                  <>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                      <Icon size={15} className="text-forest" />
                    </div>
                    <div className="flex-1 min-w-0 text-sm font-medium truncate">{row.label}</div>
                    {row.sublabel && (
                      <span className={`text-xs font-semibold flex-none ${row.urgent ? "text-amber-deep" : "text-slate"}`}>
                        {row.sublabel}
                      </span>
                    )}
                    {row.href && <ArrowRight size={14} className="text-slate flex-none" />}
                  </>
                );
                return row.href ? (
                  <button
                    key={row.id}
                    onClick={() => router.push(row.href!)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-frost"
                  >
                    {content}
                  </button>
                ) : (
                  <div key={row.id} className="flex items-center gap-3 px-5 py-3">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!active ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {groups.map((g) => {
              const Icon = g.icon;
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveGroup(g.id)}
                  className="bd-card text-left bg-white rounded-2xl border border-line p-5 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-frost-2">
                      <Icon size={18} className="text-forest" />
                    </div>
                    <ChevronRight size={16} className="mt-2.5 text-slate" />
                  </div>
                  <div className="font-semibold text-[15px] mb-1">{g.label}</div>
                  <div className="text-xs mb-3" style={{ color: g.id === "mobil" && g.items.length === 0 && pendingMobilNumber ? "var(--color-amber-deep)" : "var(--color-slate)" }}>
                    {g.items.length === 0
                      ? g.id === "mobil" && pendingMobilNumber
                        ? "1 väntar på uppgifter"
                        : EMPTY_GROUP_LABEL[g.id]
                      : `${g.items.length} ${g.items.length === 1 ? "sak" : "saker"} tillagda`}
                  </div>
                  {g.items.length > 0 && readyToCompare && (
                    <div className="text-xs mt-auto">
                      {g.comparableCount > 0 ? (
                        <span className={g.signedCount === g.comparableCount ? "text-forest" : "text-amber-deep"}>
                          ● {g.signedCount} av {g.comparableCount} jämförda
                        </span>
                      ) : (
                        <span className="text-slate">● Sparade — jämförelse kommer snart</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="bd-display text-2xl mb-4">{active.label}</h2>

            {active.items.length > 2 && (
              <div className="relative mb-4">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
                <input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Sök bland dina saker"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-white text-sm"
                />
              </div>
            )}

            {active.id === "prenumeration" && (
              <button
                onClick={() => router.push("/anslut-bank")}
                className="w-full flex items-center gap-3 rounded-2xl p-5 mb-4 text-left bg-ink"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-white/10">
                  <Building2 size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">Anslut din bank</div>
                  <div className="text-xs text-white/70">
                    Vi läser av dina återkommande dragningar och föreslår vad som ska läggas in — Demo
                  </div>
                </div>
                <ArrowRight size={16} className="text-white/70 flex-none" />
              </button>
            )}

            {searchQuery && filteredItems.length === 0 && active.items.length > 0 && (
              <p className="text-sm mb-4 text-slate">Inga saker matchar &quot;{itemSearch.trim()}&quot;.</p>
            )}

            {(filteredItems.length > 0 || (active.id === "mobil" && pendingMobilNumber)) && (
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                {active.id === "mobil" && pendingMobilNumber && (
                  <div className="bg-white rounded-2xl border border-dashed p-5" style={{ borderColor: "var(--color-amber-deep)" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-frost-2">
                        <Smartphone size={18} className="text-forest" />
                      </div>
                    </div>
                    <div className="font-semibold text-[15px] mb-1">Mobilabonnemang</div>
                    <div className="text-xs mb-4 text-slate">{pendingMobilNumber} · operatör & pris saknas</div>
                    <div className="mb-3">
                      <ItemStatusBadge status="pending" />
                    </div>
                    <button
                      onClick={() => router.push("/onboarding?kind=telekom&typ=mobil")}
                      className="text-sm font-semibold flex items-center gap-1 text-forest"
                    >
                      Komplettera <ArrowRight size={14} />
                    </button>
                  </div>
                )}
                {filteredItems.map((item) => {
                  const signed = policies[item.id];
                  const effective = signed ? effectiveQuote(signed) : undefined;
                  const moveStatus =
                    signed?.pendingQuote && signed.forfallodatum ? computeMoveStatus(signed.forfallodatum) : undefined;
                  const cancelTarget = getCancelTarget(item, signed);
                  const canCompare = isComparableItem(item) && readyToCompare;
                  const canClaim = groupForKind(item.kind) === "forsakring";
                  return (
                    <div key={item.id} className="bg-white rounded-2xl border border-line p-5 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-frost-2">
                          {(() => {
                            const Icon = ITEM_CATEGORIES.find((c) => c.kind === item.kind)!.icon;
                            return <Icon size={18} className="text-forest" />;
                          })()}
                        </div>
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="opacity-40 hover:opacity-100"
                          aria-label="Ta bort"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <button onClick={() => router.push(`/objekt/${item.id}`)} className="text-left mb-4 block">
                        <div className="font-semibold text-[15px] mb-1">{itemTitle(item)}</div>
                        <div className="text-xs text-slate mb-2">{itemSummary(item)}</div>
                        <div className="text-xs font-semibold flex items-center gap-1 text-forest">
                          Visa mer <ArrowRight size={12} />
                        </div>
                      </button>
                      {!isComparableItem(item) ? (
                        <div className="mb-3">
                          <ItemStatusBadge status="saved" />
                        </div>
                      ) : !readyToCompare ? (
                        <div className="mb-3">
                          <ItemStatusBadge status="added" />
                        </div>
                      ) : signed?.source === "compared" ? (
                        <div className="mb-3">
                          <ItemStatusBadge status="compared" />{" "}
                          <span className="text-xs text-ink">
                            hos {effective!.name} — {effective!.price} kr/mån
                          </span>
                          {moveStatus && moveStatus !== "flytt-genomford" && (
                            <div className="text-xs font-semibold mt-1 text-amber-deep">
                              {MOVE_STATUS_LABELS[moveStatus]} — {signed.pendingQuote!.name} tar över{" "}
                              {signed.forfallodatum}
                            </div>
                          )}
                        </div>
                      ) : signed?.source === "fetched" ? (
                        <div className="mb-3">
                          <ItemStatusBadge status="fetched" />
                          <div className="text-xs text-ink mt-1">
                            <b>{signed.name}</b> · {signed.price} kr/mån
                          </div>
                          {signed.omfattning && <div className="text-xs text-slate">{signed.omfattning}</div>}
                          {signed.forfallodatum && <div className="text-xs text-slate">Förfaller {signed.forfallodatum}</div>}
                        </div>
                      ) : (
                        <div className="mb-3">
                          <ItemStatusBadge status="uncompared" />
                        </div>
                      )}
                      {signed?.cancellationPending && (
                        <div className="text-xs font-semibold mb-3 text-amber-deep">Uppsägning pågår hos Buddy</div>
                      )}
                      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
                        {canCompare && (
                          <button
                            onClick={() => router.push(`/compare/${item.id}`)}
                            className="text-sm font-semibold flex items-center gap-1 text-forest"
                          >
                            {signed?.source === "compared" ? "Jämför igen" : "Jämför nu"} <ArrowRight size={14} />
                          </button>
                        )}
                        {cancelTarget && !signed?.cancellationPending && (
                          <button
                            onClick={() => setConfirmCancelId(item.id)}
                            className="text-sm font-medium text-slate hover:text-ink"
                          >
                            Säg upp
                          </button>
                        )}
                        {canClaim && (
                          <button
                            onClick={() => router.push(`/claim?item=${encodeURIComponent(itemTitle(item))}`)}
                            className="text-sm font-medium text-slate hover:text-ink"
                          >
                            Hjälp med skada
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {householdItemsByMemberInActiveGroup.map(([name, memberItems]) => (
              <div key={name} className="mb-4">
                <div className="text-sm font-semibold mb-3 text-slate">
                  {name.split(" ")[0]}s {active.label.toLowerCase()}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {memberItems.map((mi, i) => {
                    const Icon = ITEM_CATEGORIES.find((c) => c.kind === mi.item.kind)?.icon;
                    return (
                      <button
                        key={`${mi.memberUserId}-${i}`}
                        onClick={() => router.push(`/objekt/${mi.item.id}`)}
                        className="bg-white rounded-2xl border border-line p-5 flex flex-col text-left"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-frost-2 mb-4">
                          {Icon && <Icon size={18} className="text-forest" />}
                        </div>
                        <div className="font-semibold text-[15px] mb-1">{itemTitle(mi.item)}</div>
                        <div className="text-xs text-slate mb-2">{itemSummary(mi.item)}</div>
                        {mi.policy?.price != null && (
                          <div className="text-xs text-ink mb-2">
                            <b>{mi.policy.name}</b> · {mi.policy.price} kr/mån
                          </div>
                        )}
                        <div className="text-xs font-semibold flex items-center gap-1 mt-auto pt-1 text-forest">
                          Visa mer <ArrowRight size={12} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {active.addTargets.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {active.addTargets.map((target) => {
                  const Icon = target.icon;
                  const href = `/onboarding?kind=${target.kind}${target.typ ? `&typ=${target.typ}` : ""}`;
                  return (
                    <button
                      key={`${target.kind}-${target.typ ?? ""}`}
                      onClick={() => router.push(href)}
                      className="bd-card rounded-2xl border border-dashed border-line p-5 flex items-center gap-3 text-left bg-transparent"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-frost">
                        <Icon size={18} className="text-forest" />
                      </div>
                      <div className="text-sm font-medium text-slate">Lägg till {target.label.toLowerCase()}</div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div
            className="rounded-2xl p-6 text-white flex flex-col justify-between bg-ink"
            style={{ minHeight: 150 }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={17} className="text-amber" />
                <span className="text-sm font-semibold">Fråga Buddy</span>
              </div>
              <p className="text-sm opacity-70">Osäker på vad som täcks? Buddy svarar direkt.</p>
            </div>
            <button
              onClick={() => router.push("/chat")}
              className="bd-btn self-start mt-4 px-4 py-2 rounded-full text-sm font-semibold bg-white text-ink"
            >
              Öppna chatten
            </button>
          </div>
          <div
            className="rounded-2xl p-6 border border-line flex flex-col justify-between bg-white"
            style={{ minHeight: 150 }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={17} className="text-forest" />
                <span className="text-sm font-semibold">Anmäl en skada</span>
              </div>
              <p className="text-sm text-slate">
                Något har hänt? Buddy hjälper dig genom anmälan.
              </p>
            </div>
            <button
              onClick={() => router.push("/claim")}
              className="bd-btn self-start mt-4 px-4 py-2 rounded-full text-sm font-semibold text-white bg-forest"
            >
              Anmäl skada
            </button>
          </div>
          <div
            className="rounded-2xl p-6 border border-line flex flex-col justify-between bg-white"
            style={{ minHeight: 150 }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays size={17} className="text-forest" />
                <span className="text-sm font-semibold">Boka en specialist</span>
              </div>
              <p className="text-sm text-slate">Vill du bara prata med en människa?</p>
            </div>
            <button
              onClick={() => router.push("/book")}
              className="bd-btn self-start mt-4 px-4 py-2 rounded-full text-sm font-semibold text-white bg-forest"
            >
              Boka möte
            </button>
          </div>
          <div
            className="rounded-2xl p-6 border border-line flex flex-col justify-between bg-white"
            style={{ minHeight: 150 }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gift size={17} className="text-forest" />
                <span className="text-sm font-semibold">Värva en vän</span>
              </div>
              <p className="text-sm text-slate">
                {hasClaimPerk
                  ? "Du har låst upp kostnadsfri hjälp vid skadereglering!"
                  : referralStats && referralStats.qualified > 0
                    ? `${referralStats.qualified} av 5 kvalificerade värvningar.`
                    : "Dela din kod, lås upp kostnadsfri hjälp vid skadereglering."}
              </p>
            </div>
            <button
              onClick={() => router.push("/varva-en-van")}
              className="bd-btn self-start mt-4 px-4 py-2 rounded-full text-sm font-semibold text-white bg-forest"
            >
              Dela min kod
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-line p-5 flex items-start gap-3 bg-frost-2">
          <HelperAvatar size={44} />
          <div className="flex-1">
            <div className="text-xs font-semibold text-forest mb-1">Buddy</div>
            <p className="text-sm mb-3 text-ink">
              {items.length === 0
                ? "du har inte lagt in något än — börja med det som känns viktigast, t.ex. ditt boende eller din bil."
                : !readyToCompare
                ? "bra start — lägg till fler saker, eller klicka på \"Nu jämför vi allt\" ovan när du är redo."
                : (() => {
                    const comparableCount = items.filter(isComparableItem).length;
                    // Måste räkna på samma sätt som Trygghetspoäng-kortet ovan
                    // (bara source === "compared", inte alla policies-rader —
                    // en auto-hämtad/"fetched" offert är inte jämförd än),
                    // annars kan de två motsäga varandra på samma skärm.
                    const signedCount = trustScore?.comparedCount ?? 0;
                    if (comparableCount === 0) {
                      return "bra jobbat! Fortsätt lägga till fler saker så får du en komplett bild av vad du betalar för.";
                    }
                    if (signedCount === 0) {
                      return "du har inte jämfört några avtal än — det tar ~1 minut per sak och du bestämmer själv om du vill teckna.";
                    }
                    if (signedCount < comparableCount) {
                      return "bra jobbat, fortsätt jämföra dina övriga saker för att se om du kan spara mer.";
                    }
                    return "snyggt — allt du lagt in är jämfört. Lägg gärna till fler saker för en komplett bild.";
                  })()}
            </p>
            {items.length > 0 && readyToCompare && (
              <button
                onClick={() => router.push("/rekommendation")}
                className="text-sm font-semibold flex items-center gap-1 text-forest"
              >
                Se din rekommendation <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

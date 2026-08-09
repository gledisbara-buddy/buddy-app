"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  CalendarDays,
  ChevronRight,
  Gift,
  HeartPulse,
  LayoutGrid,
  Loader2,
  MessageCircle,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Truck,
} from "lucide-react";
import { ConfirmDialog, Overlay } from "@/components/Overlay";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useBuddy } from "@/lib/buddy-context";
import { formatBookingDay } from "@/lib/booking";
import { daysUntilSwedishDate } from "@/lib/dates";
import { isComparableItem, ITEM_CATEGORIES, ITEM_GROUPS, itemSummary, itemTitle, type ItemGroupId } from "@/lib/items";

type ItemStatus = "saved" | "added" | "uncompared" | "compared" | "fetched";

const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string }> = {
  saved: { label: "Sparad — jämförelse kommer snart", color: "var(--color-slate)" },
  added: { label: "Tillagd", color: "var(--color-slate)" },
  uncompared: { label: "Ej jämförd ännu", color: "var(--color-amber-deep)" },
  compared: { label: "Tecknad", color: "var(--color-forest)" },
  fetched: { label: "Auto-hämtad", color: "var(--color-forest)" },
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
    text: "Lägg till det du vill hålla koll på — försäkring, mobil, kreditkort, el och mer, i tre kategorier.",
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
  const { userType, loading, profile, items, removeItem, policies, readyToCompare, setReadyToCompare, bookings } = useBuddy();
  const [activeGroup, setActiveGroup] = useState<ItemGroupId | null>(null);
  const [showIntro, setShowIntro] = useState(!!initialShowIntro);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  const closeIntro = () => {
    setShowIntro(false);
    router.replace("/dashboard");
  };

  if (loading || !userType) return null;

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
    const groupItems = items.filter((i) => g.kinds.includes(i.kind));
    const comparableItems = groupItems.filter(isComparableItem);
    const signedCount = comparableItems.filter((i) => policies[i.id]?.source === "compared").length;
    return { ...g, items: groupItems, comparableCount: comparableItems.length, signedCount };
  });

  const active = activeGroup ? groups.find((g) => g.id === activeGroup) : undefined;

  // Bevakning: förfallodatum finns bara på auto-hämtade ("fetched") offerter —
  // så fort något är jämfört och tecknat behövs ingen påminnelse längre.
  const upcomingRenewals = items
    .filter(isComparableItem)
    .flatMap((item) => {
      const quote = policies[item.id];
      if (quote?.source !== "fetched" || !quote.forfallodatum) return [];
      const days = daysUntilSwedishDate(quote.forfallodatum);
      if (days == null) return [];
      return [{ item, quote, days }];
    })
    .sort((a, b) => a.days - b.days);

  // Bara nästa kommande bokning visas som banner — ISO-datum (YYYY-MM-DD)
  // går att jämföra direkt som strängar, ingen datumparsning behövs här.
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const upcomingBooking = [...bookings]
    .filter((b) => b.day >= todayIso)
    .sort((a, b) => (a.day === b.day ? a.time.localeCompare(b.time) : a.day.localeCompare(b.day)))[0];

  return (
    <div className="min-h-screen w-full">
      {showIntro && (
        <Overlay onClose={closeIntro}>
          <span className="bd-eyebrow">Välkommen</span>
          <h2 className="bd-display text-2xl mt-2 mb-4">Såhär funkar Buddy</h2>
          <div className="flex flex-col gap-3 mb-6">
            {INTRO_POINTS.map((p) => (
              <div key={p.text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                  <p.icon size={15} className="text-forest" />
                </div>
                <p className="text-sm text-ink">{p.text}</p>
              </div>
            ))}
          </div>
          <button
            onClick={closeIntro}
            className="bd-btn w-full py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
          >
            Kom igång
          </button>
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
      <TopBar right={<ProfileMenu />} />
      <div className="max-w-4xl mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Din översikt</span>
        <h1 className="bd-display text-3xl mt-2 mb-1">Hej {profile?.name || "där"} 👋</h1>
        <p className="text-sm mb-8 text-slate">Här är läget på dina saker.</p>

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
              onClick={() => router.push("/onboarding?mode=add")}
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

        <div className="rounded-2xl border border-line bg-white mb-6 overflow-hidden">
          <div className="px-5 pt-4 pb-2 text-sm font-semibold">Mer att göra</div>
          <div className="divide-y divide-line">
            {upcomingRenewals.map(({ item, quote, days }) => (
              <button
                key={item.id}
                onClick={() => router.push(`/compare/${item.id}`)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-frost"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                  <CalendarDays size={15} className="text-forest" />
                </div>
                <div className="flex-1 min-w-0 text-sm font-medium truncate">
                  {itemTitle(item)} hos {quote.name} förnyas {quote.forfallodatum}
                </div>
                <span className={`text-xs font-semibold flex-none ${days <= 30 ? "text-amber-deep" : "text-slate"}`}>
                  Om {days} {days === 1 ? "dag" : "dagar"}
                </span>
                <ArrowRight size={14} className="text-slate flex-none" />
              </button>
            ))}
            <button
              onClick={() => router.push("/halsokoll")}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-frost"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                <HeartPulse size={15} className="text-forest" />
              </div>
              <span className="flex-1 text-sm font-medium">Årlig hälsokoll</span>
              <ArrowRight size={14} className="text-slate flex-none" />
            </button>
            <button
              onClick={() => router.push("/livshandelser?event=flytt")}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-frost"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                <Truck size={15} className="text-forest" />
              </div>
              <span className="flex-1 text-sm font-medium">Jag ska flytta</span>
              <ArrowRight size={14} className="text-slate flex-none" />
            </button>
            <button
              onClick={() => router.push("/livshandelser?event=barn")}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-frost"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                <Baby size={15} className="text-forest" />
              </div>
              <span className="flex-1 text-sm font-medium">Vi väntar barn</span>
              <ArrowRight size={14} className="text-slate flex-none" />
            </button>
            <button
              onClick={() => router.push("/varva-en-van")}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-frost"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                <Gift size={15} className="text-forest" />
              </div>
              <span className="flex-1 text-sm font-medium">Värva en vän</span>
              <ArrowRight size={14} className="text-slate flex-none" />
            </button>
          </div>
        </div>

        {!active ? (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
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
                  <div className="text-xs mb-3 text-slate">
                    {g.items.length === 0
                      ? "Inget tillagt än"
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

            {active.items.length > 0 && (
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                {active.items.map((item) => {
                  const signed = policies[item.id];
                  return (
                    <div key={item.id} className="bg-white rounded-2xl border border-line p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-frost-2">
                          {(() => {
                            const Icon = ITEM_CATEGORIES.find((c) => c.kind === item.kind)!.icon;
                            return <Icon size={18} className="text-forest" />;
                          })()}
                        </div>
                        <button onClick={() => setConfirmDeleteId(item.id)} className="opacity-40 hover:opacity-100">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="font-semibold text-[15px] mb-1">{itemTitle(item)}</div>
                      <div className="text-xs mb-4 text-slate">{itemSummary(item)}</div>
                      {!isComparableItem(item) ? (
                        <ItemStatusBadge status="saved" />
                      ) : !readyToCompare ? (
                        <ItemStatusBadge status="added" />
                      ) : signed?.source === "compared" ? (
                        <>
                          <div className="mb-3">
                            <ItemStatusBadge status="compared" /> <span className="text-xs text-ink">hos {signed.name} — {signed.price} kr/mån</span>
                          </div>
                          <button
                            onClick={() => router.push(`/compare/${item.id}`)}
                            className="text-sm font-semibold flex items-center gap-1 text-forest"
                          >
                            Jämför igen <ArrowRight size={14} />
                          </button>
                        </>
                      ) : signed?.source === "fetched" ? (
                        <>
                          <div className="mb-2">
                            <ItemStatusBadge status="fetched" />
                          </div>
                          <div className="text-xs text-ink">
                            <b>{signed.name}</b> · {signed.price} kr/mån
                          </div>
                          {signed.omfattning && <div className="text-xs text-slate">{signed.omfattning}</div>}
                          {signed.forfallodatum && (
                            <div className="text-xs mb-3 text-slate">Förfaller {signed.forfallodatum}</div>
                          )}
                          <button
                            onClick={() => router.push(`/compare/${item.id}`)}
                            className="text-sm font-semibold flex items-center gap-1 text-forest"
                          >
                            Jämför nu <ArrowRight size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="mb-3">
                            <ItemStatusBadge status="uncompared" />
                          </div>
                          <button
                            onClick={() => router.push(`/compare/${item.id}`)}
                            className="text-sm font-semibold flex items-center gap-1 text-forest"
                          >
                            Jämför nu <ArrowRight size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {ITEM_CATEGORIES.filter((cat) => active.kinds.includes(cat.kind)).map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.kind}
                    onClick={() => router.push(`/onboarding?mode=add&kind=${cat.kind}`)}
                    className="bd-card rounded-2xl border border-dashed border-line p-5 flex items-center gap-3 text-left bg-transparent"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-frost">
                      <Icon size={18} className="text-forest" />
                    </div>
                    <div className="text-sm font-medium text-slate">Lägg till {cat.label.toLowerCase()}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-4">
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
        </div>

        <div className="rounded-2xl border border-line p-5 flex items-start gap-3 bg-frost-2">
          <Star size={16} className="mt-0.5 flex-none text-amber-deep" />
          <div className="flex-1">
            <p className="text-sm mb-3 text-ink">
              <b>Tips från Buddy:</b>{" "}
              {items.length === 0
                ? "du har inte lagt in något än — börja med det som känns viktigast, t.ex. ditt boende eller din bil."
                : !readyToCompare
                ? "bra start — lägg till fler saker, eller klicka på \"Nu jämför vi allt\" ovan när du är redo."
                : (() => {
                    const comparableCount = items.filter(isComparableItem).length;
                    const signedCount = Object.keys(policies).length;
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

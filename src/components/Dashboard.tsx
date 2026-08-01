"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  MessageCircle,
  Plus,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useBuddy } from "@/lib/buddy-context";
import { PRIORITY_OPTIONS } from "@/lib/insurance";
import { isComparableItem, ITEM_CATEGORIES, ITEM_GROUPS, itemSummary, itemTitle, type ItemGroupId } from "@/lib/items";

export function Dashboard() {
  const router = useRouter();
  const { userType, profile, items, removeItem, policies } = useBuddy();
  const [activeGroup, setActiveGroup] = useState<ItemGroupId | null>(null);

  useEffect(() => {
    if (!userType) router.replace("/kom-igang");
  }, [userType, router]);

  if (!userType) return null;

  const priorityLabel = PRIORITY_OPTIONS.find((p) => p.id === profile?.priority)?.label;

  const groups = ITEM_GROUPS.map((g) => {
    const groupItems = items.filter((i) => g.kinds.includes(i.kind));
    const comparableItems = groupItems.filter(isComparableItem);
    const signedCount = comparableItems.filter((i) => policies[i.id]).length;
    return { ...g, items: groupItems, comparableCount: comparableItems.length, signedCount };
  });

  const active = activeGroup ? groups.find((g) => g.id === activeGroup) : undefined;

  return (
    <div className="min-h-screen w-full">
      <TopBar right={<ProfileMenu />} />
      <div className="max-w-4xl mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Din översikt</span>
        <h1 className="bd-display text-3xl mt-2 mb-1">Hej {profile?.name || "där"} 👋</h1>
        <p className="text-sm mb-8 text-slate">
          {priorityLabel ? (
            <>
              Fokus just nu: <b className="text-ink">{priorityLabel}</b>. Här är läget på dina saker.
            </>
          ) : (
            "Här är läget på dina saker."
          )}
        </p>

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
                  {g.items.length > 0 && (
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
                        <button onClick={() => removeItem(item.id)} className="opacity-40 hover:opacity-100">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="font-semibold text-[15px] mb-1">{itemTitle(item)}</div>
                      <div className="text-xs mb-4 text-slate">{itemSummary(item)}</div>
                      {!isComparableItem(item) ? (
                        <div className="text-xs text-slate">● Sparad — jämförelse kommer snart</div>
                      ) : signed ? (
                        <>
                          <div className="text-xs mb-3 text-forest">
                            ● Tecknad hos {signed.name} — {signed.price} kr/mån
                          </div>
                          <button
                            onClick={() => router.push(`/compare/${item.id}`)}
                            className="text-sm font-semibold flex items-center gap-1 text-forest"
                          >
                            Jämför igen <ArrowRight size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-xs mb-3 text-amber-deep">● Ej jämförd ännu</div>
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
              {ITEM_CATEGORIES.filter(
                (cat) => active.kinds.includes(cat.kind) && !active.items.some((i) => i.kind === cat.kind)
              ).map((cat) => {
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
            {items.length > 0 && (
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

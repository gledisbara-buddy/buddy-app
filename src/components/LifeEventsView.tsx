"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Baby, Briefcase, Car, Check, PawPrint, Plus, Truck } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useBuddy } from "@/lib/buddy-context";
import { getSysselsattningTips, LIFE_EVENTS, type LifeEventId } from "@/lib/life-events";
import { ITEM_CATEGORIES } from "@/lib/items";

const EVENT_ICONS: Record<LifeEventId, typeof Truck> = { flytt: Truck, barn: Baby, fordon: Car, djur: PawPrint };

export function LifeEventsView({ initialEvent }: { initialEvent?: LifeEventId }) {
  const router = useRouter();
  const { userType, loading, items } = useBuddy();
  const [event, setEvent] = useState<LifeEventId | null>(initialEvent ?? null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  if (loading) return <PageSkeleton />;
  if (!userType) return null;

  const selectEvent = (id: LifeEventId) => {
    setEvent(id);
    router.replace(`/livshandelser?event=${id}`);
  };

  const tips = getSysselsattningTips(items);
  const active = event ? LIFE_EVENTS[event] : undefined;

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} />
      <div className="max-w-2xl mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Livshändelser</span>

        {active ? (
          <div key={event} className="bd-fade">
            <h1 className="bd-display text-3xl mt-2 mb-2">{active.title}</h1>
            <p className="text-sm mb-6 text-slate">{active.intro}</p>
            <div className="flex flex-col gap-3 mb-6">
              {active.steps.map((step, i) => (
                <div key={i} className="bg-white rounded-2xl border border-line p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-none bg-frost-2 text-xs font-semibold text-forest">
                      {i + 1}
                    </div>
                    <p className="text-sm text-ink">{step.text}</p>
                  </div>
                  {step.cta && (
                    <button
                      onClick={() => router.push(step.cta!.href)}
                      className="text-sm font-semibold flex items-center gap-1 text-forest flex-none whitespace-nowrap"
                    >
                      {step.cta.label} <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setEvent(null);
                router.replace("/livshandelser");
              }}
              className="text-sm font-semibold text-forest mb-8"
            >
              Något annat på gång istället?
            </button>
          </div>
        ) : (
          <div key="none" className="bd-fade">
            <h1 className="bd-display text-3xl mt-2 mb-2">Något på gång i livet?</h1>
            <p className="text-sm mb-6 text-slate">Välj det som stämmer, så guidar vi dig genom vad som är bra att tänka på.</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {(Object.keys(LIFE_EVENTS) as LifeEventId[]).map((id) => {
                const Icon = EVENT_ICONS[id];
                return (
                  <button
                    key={id}
                    onClick={() => selectEvent(id)}
                    className="bd-card bg-white rounded-2xl border border-line p-5 flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                      <Icon size={18} className="text-forest" />
                    </div>
                    <div className="text-sm font-semibold">{LIFE_EVENTS[id].title}</div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowAllCategories((v) => !v)}
              className="text-sm font-semibold text-forest mb-4"
            >
              {showAllCategories ? "Dölj alla kategorier" : "Inget av detta — visa alla kategorier jag kan lägga till"}
            </button>
            {showAllCategories && (
              <div className="grid sm:grid-cols-2 gap-3 mb-8 bd-fade">
                {ITEM_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.kind}
                      onClick={() => router.push(`/onboarding?kind=${cat.kind}`)}
                      className="bd-card bg-white rounded-2xl border border-line p-4 flex items-center gap-3 text-left"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                        <Icon size={16} className="text-forest" />
                      </div>
                      <div className="text-sm font-semibold">{cat.label}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <div className="text-sm font-semibold mb-3 text-slate">Utifrån din sysselsättning</div>
          {tips.length > 0 ? (
            <div className="flex flex-col gap-3">
              {tips.map((t) => (
                <div key={t.sysselsattning} className="bg-white rounded-2xl border border-line p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                    <Briefcase size={15} className="text-forest" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-1 text-slate">{t.label}</div>
                    <p className="text-sm text-ink">{t.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={() => router.push("/onboarding?kind=person")}
              className="bg-white rounded-2xl border border-dashed border-line p-4 flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-medium text-slate">
                Lägg till en person och ange sysselsättning för skräddarsydda tips
              </span>
              <Plus size={15} className="text-forest flex-none" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate flex items-center gap-1.5">
          <Check size={13} className="text-forest" /> Checklistorna är förslag — inget läggs till eller ändras automatiskt.
        </p>
      </div>
    </div>
  );
}

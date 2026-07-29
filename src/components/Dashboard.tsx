"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, MessageCircle, ShieldAlert, Star } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { useBuddy } from "@/lib/buddy-context";
import { INSURANCE_META, PRIORITY_OPTIONS, type InsuranceId } from "@/lib/insurance";

export function Dashboard() {
  const router = useRouter();
  const { userType, onboardData, policies } = useBuddy();

  useEffect(() => {
    if (!userType || !onboardData) router.replace("/");
  }, [userType, onboardData, router]);

  if (!userType || !onboardData) return null;

  const chosen = onboardData.selected.map((id) => ({
    id: id as InsuranceId,
    ...INSURANCE_META[id as InsuranceId],
  }));
  const priorityLabel = PRIORITY_OPTIONS.find((p) => p.id === onboardData.priority)?.label;

  return (
    <div className="min-h-screen w-full">
      <TopBar
        right={
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold bd-display bg-forest">
            {onboardData.name?.[0]?.toUpperCase() || "?"}
          </div>
        }
      />
      <div className="max-w-4xl mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Din översikt</span>
        <h1 className="bd-display text-3xl mt-2 mb-1">Hej {onboardData.name || "där"} 👋</h1>
        <p className="text-sm mb-8 text-slate">
          Fokus just nu: <b className="text-ink">{priorityLabel}</b>. Här är läget på dina
          försäkringar.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {chosen.map((c) => {
            const Icon = c.icon;
            const signed = policies[c.id];
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-line p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-frost-2">
                  <Icon size={18} className="text-forest" />
                </div>
                <div className="font-semibold text-[15px] mb-1">{c.label}</div>
                {signed ? (
                  <>
                    <div className="text-xs mb-4 text-forest">
                      ● Tecknad hos {signed.name} — {signed.price} kr/mån
                    </div>
                    <button
                      onClick={() => router.push(`/compare/${c.id}`)}
                      className="text-sm font-semibold flex items-center gap-1 text-forest"
                    >
                      Jämför igen <ArrowRight size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-xs mb-4 text-amber-deep">● Ej jämförd ännu</div>
                    <button
                      onClick={() => router.push(`/compare/${c.id}`)}
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
          <p className="text-sm text-ink">
            <b>Tips från Buddy:</b>{" "}
            {Object.keys(policies).length === 0
              ? "du har inte jämfört några avtal än — det tar ~3 minuter och du bestämmer själv om du vill teckna."
              : "bra jobbat, fortsätt jämföra dina övriga försäkringar för att se om du kan spara mer."}
          </p>
        </div>
      </div>
    </div>
  );
}

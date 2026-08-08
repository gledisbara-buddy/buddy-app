"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, PhoneCall, PiggyBank, Plus } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useBuddy } from "@/lib/buddy-context";
import { buildHealthCheck } from "@/lib/health-check";

export function HealthCheckView() {
  const router = useRouter();
  const { userType, loading, items, policies } = useBuddy();

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  if (loading || !userType) return null;

  const check = buildHealthCheck(items, policies);
  const comparableCount = check.comparedCount + check.uncomparedCount;

  const headline =
    check.totalItems === 0
      ? "Redo för din första hälsokoll?"
      : check.uncomparedCount === 0 && comparableCount > 0
        ? "Snyggt — allt du lagt in är jämfört"
        : "Så ser läget ut just nu";

  const intro =
    check.totalItems === 0
      ? "Lägg till det du vill hålla koll på så ger vi dig en samlad bild nästa gång."
      : `${check.comparedCount} av ${comparableCount} jämförbara saker är jämförda, och du har ${check.totalItems} ${
          check.totalItems === 1 ? "sak" : "saker"
        } tillagda totalt.`;

  const stats = [
    { label: "Saker tillagda", value: String(check.totalItems) },
    { label: "Jämförda", value: `${check.comparedCount} / ${comparableCount}` },
    { label: "Total månadskostnad", value: `${check.totalMonthlySpend} kr` },
    { label: "Besparingspotential", value: `${check.potentialSavings} kr/mån` },
  ];

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} />
      <div className="max-w-2xl mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Årlig hälsokoll</span>
        <h1 className="bd-display text-3xl mt-2 mb-2">{headline}</h1>
        <p className="text-sm mb-8 text-slate">{intro}</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-line p-4">
              <div className="text-xs mb-1 text-slate">{s.label}</div>
              <div className="bd-display text-xl">{s.value}</div>
            </div>
          ))}
        </div>

        {check.upcomingRenewals > 0 && (
          <div className="bg-white rounded-2xl border border-line p-4 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost-2">
              <CalendarClock size={16} className="text-forest" />
            </div>
            <div className="flex-1 text-sm text-ink">
              {check.upcomingRenewals} avtal förnyas inom 60 dagar.
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm font-semibold flex items-center gap-1 text-forest flex-none whitespace-nowrap"
            >
              Visa <ArrowRight size={14} />
            </button>
          </div>
        )}

        {check.potentialSavings > 0 && (
          <div className="bg-white rounded-2xl border border-line p-4 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost-2">
              <PiggyBank size={16} className="text-forest" />
            </div>
            <p className="text-sm text-ink">
              Du kan uppskattningsvis spara {check.potentialSavings} kr/mån genom att jämföra det du redan hämtat in.
            </p>
          </div>
        )}

        {check.missingCategories.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-semibold mb-3 text-slate">Du har inte lagt in än</div>
            <div className="flex flex-col gap-2">
              {check.missingCategories.map((c) => (
                <button
                  key={c.kind}
                  onClick={() => router.push(`/onboarding?mode=add&kind=${c.kind}`)}
                  className="bg-white rounded-2xl border border-dashed border-line p-4 flex items-center justify-between text-left"
                >
                  <span className="text-sm font-medium">{c.label}</span>
                  <Plus size={15} className="text-forest" />
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs mb-8 text-slate">
          Siffrorna ovan är exempel i den här prototypen, inte en riktig beräkning.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/book")}
            className="bd-btn flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
          >
            <PhoneCall size={16} /> Boka ett samtal
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="bd-btn flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-[15px] border border-line bg-white"
          >
            Tillbaka till översikten
          </button>
        </div>
      </div>
    </div>
  );
}

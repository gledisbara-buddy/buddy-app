"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, PhoneCall, Sparkles } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { PageSkeleton } from "@/components/PageSkeleton";
import { HelperTip } from "@/components/HelperTip";
import { useBuddy } from "@/lib/buddy-context";
import { buildRecommendation } from "@/lib/recommendation";

export function RecommendationView() {
  const router = useRouter();
  const { userType, loading, items, policies, profile } = useBuddy();

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  if (loading) return <PageSkeleton />;
  if (!userType) return null;

  const rec = buildRecommendation(items, policies, profile);

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} />
      <div className="max-w-2xl mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Din rekommendation</span>
        <h1 className="bd-display text-3xl mt-2 mb-5">{rec.headline}</h1>
        <HelperTip dismissible={false} className="mb-8">
          {rec.intro}
        </HelperTip>

        {rec.bullets.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            {rec.bullets.map((b, i) => (
              <div key={i} className="bg-white rounded-2xl border border-line p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                    <Sparkles size={15} className="text-forest" />
                  </div>
                  <p className="text-sm text-ink">{b.text}</p>
                </div>
                {b.itemId && (
                  <button
                    onClick={() => router.push(`/compare/${b.itemId}`)}
                    className="text-sm font-semibold flex items-center gap-1 text-forest flex-none whitespace-nowrap"
                  >
                    Jämför <ArrowRight size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {rec.uppskattadBesparing > 0 && (
          <p className="text-xs mb-8 text-slate">
            Uppskattad besparing är ett exempel i den här prototypen, inte en riktig beräkning.
          </p>
        )}

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

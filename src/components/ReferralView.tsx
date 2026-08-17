"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, ShieldCheck, Sparkles } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useBuddy } from "@/lib/buddy-context";
import { generateCode } from "@/lib/referral";

const GOAL = 5;

export function ReferralView() {
  const router = useRouter();
  const { userType, loading, profile, updateProfile, referralStats, hasClaimPerk } = useBuddy();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  useEffect(() => {
    if (!copiedLink) return;
    const t = setTimeout(() => setCopiedLink(false), 2000);
    return () => clearTimeout(t);
  }, [copiedLink]);

  useEffect(() => {
    if (!copiedCode) return;
    const t = setTimeout(() => setCopiedCode(false), 2000);
    return () => clearTimeout(t);
  }, [copiedCode]);

  if (loading || !userType) return null;

  const code = profile?.referralCode;
  const qualified = referralStats?.qualified ?? 0;
  const total = referralStats?.total ?? 0;
  const progress = Math.min(qualified / GOAL, 1);

  // Vännen landar direkt på registreringen med koden ifylld — se
  // AuthForm.tsx:s initialReferralCode-prop. window.location.origin läses
  // i klick-handlern (inte vid rendering) eftersom window inte finns
  // under SSR-passet för den här klientkomponenten.
  const handleCopyLink = () => {
    if (!code) return;
    navigator.clipboard.writeText(`${window.location.origin}/login?type=privat&ref=${code}`);
    setCopiedLink(true);
  };

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
  };

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} showTabs />
      <div className="max-w-lg mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Värva en vän</span>
        <h1 className="bd-display text-3xl mt-2 mb-2">Dela Buddy med dina vänner</h1>
        <p className="text-sm mb-8 text-slate">
          Bjud in {GOAL} vänner som lägger in en sak och jämför via din kod — då får du kostnadsfri
          hjälp av en specialist vid skadereglering, oavsett vad som händer.
        </p>

        <div className="rounded-3xl p-6 mb-6 text-center bg-ink-deep">
          <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,.6)" }}>
            DIN KOD
          </div>
          {code ? (
            <>
              <div className="bd-display text-4xl text-white mb-5 tracking-wide">{code}</div>
              <button
                onClick={handleCopyLink}
                className="bd-btn inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-[15px] bg-white"
                style={{ color: "var(--color-ink-deep)" }}
              >
                {copiedLink ? (
                  <>
                    Länk kopierad! <Check size={16} />
                  </>
                ) : (
                  <>
                    Kopiera inbjudningslänk <Link2 size={16} />
                  </>
                )}
              </button>
              <button
                onClick={handleCopyCode}
                className="block w-full text-center text-xs mt-3"
                style={{ color: "rgba(255,255,255,.7)" }}
              >
                {copiedCode ? "Koden kopierad!" : "eller kopiera bara koden"}
                <Copy size={11} className="inline ml-1.5 -mt-0.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => updateProfile({ referralCode: generateCode(profile?.name) })}
              className="bd-btn inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-[15px] bg-white"
              style={{ color: "var(--color-ink-deep)" }}
            >
              Skapa min kod
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-line p-5 mb-3">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs mb-1 text-slate">Vänner som gått med</div>
              <div className="bd-display text-xl">{total}</div>
            </div>
            <div>
              <div className="text-xs mb-1 text-slate">Kvalificerade värvningar</div>
              <div className="bd-display text-xl">
                {qualified} / {GOAL}
              </div>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-frost-2">
            <div className="h-full rounded-full bg-forest" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="text-xs mt-2 text-slate">
            En värvning räknas när vännen lagt till minst en sak och nått sitt jämförelseresultat.
          </p>
        </div>

        {hasClaimPerk ? (
          <div className="rounded-2xl border border-line p-5 mb-8 flex items-start gap-3 bg-frost-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-white">
              <ShieldCheck size={15} className="text-forest" />
            </div>
            <p className="text-sm text-ink">
              <b>Du har uppnått {GOAL} värvningar!</b> Du har nu kostnadsfri hjälp av en specialist
              vid skadereglering, oavsett vad som händer.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-line p-5 mb-8 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
              <Sparkles size={15} className="text-forest" />
            </div>
            <p className="text-sm text-slate">
              {qualified === 0
                ? `Dela din kod — vid ${GOAL} kvalificerade värvningar låser du upp kostnadsfri hjälp vid skadereglering.`
                : `${GOAL - qualified} kvalificerad${GOAL - qualified === 1 ? "" : "e"} värvning${GOAL - qualified === 1 ? "" : "ar"} kvar till kostnadsfri hjälp vid skadereglering.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

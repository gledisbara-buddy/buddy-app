"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Gift } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useBuddy } from "@/lib/buddy-context";

function generateCode(name?: string | null): string {
  const base = (name ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "VAN";
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base}${suffix}`;
}

export function ReferralView() {
  const router = useRouter();
  const { userType, profile } = useBuddy();
  const [code] = useState(() => generateCode(profile?.name));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!userType) router.replace("/kom-igang");
  }, [userType, router]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (!userType) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
  };

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} />
      <div className="max-w-lg mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Värva en vän</span>
        <h1 className="bd-display text-3xl mt-2 mb-2">Dela Buddy, få kredit ihop</h1>
        <p className="text-sm mb-8 text-slate">
          Du och din vän får 150 kr var i Buddy-kredit när hen tecknar sin första försäkring via din kod.
        </p>

        <div className="rounded-3xl p-6 mb-6 text-center bg-ink-deep">
          <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,.6)" }}>
            DIN KOD
          </div>
          <div className="bd-display text-4xl text-white mb-5 tracking-wide">{code}</div>
          <button
            onClick={handleCopy}
            className="bd-btn inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-[15px] bg-white"
            style={{ color: "var(--color-ink-deep)" }}
          >
            {copied ? (
              <>
                Kopierad! <Check size={16} />
              </>
            ) : (
              <>
                Kopiera kod <Copy size={16} />
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-line p-5 mb-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs mb-1 text-slate">Vänner som gått med</div>
              <div className="bd-display text-xl">0</div>
            </div>
            <div>
              <div className="text-xs mb-1 text-slate">Intjänad kredit</div>
              <div className="bd-display text-xl">0 kr</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-dashed border-line p-5 mb-8 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
            <Gift size={15} className="text-forest" />
          </div>
          <p className="text-sm text-slate">
            Exempel: bjuder du in 3 vänner som tecknar via din kod får ni tillsammans 450 kr i kredit.
          </p>
        </div>

        <p className="text-xs text-slate">
          Värvningsprogrammet är en prototyp — koden fungerar inte på riktigt än.
        </p>
      </div>
    </div>
  );
}

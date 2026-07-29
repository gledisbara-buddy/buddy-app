"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Smartphone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useBuddy } from "@/lib/buddy-context";
import type { UserType } from "@/lib/types";

type Phase = "idle" | "waiting" | "success";

export function BankIdLogin({ userType }: { userType: UserType }) {
  const router = useRouter();
  const { setUserType } = useBuddy();
  const [phase, setPhase] = useState<Phase>("idle");
  const [idNumber, setIdNumber] = useState("");
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const label = userType === "foretag" ? "Organisationsnummer" : "Personnummer";
  const placeholder = userType === "foretag" ? "556677-8899" : "ÅÅÅÅMMDD-XXXX";

  const startSigning = () => {
    if (idNumber.trim().length < 6) return;
    setPhase("waiting");
    timeoutsRef.current.push(setTimeout(() => setPhase("success"), 2000));
    timeoutsRef.current.push(
      setTimeout(() => {
        setUserType(userType);
        router.push("/onboarding");
      }, 2900)
    );
  };

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full flex items-center justify-between px-6 py-5">
        <Logo />
        <div />
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md bd-fade">
          {phase === "idle" && (
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100"
            >
              <ArrowLeft size={15} /> Tillbaka
            </button>
          )}
          <div className="text-center mb-7">
            <span className="bd-eyebrow">Säker inloggning</span>
            <h1 className="bd-display text-3xl mt-3 mb-2">Logga in med Mobilt BankID</h1>
            <p className="text-sm text-slate">
              {userType === "foretag"
                ? "Logga in som firmatecknare för ditt företag."
                : "Vi verifierar det är du, sen är du inne."}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-line p-6">
            {phase === "idle" && (
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium">{label}</label>
                <input
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-line text-[15px]"
                />
                <button
                  onClick={startSigning}
                  disabled={idNumber.trim().length < 6}
                  className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50"
                >
                  <Smartphone size={17} /> Starta Mobilt BankID
                </button>
                <p className="text-xs text-center text-slate">
                  Simulerad inloggning i den här prototypen.
                </p>
              </div>
            )}
            {phase === "waiting" && (
              <div className="flex flex-col items-center py-4 gap-4 text-center">
                <div className="bd-pulse w-16 h-16 rounded-2xl flex items-center justify-center bg-forest">
                  <Smartphone size={26} color="white" />
                </div>
                <div>
                  <div className="font-semibold text-[15px] mb-1">Väntar på signering…</div>
                  <div className="text-sm text-slate">Öppna BankID-appen i din mobil</div>
                </div>
                <Loader2 size={18} className="bd-spin text-forest" />
              </div>
            )}
            {phase === "success" && (
              <div className="flex flex-col items-center py-6 gap-3 text-center bd-fade">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-forest">
                  <Check size={28} color="white" />
                </div>
                <div className="font-semibold text-[15px]">Identifierad!</div>
                <div className="text-sm text-slate">Tar dig vidare…</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

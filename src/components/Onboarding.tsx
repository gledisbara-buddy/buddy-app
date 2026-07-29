"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ProgressDots } from "@/components/ProgressDots";
import { useBuddy } from "@/lib/buddy-context";
import { INSURANCE_META, PRIORITY_OPTIONS, type InsuranceId } from "@/lib/insurance";

const STEPS = ["Dina försäkringar", "Vad är viktigast?", "Nästan klart"];

export function Onboarding() {
  const router = useRouter();
  const { userType, setOnboardData } = useBuddy();
  const [sub, setSub] = useState(0);
  const [selected, setSelected] = useState<InsuranceId[]>([]);
  const [priority, setPriority] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!userType) router.replace("/");
  }, [userType, router]);

  if (!userType) return null;

  const options = (Object.entries(INSURANCE_META) as [InsuranceId, (typeof INSURANCE_META)[InsuranceId]][])
    .filter(([id, meta]) => (userType === "foretag" ? meta.forCompany || id === "bil" : !meta.forCompany))
    .map(([id, meta]) => ({ id, ...meta }));

  const toggle = (id: InsuranceId) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const nextDisabled =
    (sub === 0 && selected.length === 0) ||
    (sub === 1 && !priority) ||
    (sub === 2 && name.trim().length < 2);

  const goNext = () => {
    if (sub < 2) {
      setSub(sub + 1);
      return;
    }
    setOnboardData({ selected, priority, name });
    router.push("/dashboard");
  };

  const goBack = () => {
    if (sub === 0) {
      router.push(`/login?type=${userType}`);
      return;
    }
    setSub(sub - 1);
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full flex items-center justify-between px-6 py-5">
        <Logo />
        <ProgressDots total={3} current={sub} />
        <div className="w-6" />
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md bd-fade" key={sub}>
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100"
          >
            <ArrowLeft size={15} /> Tillbaka
          </button>
          <span className="bd-eyebrow">{STEPS[sub]}</span>

          {sub === 0 && (
            <div className="mt-3">
              <h1 className="bd-display text-2xl mb-2">
                {userType === "foretag"
                  ? "Vilka försäkringar har ni idag?"
                  : "Vilka försäkringar har du idag?"}
              </h1>
              <p className="text-sm mb-6 text-slate">Välj alla som stämmer.</p>
              <div className="grid grid-cols-2 gap-3">
                {options.map((opt) => {
                  const Icon = opt.icon;
                  const active = selected.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggle(opt.id)}
                      className="bd-card p-4 rounded-2xl border text-left flex flex-col gap-3"
                      style={{
                        borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                        background: active ? "var(--color-frost-2)" : "white",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: active ? "var(--color-forest)" : "var(--color-frost)" }}
                      >
                        <Icon size={17} color={active ? "white" : "var(--color-forest)"} />
                      </div>
                      <div className="text-sm font-medium leading-tight">{opt.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sub === 1 && (
            <div className="mt-3">
              <h1 className="bd-display text-2xl mb-2">Vad är viktigast för dig just nu?</h1>
              <p className="text-sm mb-6 text-slate">Vi använder det för att sortera dina förslag.</p>
              <div className="flex flex-col gap-3">
                {PRIORITY_OPTIONS.map((opt) => {
                  const active = priority === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setPriority(opt.id)}
                      className="bd-card p-4 rounded-2xl border text-left flex items-center gap-3"
                      style={{
                        borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                        background: active ? "var(--color-frost-2)" : "white",
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-none"
                        style={{ borderColor: active ? "var(--color-forest)" : "var(--color-line)" }}
                      >
                        {active && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-forest)" }} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{opt.label}</div>
                        <div className="text-xs text-slate">{opt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sub === 2 && (
            <div className="mt-3">
              <h1 className="bd-display text-2xl mb-2">Vad ska vi kalla dig?</h1>
              <p className="text-sm mb-6 text-slate">
                {userType === "foretag" ? "Namn på kontaktperson." : "Bara förnamnet räcker."}
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="T.ex. Sam"
                className="w-full px-4 py-3 rounded-xl border border-line text-[15px] mb-4"
              />
              <div className="rounded-2xl border border-line p-4 flex items-start gap-3 bg-white">
                <Sparkles size={17} className="mt-0.5 flex-none text-amber-deep" />
                <p className="text-xs text-slate">
                  Buddy sätter ihop en första överblick baserat på dina svar.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={goNext}
            disabled={nextDisabled}
            className="bd-btn w-full mt-7 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
          >
            {sub < 2 ? "Fortsätt" : "Skapa min översikt"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

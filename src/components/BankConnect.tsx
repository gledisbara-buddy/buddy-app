"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { createItemId, type InsuranceItem } from "@/lib/items";
import { fetchBankSubscriptions, type SuggestedSubscription } from "@/lib/bank-fetch";
import { useBuddy } from "@/lib/buddy-context";

type Phase = "idle" | "waiting" | "fetching" | "result" | "done";

function toItem(s: SuggestedSubscription): InsuranceItem {
  if (s.kind === "tv_streaming") {
    return { id: createItemId(), kind: "telekom", typ: "tv_streaming", tjanst: s.tjanst, prisPerManad: s.prisPerManad, delatKonto: false };
  }
  return { id: createItemId(), kind: "prenumeration", namn: s.namn, leverantor: s.leverantor, prisPerManad: s.prisPerManad };
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full flex items-center justify-center px-6 py-5">
        <Logo />
      </div>
      <div className="flex-1 flex items-start justify-center px-5 pb-16">{children}</div>
    </div>
  );
}

export function BankConnect() {
  const router = useRouter();
  const { addItems } = useBuddy();
  const [phase, setPhase] = useState<Phase>("idle");
  const [found, setFound] = useState<SuggestedSubscription[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const finish = () => router.push("/dashboard?prenumerationer=1");

  const startConnect = () => {
    setPhase("waiting");
    setTimeout(() => {
      setPhase("fetching");
      fetchBankSubscriptions().then((data) => {
        setFound(data);
        setChecked(new Set(data.map((d) => d.id)));
        setPhase("result");
      });
    }, 1800);
  };

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSelected = async () => {
    const selected = found.filter((f) => checked.has(f.id));
    setSaving(true);
    await addItems(selected.map(toItem));
    setSaving(false);
    setPhase("done");
  };

  if (phase === "idle") {
    return (
      <Shell>
        <div className="w-full max-w-md text-center bd-fade self-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-forest mx-auto mb-5">
            <Building2 size={26} color="white" />
          </div>
          <h1 className="bd-display text-2xl mb-2">Anslut din bank</h1>
          <p className="text-sm mb-6 text-slate">
            Identifiera dig med BankID så läser vi av dina återkommande dragningar och föreslår vilka som ska läggas
            in som prenumerationer.
          </p>
          <button
            onClick={startConnect}
            className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest mb-3"
          >
            <Building2 size={17} /> Starta Mobilt BankID
          </button>
          <p className="text-xs mb-6 text-slate">Simulerad identifiering i den här prototypen.</p>
          <button onClick={() => router.push("/dashboard")} className="w-full text-sm font-semibold py-2 text-slate">
            Hoppa över, jag lägger in manuellt senare
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === "waiting") {
    return (
      <Shell>
        <div className="flex flex-col items-center py-8 gap-4 text-center self-center">
          <div className="bd-pulse w-16 h-16 rounded-2xl flex items-center justify-center bg-forest">
            <Building2 size={26} color="white" />
          </div>
          <div>
            <div className="font-semibold text-[15px] mb-1">Väntar på signering…</div>
            <div className="text-sm text-slate">Öppna BankID-appen i din mobil</div>
          </div>
          <Loader2 size={18} className="bd-spin text-forest" />
          <p className="text-xs text-slate">Simulerad identifiering i den här prototypen.</p>
        </div>
      </Shell>
    );
  }

  if (phase === "fetching") {
    return (
      <Shell>
        <div className="flex flex-col items-center py-8 gap-4 text-center self-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-forest">
            <Loader2 size={26} color="white" className="bd-spin" />
          </div>
          <div>
            <div className="font-semibold text-[15px] mb-1">Läser av transaktionsregistret…</div>
            <div className="text-sm text-slate">Söker igenom återkommande dragningar</div>
          </div>
          <p className="text-xs text-slate">Simulerad identifiering i den här prototypen.</p>
        </div>
      </Shell>
    );
  }

  if (phase === "result") {
    return (
      <Shell>
        <div className="w-full max-w-md bd-fade">
          <div className="flex items-center gap-2 mb-4 text-forest">
            <Check size={18} />
            <span className="text-sm font-semibold">Vi hittade {found.length} återkommande dragningar</span>
          </div>
          <p className="text-xs mb-4 text-slate">Demo — exempeldata, ingen riktig bankkoppling i den här prototypen.</p>
          <div className="flex flex-col gap-2 mb-6">
            {found.map((s) => {
              const active = checked.has(s.id);
              const namn = s.kind === "tv_streaming" ? s.tjanst : s.namn;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className="w-full text-left px-4 py-3.5 rounded-xl border flex items-center justify-between gap-3 bg-white"
                  style={{ borderColor: active ? "var(--color-forest)" : "var(--color-line)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-md border flex items-center justify-center flex-none"
                      style={{
                        borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                        background: active ? "var(--color-forest)" : "white",
                      }}
                    >
                      {active && <Check size={13} color="white" />}
                    </div>
                    <span className="text-sm font-medium">{namn}</span>
                  </div>
                  <span className="text-sm font-semibold text-forest">{s.prisPerManad} kr/mån</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={addSelected}
            disabled={checked.size === 0 || saving}
            className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50 mb-3"
          >
            {saving ? <Loader2 size={16} className="bd-spin" /> : <>Lägg till {checked.size} markerade <ArrowRight size={16} /></>}
          </button>
          <button onClick={finish} className="w-full text-sm font-semibold py-2 text-slate">
            Hoppa över
          </button>
        </div>
      </Shell>
    );
  }

  // phase === "done"
  return (
    <Shell>
      <div className="w-full max-w-md text-center bd-fade self-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-forest mx-auto mb-5">
          <Check size={26} color="white" />
        </div>
        <h1 className="bd-display text-2xl mb-2">Klart!</h1>
        <p className="text-sm mb-6 text-slate">Dina prenumerationer är inlagda under Prenumerationer.</p>
        <button
          onClick={finish}
          className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
        >
          Till dashboarden <ArrowRight size={16} />
        </button>
      </div>
    </Shell>
  );
}

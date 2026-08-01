"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2, ShieldCheck, Smartphone, Star } from "lucide-react";
import { inputClass } from "@/components/onboarding/shared";
import type { ComparableItem } from "@/lib/items";
import { itemSummary, itemTitle } from "@/lib/items";
import { fetchExistingPolicy, type FetchableKind } from "@/lib/policy-fetch";
import type { Quote } from "@/lib/quote";
import { TOP_LIST } from "@/lib/top-list";

type Phase = "bolag" | "bankid-idle" | "bankid-waiting" | "fetching" | "result";

export function AutoFetchStep({
  kind,
  onDone,
  onBack,
}: {
  kind: FetchableKind;
  onDone: (item: ComparableItem, quote: Quote) => void;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("bolag");
  const [bolag, setBolag] = useState<string | null>(null);
  const [personnummer, setPersonnummer] = useState("");
  const [result, setResult] = useState<{ item: ComparableItem; quote: Quote } | null>(null);

  const startBankId = () => {
    if (personnummer.trim().length < 6) return;
    setPhase("bankid-waiting");
    setTimeout(() => {
      setPhase("fetching");
      fetchExistingPolicy(kind, bolag!).then((data) => {
        setResult(data);
        setPhase("result");
      });
    }, 1800);
  };

  if (phase === "bolag") {
    return (
      <>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Tillbaka
        </button>
        <p className="text-sm mb-4 text-slate">Vilket bolag har du den här hos idag?</p>
        <div className="flex flex-col gap-3">
          {TOP_LIST.map((b) => (
            <button
              key={b.name}
              onClick={() => {
                setBolag(b.name);
                setPhase("bankid-idle");
              }}
              className="bd-card p-4 rounded-2xl border border-line bg-white text-left flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                <ShieldCheck size={17} className="text-forest" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="font-semibold text-sm">{b.name}</div>
                  <div className="flex items-center gap-1 text-xs text-amber-deep">
                    <Star size={11} fill="currentColor" /> {b.rating}
                  </div>
                </div>
                <div className="text-xs text-slate">{b.tagline}</div>
              </div>
            </button>
          ))}
        </div>
      </>
    );
  }

  if (phase === "bankid-idle") {
    return (
      <>
        <button onClick={() => setPhase("bolag")} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Annat bolag
        </button>
        <p className="text-sm mb-4 text-slate">
          Identifiera dig med BankID så hämtar vi din information från {bolag}.
        </p>
        <label className="text-sm font-medium mb-2 block">Personnummer</label>
        <input
          value={personnummer}
          onChange={(e) => setPersonnummer(e.target.value)}
          placeholder="ÅÅÅÅMMDD-XXXX"
          className={`${inputClass} mb-4`}
        />
        <button
          onClick={startBankId}
          disabled={personnummer.trim().length < 6}
          className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50"
        >
          <Smartphone size={17} /> Starta Mobilt BankID
        </button>
        <p className="text-xs text-center mt-3 text-slate">Simulerad identifiering i den här prototypen.</p>
      </>
    );
  }

  if (phase === "bankid-waiting") {
    return (
      <div className="flex flex-col items-center py-8 gap-4 text-center">
        <div className="bd-pulse w-16 h-16 rounded-2xl flex items-center justify-center bg-forest">
          <Smartphone size={26} color="white" />
        </div>
        <div>
          <div className="font-semibold text-[15px] mb-1">Väntar på signering…</div>
          <div className="text-sm text-slate">Öppna BankID-appen i din mobil</div>
        </div>
        <Loader2 size={18} className="bd-spin text-forest" />
      </div>
    );
  }

  if (phase === "fetching") {
    return (
      <div className="flex flex-col items-center py-8 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-forest">
          <Loader2 size={26} color="white" className="bd-spin" />
        </div>
        <div>
          <div className="font-semibold text-[15px] mb-1">Hämtar din information…</div>
          <div className="text-sm text-slate">Ansluter till {bolag}</div>
        </div>
      </div>
    );
  }

  // phase === "result"
  if (!result) return null;
  const { item, quote } = result;
  return (
    <div className="bd-fade">
      <div className="flex items-center gap-2 mb-4 text-forest">
        <Check size={18} />
        <span className="text-sm font-semibold">Vi hittade din försäkring</span>
      </div>
      <div className="bg-white rounded-2xl border border-line p-5 mb-6">
        <div className="font-semibold text-[15px] mb-1">{itemTitle(item)}</div>
        <div className="text-xs mb-4 text-slate">{itemSummary(item)}</div>
        <div className="flex items-center justify-between pt-4 border-t border-line">
          <div>
            <div className="font-semibold text-sm">{quote.name}</div>
            <div className="text-xs text-slate">Självrisk {quote.selfRisk.toLocaleString("sv-SE")} kr</div>
          </div>
          <div className="text-right">
            <div className="bd-display text-xl text-forest">{quote.price} kr</div>
            <div className="text-xs text-slate">per månad</div>
          </div>
        </div>
      </div>
      <button
        onClick={() => onDone(item, quote)}
        className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
      >
        Lägg till <Check size={16} />
      </button>
    </div>
  );
}

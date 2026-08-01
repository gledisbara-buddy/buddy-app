"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2, Smartphone } from "lucide-react";
import { inputClass } from "@/components/onboarding/shared";
import type { ComparableItem } from "@/lib/items";
import { FORSAKRINGSBOLAG, itemSummary, itemTitle } from "@/lib/items";
import { fetchExistingPolicy, type FetchableKind } from "@/lib/policy-fetch";
import type { Quote } from "@/lib/quote";

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
        <div className="bd-scroll flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
          {FORSAKRINGSBOLAG.map((b) => (
            <button
              key={b}
              onClick={() => {
                setBolag(b);
                setPhase("bankid-idle");
              }}
              className="bd-card w-full text-left px-4 py-3 rounded-xl border border-line bg-white text-sm font-medium"
            >
              {b}
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
        <div className="pt-4 border-t border-line">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-sm">{quote.name}</div>
              {quote.omfattning && <div className="text-xs text-slate">{quote.omfattning}</div>}
            </div>
            <div className="text-right">
              <div className="bd-display text-xl text-forest">{quote.price} kr</div>
              <div className="text-xs text-slate">per månad</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate">
            <span>Självrisk {quote.selfRisk.toLocaleString("sv-SE")} kr</span>
            {quote.forfallodatum && <span>Förfaller {quote.forfallodatum}</span>}
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

"use client";

import { useState } from "react";
import { ArrowLeft, Check, ListChecks, Loader2, Sparkles } from "lucide-react";
import { BilNeedsForm } from "@/components/BilNeedsForm";
import { GenericNeedsForm } from "@/components/GenericNeedsForm";
import type { BilItem, ComparableItem } from "@/lib/items";
import { getAvailableNeedIds, matchNeedsFromFreeText, NEED_LABELS, type NeedsKind } from "@/lib/needs";
import type { Quote } from "@/lib/quote";

type Phase = "choice" | "freetext" | "freetext-loading" | "questions" | "confirm";

export function NeedsAnalysis({
  kind,
  item,
  currentPolicy,
  onDone,
  onItemUpdate,
  onBack,
  initialConfirmed,
}: {
  kind: NeedsKind;
  item: ComparableItem;
  // Bara relevant för kind "bil" — styr "matcha nuvarande avtal"-genvägen i
  // BilNeedsForm.tsx.
  currentPolicy?: Quote;
  onDone: (needs: string[]) => void;
  // Bara satt/använd för kind "bil" — BilNeedsForm samlar in fält som hör
  // till saken själv (t.ex. önskad omfattning/självrisk), inte bara
  // behovs-id:n, och de sparas via samma updateItem som redigering av
  // saken redan använder.
  onItemUpdate?: (item: ComparableItem) => void;
  onBack: () => void;
  // Tidigare sparade (och redan omvaliderade) behov för den här saken — om
  // satt hoppar guiden direkt till bekräfta-skärmen förifylld, istället för
  // att tvinga en omgång genom hela frågebatteriet igen.
  initialConfirmed?: string[];
}) {
  // Bil hoppar aldrig direkt till bekräfta-chipsen — BilNeedsForm.tsx har
  // sin egen förifyllning direkt från saken (item), inte från en
  // needs-id-lista, så genvägen nedan gäller bara övriga produkter.
  const [phase, setPhase] = useState<Phase>(
    kind !== "bil" && initialConfirmed && initialConfirmed.length > 0 ? "confirm" : "choice"
  );
  const [freeText, setFreeText] = useState("");
  const [confirmed, setConfirmed] = useState<string[]>(initialConfirmed ?? []);

  const availableIds = getAvailableNeedIds(kind, item);
  const labels = NEED_LABELS[kind];

  const submitFreeText = () => {
    if (!freeText.trim()) return;
    setPhase("freetext-loading");
    setTimeout(() => {
      const matched = matchNeedsFromFreeText(kind, freeText).filter((id) => availableIds.includes(id));
      setConfirmed(matched);
      setPhase("confirm");
    }, 900);
  };

  const toggleConfirmed = (id: string) =>
    setConfirmed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const restart = () => {
    setFreeText("");
    setPhase("choice");
  };

  if (phase === "choice") {
    return (
      <>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Tillbaka
        </button>
        <span className="bd-eyebrow">Behovsanalys</span>
        <h1 className="bd-display text-2xl md:text-3xl mt-3 mb-2">Vad är viktigt för dig?</h1>
        <p className="text-sm mb-6 text-slate">
          Svara på några frågor eller berätta med egna ord — det hjälper oss ge dig en mer rättvisande jämförelse.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setPhase("freetext")}
            className="bd-card p-5 rounded-2xl border border-line bg-white text-left flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-frost-2">
              <Sparkles size={18} className="text-forest" />
            </div>
            <div>
              <div className="font-semibold text-[15px] mb-1">Skriv med egna ord</div>
              <div className="text-xs text-slate">Berätta fritt vad du vill skydda — vi tolkar behovet åt dig.</div>
            </div>
          </button>
          <button
            onClick={() => setPhase("questions")}
            className="bd-card p-5 rounded-2xl border border-line bg-white text-left flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-frost-2">
              <ListChecks size={18} className="text-forest" />
            </div>
            <div>
              <div className="font-semibold text-[15px] mb-1">Svara på några frågor</div>
              <div className="text-xs text-slate">Några korta frågor om det som är viktigast.</div>
            </div>
          </button>
        </div>
      </>
    );
  }

  if (phase === "freetext" || phase === "freetext-loading") {
    return (
      <>
        <button
          onClick={() => setPhase("choice")}
          className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100"
        >
          <ArrowLeft size={15} /> Tillbaka
        </button>
        <span className="bd-eyebrow">Behovsanalys</span>
        <h1 className="bd-display text-2xl md:text-3xl mt-3 mb-2">Berätta med egna ord</h1>
        <p className="text-sm mb-4 text-slate">
          T.ex: Jag reser mycket utomlands och har dyr golfutrustning hemma.
        </p>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          disabled={phase === "freetext-loading"}
          rows={5}
          placeholder="Skriv fritt här…"
          className="w-full px-4 py-3 rounded-xl border border-line text-[15px] mb-4"
        />
        <button
          onClick={submitFreeText}
          disabled={!freeText.trim() || phase === "freetext-loading"}
          className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50"
        >
          {phase === "freetext-loading" ? (
            <>
              <Loader2 size={16} className="bd-spin" /> Tolkar ditt behov…
            </>
          ) : (
            "Analysera mitt behov"
          )}
        </button>
      </>
    );
  }

  if (phase === "questions") {
    if (kind === "bil") {
      return (
        <BilNeedsForm
          item={item as BilItem}
          currentPolicy={currentPolicy}
          onBack={() => setPhase("choice")}
          onDone={(updatedItem, needs) => {
            onItemUpdate?.(updatedItem);
            onDone(needs);
          }}
        />
      );
    }
    return (
      <GenericNeedsForm
        kind={kind}
        item={item}
        initialNeeds={confirmed}
        onBack={() => setPhase("choice")}
        onDone={(needs) => {
          setConfirmed(needs);
          setPhase("confirm");
        }}
      />
    );
  }

  // phase === "confirm" — bara för fritext-vägen (frågeguiden för Bil
  // avslutas direkt via onDone ovan; övriga produkters frågeformulär går
  // också hit via samma setPhase("confirm") ovan, som förut).
  return (
    <>
      <button onClick={restart} className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100">
        <ArrowLeft size={15} /> Börja om
      </button>
      <span className="bd-eyebrow">Behovsanalys</span>
      <h1 className="bd-display text-2xl md:text-3xl mt-3 mb-2">Det här har vi uppfattat</h1>
      <p className="text-sm mb-6 text-slate">Stämmer inte allt? Lägg till eller ta bort innan du går vidare.</p>
      {availableIds.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-7">
          {availableIds.map((id) => {
            const active = confirmed.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleConfirmed(id)}
                className="bd-card p-4 rounded-2xl border text-left flex items-center gap-2"
                style={{
                  borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                  background: active ? "var(--color-frost-2)" : "white",
                }}
              >
                {active && <Check size={15} className="text-forest flex-none" />}
                <span className="text-sm font-medium leading-tight">{labels[id]}</span>
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => onDone(confirmed)}
        className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
      >
        Visa min jämförelse
      </button>
    </>
  );
}

"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HelperTip } from "@/components/HelperTip";
import { BoolPill, Field, MultiPillGroup, PillGroup } from "@/components/onboarding/shared";
import { getNeedQuestions, type NeedsKind } from "@/lib/needs";
import type { ComparableItem } from "@/lib/items";

// Samma frågeinnehåll som tidigare (needs.ts, oförändrat), men som EN
// scrollbar sektion istället för en fråga-i-taget-guide — samma visuella
// mönster som BilNeedsForm.tsx, så behovsanalysen känns likadan oavsett
// produkt. Fråge-/svarslogiken (dependsOn, matchade behovs-id:n) är
// densamma som den gamla NeedsAnalysis-stegvyn hade.
export function GenericNeedsForm({
  kind,
  item,
  initialNeeds,
  onDone,
  onBack,
}: {
  kind: NeedsKind;
  item: ComparableItem;
  initialNeeds: string[];
  onDone: (needs: string[]) => void;
  onBack: () => void;
}) {
  const questions = getNeedQuestions(kind, item);

  const [yesno, setYesno] = useState<Record<string, boolean | null>>(() => {
    const init: Record<string, boolean | null> = {};
    for (const q of questions) if (q.type === "yesno") init[q.id] = initialNeeds.includes(q.id) ? true : null;
    return init;
  });
  const [choice, setChoice] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    for (const q of questions)
      if (q.type === "choice") init[q.id] = q.options.find((o) => initialNeeds.includes(o.id))?.id ?? null;
    return init;
  });
  const [multi, setMulti] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const q of questions)
      if (q.type === "multi") init[q.id] = q.options.filter((o) => initialNeeds.includes(o.id)).map((o) => o.id);
    return init;
  });

  // Vilka behovs-id:n som är "aktiva" just nu — styr dependsOn-frågornas
  // synlighet, samma effekt som addedIds hade i den gamla stegvyn.
  const activeIds = new Set<string>();
  for (const q of questions) {
    if (q.type === "yesno" && yesno[q.id]) activeIds.add(q.id);
    if (q.type === "choice" && choice[q.id]) activeIds.add(choice[q.id]!);
    if (q.type === "multi") for (const id of multi[q.id] ?? []) activeIds.add(id);
  }
  const visibleQuestions = questions.filter((q) => !q.dependsOn || activeIds.has(q.dependsOn.needId));

  const submit = () => {
    const needs: string[] = [];
    for (const q of visibleQuestions) {
      if (q.type === "yesno" && yesno[q.id]) needs.push(q.id);
      if (q.type === "choice" && choice[q.id]) needs.push(choice[q.id]!);
      if (q.type === "multi") needs.push(...(multi[q.id] ?? []));
    }
    onDone(needs);
  };

  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100">
        <ArrowLeft size={15} /> Tillbaka
      </button>
      <span className="bd-eyebrow">Behovsanalys</span>
      <h1 className="bd-display text-2xl mt-3 mb-2">Vad är viktigt för dig?</h1>
      <HelperTip dismissible={false} emotion="nyfiken" className="mb-6">
        Svara på det som stämmer för dig — resten kan du hoppa över. Det hjälper oss ge dig en mer rättvisande
        jämförelse.
      </HelperTip>
      {visibleQuestions.map((q) => (
        <Field key={q.id} label={q.prompt}>
          {q.type === "yesno" ? (
            <BoolPill value={yesno[q.id] ?? null} onChange={(v) => setYesno((p) => ({ ...p, [q.id]: v }))} />
          ) : q.type === "choice" ? (
            <PillGroup
              options={q.options.map((o) => o.id)}
              labels={Object.fromEntries(q.options.map((o) => [o.id, o.label]))}
              value={choice[q.id] ?? null}
              onChange={(v) => setChoice((p) => ({ ...p, [q.id]: v }))}
            />
          ) : (
            <MultiPillGroup
              options={q.options.map((o) => o.id)}
              labels={Object.fromEntries(q.options.map((o) => [o.id, o.label]))}
              value={multi[q.id] ?? []}
              onChange={(v) => setMulti((p) => ({ ...p, [q.id]: v }))}
            />
          )}
        </Field>
      ))}
      <button
        onClick={submit}
        className="bd-btn w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
      >
        Visa min jämförelse <ArrowRight size={16} />
      </button>
    </>
  );
}

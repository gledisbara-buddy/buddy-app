"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { HelperTip } from "@/components/HelperTip";
import { BoolPill, MultiPillGroup, PillGroup, inputClass } from "@/components/onboarding/shared";
import type { QuestionStep } from "@/lib/question-flow";

function defaultSummaryValue(step: QuestionStep, value: unknown): string {
  if (step.summaryValue) return step.summaryValue(value);
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ja" : "Nej";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    const labels = step.options ? Object.fromEntries(step.options.map((o) => [o.value, o.label])) : {};
    return value.map((v) => labels[v as string] ?? String(v)).join(", ");
  }
  if (step.options) {
    const opt = step.options.find((o) => o.value === value);
    if (opt) return opt.label;
  }
  return String(value);
}

// En fråga i taget + en sammanfattning som fylls på vid sidan (skrivbord)
// eller i en hopfällbar remsa (mobil), och som växer till en stor
// genomgång när sista frågan är besvarad. Delad motor för
// BilNeedsForm.tsx och GenericNeedsForm.tsx.
export function QuestionFlow({
  eyebrow,
  title,
  intro,
  steps,
  initialAnswers,
  submitLabel = "Godkänn och gå vidare",
  onDone,
  onBack,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  steps: QuestionStep[];
  initialAnswers?: Record<string, unknown>;
  submitLabel?: string;
  onDone: (answers: Record<string, unknown>) => void;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers ?? {});
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<string>(""); // text/number-utkast för aktuell fråga
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleSteps = steps.filter((s) => !s.show || s.show(answers));
  const currentIndex = answeredIds.length;
  const currentStep = visibleSteps[currentIndex];
  const done = !currentStep;

  // Byter aktuell fråga → nollställ textutkastet. Justerat under rendering
  // (samma mönster som NeedsAnalysis.tsx:s seenIndex), inte i en effekt.
  const [seenId, setSeenId] = useState(currentStep?.id);
  if (currentStep?.id !== seenId) {
    setSeenId(currentStep?.id);
    setDraft(currentStep && typeof answers[currentStep.id] === "string" ? (answers[currentStep.id] as string) : "");
  }

  if (done && !expanded) setExpanded(true);

  const advance = (id: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setAnsweredIds((prev) => [...prev, id]);
  };

  const skip = () => {
    if (!currentStep) return;
    // Rensar ett ev. förifyllt värde — annars kan "hoppa över" tyst
    // behålla ett gammalt svar användaren aldrig faktiskt bekräftade.
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentStep.id];
      return next;
    });
    setAnsweredIds((prev) => [...prev, currentStep.id]);
  };

  const goBack = () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (answeredIds.length === 0) {
      onBack();
      return;
    }
    setAnsweredIds((prev) => prev.slice(0, -1));
  };

  const answeredEntries = answeredIds
    .map((id) => steps.find((s) => s.id === id))
    .filter((s): s is QuestionStep => !!s)
    .map((s) => ({ step: s, text: defaultSummaryValue(s, answers[s.id]) }))
    .filter((e) => e.text !== "—");

  const summaryHeader = (
    <div className="flex items-center justify-between mb-3 flex-none">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate">Din sammanfattning</span>
      <span className="text-xs text-slate">
        {answeredIds.length} av {visibleSteps.length}
      </span>
    </div>
  );

  const summaryList = (
    <div className="flex flex-col gap-2.5 overflow-y-auto bd-scroll flex-1">
      {answeredEntries.length === 0 ? (
        <p className="text-xs text-slate">Dina svar dyker upp här allt eftersom.</p>
      ) : (
        answeredEntries.map(({ step, text }) => (
          <div key={step.id} className="text-xs">
            <div className="text-slate">{step.summaryLabel ?? step.prompt}</div>
            <div className="font-medium text-ink">{text}</div>
          </div>
        ))
      )}
    </div>
  );

  const summaryFooter = (
    <button
      onClick={() => onDone(answers)}
      className="bd-btn w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest flex-none"
    >
      {submitLabel} <Check size={16} />
    </button>
  );

  return (
    <div className="relative w-full max-w-4xl mx-auto md:flex md:items-start md:gap-8">
      {/* Fråga, i samma centrerade kolumn som resten av flödet. */}
      <div className="flex-1 min-w-0 pb-24 md:pb-0">
        {!done && currentStep && (
          <>
            <button onClick={goBack} className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100">
              <ArrowLeft size={15} /> Tillbaka
            </button>
            <span className="bd-eyebrow">{eyebrow}</span>
            <h1 className="bd-display text-2xl mt-3 mb-1">{title}</h1>
            {intro && <p className="text-sm mb-2 text-slate">{intro}</p>}
            <p className="text-xs mb-5 text-slate">
              Fråga {currentIndex + 1} av {visibleSteps.length}
            </p>

            <div className="bg-white rounded-2xl border border-line p-5 mb-4 bd-fade" key={currentStep.id}>
              <div className="font-semibold text-[15px] mb-4">{currentStep.prompt}</div>

              {currentStep.type === "bool" && (
                <BoolPill
                  value={typeof answers[currentStep.id] === "boolean" ? (answers[currentStep.id] as boolean) : null}
                  onChange={(v) => advance(currentStep.id, v)}
                />
              )}
              {currentStep.type === "pill" && currentStep.options && (
                <PillGroup
                  options={currentStep.options.map((o) => o.value)}
                  labels={Object.fromEntries(currentStep.options.map((o) => [o.value, o.label]))}
                  value={(answers[currentStep.id] as string) ?? null}
                  onChange={(v) => advance(currentStep.id, v)}
                />
              )}
              {currentStep.type === "multipill" && currentStep.options && (
                <>
                  <MultiPillGroup
                    options={currentStep.options.map((o) => o.value)}
                    labels={Object.fromEntries(currentStep.options.map((o) => [o.value, o.label]))}
                    value={(answers[currentStep.id] as string[]) ?? []}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [currentStep.id]: v }))}
                  />
                  <button
                    onClick={() => advance(currentStep.id, answers[currentStep.id] ?? [])}
                    className="bd-btn w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-white text-sm bg-forest"
                  >
                    Nästa <ArrowRight size={15} />
                  </button>
                </>
              )}
              {(currentStep.type === "number" || currentStep.type === "text") && (
                <>
                  <input
                    type={currentStep.type === "number" ? "number" : "text"}
                    className={inputClass}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={currentStep.placeholder}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && draft.trim()) advance(currentStep.id, draft.trim());
                    }}
                  />
                  <button
                    onClick={() => advance(currentStep.id, draft.trim())}
                    disabled={!draft.trim()}
                    className="bd-btn w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-white text-sm bg-forest disabled:opacity-40"
                  >
                    Nästa <ArrowRight size={15} />
                  </button>
                </>
              )}

              {!currentStep.required && (
                <button onClick={skip} className="text-xs mt-3 text-slate hover:text-ink">
                  Hoppa över — vet inte
                </button>
              )}
            </div>

            <HelperTip dismissible={false} emotion="nyfiken" size={40}>
              {currentStep.tip}
            </HelperTip>
          </>
        )}
      </div>

      {/* Mobil: hopfällbar remsa längst ner (bara i den lilla, ej expanderade, vyn).
          Porterad av samma skäl som ovan — annars fästs den mot botten av en
          skrumpen förälder istället för mot faktiska skärmkanten. */}
      {!expanded &&
        createPortal(
          <div
            className="md:hidden fixed z-30 inset-x-3 bottom-3 rounded-2xl bg-white border border-line shadow-lg p-4 flex flex-col transition-all duration-300 ease-out motion-reduce:transition-none"
            style={{ maxHeight: mobileOpen ? "50vh" : 84 }}
          >
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex items-center justify-between text-left flex-none"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-slate">Din sammanfattning</span>
              <span className="text-xs text-forest font-semibold">
                {answeredIds.length} av {visibleSteps.length}
              </span>
            </button>
            <div className={mobileOpen ? "flex flex-col flex-1 min-h-0 mt-3" : "hidden"}>{summaryList}</div>
          </div>,
          document.body,
        )}

      {/* Skrivbord: en panel i samma flöde som frågan (sticky, inte fast mot
          hela viewporten) — håller den ihop med den centrerade kolumnen
          istället för att flyta löst mot skärmkanten på breda skärmar. */}
      {!expanded && (
        <div className="hidden md:flex md:flex-col md:w-72 md:flex-none md:sticky md:top-24 md:max-h-[65vh] rounded-2xl bg-white border border-line shadow-sm p-4">
          {summaryHeader}
          {summaryList}
        </div>
      )}

      {/* Stor genomgång i slutet — samma modal-liknande yta för både mobil
          och skrivbord, en enda cross-fade istället för att försöka
          animera en och samma ruta mellan två väldigt olika lägen.
          Porterad till document.body: en förälder högre upp (CompareFlow.tsx,
          bd-fade) har en animation med "transform", vilket enligt CSS-spec
          gör den till "fixed"-barnens positioneringskontext istället för
          viewporten — utan portal blir scrimmen och rutan här ihopklämda
          till nästan ingen höjd. */}
      {expanded &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-20 bd-scrim"
              style={{ background: "var(--color-scrim)" }}
              onClick={() => setExpanded(false)}
            />
            <div className="fixed z-40 inset-x-3 bottom-3 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl md:top-16 md:bottom-8 rounded-3xl bg-white border border-line shadow-lg p-6 flex flex-col bd-fade motion-reduce:animate-none">
              {summaryHeader}
              {summaryList}
              {summaryFooter}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

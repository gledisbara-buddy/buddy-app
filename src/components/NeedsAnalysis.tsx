"use client";

import { useState } from "react";
import { ArrowLeft, Check, ListChecks, Loader2, Sparkles } from "lucide-react";
import { BoolPill, MultiPillGroup } from "@/components/onboarding/shared";
import type { ComparableItem } from "@/lib/items";
import {
  getAvailableNeedIds,
  getNeedQuestions,
  matchNeedsFromFreeText,
  NEED_LABELS,
  type NeedQuestion,
  type NeedsKind,
} from "@/lib/needs";

type Phase = "choice" | "freetext" | "freetext-loading" | "questions" | "confirm";

type HistoryEntry = { question: NeedQuestion; addedIds: string[]; answerLabel: string };

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-2 bd-fade mb-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-none bg-forest">
        <span className="text-white text-[11px] font-semibold bd-display">B</span>
      </div>
      <div
        className="max-w-[85%] px-4 py-3 text-[14.5px] leading-relaxed bg-white border border-line"
        style={{ borderRadius: 16, borderBottomLeftRadius: 4 }}
      >
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end justify-end gap-2 bd-fade mb-4">
      <div
        className="max-w-[85%] px-4 py-3 text-[14.5px] leading-relaxed text-white bg-forest"
        style={{ borderRadius: 16, borderBottomRightRadius: 4 }}
      >
        {children}
      </div>
    </div>
  );
}

export function NeedsAnalysis({
  kind,
  item,
  onDone,
  onBack,
}: {
  kind: NeedsKind;
  item: ComparableItem;
  onDone: (needs: string[]) => void;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("choice");
  const [freeText, setFreeText] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [confirmed, setConfirmed] = useState<string[]>([]);

  const questions = getNeedQuestions(kind, item);
  const availableIds = getAvailableNeedIds(kind, item);
  const labels = NEED_LABELS[kind];
  const currentIndex = history.length;
  const currentQuestion: NeedQuestion | undefined = questions[currentIndex];

  const [multiDraft, setMultiDraft] = useState<string[]>([]);
  const [seenIndex, setSeenIndex] = useState(currentIndex);
  if (currentIndex !== seenIndex) {
    setSeenIndex(currentIndex);
    setMultiDraft([]);
  }

  const finishQuestions = (finalHistory: HistoryEntry[]) => {
    setConfirmed(finalHistory.flatMap((h) => h.addedIds));
    setPhase("confirm");
  };

  const answerYesNo = (yes: boolean) => {
    if (!currentQuestion || currentQuestion.type !== "yesno") return;
    const entry: HistoryEntry = {
      question: currentQuestion,
      addedIds: yes ? [currentQuestion.id] : [],
      answerLabel: yes ? "Ja" : "Nej",
    };
    const next = [...history, entry];
    setHistory(next);
    if (next.length >= questions.length) finishQuestions(next);
  };

  const answerMulti = () => {
    if (!currentQuestion || currentQuestion.type !== "multi") return;
    const selectedLabels = currentQuestion.options.filter((o) => multiDraft.includes(o.id)).map((o) => o.label);
    const entry: HistoryEntry = {
      question: currentQuestion,
      addedIds: multiDraft,
      answerLabel: selectedLabels.length > 0 ? selectedLabels.join(", ") : "Inget av detta",
    };
    const next = [...history, entry];
    setHistory(next);
    if (next.length >= questions.length) finishQuestions(next);
  };

  const goBackQuestion = () => {
    if (history.length === 0) setPhase("choice");
    else setHistory((h) => h.slice(0, -1));
  };

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
    setHistory([]);
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
              <div className="text-xs text-slate">{questions.length} korta frågor, en i taget.</div>
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
    if (!currentQuestion) return null;
    return (
      <>
        <div className="flex items-center justify-between mb-5">
          <button onClick={goBackQuestion} className="flex items-center gap-1.5 text-sm opacity-60 hover:opacity-100">
            <ArrowLeft size={15} /> Tillbaka
          </button>
          <span className="text-xs text-slate">
            Fråga {currentIndex + 1} av {questions.length}
          </span>
        </div>
        <div className="bd-scroll max-h-[55vh] overflow-y-auto pr-1 mb-4">
          {history.map((h, i) => (
            <div key={i}>
              <AssistantBubble>{h.question.prompt}</AssistantBubble>
              <UserBubble>{h.answerLabel}</UserBubble>
            </div>
          ))}
          <AssistantBubble>{currentQuestion.prompt}</AssistantBubble>
        </div>
        {currentQuestion.type === "yesno" ? (
          <BoolPill value={null} onChange={answerYesNo} />
        ) : (
          <>
            <MultiPillGroup
              options={currentQuestion.options.map((o) => o.id)}
              labels={Object.fromEntries(currentQuestion.options.map((o) => [o.id, o.label]))}
              value={multiDraft}
              onChange={setMultiDraft}
            />
            <button
              onClick={answerMulti}
              className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
            >
              Nästa
            </button>
          </>
        )}
      </>
    );
  }

  // phase === "confirm"
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

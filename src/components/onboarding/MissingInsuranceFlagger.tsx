"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { ITEM_CATEGORIES } from "@/lib/items";
import type { FetchableKind } from "@/lib/policy-fetch";
import { useBuddy } from "@/lib/buddy-context";

const FLAGGABLE_KINDS: FetchableKind[] = ["boende", "bil", "ovrigt_fordon", "person", "djur"];

// Delad mellan BankIdImport.tsx (första importen) och BankIdRescan.tsx
// (identifiera dig igen senare) — samma "hittades inget, skicka till en
// handläggare"-flöde i båda, bara olika text ovanför.
export function MissingInsuranceFlagger({
  title,
  intro,
  onDone,
  doneLabel = "Klar",
}: {
  title: string;
  intro: string;
  onDone: () => void;
  doneLabel?: string;
}) {
  const { submitMissingInsuranceRequest } = useBuddy();
  const [flaggedKind, setFlaggedKind] = useState<FetchableKind | null>(null);
  const [flaggedNote, setFlaggedNote] = useState("");
  const [flagged, setFlagged] = useState<FetchableKind[]>([]);

  const submitFlag = () => {
    if (!flaggedKind) return;
    submitMissingInsuranceRequest(flaggedKind, flaggedNote.trim());
    setFlagged((prev) => [...prev, flaggedKind]);
    setFlaggedKind(null);
    setFlaggedNote("");
  };

  return (
    <>
      <h1 className="bd-display text-2xl mt-3 mb-2">{title}</h1>
      <p className="text-sm mb-6 text-slate">{intro}</p>

      {flagged.length > 0 && (
        <div className="flex flex-col gap-2 mb-5">
          {flagged.map((k, i) => (
            <div key={`${k}-${i}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-frost-2 text-sm">
              <Check size={14} className="text-forest" />
              {ITEM_CATEGORIES.find((c) => c.kind === k)!.label} — skickad till Buddy
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-line p-5 mb-6">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {FLAGGABLE_KINDS.map((k) => {
            const cat = ITEM_CATEGORIES.find((c) => c.kind === k)!;
            const active = flaggedKind === k;
            return (
              <button
                key={k}
                onClick={() => setFlaggedKind(k)}
                className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left ${
                  active ? "border-forest bg-frost-2 text-forest" : "border-line bg-white"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
        <input
          value={flaggedNote}
          onChange={(e) => setFlaggedNote(e.target.value)}
          placeholder="T.ex. bolag, om du vet det (valfritt)"
          className="w-full px-4 py-3 rounded-xl border border-line text-[15px] mb-4"
        />
        <button
          onClick={submitFlag}
          disabled={!flaggedKind}
          className="w-full py-2.5 rounded-full font-semibold text-sm border border-forest text-forest disabled:opacity-40"
        >
          Lägg till i listan
        </button>
      </div>

      <button
        onClick={onDone}
        className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
      >
        {flagged.length > 0 ? "Klar, fortsätt" : doneLabel} <ArrowRight size={16} />
      </button>
    </>
  );
}

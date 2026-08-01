"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BoolPill, Field, FormActions, inputClass, PillGroup, PillGroupWithOther } from "@/components/onboarding/shared";
import { createItemId, KREDITKORT_UTGIVARE, ONSKAD_KREDITKORT_LABELS } from "@/lib/items";
import type { InsuranceItem, OnskadKreditkortPrioritet } from "@/lib/items";

export function KreditkortForm({
  onSave,
  onCancel,
}: {
  onSave: (item: InsuranceItem) => void;
  onCancel: () => void;
}) {
  const [harReddan, setHarReddan] = useState<boolean | null>(null);

  // harReddan = true
  const [utgivare, setUtgivare] = useState("");
  const [kortnamn, setKortnamn] = useState("");
  const [arsavgift, setArsavgift] = useState("");
  const [ranta, setRanta] = useState("");
  const [kreditgrans, setKreditgrans] = useState("");
  const [bonusprogram, setBonusprogram] = useState<boolean | null>(null);

  // harReddan = false
  const [onskadPrioritet, setOnskadPrioritet] = useState<OnskadKreditkortPrioritet | null>(null);

  if (harReddan === null) {
    return (
      <>
        <Field label="Har du redan ett kort du vill lägga in, eller vill du utforska för att skaffa ett nytt?">
          <div className="flex flex-col gap-3 mt-1">
            <button
              onClick={() => setHarReddan(true)}
              className="bd-card p-4 rounded-2xl border border-line bg-white text-left text-sm font-medium"
            >
              Jag har redan ett kort
            </button>
            <button
              onClick={() => setHarReddan(false)}
              className="bd-card p-4 rounded-2xl border border-line bg-white text-left text-sm font-medium"
            >
              Jag vill utforska för att skaffa ett nytt
            </button>
          </div>
        </Field>
        <button onClick={onCancel} className="text-sm font-semibold py-2 text-slate">
          Avbryt
        </button>
      </>
    );
  }

  const backToChoice = () => setHarReddan(null);

  if (harReddan) {
    const valid = utgivare.trim().length > 0;
    return (
      <>
        <button onClick={backToChoice} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Tillbaka
        </button>
        <Field label="Utgivare / bank">
          <PillGroupWithOther options={KREDITKORT_UTGIVARE} value={utgivare} onChange={setUtgivare} />
        </Field>
        <Field label="Kortnamn (valfritt)">
          <input className={inputClass} value={kortnamn} onChange={(e) => setKortnamn(e.target.value)} placeholder="T.ex. SEB Kort" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Årsavgift (kr, valfritt)">
            <input type="number" className={inputClass} value={arsavgift} onChange={(e) => setArsavgift(e.target.value)} placeholder="495" />
          </Field>
          <Field label="Ränta (%, valfritt)">
            <input type="number" className={inputClass} value={ranta} onChange={(e) => setRanta(e.target.value)} placeholder="19.9" />
          </Field>
        </div>
        <Field label="Kreditgräns (kr, valfritt)">
          <input type="number" className={inputClass} value={kreditgrans} onChange={(e) => setKreditgrans(e.target.value)} placeholder="30000" />
        </Field>
        <Field label="Har kortet ett bonusprogram?">
          <BoolPill value={bonusprogram} onChange={setBonusprogram} />
        </Field>
        <FormActions
          valid={valid}
          onCancel={onCancel}
          onSave={() =>
            onSave({
              id: createItemId(),
              kind: "kreditkort",
              harReddan: true,
              utgivare: utgivare.trim(),
              kortnamn: kortnamn.trim() || undefined,
              arsavgift: arsavgift ? Number(arsavgift) : undefined,
              ranta: ranta ? Number(ranta) : undefined,
              kreditgrans: kreditgrans ? Number(kreditgrans) : undefined,
              bonusprogram: bonusprogram ?? undefined,
            })
          }
        />
      </>
    );
  }

  // utforskar nytt kort
  return (
    <>
      <button onClick={backToChoice} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
        <ArrowLeft size={15} /> Tillbaka
      </button>
      <Field label="Vad är viktigast för dig i ett nytt kort?">
        <PillGroup
          options={["lag_avgift", "bonus", "reseforsakring", "hog_kreditgrans"] as const}
          labels={ONSKAD_KREDITKORT_LABELS}
          value={onskadPrioritet}
          onChange={setOnskadPrioritet}
        />
      </Field>
      <FormActions
        valid={!!onskadPrioritet}
        onCancel={onCancel}
        onSave={() =>
          onSave({
            id: createItemId(),
            kind: "kreditkort",
            harReddan: false,
            onskadPrioritet: onskadPrioritet!,
          })
        }
      />
    </>
  );
}

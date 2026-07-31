"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BoolPill, Field, FormActions, inputClass, PillGroup } from "@/components/onboarding/shared";
import { ANSLUTNING_LABELS, createItemId, TELEKOM_TYP_LABELS } from "@/lib/items";
import type { AnslutningTyp, InsuranceItem, TelekomTyp } from "@/lib/items";

export function TelekomForm({
  onSave,
  onCancel,
}: {
  onSave: (item: InsuranceItem) => void;
  onCancel: () => void;
}) {
  const [typ, setTyp] = useState<TelekomTyp | null>(null);

  // mobil
  const [operatorMobil, setOperatorMobil] = useState("");
  const [dataGb, setDataGb] = useState("");
  const [obegransatData, setObegransatData] = useState<boolean | null>(null);
  const [prisMobil, setPrisMobil] = useState("");
  const [bindningMobil, setBindningMobil] = useState("");

  // bredband
  const [operatorBredband, setOperatorBredband] = useState("");
  const [hastighetMbit, setHastighetMbit] = useState("");
  const [anslutning, setAnslutning] = useState<AnslutningTyp | null>(null);
  const [prisBredband, setPrisBredband] = useState("");
  const [bindningBredband, setBindningBredband] = useState("");

  // tv/streaming
  const [tjanst, setTjanst] = useState("");
  const [prisTv, setPrisTv] = useState("");
  const [delatKonto, setDelatKonto] = useState<boolean | null>(null);

  const backToTypePicker = () => setTyp(null);

  if (!typ) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(TELEKOM_TYP_LABELS) as TelekomTyp[]).map((t) => (
          <button
            key={t}
            onClick={() => setTyp(t)}
            className="bd-card p-4 rounded-2xl border border-line bg-white text-left text-sm font-medium"
          >
            {TELEKOM_TYP_LABELS[t]}
          </button>
        ))}
      </div>
    );
  }

  if (typ === "mobil") {
    const valid = operatorMobil.trim().length > 0 && Number(prisMobil) > 0;
    return (
      <>
        <button onClick={backToTypePicker} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Annan typ
        </button>
        <Field label="Operatör">
          <input className={inputClass} value={operatorMobil} onChange={(e) => setOperatorMobil(e.target.value)} placeholder="T.ex. Telia" />
        </Field>
        <Field label="Har du obegränsat med data?">
          <BoolPill value={obegransatData} onChange={setObegransatData} />
        </Field>
        {obegransatData === false && (
          <Field label="Datamängd (GB)">
            <input type="number" className={inputClass} value={dataGb} onChange={(e) => setDataGb(e.target.value)} placeholder="10" />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pris (kr/månad)">
            <input type="number" className={inputClass} value={prisMobil} onChange={(e) => setPrisMobil(e.target.value)} placeholder="299" />
          </Field>
          <Field label="Bindningstid (månader, valfritt)">
            <input type="number" className={inputClass} value={bindningMobil} onChange={(e) => setBindningMobil(e.target.value)} placeholder="24" />
          </Field>
        </div>
        <FormActions
          valid={valid}
          onCancel={onCancel}
          onSave={() =>
            onSave({
              id: createItemId(),
              kind: "telekom",
              typ: "mobil",
              operator: operatorMobil.trim(),
              dataGb: dataGb ? Number(dataGb) : undefined,
              obegransatData: !!obegransatData,
              prisPerManad: Number(prisMobil),
              bindningstidManader: bindningMobil ? Number(bindningMobil) : undefined,
            })
          }
        />
      </>
    );
  }

  if (typ === "bredband") {
    const valid = operatorBredband.trim().length > 0 && !!anslutning && Number(prisBredband) > 0;
    return (
      <>
        <button onClick={backToTypePicker} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Annan typ
        </button>
        <Field label="Operatör">
          <input className={inputClass} value={operatorBredband} onChange={(e) => setOperatorBredband(e.target.value)} placeholder="T.ex. Bahnhof" />
        </Field>
        <Field label="Anslutningstyp">
          <PillGroup
            options={["fiber", "kabel", "mobilt", "dsl"] as const}
            labels={ANSLUTNING_LABELS}
            value={anslutning}
            onChange={setAnslutning}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hastighet (Mbit/s, valfritt)">
            <input type="number" className={inputClass} value={hastighetMbit} onChange={(e) => setHastighetMbit(e.target.value)} placeholder="250" />
          </Field>
          <Field label="Pris (kr/månad)">
            <input type="number" className={inputClass} value={prisBredband} onChange={(e) => setPrisBredband(e.target.value)} placeholder="399" />
          </Field>
        </div>
        <Field label="Bindningstid (månader, valfritt)">
          <input type="number" className={inputClass} value={bindningBredband} onChange={(e) => setBindningBredband(e.target.value)} placeholder="24" />
        </Field>
        <FormActions
          valid={valid}
          onCancel={onCancel}
          onSave={() =>
            onSave({
              id: createItemId(),
              kind: "telekom",
              typ: "bredband",
              operator: operatorBredband.trim(),
              hastighetMbit: hastighetMbit ? Number(hastighetMbit) : undefined,
              anslutning: anslutning!,
              prisPerManad: Number(prisBredband),
              bindningstidManader: bindningBredband ? Number(bindningBredband) : undefined,
            })
          }
        />
      </>
    );
  }

  // tv_streaming
  const valid = tjanst.trim().length > 0 && Number(prisTv) > 0;
  return (
    <>
      <button onClick={backToTypePicker} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
        <ArrowLeft size={15} /> Annan typ
      </button>
      <Field label="Tjänst">
        <input className={inputClass} value={tjanst} onChange={(e) => setTjanst(e.target.value)} placeholder="T.ex. Netflix" />
      </Field>
      <Field label="Pris (kr/månad)">
        <input type="number" className={inputClass} value={prisTv} onChange={(e) => setPrisTv(e.target.value)} placeholder="139" />
      </Field>
      <Field label="Delar du kontot med någon?">
        <BoolPill value={delatKonto} onChange={setDelatKonto} />
      </Field>
      <FormActions
        valid={valid}
        onCancel={onCancel}
        onSave={() =>
          onSave({
            id: createItemId(),
            kind: "telekom",
            typ: "tv_streaming",
            tjanst: tjanst.trim(),
            prisPerManad: Number(prisTv),
            delatKonto: !!delatKonto,
          })
        }
      />
    </>
  );
}

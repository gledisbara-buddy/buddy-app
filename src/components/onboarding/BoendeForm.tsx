"use client";

import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { AddressField, type AddressValue } from "@/components/onboarding/AddressField";
import { BoolPill, Field, FormActions, inputClass } from "@/components/onboarding/shared";
import { BOENDE_TYP_LABELS, createItemId } from "@/lib/items";
import type { BoendeItem, BoendeTyp, ForvaringsTyp, InsuranceItem, OvrigByggnad } from "@/lib/items";
import { FORVARINGS_TYP_LABELS } from "@/lib/items";
import { PillGroup } from "@/components/onboarding/shared";

const APARTMENT_TYPES: BoendeTyp[] = ["hyresratt", "bostadsratt", "fritidsbostadsratt"];
const HOUSE_TYPES: BoendeTyp[] = ["villa", "fritidshus"];

const emptyAddress: AddressValue = { adress: "", postnummer: "", ort: "" };

export function BoendeForm({
  onSave,
  onCancel,
  initialItem,
}: {
  onSave: (item: InsuranceItem) => void;
  onCancel: () => void;
  initialItem?: BoendeItem;
}) {
  const [typ, setTyp] = useState<BoendeTyp | null>(initialItem?.typ ?? null);

  // Apartment-like fields (hyresrätt / bostadsrätt / fritidsbostadsrätt)
  const [address, setAddress] = useState<AddressValue>(
    initialItem
      ? { adress: initialItem.adress, postnummer: initialItem.postnummer, ort: initialItem.ort }
      : emptyAddress
  );
  const [boyta, setBoyta] = useState(initialItem && "boyta" in initialItem ? String(initialItem.boyta) : "");
  const [biarea, setBiarea] = useState(
    initialItem && "biarea" in initialItem && initialItem.biarea ? String(initialItem.biarea) : ""
  );
  const [hushallsstorlek, setHushallsstorlek] = useState(
    initialItem && "hushallsstorlek" in initialItem ? String(initialItem.hushallsstorlek) : "1"
  );
  const [sakerhetsdorr, setSakerhetsdorr] = useState<boolean | null>(
    initialItem && "sakerhetsdorr" in initialItem ? initialItem.sakerhetsdorr : null
  );
  const [larm, setLarm] = useState<boolean | null>(initialItem && "larm" in initialItem ? initialItem.larm : null);
  const [bostadsrattstillagg, setBostadsrattstillagg] = useState<boolean | null>(
    initialItem && "bostadsrattstillagg" in initialItem ? initialItem.bostadsrattstillagg : null
  );

  // House fields (villa / fritidshus)
  const [antalBadDusch, setAntalBadDusch] = useState(
    initialItem && "antalBadDusch" in initialItem ? String(initialItem.antalBadDusch) : "1"
  );
  const [skorsten, setSkorsten] = useState<boolean | null>(
    initialItem && "skorsten" in initialItem ? initialItem.skorsten : null
  );
  const [ovrigaByggnader, setOvrigaByggnader] = useState<OvrigByggnad[]>(
    initialItem && "ovrigaByggnader" in initialItem ? initialItem.ovrigaByggnader : []
  );
  const [nyByggnadTyp, setNyByggnadTyp] = useState("");
  const [nyByggnadYta, setNyByggnadYta] = useState("");
  const [indragetVatten, setIndragetVatten] = useState<boolean | null>(
    initialItem && "indragetVatten" in initialItem ? initialItem.indragetVatten : null
  );
  const [antalPlan, setAntalPlan] = useState(
    initialItem && "antalPlan" in initialItem ? String(initialItem.antalPlan) : "1"
  );
  const [kallare, setKallare] = useState<boolean | null>(
    initialItem && "kallare" in initialItem ? initialItem.kallare : null
  );

  // Magasinering fields
  const [forvaringstyp, setForvaringstyp] = useState<ForvaringsTyp | null>(
    initialItem && "forvaringstyp" in initialItem ? initialItem.forvaringstyp : null
  );
  const [storlekM2, setStorlekM2] = useState(
    initialItem && "storlekM2" in initialItem ? String(initialItem.storlekM2) : ""
  );
  const [innehall, setInnehall] = useState(initialItem && "innehall" in initialItem ? initialItem.innehall : "");
  const [uppskattatVarde, setUppskattatVarde] = useState(
    initialItem && "uppskattatVarde" in initialItem ? String(initialItem.uppskattatVarde) : ""
  );

  const addByggnad = () => {
    if (!nyByggnadTyp.trim() || !Number(nyByggnadYta)) return;
    setOvrigaByggnader((prev) => [
      ...prev,
      { id: createItemId(), typ: nyByggnadTyp.trim(), byggyta: Number(nyByggnadYta) },
    ]);
    setNyByggnadTyp("");
    setNyByggnadYta("");
  };
  const removeByggnad = (id: string) => setOvrigaByggnader((prev) => prev.filter((b) => b.id !== id));

  if (!typ) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(BOENDE_TYP_LABELS) as BoendeTyp[]).map((t) => (
          <button
            key={t}
            onClick={() => setTyp(t)}
            className="bd-card p-4 rounded-2xl border border-line bg-white text-left text-sm font-medium"
          >
            {BOENDE_TYP_LABELS[t]}
          </button>
        ))}
      </div>
    );
  }

  const backToTypePicker = () => setTyp(null);

  if (typ === "magasinering") {
    const valid = !!forvaringstyp && address.ort.trim().length > 0 && Number(storlekM2) > 0 && innehall.trim().length > 0 && Number(uppskattatVarde) > 0;
    return (
      <>
        <button onClick={backToTypePicker} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Annan typ
        </button>
        <AddressField value={address} onChange={setAddress} addressLabel="Adress till anläggningen" />
        <Field label="Typ av förvaring">
          <PillGroup
            options={["forrad", "kallarforrad", "container", "boxlager", "annat"] as const}
            labels={FORVARINGS_TYP_LABELS}
            value={forvaringstyp}
            onChange={setForvaringstyp}
          />
        </Field>
        <Field label="Storlek (m²)">
          <input type="number" className={inputClass} value={storlekM2} onChange={(e) => setStorlekM2(e.target.value)} placeholder="5" />
        </Field>
        <Field label="Vad förvaras?">
          <input className={inputClass} value={innehall} onChange={(e) => setInnehall(e.target.value)} placeholder="Möbler och säsongssaker" />
        </Field>
        <Field label="Uppskattat värde (kr)">
          <input type="number" className={inputClass} value={uppskattatVarde} onChange={(e) => setUppskattatVarde(e.target.value)} placeholder="20000" />
        </Field>
        <FormActions
          valid={valid}
          onCancel={onCancel}
          onSave={() =>
            onSave({
              id: initialItem?.id ?? createItemId(),
              kind: "boende",
              typ: "magasinering",
              adress: address.adress.trim(),
              postnummer: address.postnummer.trim(),
              ort: address.ort.trim(),
              forvaringstyp: forvaringstyp!,
              storlekM2: Number(storlekM2),
              innehall: innehall.trim(),
              uppskattatVarde: Number(uppskattatVarde),
            })
          }
        />
      </>
    );
  }

  if (HOUSE_TYPES.includes(typ)) {
    const valid =
      address.adress.trim().length > 1 &&
      address.ort.trim().length > 0 &&
      Number(boyta) > 0 &&
      Number(antalPlan) > 0;
    return (
      <>
        <button onClick={backToTypePicker} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Annan typ
        </button>
        <AddressField value={address} onChange={setAddress} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Boyta (m²)">
            <input type="number" className={inputClass} value={boyta} onChange={(e) => setBoyta(e.target.value)} placeholder="140" />
          </Field>
          <Field label="Antal personer i hushållet">
            <input type="number" min={1} className={inputClass} value={hushallsstorlek} onChange={(e) => setHushallsstorlek(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Antal bad/dusch">
            <input type="number" min={0} className={inputClass} value={antalBadDusch} onChange={(e) => setAntalBadDusch(e.target.value)} />
          </Field>
          <Field label="Antal plan">
            <input type="number" min={1} className={inputClass} value={antalPlan} onChange={(e) => setAntalPlan(e.target.value)} />
          </Field>
        </div>
        <Field label="Skorsten?">
          <BoolPill value={skorsten} onChange={setSkorsten} />
        </Field>
        <Field label="Indraget vatten?">
          <BoolPill value={indragetVatten} onChange={setIndragetVatten} />
        </Field>
        <Field label="Källare?">
          <BoolPill value={kallare} onChange={setKallare} />
        </Field>
        <Field label="Larm?">
          <BoolPill value={larm} onChange={setLarm} />
        </Field>

        <Field label="Övriga byggnader (t.ex. garage, förråd)">
          <div className="flex gap-2 mb-3">
            <input
              className={inputClass}
              value={nyByggnadTyp}
              onChange={(e) => setNyByggnadTyp(e.target.value)}
              placeholder="T.ex. Garage"
            />
            <input
              type="number"
              className={`${inputClass} max-w-[110px]`}
              value={nyByggnadYta}
              onChange={(e) => setNyByggnadYta(e.target.value)}
              placeholder="m²"
            />
            <button
              type="button"
              onClick={addByggnad}
              className="px-4 rounded-xl border border-line text-sm font-medium flex-none bg-white"
            >
              Lägg till
            </button>
          </div>
          {ovrigaByggnader.length > 0 && (
            <div className="flex flex-col gap-2">
              {ovrigaByggnader.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-line">
                  <div className="text-sm">
                    {b.typ} · {b.byggyta} m²
                  </div>
                  <button onClick={() => removeByggnad(b.id)} className="opacity-50 hover:opacity-100">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>

        <FormActions
          valid={valid}
          onCancel={onCancel}
          onSave={() =>
            onSave({
              id: initialItem?.id ?? createItemId(),
              kind: "boende",
              typ: typ as "villa" | "fritidshus",
              adress: address.adress.trim(),
              postnummer: address.postnummer.trim(),
              ort: address.ort.trim(),
              boyta: Number(boyta),
              hushallsstorlek: Number(hushallsstorlek) || 1,
              antalBadDusch: Number(antalBadDusch) || 0,
              skorsten: !!skorsten,
              ovrigaByggnader,
              indragetVatten: !!indragetVatten,
              antalPlan: Number(antalPlan) || 1,
              kallare: !!kallare,
              larm: !!larm,
            })
          }
        />
      </>
    );
  }

  // Apartment-like: hyresrätt / bostadsrätt / fritidsbostadsrätt
  if (APARTMENT_TYPES.includes(typ)) {
    const needsTillagg = typ === "bostadsratt" || typ === "fritidsbostadsratt";
    const valid = address.adress.trim().length > 1 && address.ort.trim().length > 0 && Number(boyta) > 0;
    const item: BoendeItem =
      typ === "hyresratt"
        ? {
            id: initialItem?.id ?? createItemId(),
            kind: "boende",
            typ: "hyresratt",
            adress: address.adress.trim(),
            postnummer: address.postnummer.trim(),
            ort: address.ort.trim(),
            boyta: Number(boyta),
            biarea: biarea ? Number(biarea) : undefined,
            hushallsstorlek: Number(hushallsstorlek) || 1,
            sakerhetsdorr: !!sakerhetsdorr,
            larm: !!larm,
          }
        : {
            id: initialItem?.id ?? createItemId(),
            kind: "boende",
            typ: typ as "bostadsratt" | "fritidsbostadsratt",
            adress: address.adress.trim(),
            postnummer: address.postnummer.trim(),
            ort: address.ort.trim(),
            boyta: Number(boyta),
            biarea: biarea ? Number(biarea) : undefined,
            hushallsstorlek: Number(hushallsstorlek) || 1,
            sakerhetsdorr: !!sakerhetsdorr,
            larm: !!larm,
            bostadsrattstillagg: !!bostadsrattstillagg,
          };

    return (
      <>
        <button onClick={backToTypePicker} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Annan typ
        </button>
        <AddressField value={address} onChange={setAddress} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Boyta (m²)">
            <input type="number" className={inputClass} value={boyta} onChange={(e) => setBoyta(e.target.value)} placeholder="65" />
          </Field>
          <Field label="Biarea (valfritt, m²)">
            <input type="number" className={inputClass} value={biarea} onChange={(e) => setBiarea(e.target.value)} placeholder="5" />
          </Field>
        </div>
        <Field label="Antal personer i hushållet">
          <input type="number" min={1} className={inputClass} value={hushallsstorlek} onChange={(e) => setHushallsstorlek(e.target.value)} />
        </Field>
        <Field label="Säkerhetsdörr?">
          <BoolPill value={sakerhetsdorr} onChange={setSakerhetsdorr} />
        </Field>
        <Field label="Larm?">
          <BoolPill value={larm} onChange={setLarm} />
        </Field>
        {needsTillagg && (
          <Field label="Finns bostadsrättstillägg via föreningen?">
            <BoolPill value={bostadsrattstillagg} onChange={setBostadsrattstillagg} />
          </Field>
        )}
        <FormActions valid={valid} onCancel={onCancel} onSave={() => onSave(item)} />
      </>
    );
  }

  return null;
}

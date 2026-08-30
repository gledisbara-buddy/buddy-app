"use client";

import { useState } from "react";
import { ArrowLeft, Info, Trash2 } from "lucide-react";
import { AddressField, type AddressValue } from "@/components/onboarding/AddressField";
import { BoolPill, Field, FormActions, inputClass } from "@/components/onboarding/shared";
import { useBuddy } from "@/lib/buddy-context";
import { BOENDE_TYP_LABELS, createItemId } from "@/lib/items";
import type {
  AndrahandsuthyrningRoll,
  BoendeItem,
  BoendeTyp,
  ForvaringsTyp,
  InsuranceItem,
  LosorevardeSkala,
  OvrigByggnad,
  StudentBoendeTyp,
  UppvarmningsSatt,
  UthyrningsForm,
} from "@/lib/items";
import {
  ANDRAHANDSUTHYRNING_ROLL_LABELS,
  FORVARINGS_TYP_LABELS,
  STUDENTBOENDE_TYP_LABELS,
  UPPVARMNING_LABELS,
  UTHYRNINGSFORM_LABELS,
} from "@/lib/items";
import { PillGroup } from "@/components/onboarding/shared";

const APARTMENT_TYPES: BoendeTyp[] = ["hyresratt", "bostadsratt", "fritidsbostadsratt"];
const HOUSE_TYPES: BoendeTyp[] = ["villa", "fritidshus"];

const emptyAddress: AddressValue = { adress: "", postnummer: "", ort: "" };

const LOSOREVARDE_OPTIONS = ["500000", "1000000", "1500000", "2000000"] as const;
const LOSOREVARDE_LABELS = Object.fromEntries(
  LOSOREVARDE_OPTIONS.map((v) => [v, `${Number(v).toLocaleString("sv-SE")} kr`])
) as Record<string, string>;

export function BoendeForm({
  onSave,
  onCancel,
  initialItem,
}: {
  onSave: (item: InsuranceItem) => void;
  onCancel: () => void;
  initialItem?: BoendeItem;
}) {
  const { household } = useBuddy();
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
  // Föreslår hushållets kända storlek (medlemmar + en själv) som default
  // istället för en bar "1" — kunden kan fortfarande ändra den fritt.
  const [hushallsstorlek, setHushallsstorlek] = useState(
    initialItem && "hushallsstorlek" in initialItem
      ? String(initialItem.hushallsstorlek)
      : String((household?.members.length ?? 0) + 1)
  );
  const [sakerhetsdorr, setSakerhetsdorr] = useState<boolean | null>(
    initialItem && "sakerhetsdorr" in initialItem ? initialItem.sakerhetsdorr : null
  );
  const [larm, setLarm] = useState<boolean | null>(initialItem && "larm" in initialItem ? initialItem.larm : null);
  const [bostadsrattstillagg, setBostadsrattstillagg] = useState<boolean | null>(
    initialItem && "bostadsrattstillagg" in initialItem ? initialItem.bostadsrattstillagg : null
  );
  const [onskatLosorevarde, setOnskatLosorevarde] = useState<string | null>(
    initialItem && "onskatLosorevarde" in initialItem && initialItem.onskatLosorevarde
      ? String(initialItem.onskatLosorevarde)
      : null
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
  const [uppvarmningssatt, setUppvarmningssatt] = useState<UppvarmningsSatt | null>(
    initialItem && "uppvarmningssatt" in initialItem ? (initialItem.uppvarmningssatt ?? null) : null
  );
  const [poolEllerJacuzzi, setPoolEllerJacuzzi] = useState<boolean | null>(
    initialItem && "poolEllerJacuzzi" in initialItem ? (initialItem.poolEllerJacuzzi ?? null) : null
  );
  const [solceller, setSolceller] = useState<boolean | null>(
    initialItem && "solceller" in initialItem ? (initialItem.solceller ?? null) : null
  );
  // fritidshus-specifikt (BO-4)
  const [anvandningManaderPerAr, setAnvandningManaderPerAr] = useState(
    initialItem && "anvandningManaderPerAr" in initialItem && initialItem.anvandningManaderPerAr
      ? String(initialItem.anvandningManaderPerAr)
      : ""
  );
  const [vinterbonad, setVinterbonad] = useState<boolean | null>(
    initialItem && "vinterbonad" in initialItem ? (initialItem.vinterbonad ?? null) : null
  );
  const [vattenAvstangtVintertid, setVattenAvstangtVintertid] = useState<boolean | null>(
    initialItem && "vattenAvstangtVintertid" in initialItem ? (initialItem.vattenAvstangtVintertid ?? null) : null
  );
  const [uthyrs, setUthyrs] = useState<boolean | null>(
    initialItem && "uthyrs" in initialItem ? (initialItem.uthyrs ?? null) : null
  );

  // Andrahandsuthyrning (BO-6)
  const [roll, setRoll] = useState<AndrahandsuthyrningRoll | null>(
    initialItem && "roll" in initialItem ? initialItem.roll : null
  );
  const [uthyrningsform, setUthyrningsform] = useState<UthyrningsForm | null>(
    initialItem && "uthyrningsform" in initialItem ? initialItem.uthyrningsform : null
  );
  const [mobler, setMobler] = useState<boolean | null>(initialItem && "mobler" in initialItem ? initialItem.mobler : null);

  // Student/inneboende (BO-7)
  const [studentboendeTyp, setStudentboendeTyp] = useState<StudentBoendeTyp | null>(
    initialItem && "studentboendeTyp" in initialItem ? initialItem.studentboendeTyp : null
  );
  const [skrivenHosForalder, setSkrivenHosForalder] = useState<boolean | null>(
    initialItem && "skrivenHosForalder" in initialItem ? (initialItem.skrivenHosForalder ?? null) : null
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
        <Field label="Ungefärligt värde på ditt lösöre (valfritt)">
          <PillGroup options={LOSOREVARDE_OPTIONS} labels={LOSOREVARDE_LABELS} value={onskatLosorevarde} onChange={setOnskatLosorevarde} />
        </Field>
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
        <Field label="Uppvärmningssätt (valfritt)">
          <PillGroup
            options={
              ["fjarrvarme", "bergvarme", "luftvarmepump", "direktverkande_el", "pellets", "olja", "vedeldning"] as const
            }
            labels={UPPVARMNING_LABELS}
            value={uppvarmningssatt}
            onChange={setUppvarmningssatt}
          />
        </Field>
        <Field label="Pool eller jacuzzi?">
          <BoolPill value={poolEllerJacuzzi} onChange={setPoolEllerJacuzzi} />
        </Field>
        <Field label="Solceller?">
          <BoolPill value={solceller} onChange={setSolceller} />
        </Field>

        {typ === "fritidshus" && (
          <>
            <Field label="Hur många månader per år används huset? (valfritt)">
              <input
                type="number"
                min={0}
                max={12}
                className={inputClass}
                value={anvandningManaderPerAr}
                onChange={(e) => setAnvandningManaderPerAr(e.target.value)}
                placeholder="3"
              />
            </Field>
            <Field label="Vinterbonat (uppvärmt och används året runt)?">
              <BoolPill value={vinterbonad} onChange={setVinterbonad} />
            </Field>
            {vinterbonad === false && (
              <div className="rounded-2xl p-4 mb-4 flex items-start gap-3 bg-frost-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-white">
                  <Info size={15} className="text-forest" />
                </div>
                <p className="text-xs text-ink">
                  Är vattnet avstängt och systemet tömt när huset står tomt vintertid? Det avgör om frysskador täcks.
                </p>
              </div>
            )}
            <Field label="Är vattnet avstängt och systemet tömt vintertid? (valfritt)">
              <BoolPill value={vattenAvstangtVintertid} onChange={setVattenAvstangtVintertid} />
            </Field>
            <Field label="Hyrs huset ut (t.ex. via plattform)?">
              <BoolPill value={uthyrs} onChange={setUthyrs} />
            </Field>
          </>
        )}

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
              onskatLosorevarde: onskatLosorevarde ? (Number(onskatLosorevarde) as LosorevardeSkala) : undefined,
              uppvarmningssatt: uppvarmningssatt ?? undefined,
              poolEllerJacuzzi: poolEllerJacuzzi ?? undefined,
              solceller: solceller ?? undefined,
              ...(typ === "fritidshus"
                ? {
                    anvandningManaderPerAr: anvandningManaderPerAr ? Number(anvandningManaderPerAr) : undefined,
                    vinterbonad: vinterbonad ?? undefined,
                    vattenAvstangtVintertid: vattenAvstangtVintertid ?? undefined,
                    uthyrs: uthyrs ?? undefined,
                  }
                : {}),
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
            onskatLosorevarde: onskatLosorevarde ? (Number(onskatLosorevarde) as LosorevardeSkala) : undefined,
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
            onskatLosorevarde: onskatLosorevarde ? (Number(onskatLosorevarde) as LosorevardeSkala) : undefined,
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
        <Field label="Ungefärligt värde på ditt lösöre (valfritt)">
          <PillGroup options={LOSOREVARDE_OPTIONS} labels={LOSOREVARDE_LABELS} value={onskatLosorevarde} onChange={setOnskatLosorevarde} />
        </Field>
        <Field label="Säkerhetsdörr?">
          <BoolPill value={sakerhetsdorr} onChange={setSakerhetsdorr} />
        </Field>
        <Field label="Larm?">
          <BoolPill value={larm} onChange={setLarm} />
        </Field>
        {needsTillagg && (
          <>
            <div className="rounded-2xl p-4 mb-4 flex items-start gap-3 bg-frost-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-white">
                <Info size={15} className="text-forest" />
              </div>
              <p className="text-xs text-ink">
                Det här är det vanligaste hålet i svenska hemförsäkringar. Föreningens fastighetsförsäkring täcker
                bara byggnaden i grunden — inte det du själv bekostat i lägenheten (kök, golv, badrum). Många tror
                att föreningen redan täcker det.
              </p>
            </div>
            <Field label="Finns bostadsrättstillägg via föreningen?">
              <BoolPill value={bostadsrattstillagg} onChange={setBostadsrattstillagg} />
            </Field>
          </>
        )}
        <FormActions valid={valid} onCancel={onCancel} onSave={() => onSave(item)} />
      </>
    );
  }

  if (typ === "andrahandsuthyrning") {
    const valid = address.adress.trim().length > 1 && address.ort.trim().length > 0 && Number(boyta) > 0 && !!roll && !!uthyrningsform;
    return (
      <>
        <button onClick={backToTypePicker} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Annan typ
        </button>
        <Field label="Din roll">
          <PillGroup
            options={["hyr-ut-egen", "ager-hyresfastighet"] as const}
            labels={ANDRAHANDSUTHYRNING_ROLL_LABELS}
            value={roll}
            onChange={setRoll}
          />
        </Field>
        <AddressField value={address} onChange={setAddress} />
        <Field label="Boyta (m²)">
          <input type="number" className={inputClass} value={boyta} onChange={(e) => setBoyta(e.target.value)} placeholder="55" />
        </Field>
        <Field label="Uthyrningsform">
          <PillGroup
            options={["langtid", "korttid-plattform", "rum-i-bostaden"] as const}
            labels={UTHYRNINGSFORM_LABELS}
            value={uthyrningsform}
            onChange={setUthyrningsform}
          />
        </Field>
        <Field label="Möblerad?">
          <BoolPill value={mobler} onChange={setMobler} />
        </Field>
        <FormActions
          valid={valid}
          onCancel={onCancel}
          onSave={() =>
            onSave({
              id: initialItem?.id ?? createItemId(),
              kind: "boende",
              typ: "andrahandsuthyrning",
              adress: address.adress.trim(),
              postnummer: address.postnummer.trim(),
              ort: address.ort.trim(),
              boyta: Number(boyta),
              roll: roll!,
              uthyrningsform: uthyrningsform!,
              mobler: !!mobler,
            })
          }
        />
      </>
    );
  }

  if (typ === "student") {
    const valid = address.adress.trim().length > 1 && address.ort.trim().length > 0 && !!studentboendeTyp;
    return (
      <>
        <button onClick={backToTypePicker} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Annan typ
        </button>
        <AddressField value={address} onChange={setAddress} />
        <Field label="Boendeform">
          <PillGroup
            options={["korridor", "studentlagenhet", "inneboende"] as const}
            labels={STUDENTBOENDE_TYP_LABELS}
            value={studentboendeTyp}
            onChange={setStudentboendeTyp}
          />
        </Field>
        <div className="rounded-2xl p-4 mb-4 flex items-start gap-3 bg-frost-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-white">
            <Info size={15} className="text-forest" />
          </div>
          <p className="text-xs text-ink">
            Är du fortfarande skriven hos en förälder kan deras hemförsäkring redan täcka dig — kolla det innan du
            tecknar en egen. Det är den enda produkten där rätt svar ibland är att du inte behöver något alls.
          </p>
        </div>
        <Field label="Är du fortfarande skriven hos en förälder?">
          <BoolPill value={skrivenHosForalder} onChange={setSkrivenHosForalder} />
        </Field>
        <FormActions
          valid={valid}
          onCancel={onCancel}
          onSave={() =>
            onSave({
              id: initialItem?.id ?? createItemId(),
              kind: "boende",
              typ: "student",
              adress: address.adress.trim(),
              postnummer: address.postnummer.trim(),
              ort: address.ort.trim(),
              studentboendeTyp: studentboendeTyp!,
              skrivenHosForalder: skrivenHosForalder ?? undefined,
            })
          }
        />
      </>
    );
  }

  return null;
}

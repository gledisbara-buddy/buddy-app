"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, PhoneCall } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Overlay } from "@/components/Overlay";
import { PageSkeleton } from "@/components/PageSkeleton";
import { AutoFetchStep } from "@/components/onboarding/AutoFetchStep";
import { BoendeForm } from "@/components/onboarding/BoendeForm";
import { TelekomForm } from "@/components/onboarding/TelekomForm";
import { KreditkortForm } from "@/components/onboarding/KreditkortForm";
import { BoolPill, Field, FormActions, MultiPillGroup, PillGroup, PillGroupWithOther, inputClass } from "@/components/onboarding/shared";
import { useBuddy } from "@/lib/buddy-context";
import type { Quote } from "@/lib/quote";
import type { FetchableKind } from "@/lib/policy-fetch";
import { lookupVehicle } from "@/lib/vehicle-lookup";
import { isoToSwedishDate, swedishDateToIso } from "@/lib/dates";
import {
  AVTALSTYP_LABELS,
  BAT_MOTOR_LABELS,
  DJUR_TYP_LABELS,
  EL_BOLAG,
  FORDON_TYP_LABELS,
  INNE_UTE_LABELS,
  ITEM_CATEGORIES,
  ONSKAT_SKYDD_LABELS,
  PERSON_RELATION_LABELS,
  PRENUMERATION_LEVERANTORER,
  SYSSELSATTNING_LABELS,
  createItemId,
  groupForKind,
  type Avtalstyp,
  type BatMotorTyp,
  type BilItem,
  type DjurItem,
  type DjurTyp,
  type ElItem,
  type Elomrade,
  type FordonTyp,
  type InneUte,
  type InsuranceItem,
  type ItemKind,
  type OnskatSkydd,
  type OvrigtFordonItem,
  type PersonItem,
  type PersonRelation,
  type PrenumerationItem,
  type Sysselsattning,
  type TelekomTyp,
} from "@/lib/items";

function BilForm({
  onSave,
  onCancel,
  initialItem,
}: {
  onSave: (item: InsuranceItem) => void;
  onCancel: () => void;
  initialItem?: BilItem;
}) {
  const [regnummer, setRegnummer] = useState(initialItem?.regnummer ?? "");
  const [markeModell, setMarkeModell] = useState(initialItem?.markeModell ?? "");
  const [arsmodell, setArsmodell] = useState(initialItem?.arsmodell ? String(initialItem.arsmodell) : "");
  const [arligKorstracka, setArligKorstracka] = useState(initialItem?.arligKorstracka ? String(initialItem.arligKorstracka) : "");
  const [forvaring, setForvaring] = useState<"garage" | "uppfart" | "gata" | null>(initialItem?.forvaring ?? null);
  const [lookingUp, setLookingUp] = useState(false);
  const lookupToken = useRef(0);

  const valid = regnummer.trim().length >= 2;

  const runLookup = async (value: string) => {
    if (value.trim().length < 5 || markeModell.trim() || arsmodell.trim()) return;
    const token = ++lookupToken.current;
    setLookingUp(true);
    const info = await lookupVehicle(value);
    if (token !== lookupToken.current) return;
    setLookingUp(false);
    if (info) {
      setMarkeModell(info.markeModell);
      setArsmodell(String(info.arsmodell));
    }
  };

  return (
    <>
      <Field label="Registreringsnummer">
        <div className="relative">
          <input
            className={inputClass}
            value={regnummer}
            onChange={(e) => setRegnummer(e.target.value.toUpperCase())}
            onBlur={(e) => runLookup(e.target.value)}
            placeholder="ABC123"
          />
          {lookingUp && (
            <Loader2 size={15} className="bd-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate" />
          )}
        </div>
        {lookingUp && <p className="text-xs mt-1.5 text-slate">Hämtar fordonsinformation…</p>}
      </Field>
      <Field label="Märke & modell (valfritt)">
        <input className={inputClass} value={markeModell} onChange={(e) => setMarkeModell(e.target.value)} placeholder="Volvo XC60" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Årsmodell (valfritt)">
          <input type="number" className={inputClass} value={arsmodell} onChange={(e) => setArsmodell(e.target.value)} placeholder="2019" />
        </Field>
        <Field label="Körsträcka per år (mil, valfritt)">
          <input
            type="number"
            className={inputClass}
            value={arligKorstracka}
            onChange={(e) => setArligKorstracka(e.target.value)}
            placeholder="1500"
          />
        </Field>
      </div>
      <Field label="Var förvaras bilen? (valfritt)">
        <PillGroup
          options={["garage", "uppfart", "gata"] as const}
          labels={{ garage: "Garage", uppfart: "Uppfart / Carport", gata: "Gatan" }}
          value={forvaring}
          onChange={setForvaring}
        />
      </Field>
      <FormActions
        valid={valid}
        onCancel={onCancel}
        onSave={() =>
          onSave({
            id: initialItem?.id ?? createItemId(),
            kind: "bil",
            regnummer: regnummer.trim(),
            markeModell: markeModell.trim() || undefined,
            arsmodell: arsmodell ? Number(arsmodell) : undefined,
            arligKorstracka: arligKorstracka ? Number(arligKorstracka) : undefined,
            forvaring: forvaring ?? undefined,
          })
        }
      />
    </>
  );
}

function OvrigtFordonForm({
  onSave,
  onCancel,
  initialItem,
}: {
  onSave: (item: InsuranceItem) => void;
  onCancel: () => void;
  initialItem?: OvrigtFordonItem;
}) {
  const [fordonstyp, setFordonstyp] = useState<FordonTyp | null>(initialItem?.fordonstyp ?? null);
  const [regnummer, setRegnummer] = useState(initialItem?.regnummer ?? "");
  const [markeModell, setMarkeModell] = useState(initialItem?.markeModell ?? "");
  const [arsmodell, setArsmodell] = useState(initialItem?.arsmodell ? String(initialItem.arsmodell) : "");
  const [lookingUp, setLookingUp] = useState(false);
  const lookupToken = useRef(0);

  // mc
  const [cylindervolymCc, setCylindervolymCc] = useState(initialItem?.cylindervolymCc ? String(initialItem.cylindervolymCc) : "");
  const [effektHk, setEffektHk] = useState(initialItem?.effektHk ? String(initialItem.effektHk) : "");
  // husvagn
  const [totalviktKg, setTotalviktKg] = useState(initialItem?.totalviktKg ? String(initialItem.totalviktKg) : "");
  const [langdM, setLangdM] = useState(initialItem?.langdM ? String(initialItem.langdM) : "");
  // bat
  const [motortyp, setMotortyp] = useState<BatMotorTyp | null>(initialItem?.motortyp ?? null);
  // slap
  const [maxlastKg, setMaxlastKg] = useState(initialItem?.maxlastKg ? String(initialItem.maxlastKg) : "");

  const valid = !!fordonstyp;

  const runLookup = async (value: string) => {
    if (value.trim().length < 5 || markeModell.trim() || arsmodell.trim()) return;
    const token = ++lookupToken.current;
    setLookingUp(true);
    const info = await lookupVehicle(value);
    if (token !== lookupToken.current) return;
    setLookingUp(false);
    if (info) {
      setMarkeModell(info.markeModell);
      setArsmodell(String(info.arsmodell));
    }
  };

  return (
    <>
      <Field label="Typ av fordon">
        <PillGroup
          options={["mc", "husvagn", "bat", "slap", "annat"] as const}
          labels={FORDON_TYP_LABELS}
          value={fordonstyp}
          onChange={setFordonstyp}
        />
      </Field>
      <Field label="Registrerings- eller ID-nummer (valfritt)">
        <div className="relative">
          <input
            className={inputClass}
            value={regnummer}
            onChange={(e) => setRegnummer(e.target.value.toUpperCase())}
            onBlur={(e) => runLookup(e.target.value)}
            placeholder="ABC123"
          />
          {lookingUp && (
            <Loader2 size={15} className="bd-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate" />
          )}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Märke & modell (valfritt)">
          <input className={inputClass} value={markeModell} onChange={(e) => setMarkeModell(e.target.value)} />
        </Field>
        <Field label="Årsmodell (valfritt)">
          <input type="number" className={inputClass} value={arsmodell} onChange={(e) => setArsmodell(e.target.value)} placeholder="2019" />
        </Field>
      </div>

      {fordonstyp === "mc" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cylindervolym (cc, valfritt)">
            <input type="number" className={inputClass} value={cylindervolymCc} onChange={(e) => setCylindervolymCc(e.target.value)} placeholder="600" />
          </Field>
          <Field label="Effekt (hk, valfritt)">
            <input type="number" className={inputClass} value={effektHk} onChange={(e) => setEffektHk(e.target.value)} placeholder="75" />
          </Field>
        </div>
      )}

      {fordonstyp === "husvagn" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Totalvikt (kg, valfritt)">
            <input type="number" className={inputClass} value={totalviktKg} onChange={(e) => setTotalviktKg(e.target.value)} placeholder="1500" />
          </Field>
          <Field label="Längd (m, valfritt)">
            <input type="number" className={inputClass} value={langdM} onChange={(e) => setLangdM(e.target.value)} placeholder="6" />
          </Field>
        </div>
      )}

      {fordonstyp === "bat" && (
        <>
          <Field label="Längd (m, valfritt)">
            <input type="number" className={inputClass} value={langdM} onChange={(e) => setLangdM(e.target.value)} placeholder="7" />
          </Field>
          <Field label="Motortyp (valfritt)">
            <PillGroup
              options={["inombordare", "utombordare", "segel", "ingen"] as const}
              labels={BAT_MOTOR_LABELS}
              value={motortyp}
              onChange={setMotortyp}
            />
          </Field>
        </>
      )}

      {fordonstyp === "slap" && (
        <Field label="Max last (kg, valfritt)">
          <input type="number" className={inputClass} value={maxlastKg} onChange={(e) => setMaxlastKg(e.target.value)} placeholder="750" />
        </Field>
      )}

      <FormActions
        valid={valid}
        onCancel={onCancel}
        onSave={() =>
          onSave({
            id: initialItem?.id ?? createItemId(),
            kind: "ovrigt_fordon",
            fordonstyp: fordonstyp!,
            regnummer: regnummer.trim() || undefined,
            markeModell: markeModell.trim() || undefined,
            arsmodell: arsmodell ? Number(arsmodell) : undefined,
            cylindervolymCc: cylindervolymCc ? Number(cylindervolymCc) : undefined,
            effektHk: effektHk ? Number(effektHk) : undefined,
            totalviktKg: totalviktKg ? Number(totalviktKg) : undefined,
            langdM: langdM ? Number(langdM) : undefined,
            motortyp: motortyp ?? undefined,
            maxlastKg: maxlastKg ? Number(maxlastKg) : undefined,
          })
        }
      />
    </>
  );
}

function PersonForm({
  onSave,
  onCancel,
  initialItem,
}: {
  onSave: (item: InsuranceItem) => void;
  onCancel: () => void;
  initialItem?: PersonItem;
}) {
  const [namn, setNamn] = useState(initialItem?.namn ?? "");
  const [personnummer, setPersonnummer] = useState(initialItem?.personnummer ?? "");
  const [relation, setRelation] = useState<PersonRelation | null>(initialItem?.relation ?? null);

  const [sysselsattning, setSysselsattning] = useState<Sysselsattning | null>(initialItem?.sysselsattning ?? null);
  const [onskatSkydd, setOnskatSkydd] = useState<OnskatSkydd[]>(initialItem?.onskatSkydd ?? []);

  const valid = namn.trim().length > 0 && personnummer.trim().length >= 10 && relation;
  const skyddOptions: OnskatSkydd[] =
    relation === "barn" ? ["barnforsakring", "olycksfall"] : ["olycksfall", "sjukdom", "liv"];

  return (
    <>
      <Field label="Namn">
        <input className={inputClass} value={namn} onChange={(e) => setNamn(e.target.value)} placeholder="T.ex. Sam" />
      </Field>
      <Field label="Personnummer">
        <input
          className={inputClass}
          value={personnummer}
          onChange={(e) => setPersonnummer(e.target.value)}
          placeholder="ÅÅÅÅMMDD-XXXX"
        />
      </Field>
      <Field label="Relation">
        <PillGroup
          options={["mig-sjalv", "partner", "barn", "annan"] as const}
          labels={PERSON_RELATION_LABELS}
          value={relation}
          onChange={setRelation}
        />
      </Field>
      <Field label="Sysselsättning (valfritt)">
        <PillGroup
          options={["anstalld", "egenforetagare", "student", "arbetssokande", "pensionar"] as const}
          labels={SYSSELSATTNING_LABELS}
          value={sysselsattning}
          onChange={setSysselsattning}
        />
      </Field>
      <Field label="Vad vill du skydda? (valfritt, flera val möjliga)">
        <MultiPillGroup options={skyddOptions} labels={ONSKAT_SKYDD_LABELS} value={onskatSkydd} onChange={setOnskatSkydd} />
      </Field>
      <FormActions
        valid={!!valid}
        onCancel={onCancel}
        onSave={() =>
          onSave({
            id: initialItem?.id ?? createItemId(),
            kind: "person",
            namn: namn.trim(),
            personnummer: personnummer.trim(),
            relation: relation!,
            sysselsattning: sysselsattning ?? undefined,
            onskatSkydd,
          })
        }
      />
    </>
  );
}

function DjurForm({
  onSave,
  onCancel,
  initialItem,
}: {
  onSave: (item: InsuranceItem) => void;
  onCancel: () => void;
  initialItem?: DjurItem;
}) {
  const [djurtyp, setDjurtyp] = useState<DjurTyp | null>(initialItem?.djurtyp ?? null);
  const [namn, setNamn] = useState(initialItem?.namn ?? "");
  const [ras, setRas] = useState(initialItem?.ras ?? "");
  const [fodelsear, setFodelsear] = useState(initialItem?.fodelsear ? String(initialItem.fodelsear) : "");
  const [viktKg, setViktKg] = useState(initialItem?.viktKg ? String(initialItem.viktKg) : "");
  const [kastrerad, setKastrerad] = useState<boolean | null>(initialItem?.kastrerad ?? null);
  const [inneUte, setInneUte] = useState<InneUte | null>(initialItem?.inneUte ?? null);
  const [reserUtomlands, setReserUtomlands] = useState<boolean | null>(initialItem?.reserUtomlands ?? null);

  const valid = !!djurtyp && namn.trim().length > 0;

  return (
    <>
      <Field label="Djurtyp">
        <PillGroup options={["hund", "katt", "annat"] as const} labels={DJUR_TYP_LABELS} value={djurtyp} onChange={setDjurtyp} />
      </Field>
      <Field label="Namn">
        <input className={inputClass} value={namn} onChange={(e) => setNamn(e.target.value)} placeholder="Bruno" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ras (valfritt)">
          <input className={inputClass} value={ras} onChange={(e) => setRas(e.target.value)} placeholder="Labrador" />
        </Field>
        <Field label="Födelseår (valfritt)">
          <input type="number" className={inputClass} value={fodelsear} onChange={(e) => setFodelsear(e.target.value)} placeholder="2020" />
        </Field>
      </div>
      <Field label="Vikt (kg, valfritt)">
        <input type="number" className={inputClass} value={viktKg} onChange={(e) => setViktKg(e.target.value)} placeholder="12" />
      </Field>
      {(djurtyp === "hund" || djurtyp === "katt") && (
        <Field label="Inne- eller utedjur? (valfritt)">
          <PillGroup options={["inne", "ute", "bade"] as const} labels={INNE_UTE_LABELS} value={inneUte} onChange={setInneUte} />
        </Field>
      )}
      <Field label="Kastrerad/steriliserad? (valfritt)">
        <BoolPill value={kastrerad} onChange={setKastrerad} />
      </Field>
      <Field label="Reser du utomlands med djuret? (valfritt)">
        <BoolPill value={reserUtomlands} onChange={setReserUtomlands} />
      </Field>
      <FormActions
        valid={valid}
        onCancel={onCancel}
        onSave={() =>
          onSave({
            id: initialItem?.id ?? createItemId(),
            kind: "djur",
            djurtyp: djurtyp!,
            namn: namn.trim(),
            ras: ras.trim() || undefined,
            fodelsear: fodelsear ? Number(fodelsear) : undefined,
            viktKg: viktKg ? Number(viktKg) : undefined,
            kastrerad: kastrerad ?? undefined,
            inneUte: inneUte ?? undefined,
            reserUtomlands: reserUtomlands ?? undefined,
          })
        }
      />
    </>
  );
}

function ElForm({
  onSave,
  onCancel,
  initialItem,
}: {
  onSave: (item: InsuranceItem) => void;
  onCancel: () => void;
  initialItem?: ElItem;
}) {
  const [elbolag, setElbolag] = useState(initialItem?.elbolag ?? "");
  const [avtalstyp, setAvtalstyp] = useState<Avtalstyp | null>(initialItem?.avtalstyp ?? null);
  const [elomrade, setElomrade] = useState<Elomrade | null>(initialItem?.elomrade ?? null);
  const [arsforbrukningKwh, setArsforbrukningKwh] = useState(initialItem?.arsforbrukningKwh ? String(initialItem.arsforbrukningKwh) : "");
  const [bindningstidManader, setBindningstidManader] = useState(
    initialItem?.bindningstidManader ? String(initialItem.bindningstidManader) : ""
  );

  const valid = elbolag.trim().length > 0 && !!avtalstyp && !!elomrade;

  return (
    <>
      <Field label="Elbolag">
        <PillGroupWithOther options={EL_BOLAG} value={elbolag} onChange={setElbolag} />
      </Field>
      <Field label="Avtalstyp">
        <PillGroup options={["rorligt", "fast", "mix"] as const} labels={AVTALSTYP_LABELS} value={avtalstyp} onChange={setAvtalstyp} />
      </Field>
      <Field label="Elområde">
        <PillGroup
          options={["SE1", "SE2", "SE3", "SE4"] as const}
          labels={{ SE1: "SE1 (Norr)", SE2: "SE2", SE3: "SE3 (Stockholm)", SE4: "SE4 (Syd)" }}
          value={elomrade}
          onChange={setElomrade}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Årsförbrukning (kWh, valfritt)">
          <input
            type="number"
            className={inputClass}
            value={arsforbrukningKwh}
            onChange={(e) => setArsforbrukningKwh(e.target.value)}
            placeholder="5000"
          />
        </Field>
        <Field label="Bindningstid (månader, valfritt)">
          <input
            type="number"
            className={inputClass}
            value={bindningstidManader}
            onChange={(e) => setBindningstidManader(e.target.value)}
            placeholder="12"
          />
        </Field>
      </div>
      <FormActions
        valid={valid}
        onCancel={onCancel}
        onSave={() =>
          onSave({
            id: initialItem?.id ?? createItemId(),
            kind: "el",
            elbolag: elbolag.trim(),
            avtalstyp: avtalstyp!,
            elomrade: elomrade!,
            arsforbrukningKwh: arsforbrukningKwh ? Number(arsforbrukningKwh) : undefined,
            bindningstidManader: bindningstidManader ? Number(bindningstidManader) : undefined,
          })
        }
      />
    </>
  );
}

function PrenumerationForm({
  onSave,
  onCancel,
  initialItem,
}: {
  onSave: (item: InsuranceItem) => void;
  onCancel: () => void;
  initialItem?: PrenumerationItem;
}) {
  const [namn, setNamn] = useState(initialItem?.namn ?? "");
  const [leverantor, setLeverantor] = useState(initialItem?.leverantor ?? "");
  const [prisPerManad, setPrisPerManad] = useState(initialItem?.prisPerManad ? String(initialItem.prisPerManad) : "");
  const [bindningstidManader, setBindningstidManader] = useState(
    initialItem?.bindningstidManader ? String(initialItem.bindningstidManader) : ""
  );
  const [forfallodag, setForfallodag] = useState(
    initialItem?.forfallodatum ? (swedishDateToIso(initialItem.forfallodatum) ?? "") : ""
  );

  const valid = namn.trim().length > 0 && Number(prisPerManad) > 0;

  return (
    <>
      <Field label="Namn på abonnemanget">
        <input className={inputClass} value={namn} onChange={(e) => setNamn(e.target.value)} placeholder="T.ex. Gymkort" />
      </Field>
      <Field label="Leverantör (valfritt)">
        <PillGroupWithOther options={PRENUMERATION_LEVERANTORER} value={leverantor} onChange={setLeverantor} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Pris (kr/månad)">
          <input type="number" className={inputClass} value={prisPerManad} onChange={(e) => setPrisPerManad(e.target.value)} placeholder="399" />
        </Field>
        <Field label="Bindningstid (månader, valfritt)">
          <input
            type="number"
            className={inputClass}
            value={bindningstidManader}
            onChange={(e) => setBindningstidManader(e.target.value)}
            placeholder="12"
          />
        </Field>
      </div>
      <Field label="Förfallodag (valfritt)">
        <input type="date" className={inputClass} value={forfallodag} onChange={(e) => setForfallodag(e.target.value)} />
      </Field>
      <FormActions
        valid={valid}
        onCancel={onCancel}
        onSave={() =>
          onSave({
            id: initialItem?.id ?? createItemId(),
            kind: "prenumeration",
            namn: namn.trim(),
            leverantor: leverantor.trim() || undefined,
            prisPerManad: Number(prisPerManad),
            bindningstidManader: bindningstidManader ? Number(bindningstidManader) : undefined,
            forfallodatum: forfallodag ? isoToSwedishDate(forfallodag) : undefined,
          })
        }
      />
    </>
  );
}

type ItemFormProps = { onSave: (item: InsuranceItem) => void; onCancel: () => void; initialItem?: InsuranceItem };

// Varje formulär tar egentligen en SNÄVARE initialItem-typ (t.ex. BilForm
// vill ha BilItem, inte hela InsuranceItem-unionen) — den skillnaden går
// inte att uttrycka i en gemensam Record utan att typa bort den, men det
// är runtime-säkert: den här komponenten väljs alltid via activeCategory,
// och editItem har alltid samma kind som activeCategory (se render nedan).
const CATEGORY_FORMS: Record<ItemKind, React.ComponentType<ItemFormProps>> = {
  boende: BoendeForm as unknown as React.ComponentType<ItemFormProps>,
  bil: BilForm as unknown as React.ComponentType<ItemFormProps>,
  ovrigt_fordon: OvrigtFordonForm as unknown as React.ComponentType<ItemFormProps>,
  person: PersonForm as unknown as React.ComponentType<ItemFormProps>,
  djur: DjurForm as unknown as React.ComponentType<ItemFormProps>,
  telekom: TelekomForm as unknown as React.ComponentType<ItemFormProps>,
  kreditkort: KreditkortForm as unknown as React.ComponentType<ItemFormProps>,
  el: ElForm as unknown as React.ComponentType<ItemFormProps>,
  prenumeration: PrenumerationForm as unknown as React.ComponentType<ItemFormProps>,
};

// Vilka kategorier som visar "Hämta automatiskt från mitt bolag"-valet
// först — försäkringsgruppen (BankID mot försäkringsbolag) och numera
// även ekonomigruppen (BankID mot bank/elbolag, se AutoFetchStep.tsx).
// Mobil har sitt eget operatörsuppslag inbyggt i TelekomForm och
// prenumerationer sin egna bankkoppling-demo — de går rakt till manual.
function hasAutoFetch(kind: ItemKind): boolean {
  const group = groupForKind(kind);
  return group === "forsakring" || group === "ekonomi";
}

export function Onboarding({
  initialKind,
  initialTyp,
  editItemId,
}: {
  initialKind?: ItemKind;
  initialTyp?: TelekomTyp;
  // Sak som redan finns — hoppar förbi kategori-/hämta-automatiskt-val och
  // går rakt till rätt formulär, förifyllt. Se ItemDetail.tsx:s
  // "Redigera"-knapp.
  editItemId?: string;
}) {
  const router = useRouter();
  const { userType, loading, items, profile, addItem, updateItem, setPolicy } = useBuddy();
  const editItem = editItemId ? items.find((i) => i.id === editItemId) : undefined;
  const [activeCategory, setActiveCategory] = useState<ItemKind | null>(editItem?.kind ?? initialKind ?? null);
  const [addMode, setAddMode] = useState<"choice" | "auto" | "manual" | null>(
    editItem ? "manual" : activeCategory ? (hasAutoFetch(activeCategory) ? "choice" : "manual") : null
  );
  const [addModeFor, setAddModeFor] = useState<ItemKind | null>(activeCategory);
  const [showBundlePopup, setShowBundlePopup] = useState(false);
  const bundlePopupShownRef = useRef(false);

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  // Ingen generell "vad vill du lägga till"-kategorigrid längre — varje
  // ingång till den här sidan anger numera alltid en kind (Livshandelser,
  // gruppernas egna Lägg till-knappar, eller redigera). Saknas kind är det
  // en trasig/gammal länk, inte ett giltigt läge att visa UI för. Väntar
  // med redirecten medan samlingsrabatt-popupen visas, annars försvinner
  // den under fötterna på kunden.
  useEffect(() => {
    if (!loading && userType && !activeCategory && !editItemId && !showBundlePopup) router.replace("/dashboard");
  }, [loading, userType, activeCategory, editItemId, showBundlePopup, router]);

  // Reset addMode whenever a new category is opened — adjusted during render
  // (not an effect) so the choice screen shows before the first paint.
  if (activeCategory !== addModeFor) {
    setAddModeFor(activeCategory);
    setAddMode(editItem ? "manual" : activeCategory ? (hasAutoFetch(activeCategory) ? "choice" : "manual") : null);
  }

  if (loading) return <PageSkeleton />;
  if (!userType) return null;
  if (editItemId && !editItem) {
    router.replace("/dashboard");
    return null;
  }

  const handleItemAdded = async (item: InsuranceItem, quote?: Quote) => {
    await addItem(item);
    if (quote) setPolicy(item.id, quote);
    if (!bundlePopupShownRef.current && groupForKind(item.kind) === "forsakring") {
      const newCount = items.filter((i) => groupForKind(i.kind) === "forsakring").length + 1;
      if (newCount > 3) {
        bundlePopupShownRef.current = true;
        setShowBundlePopup(true);
      }
    }
    setActiveCategory(null);
  };

  const handleItemEdited = (item: InsuranceItem) => {
    updateItem(item);
    router.push(`/objekt/${item.id}`);
  };

  if (activeCategory) {
    const meta = ITEM_CATEGORIES.find((c) => c.kind === activeCategory)!;
    const FormComponent = CATEGORY_FORMS[activeCategory];
    const close = editItem ? () => router.push(`/objekt/${editItem.id}`) : () => setActiveCategory(null);
    const handleSaved = editItem ? handleItemEdited : (item: InsuranceItem) => handleItemAdded(item);

    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="w-full flex items-center justify-center px-6 py-5">
          <Logo />
        </div>
        <div className="flex-1 flex items-start justify-center px-5 pb-16">
          <div className="w-full max-w-md bd-fade">
            {addMode !== "auto" && (
              <button onClick={close} className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100">
                <ArrowLeft size={15} /> Tillbaka
              </button>
            )}
            <span className="bd-eyebrow">{editItem ? "Redigera" : "Lägg till"}</span>
            <h1 className="bd-display text-2xl mt-3 mb-6">{meta.label}</h1>

            {addMode === "choice" && (
              <>
                <p className="text-sm mb-4 text-slate">
                  Har du redan det här? Hämta uppgifterna automatiskt från ditt bolag, eller fyll i själv.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setAddMode("auto")}
                    className="bd-card p-4 rounded-2xl border border-line bg-white text-left text-sm font-medium"
                  >
                    Hämta automatiskt från mitt bolag
                  </button>
                  <button
                    onClick={() => setAddMode("manual")}
                    className="bd-card p-4 rounded-2xl border border-line bg-white text-left text-sm font-medium"
                  >
                    Fyll i uppgifterna själv
                  </button>
                </div>
              </>
            )}

            {addMode === "auto" && (
              <AutoFetchStep
                kind={activeCategory as FetchableKind}
                onDone={(item, quote) => handleItemAdded(item, quote)}
                onBack={() => setAddMode("choice")}
              />
            )}

            {addMode === "manual" && activeCategory === "telekom" && (
              <TelekomForm
                onSave={handleSaved}
                onCancel={close}
                initialTyp={initialTyp}
                initialItem={editItem?.kind === "telekom" ? editItem : undefined}
                defaultTelefonnummer={
                  editItem || items.some((i) => i.kind === "telekom" && i.typ === "mobil") ? undefined : profile?.phone
                }
              />
            )}
            {addMode === "manual" && activeCategory !== "telekom" && (
              <FormComponent onSave={handleSaved} onCancel={close} initialItem={editItem} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Ingen kategori och ingen redigering — omdirigeringen ovan tar över.
  // Samlingsrabatt-popupen (kan trigga precis innan redirecten) är det
  // enda som fortfarande behöver renderas här under tiden.
  if (showBundlePopup) {
    return (
      <Overlay onClose={() => setShowBundlePopup(false)}>
        <span className="bd-eyebrow">Samlingsrabatt</span>
        <h2 className="bd-display text-2xl mt-2 mb-3">Du har lagt in flera försäkringar</h2>
        <p className="text-sm mb-6 text-slate">
          Vi ser ofta att samlingsrabatter kan sänka priset på dina försäkringar ytterligare.
          Boka in ett samtal så går vi igenom det tillsammans.
        </p>
        <button
          onClick={() => router.push("/book")}
          className="bd-btn w-full mb-3 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
        >
          <PhoneCall size={16} /> Boka in samtal
        </button>
        <button onClick={() => setShowBundlePopup(false)} className="w-full text-sm font-semibold py-2 text-slate">
          Nej tack
        </button>
      </Overlay>
    );
  }
  return null;
}

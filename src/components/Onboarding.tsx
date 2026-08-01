"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, PhoneCall, Trash2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Overlay } from "@/components/Overlay";
import { AutoFetchStep } from "@/components/onboarding/AutoFetchStep";
import { BoendeForm } from "@/components/onboarding/BoendeForm";
import { TelekomForm } from "@/components/onboarding/TelekomForm";
import { KreditkortForm } from "@/components/onboarding/KreditkortForm";
import { BoolPill, Field, FormActions, MultiPillGroup, PillGroup, PillGroupWithOther, inputClass } from "@/components/onboarding/shared";
import { useBuddy } from "@/lib/buddy-context";
import type { Quote } from "@/lib/quote";
import { lookupVehicle } from "@/lib/vehicle-lookup";
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
  itemSummary,
  type Avtalstyp,
  type BatMotorTyp,
  type ComparableItem,
  type DjurTyp,
  type Elomrade,
  type FordonTyp,
  type InneUte,
  type InsuranceItem,
  type ItemKind,
  type OnskatSkydd,
  type PersonRelation,
  type Sysselsattning,
} from "@/lib/items";

function BilForm({ onSave, onCancel }: { onSave: (item: InsuranceItem) => void; onCancel: () => void }) {
  const [regnummer, setRegnummer] = useState("");
  const [markeModell, setMarkeModell] = useState("");
  const [arsmodell, setArsmodell] = useState("");
  const [arligKorstracka, setArligKorstracka] = useState("");
  const [forvaring, setForvaring] = useState<"garage" | "uppfart" | "gata" | null>(null);
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
            id: createItemId(),
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

function OvrigtFordonForm({ onSave, onCancel }: { onSave: (item: InsuranceItem) => void; onCancel: () => void }) {
  const [fordonstyp, setFordonstyp] = useState<FordonTyp | null>(null);
  const [regnummer, setRegnummer] = useState("");
  const [markeModell, setMarkeModell] = useState("");
  const [arsmodell, setArsmodell] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const lookupToken = useRef(0);

  // mc
  const [cylindervolymCc, setCylindervolymCc] = useState("");
  const [effektHk, setEffektHk] = useState("");
  // husvagn
  const [totalviktKg, setTotalviktKg] = useState("");
  const [langdM, setLangdM] = useState("");
  // bat
  const [motortyp, setMotortyp] = useState<BatMotorTyp | null>(null);
  // slap
  const [maxlastKg, setMaxlastKg] = useState("");

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
            id: createItemId(),
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

function PersonForm({ onSave, onCancel }: { onSave: (item: InsuranceItem) => void; onCancel: () => void }) {
  const [namn, setNamn] = useState("");
  const [personnummer, setPersonnummer] = useState("");
  const [relation, setRelation] = useState<PersonRelation | null>(null);

  const [sysselsattning, setSysselsattning] = useState<Sysselsattning | null>(null);
  const [onskatSkydd, setOnskatSkydd] = useState<OnskatSkydd[]>([]);

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
            id: createItemId(),
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

function DjurForm({ onSave, onCancel }: { onSave: (item: InsuranceItem) => void; onCancel: () => void }) {
  const [djurtyp, setDjurtyp] = useState<DjurTyp | null>(null);
  const [namn, setNamn] = useState("");
  const [ras, setRas] = useState("");
  const [fodelsear, setFodelsear] = useState("");
  const [viktKg, setViktKg] = useState("");
  const [kastrerad, setKastrerad] = useState<boolean | null>(null);
  const [inneUte, setInneUte] = useState<InneUte | null>(null);
  const [reserUtomlands, setReserUtomlands] = useState<boolean | null>(null);

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
            id: createItemId(),
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

function ElForm({ onSave, onCancel }: { onSave: (item: InsuranceItem) => void; onCancel: () => void }) {
  const [elbolag, setElbolag] = useState("");
  const [avtalstyp, setAvtalstyp] = useState<Avtalstyp | null>(null);
  const [elomrade, setElomrade] = useState<Elomrade | null>(null);
  const [arsforbrukningKwh, setArsforbrukningKwh] = useState("");
  const [bindningstidManader, setBindningstidManader] = useState("");

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
            id: createItemId(),
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

function PrenumerationForm({ onSave, onCancel }: { onSave: (item: InsuranceItem) => void; onCancel: () => void }) {
  const [namn, setNamn] = useState("");
  const [leverantor, setLeverantor] = useState("");
  const [prisPerManad, setPrisPerManad] = useState("");
  const [bindningstidManader, setBindningstidManader] = useState("");

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
      <FormActions
        valid={valid}
        onCancel={onCancel}
        onSave={() =>
          onSave({
            id: createItemId(),
            kind: "prenumeration",
            namn: namn.trim(),
            leverantor: leverantor.trim() || undefined,
            prisPerManad: Number(prisPerManad),
            bindningstidManader: bindningstidManader ? Number(bindningstidManader) : undefined,
          })
        }
      />
    </>
  );
}

const CATEGORY_FORMS: Record<ItemKind, React.ComponentType<{ onSave: (item: InsuranceItem) => void; onCancel: () => void }>> = {
  boende: BoendeForm,
  bil: BilForm,
  ovrigt_fordon: OvrigtFordonForm,
  person: PersonForm,
  djur: DjurForm,
  telekom: TelekomForm,
  kreditkort: KreditkortForm,
  el: ElForm,
  prenumeration: PrenumerationForm,
};

export function Onboarding({ mode = "full", initialKind }: { mode?: "full" | "add"; initialKind?: ItemKind }) {
  const router = useRouter();
  const { userType, items, addItem, removeItem, updateProfile, setPolicy } = useBuddy();
  const phase = mode === "add" ? "hub" : "name";
  const [name, setName] = useState("");
  const [activeCategory, setActiveCategory] = useState<ItemKind | null>(mode === "add" ? initialKind ?? null : null);
  const [addMode, setAddMode] = useState<"choice" | "auto" | "manual" | null>(
    activeCategory ? (groupForKind(activeCategory) === "forsakring" ? "choice" : "manual") : null
  );
  const [addModeFor, setAddModeFor] = useState<ItemKind | null>(activeCategory);
  const [showBundlePopup, setShowBundlePopup] = useState(false);
  const bundlePopupShownRef = useRef(false);

  useEffect(() => {
    if (!userType) router.replace("/kom-igang");
  }, [userType, router]);

  // Reset addMode whenever a new category is opened — adjusted during render
  // (not an effect) so the choice screen shows before the first paint.
  if (activeCategory !== addModeFor) {
    setAddModeFor(activeCategory);
    setAddMode(activeCategory ? (groupForKind(activeCategory) === "forsakring" ? "choice" : "manual") : null);
  }

  if (!userType) return null;

  const goToDashboard = () => router.push("/dashboard");

  const finishFull = () => {
    updateProfile({ name: name.trim(), priority: null });
    router.push("/dashboard?intro=1");
  };

  const handleItemAdded = (item: InsuranceItem, quote?: Quote) => {
    addItem(item);
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

  if (activeCategory) {
    const meta = ITEM_CATEGORIES.find((c) => c.kind === activeCategory)!;
    const FormComponent = CATEGORY_FORMS[activeCategory];
    const close = () => setActiveCategory(null);

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
            <span className="bd-eyebrow">Lägg till</span>
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
                kind={activeCategory as ComparableItem["kind"]}
                onDone={(item, quote) => handleItemAdded(item, quote)}
                onBack={() => setAddMode("choice")}
              />
            )}

            {addMode === "manual" && (
              <FormComponent onSave={(item) => handleItemAdded(item)} onCancel={close} />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "name") {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="w-full flex items-center justify-between px-6 py-5">
          <Logo />
          <div className="w-6" />
        </div>
        <div className="flex-1 flex items-center justify-center px-5 pb-16">
          <div className="w-full max-w-md bd-fade">
            <span className="bd-eyebrow">Kom igång</span>
            <h1 className="bd-display text-2xl mt-3 mb-2">Vad ska vi kalla dig?</h1>
            <p className="text-sm mb-6 text-slate">Bara förnamnet räcker.</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Sam"
              className={`${inputClass} mb-4`}
            />
            <button
              onClick={finishFull}
              disabled={name.trim().length < 2}
              className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
            >
              Fortsätt <ArrowRight size={16} />
            </button>
            <button
              onClick={() => router.push("/dashboard?intro=1")}
              className="w-full text-sm font-semibold py-3 text-slate"
            >
              Hoppa över, jag gör det sen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // phase === "hub"
  return (
    <div className="min-h-screen w-full flex flex-col">
      {showBundlePopup && (
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
          <button
            onClick={() => setShowBundlePopup(false)}
            className="w-full text-sm font-semibold py-2 text-slate"
          >
            Fortsätt lägga till
          </button>
        </Overlay>
      )}
      <div className="w-full flex items-center justify-between px-6 py-5">
        <Logo />
        <div className="w-6" />
      </div>
      <div className="flex-1 flex items-start justify-center px-5 pt-2 pb-16">
        <div className="w-full max-w-lg bd-fade">
          <span className="bd-eyebrow">Lägg till en sak</span>
          <h1 className="bd-display text-2xl mt-3 mb-2">Vad vill du lägga till?</h1>
          <p className="text-sm mb-6 text-slate">
            Lägg till en sak i taget — du kan alltid lägga till fler senare.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {ITEM_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const itemsInCategory = items.filter((i) => i.kind === cat.kind);
              return (
                <button
                  key={cat.kind}
                  onClick={() => setActiveCategory(cat.kind)}
                  className="bd-card p-4 rounded-2xl border text-left flex flex-col gap-3 bg-white border-line"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-frost">
                    <Icon size={17} className="text-forest" />
                  </div>
                  <div>
                    <div className="text-sm font-medium leading-tight">{cat.label}</div>
                    {itemsInCategory.length > 0 && (
                      <div className="text-xs mt-0.5 text-forest">{itemsInCategory.length} tillagd(a)</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {items.length > 0 && (
            <div className="flex flex-col gap-2 mb-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-line"
                >
                  <div className="text-sm">{itemSummary(item)}</div>
                  <button onClick={() => removeItem(item.id)} className="opacity-50 hover:opacity-100">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={goToDashboard}
            className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
          >
            Klar, tillbaka till översikten <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

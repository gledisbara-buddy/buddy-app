"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ProgressDots } from "@/components/ProgressDots";
import { BoendeForm } from "@/components/onboarding/BoendeForm";
import { BoolPill, Field, FormActions, MultiPillGroup, PillGroup, inputClass } from "@/components/onboarding/shared";
import { useBuddy } from "@/lib/buddy-context";
import { PRIORITY_OPTIONS } from "@/lib/insurance";
import { lookupVehicle } from "@/lib/vehicle-lookup";
import {
  DJUR_TYP_LABELS,
  FORDON_TYP_LABELS,
  INNE_UTE_LABELS,
  ITEM_CATEGORIES,
  ONSKAT_SKYDD_LABELS,
  PERSON_RELATION_LABELS,
  SYSSELSATTNING_LABELS,
  createItemId,
  itemSummary,
  type DjurTyp,
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

  const valid = !!fordonstyp;

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
        <input
          className={inputClass}
          value={regnummer}
          onChange={(e) => setRegnummer(e.target.value.toUpperCase())}
          placeholder="ABC123"
        />
      </Field>
      <Field label="Märke & modell (valfritt)">
        <input className={inputClass} value={markeModell} onChange={(e) => setMarkeModell(e.target.value)} placeholder="" />
      </Field>
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

const CATEGORY_FORMS: Record<ItemKind, React.ComponentType<{ onSave: (item: InsuranceItem) => void; onCancel: () => void }>> = {
  boende: BoendeForm,
  bil: BilForm,
  ovrigt_fordon: OvrigtFordonForm,
  person: PersonForm,
  djur: DjurForm,
};

export function Onboarding({ mode = "full" }: { mode?: "full" | "add" }) {
  const router = useRouter();
  const { userType, items, addItem, removeItem, setProfile } = useBuddy();
  const [phase, setPhase] = useState<"name" | "hub" | "priority">(mode === "add" ? "hub" : "name");
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ItemKind | null>(null);

  useEffect(() => {
    if (!userType) router.replace("/");
  }, [userType, router]);

  if (!userType) return null;

  const goToDashboard = () => router.push("/dashboard");

  const finishFull = (chosenPriority: string | null) => {
    setProfile({ name: name.trim(), priority: chosenPriority });
    goToDashboard();
  };

  if (activeCategory) {
    const meta = ITEM_CATEGORIES.find((c) => c.kind === activeCategory)!;
    const FormComponent = CATEGORY_FORMS[activeCategory];
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="w-full flex items-center justify-center px-6 py-5">
          <Logo />
        </div>
        <div className="flex-1 flex items-start justify-center px-5 pb-16">
          <div className="w-full max-w-md bd-fade">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100"
            >
              <ArrowLeft size={15} /> Tillbaka
            </button>
            <span className="bd-eyebrow">Lägg till</span>
            <h1 className="bd-display text-2xl mt-3 mb-6">{meta.label}</h1>
            <FormComponent
              onSave={(item) => {
                addItem(item);
                setActiveCategory(null);
              }}
              onCancel={() => setActiveCategory(null)}
            />
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
          <ProgressDots total={3} current={0} />
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
              onClick={() => setPhase("hub")}
              disabled={name.trim().length < 2}
              className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
            >
              Fortsätt <ArrowRight size={16} />
            </button>
            <button onClick={goToDashboard} className="w-full text-sm font-semibold py-3 text-slate">
              Hoppa över, jag gör det sen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "priority") {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="w-full flex items-center justify-between px-6 py-5">
          <Logo />
          <ProgressDots total={3} current={2} />
          <div className="w-6" />
        </div>
        <div className="flex-1 flex items-center justify-center px-5 pb-16">
          <div className="w-full max-w-md bd-fade">
            <button
              onClick={() => setPhase("hub")}
              className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100"
            >
              <ArrowLeft size={15} /> Tillbaka
            </button>
            <span className="bd-eyebrow">Valfritt sista steg</span>
            <h1 className="bd-display text-2xl mt-3 mb-2">Vad är viktigast för dig?</h1>
            <p className="text-sm mb-6 text-slate">
              Vi använder det för att sortera dina förslag när du jämför.
            </p>
            <div className="flex flex-col gap-3 mb-6">
              {PRIORITY_OPTIONS.map((opt) => {
                const active = priority === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setPriority(opt.id)}
                    className="bd-card p-4 rounded-2xl border text-left flex items-center gap-3"
                    style={{
                      borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                      background: active ? "var(--color-frost-2)" : "white",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-none"
                      style={{ borderColor: active ? "var(--color-forest)" : "var(--color-line)" }}
                    >
                      {active && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-forest)" }} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-xs text-slate">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => finishFull(priority)}
              className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
            >
              Klar, gå till min översikt <ArrowRight size={16} />
            </button>
            <button onClick={() => finishFull(null)} className="w-full text-sm font-semibold py-3 text-slate">
              Hoppa över
            </button>
          </div>
        </div>
      </div>
    );
  }

  // phase === "hub"
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full flex items-center justify-between px-6 py-5">
        <Logo />
        {mode === "full" && <ProgressDots total={3} current={1} />}
        <div className="w-6" />
      </div>
      <div className="flex-1 flex items-start justify-center px-5 pt-2 pb-16">
        <div className="w-full max-w-lg bd-fade">
          <span className="bd-eyebrow">{mode === "add" ? "Lägg till en sak" : "Dina saker"}</span>
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

          {mode === "add" ? (
            <button
              onClick={goToDashboard}
              className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
            >
              Klar, tillbaka till översikten <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button
                onClick={() => setPhase("priority")}
                className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
              >
                Fortsätt <ArrowRight size={16} />
              </button>
              <button
                onClick={() => finishFull(null)}
                className="w-full text-sm font-semibold py-3 text-slate"
              >
                Hoppa över, gör det senare
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Trash2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ProgressDots } from "@/components/ProgressDots";
import { useBuddy } from "@/lib/buddy-context";
import { PRIORITY_OPTIONS } from "@/lib/insurance";
import {
  BOENDE_TYP_LABELS,
  DJUR_TYP_LABELS,
  FORDON_TYP_LABELS,
  ITEM_CATEGORIES,
  PERSON_RELATION_LABELS,
  createItemId,
  itemSummary,
  type BoendeTyp,
  type DjurTyp,
  type FordonTyp,
  type InsuranceItem,
  type ItemKind,
  type PersonRelation,
} from "@/lib/items";

function PillGroup<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="px-3.5 py-2 rounded-full border text-sm font-medium"
            style={{
              borderColor: active ? "var(--color-forest)" : "var(--color-line)",
              background: active ? "var(--color-frost-2)" : "white",
              color: active ? "var(--color-forest)" : "var(--color-ink)",
            }}
          >
            {labels[opt]}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium mb-2 block">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-line text-[15px]";

function BoendeForm({ onSave, onCancel }: { onSave: (item: InsuranceItem) => void; onCancel: () => void }) {
  const [typ, setTyp] = useState<BoendeTyp | null>(null);
  const [adress, setAdress] = useState("");
  const [postnummer, setPostnummer] = useState("");
  const [ort, setOrt] = useState("");
  const [boyta, setBoyta] = useState("");
  const [byggar, setByggar] = useState("");
  const [hushallsstorlek, setHushallsstorlek] = useState("1");

  const valid = typ && adress.trim().length > 1 && ort.trim().length > 0 && Number(boyta) > 0;

  return (
    <>
      <Field label="Typ av boende">
        <PillGroup
          options={["villa", "lagenhet", "radhus", "fritidshus"] as const}
          labels={BOENDE_TYP_LABELS}
          value={typ}
          onChange={setTyp}
        />
      </Field>
      <Field label="Adress">
        <input className={inputClass} value={adress} onChange={(e) => setAdress(e.target.value)} placeholder="Storgatan 4" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Postnummer">
          <input className={inputClass} value={postnummer} onChange={(e) => setPostnummer(e.target.value)} placeholder="123 45" />
        </Field>
        <Field label="Ort">
          <input className={inputClass} value={ort} onChange={(e) => setOrt(e.target.value)} placeholder="Stockholm" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Boyta (m²)">
          <input type="number" className={inputClass} value={boyta} onChange={(e) => setBoyta(e.target.value)} placeholder="78" />
        </Field>
        <Field label="Byggår (valfritt)">
          <input type="number" className={inputClass} value={byggar} onChange={(e) => setByggar(e.target.value)} placeholder="1998" />
        </Field>
      </div>
      <Field label="Antal personer i hushållet">
        <input
          type="number"
          min={1}
          className={inputClass}
          value={hushallsstorlek}
          onChange={(e) => setHushallsstorlek(e.target.value)}
        />
      </Field>
      <FormActions
        valid={!!valid}
        onCancel={onCancel}
        onSave={() =>
          onSave({
            id: createItemId(),
            kind: "boende",
            typ: typ!,
            adress: adress.trim(),
            postnummer: postnummer.trim(),
            ort: ort.trim(),
            boyta: Number(boyta),
            byggar: byggar ? Number(byggar) : undefined,
            hushallsstorlek: Number(hushallsstorlek) || 1,
          })
        }
      />
    </>
  );
}

function BilForm({ onSave, onCancel }: { onSave: (item: InsuranceItem) => void; onCancel: () => void }) {
  const [regnummer, setRegnummer] = useState("");
  const [markeModell, setMarkeModell] = useState("");
  const [arsmodell, setArsmodell] = useState("");
  const [forvaring, setForvaring] = useState<"garage" | "uppfart" | "gata" | null>(null);

  const valid = regnummer.trim().length >= 2;

  return (
    <>
      <Field label="Registreringsnummer">
        <input
          className={inputClass}
          value={regnummer}
          onChange={(e) => setRegnummer(e.target.value.toUpperCase())}
          placeholder="ABC123"
        />
      </Field>
      <Field label="Märke & modell (valfritt)">
        <input className={inputClass} value={markeModell} onChange={(e) => setMarkeModell(e.target.value)} placeholder="Volvo XC60" />
      </Field>
      <Field label="Årsmodell (valfritt)">
        <input type="number" className={inputClass} value={arsmodell} onChange={(e) => setArsmodell(e.target.value)} placeholder="2019" />
      </Field>
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

  const valid = namn.trim().length > 0 && personnummer.trim().length >= 10 && relation;

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
          })
        }
      />
    </>
  );
}

function FormActions({ valid, onSave, onCancel }: { valid: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex flex-col gap-2 mt-2">
      <button
        onClick={onSave}
        disabled={!valid}
        className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
      >
        Spara <Check size={16} />
      </button>
      <button onClick={onCancel} className="text-sm font-semibold py-2 text-slate">
        Avbryt
      </button>
    </div>
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

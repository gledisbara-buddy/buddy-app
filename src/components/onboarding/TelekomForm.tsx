"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { BoolPill, Field, FormActions, inputClass, PillGroup, PillGroupWithOther } from "@/components/onboarding/shared";
import {
  ANSLUTNING_LABELS,
  createItemId,
  TELEKOM_BREDBAND_OPERATORER,
  TELEKOM_MOBIL_OPERATORER,
  TELEKOM_TYP_LABELS,
  TV_STREAMING_TJANSTER,
} from "@/lib/items";
import type { AnslutningTyp, InsuranceItem, TelekomTyp } from "@/lib/items";
import { isoToSwedishDate } from "@/lib/dates";
import { lookupOperator, type OperatorMatch, type OperatorPackage } from "@/lib/operator-lookup";

// Uppskattad nätverkstäckning (andel av Sveriges befolkning) per operatör —
// Halebop och Comviq körs på samma nät som Telia respektive Tele2.
const MOBIL_NATVERKSTACKNING: Record<string, number> = {
  Telia: 99,
  Tele2: 97,
  Telenor: 96,
  Tre: 95,
  Halebop: 99,
  Comviq: 97,
  Fello: 94,
  Vimla: 95,
};

export function TelekomForm({
  onSave,
  onCancel,
  initialTyp,
  defaultTelefonnummer,
}: {
  onSave: (item: InsuranceItem) => void;
  onCancel: () => void;
  initialTyp?: TelekomTyp;
  // Förifylls med kundens registrerade mobilnummer när det här är den
  // första mobilposten som läggs till (se Onboarding.tsx) — Del D i
  // docs/kundresa-v2-steg2-plan.md.
  defaultTelefonnummer?: string;
}) {
  const [typ, setTyp] = useState<TelekomTyp | null>(initialTyp ?? null);

  // mobil
  const [telefonnummer, setTelefonnummer] = useState(defaultTelefonnummer ?? "");
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "done">("idle");
  const [match, setMatch] = useState<OperatorMatch | null>(null);
  const [selectedPaket, setSelectedPaket] = useState<OperatorPackage | null>(null);
  const [manualOperator, setManualOperator] = useState(false);
  const [operatorMobil, setOperatorMobil] = useState("");
  const [dataGb, setDataGb] = useState("");
  const [obegransatData, setObegransatData] = useState<boolean | null>(null);
  const [prisMobil, setPrisMobil] = useState("");
  const [bindningMobil, setBindningMobil] = useState("");
  const [forfallodagMobil, setForfallodagMobil] = useState("");

  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookupToken = useRef(0);

  const triggerLookup = (value: string) => {
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    const digits = value.replace(/\D/g, "");
    if (digits.length < 8) {
      setLookupState("idle");
      setMatch(null);
      return;
    }
    setLookupState("loading");
    const token = ++lookupToken.current;
    lookupTimer.current = setTimeout(() => {
      lookupOperator(value).then((result) => {
        if (lookupToken.current !== token) return;
        setMatch(result);
        setLookupState("done");
      });
    }, 350);
  };

  // Kör uppslaget en gång direkt vid mount om numret är förifyllt (Del D:
  // profile.phone som förstanummer) — trådas via samma setTimeout-baserade
  // väg som triggerLookup för att inte sätta state synkront i en effekt.
  useEffect(() => {
    if (!defaultTelefonnummer) return;
    const t = setTimeout(() => triggerLookup(defaultTelefonnummer), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choosePaket = (paket: OperatorPackage, operator: string) => {
    setSelectedPaket(paket);
    setOperatorMobil(operator);
    setDataGb(paket.dataGb ? String(paket.dataGb) : "");
    setObegransatData(paket.obegransatData);
    setPrisMobil(String(paket.prisPerManad));
    if (paket.bindningstidManader) setBindningMobil(String(paket.bindningstidManader));
  };

  const switchToManual = () => {
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    setManualOperator(true);
    setMatch(null);
    setSelectedPaket(null);
    setOperatorMobil("");
    setDataGb("");
    setObegransatData(null);
    setPrisMobil("");
  };

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
    const showLookup = !manualOperator;
    return (
      <>
        <button onClick={backToTypePicker} className="flex items-center gap-1.5 text-sm mb-4 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Annan typ
        </button>

        {showLookup && (
          <>
            <Field label="Telefonnummer">
              <input
                type="tel"
                className={inputClass}
                value={telefonnummer}
                onChange={(e) => {
                  const value = e.target.value;
                  setTelefonnummer(value);
                  setSelectedPaket(null);
                  setOperatorMobil("");
                  setPrisMobil("");
                  setDataGb("");
                  setObegransatData(null);
                  triggerLookup(value);
                }}
                placeholder="070-123 45 67"
              />
            </Field>

            {lookupState === "loading" && (
              <div className="flex items-center gap-2 text-sm mb-4 text-slate">
                <Loader2 size={15} className="bd-spin" /> Slår upp operatör…
              </div>
            )}

            {lookupState === "done" && match && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate">
                    Numret tillhör <span className="font-semibold text-ink">{match.operator}</span>
                    {MOBIL_NATVERKSTACKNING[match.operator] != null &&
                      ` · ${MOBIL_NATVERKSTACKNING[match.operator]}% täckning`}
                  </p>
                  <button type="button" onClick={switchToManual} className="text-xs font-semibold text-forest flex-none">
                    Fel operatör?
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {match.paket.map((paket) => {
                    const active = selectedPaket?.namn === paket.namn;
                    return (
                      <button
                        key={paket.namn}
                        type="button"
                        onClick={() => choosePaket(paket, match.operator)}
                        className="bd-card w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between gap-3"
                        style={{
                          borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                          background: active ? "var(--color-frost-2)" : "white",
                        }}
                      >
                        <div>
                          <div className="text-sm font-semibold">{paket.namn}</div>
                          <div className="text-xs text-slate">
                            {paket.obegransatData ? "Obegränsat med data" : `${paket.dataGb} GB`}
                            {paket.bindningstidManader ? ` · ${paket.bindningstidManader} mån bindning` : ""}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-forest flex-none">{paket.prisPerManad} kr/mån</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {lookupState === "done" && !match && telefonnummer.trim().length > 0 && (
              <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-frost-2">
                <div className="flex items-center gap-2 text-sm text-slate">
                  <Search size={14} /> Hittade ingen operatör för det numret.
                </div>
                <button type="button" onClick={switchToManual} className="text-xs font-semibold text-forest flex-none">
                  Välj själv
                </button>
              </div>
            )}
          </>
        )}

        {!showLookup && (
          <>
            <Field label="Telefonnummer (valfritt)">
              <input
                type="tel"
                className={inputClass}
                value={telefonnummer}
                onChange={(e) => setTelefonnummer(e.target.value)}
                placeholder="070-123 45 67"
              />
            </Field>
            <Field label="Operatör">
              <PillGroupWithOther options={TELEKOM_MOBIL_OPERATORER} value={operatorMobil} onChange={setOperatorMobil} />
            </Field>
            {MOBIL_NATVERKSTACKNING[operatorMobil] != null && (
              <p className="text-xs -mt-2 mb-4 text-slate">
                Uppskattad nätverkstäckning: {MOBIL_NATVERKSTACKNING[operatorMobil]}% av Sveriges befolkning.
              </p>
            )}
            <Field label="Har du obegränsat med data?">
              <BoolPill value={obegransatData} onChange={setObegransatData} />
            </Field>
            {obegransatData === false && (
              <Field label="Datamängd (GB)">
                <input type="number" className={inputClass} value={dataGb} onChange={(e) => setDataGb(e.target.value)} placeholder="10" />
              </Field>
            )}
            <Field label="Pris (kr/månad)">
              <input type="number" className={inputClass} value={prisMobil} onChange={(e) => setPrisMobil(e.target.value)} placeholder="299" />
            </Field>
          </>
        )}

        {showLookup && selectedPaket ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pris (kr/månad)">
              <input type="number" className={inputClass} value={prisMobil} onChange={(e) => setPrisMobil(e.target.value)} placeholder="299" />
            </Field>
            <Field label="Bindningstid (månader, valfritt)">
              <input type="number" className={inputClass} value={bindningMobil} onChange={(e) => setBindningMobil(e.target.value)} placeholder="24" />
            </Field>
          </div>
        ) : (
          <Field label="Bindningstid (månader, valfritt)">
            <input type="number" className={inputClass} value={bindningMobil} onChange={(e) => setBindningMobil(e.target.value)} placeholder="24" />
          </Field>
        )}
        <Field label="Förfallodag (valfritt)">
          <input type="date" className={inputClass} value={forfallodagMobil} onChange={(e) => setForfallodagMobil(e.target.value)} />
        </Field>
        <FormActions
          valid={valid}
          onCancel={onCancel}
          onSave={() =>
            onSave({
              id: createItemId(),
              kind: "telekom",
              typ: "mobil",
              operator: operatorMobil.trim(),
              telefonnummer: telefonnummer.trim() || undefined,
              dataGb: dataGb ? Number(dataGb) : undefined,
              obegransatData: !!obegransatData,
              prisPerManad: Number(prisMobil),
              bindningstidManader: bindningMobil ? Number(bindningMobil) : undefined,
              forfallodatum: forfallodagMobil ? isoToSwedishDate(forfallodagMobil) : undefined,
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
          <PillGroupWithOther options={TELEKOM_BREDBAND_OPERATORER} value={operatorBredband} onChange={setOperatorBredband} />
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
        <PillGroupWithOther options={TV_STREAMING_TJANSTER} value={tjanst} onChange={setTjanst} />
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

"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HelperTip } from "@/components/HelperTip";
import { BoolPill, Field, MultiPillGroup, PillGroup, inputClass } from "@/components/onboarding/shared";
import type {
  BilAgarstatus,
  BilAnvandning,
  BilDrivmedel,
  BilFinansiering,
  BilItem,
  BilKorkortslangd,
  BilLarm,
  BilOnskadOmfattning,
  BilOnskadSjalvrisk,
  BilParkering,
  BilPremietyp,
  BilTillval,
} from "@/lib/items";
import type { Quote } from "@/lib/quote";

const AGARSTATUS_OPTIONS = ["ager", "ska_kopa", "nyligen_kopt"] as const;
const AGARSTATUS_LABELS: Record<BilAgarstatus, string> = {
  ager: "Jag äger den redan",
  ska_kopa: "Jag ska köpa den",
  nyligen_kopt: "Jag har precis köpt den",
};

const FINANSIERING_OPTIONS = ["kontant", "avbetalning", "kredit", "leasing"] as const;
const FINANSIERING_LABELS: Record<BilFinansiering, string> = {
  kontant: "Kontant / egna pengar",
  avbetalning: "Avbetalning",
  kredit: "Kredit",
  leasing: "Leasing",
};

const DRIVMEDEL_OPTIONS = ["bensin", "diesel", "el", "laddhybrid", "hybrid", "etanol", "gas"] as const;
const DRIVMEDEL_LABELS: Record<BilDrivmedel, string> = {
  bensin: "Bensin",
  diesel: "Diesel",
  el: "El",
  laddhybrid: "Laddhybrid",
  hybrid: "Hybrid",
  etanol: "Etanol",
  gas: "Gas",
};

const LARM_OPTIONS = ["nej", "larm_klass_1_3", "sparsandare"] as const;
const LARM_LABELS: Record<BilLarm, string> = {
  nej: "Nej",
  larm_klass_1_3: "Ja, godkänt larm",
  sparsandare: "Ja, spårsändare",
};

const ANVANDNING_OPTIONS = ["privat", "tjanst", "yrkesmassig_trafik", "uthyrning"] as const;
const ANVANDNING_LABELS: Record<BilAnvandning, string> = {
  privat: "Privat",
  tjanst: "Tjänst",
  yrkesmassig_trafik: "Yrkesmässig trafik",
  uthyrning: "Uthyrning",
};

const PARKERING_OPTIONS = ["garage", "carport", "egen_tomt", "gata", "parkeringshus"] as const;
const PARKERING_LABELS: Record<BilParkering, string> = {
  garage: "Garage",
  carport: "Carport",
  egen_tomt: "Egen tomt",
  gata: "Gatan",
  parkeringshus: "Parkeringshus",
};

const PREMIETYP_OPTIONS = ["fast", "kilometerbaserad"] as const;
const PREMIETYP_LABELS: Record<BilPremietyp, string> = {
  fast: "Fast premie",
  kilometerbaserad: "Kilometerbaserad",
};

const KORKORTSLANGD_OPTIONS = ["under_1_ar", "1_3_ar", "3_5_ar", "over_5_ar"] as const;
const KORKORTSLANGD_LABELS: Record<BilKorkortslangd, string> = {
  under_1_ar: "Mindre än 1 år",
  "1_3_ar": "1–3 år",
  "3_5_ar": "3–5 år",
  over_5_ar: "Mer än 5 år",
};

const OMFATTNING_OPTIONS = ["trafik", "halv", "hel"] as const;
const OMFATTNING_LABELS: Record<BilOnskadOmfattning, string> = {
  trafik: "Trafik",
  halv: "Halvförsäkring",
  hel: "Helförsäkring",
};

const SJALVRISK_OPTIONS = ["3000", "5000", "8000"] as const;
type SjalvriskOption = (typeof SJALVRISK_OPTIONS)[number];
const SJALVRISK_LABELS: Record<SjalvriskOption, string> = { "3000": "3 000 kr", "5000": "5 000 kr", "8000": "8 000 kr" };

const TILLVAL_OPTIONS = ["hyrbil", "assistans", "djurkollision", "maskinskydd", "utokad_glas"] as const;
const TILLVAL_LABELS: Record<BilTillval, string> = {
  hyrbil: "Hyrbil",
  assistans: "Assistans",
  djurkollision: "Djurkollision",
  maskinskydd: "Maskinskydd",
  utokad_glas: "Utökad glasförsäkring",
};

const PARKERING_FROM_FORVARING: Record<NonNullable<BilItem["forvaring"]>, BilParkering> = {
  garage: "garage",
  uppfart: "carport",
  gata: "gata",
};

function snapSjalvrisk(v: number | undefined): SjalvriskOption {
  if (!v || v <= 3500) return "3000";
  if (v <= 6500) return "5000";
  return "8000";
}

function guessOmfattning(v: string | undefined): BilOnskadOmfattning {
  const s = (v ?? "").toLowerCase();
  if (s.includes("halv")) return "halv";
  if (s.includes("trafik") && !s.includes("hel")) return "trafik";
  return "hel";
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wide text-slate mt-8 mb-3 first:mt-0">{title}</h2>;
}

// Behovsanalysen för Bil — ersätter den generiska ja/nej-frågeguiden
// (NeedsAnalysis.tsx) för kind "bil" med det riktiga frågebatteriet
// (BIL01-BIL30, minus rent transaktionella fält som redan täcks av
// CheckoutForm vid tecknandet: namn, personnummer, betalningsmetod,
// e-post, mobil, samt "har du en nuvarande försäkring" som CheckoutForm
// redan frågar oavsett saktyp). Svaren ligger till grund för
// rekommendationen bara som förklaring — samma "matchedNeeds"-mekanik
// som redan finns, inte en egen prismodell (item-quotes.ts rörs inte).
export function BilNeedsForm({
  item,
  currentPolicy,
  onDone,
  onBack,
}: {
  item: BilItem;
  currentPolicy?: Quote;
  onDone: (updatedItem: BilItem, needs: string[]) => void;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<"choice" | "form">(currentPolicy && !item.finansiering ? "choice" : "form");

  const [agarstatus, setAgarstatus] = useState<BilAgarstatus | null>(item.agarstatus ?? null);
  const [finansiering, setFinansiering] = useState<BilFinansiering | null>(item.finansiering ?? null);
  const [langivare, setLangivare] = useState(item.langivare ?? "");
  const [extrautrustning, setExtrautrustning] = useState<boolean | null>(item.extrautrustning ?? null);
  const [extrautrustningVarde, setExtrautrustningVarde] = useState(
    item.extrautrustningVarde ? String(item.extrautrustningVarde) : ""
  );
  const [ombyggd, setOmbyggd] = useState<boolean | null>(item.ombyggd ?? null);
  const [drivmedel, setDrivmedel] = useState<BilDrivmedel | null>(item.drivmedel ?? null);
  const [laddboxHemma, setLaddboxHemma] = useState<boolean | null>(item.laddboxHemma ?? null);
  const [larm, setLarm] = useState<BilLarm | null>(item.larm ?? null);
  const [anvandning, setAnvandning] = useState<BilAnvandning | null>(item.anvandning ?? null);
  const [natparkering, setNatparkering] = useState<BilParkering | null>(
    item.natparkering ?? (item.forvaring ? PARKERING_FROM_FORVARING[item.forvaring] : null)
  );
  const [premietyp, setPremietyp] = useState<BilPremietyp | null>(item.premietyp ?? null);
  const [underXAr, setUnderXAr] = useState<boolean | null>(item.underXAr ?? null);
  const [korkortslangd, setKorkortslangd] = useState<BilKorkortslangd | null>(item.korkortslangd ?? null);
  const [skadefriaAr, setSkadefriaAr] = useState(item.skadefriaAr !== undefined ? String(item.skadefriaAr) : "");
  const [skadorSenaste5Ar, setSkadorSenaste5Ar] = useState<boolean | null>(item.skadorSenaste5Ar ?? null);
  const [skadorAntal, setSkadorAntal] = useState(item.skadorAntal ? String(item.skadorAntal) : "");
  const [omfattning, setOmfattning] = useState<BilOnskadOmfattning | null>(item.onskadOmfattning ?? null);
  const [sjalvrisk, setSjalvrisk] = useState<SjalvriskOption | null>(
    item.onskadSjalvrisk ? (String(item.onskadSjalvrisk) as SjalvriskOption) : null
  );
  const [tillval, setTillval] = useState<BilTillval[]>(item.onskadeTillval ?? []);
  const [andraForsakringarSammaBolag, setAndraForsakringarSammaBolag] = useState<boolean | null>(
    item.andraForsakringarSammaBolag ?? null
  );

  const startQuick = () => {
    setFinansiering("kontant");
    setExtrautrustning(false);
    setOmbyggd(false);
    setLarm("nej");
    setAnvandning("privat");
    if (!natparkering) setNatparkering("garage");
    setUnderXAr(false);
    setKorkortslangd("over_5_ar");
    setSkadorSenaste5Ar(false);
    setOmfattning(guessOmfattning(currentPolicy?.omfattning));
    setSjalvrisk(snapSjalvrisk(currentPolicy?.selfRisk));
    setAndraForsakringarSammaBolag(false);
    setPhase("form");
  };

  const valid =
    finansiering !== null &&
    ombyggd !== null &&
    anvandning !== null &&
    natparkering !== null &&
    skadefriaAr.trim().length > 0 &&
    skadorSenaste5Ar !== null &&
    omfattning !== null &&
    sjalvrisk !== null;

  const submit = () => {
    if (!valid) return;
    const updated: BilItem = {
      ...item,
      agarstatus: agarstatus ?? undefined,
      finansiering: finansiering!,
      langivare: finansiering !== "kontant" ? langivare.trim() || undefined : undefined,
      extrautrustning: extrautrustning ?? undefined,
      extrautrustningVarde: extrautrustning && extrautrustningVarde ? Number(extrautrustningVarde) : undefined,
      ombyggd: !!ombyggd,
      drivmedel: drivmedel ?? undefined,
      laddboxHemma: laddboxHemma ?? undefined,
      larm: larm ?? undefined,
      anvandning: anvandning!,
      natparkering: natparkering!,
      premietyp: premietyp ?? undefined,
      underXAr: underXAr ?? undefined,
      korkortslangd: korkortslangd ?? undefined,
      skadefriaAr: Number(skadefriaAr) || 0,
      skadorSenaste5Ar: !!skadorSenaste5Ar,
      skadorAntal: skadorSenaste5Ar && skadorAntal ? Number(skadorAntal) : undefined,
      onskadOmfattning: omfattning!,
      onskadSjalvrisk: Number(sjalvrisk) as BilOnskadSjalvrisk,
      onskadeTillval: tillval,
      andraForsakringarSammaBolag: andraForsakringarSammaBolag ?? undefined,
    };
    onDone(updated, tillval);
  };

  if (phase === "choice") {
    return (
      <>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100">
          <ArrowLeft size={15} /> Tillbaka
        </button>
        <span className="bd-eyebrow">Behovsanalys</span>
        <h1 className="bd-display text-2xl mt-3 mb-4">Vill du utgå från ditt nuvarande avtal?</h1>
        <HelperTip dismissible={false} emotion="nyfiken" className="mb-5">
          Jag kan förifylla det mesta utifrån ditt avtal hos {currentPolicy!.name} — du kollar igenom och ändrar det
          som inte stämmer. Eller så svarar du på allt själv, till exempel om dina behov har ändrats.
        </HelperTip>
        <div className="flex flex-col gap-3">
          <button onClick={startQuick} className="bd-card p-4 rounded-2xl border border-line bg-white text-left">
            <div className="text-sm font-semibold mb-1">Snabbväg — matcha nuvarande</div>
            <div className="text-xs text-slate">Vi fyller i det vi redan vet. Du kollar igenom och ändrar det som inte stämmer.</div>
          </button>
          <button onClick={() => setPhase("form")} className="bd-card p-4 rounded-2xl border border-line bg-white text-left">
            <div className="text-sm font-semibold mb-1">Fyll i mina behov själv</div>
            <div className="text-xs text-slate">Svara på allt från grunden, oavsett vad du har idag.</div>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => (currentPolicy ? setPhase("choice") : onBack())}
        className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100"
      >
        <ArrowLeft size={15} /> Tillbaka
      </button>
      <span className="bd-eyebrow">Behovsanalys</span>
      <h1 className="bd-display text-2xl mt-3 mb-1">Vad är viktigt för dig?</h1>
      <p className="text-sm mb-2 text-slate">Det hjälper oss ge dig en mer rättvisande jämförelse för din bil.</p>

      <SectionHeading title="Om bilen" />
      <Field label="Äger du bilen redan eller ska du köpa den? (valfritt)">
        <PillGroup options={AGARSTATUS_OPTIONS} labels={AGARSTATUS_LABELS} value={agarstatus} onChange={setAgarstatus} />
      </Field>
      <Field label="Är bilen köpt kontant, på avbetalning, kredit eller leasad?">
        <PillGroup options={FINANSIERING_OPTIONS} labels={FINANSIERING_LABELS} value={finansiering} onChange={setFinansiering} />
      </Field>
      {finansiering && finansiering !== "kontant" && (
        <Field label="Vilken bank eller finansbolag? (valfritt)">
          <input className={inputClass} value={langivare} onChange={(e) => setLangivare(e.target.value)} placeholder="T.ex. Volvofinans" />
        </Field>
      )}
      <Field label="Har bilen extrautrustning utöver standard? (valfritt)">
        <BoolPill value={extrautrustning} onChange={setExtrautrustning} />
      </Field>
      {extrautrustning && (
        <Field label="Uppskattat värde, kr (valfritt)">
          <input
            type="number"
            className={inputClass}
            value={extrautrustningVarde}
            onChange={(e) => setExtrautrustningVarde(e.target.value)}
            placeholder="20000"
          />
        </Field>
      )}
      <Field label="Är bilen ombyggd, trimmad eller amatörbyggd?">
        <BoolPill value={ombyggd} onChange={setOmbyggd} />
      </Field>
      {ombyggd && (
        <HelperTip dismissible={false} emotion="nyfiken" className="mb-4" size={32}>
          En ombyggd bil kan innebära avslag eller särskild prövning hos vissa bolag — bra att veta innan du jämför.
        </HelperTip>
      )}
      <Field label="Är bilen elbil eller laddhybrid? (valfritt)">
        <PillGroup options={DRIVMEDEL_OPTIONS} labels={DRIVMEDEL_LABELS} value={drivmedel} onChange={setDrivmedel} />
      </Field>
      {(drivmedel === "el" || drivmedel === "laddhybrid") && (
        <Field label="Har du laddbox hemma? (valfritt)">
          <BoolPill value={laddboxHemma} onChange={setLaddboxHemma} />
        </Field>
      )}
      <Field label="Har bilen godkänt larm eller spårsändare? (valfritt)">
        <PillGroup options={LARM_OPTIONS} labels={LARM_LABELS} value={larm} onChange={setLarm} />
      </Field>

      <SectionHeading title="Användning" />
      <Field label="Används bilen privat eller i näringsverksamhet?">
        <PillGroup options={ANVANDNING_OPTIONS} labels={ANVANDNING_LABELS} value={anvandning} onChange={setAnvandning} />
      </Field>
      {anvandning === "yrkesmassig_trafik" && (
        <HelperTip dismissible={false} emotion="nyfiken" className="mb-4" size={32}>
          Yrkesmässig trafik (taxi, bud m.m.) kräver en annan produkt än vanlig bilförsäkring — jag flaggar det åt
          dig så du inte jämför fel produkt.
        </HelperTip>
      )}
      {item.arligKorstracka && (
        <p className="text-xs -mt-2 mb-4 text-slate">Från dina uppgifter: ca {item.arligKorstracka} mil/år.</p>
      )}
      <Field label="Var står bilen på natten?">
        <PillGroup options={PARKERING_OPTIONS} labels={PARKERING_LABELS} value={natparkering} onChange={setNatparkering} />
      </Field>
      <Field label="Vill du ha fast eller kilometerbaserad premie? (valfritt)">
        <PillGroup options={PREMIETYP_OPTIONS} labels={PREMIETYP_LABELS} value={premietyp} onChange={setPremietyp} />
      </Field>

      <SectionHeading title="Förare" />
      <Field label="Kommer någon under 25 år att köra bilen? (valfritt)">
        <BoolPill value={underXAr} onChange={setUnderXAr} />
      </Field>
      {underXAr && (
        <HelperTip dismissible={false} emotion="nyfiken" className="mb-4" size={32}>
          Unga förare är en klassisk premiehöjare — bolagen väger in det olika mycket, så det kan löna sig att
          jämföra extra noga här.
        </HelperTip>
      )}
      <Field label="Hur länge har du haft körkort? (valfritt)">
        <PillGroup options={KORKORTSLANGD_OPTIONS} labels={KORKORTSLANGD_LABELS} value={korkortslangd} onChange={setKorkortslangd} />
      </Field>

      <SectionHeading title="Historik" />
      <Field label="Hur många skadefria år har du? (0–10+)">
        <input
          type="number"
          className={inputClass}
          value={skadefriaAr}
          onChange={(e) => setSkadefriaAr(e.target.value)}
          placeholder="T.ex. 5"
          min={0}
          max={10}
        />
      </Field>
      <HelperTip dismissible={false} emotion="nyfiken" className="mb-4" size={32}>
        Dina skadefria år (bonus) flyttar med dig till det nya bolaget — glöm inte att fylla i dem.
      </HelperTip>
      <Field label="Har du haft några skador de senaste 3–5 åren?">
        <BoolPill value={skadorSenaste5Ar} onChange={setSkadorSenaste5Ar} />
      </Field>
      {skadorSenaste5Ar && (
        <Field label="Hur många? (valfritt)">
          <input type="number" className={inputClass} value={skadorAntal} onChange={(e) => setSkadorAntal(e.target.value)} placeholder="1" />
        </Field>
      )}

      <SectionHeading title="Omfattning" />
      <Field label="Vilken omfattning vill du ha?">
        <PillGroup options={OMFATTNING_OPTIONS} labels={OMFATTNING_LABELS} value={omfattning} onChange={setOmfattning} />
      </Field>
      <HelperTip dismissible={false} emotion="nyfiken" className="mb-4" size={32}>
        Trafikförsäkring är lagkrav på ett påställt fordon — den ingår alltid, oavsett vilken nivå du väljer ovan.
      </HelperTip>
      <Field label="Vilken självrisk vill du ha?">
        <PillGroup options={SJALVRISK_OPTIONS} labels={SJALVRISK_LABELS} value={sjalvrisk} onChange={setSjalvrisk} />
      </Field>
      <Field label="Vill du lägga till något? (valfritt)">
        <MultiPillGroup options={TILLVAL_OPTIONS} labels={TILLVAL_LABELS} value={tillval} onChange={setTillval} />
      </Field>
      <Field label="Har du andra försäkringar hos samma bolag? (valfritt)">
        <BoolPill value={andraForsakringarSammaBolag} onChange={setAndraForsakringarSammaBolag} />
      </Field>
      {andraForsakringarSammaBolag && (
        <HelperTip dismissible={false} emotion="nyfiken" className="mb-4" size={32}>
          Bra att veta — samlingsrabatt ger ofta 10–20 % lägre pris när flera försäkringar ligger hos samma bolag.
        </HelperTip>
      )}

      <button
        onClick={submit}
        disabled={!valid}
        className="bd-btn w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
      >
        Visa min jämförelse <ArrowRight size={16} />
      </button>
    </>
  );
}

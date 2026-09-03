"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { HelperTip } from "@/components/HelperTip";
import { QuestionFlow } from "@/components/QuestionFlow";
import type { QuestionStep } from "@/lib/question-flow";
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

const PARKERING_FROM_FORVARING: Record<NonNullable<BilItem["forvaring"]>, BilParkering> = {
  garage: "garage",
  uppfart: "carport",
  gata: "gata",
};

function snapSjalvrisk(v: number | undefined): string {
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

// Frågebatteriet för Bil (BIL01-BIL30, minus rent transaktionella fält som
// redan täcks av CheckoutForm vid tecknandet: namn, personnummer,
// betalningsmetod, e-post, mobil, "har du en nuvarande försäkring").
// Ordnat i ett naturligt samtalsflöde: bilen själv → hur den används →
// föraren → historik → önskad omfattning. Varje tips är hämtat från
// Kommentar-kolumnen i produkttradets frågespec, inte påhittat.
function buildSteps(item: BilItem): QuestionStep[] {
  return [
    {
      id: "agarstatus",
      prompt: "Äger du bilen redan eller ska du köpa den?",
      summaryLabel: "Äganderätt",
      tip: "Det här styr när försäkringen ska börja gälla och om ägarbytet behöver hanteras samtidigt.",
      type: "pill",
      options: [
        { value: "ager", label: "Jag äger den redan" },
        { value: "ska_kopa", label: "Jag ska köpa den" },
        { value: "nyligen_kopt", label: "Jag har precis köpt den" },
      ],
    },
    {
      id: "finansiering",
      prompt: "Är bilen köpt kontant, på avbetalning, kredit eller leasad?",
      summaryLabel: "Finansiering",
      tip: "Har du lån eller leasing på bilen måste panthavaren (banken) anges i försäkringsbrevet.",
      type: "pill",
      required: true,
      options: [
        { value: "kontant", label: "Kontant / egna pengar" },
        { value: "avbetalning", label: "Avbetalning" },
        { value: "kredit", label: "Kredit" },
        { value: "leasing", label: "Leasing" },
      ],
    },
    {
      id: "langivare",
      prompt: "Vilken bank eller vilket finansbolag?",
      summaryLabel: "Långivare",
      tip: "Bara namnet på banken/finansbolaget — vi fyller i resten åt dig.",
      type: "text",
      placeholder: "T.ex. Volvofinans",
      show: (a) => a.finansiering !== "kontant",
    },
    {
      id: "ombyggd",
      prompt: "Är bilen ombyggd, trimmad eller amatörbyggd?",
      summaryLabel: "Ombyggd",
      tip: "En ombyggd bil kan innebära avslag eller särskild prövning hos vissa bolag — bra att veta innan du jämför.",
      type: "bool",
      required: true,
    },
    {
      id: "drivmedel",
      prompt: "Är bilen elbil eller laddhybrid?",
      summaryLabel: "Drivmedel",
      tip: "Elbilar prissätts ofta separat och kan ha eget batteri- och laddskydd.",
      type: "pill",
      options: [
        { value: "bensin", label: "Bensin" },
        { value: "diesel", label: "Diesel" },
        { value: "el", label: "El" },
        { value: "laddhybrid", label: "Laddhybrid" },
        { value: "hybrid", label: "Hybrid" },
        { value: "etanol", label: "Etanol" },
        { value: "gas", label: "Gas" },
      ],
    },
    {
      id: "laddboxHemma",
      prompt: "Har du laddbox hemma?",
      summaryLabel: "Laddbox hemma",
      tip: "Laddboxen kan behöva täckas via din hem- eller villaförsäkring, inte bilförsäkringen.",
      type: "bool",
      show: (a) => a.drivmedel === "el" || a.drivmedel === "laddhybrid",
    },
    {
      id: "extrautrustning",
      prompt: "Har bilen extrautrustning utöver standard?",
      summaryLabel: "Extrautrustning",
      tip: "T.ex. eftermonterade fälgar, ljudanläggning eller dragkrok.",
      type: "bool",
    },
    {
      id: "extrautrustningVarde",
      prompt: "Ungefär vad är den värd, i kronor?",
      summaryLabel: "Extrautrustning, värde",
      tip: "En ungefärlig siffra räcker.",
      type: "number",
      placeholder: "20000",
      show: (a) => a.extrautrustning === true,
    },
    {
      id: "larm",
      prompt: "Har bilen godkänt larm eller spårsändare?",
      summaryLabel: "Larm",
      tip: "Krävs ofta på dyrare bilar, och kan ge rabatt på premien.",
      type: "pill",
      options: [
        { value: "nej", label: "Nej" },
        { value: "larm_klass_1_3", label: "Ja, godkänt larm" },
        { value: "sparsandare", label: "Ja, spårsändare" },
      ],
    },
    {
      id: "anvandning",
      prompt: "Används bilen privat eller i näringsverksamhet?",
      summaryLabel: "Användning",
      tip: "Yrkesmässig trafik (taxi, bud m.m.) kräver en annan produkt än vanlig bilförsäkring.",
      type: "pill",
      required: true,
      options: [
        { value: "privat", label: "Privat" },
        { value: "tjanst", label: "Tjänst" },
        { value: "yrkesmassig_trafik", label: "Yrkesmässig trafik" },
        { value: "uthyrning", label: "Uthyrning" },
      ],
    },
    {
      id: "natparkering",
      prompt: "Var står bilen på natten?",
      summaryLabel: "Parkering",
      tip: item.arligKorstracka
        ? `Det här påverkar stöldrisken. Förresten, från dina uppgifter kör du ca ${item.arligKorstracka} mil/år.`
        : "Det här påverkar stöldrisken, och därmed priset.",
      type: "pill",
      required: true,
      options: [
        { value: "garage", label: "Garage" },
        { value: "carport", label: "Carport" },
        { value: "egen_tomt", label: "Egen tomt" },
        { value: "gata", label: "Gatan" },
        { value: "parkeringshus", label: "Parkeringshus" },
      ],
    },
    {
      id: "premietyp",
      prompt: "Vill du ha fast eller kilometerbaserad premie?",
      summaryLabel: "Premietyp",
      tip: "Kilometerbaserad premie (t.ex. Paydrive) är ofta värt att kolla om du kör få mil.",
      type: "pill",
      options: [
        { value: "fast", label: "Fast premie" },
        { value: "kilometerbaserad", label: "Kilometerbaserad" },
      ],
    },
    {
      id: "underXAr",
      prompt: "Kommer någon under 25 år att köra bilen?",
      summaryLabel: "Förare under 25",
      tip: "En klassisk premiehöjare — bolagen väger in det olika mycket, så det kan löna sig att jämföra extra noga här.",
      type: "bool",
    },
    {
      id: "korkortslangd",
      prompt: "Hur länge har du haft körkort?",
      summaryLabel: "Körkortslängd",
      tip: "Vissa bolag frågar specifikt om det här, andra räknar bara på ålder.",
      type: "pill",
      options: [
        { value: "under_1_ar", label: "Mindre än 1 år" },
        { value: "1_3_ar", label: "1–3 år" },
        { value: "3_5_ar", label: "3–5 år" },
        { value: "over_5_ar", label: "Mer än 5 år" },
      ],
    },
    {
      id: "skadefriaAr",
      prompt: "Hur många skadefria år har du? (0–10+)",
      summaryLabel: "Skadefria år",
      tip: "Dina skadefria år (bonus) flyttar med dig till det nya bolaget — glöm inte att fylla i dem.",
      type: "number",
      required: true,
      placeholder: "T.ex. 5",
    },
    {
      id: "skadorSenaste5Ar",
      prompt: "Har du haft några skador de senaste 3–5 åren?",
      summaryLabel: "Skador senaste åren",
      tip: "Vållande skador väger tyngst i bolagens bedömning.",
      type: "bool",
      required: true,
    },
    {
      id: "skadorAntal",
      prompt: "Hur många skador?",
      summaryLabel: "Antal skador",
      tip: "En ungefärlig siffra räcker.",
      type: "number",
      placeholder: "1",
      show: (a) => a.skadorSenaste5Ar === true,
    },
    {
      id: "omfattning",
      prompt: "Vilken omfattning vill du ha?",
      summaryLabel: "Omfattning",
      tip: "Trafikförsäkring är lagkrav på ett påställt fordon — den ingår alltid, oavsett vilken nivå du väljer.",
      type: "pill",
      required: true,
      options: [
        { value: "trafik", label: "Trafik" },
        { value: "halv", label: "Halvförsäkring" },
        { value: "hel", label: "Helförsäkring" },
      ],
    },
    {
      id: "sjalvrisk",
      prompt: "Vilken självrisk vill du ha?",
      summaryLabel: "Självrisk",
      tip: "Högre självrisk sänker premien — men kostar mer om något faktiskt händer.",
      type: "pill",
      required: true,
      options: [
        { value: "3000", label: "3 000 kr" },
        { value: "5000", label: "5 000 kr" },
        { value: "8000", label: "8 000 kr" },
      ],
    },
    {
      id: "tillval",
      prompt: "Vill du lägga till något?",
      summaryLabel: "Tillval",
      tip: "Tillvalen skiljer sig kraftigt mellan bolag — bra att veta vad du vill ha innan du jämför.",
      type: "multipill",
      options: [
        { value: "hyrbil", label: "Hyrbil" },
        { value: "assistans", label: "Assistans" },
        { value: "djurkollision", label: "Djurkollision" },
        { value: "maskinskydd", label: "Maskinskydd" },
        { value: "utokad_glas", label: "Utökad glasförsäkring" },
      ],
    },
    {
      id: "andraForsakringarSammaBolag",
      prompt: "Har du andra försäkringar hos samma bolag?",
      summaryLabel: "Andra försäkringar samma bolag",
      tip: "Samlingsrabatt ger ofta 10–20 % lägre pris när flera försäkringar ligger hos samma bolag.",
      type: "bool",
    },
  ];
}

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
  const hasPriorAnswers = item.finansiering !== undefined;
  const [phase, setPhase] = useState<"choice" | "form">(currentPolicy && !hasPriorAnswers ? "choice" : "form");
  const [initialAnswers, setInitialAnswers] = useState<Record<string, unknown>>(() => ({
    agarstatus: item.agarstatus,
    finansiering: item.finansiering,
    langivare: item.langivare,
    ombyggd: item.ombyggd,
    drivmedel: item.drivmedel,
    laddboxHemma: item.laddboxHemma,
    extrautrustning: item.extrautrustning,
    extrautrustningVarde: item.extrautrustningVarde ? String(item.extrautrustningVarde) : undefined,
    larm: item.larm,
    anvandning: item.anvandning,
    natparkering: item.natparkering ?? (item.forvaring ? PARKERING_FROM_FORVARING[item.forvaring] : undefined),
    premietyp: item.premietyp,
    underXAr: item.underXAr,
    korkortslangd: item.korkortslangd,
    skadefriaAr: item.skadefriaAr !== undefined ? String(item.skadefriaAr) : undefined,
    skadorSenaste5Ar: item.skadorSenaste5Ar,
    skadorAntal: item.skadorAntal ? String(item.skadorAntal) : undefined,
    omfattning: item.onskadOmfattning,
    sjalvrisk: item.onskadSjalvrisk ? String(item.onskadSjalvrisk) : undefined,
    tillval: item.onskadeTillval ?? [],
    andraForsakringarSammaBolag: item.andraForsakringarSammaBolag,
  }));

  const startQuick = () => {
    setInitialAnswers((prev) => ({
      ...prev,
      finansiering: prev.finansiering ?? "kontant",
      ombyggd: prev.ombyggd ?? false,
      larm: prev.larm ?? "nej",
      anvandning: prev.anvandning ?? "privat",
      natparkering: prev.natparkering ?? "garage",
      underXAr: prev.underXAr ?? false,
      korkortslangd: prev.korkortslangd ?? "over_5_ar",
      skadorSenaste5Ar: prev.skadorSenaste5Ar ?? false,
      omfattning: prev.omfattning ?? guessOmfattning(currentPolicy?.omfattning),
      sjalvrisk: prev.sjalvrisk ?? snapSjalvrisk(currentPolicy?.selfRisk),
      andraForsakringarSammaBolag: prev.andraForsakringarSammaBolag ?? false,
    }));
    setPhase("form");
  };

  const handleDone = (answers: Record<string, unknown>) => {
    const tillval = (answers.tillval as BilTillval[] | undefined) ?? [];
    const updated: BilItem = {
      ...item,
      agarstatus: answers.agarstatus as BilAgarstatus | undefined,
      finansiering: answers.finansiering as BilFinansiering,
      langivare: (answers.langivare as string | undefined)?.trim() || undefined,
      extrautrustning: answers.extrautrustning as boolean | undefined,
      extrautrustningVarde: answers.extrautrustningVarde ? Number(answers.extrautrustningVarde) : undefined,
      ombyggd: !!answers.ombyggd,
      drivmedel: answers.drivmedel as BilDrivmedel | undefined,
      laddboxHemma: answers.laddboxHemma as boolean | undefined,
      larm: answers.larm as BilLarm | undefined,
      anvandning: answers.anvandning as BilAnvandning,
      natparkering: answers.natparkering as BilParkering,
      premietyp: answers.premietyp as BilPremietyp | undefined,
      underXAr: answers.underXAr as boolean | undefined,
      korkortslangd: answers.korkortslangd as BilKorkortslangd | undefined,
      skadefriaAr: Number(answers.skadefriaAr) || 0,
      skadorSenaste5Ar: !!answers.skadorSenaste5Ar,
      skadorAntal: answers.skadorAntal ? Number(answers.skadorAntal) : undefined,
      onskadOmfattning: answers.omfattning as BilOnskadOmfattning,
      onskadSjalvrisk: Number(answers.sjalvrisk) as BilOnskadSjalvrisk,
      onskadeTillval: tillval,
      andraForsakringarSammaBolag: answers.andraForsakringarSammaBolag as boolean | undefined,
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
    <QuestionFlow
      eyebrow="Behovsanalys"
      title="Vad är viktigt för dig?"
      intro="Det hjälper oss ge dig en mer rättvisande jämförelse för din bil."
      steps={buildSteps(item)}
      initialAnswers={initialAnswers}
      onDone={handleDone}
      onBack={() => (currentPolicy ? setPhase("choice") : onBack())}
    />
  );
}

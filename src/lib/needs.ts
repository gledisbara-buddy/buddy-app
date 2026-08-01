import type { ComparableItem } from "@/lib/items";

// Behovsanalys innan jämförelse — bara de fem Försäkring-kategorierna har ett
// riskbedömnings-koncept. Telekom/Kreditkort/El har redan ett pris kunden
// själv angett och saknar motsvarande "behov".
export type NeedsKind = "boende" | "bil" | "ovrigt_fordon" | "person" | "djur";

export type NeedOption = { id: string; label: string };

export type NeedQuestion =
  | { id: string; label: string; type: "yesno"; prompt: string }
  | { id: string; type: "multi"; prompt: string; options: NeedOption[] };

const BOENDE_QUESTIONS: NeedQuestion[] = [
  {
    id: "vardefulla_saker",
    type: "multi",
    prompt: "Har du något av det här hemma som du vill försäkra extra?",
    options: [
      { id: "cykel", label: "Cykel över 15 000 kr" },
      { id: "sport", label: "Golf-, skid- eller annan dyr fritidsutrustning" },
      { id: "smycken", label: "Smycken eller klockor över 30 000 kr" },
      { id: "elektronik", label: "Dyr hemelektronik (dator, ljud, kamera)" },
    ],
  },
  {
    id: "resa",
    label: "Reseskydd",
    type: "yesno",
    prompt: "Reser du utomlands minst en gång per år och vill ha ett starkare reseskydd?",
  },
  {
    id: "drulle",
    label: "Drulle / Allrisk",
    type: "yesno",
    prompt: "Vill du ha skydd för plötsliga olyckshändelser i hemmet, till exempel om du tappar mobilen i golvet?",
  },
  {
    id: "hemmakontor",
    label: "Hemmakontor",
    type: "yesno",
    prompt: "Jobbar du hemifrån med dyr kontorsutrustning du vill skydda extra?",
  },
  {
    id: "andrahand",
    label: "Andrahandsuthyrning",
    type: "yesno",
    prompt: "Hyr du ut bostaden i andra hand eller har du en inneboende?",
  },
];

const BIL_QUESTIONS: NeedQuestion[] = [
  {
    id: "hyrbil",
    label: "Hyrbil vid verkstadsbesök",
    type: "yesno",
    prompt: "Vill du ha rätt till hyrbil om bilen behöver lämnas in på verkstad?",
  },
  {
    id: "assistans",
    label: "Vägassistans dygnet runt",
    type: "yesno",
    prompt: "Vill du ha vägassistans dygnet runt om bilen går sönder eller du kör slut på bränsle?",
  },
  {
    id: "utlandskorning",
    label: "Mycket körning utomlands",
    type: "yesno",
    prompt: "Kör du bilen utomlands ofta, till exempel på semester?",
  },
  {
    id: "ungForare",
    label: "Förare under 25 år",
    type: "yesno",
    prompt: "Körs bilen regelbundet av en förare under 25 år?",
  },
  {
    id: "flerforare",
    label: "Flera regelbundna förare",
    type: "yesno",
    prompt: "Kör fler än en person bilen regelbundet?",
  },
  {
    id: "tillbehor",
    label: "Dyra tillbehör",
    type: "yesno",
    prompt: "Har bilen dyra tillbehör, till exempel eftermonterade fälgar eller ljudanläggning?",
  },
];

const OVRIGT_FORDON_QUESTIONS: NeedQuestion[] = [
  {
    id: "sasongsforvaring",
    label: "Förvaras inomhus utanför säsong",
    type: "yesno",
    prompt: "Förvaras fordonet inomhus, till exempel i garage, när det inte används?",
  },
  {
    id: "stold",
    label: "Högt värde / stöldrisk",
    type: "yesno",
    prompt: "Är fordonet av högt värde eller står det där stöldrisken är förhöjd?",
  },
  {
    id: "transport",
    label: "Transport-/bogseringsskydd",
    type: "yesno",
    prompt: "Vill du ha skydd för transport eller bogsering om fordonet går sönder långt hemifrån?",
  },
  {
    id: "tillbehor",
    label: "Dyra tillbehör",
    type: "yesno",
    prompt: "Har fordonet dyra tillbehör eller extrautrustning?",
  },
  {
    id: "bogserar",
    label: "Bogserar ofta",
    type: "yesno",
    prompt: "Använder du fordonet för att dra något tungt, till exempel en båt- eller husvagnstrailer?",
  },
];

const PERSON_QUESTIONS: NeedQuestion[] = [
  {
    id: "reser",
    label: "Reser utomlands ofta",
    type: "yesno",
    prompt: "Reser personen utomlands minst en gång per år?",
  },
  {
    id: "risksport",
    label: "Riskfylld sport eller hobby",
    type: "yesno",
    prompt: "Utövar personen en riskfylld sport eller hobby, till exempel dykning, klättring eller motorsport?",
  },
  {
    id: "dubbelskydd",
    label: "Skydd via jobbet",
    type: "yesno",
    prompt: "Har personen redan ett försäkringsskydd via sin arbetsgivare?",
  },
  {
    id: "barnIHushall",
    label: "Barn i hushållet",
    type: "yesno",
    prompt: "Finns det barn i hushållet som också behöver skydd?",
  },
  {
    id: "hogriskyrke",
    label: "Fysiskt krävande yrke",
    type: "yesno",
    prompt: "Har personen ett fysiskt krävande eller riskfyllt yrke?",
  },
];

const DJUR_QUESTIONS: NeedQuestion[] = [
  {
    id: "liv",
    label: "Livförsäkring för djuret",
    type: "yesno",
    prompt: "Vill du ha en livförsäkring som ger ersättning om djuret dör eller måste avlivas?",
  },
  {
    id: "tavling",
    label: "Tävling eller avel",
    type: "yesno",
    prompt: "Tävlar eller avlar du med djuret?",
  },
  {
    id: "kronisk",
    label: "Kronisk sjukdom eller hög ålder",
    type: "yesno",
    prompt: "Har djuret en kronisk sjukdom eller är det äldre (över 8 år)?",
  },
  {
    id: "rasbetingad",
    label: "Rasbetingad sjukdomsrisk",
    type: "yesno",
    prompt: "Är djuret av en ras med känd risk för ärftliga sjukdomar, till exempel höftledsdysplasi?",
  },
  {
    id: "flerdjurshushall",
    label: "Flera djur i hushållet",
    type: "yesno",
    prompt: "Har du fler än ett djur i hushållet som också ska försäkras?",
  },
];

export const NEED_QUESTIONS: Record<NeedsKind, NeedQuestion[]> = {
  boende: BOENDE_QUESTIONS,
  bil: BIL_QUESTIONS,
  ovrigt_fordon: OVRIGT_FORDON_QUESTIONS,
  person: PERSON_QUESTIONS,
  djur: DJUR_QUESTIONS,
};

// Magasinering (förvaring) saknar de flesta "hem"-behoven (reseskydd,
// hemmakontor, andrahandsuthyrning) — bara det som faktiskt förvaras är
// relevant att fråga om.
const MAGASINERING_RELEVANT_QUESTIONS = new Set(["vardefulla_saker"]);

export function getNeedQuestions(kind: NeedsKind, item: ComparableItem): NeedQuestion[] {
  const all = NEED_QUESTIONS[kind];
  if (kind === "boende" && item.kind === "boende" && item.typ === "magasinering") {
    return all.filter((q) => MAGASINERING_RELEVANT_QUESTIONS.has(q.id));
  }
  return all;
}

// Behovs-id:n som faktiskt är relevanta för det här specifika objektet — dvs
// härledda från samma (ev. filtrerade) frågelista som getNeedQuestions ger.
// Används för att begränsa både bekräfta-chipsen och fritext-matchningen, så
// t.ex. en magasinering-post aldrig kan få ett "reseskydd"-behov.
export function getAvailableNeedIds(kind: NeedsKind, item: ComparableItem): string[] {
  const ids: string[] = [];
  for (const q of getNeedQuestions(kind, item)) {
    if (q.type === "yesno") ids.push(q.id);
    else ids.push(...q.options.map((o) => o.id));
  }
  return ids;
}

function buildLabels(questions: NeedQuestion[]): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const q of questions) {
    if (q.type === "yesno") labels[q.id] = q.label;
    else for (const opt of q.options) labels[opt.id] = opt.label;
  }
  return labels;
}

export const NEED_LABELS: Record<NeedsKind, Record<string, string>> = {
  boende: buildLabels(BOENDE_QUESTIONS),
  bil: buildLabels(BIL_QUESTIONS),
  ovrigt_fordon: buildLabels(OVRIGT_FORDON_QUESTIONS),
  person: buildLabels(PERSON_QUESTIONS),
  djur: buildLabels(DJUR_QUESTIONS),
};

// Nyckelord/fraser för den simulerade fritext-tolkningen — enkel
// delsträngsmatchning, samma princip som de kanned-svaren i src/lib/chat.ts,
// men mot fria formuleringar istället för exakta frågor.
const NEED_KEYWORDS: Record<NeedsKind, Record<string, string[]>> = {
  boende: {
    cykel: ["cykel", "elcykel", "mountainbike", "racercykel"],
    sport: ["golf", "golfklubbor", "skidor", "skidutrustning", "dykutrustning", "fritidsutrustning", "sportutrustning"],
    smycken: ["smycke", "smycken", "klocka", "klockor", "diamant", "guld"],
    elektronik: ["elektronik", "dator", "hemmabio", "ljudanläggning", "kamera"],
    resa: ["resa", "resor", "reser", "utomlands", "semester", "utlandsresa"],
    drulle: ["drulle", "allrisk", "tappar", "olyckshändelse"],
    hemmakontor: ["hemmakontor", "jobbar hemifrån", "distansarbete", "kontorsutrustning"],
    andrahand: ["andrahand", "inneboende", "hyr ut", "andrahandsuthyrning"],
  },
  bil: {
    hyrbil: ["hyrbil", "hyra bil", "lånebil"],
    assistans: ["assistans", "vägassistans", "bärgning", "bogsering"],
    utlandskorning: ["utomlands", "utlandskörning", "europa", "semester"],
    ungForare: ["ung förare", "under 25", "tonåring", "nyutbildad"],
    flerforare: ["flera förare", "delar bilen", "familjebil", "fler som kör"],
    tillbehor: ["fälgar", "dragkrok", "tillbehör", "ljudanläggning"],
  },
  ovrigt_fordon: {
    sasongsforvaring: ["förvaras inomhus", "garage", "vinterförvaring", "säsongsförvaring"],
    stold: ["stöld", "stöldrisk", "högt värde", "dyrbar"],
    transport: ["transport", "bogsering", "bärgning", "hemtransport"],
    tillbehor: ["tillbehör", "extrautrustning"],
    bogserar: ["bogserar", "trailer", "släpvagn", "drar en"],
  },
  person: {
    reser: ["resa", "reser", "utomlands", "semester"],
    risksport: ["riskfylld", "dykning", "klättring", "motorsport", "extremsport"],
    dubbelskydd: ["jobbet", "arbetsgivare", "tjänstepension", "kollektivavtal"],
    barnIHushall: ["barn", "barnförsäkring", "hushållet"],
    hogriskyrke: ["fysiskt krävande", "riskfyllt yrke", "byggarbetare", "brandman"],
  },
  djur: {
    liv: ["livförsäkring", "avlivas", "dör"],
    tavling: ["tävlar", "tävling", "avel", "avlar"],
    kronisk: ["kronisk", "sjukdom", "gammal", "äldre"],
    rasbetingad: ["ärftlig", "rasbetingad", "höftledsdysplasi", "rasrisk"],
    flerdjurshushall: ["flera djur", "fler husdjur", "syskon"],
  },
};

export function matchNeedsFromFreeText(kind: NeedsKind, text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const [needId, keywords] of Object.entries(NEED_KEYWORDS[kind])) {
    if (keywords.some((kw) => lower.includes(kw))) matched.push(needId);
  }
  return matched;
}

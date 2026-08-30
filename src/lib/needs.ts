import type { ComparableItem } from "@/lib/items";

// Behovsanalys innan jämförelse — gäller alla åtta kategorier som faktiskt
// har en jämförelsemotor (Prenumeration undantaget, den saknar fortfarande
// en jämförelsemotor att bygga behov inför).
export type NeedsKind =
  | "boende"
  | "bil"
  | "ovrigt_fordon"
  | "person"
  | "djur"
  | "telekom"
  | "kreditkort"
  | "el";

export type NeedOption = { id: string; label: string };

// Gör en fråga villkorad på ett tidigare svar — den syns bara i guiden om
// needId:t redan finns bland de behov som lagts till (dvs frågan besvarades
// med "ja", eller en multi/choice-fråga där den optionen valdes).
export type NeedDependsOn = { needId: string };

export type NeedQuestion =
  | { id: string; label: string; type: "yesno"; prompt: string; dependsOn?: NeedDependsOn }
  | { id: string; type: "multi"; prompt: string; options: NeedOption[]; dependsOn?: NeedDependsOn }
  // Precis som "multi" men bara ett val åt gången — för uppföljningsfrågor
  // där svaren är ömsesidigt uteslutande (t.ex. "hur ofta" snarare än "vilka").
  | { id: string; type: "choice"; prompt: string; options: NeedOption[]; dependsOn?: NeedDependsOn };

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
    id: "resa_langd",
    type: "choice",
    dependsOn: { needId: "resa" },
    prompt: "Hur länge är du borta i regel när du reser?",
    options: [
      { id: "resa_kort", label: "Oftast under 2 veckor" },
      { id: "resa_lang", label: "Ofta mer än 2 veckor" },
    ],
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
    id: "nyutbildad_forare",
    label: "Nyligen tagit körkort",
    type: "yesno",
    dependsOn: { needId: "ungForare" },
    prompt: "Har den föraren haft körkort i mindre än två år?",
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
    id: "sparning_installerad",
    label: "GPS-spårning eller larm",
    type: "yesno",
    dependsOn: { needId: "stold" },
    prompt: "Finns det GPS-spårning eller larm installerat på fordonet?",
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
    id: "risksport_typ",
    type: "choice",
    dependsOn: { needId: "risksport" },
    prompt: "Vilken typ av riskfylld aktivitet handlar det om?",
    options: [
      { id: "risksport_extrem", label: "Extremsport, t.ex. dykning eller klättring" },
      { id: "risksport_motor", label: "Motorsport" },
    ],
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
    id: "kronisk_diagnostiserad",
    label: "Redan diagnostiserad",
    type: "yesno",
    dependsOn: { needId: "kronisk" },
    prompt: "Är sjukdomen redan diagnostiserad av en veterinär?",
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

const TELEKOM_QUESTIONS: NeedQuestion[] = [
  {
    id: "utomlands",
    label: "Bra villkor utomlands",
    type: "yesno",
    prompt: "Reser du utomlands ofta och vill ha bra data-/samtalsvillkor där?",
  },
  {
    id: "storforbrukare",
    label: "Streamar/laddar ner mycket",
    type: "yesno",
    prompt: "Streamar eller laddar du ner mycket, till exempel filmer eller stora filer?",
  },
  {
    id: "data_niva",
    type: "choice",
    dependsOn: { needId: "storforbrukare" },
    prompt: "Ungefär hur mycket mobildata drar du per månad?",
    options: [
      { id: "data_mycket", label: "Över 50 GB" },
      { id: "data_obegransad", label: "Vill helst ha obegränsat" },
    ],
  },
  {
    id: "hemarbete",
    label: "Beroende av stabil uppkoppling",
    type: "yesno",
    prompt: "Jobbar du hemifrån och är beroende av en stabil uppkoppling?",
  },
  {
    id: "flera_anvandare",
    label: "Flera i hushållet delar abonnemanget",
    type: "yesno",
    prompt: "Är ni flera i hushållet som delar på det här abonnemanget?",
  },
  {
    id: "bindningstid",
    label: "Ingen bindningstid",
    type: "yesno",
    prompt: "Vill du undvika bindningstid och kunna byta när du vill?",
  },
];

const KREDITKORT_QUESTIONS: NeedQuestion[] = [
  {
    id: "utlandsresor",
    label: "Bra villkor för utlandsköp",
    type: "yesno",
    prompt: "Reser du utomlands ofta och vill ha bra villkor för utländska köp och uttag?",
  },
  {
    id: "stora_kop",
    label: "Köpskydd / förlängd garanti",
    type: "yesno",
    prompt: "Gör du ofta större inköp och vill ha köpskydd eller förlängd garanti?",
  },
  {
    id: "stora_kop_elektronik",
    label: "Ofta elektronik eller resor",
    type: "yesno",
    dependsOn: { needId: "stora_kop" },
    prompt: "Handlar de större köpen ofta om elektronik eller resor?",
  },
  {
    id: "kontantuttag",
    label: "Kontantuttag",
    type: "yesno",
    prompt: "Tar du ofta ut kontanter, i Sverige eller utomlands?",
  },
  {
    id: "delat_kort",
    label: "Extrakort till familjemedlem",
    type: "yesno",
    prompt: "Vill du kunna lägga till ett extrakort till en familjemedlem?",
  },
  {
    id: "poang",
    label: "Bonus / cashback",
    type: "yesno",
    prompt: "Är det viktigt för dig att samla bonuspoäng eller cashback på vardagsköp?",
  },
];

const EL_QUESTIONS: NeedQuestion[] = [
  {
    id: "elbil",
    label: "Elbil / laddning",
    type: "yesno",
    prompt: "Har du elbil, eller planerar att skaffa en, och behöver bra laddvillkor?",
  },
  {
    id: "elbil_nattladdning",
    label: "Laddar mest nattetid",
    type: "yesno",
    dependsOn: { needId: "elbil" },
    prompt: "Laddar du mest nattetid? Ett timprisavtal kan bli betydligt billigare än ett fast pris om du gör det.",
  },
  {
    id: "fastpris_trygghet",
    label: "Fast pris för trygghet",
    type: "yesno",
    prompt: "Vill du ha ett fast pris för trygghet, även om det kan bli dyrare vid låga rörliga priser?",
  },
  {
    id: "miljo",
    label: "Förnybar/miljömärkt el",
    type: "yesno",
    prompt: "Är det viktigt för dig att elen är förnybar eller miljömärkt?",
  },
  {
    id: "hog_forbrukning",
    label: "Hög elförbrukning",
    type: "yesno",
    prompt: "Har du hög elförbrukning, till exempel på grund av värmepump, elbil eller ett stort hus?",
  },
  {
    id: "forbrukning_typ",
    type: "choice",
    dependsOn: { needId: "hog_forbrukning" },
    prompt: "Vad drar mest el hos dig?",
    options: [
      { id: "forbrukning_varmepump", label: "Värmepump eller uppvärmning" },
      { id: "forbrukning_elbil", label: "Elbilsladdning" },
    ],
  },
  {
    id: "solceller",
    label: "Solceller / sälja överskottsel",
    type: "yesno",
    prompt: "Har du solceller, eller planerar att skaffa, och vill kunna sälja överskottsel?",
  },
];

export const NEED_QUESTIONS: Record<NeedsKind, NeedQuestion[]> = {
  boende: BOENDE_QUESTIONS,
  bil: BIL_QUESTIONS,
  ovrigt_fordon: OVRIGT_FORDON_QUESTIONS,
  person: PERSON_QUESTIONS,
  djur: DJUR_QUESTIONS,
  telekom: TELEKOM_QUESTIONS,
  kreditkort: KREDITKORT_QUESTIONS,
  el: EL_QUESTIONS,
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
  telekom: buildLabels(TELEKOM_QUESTIONS),
  kreditkort: buildLabels(KREDITKORT_QUESTIONS),
  el: buildLabels(EL_QUESTIONS),
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
    resa_kort: ["kortare resor", "en vecka", "veckas resa"],
    resa_lang: ["långresa", "flera veckor", "länge borta", "månad utomlands"],
    drulle: ["drulle", "allrisk", "tappar", "olyckshändelse"],
    hemmakontor: ["hemmakontor", "jobbar hemifrån", "distansarbete", "kontorsutrustning"],
    andrahand: ["andrahand", "inneboende", "hyr ut", "andrahandsuthyrning"],
  },
  bil: {
    hyrbil: ["hyrbil", "hyra bil", "lånebil"],
    assistans: ["assistans", "vägassistans", "bärgning", "bogsering"],
    utlandskorning: ["utomlands", "utlandskörning", "europa", "semester"],
    ungForare: ["ung förare", "under 25", "tonåring", "nyutbildad"],
    nyutbildad_forare: ["nytt körkort", "nybliven förare", "nyutbildad förare"],
    flerforare: ["flera förare", "delar bilen", "familjebil", "fler som kör"],
    tillbehor: ["fälgar", "dragkrok", "tillbehör", "ljudanläggning"],
  },
  ovrigt_fordon: {
    sasongsforvaring: ["förvaras inomhus", "garage", "vinterförvaring", "säsongsförvaring"],
    stold: ["stöld", "stöldrisk", "högt värde", "dyrbar"],
    sparning_installerad: ["gps", "spårsändare", "larm installerat", "stöldskydd"],
    transport: ["transport", "bogsering", "bärgning", "hemtransport"],
    tillbehor: ["tillbehör", "extrautrustning"],
    bogserar: ["bogserar", "trailer", "släpvagn", "drar en"],
  },
  person: {
    reser: ["resa", "reser", "utomlands", "semester"],
    risksport: ["riskfylld", "dykning", "klättring", "motorsport", "extremsport"],
    risksport_extrem: ["dykning", "klättring", "bergsklättring", "extremsport"],
    risksport_motor: ["motorsport", "motocross", "racing"],
    dubbelskydd: ["jobbet", "arbetsgivare", "tjänstepension", "kollektivavtal"],
    barnIHushall: ["barn", "barnförsäkring", "hushållet"],
    hogriskyrke: ["fysiskt krävande", "riskfyllt yrke", "byggarbetare", "brandman"],
  },
  djur: {
    liv: ["livförsäkring", "avlivas", "dör"],
    tavling: ["tävlar", "tävling", "avel", "avlar"],
    kronisk: ["kronisk", "sjukdom", "gammal", "äldre"],
    kronisk_diagnostiserad: ["diagnostiserad", "fått diagnos", "konstaterad sjukdom"],
    rasbetingad: ["ärftlig", "rasbetingad", "höftledsdysplasi", "rasrisk"],
    flerdjurshushall: ["flera djur", "fler husdjur", "syskon"],
  },
  telekom: {
    utomlands: ["utomlands", "resa", "reser", "roaming"],
    storforbrukare: ["streama", "streamar", "ladda ner", "mycket data", "4k"],
    data_mycket: ["50 gb", "mycket data", "stor databudget"],
    data_obegransad: ["obegränsat", "obegränsad data", "fri surf"],
    hemarbete: ["jobbar hemifrån", "distansarbete", "hemmakontor", "stabil uppkoppling"],
    flera_anvandare: ["flera i hushållet", "familj", "delar", "flera användare"],
    bindningstid: ["bindningstid", "ingen bindning", "byta när jag vill"],
  },
  kreditkort: {
    utlandsresor: ["utomlands", "resa", "reser", "utlandsköp"],
    stora_kop: ["stora inköp", "köpskydd", "garanti", "dyra köp"],
    stora_kop_elektronik: ["elektronik", "dator", "tv", "resa", "flygbiljetter"],
    kontantuttag: ["kontanter", "uttag", "ta ut pengar"],
    delat_kort: ["extrakort", "familjemedlem", "dela kortet"],
    poang: ["bonus", "poäng", "cashback", "rabatt"],
  },
  el: {
    elbil: ["elbil", "laddbox", "laddning"],
    fastpris_trygghet: ["fast pris", "trygghet", "förutsägbart"],
    miljo: ["miljö", "förnybar", "grön el", "miljömärkt"],
    hog_forbrukning: ["värmepump", "stort hus", "hög förbrukning"],
    forbrukning_varmepump: ["värmepump", "uppvärmning", "elvärme"],
    forbrukning_elbil: ["elbil", "laddar bilen", "elbilsladdning"],
    solceller: ["solceller", "sälja el", "överskott"],
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

"use client";

import { QuestionFlow } from "@/components/QuestionFlow";
import type { QuestionStep } from "@/lib/question-flow";
import { getNeedQuestions, type NeedsKind } from "@/lib/needs";
import type { ComparableItem } from "@/lib/items";

// Ett kort, sakligt tips per fråga — id:t matchar exakt needs.ts:s
// fråge-id:n, så samma innehåll (needs.ts, oförändrat) återanvänds för
// både frågetext och den behovs-id-lista som redan går till
// computeItemQuotes/matchedNeeds. Bara "bil" saknas här — den har sitt
// eget, mycket rikare frågebatteri i BilNeedsForm.tsx.
const TIPS: Record<string, string> = {
  // Boende
  vardefulla_saker: "Grundskyddet har ofta ett takbelopp per sak — värdefulla saker kan behöva ett tillägg.",
  resa: "De flesta hemförsäkringar har ett grundläggande reseskydd, ofta 45 dagar.",
  resa_langd: "Reser du längre än grundskyddets gräns kan ett förstärkt reseskydd löna sig.",
  drulle: "Drulle/allrisk är sällan med i grundpriset, men täcker precis den typen av små olyckor.",
  hemmakontor: "Gränsen för dyr kontorsutrustning hemma kan vara lägre än du tror.",
  andrahand: "Andrahandsuthyrning kräver ofta ett eget tillägg — grundförsäkringen räcker sällan.",
  // Övrigt fordon
  sasongsforvaring: "Var fordonet förvaras utanför säsong påverkar både pris och stöldrisk.",
  stold: "Högre värde eller förhöjd stöldrisk kan göra ett stöldskydd värt att jämföra.",
  sparning_installerad: "Ett installerat larm eller GPS-spårare ger ofta rabatt hos flera bolag.",
  transport: "Utan transport-/bogseringsskydd kan en långväga bärgning bli dyr.",
  tillbehor: "Dyr extrautrustning täcks inte alltid av grundskyddet.",
  bogserar: "Drar du en trailer regelbundet bör försäkringen matcha den användningen.",
  // Person
  reser: "Reser du ofta kan ett reseskydd i personförsäkringen vara värt att se över.",
  risksport: "Riskfyllda hobbies undantas ibland helt, eller kräver ett eget tillägg.",
  risksport_typ: "Extremsport och motorsport bedöms ofta olika av bolagen.",
  dubbelskydd: "Har du redan skydd via jobbet kan du slippa betala dubbelt för samma sak.",
  barnIHushall: "Barn behöver oftast en egen barnförsäkring — vuxenförsäkringar täcker sällan sjukdom hos barn.",
  hogriskyrke: "Ett fysiskt krävande yrke kan påverka både pris och vad som ingår.",
  // Djur
  liv: "En livförsäkring ger ersättning om djuret dör eller måste avlivas — separat från veterinärvårdskostnaden.",
  tavling: "Tävling eller avel kräver ofta ett eget tillägg hos djurförsäkringsbolagen.",
  kronisk: "Kroniska sjukdomar eller hög ålder kan påverka både pris och vad som täcks.",
  kronisk_diagnostiserad: "En redan diagnostiserad sjukdom kan vara undantagen hos nya bolag.",
  rasbetingad: "Vissa raser har högre premie på grund av kända ärftliga sjukdomsrisker.",
  flerdjurshushall: "Flera djur i hushållet ger ofta en samlingsrabatt.",
  // Telekom
  utomlands: "Roamingvillkoren skiljer sig mycket mellan operatörer.",
  storforbrukare: "Mycket streaming eller nedladdning gör att en högre databudget lönar sig.",
  data_niva: "Obegränsat är ofta bara marginellt dyrare än en hög men begränsad databudget.",
  hemarbete: "Jobbar du hemifrån är stabiliteten ofta viktigare än toppfarten.",
  flera_anvandare: "Delar ni abonnemanget kan en familjeplan bli billigare per person.",
  familjerabatt: "Flera operatörer ger rabatt om ni tecknar era abonnemang tillsammans — den missas ofta.",
  bindningstid: "Utan bindningstid kan priset vara något högre, men du kan byta när du vill.",
  // Kreditkort
  utlandsresor: "Växlingsavgifter vid utlandsköp skiljer sig mycket mellan kort.",
  stora_kop: "Köpskydd och förlängd garanti kan vara värt mer än en låg årsavgift.",
  stora_kop_elektronik: "Elektronik och resor är de vanligaste köpskydds-kategorierna.",
  kontantuttag: "Uttagsavgifter kan äta upp fördelen med ett annars bra kort.",
  delat_kort: "Ett extrakort till familjen delar samma kreditgräns.",
  poang: "Bonusprogram skiljer sig mest i hur stor andel av köpet du får tillbaka.",
  // El
  elbil: "Elbilar drar mycket ström — ett avtal anpassat för det kan spara pengar.",
  elbil_nattladdning: "Laddar du mest nattetid kan ett timprisavtal bli klart billigare än fast pris.",
  fastpris_trygghet: "Fast pris ger ett förutsägbart pris, även om rörligt ofta är billigare i snitt.",
  miljo: "Märkt förnybar el kostar sällan mer, men inte alla bolag erbjuder det.",
  hog_forbrukning: "Hög förbrukning gör att skillnaden mellan avtal syns tydligare på räkningen.",
  forbrukning_typ: "Värmepump och elbilsladdning drar mest, och styr vilket avtal som passar bäst.",
  solceller: "Vill du sälja överskottsel behöver elbolaget erbjuda det.",
};

// Samma frågeinnehåll som tidigare (needs.ts, oförändrat) men som en
// fråga-i-taget-guide med tips och en växande sammanfattning, samma
// mönster som BilNeedsForm.tsx. "bil" hanteras inte här.
export function GenericNeedsForm({
  kind,
  item,
  initialNeeds,
  onDone,
  onBack,
}: {
  kind: NeedsKind;
  item: ComparableItem;
  initialNeeds: string[];
  onDone: (needs: string[]) => void;
  onBack: () => void;
}) {
  const questions = getNeedQuestions(kind, item);

  const steps: QuestionStep[] = questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    tip: TIPS[q.id] ?? "Svara på det som stämmer för dig — resten kan du hoppa över.",
    type: q.type === "yesno" ? "bool" : q.type === "choice" ? "pill" : "multipill",
    options: q.type === "yesno" ? undefined : q.options.map((o) => ({ value: o.id, label: o.label })),
    show: q.dependsOn ? (answers) => answers[q.dependsOn!.needId] === true : undefined,
  }));

  const initialAnswers: Record<string, unknown> = {};
  for (const q of questions) {
    if (q.type === "yesno") {
      if (initialNeeds.includes(q.id)) initialAnswers[q.id] = true;
    } else if (q.type === "choice") {
      const picked = q.options.find((o) => initialNeeds.includes(o.id));
      if (picked) initialAnswers[q.id] = picked.id;
    } else {
      const picked = q.options.filter((o) => initialNeeds.includes(o.id)).map((o) => o.id);
      if (picked.length > 0) initialAnswers[q.id] = picked;
    }
  }

  const handleDone = (answers: Record<string, unknown>) => {
    const needs: string[] = [];
    for (const q of questions) {
      const v = answers[q.id];
      if (q.type === "yesno" && v === true) needs.push(q.id);
      else if (q.type === "choice" && typeof v === "string") needs.push(v);
      else if (q.type === "multi" && Array.isArray(v)) needs.push(...(v as string[]));
    }
    onDone(needs);
  };

  return (
    <QuestionFlow
      eyebrow="Behovsanalys"
      title="Vad är viktigt för dig?"
      steps={steps}
      initialAnswers={initialAnswers}
      onDone={handleDone}
      onBack={onBack}
    />
  );
}

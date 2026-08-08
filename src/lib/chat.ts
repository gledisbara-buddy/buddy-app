export type ChatMessage = { role: "user" | "assistant"; content: string };

export const CHAT_SUGGESTIONS = [
  "Täcker min hemförsäkring vattenskador?",
  "Ska jag välja rörligt eller fast elpris?",
  "Hjälp mig anmäla en skada",
];

type ChatTopic = { id: string; keywords: string[]; answer: string };

// Enkel nyckelordsmatchning, samma princip som matchNeedsFromFreeText i
// needs.ts — ingen riktig språkförståelse, bara "innehåller den här frasen".
const CHAT_TOPICS: ChatTopic[] = [
  // Boende
  {
    id: "vattenskada",
    keywords: ["vattenskada", "vattenläcka", "läcka"],
    answer:
      "Ja, de flesta hemförsäkringar täcker plötsliga och oförutsedda vattenskador, men självrisk och villkor skiljer sig mellan bolag. Vill du att jag hjälper dig jämföra?",
  },
  {
    id: "dubbelforsakrad",
    keywords: ["dubbelförsäkrad", "dubbelt försäkrad", "överlappande"],
    answer:
      "Det är vanligt att ha viss överlappande täckning, till exempel reseskydd via både hemförsäkring och kort. Vill du att jag går igenom dina nuvarande försäkringar?",
  },
  {
    id: "drulle",
    keywords: ["drulle", "allrisk"],
    answer:
      "Drulle- eller allriskskydd täcker plötsliga olyckshändelser i hemmet, till exempel om du tappar mobilen i golvet. Det ingår inte alltid i grundpriset — vill du se vilka av dina alternativ som har det med?",
  },
  {
    id: "reseskydd",
    keywords: ["reseskydd", "resa utomlands", "reseförsäkring"],
    answer:
      "De flesta hemförsäkringar har ett grundläggande reseskydd, ofta 45 dagar. Reser du mycket kan ett förstärkt reseskydd vara värt att jämföra. Vill du lägga till det som ett behov i din jämförelse?",
  },
  {
    id: "hemmakontor",
    keywords: ["hemmakontor", "jobbar hemifrån", "distansarbete"],
    answer:
      "Dyr kontorsutrustning hemma täcks normalt av hemförsäkringen, men gränsen för hur mycket kan vara lägre än du tror. Vill du kolla om ditt nuvarande skydd räcker?",
  },
  // Bil
  {
    id: "vagnskada",
    keywords: ["vagnskada", "vagnskadeförsäkring"],
    answer:
      "Vagnskadeförsäkring täcker skador på din egen bil vid till exempel kollision, skadegörelse eller singelolycka — det som skiljer hel- och halvförsäkring. Vill du se om det lönar sig för din bil?",
  },
  {
    id: "hyrbil",
    keywords: ["hyrbil", "lånebil", "verkstad"],
    answer:
      "Rätt till hyrbil vid verkstadsbesök ingår inte alltid — vissa bolag har det som tillägg. Vill du att jag markerar det som ett behov när du jämför din bilförsäkring?",
  },
  {
    id: "vagassistans",
    keywords: ["vägassistans", "bärgning", "bogsering"],
    answer:
      "Vägassistans dygnet runt (bärgning, hjälp vid punktering eller bränslebrist) varierar mycket mellan bolag. Vill du se vilka alternativ som har det med i grundpriset?",
  },
  // Övrigt fordon
  {
    id: "mc_husvagn_bat",
    keywords: ["mc", "motorcykel", "husvagn", "släpvagn", "båt"],
    answer:
      "MC, husvagn, båt och släp försäkras lite olika beroende på värde och hur de förvaras. Lägg till fordonet under \"Övrigt fordon\" så ställer jag rätt följdfrågor.",
  },
  // Person
  {
    id: "olycksfall",
    keywords: ["olycksfall", "olycksfallsförsäkring"],
    answer:
      "En olycksfallsförsäkring ger ersättning vid bland annat medicinsk invaliditet efter en olycka — den täcker inte sjukdom. Vill du se om du redan har ett sådant skydd via jobbet?",
  },
  {
    id: "barnforsakring",
    keywords: ["barnförsäkring", "försäkra barn", "mitt barn"],
    answer:
      "En barnförsäkring gäller ofta både olycksfall och sjukdom, till skillnad från vuxenförsäkringar som oftast bara täcker olycksfall. Vill du lägga in en person för att jämföra alternativ?",
  },
  // Djur
  {
    id: "veterinar",
    keywords: ["veterinär", "veterinärvård", "djurförsäkring"],
    answer:
      "De flesta djurförsäkringar täcker veterinärvårdskostnader upp till ett tak per skada eller år — taket varierar en hel del mellan bolag. Vill du jämföra för ditt djur?",
  },
  {
    id: "livforsakring_djur",
    keywords: ["livförsäkring för", "avlivas", "dör djuret"],
    answer:
      "En livförsäkring för husdjur ger ersättning om djuret dör eller måste avlivas till följd av sjukdom eller olycka. Vill du se vilka bolag som erbjuder det?",
  },
  // Telekom
  {
    id: "bindningstid",
    keywords: ["bindningstid", "byta operatör", "byta abonnemang"],
    answer:
      "Många mobil- och bredbandsabonnemang går att teckna utan bindningstid nu för tiden, men det kan påverka priset. Vill du att jag filtrerar din jämförelse på det?",
  },
  {
    id: "bredband",
    keywords: ["bredband", "fiber", "hastighet"],
    answer:
      "Vilken bredbandshastighet du behöver beror mest på hur många ni är som streamar samtidigt. Lägg till ditt bredband så frågar jag om det när du jämför.",
  },
  // Kreditkort
  {
    id: "arsavgift",
    keywords: ["årsavgift", "kortavgift"],
    answer:
      "Årsavgiften på kreditkort varierar mycket, och kort utan avgift saknar ofta bonusprogram. Vill du se vad som passar bäst utifrån hur du använder kortet?",
  },
  {
    id: "bonus_cashback",
    keywords: ["bonus", "cashback", "poäng på köp"],
    answer:
      "Bonusprogram och cashback skiljer sig mest i hur stor andel av varje köp du får tillbaka, och var det gäller. Vill du jämföra kort utifrån det?",
  },
  // El
  {
    id: "rorligt_fast",
    keywords: ["rörligt", "fast pris", "rörligt elpris", "fast elpris"],
    answer:
      "Fast pris ger dig ett förutsägbart pris även om marknadspriset stiger, medan rörligt pris ofta är billigare i snitt men kan variera mycket. Vill du se vad som skulle passa dig?",
  },
  {
    id: "elomrade",
    keywords: ["elområde", "se1", "se2", "se3", "se4"],
    answer:
      "Sverige är indelat i fyra elområden (SE1–SE4) med olika prisnivåer beroende på var du bor. Ditt elområde påverkar vilket avtal som är billigast för dig.",
  },
  // Prenumeration
  {
    id: "avsluta_abonnemang",
    keywords: ["avsluta abonnemang", "säga upp abonnemang", "avsluta prenumeration"],
    answer:
      "Du kan när som helst ta bort ett abonnemang du lagt in i Buddy — det påverkar bara vad du håller koll på här, inte det faktiska avtalet hos leverantören.",
  },
  // Skadeanmälan & allmänt
  {
    id: "skadeanmalan",
    keywords: ["anmäla en skada", "anmäl skada", "skadeanmälan"],
    answer: "Absolut — jag kan hjälpa dig starta en skadeanmälan direkt. Vill du gå till anmälningsflödet nu?",
  },
  {
    id: "gratis",
    keywords: ["kostar det", "gratis", "vad kostar buddy"],
    answer:
      "Det är alltid gratis att lägga in och jämföra i Buddy — du betalar bara om du väljer att teckna något hos ett bolag.",
  },
  {
    id: "integritet",
    keywords: ["mina uppgifter", "dataskydd", "integritet", "gdpr"],
    answer:
      "Vi delar bara dina uppgifter med det bolag du aktivt väljer att teckna hos, och bara det som krävs för det avtalet. Du kan läsa mer i vår integritetspolicy.",
  },
];

// En enda trygg, icke-ursäktande fallback — det här är ett medvetet
// designval (skriptad demo, ingen AI-backend ännu), inte en bugg man
// snubblar på.
const FALLBACK_ANSWER =
  "Just nu svarar jag utifrån ett antal förberedda ämnen i den här demon — den riktiga appen kopplar på ett fullständigt AI-svar. Vill du boka in en specialist under tiden, eller fråga något annat?";

export function getCannedReply(userText: string): string {
  const lower = userText.trim().toLowerCase();
  const topic = CHAT_TOPICS.find((t) => t.keywords.some((kw) => lower.includes(kw)));
  return topic ? topic.answer : FALLBACK_ANSWER;
}

export function randomDelay(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

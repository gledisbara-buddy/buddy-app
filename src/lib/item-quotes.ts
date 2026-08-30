import type { ComparableItem, TelekomTyp } from "@/lib/items";
import type { NeedsKind } from "@/lib/needs";
import type { Quote } from "@/lib/quote";

// Kopplar behovs-id:n till vilka bolag som faktiskt matchar dem — byggt på
// bolagens redan etablerade "personligheter" (se highlights nedan), inte
// gissat. Bara till för att förklara "varför" i CompareFlow — påverkar
// aldrig priset eller vem som vinner.
const NEED_COMPANY_MATCH: Record<NeedsKind, Record<string, string[]>> = {
  boende: {
    resa: ["nordvakt"],
    resa_lang: ["nordvakt"],
    drulle: ["klarsaker"],
    hemmakontor: ["klarsaker"],
    vardefulla_saker: ["klarsaker"],
  },
  bil: {
    hyrbil: ["nordvakt"],
    assistans: ["klarsaker"],
    utlandskorning: ["klarsaker"],
    ungForare: ["nordvakt"],
    nyutbildad_forare: ["nordvakt"],
    tillbehor: ["klarsaker"],
  },
  ovrigt_fordon: {
    stold: ["klarsaker"],
    sparning_installerad: ["klarsaker"],
    transport: ["nordvakt"],
    bogserar: ["nordvakt"],
    tillbehor: ["klarsaker"],
  },
  person: {
    risksport: ["klarsaker"],
    risksport_extrem: ["klarsaker"],
    risksport_motor: ["klarsaker"],
    hogriskyrke: ["nordvakt"],
    barnIHushall: ["klarsaker"],
  },
  djur: {
    liv: ["nordvakt"],
    kronisk: ["klarsaker"],
    kronisk_diagnostiserad: ["klarsaker"],
    tavling: ["klarsaker"],
  },
  telekom: {
    utomlands: ["fiberpunkt"],
    storforbrukare: ["sambandet"],
    data_mycket: ["sambandet"],
    data_obegransad: ["sambandet"],
    flera_anvandare: ["sambandet"],
    bindningstid: ["klarnat"],
  },
  kreditkort: {
    utlandsresor: ["silverkortet"],
    stora_kop: ["guldkortet"],
    stora_kop_elektronik: ["guldkortet"],
    kontantuttag: ["guldkortet"],
    poang: ["kontokraft"],
  },
  el: {
    fastpris_trygghet: ["kraftpunkt"],
    hog_forbrukning: ["kraftpunkt"],
    forbrukning_varmepump: ["kraftpunkt"],
    miljo: ["solkraft"],
    solceller: ["solkraft"],
    elbil: ["voltec"],
    forbrukning_elbil: ["voltec"],
  },
};

function withMatchedNeeds(kind: NeedsKind, needs: string[], quotes: Quote[]): Quote[] {
  const map = NEED_COMPANY_MATCH[kind];
  if (needs.length === 0) return quotes;
  return quotes.map((q) => {
    const matched = needs.filter((id) => map[id]?.includes(q.id));
    return matched.length > 0 ? { ...q, matchedNeeds: matched } : q;
  });
}

const RATING = { klarsaker: 4.6, hemgrund: 4.2, nordvakt: 4.4, bjornskydd: 3.9 };
const SELF_RISK = { klarsaker: 1500, hemgrund: 2000, nordvakt: 1200, bjornskydd: 2200 };

// Simulerade avtalsdetaljer för det avancerade jämförelseläget — varje
// fiktivt bolag har en konsekvent "personlighet" genom alla fem kategorier:
// Klarsäker (dyrast, högst betyg) har generösast villkor, Hemgrund
// (billigast, lägst betyg) har strängast, Nordvakt ligger mitt emellan.
// Björnskydd är helt digitalt och billigast av de fyra, men med högst
// självrisk, lägst ersättningstak och utan telefonsupport.
const TERMS: Record<
  "klarsaker" | "hemgrund" | "nordvakt" | "bjornskydd",
  { karenstid: string; ersattningstak: string; bindningstid: string; uppsagningstid: string; undantag: string[] }
> = {
  klarsaker: {
    karenstid: "Ingen karenstid",
    ersattningstak: "Ingen övre gräns",
    bindningstid: "Ingen bindningstid",
    uppsagningstid: "30 dagar",
    undantag: ["Grov vårdslöshet", "Krig och terrorism"],
  },
  hemgrund: {
    karenstid: "48 timmar för vattenskador",
    ersattningstak: "1 000 000 kr per skada",
    bindningstid: "12 månader",
    uppsagningstid: "60 dagar",
    undantag: ["Grov vårdslöshet", "Slitage och bristande underhåll", "Skador i samband med renovering"],
  },
  nordvakt: {
    karenstid: "24 timmar för vattenskador",
    ersattningstak: "2 000 000 kr per skada",
    bindningstid: "Ingen bindningstid",
    uppsagningstid: "30 dagar",
    undantag: ["Grov vårdslöshet", "Krig och terrorism", "Skador vid uthyrning i andra hand"],
  },
  bjornskydd: {
    karenstid: "48 timmar för vattenskador",
    ersattningstak: "800 000 kr per skada",
    bindningstid: "Ingen bindningstid",
    uppsagningstid: "14 dagar",
    undantag: ["Grov vårdslöshet", "Skador som kunnat förebyggas med underhåll", "Telefonsupport ingår ej (endast chatt/app)"],
  },
};

function build(id: "klarsaker" | "hemgrund" | "nordvakt" | "bjornskydd", name: string, price: number, highlights: string[]): Quote {
  return {
    id,
    name,
    price: Math.max(29, Math.round(price)),
    selfRisk: SELF_RISK[id],
    rating: RATING[id],
    highlights,
    ...TERMS[id],
  };
}

const currentYear = new Date().getFullYear();

function boendeQuotes(item: Extract<ComparableItem, { kind: "boende" }>, needs: string[]): Quote[] {
  const extrasCost = needs.length * 14;

  if (item.typ === "magasinering") {
    const valueMult = item.uppskattatVarde < 10000 ? 0.8 : item.uppskattatVarde < 30000 ? 1 : 1.3;
    const sizeMult = item.storlekM2 < 5 ? 0.8 : item.storlekM2 < 15 ? 1 : 1.3;
    const mult = valueMult * sizeMult;
    return withMatchedNeeds(
      "boende",
      needs,
      [
        build("klarsaker", "Klarsäker", 99 * mult + extrasCost, [
          "Fullvärdesskydd för det du magasinerar, ingen övre gräns",
          "Gäller även vid brand och inbrott i förvaringen",
          "Skadeanmälan digitalt, snittbeslut inom 2 dagar",
        ]),
        build("hemgrund", "Hemgrund", 89 * mult + extrasCost, [
          "Lägst grundpris av de tre",
          "Bra grundskydd, färre tillägg ingår",
          "Telefonsupport vardagar 8–17",
        ]),
        build("nordvakt", "Nordvakt", 105 * mult + extrasCost, [
          "Lägst självrisk av de tre",
          "Extra skydd vid vattenskada i förvaringen",
          "Prisgaranti — matchar lägre pris hos annat bolag",
        ]),
        build("bjornskydd", "Björnskydd", 75 * mult + extrasCost, [
          "Billigast av de fyra, tecknas och hanteras helt i app",
          "Högre självrisk (2200 kr) och lägre ersättningstak (800 000 kr)",
          "Telefonsupport ingår ej — endast chatt och app",
        ]),
      ].sort((a, b) => a.price - b.price)
    );
  }

  const typMult = { hyresratt: 1, bostadsratt: 1.1, villa: 1.35, fritidshus: 1.3, fritidsbostadsratt: 1.15 }[item.typ];
  const boytaMult = item.boyta < 50 ? 0.9 : item.boyta < 100 ? 1.15 : item.boyta < 150 ? 1.35 : 1.6;
  const personAdd = Math.max(0, item.hushallsstorlek - 1) * 12;
  const larm = "larm" in item && item.larm;
  const larmMult = larm ? 0.95 : 1;

  const base = (v: number) => (v * typMult * boytaMult + personAdd) * larmMult + extrasCost;

  return withMatchedNeeds(
    "boende",
    needs,
    [
      build("klarsaker", "Klarsäker", base(99), [
        "Fullvärdesskydd för lösöre, ingen övre gräns",
        "Drulleskydd ingår redan i grundpriset",
        "Skadeanmälan digitalt, snittbeslut inom 2 dagar",
      ]),
      build("hemgrund", "Hemgrund", base(89), [
        "Lägst grundpris av de tre",
        "Bra grundskydd, färre tillägg ingår",
        "Telefonsupport vardagar 8–17",
      ]),
      build("nordvakt", "Nordvakt", base(105), [
        "Lägst självrisk av de tre",
        "Extra starkt reseskydd (90 dagar)",
        "Prisgaranti — matchar lägre pris hos annat bolag",
      ]),
      build("bjornskydd", "Björnskydd", base(75), [
        "Billigast av de fyra, tecknas och hanteras helt i app",
        "Högre självrisk (2200 kr) och lägre ersättningstak (800 000 kr)",
        "Telefonsupport ingår ej — endast chatt och app",
      ]),
    ].sort((a, b) => a.price - b.price)
  );
}

function bilQuotes(item: Extract<ComparableItem, { kind: "bil" }>, needs: string[]): Quote[] {
  const age = item.arsmodell ? currentYear - item.arsmodell : 5;
  const ageMult = age < 3 ? 1.3 : age < 8 ? 1.1 : 0.9;
  const korMult = !item.arligKorstracka
    ? 1
    : item.arligKorstracka < 1000
      ? 0.9
      : item.arligKorstracka < 1500
        ? 1
        : item.arligKorstracka < 2500
          ? 1.15
          : 1.3;
  const forvaringMult = item.forvaring === "garage" ? 0.9 : item.forvaring === "gata" ? 1.05 : 1;
  const mult = ageMult * korMult * forvaringMult;
  const extrasCost = needs.length * 20;

  return withMatchedNeeds(
    "bil",
    needs,
    [
      build("klarsaker", "Klarsäker", 249 * mult + extrasCost, [
        "Vagnskadegaranti i 3 år",
        "Fri bilbärgning i hela Europa",
        "Skadeanmälan digitalt, snittbeslut inom 2 dagar",
      ]),
      build("hemgrund", "Hemgrund", 219 * mult + extrasCost, [
        "Lägst grundpris av de tre",
        "Bra grundskydd i trafik- och halvförsäkring",
        "Telefonsupport vardagar 8–17",
      ]),
      build("nordvakt", "Nordvakt", 265 * mult + extrasCost, [
        "Lägst självrisk av de tre",
        "Hyrbil ingår vid verkstadsbesök",
        "Prisgaranti — matchar lägre pris hos annat bolag",
      ]),
      build("bjornskydd", "Björnskydd", 185 * mult + extrasCost, [
        "Billigast av de fyra, tecknas och hanteras helt i app",
        "Högre självrisk (2200 kr) och lägre ersättningstak (800 000 kr)",
        "Telefonsupport ingår ej — endast chatt och app",
      ]),
    ].sort((a, b) => a.price - b.price)
  );
}

function ovrigtFordonQuotes(item: Extract<ComparableItem, { kind: "ovrigt_fordon" }>, needs: string[]): Quote[] {
  const typMult = {
    mc: 1.2,
    husvagn: 1.1,
    bat: 1.4,
    slap: 0.6,
    latt_lastbil: 1.3,
    moped: 0.5,
    husbil: 1.5,
    snoskoter: 0.9,
    atv: 0.9,
    a_traktor: 0.6,
    veteranfordon: 0.7,
    elsparkcykel: 0.3,
    annat: 1,
  }[item.fordonstyp];
  const effektMult = item.fordonstyp === "mc" && item.effektHk && item.effektHk > 80 ? 1.15 : 1;
  const mult = typMult * effektMult;
  const extrasCost = needs.length * 12;

  return withMatchedNeeds(
    "ovrigt_fordon",
    needs,
    [
      build("klarsaker", "Klarsäker", 89 * mult + extrasCost, [
        "Fullvärdesskydd, ingen övre gräns",
        "Gäller även utomlands",
        "Skadeanmälan digitalt, snittbeslut inom 2 dagar",
      ]),
      build("hemgrund", "Hemgrund", 79 * mult + extrasCost, [
        "Lägst grundpris av de tre",
        "Bra grundskydd, färre tillägg ingår",
        "Telefonsupport vardagar 8–17",
      ]),
      build("nordvakt", "Nordvakt", 95 * mult + extrasCost, [
        "Lägst självrisk av de tre",
        "Inkluderar assistans vid haveri",
        "Prisgaranti — matchar lägre pris hos annat bolag",
      ]),
      build("bjornskydd", "Björnskydd", 65 * mult + extrasCost, [
        "Billigast av de fyra, tecknas och hanteras helt i app",
        "Högre självrisk (2200 kr) och lägre ersättningstak (800 000 kr)",
        "Telefonsupport ingår ej — endast chatt och app",
      ]),
    ].sort((a, b) => a.price - b.price)
  );
}

function personQuotes(item: Extract<ComparableItem, { kind: "person" }>, needs: string[]): Quote[] {
  const relationMult = item.relation === "barn" ? 0.7 : 1;
  const skyddAdd = item.onskatSkydd.length * 15;
  const extrasCost = needs.length * 12;
  const base = (v: number) => v * relationMult + skyddAdd + extrasCost;

  return withMatchedNeeds(
    "person",
    needs,
    [
      build("klarsaker", "Klarsäker", base(59), [
        "Ersättning oavsett vems fel skadan var",
        "Gäller dygnet runt, även på fritiden",
        "Skadeanmälan digitalt, snittbeslut inom 2 dagar",
      ]),
      build("hemgrund", "Hemgrund", base(49), [
        "Lägst grundpris av de tre",
        "Bra grundskydd, färre tillägg ingår",
        "Telefonsupport vardagar 8–17",
      ]),
      build("nordvakt", "Nordvakt", base(65), [
        "Lägst självrisk av de tre",
        "Extra ersättning vid längre sjukskrivning",
        "Prisgaranti — matchar lägre pris hos annat bolag",
      ]),
      build("bjornskydd", "Björnskydd", base(39), [
        "Billigast av de fyra, tecknas och hanteras helt i app",
        "Högre självrisk (2200 kr) och lägre ersättningstak (800 000 kr)",
        "Telefonsupport ingår ej — endast chatt och app",
      ]),
    ].sort((a, b) => a.price - b.price)
  );
}

function djurQuotes(item: Extract<ComparableItem, { kind: "djur" }>, needs: string[]): Quote[] {
  const typMult = { hund: 1.15, katt: 1, annat: 0.8 }[item.djurtyp];
  const viktMult = !item.viktKg ? 1 : item.viktKg < 10 ? 0.9 : item.viktKg < 25 ? 1.1 : 1.3;
  const age = item.fodelsear ? currentYear - item.fodelsear : 3;
  const ageMult = age < 3 ? 0.9 : age < 8 ? 1 : 1.2;
  const kastreradMult = item.kastrerad ? 0.95 : 1;
  const mult = typMult * viktMult * ageMult * kastreradMult;
  const extrasCost = needs.length * 12;

  return withMatchedNeeds(
    "djur",
    needs,
    [
      build("klarsaker", "Klarsäker", 129 * mult + extrasCost, [
        "Ersätter veterinärvård utan övre gräns",
        "Gäller från dag ett, ingen karenstid på olycksfall",
        "Skadeanmälan digitalt, snittbeslut inom 2 dagar",
      ]),
      build("hemgrund", "Hemgrund", 109 * mult + extrasCost, [
        "Lägst grundpris av de tre",
        "Bra grundskydd för veterinärvård",
        "Telefonsupport vardagar 8–17",
      ]),
      build("nordvakt", "Nordvakt", 145 * mult + extrasCost, [
        "Lägst självrisk av de tre",
        "Livförsäkring för djuret ingår",
        "Prisgaranti — matchar lägre pris hos annat bolag",
      ]),
      build("bjornskydd", "Björnskydd", 89 * mult + extrasCost, [
        "Billigast av de fyra, tecknas och hanteras helt i app",
        "Högre självrisk (2200 kr) och lägre ersättningstak (800 000 kr)",
        "Telefonsupport ingår ej — endast chatt och app",
      ]),
    ].sort((a, b) => a.price - b.price)
  );
}

// Telekom, kreditkort och el har redan ett pris kunden själv angett (till skillnad
// från boende/bil/osv, vars offerter räknas fram helt från sakens egenskaper) — så
// alternativen här räknas fram som procentandelar av det priset, en blandning av
// billigare och dyrare för att kännas trovärdiga. Fiktiva varumärken, skilda från
// försäkringens Klarsäker/Nordvakt/Hemgrund och från de riktiga bolagsnamnen i
// auto-hämtningen/katalogerna.

const TELEKOM_ALT = [
  { id: "klarnat", name: "Klarnät", rating: 4.5, mult: 0.85 },
  { id: "fiberpunkt", name: "Fiberpunkt", rating: 4.3, mult: 0.95 },
  { id: "sambandet", name: "Sambandet", rating: 4.1, mult: 1.1 },
  { id: "surfpunkt", name: "Surfpunkt", rating: 4.2, mult: 0.9 },
];

const TELEKOM_HIGHLIGHTS: Record<TelekomTyp, string[][]> = {
  mobil: [
    ["Samma datamängd, lägre pris", "Ingen bindningstid", "Byt när du vill"],
    ["Bra nätverkstäckning", "Fri surf inom EU", "Kundservice dygnet runt"],
    ["Prisgaranti i 24 månader", "Familjerabatt vid fler abonnemang", "5G ingår"],
    ["Bra balans mellan pris och surfmängd", "Fri surf i Norden", "Enkel digital ansökan"],
  ],
  bredband: [
    ["Samma hastighet, lägre pris", "Ingen bindningstid", "Fri installation"],
    ["Stabil uppkoppling", "Router ingår", "Kundservice dygnet runt"],
    ["Prisgaranti i 24 månader", "Dubbel hastighet första året", "Bonus vid byte"],
    ["Bra balans mellan pris och hastighet", "Ingen installationsavgift", "Enkel digital ansökan"],
  ],
  tv_streaming: [
    ["Liknande utbud, lägre pris", "Ingen bindningstid", "Avsluta när du vill"],
    ["Bredare kanalutbud", "Flera profiler ingår", "4K ingår"],
    ["Bonusinnehåll ingår", "Dela med hela familjen", "Nedladdning offline"],
    ["Bra balans mellan pris och utbud", "Ingen bindningstid", "Enkel digital ansökan"],
  ],
};

function telekomQuotes(item: Extract<ComparableItem, { kind: "telekom" }>, needs: string[]): Quote[] {
  const highlightSets = TELEKOM_HIGHLIGHTS[item.typ];
  const extrasCost = needs.length * 12;
  return withMatchedNeeds(
    "telekom",
    needs,
    TELEKOM_ALT.map((alt, i) => ({
      id: alt.id,
      name: alt.name,
      price: Math.max(29, Math.round(item.prisPerManad * alt.mult) + extrasCost),
      rating: alt.rating,
      highlights: highlightSets[i],
    })).sort((a, b) => a.price - b.price)
  );
}

const KREDITKORT_CARDS = [
  {
    id: "klarkort",
    name: "Klarkort",
    rating: 4.4,
    prioritet: "lag_avgift",
    highlights: ["Ingen årsavgift", "Enkel digital ansökan", "Bra grundvillkor"],
  },
  {
    id: "kontokraft",
    name: "Kontokraft",
    rating: 4.6,
    prioritet: "bonus",
    highlights: ["Bonusprogram på alla köp", "Extra bonus första året", "Mobilt köpskydd"],
  },
  {
    id: "guldkortet",
    name: "Guldkortet",
    rating: 4.2,
    prioritet: "hog_kreditgrans",
    highlights: ["Hög kreditgräns", "Ingen övre gräns för uttag", "Prioriterad kundservice"],
  },
  {
    id: "silverkortet",
    name: "Silverkortet",
    rating: 4.3,
    prioritet: "reseforsakring",
    highlights: ["Utökad reseförsäkring ingår", "Avbeställningsskydd ingår", "Reseavtal upp till 90 dagar"],
  },
];

function kreditkortQuotes(item: Extract<ComparableItem, { kind: "kreditkort" }>, needs: string[]): Quote[] {
  const extrasCost = needs.length * 12;
  if (item.harReddan) {
    const baseMonthly = (item.arsavgift ?? 495) / 12;
    const mults = [0, 0.6, 1.3, 0.9];
    return withMatchedNeeds(
      "kreditkort",
      needs,
      KREDITKORT_CARDS.map((c, i) => ({
        id: c.id,
        name: c.name,
        price: Math.max(0, Math.round(baseMonthly * mults[i]) + extrasCost),
        rating: c.rating,
        highlights: c.highlights,
      })).sort((a, b) => a.price - b.price)
    );
  }

  // Utforskar nytt kort — inget nuvarande pris att jämföra mot, så visa tre fasta
  // alternativ med olika styrkor och sätt det som matchar önskad prioritet överst.
  const flatPrices: Record<string, number> = { klarkort: 0, kontokraft: 29, guldkortet: 79, silverkortet: 49 };
  const priorityToId: Record<string, string> = {
    lag_avgift: "klarkort",
    bonus: "kontokraft",
    reseforsakring: "silverkortet",
    hog_kreditgrans: "guldkortet",
  };
  const preferredId = item.onskadPrioritet ? priorityToId[item.onskadPrioritet] : undefined;
  const ordered = preferredId
    ? [...KREDITKORT_CARDS].sort((a, b) => (a.id === preferredId ? -1 : b.id === preferredId ? 1 : 0))
    : KREDITKORT_CARDS;
  return withMatchedNeeds(
    "kreditkort",
    needs,
    ordered.map((c) => ({
      id: c.id,
      name: c.name,
      price: flatPrices[c.id] + extrasCost,
      rating: c.rating,
      highlights: c.highlights,
    }))
  );
}

function elQuotes(item: Extract<ComparableItem, { kind: "el" }>, needs: string[]): Quote[] {
  const baseMonthly = ((item.arsforbrukningKwh ?? 5000) * 1.2) / 12;
  const extrasCost = needs.length * 12;
  return withMatchedNeeds(
    "el",
    needs,
    [
      { id: "klarstrom", name: "Klarström", price: Math.round(baseMonthly * 0.88) + extrasCost, rating: 4.3, highlights: ["Rörligt pris, ingen bindningstid", "100% förnybar el", "Enkel uppsägning"] },
      { id: "kraftpunkt", name: "Kraftpunkt", price: Math.round(baseMonthly * 0.95) + extrasCost, rating: 4.5, highlights: ["Fast pris i 12 månader", "Prisgaranti", "Ingen påslagsavgift"] },
      { id: "voltec", name: "Voltec", price: Math.round(baseMonthly * 1.08) + extrasCost, rating: 4.0, highlights: ["Fast pris i 24 månader", "Bonus vid tecknande", "Elbilsrabatt"] },
      { id: "solkraft", name: "Solkraft", price: Math.round(baseMonthly * 1.25) + extrasCost, rating: 4.7, highlights: ["100% solenergi, garanterat ursprung", "Högst kundbetyg av de fyra", "Överskott återinvesteras i ny solkraft"] },
    ].sort((a, b) => a.price - b.price)
  );
}

export function computeItemQuotes(item: ComparableItem, extras: string[]): Quote[] {
  switch (item.kind) {
    case "boende":
      return boendeQuotes(item, extras);
    case "bil":
      return bilQuotes(item, extras);
    case "ovrigt_fordon":
      return ovrigtFordonQuotes(item, extras);
    case "person":
      return personQuotes(item, extras);
    case "djur":
      return djurQuotes(item, extras);
    case "telekom":
      return telekomQuotes(item, extras);
    case "kreditkort":
      return kreditkortQuotes(item, extras);
    case "el":
      return elQuotes(item, extras);
  }
}

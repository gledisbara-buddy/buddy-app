import type { ComparableItem, TelekomTyp } from "@/lib/items";
import type { Quote } from "@/lib/quote";

const RATING = { klarsaker: 4.6, hemgrund: 4.2, nordvakt: 4.4 };
const SELF_RISK = { klarsaker: 1500, hemgrund: 2000, nordvakt: 1200 };

function build(id: "klarsaker" | "hemgrund" | "nordvakt", name: string, price: number, highlights: string[]): Quote {
  return { id, name, price: Math.max(29, Math.round(price)), selfRisk: SELF_RISK[id], rating: RATING[id], highlights };
}

const currentYear = new Date().getFullYear();

function boendeQuotes(item: Extract<ComparableItem, { kind: "boende" }>, extras: string[]): Quote[] {
  const extrasCost = extras.length * 14;

  if (item.typ === "magasinering") {
    const valueMult = item.uppskattatVarde < 10000 ? 0.8 : item.uppskattatVarde < 30000 ? 1 : 1.3;
    const sizeMult = item.storlekM2 < 5 ? 0.8 : item.storlekM2 < 15 ? 1 : 1.3;
    const mult = valueMult * sizeMult;
    return [
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
    ].sort((a, b) => a.price - b.price);
  }

  const typMult = { hyresratt: 1, bostadsratt: 1.1, villa: 1.35, fritidshus: 1.3, fritidsbostadsratt: 1.15 }[item.typ];
  const boytaMult = item.boyta < 50 ? 0.9 : item.boyta < 100 ? 1.15 : item.boyta < 150 ? 1.35 : 1.6;
  const personAdd = Math.max(0, item.hushallsstorlek - 1) * 12;
  const larm = "larm" in item && item.larm;
  const larmMult = larm ? 0.95 : 1;

  const base = (v: number) => (v * typMult * boytaMult + personAdd) * larmMult + extrasCost;

  return [
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
  ].sort((a, b) => a.price - b.price);
}

function bilQuotes(item: Extract<ComparableItem, { kind: "bil" }>, extras: string[]): Quote[] {
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
  const extrasCost = extras.length * 20;

  return [
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
  ].sort((a, b) => a.price - b.price);
}

function ovrigtFordonQuotes(item: Extract<ComparableItem, { kind: "ovrigt_fordon" }>): Quote[] {
  const typMult = { mc: 1.2, husvagn: 1.1, bat: 1.4, slap: 0.6, annat: 1 }[item.fordonstyp];
  const effektMult = item.fordonstyp === "mc" && item.effektHk && item.effektHk > 80 ? 1.15 : 1;
  const mult = typMult * effektMult;

  return [
    build("klarsaker", "Klarsäker", 89 * mult, [
      "Fullvärdesskydd, ingen övre gräns",
      "Gäller även utomlands",
      "Skadeanmälan digitalt, snittbeslut inom 2 dagar",
    ]),
    build("hemgrund", "Hemgrund", 79 * mult, [
      "Lägst grundpris av de tre",
      "Bra grundskydd, färre tillägg ingår",
      "Telefonsupport vardagar 8–17",
    ]),
    build("nordvakt", "Nordvakt", 95 * mult, [
      "Lägst självrisk av de tre",
      "Inkluderar assistans vid haveri",
      "Prisgaranti — matchar lägre pris hos annat bolag",
    ]),
  ].sort((a, b) => a.price - b.price);
}

function personQuotes(item: Extract<ComparableItem, { kind: "person" }>): Quote[] {
  const relationMult = item.relation === "barn" ? 0.7 : 1;
  const skyddAdd = item.onskatSkydd.length * 15;
  const base = (v: number) => v * relationMult + skyddAdd;

  return [
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
  ].sort((a, b) => a.price - b.price);
}

function djurQuotes(item: Extract<ComparableItem, { kind: "djur" }>): Quote[] {
  const typMult = { hund: 1.15, katt: 1, annat: 0.8 }[item.djurtyp];
  const viktMult = !item.viktKg ? 1 : item.viktKg < 10 ? 0.9 : item.viktKg < 25 ? 1.1 : 1.3;
  const age = item.fodelsear ? currentYear - item.fodelsear : 3;
  const ageMult = age < 3 ? 0.9 : age < 8 ? 1 : 1.2;
  const kastreradMult = item.kastrerad ? 0.95 : 1;
  const mult = typMult * viktMult * ageMult * kastreradMult;

  return [
    build("klarsaker", "Klarsäker", 129 * mult, [
      "Ersätter veterinärvård utan övre gräns",
      "Gäller från dag ett, ingen karenstid på olycksfall",
      "Skadeanmälan digitalt, snittbeslut inom 2 dagar",
    ]),
    build("hemgrund", "Hemgrund", 109 * mult, [
      "Lägst grundpris av de tre",
      "Bra grundskydd för veterinärvård",
      "Telefonsupport vardagar 8–17",
    ]),
    build("nordvakt", "Nordvakt", 145 * mult, [
      "Lägst självrisk av de tre",
      "Livförsäkring för djuret ingår",
      "Prisgaranti — matchar lägre pris hos annat bolag",
    ]),
  ].sort((a, b) => a.price - b.price);
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
];

const TELEKOM_HIGHLIGHTS: Record<TelekomTyp, string[][]> = {
  mobil: [
    ["Samma datamängd, lägre pris", "Ingen bindningstid", "Byt när du vill"],
    ["Bra nätverkstäckning", "Fri surf inom EU", "Kundservice dygnet runt"],
    ["Prisgaranti i 24 månader", "Familjerabatt vid fler abonnemang", "5G ingår"],
  ],
  bredband: [
    ["Samma hastighet, lägre pris", "Ingen bindningstid", "Fri installation"],
    ["Stabil uppkoppling", "Router ingår", "Kundservice dygnet runt"],
    ["Prisgaranti i 24 månader", "Dubbel hastighet första året", "Bonus vid byte"],
  ],
  tv_streaming: [
    ["Liknande utbud, lägre pris", "Ingen bindningstid", "Avsluta när du vill"],
    ["Bredare kanalutbud", "Flera profiler ingår", "4K ingår"],
    ["Bonusinnehåll ingår", "Dela med hela familjen", "Nedladdning offline"],
  ],
};

function telekomQuotes(item: Extract<ComparableItem, { kind: "telekom" }>): Quote[] {
  const highlightSets = TELEKOM_HIGHLIGHTS[item.typ];
  return TELEKOM_ALT.map((alt, i) => ({
    id: alt.id,
    name: alt.name,
    price: Math.max(29, Math.round(item.prisPerManad * alt.mult)),
    rating: alt.rating,
    highlights: highlightSets[i],
  })).sort((a, b) => a.price - b.price);
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
    highlights: ["Hög kreditgräns", "Utökad reseförsäkring ingår", "Prioriterad kundservice"],
  },
];

function kreditkortQuotes(item: Extract<ComparableItem, { kind: "kreditkort" }>): Quote[] {
  if (item.harReddan) {
    const baseMonthly = (item.arsavgift ?? 495) / 12;
    const mults = [0, 0.6, 1.3];
    return KREDITKORT_CARDS.map((c, i) => ({
      id: c.id,
      name: c.name,
      price: Math.max(0, Math.round(baseMonthly * mults[i])),
      rating: c.rating,
      highlights: c.highlights,
    })).sort((a, b) => a.price - b.price);
  }

  // Utforskar nytt kort — inget nuvarande pris att jämföra mot, så visa tre fasta
  // alternativ med olika styrkor och sätt det som matchar önskad prioritet överst.
  const flatPrices: Record<string, number> = { klarkort: 0, kontokraft: 29, guldkortet: 79 };
  const priorityToId: Record<string, string> = {
    lag_avgift: "klarkort",
    bonus: "kontokraft",
    reseforsakring: "guldkortet",
    hog_kreditgrans: "guldkortet",
  };
  const preferredId = item.onskadPrioritet ? priorityToId[item.onskadPrioritet] : undefined;
  const ordered = preferredId
    ? [...KREDITKORT_CARDS].sort((a, b) => (a.id === preferredId ? -1 : b.id === preferredId ? 1 : 0))
    : KREDITKORT_CARDS;
  return ordered.map((c) => ({ id: c.id, name: c.name, price: flatPrices[c.id], rating: c.rating, highlights: c.highlights }));
}

function elQuotes(item: Extract<ComparableItem, { kind: "el" }>): Quote[] {
  const baseMonthly = ((item.arsforbrukningKwh ?? 5000) * 1.2) / 12;
  return [
    { id: "klarstrom", name: "Klarström", price: Math.round(baseMonthly * 0.88), rating: 4.3, highlights: ["Rörligt pris, ingen bindningstid", "100% förnybar el", "Enkel uppsägning"] },
    { id: "kraftpunkt", name: "Kraftpunkt", price: Math.round(baseMonthly * 0.95), rating: 4.5, highlights: ["Fast pris i 12 månader", "Prisgaranti", "Ingen påslagsavgift"] },
    { id: "voltec", name: "Voltec", price: Math.round(baseMonthly * 1.08), rating: 4.0, highlights: ["Fast pris i 24 månader", "Bonus vid tecknande", "Elbilsrabatt"] },
  ].sort((a, b) => a.price - b.price);
}

export function computeItemQuotes(item: ComparableItem, extras: string[]): Quote[] {
  switch (item.kind) {
    case "boende":
      return boendeQuotes(item, extras);
    case "bil":
      return bilQuotes(item, extras);
    case "ovrigt_fordon":
      return ovrigtFordonQuotes(item);
    case "person":
      return personQuotes(item);
    case "djur":
      return djurQuotes(item);
    case "telekom":
      return telekomQuotes(item);
    case "kreditkort":
      return kreditkortQuotes(item);
    case "el":
      return elQuotes(item);
  }
}

export const ITEM_KINDS_WITH_EXTRAS = ["boende", "bil"] as const;

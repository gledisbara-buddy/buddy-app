import type { InsuranceItem } from "@/lib/items";
import type { Quote } from "@/lib/quote";

const RATING = { klarsaker: 4.6, hemgrund: 4.2, nordvakt: 4.4 };
const SELF_RISK = { klarsaker: 1500, hemgrund: 2000, nordvakt: 1200 };

function build(id: "klarsaker" | "hemgrund" | "nordvakt", name: string, price: number, highlights: string[]): Quote {
  return { id, name, price: Math.max(29, Math.round(price)), selfRisk: SELF_RISK[id], rating: RATING[id], highlights };
}

const currentYear = new Date().getFullYear();

function boendeQuotes(item: Extract<InsuranceItem, { kind: "boende" }>, extras: string[]): Quote[] {
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

function bilQuotes(item: Extract<InsuranceItem, { kind: "bil" }>, extras: string[]): Quote[] {
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

function ovrigtFordonQuotes(item: Extract<InsuranceItem, { kind: "ovrigt_fordon" }>): Quote[] {
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

function personQuotes(item: Extract<InsuranceItem, { kind: "person" }>): Quote[] {
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

function djurQuotes(item: Extract<InsuranceItem, { kind: "djur" }>): Quote[] {
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

export function computeItemQuotes(item: InsuranceItem, extras: string[]): Quote[] {
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
  }
}

export const ITEM_KINDS_WITH_EXTRAS = ["boende", "bil"] as const;

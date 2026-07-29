import { Bike, Building2, Home, Plane, ShieldCheck, Umbrella, type LucideIcon } from "lucide-react";

export type Quote = {
  id: string;
  name: string;
  price: number;
  selfRisk: number;
  rating: number;
  highlights: string[];
};

export type HousingId = "lagenhet" | "villa" | "radhus";
export type ValueId = "low" | "mid" | "high";
export type ExtraId = "cykel" | "resa" | "drulle" | "brf";

export const HOUSING_OPTIONS: { id: HousingId; label: string; icon: LucideIcon }[] = [
  { id: "lagenhet", label: "Lägenhet", icon: Building2 },
  { id: "villa", label: "Villa", icon: Home },
  { id: "radhus", label: "Radhus / Kedjehus", icon: Home },
];

export const VALUE_OPTIONS: { id: ValueId; label: string; desc: string }[] = [
  { id: "low", label: "Under 300 000 kr", desc: "Litet hushåll, få större värdesaker" },
  { id: "mid", label: "300 000–700 000 kr", desc: "Vanligt för de flesta hushåll" },
  { id: "high", label: "Över 700 000 kr", desc: "Större hem eller mycket lösöre" },
];

export const EXTRA_OPTIONS: { id: ExtraId; label: string; icon: LucideIcon }[] = [
  { id: "cykel", label: "Cykel över 15 000 kr", icon: Bike },
  { id: "resa", label: "Reseskydd", icon: Plane },
  { id: "drulle", label: "Drulle / Allrisk", icon: Umbrella },
  { id: "brf", label: "Bostadsrättstillägg", icon: ShieldCheck },
];

export function computeQuotes({
  housing,
  value,
  household,
  extras,
}: {
  housing: HousingId | null;
  value: ValueId | null;
  household: number;
  extras: ExtraId[];
}): Quote[] {
  const base = { klarsaker: 99, hemgrund: 89, nordvakt: 105 };
  const valueMult = (value && { low: 1, mid: 1.25, high: 1.6 }[value]) || 1.15;
  const housingAdd = (housing && { lagenhet: 0, radhus: 18, villa: 34 }[housing]) || 0;
  const perPerson = Math.max(0, household - 1) * 12;
  const extrasCost = extras.length * 14;
  const build = (
    name: string,
    id: string,
    baseVal: number,
    selfRisk: number,
    rating: number,
    highlights: string[]
  ): Quote => ({
    id,
    name,
    price: Math.round((baseVal + housingAdd + perPerson) * valueMult + extrasCost),
    selfRisk,
    rating,
    highlights,
  });
  return [
    build("Klarsäker", "klarsaker", base.klarsaker, 1500, 4.6, [
      "Fullvärdesskydd för lösöre, ingen övre gräns",
      "Drulleskydd ingår redan i grundpriset",
      "Skadeanmälan digitalt, snittbeslut inom 2 dagar",
    ]),
    build("Hemgrund", "hemgrund", base.hemgrund, 2000, 4.2, [
      "Lägst grundpris av de tre",
      "Bra grundskydd, färre tillägg ingår",
      "Telefonsupport vardagar 8–17",
    ]),
    build("Nordvakt", "nordvakt", base.nordvakt, 1200, 4.4, [
      "Lägst självrisk av de tre",
      "Extra starkt reseskydd (90 dagar)",
      "Prisgaranti — matchar lägre pris hos annat bolag",
    ]),
  ].sort((a, b) => a.price - b.price);
}

export function pickWinner(quotes: Quote[], priority: string | null): string {
  if (priority === "skydd") return [...quotes].sort((a, b) => b.rating - a.rating)[0].id;
  if (priority === "snabbhet") return "klarsaker";
  return quotes[0].id;
}

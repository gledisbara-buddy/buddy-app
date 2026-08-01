import { Bike, Plane, ShieldCheck, Umbrella, type LucideIcon } from "lucide-react";
import { Car, Fuel, Wrench } from "lucide-react";

export type Quote = {
  id: string;
  name: string;
  price: number;
  selfRisk?: number;
  rating?: number;
  highlights: string[];
  // "compared" = jämförd och tecknad via Buddys jämförelseflöde (CompareFlow).
  // "fetched" = auto-hämtad från kundens befintliga bolag, inte jämförd än.
  source?: "compared" | "fetched";
  forfallodatum?: string;
  omfattning?: string;
};

export type ExtraId = "cykel" | "resa" | "drulle" | "brf";

export const EXTRA_OPTIONS: { id: ExtraId; label: string; icon: LucideIcon }[] = [
  { id: "cykel", label: "Cykel över 15 000 kr", icon: Bike },
  { id: "resa", label: "Reseskydd", icon: Plane },
  { id: "drulle", label: "Drulle / Allrisk", icon: Umbrella },
  { id: "brf", label: "Bostadsrättstillägg", icon: ShieldCheck },
];

export type BilExtraId = "hyrbil" | "glas" | "assistans";

export const BIL_EXTRA_OPTIONS: { id: BilExtraId; label: string; icon: LucideIcon }[] = [
  { id: "hyrbil", label: "Hyrbil vid verkstadsbesök", icon: Car },
  { id: "glas", label: "Utökat glasskydd", icon: Wrench },
  { id: "assistans", label: "Vägassistans dygnet runt", icon: Fuel },
];

export function pickWinner(quotes: Quote[], priority: string | null): string {
  if (priority === "skydd") return [...quotes].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0].id;
  return quotes[0].id;
}

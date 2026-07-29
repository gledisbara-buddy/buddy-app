import { Briefcase, Car, HeartPulse, Home, type LucideIcon } from "lucide-react";

export type InsuranceId = "hem" | "bil" | "villa" | "olycksfall" | "foretag";

export const INSURANCE_META: Record<
  InsuranceId,
  { label: string; icon: LucideIcon; forCompany: boolean }
> = {
  hem: { label: "Hemförsäkring", icon: Home, forCompany: false },
  bil: { label: "Bilförsäkring", icon: Car, forCompany: false },
  villa: { label: "Villaförsäkring", icon: Home, forCompany: false },
  olycksfall: { label: "Olycksfall / Person", icon: HeartPulse, forCompany: false },
  foretag: { label: "Företagsförsäkring", icon: Briefcase, forCompany: true },
};

export const PRIORITY_OPTIONS = [
  { id: "pris", label: "Lägre pris", desc: "Jag vill inte betala mer än jag behöver." },
  {
    id: "skydd",
    label: "Bättre skydd",
    desc: "Jag vill vara säker på att jag täcks vid en skada.",
  },
  {
    id: "snabbhet",
    label: "Snabbare skadehantering",
    desc: "Om något händer vill jag ha svar snabbt.",
  },
  {
    id: "hjalp",
    label: "Jag vet inte, vill ha hjälp",
    desc: "Föreslå det som passar mig bäst.",
  },
] as const;

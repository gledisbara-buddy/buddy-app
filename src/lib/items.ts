import { Car, Caravan, Home, PawPrint, UserRound, type LucideIcon } from "lucide-react";

export type BoendeTyp = "villa" | "lagenhet" | "radhus" | "fritidshus";
export type FordonTyp = "mc" | "husvagn" | "bat" | "slap" | "annat";
export type DjurTyp = "hund" | "katt" | "annat";
export type PersonRelation = "mig-sjalv" | "partner" | "barn" | "annan";

export type BoendeItem = {
  id: string;
  kind: "boende";
  typ: BoendeTyp;
  adress: string;
  postnummer: string;
  ort: string;
  boyta: number;
  byggar?: number;
  hushallsstorlek: number;
};

export type BilItem = {
  id: string;
  kind: "bil";
  regnummer: string;
  markeModell?: string;
  arsmodell?: number;
  forvaring?: "garage" | "uppfart" | "gata";
};

export type OvrigtFordonItem = {
  id: string;
  kind: "ovrigt_fordon";
  fordonstyp: FordonTyp;
  regnummer?: string;
  markeModell?: string;
};

export type PersonItem = {
  id: string;
  kind: "person";
  namn: string;
  personnummer: string;
  relation: PersonRelation;
};

export type DjurItem = {
  id: string;
  kind: "djur";
  djurtyp: DjurTyp;
  namn: string;
  ras?: string;
  fodelsear?: number;
};

export type InsuranceItem = BoendeItem | BilItem | OvrigtFordonItem | PersonItem | DjurItem;
export type ItemKind = InsuranceItem["kind"];

export const ITEM_CATEGORIES: { kind: ItemKind; label: string; icon: LucideIcon }[] = [
  { kind: "boende", label: "Boende", icon: Home },
  { kind: "bil", label: "Bil", icon: Car },
  { kind: "ovrigt_fordon", label: "Övrigt fordon", icon: Caravan },
  { kind: "person", label: "Person", icon: UserRound },
  { kind: "djur", label: "Djur", icon: PawPrint },
];

export const BOENDE_TYP_LABELS: Record<BoendeTyp, string> = {
  villa: "Villa",
  lagenhet: "Lägenhet",
  radhus: "Radhus / Kedjehus",
  fritidshus: "Fritidshus",
};

export const FORDON_TYP_LABELS: Record<FordonTyp, string> = {
  mc: "Motorcykel",
  husvagn: "Husvagn",
  bat: "Båt",
  slap: "Släp",
  annat: "Annat",
};

export const DJUR_TYP_LABELS: Record<DjurTyp, string> = {
  hund: "Hund",
  katt: "Katt",
  annat: "Annat",
};

export const PERSON_RELATION_LABELS: Record<PersonRelation, string> = {
  "mig-sjalv": "Jag själv",
  partner: "Partner",
  barn: "Barn",
  annan: "Annan",
};

export function createItemId(): string {
  return crypto.randomUUID();
}

export function itemSummary(item: InsuranceItem): string {
  switch (item.kind) {
    case "boende":
      return `${item.adress}, ${item.ort} · ${item.boyta} m²`;
    case "bil":
      return item.markeModell ? `${item.markeModell} · ${item.regnummer}` : item.regnummer;
    case "ovrigt_fordon":
      return item.regnummer
        ? `${FORDON_TYP_LABELS[item.fordonstyp]} · ${item.regnummer}`
        : FORDON_TYP_LABELS[item.fordonstyp];
    case "person":
      return `${item.namn} · ${PERSON_RELATION_LABELS[item.relation]}`;
    case "djur":
      return `${item.namn} (${DJUR_TYP_LABELS[item.djurtyp]})`;
  }
}

export function itemTitle(item: InsuranceItem): string {
  switch (item.kind) {
    case "boende":
      return BOENDE_TYP_LABELS[item.typ];
    case "bil":
      return "Bil";
    case "ovrigt_fordon":
      return FORDON_TYP_LABELS[item.fordonstyp];
    case "person":
      return "Personförsäkring";
    case "djur":
      return DJUR_TYP_LABELS[item.djurtyp];
  }
}

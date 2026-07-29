import { Car, Caravan, Home, PawPrint, UserRound, type LucideIcon } from "lucide-react";

export type BoendeTyp = "hyresratt" | "bostadsratt" | "villa" | "fritidshus" | "fritidsbostadsratt" | "magasinering";
export type FordonTyp = "mc" | "husvagn" | "bat" | "slap" | "annat";
export type DjurTyp = "hund" | "katt" | "annat";
export type PersonRelation = "mig-sjalv" | "partner" | "barn" | "annan";
export type ForvaringsTyp = "forrad" | "kallarforrad" | "container" | "boxlager" | "annat";
export type Sysselsattning = "anstalld" | "egenforetagare" | "student" | "arbetssokande" | "pensionar";
export type OnskatSkydd = "olycksfall" | "sjukdom" | "liv" | "barnforsakring";
export type InneUte = "inne" | "ute" | "bade";

type BostadBase = {
  id: string;
  kind: "boende";
  adress: string;
  postnummer: string;
  ort: string;
  boyta: number;
  hushallsstorlek: number;
};

export type HyresrattItem = BostadBase & {
  typ: "hyresratt";
  biarea?: number;
  sakerhetsdorr: boolean;
  larm: boolean;
};

export type BostadsrattItem = BostadBase & {
  typ: "bostadsratt";
  biarea?: number;
  sakerhetsdorr: boolean;
  larm: boolean;
  bostadsrattstillagg: boolean;
};

export type FritidsbostadsrattItem = BostadBase & {
  typ: "fritidsbostadsratt";
  biarea?: number;
  sakerhetsdorr: boolean;
  larm: boolean;
  bostadsrattstillagg: boolean;
};

export type OvrigByggnad = { id: string; typ: string; byggyta: number };

export type VillaItem = BostadBase & {
  typ: "villa" | "fritidshus";
  antalBadDusch: number;
  skorsten: boolean;
  ovrigaByggnader: OvrigByggnad[];
  indragetVatten: boolean;
  antalPlan: number;
  kallare: boolean;
  larm: boolean;
};

export type MagasineringItem = {
  id: string;
  kind: "boende";
  typ: "magasinering";
  adress: string;
  postnummer: string;
  ort: string;
  forvaringstyp: ForvaringsTyp;
  storlekM2: number;
  innehall: string;
  uppskattatVarde: number;
};

export type BoendeItem =
  | HyresrattItem
  | BostadsrattItem
  | FritidsbostadsrattItem
  | VillaItem
  | MagasineringItem;

export type BilItem = {
  id: string;
  kind: "bil";
  regnummer: string;
  markeModell?: string;
  arsmodell?: number;
  arligKorstracka?: number;
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
  sysselsattning?: Sysselsattning;
  onskatSkydd: OnskatSkydd[];
};

export type DjurItem = {
  id: string;
  kind: "djur";
  djurtyp: DjurTyp;
  namn: string;
  ras?: string;
  fodelsear?: number;
  viktKg?: number;
  kastrerad?: boolean;
  inneUte?: InneUte;
  reserUtomlands?: boolean;
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
  hyresratt: "Hyresrätt",
  bostadsratt: "Bostadsrätt",
  villa: "Villa",
  fritidshus: "Fritidshus",
  fritidsbostadsratt: "Fritidsbostadsrätt",
  magasinering: "Magasinering",
};

export const FORVARINGS_TYP_LABELS: Record<ForvaringsTyp, string> = {
  forrad: "Förråd",
  kallarforrad: "Källarförråd",
  container: "Container",
  boxlager: "Boxlager",
  annat: "Annat",
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

export const SYSSELSATTNING_LABELS: Record<Sysselsattning, string> = {
  anstalld: "Anställd",
  egenforetagare: "Egenföretagare",
  student: "Student",
  arbetssokande: "Arbetssökande",
  pensionar: "Pensionär",
};

export const ONSKAT_SKYDD_LABELS: Record<OnskatSkydd, string> = {
  olycksfall: "Olycksfall",
  sjukdom: "Sjuk- och efterlevandeskydd",
  liv: "Livförsäkring",
  barnforsakring: "Barnförsäkring",
};

export const INNE_UTE_LABELS: Record<InneUte, string> = {
  inne: "Innedjur",
  ute: "Utedjur",
  bade: "Både och",
};

export function createItemId(): string {
  return crypto.randomUUID();
}

export function itemSummary(item: InsuranceItem): string {
  switch (item.kind) {
    case "boende":
      if (item.typ === "magasinering") {
        return `${FORVARINGS_TYP_LABELS[item.forvaringstyp]}, ${item.ort} · ${item.storlekM2} m²`;
      }
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

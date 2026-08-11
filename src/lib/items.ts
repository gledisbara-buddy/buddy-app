import {
  Car,
  Caravan,
  CreditCard,
  Home,
  PawPrint,
  Repeat,
  ShieldCheck,
  UserRound,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

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

export type BatMotorTyp = "inombordare" | "utombordare" | "segel" | "ingen";

export type OvrigtFordonItem = {
  id: string;
  kind: "ovrigt_fordon";
  fordonstyp: FordonTyp;
  regnummer?: string;
  markeModell?: string;
  arsmodell?: number;
  // mc
  cylindervolymCc?: number;
  effektHk?: number;
  // husvagn
  totalviktKg?: number;
  langdM?: number;
  // bat
  motortyp?: BatMotorTyp;
  // slap
  maxlastKg?: number;
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

export type AnslutningTyp = "fiber" | "kabel" | "mobilt" | "dsl";

export type MobilAbonnemangItem = {
  id: string;
  kind: "telekom";
  typ: "mobil";
  operator: string;
  dataGb?: number;
  obegransatData: boolean;
  prisPerManad: number;
  bindningstidManader?: number;
  // "D MMM YYYY" (samma format som Quote.forfallodatum, se dates.ts) —
  // låter Att göra-listan räkna ner till förnyelse även för poster som
  // aldrig går igenom jämförelseflödet och därför inte får en Quote.
  forfallodatum?: string;
};

export type BredbandItem = {
  id: string;
  kind: "telekom";
  typ: "bredband";
  operator: string;
  hastighetMbit?: number;
  anslutning: AnslutningTyp;
  prisPerManad: number;
  bindningstidManader?: number;
  forfallodatum?: string;
};

export type TvStreamingItem = {
  id: string;
  kind: "telekom";
  typ: "tv_streaming";
  tjanst: string;
  prisPerManad: number;
  delatKonto: boolean;
  forfallodatum?: string;
};

export type TelekomItem = MobilAbonnemangItem | BredbandItem | TvStreamingItem;
export type TelekomTyp = TelekomItem["typ"];

export type OnskadKreditkortPrioritet = "lag_avgift" | "bonus" | "reseforsakring" | "hog_kreditgrans";

export type KreditkortItem = {
  id: string;
  kind: "kreditkort";
  harReddan: boolean;
  // harReddan = true
  utgivare?: string;
  kortnamn?: string;
  arsavgift?: number;
  ranta?: number;
  kreditgrans?: number;
  bonusprogram?: boolean;
  // harReddan = false (utforskar nytt kort)
  onskadPrioritet?: OnskadKreditkortPrioritet;
};

export type Avtalstyp = "rorligt" | "fast" | "mix";
export type Elomrade = "SE1" | "SE2" | "SE3" | "SE4";

export type ElItem = {
  id: string;
  kind: "el";
  elbolag: string;
  avtalstyp: Avtalstyp;
  elomrade: Elomrade;
  arsforbrukningKwh?: number;
  bindningstidManader?: number;
};

export type PrenumerationItem = {
  id: string;
  kind: "prenumeration";
  namn: string;
  leverantor?: string;
  prisPerManad: number;
  bindningstidManader?: number;
  forfallodatum?: string;
};

export type InsuranceItem =
  | BoendeItem
  | BilItem
  | OvrigtFordonItem
  | PersonItem
  | DjurItem
  | TelekomItem
  | KreditkortItem
  | ElItem
  | PrenumerationItem;
export type ItemKind = InsuranceItem["kind"];

// Kinds with a working comparison/quote engine (lib/item-quotes.ts). Prenumeration
// stays data-collection only — it's an open catch-all category with no natural
// "alternatives" to compare against.
export type ComparableItem =
  | BoendeItem
  | BilItem
  | OvrigtFordonItem
  | PersonItem
  | DjurItem
  | TelekomItem
  | KreditkortItem
  | ElItem;
export const COMPARABLE_KINDS: ItemKind[] = ["boende", "bil", "ovrigt_fordon", "person", "djur", "telekom", "kreditkort", "el"];
export function isComparableItem(item: InsuranceItem): item is ComparableItem {
  return COMPARABLE_KINDS.includes(item.kind);
}

export const ITEM_CATEGORIES: { kind: ItemKind; label: string; icon: LucideIcon }[] = [
  { kind: "boende", label: "Boende", icon: Home },
  { kind: "bil", label: "Bil", icon: Car },
  { kind: "ovrigt_fordon", label: "Övrigt fordon", icon: Caravan },
  { kind: "person", label: "Person", icon: UserRound },
  { kind: "djur", label: "Djur", icon: PawPrint },
  { kind: "telekom", label: "Mobil & bredband", icon: Wifi },
  { kind: "kreditkort", label: "Kreditkort", icon: CreditCard },
  { kind: "el", label: "El & energi", icon: Zap },
  { kind: "prenumeration", label: "Övriga abonnemang", icon: Repeat },
];

export const TELEKOM_TYP_LABELS: Record<TelekomTyp, string> = {
  mobil: "Mobilabonnemang",
  bredband: "Bredband",
  tv_streaming: "TV & streaming",
};

export type ItemGroupId = "forsakring" | "mobil" | "prenumeration" | "ekonomi";

// Vad en "Lägg till"-knapp inom en grupp länkar till — typ är bara satt när
// den ska hoppa förbi TelekomForms interna 3-vägsval (se TelekomForm.tsx).
export type AddTarget = { kind: ItemKind; typ?: TelekomTyp; label: string; icon: LucideIcon };

function addTargetsFromKinds(kinds: ItemKind[]): AddTarget[] {
  return kinds.map((kind) => {
    const cat = ITEM_CATEGORIES.find((c) => c.kind === kind)!;
    return { kind: cat.kind, label: cat.label, icon: cat.icon };
  });
}

const FORSAKRING_KINDS: ItemKind[] = ["boende", "bil", "ovrigt_fordon", "person", "djur"];
const EKONOMI_KINDS: ItemKind[] = ["kreditkort", "el"];

export const ITEM_GROUPS: {
  id: ItemGroupId;
  label: string;
  icon: LucideIcon;
  kinds: ItemKind[];
  matchesItem: (item: InsuranceItem) => boolean;
  addTargets: AddTarget[];
}[] = [
  {
    id: "forsakring",
    label: "Försäkringar",
    icon: ShieldCheck,
    kinds: FORSAKRING_KINDS,
    matchesItem: (item) => FORSAKRING_KINDS.includes(item.kind),
    addTargets: addTargetsFromKinds(FORSAKRING_KINDS),
  },
  {
    id: "mobil",
    label: "Mobilabonnemang",
    icon: Wifi,
    kinds: ["telekom"],
    matchesItem: (item) => item.kind === "telekom" && item.typ === "mobil",
    addTargets: [{ kind: "telekom", typ: "mobil", label: TELEKOM_TYP_LABELS.mobil, icon: Wifi }],
  },
  {
    id: "prenumeration",
    label: "Prenumerationer",
    icon: Repeat,
    kinds: ["prenumeration"],
    matchesItem: (item) => item.kind === "prenumeration" || (item.kind === "telekom" && item.typ !== "mobil"),
    addTargets: [
      { kind: "telekom", typ: "bredband", label: TELEKOM_TYP_LABELS.bredband, icon: Wifi },
      { kind: "telekom", typ: "tv_streaming", label: TELEKOM_TYP_LABELS.tv_streaming, icon: Wifi },
      { kind: "prenumeration", label: "Övriga abonnemang", icon: Repeat },
    ],
  },
  {
    id: "ekonomi",
    label: "Ekonomi",
    icon: Wallet,
    kinds: EKONOMI_KINDS,
    matchesItem: (item) => EKONOMI_KINDS.includes(item.kind),
    addTargets: addTargetsFromKinds(EKONOMI_KINDS),
  },
];

export function groupForKind(kind: ItemKind): ItemGroupId {
  return ITEM_GROUPS.find((g) => g.kinds.includes(kind))!.id;
}

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

export const BAT_MOTOR_LABELS: Record<BatMotorTyp, string> = {
  inombordare: "Inombordare",
  utombordare: "Utombordare",
  segel: "Segel",
  ingen: "Ingen motor",
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

export const ANSLUTNING_LABELS: Record<AnslutningTyp, string> = {
  fiber: "Fiber",
  kabel: "Kabel",
  mobilt: "Mobilt bredband",
  dsl: "DSL/ADSL",
};

export const ONSKAD_KREDITKORT_LABELS: Record<OnskadKreditkortPrioritet, string> = {
  lag_avgift: "Låg årsavgift",
  bonus: "Bonusprogram",
  reseforsakring: "Reseförsäkring ingår",
  hog_kreditgrans: "Hög kreditgräns",
};

export const AVTALSTYP_LABELS: Record<Avtalstyp, string> = {
  rorligt: "Rörligt pris",
  fast: "Fast pris",
  mix: "Mix (rörligt + fast)",
};

// Kataloger för snabbval i formulären — "Annat" (hanterat av PillGroupWithOther)
// täcker namn som inte finns i listan.
export const TELEKOM_MOBIL_OPERATORER = ["Telia", "Tele2", "Telenor", "Tre", "Halebop", "Comviq"] as const;
export const TELEKOM_BREDBAND_OPERATORER = ["Telia", "Bahnhof", "Bredbandsbolaget", "Tele2", "Telenor"] as const;
export const TV_STREAMING_TJANSTER = ["Netflix", "HBO Max", "Viaplay", "Disney+", "SVT Play", "Amazon Prime Video"] as const;
export const KREDITKORT_UTGIVARE = ["SEB", "Swedbank", "Handelsbanken", "Nordea", "ICA Banken", "Klarna", "Coop MedMera"] as const;
export const EL_BOLAG = ["Vattenfall", "E.ON", "Fortum", "Telge Energi", "Bixia", "Skellefteå Kraft"] as const;
export const PRENUMERATION_LEVERANTORER = ["SATS", "Fitness24Seven", "Storytel", "Audible"] as const;

// Riktiga svenska försäkringsbolag att välja bland i "Hämta automatiskt"-flödet.
export const FORSAKRINGSBOLAG = [
  "Aktsam",
  "Bliwa",
  "Dina Försäkringar",
  "Euro Accident",
  "Folksam",
  "Gjensidige",
  "Hedvig",
  "ICA Försäkring",
  "If",
  "Länsförsäkringar",
  "Moderna Försäkringar",
  "Movestic",
  "Skandia",
  "Solid Försäkring",
  "Svedea",
  "Trygg-Hansa",
  "Vardia",
  "Volvia",
] as const;

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
    case "telekom":
      if (item.typ === "mobil") {
        return `${item.operator} · ${item.obegransatData ? "Obegränsat" : `${item.dataGb ?? "?"} GB`} · ${item.prisPerManad} kr/mån`;
      }
      if (item.typ === "bredband") {
        return `${item.operator}${item.hastighetMbit ? ` · ${item.hastighetMbit} Mbit/s` : ""} · ${item.prisPerManad} kr/mån`;
      }
      return `${item.tjanst} · ${item.prisPerManad} kr/mån`;
    case "kreditkort":
      if (item.harReddan) {
        return `${item.utgivare ?? "Okänd utgivare"}${item.kortnamn ? ` · ${item.kortnamn}` : ""}`;
      }
      return item.onskadPrioritet ? `Utforskar · ${ONSKAD_KREDITKORT_LABELS[item.onskadPrioritet]}` : "Utforskar nytt kort";
    case "el":
      return `${item.elbolag} · ${AVTALSTYP_LABELS[item.avtalstyp]} · ${item.elomrade}`;
    case "prenumeration":
      return `${item.leverantor ? `${item.leverantor} · ` : ""}${item.prisPerManad} kr/mån`;
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
    case "telekom":
      return TELEKOM_TYP_LABELS[item.typ];
    case "kreditkort":
      return "Kreditkort";
    case "el":
      return "Elavtal";
    case "prenumeration":
      return item.namn;
  }
}

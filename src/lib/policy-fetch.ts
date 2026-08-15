import { createItemId, FORSAKRINGSBOLAG, type ComparableItem } from "@/lib/items";
import { formatSwedishDate } from "@/lib/dates";
import type { Quote } from "@/lib/quote";
import { VEHICLE_BOOK } from "@/lib/vehicle-lookup";

// Auto-hämtning via simulerad BankID-identifiering. telekom är undantaget
// — det har sitt eget operatörsuppslag på telefonnummer (TelekomForm.tsx),
// ett annat sorts uppslag som inte passar detta mönster.
export type FetchableKind = Extract<
  ComparableItem["kind"],
  "boende" | "bil" | "ovrigt_fordon" | "person" | "djur" | "kreditkort" | "el"
>;

// De fem försäkringskategorierna som kan ingå i en batch-import
// (BankIdImport.tsx/BankIdRescan.tsx). Kreditkort/el hämtas alltid var för
// sig via fetchExistingPolicy, aldrig i en gemensam batch — se
// buddy_customer_journey_v2-svaret om "varsin BankID, inte en för allt".
export type ForsakringFetchableKind = Extract<
  FetchableKind,
  "boende" | "bil" | "ovrigt_fordon" | "person" | "djur"
>;

function pick<T>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

function randomInRange([min, max]: readonly [number, number]): number {
  return Math.round(min + Math.random() * (max - min));
}

function randomFutureDate(): string {
  const now = new Date();
  const monthsAhead = 1 + Math.floor(Math.random() * 12);
  const d = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1 + Math.floor(Math.random() * 27));
  return formatSwedishDate(d);
}

// Exporterad så internverktyget (MissingInsuranceQueue.tsx) kan generera en
// plausibel post åt kunden när en anställd manuellt fyller i en försäkring
// som saknades i BankID-importen — samma syntetiseringslogik, bara startad
// av en anställd istället för kunden själv.
export function synthesizeItem(kind: FetchableKind): ComparableItem {
  switch (kind) {
    case "boende": {
      const home = pick([
        { adress: "Storgatan 12", postnummer: "112 34", ort: "Stockholm", boyta: 62, hushallsstorlek: 2 },
        { adress: "Kungsgatan 5", postnummer: "411 08", ort: "Göteborg", boyta: 78, hushallsstorlek: 3 },
        { adress: "Södra Vägen 9", postnummer: "222 22", ort: "Lund", boyta: 45, hushallsstorlek: 1 },
      ]);
      return {
        id: createItemId(),
        kind: "boende",
        typ: "bostadsratt",
        ...home,
        sakerhetsdorr: true,
        larm: false,
        bostadsrattstillagg: true,
      };
    }
    case "bil": {
      const [regnummer, info] = pick(Object.entries(VEHICLE_BOOK));
      return {
        id: createItemId(),
        kind: "bil",
        regnummer,
        markeModell: info.markeModell,
        arsmodell: info.arsmodell,
        arligKorstracka: 1500,
        forvaring: "garage",
      };
    }
    case "ovrigt_fordon": {
      const fordon = pick([
        { fordonstyp: "mc" as const, markeModell: "Kawasaki Z650", arsmodell: 2021, cylindervolymCc: 649, effektHk: 68 },
        { fordonstyp: "bat" as const, markeModell: "Buster XL", arsmodell: 2018, langdM: 6, motortyp: "utombordare" as const },
        { fordonstyp: "husvagn" as const, markeModell: "Kabe Royal", arsmodell: 2019, totalviktKg: 1400, langdM: 7 },
      ]);
      return { id: createItemId(), kind: "ovrigt_fordon", ...fordon };
    }
    case "person": {
      return {
        id: createItemId(),
        kind: "person",
        namn: "Du",
        personnummer: "199001011234",
        relation: "mig-sjalv",
        onskatSkydd: ["olycksfall"],
      };
    }
    case "djur": {
      const djur = pick([
        { djurtyp: "hund" as const, namn: "Bruno", ras: "Labrador", fodelsear: 2020, viktKg: 28, kastrerad: true, inneUte: "bade" as const },
        { djurtyp: "katt" as const, namn: "Molly", ras: "Maine Coon", fodelsear: 2019, viktKg: 5, kastrerad: true, inneUte: "inne" as const },
      ]);
      return { id: createItemId(), kind: "djur", ...djur };
    }
    case "kreditkort": {
      const kort = pick([
        { kortnamn: "Guldkort", arsavgift: 495, ranta: 19.9, kreditgrans: 30000, bonusprogram: true },
        { kortnamn: "Basickort", arsavgift: 0, ranta: 22.9, kreditgrans: 15000, bonusprogram: false },
      ]);
      return { id: createItemId(), kind: "kreditkort", harReddan: true, ...kort };
    }
    case "el": {
      const el = pick([
        { avtalstyp: "rorligt" as const, elomrade: "SE3" as const, arsforbrukningKwh: 4500 },
        { avtalstyp: "fast" as const, elomrade: "SE2" as const, arsforbrukningKwh: 6000, bindningstidManader: 12 },
      ]);
      return { id: createItemId(), kind: "el", elbolag: "", ...el };
    }
  }
}

const PRICE_RANGES: Record<FetchableKind, readonly [number, number]> = {
  boende: [80, 160],
  bil: [200, 350],
  ovrigt_fordon: [70, 140],
  person: [50, 90],
  djur: [100, 180],
  kreditkort: [0, 50],
  el: [400, 900],
};

const OMFATTNING_POOL: Record<FetchableKind, readonly string[]> = {
  boende: ["Grundskydd", "Fullvärde", "Fullvärde + Drulle"],
  bil: ["Trafikförsäkring", "Halvförsäkring", "Helförsäkring"],
  ovrigt_fordon: ["Trafikförsäkring", "Halvförsäkring", "Helförsäkring"],
  person: ["Grundskydd", "Utökat skydd"],
  djur: ["Veterinärvårdsförsäkring", "Livförsäkring + Veterinärvård"],
  kreditkort: ["Standardkort", "Guldkort", "Platinumkort"],
  el: ["Rörligt avtal", "Fast avtal"],
};

const SELF_RISK_POOL = [1000, 1200, 1500, 2000, 2500] as const;

// Simulerade avtalsdetaljer för det avancerade jämförelseläget — precis som
// pris/omfattning/förfallodatum är det här syntetiserad data, inte kundens
// faktiska avtal (bolagsnamnet är dock riktigt, valt av kunden själv).
const KARENSTID_POOL = ["Ingen karenstid", "24 timmar för vattenskador", "48 timmar för vattenskador"] as const;
const ERSATTNINGSTAK_POOL = ["1 000 000 kr per skada", "1 500 000 kr per skada", "Ingen övre gräns"] as const;
const BINDNINGSTID_POOL = ["Ingen bindningstid", "12 månader"] as const;
const UPPSAGNINGSTID_POOL = ["30 dagar", "60 dagar"] as const;
const UNDANTAG_POOL = [
  ["Grov vårdslöshet", "Krig och terrorism"],
  ["Grov vårdslöshet", "Slitage och bristande underhåll"],
  ["Grov vårdslöshet", "Skador vid uthyrning i andra hand"],
] as const;

function buildQuote(kind: FetchableKind, bolagNamn: string): Quote {
  return {
    id: createItemId(),
    name: bolagNamn,
    price: randomInRange(PRICE_RANGES[kind]),
    selfRisk: pick(SELF_RISK_POOL),
    highlights: [],
    source: "fetched",
    omfattning: pick(OMFATTNING_POOL[kind]),
    forfallodatum: randomFutureDate(),
    karenstid: pick(KARENSTID_POOL),
    ersattningstak: pick(ERSATTNINGSTAK_POOL),
    bindningstid: pick(BINDNINGSTID_POOL),
    uppsagningstid: pick(UPPSAGNINGSTID_POOL),
    undantag: [...pick(UNDANTAG_POOL)],
  };
}

/**
 * Simulerad hämtning av en befintlig försäkring hos ett valt bolag — swap-punkt för en
 * riktig öppen-försäkring-API senare (samma signatur, AutoFetchStep beror bara på den här
 * funktionen). Bolaget är ett riktigt namn som kunden själv väljer (FORSAKRINGSBOLAG i
 * items.ts), så priset/omfattningen syntetiseras separat här istället för att återanvända
 * item-quotes.ts's tre fiktiva jämförelsebolag.
 */
export function fetchExistingPolicy(kind: FetchableKind, bolagNamn: string): Promise<{ item: ComparableItem; quote: Quote }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const item = synthesizeItem(kind);
      // el/kreditkort har bolagsnamnet på själva posten (till skillnad från
      // t.ex. boende, där bolaget bara finns på quoten) — patcha in det
      // kunden faktiskt valde istället för ett tomt/påhittat namn.
      if (item.kind === "el") item.elbolag = bolagNamn;
      if (item.kind === "kreditkort") item.utgivare = bolagNamn;
      resolve({ item, quote: buildQuote(kind, bolagNamn) });
    }, 1400);
  });
}

// Alltid boende + bil (vanligast), plus 0-2 slumpade av person/djur/
// ovrigt_fordon — ger 2-4 poster per import. En enda fördröjning för hela
// batchen (inte N × 1400ms som att loopa fetchExistingPolicy skulle ge).
const IMPORT_ALWAYS: readonly FetchableKind[] = ["boende", "bil"];
const IMPORT_MAYBE: readonly FetchableKind[] = ["person", "djur", "ovrigt_fordon"];
export const ALL_FETCHABLE_KINDS: readonly FetchableKind[] = [...IMPORT_ALWAYS, ...IMPORT_MAYBE];

export function fetchMultiplePolicies(): Promise<{ item: ComparableItem; quote: Quote }[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const kinds = [...IMPORT_ALWAYS, ...IMPORT_MAYBE.filter(() => Math.random() < 0.5)];
      resolve(kinds.map((kind) => ({ item: synthesizeItem(kind), quote: buildQuote(kind, pick(FORSAKRINGSBOLAG)) })));
    }, 2200);
  });
}

// Identifiera dig igen-flödet (BankIdRescan.tsx): kunden har redan gjort
// en initial import, det här letar bara efter kinds som INTE redan finns
// bland items — annars skulle en rescan duplicera boende/bilen som redan
// lades till första gången. 40% chans per saknad kind, kan alltså bli
// tomt (då går kunden till "flagga saknat" precis som vid första
// importen om inget nytt hittas).
export function fetchNewPolicies(excludeKinds: readonly FetchableKind[]): Promise<{ item: ComparableItem; quote: Quote }[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const candidates = ALL_FETCHABLE_KINDS.filter((k) => !excludeKinds.includes(k));
      const kinds = candidates.filter(() => Math.random() < 0.4);
      resolve(kinds.map((kind) => ({ item: synthesizeItem(kind), quote: buildQuote(kind, pick(FORSAKRINGSBOLAG)) })));
    }, 2200);
  });
}

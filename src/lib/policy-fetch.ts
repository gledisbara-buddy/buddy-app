import { createItemId, type ComparableItem } from "@/lib/items";
import { MONTHS } from "@/lib/booking";
import type { Quote } from "@/lib/quote";
import { VEHICLE_BOOK } from "@/lib/vehicle-lookup";

// Auto-hämtning gäller bara Försäkring-gruppens fem kategorier — inte
// telekom/kreditkort/el, trots att de numera också är ComparableItem.
export type FetchableKind = Extract<ComparableItem["kind"], "boende" | "bil" | "ovrigt_fordon" | "person" | "djur">;

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
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function synthesizeItem(kind: FetchableKind): ComparableItem {
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
  }
}

const PRICE_RANGES: Record<FetchableKind, readonly [number, number]> = {
  boende: [80, 160],
  bil: [200, 350],
  ovrigt_fordon: [70, 140],
  person: [50, 90],
  djur: [100, 180],
};

const OMFATTNING_POOL: Record<FetchableKind, readonly string[]> = {
  boende: ["Grundskydd", "Fullvärde", "Fullvärde + Drulle"],
  bil: ["Trafikförsäkring", "Halvförsäkring", "Helförsäkring"],
  ovrigt_fordon: ["Trafikförsäkring", "Halvförsäkring", "Helförsäkring"],
  person: ["Grundskydd", "Utökat skydd"],
  djur: ["Veterinärvårdsförsäkring", "Livförsäkring + Veterinärvård"],
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
      const quote: Quote = {
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
      resolve({ item, quote });
    }, 1400);
  });
}

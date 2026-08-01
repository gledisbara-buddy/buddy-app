import { createItemId, type ComparableItem } from "@/lib/items";
import { computeItemQuotes } from "@/lib/item-quotes";
import type { Quote } from "@/lib/quote";
import { VEHICLE_BOOK } from "@/lib/vehicle-lookup";

export type FetchableKind = ComparableItem["kind"];

function pick<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
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

/**
 * Simulerad hämtning av en befintlig försäkring hos ett valt bolag — swap-punkt för en
 * riktig öppen-försäkring-API senare (samma signatur, AutoFetchStep beror bara på den här
 * funktionen). Syntetiserar en trovärdig sak och återanvänder befintlig prissättningslogik
 * i item-quotes.ts så att bolagen förblir konsekventa med resten av appen.
 */
export function fetchExistingPolicy(kind: FetchableKind, bolagNamn: string): Promise<{ item: ComparableItem; quote: Quote }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const item = synthesizeItem(kind);
      const quotes = computeItemQuotes(item, []);
      const quote = quotes.find((q) => q.name === bolagNamn) ?? quotes[0];
      resolve({ item, quote });
    }, 1400);
  });
}

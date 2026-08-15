import type { Elomrade } from "@/lib/items";

// Återanvänder el-marknadens fyra elområden som en enkel regionindelning
// för simulerad mobiltäckning — samma geografiska uppdelning kunden redan
// ser under El & energi, ingen ny mental modell att lära sig. Gränserna
// nedan är ungefärliga (verkliga SE1-4 följer inte breddgrader exakt),
// gott nog för en illustrativ karta i en prototyp.
export function regionForLatLon(lat: number): Elomrade {
  if (lat >= 64) return "SE1";
  if (lat >= 62) return "SE2";
  if (lat >= 59) return "SE3";
  return "SE4";
}

export const REGION_LABELS: Record<Elomrade, string> = {
  SE1: "Norra Sverige",
  SE2: "Mellersta Sverige",
  SE3: "Stockholmsregionen & Svealand",
  SE4: "Södra Sverige",
};

export type CoverageLevel = "bra" | "ok" | "svag";

export const COVERAGE_LABELS: Record<CoverageLevel, string> = {
  bra: "Bra täckning",
  ok: "OK täckning",
  svag: "Svag täckning",
};

// Simulerad täckning per operatör och region — medvetet olika mellan
// bolagen så kartan faktiskt visar en skillnad, inte bara fyra likadana
// gröna rutor. Samma fyra operatörer som redan finns i item-quotes.ts.
export const OPERATOR_COVERAGE: Record<string, Record<Elomrade, CoverageLevel>> = {
  Klarnät: { SE1: "ok", SE2: "bra", SE3: "bra", SE4: "bra" },
  Fiberpunkt: { SE1: "svag", SE2: "ok", SE3: "bra", SE4: "ok" },
  Sambandet: { SE1: "bra", SE2: "bra", SE3: "ok", SE4: "svag" },
  Surfpunkt: { SE1: "svag", SE2: "svag", SE3: "bra", SE4: "bra" },
};

export function coverageFor(operatorName: string, lat: number): CoverageLevel {
  const region = regionForLatLon(lat);
  return OPERATOR_COVERAGE[operatorName]?.[region] ?? "ok";
}

// Enkel linjär projektion av Sveriges ungefärliga bounding box till ett
// 0-100-koordinatsystem, för att placera en punkt i CoverageMap.tsx:s SVG.
// Inte en riktig kartprojektion — gott nog för en schematisk illustration.
const SWEDEN_BOUNDS = { latMin: 55.3, latMax: 69.1, lonMin: 10.9, lonMax: 24.2 };

export function projectToMapXY(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon - SWEDEN_BOUNDS.lonMin) / (SWEDEN_BOUNDS.lonMax - SWEDEN_BOUNDS.lonMin)) * 100;
  const y = 100 - ((lat - SWEDEN_BOUNDS.latMin) / (SWEDEN_BOUNDS.latMax - SWEDEN_BOUNDS.latMin)) * 100;
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

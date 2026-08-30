import type { Elomrade } from "@/lib/items";

export type AddressMatch = { adress: string; postnummer: string; ort: string };

// Uppskattning baserad på postnumrets två första siffror — de fyra
// elområdena följer elnätets topologi, inte postnummerindelningen exakt,
// så gränstrakter kan hamna fel. Formuläret visar alltid resultatet som ett
// redigerbart, förvalt fält istället för att låsa det — användaren rättar
// om det inte stämmer, se ElForm i Onboarding.tsx. Bättre än att fråga
// "vilket elområde bor du i?" rakt av, som nästan ingen kan svara på.
const ELOMRADE_PREFIX_RANGES: { max: number; elomrade: Elomrade }[] = [
  { max: 19999, elomrade: "SE3" }, // Stockholms län
  { max: 29999, elomrade: "SE4" }, // Skåne
  { max: 39999, elomrade: "SE4" }, // Halland/Kronoberg/Blekinge/Kalmar
  { max: 77999, elomrade: "SE3" }, // Götaland/Svealand i övrigt
  { max: 79999, elomrade: "SE2" }, // Dalarna (norra delen)
  { max: 89999, elomrade: "SE2" }, // Gävleborg/Jämtland/Västernorrland
  { max: 92999, elomrade: "SE2" }, // Västerbotten (södra delen)
  { max: 99999, elomrade: "SE1" }, // Norrbotten/Västerbotten (norra delen)
];

export function postnummerToElomrade(postnummer: string): Elomrade | null {
  const digits = postnummer.replace(/\s/g, "");
  if (!/^\d{5}$/.test(digits)) return null;
  const n = Number(digits);
  return ELOMRADE_PREFIX_RANGES.find((r) => n <= r.max)?.elomrade ?? null;
}

/**
 * Address lookup backed by /api/address-search (Geoapify autocomplete, server-side
 * so the API key never reaches the browser). AddressField only depends on this
 * function's signature, so the backing implementation can change without touching it.
 */
export async function searchAddress(query: string): Promise<AddressMatch[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const res = await fetch(`/api/address-search?query=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data: { results: AddressMatch[] } = await res.json();
    return data.results;
  } catch {
    return [];
  }
}

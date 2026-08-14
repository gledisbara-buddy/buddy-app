import { MONTHS } from "@/lib/booking";

// Parsar det svenska datumformatet från policy-fetch.ts ("12 mar 2027",
// byggt med MONTHS) till ett Date-objekt. Delas av daysUntilSwedishDate
// nedan och kalenderpåminnelsen i ItemDetail.tsx — samma tolkning på båda
// ställena istället för att duplicera parsningen.
export function parseSwedishDate(dateStr: string): Date | undefined {
  const parts = dateStr.trim().split(" ");
  if (parts.length !== 3) return undefined;

  const [dayStr, monthAbbr, yearStr] = parts;
  const day = Number(dayStr);
  const year = Number(yearStr);
  const monthIndex = MONTHS.indexOf(monthAbbr.toLowerCase());
  if (!Number.isFinite(day) || !Number.isFinite(year) || monthIndex === -1) return undefined;

  return new Date(year, monthIndex, day);
}

// Antal dagar kvar från idag till ett svenskt-formaterat datum. Returnerar
// undefined om strängen inte går att tolka, så anroparen kan hoppa över
// posten istället för att krascha.
export function daysUntilSwedishDate(dateStr: string): number | undefined {
  const target = parseSwedishDate(dateStr);
  if (!target) return undefined;

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - todayMidnight.getTime()) / msPerDay);
}

// Konverterar ett <input type="date">-värde ("YYYY-MM-DD") till samma
// "D MMM YYYY"-format som daysUntilSwedishDate ovan förväntar sig — annars
// matchar inte ett användarinmatat förfallodatum (TelekomForm.tsx m.fl.)
// parsern. Returnerar undefined om strängen inte går att tolka.
export function isoToSwedishDate(iso: string): string | undefined {
  const [yearStr, monthStr, dayStr] = iso.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) || month < 1 || month > 12) {
    return undefined;
  }
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

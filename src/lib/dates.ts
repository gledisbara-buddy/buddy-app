import { MONTHS } from "@/lib/booking";

// Parsar det svenska datumformatet från policy-fetch.ts ("12 mar 2027",
// byggt med MONTHS) till antal dagar kvar från idag. Returnerar undefined om
// strängen inte går att tolka, så anroparen kan hoppa över posten istället
// för att krascha.
export function daysUntilSwedishDate(dateStr: string): number | undefined {
  const parts = dateStr.trim().split(" ");
  if (parts.length !== 3) return undefined;

  const [dayStr, monthAbbr, yearStr] = parts;
  const day = Number(dayStr);
  const year = Number(yearStr);
  const monthIndex = MONTHS.indexOf(monthAbbr.toLowerCase());
  if (!Number.isFinite(day) || !Number.isFinite(year) || monthIndex === -1) return undefined;

  const target = new Date(year, monthIndex, day);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - todayMidnight.getTime()) / msPerDay);
}

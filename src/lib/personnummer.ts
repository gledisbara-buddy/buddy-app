// Enkel formatvalidering, samma pragmatiska nivå som isValidSwedishMobile
// i phone.ts — verifierar inte kontrollsiffra eller att personen existerar.
// Accepterar både ÅÅÅÅMMDD-XXXX (12 siffror) och ÅÅMMDD-XXXX (10 siffror).
const PERSONNUMMER_REGEX = /^(?:\d{8}|\d{6})-?\d{4}$/;

export function isValidPersonnummer(value: string): boolean {
  return PERSONNUMMER_REGEX.test(value.trim());
}

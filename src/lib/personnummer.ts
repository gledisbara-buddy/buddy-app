// Enkel formatvalidering, samma pragmatiska nivå som isValidSwedishMobile
// i phone.ts — verifierar inte kontrollsiffra eller att personen existerar.
// Accepterar både ÅÅÅÅMMDD-XXXX (12 siffror) och ÅÅMMDD-XXXX (10 siffror).
const PERSONNUMMER_REGEX = /^(?:\d{8}|\d{6})-?\d{4}$/;

export function isValidPersonnummer(value: string): boolean {
  return PERSONNUMMER_REGEX.test(value.trim());
}

// Samma maskeringsformat som customer_profile_view i schema.sql
// (left(personnummer, 6) || '-XXXX') — används överallt i klientkod som
// behöver visa/logga ett personnummer utan att skriva ut det i klartext,
// t.ex. activity-log.ts. Håll de två i synk om formatet någonsin ändras.
export function maskPersonnummer(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 6) return "••••";
  return `${trimmed.slice(0, 6)}-XXXX`;
}

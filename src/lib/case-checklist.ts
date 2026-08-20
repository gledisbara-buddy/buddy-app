// Checklistornas FRÅGOR lever i koden, inte i databasen — bara vilka
// punkter som är ikryssade sparas per ärende (bookings/claims.checklist,
// en {item_id: true}-jsonb-karta). Så mallen kan ändras utan migration,
// och gamla ärenden med punkter som senare tagits bort visar bara de
// punkter som fortfarande finns kvar i listan.
export type ChecklistItem = { id: string; label: string };

export const BOOKING_CHECKLIST: ChecklistItem[] = [
  { id: "bekrafta_tid", label: "Bekräfta tid med kund" },
  { id: "forbered", label: "Förbered kundens ärende" },
  { id: "genomfor", label: "Genomför mötet" },
  { id: "foljup", label: "Följ upp efter mötet" },
];

export const CLAIM_CHECKLIST: ChecklistItem[] = [
  { id: "bekrafta_mottagen", label: "Bekräfta mottagen skada" },
  { id: "granska_bilagor", label: "Granska foton/kvitton" },
  { id: "bedom", label: "Bedöm allvarlighetsgrad" },
  { id: "beslut", label: "Fatta beslut" },
  { id: "informera", label: "Informera kund om beslut" },
];

export function checklistFor(caseType: "booking" | "claim"): ChecklistItem[] {
  return caseType === "booking" ? BOOKING_CHECKLIST : CLAIM_CHECKLIST;
}

export type HouseholdRelation = "partner" | "barn" | "annan";

export const HOUSEHOLD_RELATION_LABELS: Record<HouseholdRelation, string> = {
  partner: "Partner",
  barn: "Barn",
  annan: "Annan",
};

// Separat från generateCode i referral.ts trots samma form (4 bokstäver
// + 4 siffror) — ett hushåll är ett eget begrepp, inte en värvning, och
// koderna ska aldrig kunna förväxlas eller delas mellan de två systemen.
export function generateHouseholdCode(name?: string | null): string {
  const base = (name ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "HUSH";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffix}`;
}

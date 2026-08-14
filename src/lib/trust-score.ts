import { isComparableItem, type InsuranceItem } from "@/lib/items";
import type { Quote } from "@/lib/quote";
import type { Profile } from "@/lib/buddy-context";

export type TrustScore = {
  score: number; // 0–100
  comparedCount: number;
  comparableCount: number;
  hasUrgentRenewal: boolean;
  fullmaktSigned: boolean;
};

// Trygghetspoäng: hur mycket av det kunden faktiskt har lagt in hos Buddy
// som är i bra skick — inte "äger du en bil" (kunden kan rimligen sakna
// halva kategorierna utan att vara "otrygg"), utan "är det du redan har
// jämfört och uppdaterat". Ren klientberäkning från data som redan finns
// i buddy-context.tsx, inget nytt schema.
//
// Vikter: 60% andel jämförda/tecknade avtal av det som går att jämföra,
// 20% inga bråttom-förnyelser obehandlade (samma "urgent"-gräns, 14 dagar,
// som Att göra-listan i todo.ts redan använder), 20% signerad fullmakt.
export function computeTrustScore({
  items,
  policies,
  profile,
  hasUrgentRenewal,
}: {
  items: InsuranceItem[];
  policies: Record<string, Quote>;
  profile: Profile | null;
  hasUrgentRenewal: boolean;
}): TrustScore | null {
  const comparableItems = items.filter(isComparableItem);
  if (comparableItems.length === 0) return null;

  const comparedCount = comparableItems.filter((i) => policies[i.id]?.source === "compared").length;
  const fullmaktSigned = !!profile?.fullmaktSignedAt;

  const comparedRatio = comparedCount / comparableItems.length;
  const score = Math.round(comparedRatio * 60 + (hasUrgentRenewal ? 0 : 20) + (fullmaktSigned ? 20 : 0));

  return {
    score,
    comparedCount,
    comparableCount: comparableItems.length,
    hasUrgentRenewal,
    fullmaktSigned,
  };
}

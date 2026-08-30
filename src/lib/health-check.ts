import { daysUntilSwedishDate } from "@/lib/dates";
import { COMPARABLE_KINDS, isComparableItem, ITEM_CATEGORIES, type InsuranceItem, type ItemKind } from "@/lib/items";
import { computeItemQuotes } from "@/lib/item-quotes";
import type { Quote } from "@/lib/quote";

export type HealthCheck = {
  totalItems: number;
  comparedCount: number;
  uncomparedCount: number;
  totalMonthlySpend: number;
  potentialSavings: number;
  missingCategories: { kind: ItemKind; label: string }[];
  upcomingRenewals: number;
  unusedStreamingCost: number;
};

const RENEWAL_WINDOW_DAYS = 60;

export function buildHealthCheck(items: InsuranceItem[], policies: Record<string, Quote>): HealthCheck {
  const comparableItems = items.filter(isComparableItem);
  const comparedCount = comparableItems.filter((item) => policies[item.id]?.source === "compared").length;

  let potentialSavings = 0;
  let upcomingRenewals = 0;
  for (const item of comparableItems) {
    const quote = policies[item.id];
    if (quote?.source !== "fetched") continue;

    if (quote.forfallodatum) {
      const days = daysUntilSwedishDate(quote.forfallodatum);
      if (days != null && days >= 0 && days <= RENEWAL_WINDOW_DAYS) upcomingRenewals++;
    }

    const cheapest = Math.min(...computeItemQuotes(item, []).map((q) => q.price));
    if (quote.price > cheapest) potentialSavings += quote.price - cheapest;
  }

  const totalMonthlySpend = Object.values(policies).reduce((sum, q) => sum + q.price, 0);

  // TE-4 i produktträds-underlaget: skillnaden mellan vad du betalar för
  // och vad du faktiskt använt ÄR insikten, inte bara ett fält bland andra.
  // Bara räknat om kunden faktiskt svarat (false) — ovarat/true bidrar inte.
  let unusedStreamingCost = 0;
  for (const item of items) {
    if (item.kind === "telekom" && item.typ === "tv_streaming" && item.harAnvantsSenasteManaden === false) {
      unusedStreamingCost += item.prisPerManad;
    }
  }

  const presentKinds = new Set(items.map((item) => item.kind));
  const missingCategories = COMPARABLE_KINDS.filter((kind) => !presentKinds.has(kind)).map((kind) => ({
    kind,
    label: ITEM_CATEGORIES.find((c) => c.kind === kind)!.label,
  }));

  return {
    totalItems: items.length,
    comparedCount,
    uncomparedCount: comparableItems.length - comparedCount,
    totalMonthlySpend,
    potentialSavings,
    missingCategories,
    upcomingRenewals,
    unusedStreamingCost,
  };
}

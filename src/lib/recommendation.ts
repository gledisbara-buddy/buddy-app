import type { Profile } from "@/lib/buddy-context";
import { isComparableItem, itemTitle, type InsuranceItem } from "@/lib/items";
import type { Quote } from "@/lib/quote";

export type RecommendationBullet = { text: string; itemId?: string };

export type Recommendation = {
  headline: string;
  intro: string;
  bullets: RecommendationBullet[];
  uppskattadBesparing: number;
};

const SAVING_PER_FLAG = 65;

export function buildRecommendation(
  items: InsuranceItem[],
  policies: Record<string, Quote>,
  profile: Profile | null
): Recommendation {
  if (items.length === 0) {
    return {
      headline: "Lägg till något så ger vi dig en rekommendation",
      intro: "Börja med det som känns viktigast för dig, till exempel ditt boende eller din bil.",
      bullets: [],
      uppskattadBesparing: 0,
    };
  }

  const bullets: RecommendationBullet[] = [];
  let flags = 0;

  for (const item of items) {
    if (isComparableItem(item)) {
      if (policies[item.id]?.source !== "compared") {
        bullets.push({ text: `Du har inte jämfört ${itemTitle(item).toLowerCase()} än — tar bara en minut.`, itemId: item.id });
      }
      continue;
    }

    // Enda kvarvarande icke-jämförbara kategorin — övriga (telekom/kreditkort/el)
    // fångas numera av isComparableItem-grenen ovan.
    if (item.kind === "prenumeration" && item.prisPerManad > 400) {
      bullets.push({ text: `${item.namn} kostar ${item.prisPerManad} kr/mån — värt att se om du fortfarande använder den fullt ut.` });
      flags++;
    }
  }

  if (bullets.length === 0) {
    bullets.push({ text: "Snyggt — allt du lagt in ser redan bra ut. Lägg gärna till fler saker för en komplett bild." });
  }

  const namePart = profile?.name ? `${profile.name}, här` : "Här";
  const uppskattadBesparing = flags * SAVING_PER_FLAG;
  const headline = flags > 0 ? `Du kan spara uppskattningsvis ${uppskattadBesparing}+ kr/mån` : "Här är Buddys rekommendation";
  const intro =
    flags > 0
      ? `${namePart} är det Buddy hittade när vi gick igenom det du lagt in.`
      : `${namePart} är läget baserat på det du lagt in hittills.`;

  return { headline, intro, bullets, uppskattadBesparing };
}

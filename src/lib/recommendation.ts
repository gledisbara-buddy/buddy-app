import type { Profile } from "@/lib/buddy-context";
import { isComparableItem, itemTitle, ONSKAD_KREDITKORT_LABELS, type InsuranceItem } from "@/lib/items";
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
      if (!policies[item.id]) {
        bullets.push({ text: `Du har inte jämfört ${itemTitle(item).toLowerCase()} än — tar bara en minut.`, itemId: item.id });
      }
      continue;
    }

    switch (item.kind) {
      case "telekom":
        if (item.typ === "mobil" && item.prisPerManad > 300) {
          bullets.push({ text: `Mobilabonnemanget hos ${item.operator} kostar ${item.prisPerManad} kr/mån — det finns ofta billigare alternativ med samma data.` });
          flags++;
        }
        if (item.typ === "bredband" && item.prisPerManad > 450) {
          bullets.push({ text: `Bredbandet hos ${item.operator} kostar ${item.prisPerManad} kr/mån — jämför med andra leverantörer i ditt område.` });
          flags++;
        }
        break;
      case "kreditkort":
        if (item.harReddan && (item.arsavgift ?? 0) > 500) {
          bullets.push({ text: `${item.utgivare ?? "Ditt kort"} tar ${item.arsavgift} kr i årsavgift — se om ett kort med lägre avgift täcker dina behov.` });
          flags++;
        }
        if (!item.harReddan && item.onskadPrioritet) {
          bullets.push({ text: `Du utforskar ett nytt kort med fokus på ${ONSKAD_KREDITKORT_LABELS[item.onskadPrioritet].toLowerCase()} — boka gärna ett samtal om du vill ha hjälp att välja.` });
        }
        break;
      case "el":
        if (item.avtalstyp === "fast") {
          bullets.push({ text: `Du har fast elpris i ${item.elomrade} — jämför med rörligt pris då och då, det kan löna sig.` });
          flags++;
        }
        break;
      case "prenumeration":
        if (item.prisPerManad > 400) {
          bullets.push({ text: `${item.namn} kostar ${item.prisPerManad} kr/mån — värt att se om du fortfarande använder den fullt ut.` });
          flags++;
        }
        break;
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

import { daysUntilSwedishDate } from "@/lib/dates";

export type Quote = {
  id: string;
  name: string;
  price: number;
  selfRisk?: number;
  rating?: number;
  highlights: string[];
  // "compared" = jämförd och tecknad via Buddys jämförelseflöde (CompareFlow).
  // "fetched" = auto-hämtad från kundens befintliga bolag, inte jämförd än.
  source?: "compared" | "fetched";
  forfallodatum?: string;
  omfattning?: string;
  // Avtalsdetaljer för det avancerade jämförelseläget — bara satta för
  // Försäkring-gruppens offerter (fiktiva och auto-hämtade).
  karenstid?: string;
  ersattningstak?: string;
  bindningstid?: string;
  uppsagningstid?: string;
  undantag?: string[];
  // Vilka av kundens behov (från behovsanalysen) som gjort att just det här
  // bolaget valdes ut som en bra matchning — rent förklarande metadata,
  // påverkar inte pickWinner nedan.
  matchedNeeds?: string[];
  // Satt av en anställd (internt, se CustomerItemsTab.tsx) när kunden bett
  // om hjälp att säga upp ett redan tecknat avtal — avtalet raderas inte,
  // det körs bara till forfallodatum. Kunden ser en notis om detta på sin
  // egen översikt (Dashboard.tsx), så det är alltid synligt, inte tyst.
  cancellationPending?: boolean;
  cancellationRequestedAt?: string;
  // Nytecknad offert som ersätter den här (CompareFlow.tsx, när kunden
  // redan har en spårad policy med känt forfallodatum) — aktiveras inte
  // förrän forfallodatum ovan passerat, se computeMoveStatus/effectiveQuote
  // nedan. source sätts till "compared" direkt på toppnivån (kunden HAR
  // jämfört och tecknat), men pris/bolag/villkor stannar på det gamla tills
  // flytten är klar, så trygghetspoäng osv inte väntar på ett datum.
  pendingQuote?: Omit<Quote, "pendingQuote">;
};

export type MoveStatus = "framdaterad" | "flytt-pagar" | "flytt-genomford";

export const MOVE_STATUS_LABELS: Record<MoveStatus, string> = {
  framdaterad: "Framdaterad",
  "flytt-pagar": "Flytt pågår",
  "flytt-genomford": "Flytt genomförd",
};

// Hur många dagar efter gamla forfallodatum flytten räknas som "pågående"
// innan den räknas som helt genomförd — helt datumstyrt, ingen handläggare
// behöver bekräfta något steg (se buddy_customer_journey_v2, punkt 6).
const MOVE_PROCESSING_DAYS = 3;

export function computeMoveStatus(oldForfallodatum: string): MoveStatus | undefined {
  const days = daysUntilSwedishDate(oldForfallodatum);
  if (days == null) return undefined;
  if (days > 0) return "framdaterad";
  if (days > -MOVE_PROCESSING_DAYS) return "flytt-pagar";
  return "flytt-genomford";
}

// Vilken offert som faktiskt ska visas som gällande just nu. Så länge
// flytten inte är genomförd visas den gamla (pris/bolag/villkor kunden
// fortfarande faktiskt betalar) — därefter den nya, utan att någon
// databaspost behöver skrivas om, det räknas bara ut på nytt varje render.
export function effectiveQuote(quote: Quote): Quote {
  if (!quote.pendingQuote || !quote.forfallodatum) return quote;
  return computeMoveStatus(quote.forfallodatum) === "flytt-genomford" ? quote.pendingQuote : quote;
}

// "Bästa helhetsvärde" — väger ihop betyg och pris istället för att bara
// välja billigast, så rekommendationen kan skilja sig från det billigaste
// alternativet (annars blir de två alltid identiska).
export function pickWinner(quotes: Quote[]): string | undefined {
  if (quotes.length === 0) return undefined;
  const prices = quotes.map((q) => q.price);
  const ratings = quotes.map((q) => q.rating ?? 0);
  const minPrice = Math.min(...prices);
  const priceRange = Math.max(...prices) - minPrice || 1;
  const minRating = Math.min(...ratings);
  const ratingRange = Math.max(...ratings) - minRating || 1;

  let best = quotes[0];
  let bestScore = -Infinity;
  for (const q of quotes) {
    const priceScore = 1 - (q.price - minPrice) / priceRange;
    const ratingScore = ((q.rating ?? 0) - minRating) / ratingRange;
    const score = ratingScore * 0.6 + priceScore * 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = q;
    }
  }
  return best.id;
}

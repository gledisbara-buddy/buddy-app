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
};

// "Bästa helhetsvärde" — väger ihop betyg och pris istället för att bara
// välja billigast, så rekommendationen kan skilja sig från det billigaste
// alternativet (annars blir de två alltid identiska).
export function pickWinner(quotes: Quote[]): string {
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

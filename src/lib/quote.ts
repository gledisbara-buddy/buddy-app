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

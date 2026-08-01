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

export function pickWinner(quotes: Quote[], priority: string | null): string {
  if (priority === "skydd") return [...quotes].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0].id;
  return quotes[0].id;
}

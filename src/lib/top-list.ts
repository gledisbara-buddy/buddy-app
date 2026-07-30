export type TopListEntry = {
  rank: number;
  name: string;
  rating: number;
  reviews: number;
  tagline: string;
  strengths: string[];
};

export const TOP_LIST: TopListEntry[] = [
  {
    rank: 1,
    name: "Klarsäker",
    rating: 4.6,
    reviews: 2140,
    tagline: "Bäst helhetsbetyg — starkast grundskydd och snabbast skadehantering.",
    strengths: ["Fullvärdesskydd utan övre gräns", "Snittbeslut inom 2 dagar", "Digital skadeanmälan"],
  },
  {
    rank: 2,
    name: "Nordvakt",
    rating: 4.4,
    reviews: 1685,
    tagline: "Lägst självrisk i jämförelsen, med en tydlig prisgaranti.",
    strengths: ["Lägst självrisk", "Prisgaranti", "Starkt reseskydd"],
  },
  {
    rank: 3,
    name: "Hemgrund",
    rating: 4.2,
    reviews: 1310,
    tagline: "Lägst grundpris — bra val om du vill hålla nere kostnaden.",
    strengths: ["Lägst pris", "Enkelt grundskydd", "Telefonsupport vardagar"],
  },
];

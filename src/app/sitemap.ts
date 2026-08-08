import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";
import { NEWS_ARTICLES } from "@/lib/news";

const BASE_URL = "https://www.minbuddy.se";

const STATIC_ROUTES = [
  "",
  "/jamfor",
  "/om-oss",
  "/kontakt",
  "/jobb",
  "/vanliga-fragor",
  "/guider",
  "/nyheter",
  "/villkor",
  "/integritetspolicy",
  "/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  const guideEntries: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${BASE_URL}/guider/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  const newsEntries: MetadataRoute.Sitemap = NEWS_ARTICLES.map((a) => ({
    url: `${BASE_URL}/nyheter/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...guideEntries, ...newsEntries];
}

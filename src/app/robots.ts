import type { MetadataRoute } from "next";

const BASE_URL = "https://www.minbuddy.se";

// Allt bakom inloggning eller utan SEO-värde ska inte crawlas — bara de
// publika marknadsföringssidorna i (marketing) ska vara indexerbara.
const DISALLOWED = [
  "/dashboard",
  "/profil",
  "/internt",
  "/installningar",
  "/onboarding",
  "/kom-igang",
  "/login",
  "/aterstall-losenord",
  "/book",
  "/claim",
  "/chat",
  "/compare",
  "/halsokoll",
  "/livshandelser",
  "/rekommendation",
  "/varva-en-van",
  "/arkiv",
  "/arsrapport",
  "/hushall",
  "/identifiera-igen",
  "/importera",
  "/anslut-bank",
  "/mina-arenden",
  "/objekt",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOWED,
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

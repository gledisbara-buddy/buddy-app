import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Cookies",
  description: "Hur Buddy använder cookies.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Juridik"
      title="Cookies"
      updated="1 januari 2026"
      sections={[
        {
          heading: "Vad är cookies?",
          body: "Cookies är små textfiler som sparas i din webbläsare för att tjänsten ska fungera och kännas igen dig mellan besök.",
        },
        {
          heading: "Hur använder vi dem?",
          body: "Vi använder nödvändiga cookies för inloggning och grundläggande funktionalitet. Vi använder inte cookies för reklamspårning.",
        },
        {
          heading: "Hantera cookies",
          body: "Du kan när som helst blockera eller radera cookies i din webbläsares inställningar. Vissa delar av tjänsten kan då sluta fungera.",
        },
      ]}
    />
  );
}

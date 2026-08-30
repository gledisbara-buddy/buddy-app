import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Cookies",
  description: "Hur Buddy använder cookies.",
});

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Juridik"
      title="Cookies"
      updated="9 augusti 2026"
      sections={[
        {
          heading: "Vad är cookies?",
          body: "Cookies är små textfiler som sparas i din webbläsare för att tjänsten ska fungera och kännas igen dig mellan besök.",
        },
        {
          heading: "Hur använder vi dem?",
          body: "Vi använder endast nödvändiga cookies för inloggning och grundläggande funktionalitet (t.ex. att hålla dig inloggad mellan besök). Vi använder inga cookies för reklamspårning eller delar cookie-data med tredjepartsannonsörer, och behöver därför inte fråga om samtycke.",
        },
        {
          heading: "Hantera cookies",
          body: "Du kan när som helst blockera eller radera cookies i din webbläsares inställningar. Vissa delar av tjänsten kan då sluta fungera.",
        },
      ]}
    />
  );
}

import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Allmänna villkor",
  description: "Villkoren för att använda Buddy.",
};

export default function VillkorPage() {
  return (
    <LegalPage
      eyebrow="Juridik"
      title="Allmänna villkor"
      updated="9 augusti 2026"
      sections={[
        {
          heading: "1. Om tjänsten",
          body: "Buddy är en tjänst som hjälper dig samla, jämföra och teckna försäkringar och andra abonnemang. Genom att använda tjänsten godkänner du dessa villkor.",
        },
        {
          heading: "2. Ditt konto",
          body: "Du loggar in med e-post och lösenord och ansvarar för att uppgifterna du lämnar är korrekta samt för att hålla ditt lösenord hemligt. Vill du avsluta ditt konto och få dina uppgifter raderade kontaktar du kundtjänst.",
        },
        {
          heading: "3. Fullmakt",
          body: "Om du väljer att signera en fullmakt ger du Buddy rätt att företräda dig i kontakt med försäkringsbolag inom de ramar fullmakten anger. Du kan när som helst återkalla fullmakten genom att kontakta kundtjänst.",
        },
        {
          heading: "4. Jämförelser och erbjudanden",
          body: "Priser och villkor som visas i tjänsten är preliminära tills en försäkring faktiskt tecknas hos det valda bolaget. Vid uppsägning av ett tecknat avtal gäller avtalet tills bolaget bekräftat uppsägningen och eventuell uppsägningstid löpt ut.",
        },
        {
          heading: "5. Ansvarsbegränsning",
          body: "Buddy förmedlar information och, i förekommande fall, försäkringsdistribution, men är inte part i det försäkringsavtal som tecknas mellan dig och försäkringsbolaget.",
        },
      ]}
    />
  );
}

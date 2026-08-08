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
      updated="1 januari 2026"
      sections={[
        {
          heading: "1. Om tjänsten",
          body: "Buddy är en tjänst som hjälper dig samla, jämföra och teckna försäkringar. Genom att använda tjänsten godkänner du dessa villkor.",
        },
        {
          heading: "2. Ditt konto",
          body: "Du loggar in med e-post och lösenord och ansvarar för att uppgifterna du lämnar är korrekta. Du kan när som helst radera dina uppgifter.",
        },
        {
          heading: "3. Jämförelser och erbjudanden",
          body: "Priser och villkor som visas i tjänsten är preliminära tills en försäkring faktiskt tecknas hos det valda bolaget.",
        },
        {
          heading: "4. Ansvarsbegränsning",
          body: "Buddy förmedlar information men är inte part i det försäkringsavtal som tecknas mellan dig och försäkringsbolaget.",
        },
      ]}
    />
  );
}

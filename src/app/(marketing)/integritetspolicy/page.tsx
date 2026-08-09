import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description: "Hur Buddy samlar in, använder och skyddar dina uppgifter.",
};

export default function IntegritetspolicyPage() {
  return (
    <LegalPage
      eyebrow="Juridik"
      title="Integritetspolicy"
      updated="9 augusti 2026"
      sections={[
        {
          heading: "Vem är personuppgiftsansvarig?",
          body: "Buddy (org.nr under registrering) är personuppgiftsansvarig för behandlingen av dina personuppgifter i tjänsten. Frågor om den här policyn eller dina uppgifter skickas via vår kontaktsida.",
        },
        {
          heading: "Vilka uppgifter samlar vi in?",
          body: "Kontouppgifter (namn, e-post, telefon, personnummer, adress) som du själv anger. Uppgifter om det du lägger in i tjänsten (boende, fordon, telekom, kreditkort, el, familjemedlemmar). Innehåll du skickar in vid en skadeanmälan (chatthistorik, foton, kvitton) eller vid bokning av ett samtal. En signerad fullmakt (namnteckning och den PDF som skapas) om du väljer att ge Buddy fullmakt att företräda dig. Om du blir värvad eller värvar någon, en koppling mellan de kontona.",
        },
        {
          heading: "Vad använder vi uppgifterna till?",
          body: "För att ge dig en samlad översikt över det du äger, ta fram relevanta jämförelser och rekommendationer, hantera skadeanmälningar och bokade samtal, samt hjälpa dig säga upp ett tecknat avtal när du ber om det. Den rättsliga grunden är i huvudsak att fullgöra avtalet med dig, och i vissa delar ditt samtycke (t.ex. fullmakt).",
        },
        {
          heading: "Vem hos Buddy kan se mina uppgifter?",
          body: "Anställda hos Buddy kan se och vid behov rätta dina kontouppgifter för att kunna hjälpa dig, t.ex. vid ett supportärende. Varje sådan ändring loggas automatiskt med vem som gjorde den, när, och vad som ändrades — den loggen är inte synlig för dig, men finns för spårbarhet. Interna anteckningar som en anställd gör om ditt ärende är aldrig synliga för dig som kund.",
        },
        {
          heading: "Delar vi uppgifter med andra?",
          body: "Endast med det försäkringsbolag du aktivt väljer att teckna en försäkring hos, och endast de uppgifter som krävs för det avtalet — samt, om du ber oss säga upp ett befintligt avtal, med det bolag uppsägningen gäller. Vi säljer aldrig dina uppgifter vidare och delar dem inte för marknadsföringsändamål.",
        },
        {
          heading: "Hur länge sparar vi uppgifterna?",
          body: "Så länge du har ett konto hos Buddy. Om du begär att ditt konto raderas tas dina personuppgifter och det du lagt in bort; vissa uppgifter kan behöva sparas längre om lagen kräver det (t.ex. bokföringsunderlag för genomförda avtal).",
        },
        {
          heading: "Dina rättigheter",
          body: "Du kan när som helst be om att få se, rätta eller radera de uppgifter vi har om dig genom att kontakta kundtjänst. Du har också rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY) om du tycker att vi hanterar dina uppgifter fel.",
        },
        {
          heading: "Cookies",
          body: "Vi använder endast cookies som krävs för att hålla dig inloggad och tjänsten fungerande — läs mer på vår cookie-sida.",
        },
      ]}
    />
  );
}

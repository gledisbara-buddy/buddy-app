import { LegalPage } from "@/components/marketing/LegalPage";

export default function IntegritetspolicyPage() {
  return (
    <LegalPage
      eyebrow="Juridik"
      title="Integritetspolicy"
      updated="1 januari 2026"
      sections={[
        {
          heading: "Vilka uppgifter samlar vi in?",
          body: "De uppgifter du själv lägger in om ditt boende, fordon, dig som person eller dina djur, samt din e-postadress som används för inloggning.",
        },
        {
          heading: "Vad använder vi uppgifterna till?",
          body: "För att ge dig en samlad översikt, ta fram relevanta jämförelser, och kunna hjälpa dig vid en skadeanmälan eller ett rådgivningssamtal.",
        },
        {
          heading: "Delar vi uppgifter med andra?",
          body: "Endast med det försäkringsbolag du aktivt väljer att teckna en försäkring hos, och endast de uppgifter som krävs för det avtalet.",
        },
        {
          heading: "Dina rättigheter",
          body: "Du kan när som helst be om att få se, rätta eller radera de uppgifter vi har om dig genom att kontakta kundtjänst.",
        },
      ]}
    />
  );
}

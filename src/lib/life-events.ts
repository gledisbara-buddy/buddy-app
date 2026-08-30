import { SYSSELSATTNING_LABELS, type InsuranceItem, type Sysselsattning } from "@/lib/items";

export type LifeEventId = "flytt" | "barn" | "fordon" | "djur";

export type LifeEventStep = { text: string; cta?: { label: string; href: string } };

export const LIFE_EVENTS: Record<LifeEventId, { title: string; intro: string; steps: LifeEventStep[] }> = {
  flytt: {
    title: "Jag ska flytta",
    intro: "Några saker värda att ha koll på när adressen ändras.",
    steps: [
      {
        text: "Lägg till ditt nya boende — du kan ha kvar den gamla adressen tills du sagt upp den, eller ta bort den direkt.",
        cta: { label: "Lägg till boende", href: "/onboarding?kind=boende" },
      },
      {
        text: "Så snart den nya adressen är inlagd kan du jämföra hemförsäkring för den mot andra bolag.",
        cta: { label: "Till översikten", href: "/dashboard" },
      },
      {
        text: "Kolla om ditt elavtal följer med till den nya adressen eller behöver bytas.",
        cta: { label: "Lägg till el & energi", href: "/onboarding?kind=el" },
      },
      {
        text: "Uppdatera bilförsäkringen om du får ny gatuadress eller parkering — det kan påverka priset.",
        cta: { label: "Till översikten", href: "/dashboard" },
      },
      { text: "Meddela banken och andra avtal om din nya adress — det kan Buddy inte göra åt dig." },
    ],
  },
  barn: {
    title: "Vi väntar barn",
    intro: "Några saker värda att ha koll på inför tillökningen.",
    steps: [
      {
        text: "Lägg till ditt barn som en försäkrad person så snart personnumret finns.",
        cta: { label: "Lägg till person", href: "/onboarding?kind=person" },
      },
      {
        text: "Jämför barnförsäkring — priset skiljer sig ofta mer mellan bolag än för vuxna.",
        cta: { label: "Till översikten", href: "/dashboard" },
      },
      {
        text: "Fundera på om hemförsäkringens värde på lösöre räcker med en till i familjen.",
        cta: { label: "Till översikten", href: "/dashboard" },
      },
      {
        text: "Kolla vad som redan ingår i föräldraförsäkringen och ditt kollektivavtal innan du köper mer.",
        cta: { label: "Fråga Buddy", href: "/chat" },
      },
    ],
  },
  fordon: {
    title: "Jag ska köpa ett fordon",
    intro: "Bra att ha koll på försäkringen innan du skriver på hos säljaren.",
    steps: [
      {
        text: "Lägg till bilen så snart du har registreringsnumret — även innan den är påställd, så hinner du jämföra i lugn och ro.",
        cta: { label: "Lägg till bil", href: "/onboarding?kind=bil" },
      },
      {
        text: "Är det istället en husvagn, mc, båt eller släp? Samma sak gäller där.",
        cta: { label: "Lägg till övrigt fordon", href: "/onboarding?kind=ovrigt_fordon" },
      },
      {
        text: "Jämför innan du tecknar via säljaren eller mäklaren — det tar bara en minut och du binder dig inte till något.",
        cta: { label: "Till översikten", href: "/dashboard" },
      },
    ],
  },
  djur: {
    title: "Vi skaffade husdjur",
    intro: "Ju tidigare du tecknar, desto bättre — många djurförsäkringar har karenstid.",
    steps: [
      {
        text: "Lägg till djuret så kan du jämföra djurförsäkring direkt.",
        cta: { label: "Lägg till djur", href: "/onboarding?kind=djur" },
      },
      {
        text: "Karenstid betyder att skador de första dagarna/veckorna oftast inte täcks — vänta inte för länge med att teckna.",
        cta: { label: "Till översikten", href: "/dashboard" },
      },
    ],
  },
};

// Generella, ärliga råd — inga fiktiva bolagsnamn eller påhittade siffror,
// samma "dubbelförsäkrad"-tema som redan finns i grundarcitatet på om-oss.
export const SYSSELSATTNING_TIPS: Record<Sysselsattning, string> = {
  anstalld: "Många anställda har redan olycksfalls- och livförsäkring via jobbet eller facket — dubbelkolla innan du köper mer, annars riskerar du att betala för samma skydd två gånger.",
  egenforetagare: "Som egenföretagare saknar du ofta det skydd en anställning ger automatiskt — sjuk- och inkomstförsäkring är särskilt värt att se över.",
  student: "Många studentbostäder kräver hemförsäkring, och flera bolag ger studentrabatt — värt att fråga om vid tecknande.",
  arbetssokande: "Som arbetssökande kan en inkomstförsäkring vara viktigare än vanligt att ha koll på, utöver din hemförsäkring.",
  pensionar: "Som pensionär kan behovet av olycksfallsförsäkring öka, samtidigt som yngre-anpassade tillägg som äventyrssport i reseförsäkringen sällan behövs.",
};

export type SysselsattningTip = { sysselsattning: Sysselsattning; label: string; tip: string };

export function getSysselsattningTips(items: InsuranceItem[]): SysselsattningTip[] {
  const present = new Set<Sysselsattning>();
  for (const item of items) {
    if (item.kind === "person" && item.sysselsattning) present.add(item.sysselsattning);
  }
  return Array.from(present).map((sysselsattning) => ({
    sysselsattning,
    label: SYSSELSATTNING_LABELS[sysselsattning],
    tip: SYSSELSATTNING_TIPS[sysselsattning],
  }));
}

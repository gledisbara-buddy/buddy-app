export type JobListing = {
  id: string;
  title: string;
  team: string;
  location: string;
  type: string;
  desc: string;
};

export const JOB_LISTINGS: JobListing[] = [
  {
    id: "backend-utvecklare",
    title: "Backend-utvecklare",
    team: "Produkt & Teknik",
    location: "Stockholm / Distans",
    type: "Heltid",
    desc: "Bygg och underhåll de tjänster som håller reda på kundernas försäkringar, offerter och skadeärenden.",
  },
  {
    id: "kundtjanstmedarbetare",
    title: "Kundtjänstmedarbetare",
    team: "Kundtjänst",
    location: "Malmö",
    type: "Heltid",
    desc: "Hjälp kunder över telefon och chatt med frågor om deras försäkringar och pågående ärenden.",
  },
  {
    id: "skadereglerare",
    title: "Skadereglerare",
    team: "Skador",
    location: "Göteborg",
    type: "Heltid",
    desc: "Utred och besluta i skadeärenden, med fokus på snabba och rättvisa besked till kunden.",
  },
  {
    id: "ux-designer",
    title: "UX-designer",
    team: "Produkt & Teknik",
    location: "Stockholm / Distans",
    type: "Heltid",
    desc: "Designa flöden som gör krångliga försäkringsbeslut enkla att förstå och ta.",
  },
];

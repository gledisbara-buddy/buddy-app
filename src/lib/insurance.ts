export const PRIORITY_OPTIONS = [
  { id: "pris", label: "Lägre pris", desc: "Jag vill inte betala mer än jag behöver." },
  {
    id: "skydd",
    label: "Bättre skydd",
    desc: "Jag vill vara säker på att jag täcks vid en skada.",
  },
  {
    id: "snabbhet",
    label: "Snabbare skadehantering",
    desc: "Om något händer vill jag ha svar snabbt.",
  },
  {
    id: "hjalp",
    label: "Jag vet inte, vill ha hjälp",
    desc: "Föreslå det som passar mig bäst.",
  },
] as const;

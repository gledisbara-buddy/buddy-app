export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  readMinutes: number;
  body: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "ratt-hemforsakring",
    title: "Så väljer du rätt hemförsäkring",
    excerpt: "Boyta, boendeform och vad du äger avgör vilket skydd som faktiskt är rätt för dig.",
    readMinutes: 4,
    body: [
      "En hemförsäkring är sällan en enda produkt — den sätts ihop av flera delar som lösöreskydd, ansvarsskydd, rättsskydd och ibland reseskydd.",
      "Börja med att uppskatta värdet av det du äger. Ett litet hushåll med få värdesaker behöver sällan samma nivå som ett hushåll med till exempel elektronik, cyklar eller smycken av högre värde.",
      "Boendeform spelar också roll: hyresrätt, bostadsrätt och villa har olika behov — en bostadsrättsinnehavare behöver till exempel oftast ett bostadsrättstillägg, medan en villaägare behöver tänka på byggnaden i sig.",
      "Sist: jämför inte bara pris. Titta på självrisk och vad som faktiskt ingår i grundskyddet innan du bestämmer dig.",
    ],
  },
  {
    slug: "vad-tacker-bilforsakring",
    title: "Det här täcker en bilförsäkring",
    excerpt: "Trafik-, halv- och helförsäkring låter snarlika men skiljer sig rejält åt.",
    readMinutes: 5,
    body: [
      "Alla bilar måste ha minst en trafikförsäkring — den täcker skador du orsakar andra, men inte din egen bil.",
      "En halvförsäkring lägger till skydd för till exempel brand, stöld, glas och räddning, men täcker inte skador på din egen bil vid en olycka du själv orsakat.",
      "En helförsäkring inkluderar allt i halvförsäkringen plus vagnskadeskydd — det vill säga skador på din egen bil vid en olycka, oavsett vems fel det var.",
      "Yngre bilar med högre värde är ofta värda att helförsäkra, medan en äldre bil med lågt marknadsvärde ibland klarar sig fint på en halvförsäkring.",
    ],
  },
  {
    slug: "behover-du-olycksfallsforsakring",
    title: "Behöver du en olycksfallsförsäkring?",
    excerpt: "Arbetsgivare och fackförbund täcker mer än du tror — men inte allt, och inte alltid på fritiden.",
    readMinutes: 3,
    body: [
      "Många har redan ett visst skydd genom jobbet, facket eller barnens skola — men det gäller sällan dygnet runt, och ersättningsnivåerna varierar stort.",
      "En olycksfallsförsäkring kompletterar med skydd som gäller även på fritiden, och ger ofta ersättning för sådant som ärr, tandskador och nedsatt arbetsförmåga.",
      "Är du osäker på vad du redan har? Börja med att lista dina nuvarande skydd i Buddy — det gör det lättare att se om ett tillägg faktiskt fyller en lucka.",
    ],
  },
  {
    slug: "sa-fungerar-sjalvrisk",
    title: "Så fungerar självrisk",
    excerpt: "En lägre premie betyder oftast en högre självrisk — här är avvägningen du faktiskt gör.",
    readMinutes: 3,
    body: [
      "Självrisk är den del av en skada du betalar själv innan försäkringen träder in. Generellt gäller: lägre premie, högre självrisk — och tvärtom.",
      "Vissa bolag erbjuder rörlig självrisk som du kan välja själv vid tecknandet, medan andra har fasta nivåer per skadetyp.",
      "En bra tumregel: om du sällan gör skadeanmälningar kan en högre självrisk mot lägre premie löna sig över tid. Gör du det oftare (t.ex. med barn eller husdjur i hemmet) kan en lägre självrisk vara värd den högre kostnaden.",
    ],
  },
];

export function getGuideBySlug(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}

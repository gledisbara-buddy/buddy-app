export type NewsArticle = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  body: string[];
};

// Nyast först — både startsidans "senaste 3" och /nyheter litar på
// array-ordningen istället för att sortera om, så ordningen HÄR är det
// som avgör vad som visas som senast. Håll datumen i dåtid (eller idag)
// relativt verkliga kalenderdatumet, annars ser "aktuellt just nu" ut att
// visa nyheter från framtiden.
export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: "elsparkcyklar-forsakring-2026",
    category: "Nyheter",
    title: "Det här gäller för elsparkcyklar och försäkring just nu",
    excerpt:
      "Fler äger egna elsparkcyklar och elcyklar — men vad täcks egentligen om olyckan är framme?",
    date: "2026-08-11",
    body: [
      "I takt med att fler skaffar egna elsparkcyklar och elcyklar ökar också frågorna om vad som gäller försäkringsmässigt. Kort sagt: det beror på fordonets toppfart och effekt.",
      "Elsparkcyklar och elcyklar som räknas som cykel enligt trafikförordningen täcks vanligen av hemförsäkringens lösöresskydd om de blir stulna eller skadade. Snabbare fordon kan istället klassas som moped och kräva en separat moped- eller olycksfallsförsäkring.",
      "Är du osäker på vad som gäller för just ditt fordon rekommenderar vi att du lägger in det under \"Övrigt fordon\" i din översikt, så kan du jämföra rätt typ av skydd.",
    ],
  },
  {
    slug: "undvik-dubbelforsakring",
    category: "Tips",
    title: "Så undviker du att betala för dubbel försäkring",
    excerpt:
      "Reseskydd via kortet, hemförsäkringen och en separat reseförsäkring — plötsligt betalar du tre gånger för samma sak.",
    date: "2026-07-30",
    body: [
      "Ett av de vanligaste misstagen vi ser är att kunder betalar för samma skydd flera gånger utan att veta om det. Reseskydd är ett klassiskt exempel — det ingår ofta både i hemförsäkringen och i kreditkort, men med olika begränsningar.",
      "Innan du tecknar ett tillägg, gå igenom vad du redan har. Fråga dig: skulle jag klara mig med det skydd jag redan betalar för, om något hände imorgon?",
      "Buddy visar automatiskt en översikt över allt du lagt in, vilket gör det enklare att upptäcka den här typen av överlapp själv — utan att behöva ringa runt till flera bolag.",
    ],
  },
  {
    slug: "fem-saker-installa-vintern",
    category: "Boende",
    title: "5 saker att kolla i din hemförsäkring inför vintern",
    excerpt:
      "Snötyngda tak, frusna rör och halka på uppfarten — vintern är högsäsong för hemförsäkringsskador. Så förbereder du dig.",
    date: "2026-07-14",
    body: [
      "Vintern är den period på året då flest hemförsäkringsärenden rör vatten- och frostskador. En stor del av dem går att förebygga med enkla åtgärder innan kylan kommer på riktigt.",
      "Kontrollera att dräneringen runt huset är fri från löv och skräp, så att smältvatten inte blir stående mot grunden. Se också över om ditt avtal täcker skador orsakade av snötyngda tak — det skiljer sig mellan bolag.",
      "Har du en fritidsfastighet som står tom under vintern? Många försäkringar kräver att värmen hålls på en viss lägsta nivå för att en eventuell frostskada ska ersättas. Läs igenom villkoren en extra gång.",
      "Sist men inte minst: dokumentera ditt hem med några foton innan vintersäsongen. Det gör en eventuell skadeanmälan snabbare och enklare längre fram.",
    ],
  },
  {
    slug: "klimat-hemforsakring",
    category: "Trender",
    title: "Så påverkar mer extremväder hemförsäkringen framöver",
    excerpt:
      "Skyfall, ras och stormskador blir vanligare — och det märks i hur försäkringsbolagen ser på risk.",
    date: "2026-06-20",
    body: [
      "De senaste årens mer extrema väder har gjort att fler försäkringsbolag ser över hur de prissätter och bedömer risk för fastigheter i utsatta lägen.",
      "Konkret innebär det att faktorer som markförhållanden, avstånd till vattendrag och tidigare skadehistorik väger allt tyngre vid nyteckning.",
      "Vårt tips: se över om ditt boende har extra skydd mot till exempel källaröversvämning, särskilt om du bor i ett område med känd risk för skyfall.",
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return NEWS_ARTICLES.find((a) => a.slug === slug);
}

export type GuideCategory = "forsakring" | "mobil-bredband" | "ekonomi" | "buddy";

export const GUIDE_CATEGORY_LABELS: Record<GuideCategory, string> = {
  forsakring: "Försäkring",
  "mobil-bredband": "Mobil & bredband",
  ekonomi: "Kreditkort & el",
  buddy: "Så fungerar Buddy",
};

export type GuideSection = {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  readMinutes: number;
  category: GuideCategory;
  sections: GuideSection[];
};

export const GUIDES: Guide[] = [
  {
    slug: "ratt-hemforsakring",
    title: "Så väljer du rätt hemförsäkring",
    excerpt: "Boyta, boendeform och vad du äger avgör vilket skydd som faktiskt är rätt för dig.",
    readMinutes: 7,
    category: "forsakring",
    sections: [
      {
        paragraphs: [
          "En hemförsäkring är sällan en enda produkt — den sätts ihop av flera delar som lösöreskydd, ansvarsskydd, rättsskydd, överfallsskydd och ibland reseskydd. De flesta bolag paketerar dessa i ett grundskydd och låter dig sedan lägga till tillägg, vilket gör det svårt att jämföra rakt av på pris — två \"grundförsäkringar\" kan täcka helt olika saker.",
        ],
      },
      {
        heading: "Börja med vad du faktiskt äger",
        paragraphs: [
          "Lösöreskyddet har nästan alltid ett tak — ofta någonstans mellan 1 och 2 miljoner kronor totalt, men med lägre delbelopp för specifika kategorier som elektronik, cyklar och smycken. Ett hushåll med en dyr cykel eller samlarobjekt kan behöva ett tillägg för att faktiskt vara fullt täckt, även om totalbeloppet ser högt ut.",
          "Ett enkelt sätt att uppskatta rätt nivå: gå igenom hemmet rum för rum och summera ungefärligt återanskaffningsvärde — vad det skulle kosta att köpa allt nytt idag, inte vad du en gång betalade.",
        ],
      },
      {
        heading: "Boendeformen styr vad du behöver utöver grundskyddet",
        paragraphs: ["De tre vanligaste boendeformerna har olika behov utöver standardpaketet:"],
        bullets: [
          "Hyresrätt — grundskyddet räcker oftast, men kolla att det inkluderar skador du orsakar på fastigheten (t.ex. en vattenskada från din tvättmaskin).",
          "Bostadsrätt — behöver nästan alltid ett bostadsrättstillägg. Föreningens fastighetsförsäkring täcker bara byggnaden i grunden, inte det du själv bekostat i lägenheten (kök, golv, badrum).",
          "Villa — byggnaden ingår i en villaförsäkring (till skillnad från hemförsäkring), och du bör dessutom kolla vad som gäller för fristående byggnader som garage och förråd.",
        ],
      },
      {
        heading: "Titta bortom priset",
        paragraphs: [
          "Den lägsta premien har nästan alltid en högre självrisk eller ett smalare grundskydd som förklaring. Innan du bestämmer dig, jämför tre saker sida vid sida: självrisken vid en vanlig skada (t.ex. vattenskada), taket för lösöre respektive elektronik specifikt, och om drulleförsäkring (skador du själv orsakar av misstag) ingår eller är ett tillägg.",
          "I Buddy ser du de här siffrorna sida vid sida när du jämför, istället för att behöva leta upp varje bolags fullständiga villkor separat.",
        ],
      },
    ],
  },
  {
    slug: "vad-tacker-bilforsakring",
    title: "Det här täcker en bilförsäkring",
    excerpt: "Trafik-, halv- och helförsäkring låter snarlika men skiljer sig rejält åt.",
    readMinutes: 6,
    category: "forsakring",
    sections: [
      {
        paragraphs: [
          "Alla bilar som är trafikförsäkringspliktiga måste minst ha en trafikförsäkring enligt lag — det är inget bolaget \"erbjuder\", det är ett krav så fort bilen är påställd. Frågan är alltid hur mycket mer skydd du lägger på utöver det.",
        ],
      },
      {
        heading: "De tre nivåerna",
        paragraphs: [],
        bullets: [
          "Trafikförsäkring — täcker skador du orsakar ANDRA (personer, deras fordon, egendom). Täcker aldrig din egen bil, oavsett vems fel olyckan var.",
          "Halvförsäkring — trafikförsäkring plus brand, stöld, glasskador, räddning (t.ex. bärgning) och rättsskydd. Fortfarande inget skydd för din egen bil vid en olycka du själv orsakat.",
          "Helförsäkring — halvförsäkring plus vagnskadeskydd, det vill säga skador på din egen bil oavsett vems fel olyckan var. Det är vagnskadeskyddet som gör helförsäkring dyrare, inte resten av paketet.",
        ],
      },
      {
        heading: "Så avgör du vilken nivå som är värd pengarna",
        paragraphs: [
          "Tumregeln bolagen själva använder: ju högre bilens marknadsvärde är i förhållande till prisskillnaden mellan halv- och helförsäkring, desto mer lönar sig helförsäkring. En bil värd 300 000 kr har mycket att förlora vid en vagnskada — en bil värd 30 000 kr mindre.",
          "Många nya bilar har dessutom vagnskadegaranti inkluderad från tillverkaren de första åren — värt att kolla innan du betalar för vagnskadeskydd du redan har på annat håll.",
        ],
      },
      {
        heading: "Sådant som ofta missas vid jämförelse",
        paragraphs: [
          "Bonus-malus, självriskens storlek vid olika skadetyper (glasskada har ofta lägre eller ingen självrisk än en vagnskada), och om djurkollisionsskydd ingår eller är ett tillägg — relevant om du ofta kör på landsväg.",
        ],
      },
    ],
  },
  {
    slug: "behover-du-olycksfallsforsakring",
    title: "Behöver du en olycksfallsförsäkring?",
    excerpt: "Arbetsgivare och fackförbund täcker mer än du tror — men inte allt, och inte alltid på fritiden.",
    readMinutes: 5,
    category: "forsakring",
    sections: [
      {
        paragraphs: [
          "Många svenskar har redan ett visst skydd genom jobbet (arbetsskadeförsäkring), facket (medlemsförsäkring) eller barnens skola/förskola — men det gäller nästan aldrig dygnet runt, och ersättningsnivåerna varierar kraftigt mellan olika kollektivavtal.",
        ],
      },
      {
        heading: "Vad kollektivt skydd oftast INTE täcker",
        paragraphs: [],
        bullets: [
          "Olyckor på fritiden, om skyddet enbart gäller arbetstid",
          "Olyckor för dig som är arbetssökande, studerande eller egen företagare utan kollektivavtal",
          "Fritidsskador för barn utanför skoltid (skolans försäkring gäller oftast bara på väg till/från och under skoltid)",
        ],
      },
      {
        heading: "Vad en egen olycksfallsförsäkring lägger till",
        paragraphs: [
          "En privat olycksfallsförsäkring kompletterar med skydd dygnet runt, och ger ofta ersättning för sådant kollektiva skydd sällan täcker fullt ut: ärr, tandskador orsakade av olycka, och nedsatt arbetsförmåga (medicinsk och ekonomisk invaliditet).",
        ],
      },
      {
        heading: "Så tar du reda på om du redan är täckt",
        paragraphs: [
          "Är du osäker på vad du redan har genom jobb eller fack? Börja med att lista dina nuvarande skydd i Buddy — appen visar din trygghetspoäng utifrån det du faktiskt lagt in, vilket gör det enklare att se om ett tillägg fyller en verklig lucka eller bara dubblerar något du redan har.",
        ],
      },
    ],
  },
  {
    slug: "sa-fungerar-sjalvrisk",
    title: "Så fungerar självrisk",
    excerpt: "En lägre premie betyder oftast en högre självrisk — här är avvägningen du faktiskt gör.",
    readMinutes: 5,
    category: "forsakring",
    sections: [
      {
        paragraphs: [
          "Självrisk är den del av en skada du betalar själv innan försäkringen träder in och täcker resten. Grundprincipen gäller nästan alltid: lägre premie, högre självrisk — och tvärtom. Bolaget flyttar risk mellan sig och dig, inte bort den.",
        ],
      },
      {
        heading: "Fast vs. rörlig självrisk",
        paragraphs: [
          "Vissa bolag erbjuder en rörlig självrisk du väljer själv vid tecknandet (ofta 3-4 nivåer att välja mellan), medan andra har fasta belopp per skadetyp — glasskada har till exempel ofta en lägre fast självrisk än en vattenskada, eftersom glasskador är vanligare men billigare att åtgärda.",
        ],
      },
      {
        heading: "Grundsjälvrisk plus tillägg",
        paragraphs: [
          "Flera skadetyper har en grundsjälvrisk plus ett procentuellt eller fast tillägg beroende på omständigheterna — till exempel en högre självrisk om skadan skedde när ingen larmat, eller om föraren var under 25 år vid en bilskada. Läs alltid det finstilta för just den skadetyp som är mest sannolik för dig.",
        ],
      },
      {
        heading: "Så räknar du på vad som lönar sig",
        paragraphs: [
          "Enkel tumregel: dela prisskillnaden mellan en hög och en låg självriskvariant med skillnaden i självriskbelopp. Om du sällan gör skadeanmälningar (inga barn, inga husdjur, ingen historik av skador) lönar sig ofta en högre självrisk mot lägre premie över tid — statistiskt betalar du mindre totalt sett. Har du historik av flera skador per år är det ofta tvärtom.",
        ],
      },
    ],
  },
  {
    slug: "ratt-mobilabonnemang",
    title: "Så väljer du rätt mobilabonnemang",
    excerpt: "Datamängd, bindningstid och nätverkstäckning på din adress spelar större roll än priset på appen.",
    readMinutes: 6,
    category: "mobil-bredband",
    sections: [
      {
        paragraphs: [
          "De flesta betalar för mer surfmängd än de faktiskt använder — men det omvända problemet (för lite data, extra kostnad varje månad) är ofta värre för plånboken i längden. Börja med att kolla din faktiska förbrukning i telefonens inställningar innan du jämför.",
        ],
      },
      {
        heading: "Operatör vs. nätägare",
        paragraphs: [
          "Många \"lågprisoperatörer\" äger inget eget nät — de hyr kapacitet av Telia, Tele2 eller Three och kan ibland nedprioriteras vid hög belastning. Det märks sällan i vardagen, men kan märkas på tåget klockan 17 en vardag i storstan. Kolla vilket nät en operatör faktiskt kör på, inte bara varumärkesnamnet.",
        ],
      },
      {
        heading: "Bindningstid är en verklig kostnad",
        paragraphs: [
          "Ett lägre månadspris med 24 månaders bindning kan bli dyrare totalt än ett obundet abonnemang med något högre pris, om du byter operatör innan bindningstiden löper ut — då betalar du ofta resterande bindningstid som engångsavgift.",
        ],
      },
      {
        heading: "Så täckningskollar du innan du byter",
        paragraphs: [
          "I Buddy kan du söka på din adress i mobilflödet för att se ungefärlig täckning per nät innan du byter — det säger mer om verklig kvalitet på just din adress än ett genomsnittligt \"täcker 99,9% av Sverige\"-påstående.",
        ],
      },
    ],
  },
  {
    slug: "dolda-kostnader-prenumerationer",
    title: "Dolda kostnader i dina prenumerationer",
    excerpt: "Streamingtjänster, bredband och appabonnemang som glidit in i bakgrunden är den vanligaste läckan i hushållsekonomin.",
    readMinutes: 5,
    category: "mobil-bredband",
    sections: [
      {
        paragraphs: [
          "Det är sällan en enskild stor kostnad som sänker en hushållsbudget — det är fem-sex små prenumerationer på 79-149 kr i månaden som ingen kommer ihåg att man faktiskt betalar för. Var för sig ser de obetydliga ut. Summerat blir det ofta flera tusenlappar om året.",
        ],
      },
      {
        heading: "Introduktionspris är den vanligaste fällan",
        paragraphs: [
          "Många bredbands- och streamingavtal har ett lågt introduktionspris de första 6-12 månaderna som sedan automatiskt höjs till ordinarie pris — utan att du aktivt behöver godkänna något. Om du inte minns exakt vad du en gång tecknade är chansen stor att du betalar mer idag än du tror.",
        ],
      },
      {
        heading: "Så hittar du läckorna",
        paragraphs: ["Tre saker att göra en gång per år, oavsett om du använder Buddy eller inte:"],
        bullets: [
          "Gå igenom kontoutdraget för en hel månad och markera varje återkommande dragning, inte bara de du känner igen direkt.",
          "Kolla om bindningstiden på bredband/mobil löpt ut — efter bindningstiden kan du ofta omförhandla till ett lägre pris utan att byta leverantör.",
          "Fråga dig själv om du faktiskt använt tjänsten senaste månaden, inte bara om du en gång tyckte den var värd det.",
        ],
      },
      {
        heading: "Hur Buddy hjälper till",
        paragraphs: [
          "När du kopplar in dina abonnemang i Buddy samlas de på samma ställe som resten av det du betalar för, så helhetsbilden syns direkt istället för utspridd över flera olika appar och kontoutdrag.",
        ],
      },
    ],
  },
  {
    slug: "ratt-kreditkort",
    title: "Så väljer du rätt kreditkort",
    excerpt: "Årsavgift, ränta och bonussystem drar åt olika håll beroende på hur du faktiskt använder kortet.",
    readMinutes: 5,
    category: "ekonomi",
    sections: [
      {
        paragraphs: [
          "Ett kreditkort är inte en enda produkt utan ett val mellan flera olika avvägningar — årsavgift mot förmåner, räntefri period mot faktisk kreditränta, och bonussystem som bara är värdefulla om du faktiskt handlar där bonusen ges.",
        ],
      },
      {
        heading: "Räntefri period är oftast det viktigaste, inte räntan",
        paragraphs: [
          "De flesta kreditkort har en räntefri period (ofta 30-45 dagar) om hela skulden betalas i tid varje månad — vilket gör den nominella räntan nästan irrelevant för den som betalar i tid. Räntan blir bara verklighet om du inte betalar hela beloppet, och då är den ofta betydligt högre än ett vanligt blancolån.",
        ],
      },
      {
        heading: "Årsavgift kontra förmåner",
        paragraphs: [
          "Ett kort utan årsavgift är sällan \"sämre\" — det saknar bara de extra förmånerna (reseförsäkring, lounge-tillgång, förlängd garanti) som ett kort med avgift kompenserar för. Räkna på om du faktiskt skulle använda förmånerna innan du väljer ett kort enbart för att det är \"premium\".",
        ],
      },
      {
        heading: "Bonussystem är bara värda vad du faktiskt spenderar",
        paragraphs: [
          "Ett kort med hög bonus på en viss kategori (t.ex. resor eller mat) är bara värt det extra om du redan spenderar mycket där. Att välja kort utifrån bonusprocent utan att titta på ditt faktiska konsumtionsmönster är den vanligaste anledningen till att bonusen aldrig känns värd något i praktiken.",
        ],
      },
    ],
  },
  {
    slug: "sa-fungerar-elavtal",
    title: "Så fungerar elavtal — rörligt vs. fast pris",
    excerpt: "Rörligt pris följer marknaden timme för timme. Fast pris är en försäkring mot att marknaden rör sig fel väg.",
    readMinutes: 5,
    category: "ekonomi",
    sections: [
      {
        paragraphs: [
          "Elpriset du ser i ett avtal är bara en del av totalkostnaden — elöverföringen (nätavgiften till din nätägare, som du inte kan välja bort) och skatter läggs alltid på ovanpå, oavsett vilket elhandelsbolag du väljer.",
        ],
      },
      {
        heading: "Rörligt pris",
        paragraphs: [
          "Följer elbörsens spotpris (ofta timme för timme numera). Historiskt sett billigast i genomsnitt över tid, men med betydande svängningar mellan säsonger och år — vintermånader kan bli väsentligt dyrare än sommaren.",
        ],
      },
      {
        heading: "Fast pris",
        paragraphs: [
          "Du låser ett pris för en avtalsperiod (ofta 1-3 år), oavsett vad som händer på elmarknaden. I praktiken en försäkring mot prisuppgångar — du betalar för förutsägbarhet, inte nödvändigtvis för ett lägre snittpris.",
        ],
      },
      {
        heading: "Vad som faktiskt avgör vilket som passar dig",
        paragraphs: ["Det handlar mindre om att \"gissa rätt\" på marknaden och mer om din egen riskvilja:"],
        bullets: [
          "Rörligt passar dig som klarar en dyrare månad ibland utan att det stör ekonomin, och som helst inte vill betala för en trygghet du kanske inte behöver.",
          "Fast passar dig som vill kunna budgetera exakt varje månad, eller som helt enkelt inte vill oroa sig för elräkningen.",
          "Ett mellanting — mixavtal där en del av förbrukningen är fast och en del rörlig — finns hos flera bolag och jämnar ut svängningarna utan att låsa hela priset.",
        ],
      },
    ],
  },
  {
    slug: "sa-raknas-trygghetspoangen",
    title: "Så räknas din trygghetspoäng",
    excerpt: "Trygghetspoängen är inte ett kreditbetyg — det är en checklista över vad du faktiskt har skydd för, omvandlad till en siffra.",
    readMinutes: 4,
    category: "buddy",
    sections: [
      {
        paragraphs: [
          "Trygghetspoängen bygger helt på det du själv lagt in i Buddy — den hämtar aldrig information om dig från något externt register, och Buddy skickar den aldrig vidare till något försäkringsbolag. Den finns för dig, inte om dig till någon annan.",
        ],
      },
      {
        heading: "Vad som påverkar poängen",
        paragraphs: [],
        bullets: [
          "Grundskydd på plats — har du en hemförsäkring och, om aktuellt, en fordonsförsäkring inlagd.",
          "Rimlig nivå på skyddet — inte bara \"finns det\", utan matchar det ungefärligt det du faktiskt äger och din livssituation (t.ex. bostadsrättstillägg om du bor i bostadsrätt).",
          "Luckor som är vanliga att missa — som olycksfallsskydd på fritiden, eller skydd för specifika värdeföremål.",
          "Uppdaterad information — poängen sjunker inte om du inte loggat in på länge, men en genomgång du inte gjort på över ett år flaggas som en punkt att kolla igenom igen.",
        ],
      },
      {
        heading: "Varför en poäng istället för bara en checklista",
        paragraphs: [
          "En ren checklista med bockar är svår att prioritera mellan — allt ser lika viktigt ut. Poängen viktar automatiskt det som statistiskt gör störst skillnad (grundskydd väger tyngre än ett smalt tillägg), så du vet vad som faktiskt är värt att åtgärda först.",
        ],
      },
      {
        heading: "Vad poängen inte är",
        paragraphs: [
          "Den är inte en riskbedömning bolaget använder för att sätta din premie, och den påverkar aldrig vad du erbjuds för pris. Den är enbart ett verktyg för dig att se var luckorna finns.",
        ],
      },
    ],
  },
  {
    slug: "sa-fungerar-bankid-importen",
    title: "Så fungerar BankID-importen",
    excerpt: "Vad Buddy faktiskt ser när du loggar in med BankID — och vad appen aldrig får tillgång till.",
    readMinutes: 4,
    category: "buddy",
    sections: [
      {
        paragraphs: [
          "Istället för att du manuellt letar upp och skriver in varje försäkring, mobilabonnemang eller kreditkort du har, kan Buddy hämta en översikt direkt via BankID — på under en minut istället för att gå igenom fem olika bolags inloggningar.",
        ],
      },
      {
        heading: "Vad importen hämtar",
        paragraphs: [
          "Vilka avtal du har och grundläggande uppgifter om dem — typ av försäkring eller abonnemang, ungefärligt pris och vilket bolag det gäller. Tillräckligt för att ge dig en samlad överblick och en första trygghetspoäng direkt.",
        ],
      },
      {
        heading: "Vad importen inte gör",
        paragraphs: [
          "Den ändrar, säger upp eller tecknar aldrig något automatiskt åt dig. Allt du ser efter en import är enbart en läsning av vad som redan finns — varje förändring (uppsägning, nyteckning) kräver ett aktivt godkännande från dig i ett separat steg.",
        ],
      },
      {
        heading: "Om något saknas eller inte hittas",
        paragraphs: [
          "Vissa mindre bolag eller äldre avtalstyper går inte alltid att hämta automatiskt. Då kan du flagga att något saknas direkt i appen, eller lägga in det manuellt själv — importen är ett genvägsverktyg, inte den enda vägen in.",
        ],
      },
    ],
  },
  {
    slug: "fullmakt-forklarat",
    title: "Fullmakt förklarat — vad du faktiskt skriver under på",
    excerpt: "En fullmakt låter Buddy prata med dina bolag åt dig. Här är exakt vad det innebär, och vad det inte gör.",
    readMinutes: 4,
    category: "buddy",
    sections: [
      {
        paragraphs: [
          "När du säger upp en gammal försäkring eller ett gammalt abonnemang är det ofta själva samtalet till det gamla bolaget som känns mest krångligt — telefonköer, uppsägningsblanketter, bekräftelser som ska skickas i rätt format. En signerad fullmakt gör att Buddy kan sköta den delen åt dig.",
        ],
      },
      {
        heading: "Vad fullmakten ger Buddy rätt att göra",
        paragraphs: [
          "Att kontakta det specifika bolag och avtal du pekat ut, i ditt namn, för det specifika ärendet du bett om hjälp med — vanligtvis en uppsägning i samband med att du tecknar ett nytt avtal via Buddy.",
        ],
      },
      {
        heading: "Vad fullmakten inte ger Buddy rätt att göra",
        paragraphs: [],
        bullets: [
          "Teckna nya avtal i ditt namn utan att du själv aktivt godkänt dem först",
          "Flytta pengar eller ändra betalningsuppgifter",
          "Företräda dig hos bolag eller i ärenden du inte själv pekat ut",
        ],
      },
      {
        heading: "Du kan alltid återkalla den",
        paragraphs: [
          "En fullmakt gäller tills du återkallar den — det gör du genom att kontakta kundtjänst, när som helst, utan att behöva ange något skäl. Alla tidigare signerade fullmakter finns dessutom sparade i ditt dokumentarkiv, så du alltid kan se exakt vad du en gång skrev under på.",
        ],
      },
    ],
  },
];

export function getGuideBySlug(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}

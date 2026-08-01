# Buddy — projektöversikt

Det här dokumentet är den levande sammanfattningen av vad Buddy är och vad som är byggt.
Uppdatera det när nya funktioner läggs till eller större beslut tas — det ska alltid gå
att läsa den här filen och förstå var projektet står, utan att gräva i commit-historiken.

## Vad är Buddy?

Buddy är en digital assistent för att **lägga in, hålla koll på och jämföra allt man
betalar för löpande** — inte bara försäkring. I dagsläget täcker appen nio kategorier
i tre grupper:

- **Försäkring**: Boende (hyresrätt/bostadsrätt/villa/fritidshus/magasinering), Bil,
  Övrigt fordon (mc/husvagn/båt/släp/annat), Person, Djur.
- **Telekom & prenumerationer**: Mobil & bredband (mobilabonnemang/bredband/TV-streaming),
  Övriga abonnemang (fri samlingskategori, t.ex. gymkort).
- **Ekonomi**: Kreditkort (befintligt kort eller "utforska nytt"), El & energi.

Produkten är just nu en **designprototyp**: allt innehåll som ser ut som riktiga bolag,
priser, recensioner eller statistik är fiktivt och tydligt markerat som exempeldata där
det förekommer (topplistan, testimonials, förtroendesiffror på /jamfor).

## Snabbstart

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

- Node hanteras via **nvm** på den här maskinen (ingen Homebrew/sudo tillgängligt) —
  kör `source ~/.nvm/nvm.sh` i ett nytt skal innan `npm`/`npx` om de inte hittas.
- Adressökningen (`/api/address-search`) kräver `GEOAPIFY_API_KEY` i `.env.local`
  (kopiera `.env.local.example`). Utan nyckeln fungerar allt annat, men
  adressfältet i Boende-formuläret returnerar inga träffar.
- **Läs `AGENTS.md` innan du kodar** — Next.js 16 här har brytande ändringar mot
  standardkunskap, dokumentationen finns i `node_modules/next/dist/docs/`.

## Teknikstack

- **Next.js 16.2.12** (App Router, Turbopack) + **React 19** + **TypeScript**.
- **Tailwind CSS v4**, CSS-first config via `@theme inline` i `src/app/globals.css`
  (ingen `tailwind.config.js`). Designtokens: `--color-forest` (primärgrön),
  `--color-frost`/`--color-frost-2` (ljusa bakgrunder), `--color-ink` (text),
  `--color-slate` (sekundär text), `--color-amber`/`--color-amber-deep` (accent).
  Typsnitt: Fraunces (rubriker, `.bd-display`), Inter (brödtext), IBM Plex Mono
  (`.bd-eyebrow`-etiketter).
- **lucide-react** för alla ikoner.
- **React Context** (`BuddyProvider` i `src/lib/buddy-context.tsx`) är den enda
  state-lagringen — **ingen databas, inget localStorage**. Allt återställs vid
  hård omladdning. Detta är ett medvetet vald avgränsning hittills, inte ett förbiseende.
- Inget backend-API förutom `/api/address-search` (proxy mot Geoapify, håller
  API-nyckeln server-side).
- Repo: `github.com/gledisbara-buddy/buddy-app` (`origin`).

## Mappstruktur

```
src/
  app/
    (marketing)/        Publika sidor, delad nav+footer-layout
      page.tsx           Startsida
      jamfor/            Jämförelsesida (produktsideliknande)
      om-oss/, jobb/, vanliga-fragor/, kontakt/, nyheter/, guider/
      villkor/, integritetspolicy/, cookies/    Juridiska sidor (LegalPage-mall)
    kom-igang/           Val: privatperson / företag
    login/               Simulerad BankID-inloggning
    onboarding/          mode="full": bara namn, sen rakt till /dashboard?intro=1.
                         mode="add": lägg-till-hubben (nås från Dashboard)
    dashboard/           Inloggad översikt (läser ?intro=1 server-side, se nedan)
    compare/[id]/        Jämförelseflöde per sak
    rekommendation/      Regelbaserad rekommendation baserat på allt man lagt in
    chat/, claim/, book/ Fråga Buddy, skadeanmälan, boka specialist
    profil/, installningar/
    api/address-search/  Server-route mot Geoapify
  components/
    marketing/           Nav, footer, StartCta, CategoryCta, FaqAccordion, LegalPage
    onboarding/           BoendeForm, TelekomForm, KreditkortForm, AutoFetchStep,
                           AddressField, shared UI (inkl. PillGroupWithOther)
    Dashboard.tsx, Onboarding.tsx, CompareFlow.tsx, RecommendationView.tsx,
    ChatScreen.tsx, ClaimFlow.tsx, BookSpecialist.tsx, ProfileMenu.tsx,
    ProfilePage.tsx, SettingsPage.tsx, BankIdLogin.tsx, TopBar.tsx, Logo.tsx,
    ProgressDots.tsx, Overlay.tsx (delad modal: introduktion + samlingsrabatt-popup)
  lib/
    items.ts             Datamodellen för allt man kan lägga in (se nedan)
    item-quotes.ts        Jämförelsemotor (bara för de 5 "gamla" kategorierna)
    quote.ts              Quote-typ + tillval för Boende/Bil-jämförelse
    policy-fetch.ts        Simulerad auto-hämtning av befintlig försäkring
    recommendation.ts      Regelbaserad logik bakom /rekommendation
    buddy-context.tsx     Global state (inloggning, profil, items, tecknade avtal)
    address-lookup.ts, vehicle-lookup.ts   Uppslagsfunktioner (en riktig, en simulerad)
    insurance.ts, faq.ts, guides.ts, news.ts, jobs.ts, top-list.ts, booking.ts,
    chat.ts, claim.ts, types.ts             Statiskt/fiktivt innehåll + smådomäner
public/
  founder.jpg            Riktigt foto av grundaren (Gledis Bara)
  images/hero-home.jpg    Riktigt foto, startsidans hero (Pexels, fri licens)
  images/hero-compare.jpg Riktigt foto, /jamfor-hero (Pexels, fri licens)
```

## Datamodellen (`src/lib/items.ts`)

Allt en användare lägger in är ett `InsuranceItem` — en diskriminerad union över nio
`kind`-värden (`boende`, `bil`, `ovrigt_fordon`, `person`, `djur`, `telekom`,
`kreditkort`, `el`, `prenumeration`), med typspecifika fält per kategori (t.ex. Boende
grenar vidare på `typ` i fem bostadsformer). Centrala byggstenar:

- **`ITEM_CATEGORIES`** — lista över alla nio kategorier med etikett + ikon, driver
  onboarding-hubben och dashboard-korten.
- **`ITEM_GROUPS`** — de tre grupperna (Försäkring/Telekom & prenumerationer/Ekonomi)
  med vilka `kind`-värden som hör till varje grupp. Delas mellan `/jamfor` och Dashboard.
- **`ComparableItem` / `isComparableItem()`** — åtta av nio kategorier
  (boende/bil/ovrigt_fordon/person/djur/telekom/kreditkort/el) har en fungerande
  jämförelsemotor (`item-quotes.ts`) och typas separat, så TypeScript håller
  `computeItemQuotes` exhaustive. Bara **prenumeration** är kvar som ren
  datainsamling — en öppen samlingskategori utan naturliga "alternativ" att
  jämföra mot.
- **`itemTitle()` / `itemSummary()`** — formaterar valfritt item till en rubrik +
  sammanfattningsrad, används överallt items listas (Dashboard, onboarding-hub).

## Funktioner byggda hittills

### Marknadsföringssajt (route group `(marketing)`)
Gemensam nav (`MarketingNav`) + footer på alla publika sidor. Nav och footer visar
inloggningsstatus (profil-dropdown om inloggad, "Logga in"-knapp annars) — man kan
alltså vara inloggad och ändå bläddra på startsidan/andra publika sidor utan att bli
utloggad. Sidor: Startsida, **/jamfor** (se eget avsnitt), Om oss (med riktigt
grundarporträtt + bio), Jobb, Vanliga frågor, Kontakt, Nyheter (lista + detaljsida),
Guider (lista + detaljsida), samt Villkor/Integritetspolicy/Cookies via en delad
`LegalPage`-mall.

**Startsidan** är byggd i "etablerad portal"-stil (Compricer-liknande densitet):
hero i två kolumner (text + riktigt vardagsrumsfoto), fyra funktionskort, en
fiktiv topplista över "bolag", en nyheter/aktuellt-sektion, en sektion med
grundarens porträtt + citat ("Från vår specialist"), en guider-teaser, ett
"Så funkar det"-stegblock, inline FAQ, och en avslutande CTA.

**/jamfor** gjordes om från en enkel kategori-lista till en produktsideliknande
jämförelsetjänst: hero i två kolumner (text + riktigt foto) med fiktiva
förtroendesiffror, en fördelsrad (gratis/ingen bindningstid/personlig hjälp/allt
samlat), egna "så funkar det"-steg, tre produktsektioner (en per `ITEM_GROUPS`-grupp)
med en illustrerad ikon-visual och kategori-kort, samt ett testimonial-avsnitt.
Varje kategori-kort har en egen CTA (`CategoryCta`) som hoppar rakt in i rätt
onboarding-formulär om man är inloggad (`/onboarding?mode=add&kind=X`), annars till
`/kom-igang`.

### Inloggning
`/kom-igang` → privatperson/företag → `/login` → **simulerad** BankID (`BankIdLogin.tsx`,
inget riktigt BankID-API). Efter inloggning sätts `userType` i `BuddyProvider`.

### Onboarding / lägg till en sak (`Onboarding.tsx`)
Två lägen: `mode="full"` (första gången — bara ett namn-steg, sen direkt till
`/dashboard?intro=1`, se Dashboard nedan) och `mode="add"` (lägg-till-hubben, nås
från Dashboard). Hub:en visar alla nio kategorier som kort; att klicka på en öppnar
dess formulär (`activeCategory`-state). Stöder deep-link via `?kind=X` (satt av
`CategoryCta` och Dashboardens gruppvy) som hoppar direkt till ett formulär och
hoppar över hub-gridden. (Prioritetsfrågan som tidigare kom efter hubben är
borttagen — `profile.priority` är numera alltid `null` för nya användare.)

Varje kategori har ett eget formulär anpassat efter vad den faktiskt behöver veta
(t.ex. Boende frågar helt olika saker för hyresrätt vs. villa vs. magasinering; Bil
har regnr-autofyllning; Kreditkort grenar på "har du redan ett kort?"). Telekom-,
kreditkort-, el- och prenumerationsfälten (operatör/utgivare/elbolag/leverantör)
använder `PillGroupWithOther` — en lista med vanliga svenska alternativ plus ett
"Annat"-läge som faller tillbaka på fritext.

**Auto-hämtning för Försäkring**: för de fem jämförbara kategorierna (boende/bil/
övrigt fordon/person/djur) visas först ett val — "Hämta automatiskt från mitt bolag"
eller "Fyll i själv". Auto-hämtning (`AutoFetchStep.tsx`) låter kunden välja bolag ur
en rullista med 18 **riktiga** svenska försäkringsbolag (`FORSAKRINGSBOLAG` i
`items.ts` — Folksam, If, Trygg-Hansa, Länsförsäkringar m.fl., inga fiktiva namn och
inget påhittat betyg), identifiera sig med en simulerad BankID-signering, och Buddy
syntetiserar åt en (`lib/policy-fetch.ts`) en trovärdig post **plus** pris,
självrisk, typ av omfattning och ett framtida förfallodatum. Detta markeras som
`source: "fetched"` på `Quote` — **inte** samma sak som en riktig jämförelse (se
Dashboard nedan för hur det skiljs åt i UI:t). Har kunden lagt in fler än 3
försäkringar i samma session visas en popup ("Boka in samtal — samlingsrabatter kan
sänka priset ytterligare", länk till `/book`), en gång per session. Bytpunkt för en
riktig öppen-försäkring-API senare: allt går via `fetchExistingPolicy()`.

### Dashboard / översikt (`Dashboard.tsx`)
Visar tre gruppkort (Försäkring / Telekom & prenumerationer / Ekonomi) med antal
tillagda saker och jämförelsestatus. Man klickar sig **in i en grupp** för att se/lägga
till just den gruppens saker — andra gruppers kategorier läcker inte in. Den
generella "+ Lägg till en sak"-knappen (öppnar hela hubben) visas bara i toppvyn,
inte inuti en drilled-in grupp.

Varje jämförbart item-kort visar ett av tre lägen: **tecknad genom en riktig
jämförelse** (`policies[id].source === "compared"`, sätts av `CompareFlow.handleSign`
— "Tecknad hos X — Y kr/mån", räknas i "X av Y jämförda"), **auto-hämtad men inte
jämförd** (`source === "fetched"` — visar bolag/pris/omfattning/förfallodatum, men
säger aldrig "jämfört" och räknas **inte** i "jämförda"-summan, eftersom bara priset
hämtats in, inte jämförts mot alternativ), eller **helt ojämförd**. Icke-jämförbara
kategorier visar "Sparad — jämförelse kommer snart". Tips-rutan längst ner länkar
till `/rekommendation` ("Se din rekommendation") när minst en sak är tillagd.

Första gången man landar här efter onboarding (`?intro=1`, läst server-side i
`app/dashboard/page.tsx` och skickat ner som `showIntro`-prop — inte via en
klient-effekt, för att undvika en onödig `useState`+`useEffect`-omväg för något som
redan är känt vid sidladdning) visas en kort `Overlay`-introduktion om hur sidan
fungerar.

### Jämförelseflöde (`CompareFlow.tsx`, `/compare/[id]`)
Bara för `ComparableItem`-kategorierna (åtta av nio, se ovan). Visar tillval
(t.ex. cykel/reseskydd för Boende, hyrbil/glasskydd för Bil — bara för
boende/bil, övriga kategorier hoppar rakt till resultatet), räknar fram fiktiva
offerter via `item-quotes.ts`, och låter användaren "teckna" en offert
(`handleSign` sätter `source: "compared"` och sparar i `policies` i context).

Telekom och kreditkort har redan ett pris/årsavgift kunden själv angett, så
deras tre fiktiva alternativ (Klarnät/Fiberpunkt/Sambandet respektive
Klarkort/Kontokraft/Guldkortet) räknas fram som procentandelar av det priset
istället för från grunden som boende/bil gör. El saknar ett prisfält i
datamodellen, så där (Klarström/Kraftpunkt/Voltec) räknas ett baspris fram
från årsförbrukningen. Självrisk är ett rent försäkringsbegrepp och är valfri
på `Quote` — visas bara för de kategorier där den är meningsfull.

### Rekommendation (`RecommendationView.tsx`, `/rekommendation`)
Tittar på **allt** kunden lagt in (alla grupper, inte bara jämförbara saker) och ger
regelbaserade rader via `lib/recommendation.ts` — t.ex. dyr mobilplan, hög
kortårsavgift, fast elpris, eller en jämförbar sak som inte jämförts än (med
direktlänk till `/compare/[id]`). Räknar också fram en illustrativ "uppskattad
besparing", tydligt märkt som exempel. Samma regelbaserade-istället-för-AI-ansats
som `item-quotes.ts`. Två avslutande vägval: boka ett samtal eller gå tillbaka till
översikten — den koppling mellan Dashboard/Compare/Book som var poängen med hela
detta byggsteg.

### Chat, skadeanmälan, boka specialist
`/chat`, `/claim`, `/book` — alla med **kanned/simulerade** svar (`lib/chat.ts`,
`lib/claim.ts`, `lib/booking.ts`), ingen riktig AI eller backend bakom.
`/book` (`BookSpecialist.tsx`) har ett första steg där kunden kryssar i vilka av
sina saker samtalet gäller (eller "Övrigt"/"Total helhetslösning") plus fritext —
sammanfattas på bekräftelsesteget.

### Profil & inställningar
Profil-dropdown (`ProfileMenu.tsx`) i övre högra hörnet: Min översikt, Min profil
(redigerbar direkt), Inställningar, Hjälp & Support, Logga ut. Utloggning görs med en
hård navigation (`window.location.href = "/"`) för att undvika en race condition mot
sidans egna inloggningsvakt (se Kända begränsningar / lösta buggar).

### Externa integrationer
- **Geoapify** (adressökning): riktig, skarp integration via `/api/address-search`,
  nyckel i `.env.local` (`GEOAPIFY_API_KEY`), fri nivå.
- **Fordonsuppslagning**: fortfarande **simulerad** (`lib/vehicle-lookup.ts`) — en
  liten inbyggd lista + deterministisk fallback. Bytpunkt är redan förberedd
  (samma funktionssignatur), men ingen riktig biluppgifts-API är kopplad in än.

### Visuell identitet / bilder
Ett riktigt foto av grundaren (`public/founder.jpg`) används i Om oss och på
startsidans specialist-sektion. Två livsstilsfoton (`public/images/hero-home.jpg`,
`public/images/hero-compare.jpg`), fria att använda kommersiellt (Pexels-licens),
används i hero-sektionerna på startsidan och /jamfor för att ge en varmare känsla.

## Kända begränsningar / medvetna avgränsningar

- **Ingen persistens.** Allt state ligger i React Context och nollställs vid
  hård omladdning. Störst enskild lucka mellan prototyp och skarp produkt.
- **Ingen jämförelsemotor för Prenumeration** (Övriga abonnemang) — enda kvarvarande
  kategorin som bara samlar in data, eftersom det är en öppen samlingskategori utan
  naturliga alternativ att jämföra mot. De övriga åtta kategorierna har alla en
  fungerande (fiktiv) jämförelse nu.
- **BankID är simulerat**, inget riktigt e-legitimationsflöde — gäller både
  inloggningen och auto-hämtningen av befintlig försäkring.
- **Auto-hämtning av försäkring är helt simulerad** (`lib/policy-fetch.ts`) —
  ingen riktig öppen-försäkring-API. Bolagen i listan är riktiga (`FORSAKRINGSBOLAG`),
  men datan som "hämtas" (pris, självrisk, omfattning, förfallodatum) är syntetiserad,
  inte kundens faktiska försäkring — därför visas den aldrig som "jämförd" i UI:t,
  bara som "sparad".
- **Fordonsuppslagning är simulerad**, ingen riktig biluppgifts-API.
- **Chat/skadeanmälan/boka möte har kanned svar**, ingen AI eller riktig bokning.
- All statistik, alla omdömen/testimonials och topplistan är **fiktiv exempeldata**,
  tydligt markerad i UI:t där den förekommer.

## Utvecklingsområden (senast diskuterade, 2026-08-01)

Nyligen klart: städning av onboarding-resan (rakt till översikten, introduktions-
popup, 18 riktiga bolag i auto-hämtningen, samlingsrabatt-popup, tydlig "auto-hämtad"
vs "jämförd"-åtskillnad), och en riktig jämförelsemotor för Telekom/Kreditkort/El
(samma mönster som de fem ursprungliga kategorierna — tre fiktiva alternativ,
procentuell prissättning mot kundens angivna pris, valfri självrisk på `Quote`).

Kvarstående, ungefärlig prioritetsordning:

1. **Riktig auto-hämtning eller riktig fordonsuppslagning** — två separata simulerade
   flöden (`policy-fetch.ts`, `vehicle-lookup.ts`) som båda är förberedda för att byta
   ut mot en riktig extern API, om/när en lämplig sådan hittas.
2. **Bilder & varmare känsla, fortsättning** — hero-bilder finns på startsida och
   /jamfor; kvar: eventuellt fler bilder (Om oss, dashboard), fler äkta
   förtroendesignaler (riktiga omdömen, partner-logotyper) i stället för fiktiv
   exempeldata.
3. **Genomgång av chat/skadeanmälan** — `/book` fick nyss djupare logik (vad
   samtalet gäller); chat och skadeanmälan har fortfarande bara kanned svar.
4. **Persistens (databas)** — den stora tekniska frågan i bakgrunden. Supabase-projekt
   `buddy` finns kopplat men är inte satt upp — bedömdes tidigare "inte värt det än"
   eftersom det inte fanns något riktigt att spara. Blir mer motiverat ju mer skarpt
   produkten känns efter punkterna ovan.
5. Mindre: SEO/metadata per sida, tillgänglighetsgenomgång, mobilgenomgång.

## Git-historik

Fullständig historik i `git log`. De 22 första commiten (till och med
`02c02af Add a full marketing site alongside the app`) byggde grundstommen:
projektuppsättning, design-tokens, BankID-inloggning, item-baserad onboarding
(boende/bil/övrigt fordon/person/djur), jämförelseflöde, chat/skadeanmälan/boka-flöden,
och hela den publika marknadsföringssajten. Därefter (nyare commits, se `git log`
för exakta hashar):

- Koppla in riktig adressökning (Geoapify), lägga till profil-dropdown, koppla
  om jämförelseflödet mot den nya item-modellen.
- Göra startsidan mer etablerad/professionell (grundarporträtt, Compricer-stil).
- Bredda datamodellen till nio kategorier i tre grupper, gruppera Dashboard-
  översikten, göra om /jamfor till en produktsida, fixa en kategori-läckage-bugg
  i Dashboardens gruppvy, och lägga till riktiga hero-bilder.
- Koppla ihop flödet: kataloger istället för fritext i Telekom/Ekonomi-formulären,
  simulerad auto-hämtning av befintlig försäkring (bolag + BankID → syntetiserad
  post + tecknad offert), en ny regelbaserad `/rekommendation`-sida länkad från
  Dashboard, och ett bokningsformulär som frågar vad samtalet gäller.
- Städa onboarding-resan efter en detaljerad kundresegenomgång: hoppa över
  lägg-till-hubben och prioritetsfrågan efter namn-steget (rakt till översikten),
  en introduktions-popup på översikten första gången, bolagslistan i auto-hämtningen
  byttes från tre fiktiva till 18 riktiga svenska försäkringsbolag med rikare
  syntetiserad data (förfallodatum, omfattning), en samlingsrabatt-popup efter fler
  än 3 försäkringar, och en tydlig åtskillnad i Dashboard mellan "auto-hämtad" och
  "faktiskt jämförd" så ingen påstås vara jämförd förrän den faktiskt är det.
- Riktig jämförelsemotor för Telekom, Kreditkort och El (`b2fc208`): breddade
  `ComparableItem` till åtta av nio kategorier, nya offert-funktioner i
  `item-quotes.ts` med tre fiktiva bolag per kategori (Klarnät/Fiberpunkt/
  Sambandet, Klarkort/Kontokraft/Guldkortet, Klarström/Kraftpunkt/Voltec),
  procentuell prissättning mot kundens angivna pris för telekom/kreditkort och
  en förbrukningsbaserad baseline för el, `Quote.selfRisk` gjordes valfri, och
  en bugg i `recommendation.ts` fixades så auto-hämtade-men-ojämförda
  försäkringar korrekt flaggas som "inte jämförd än".

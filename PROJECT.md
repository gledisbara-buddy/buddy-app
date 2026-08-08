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

Produkten har en **riktig backend** (Supabase, se nedan) sedan senaste etappen, men
allt jämförelseinnehåll — bolagsnamn, priser, betyg, villkor — är fortfarande fiktivt
och tydligt markerat som exempeldata där det förekommer (topplistan, testimonials,
förtroendesiffror på /jamfor, jämförelsemotorn).

## Snabbstart

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

- Node hanteras via **nvm** på den här maskinen (ingen Homebrew/sudo tillgängligt) —
  kör `source ~/.nvm/nvm.sh` i ett nytt skal innan `npm`/`npx` om de inte hittas.
- Kräver tre nycklar i `.env.local` (kopiera `.env.local.example`):
  - `GEOAPIFY_API_KEY` — adressökning i Boende-formuläret. Utan den fungerar allt
    annat, men adressfältet returnerar inga träffar.
  - `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY` — krävs för att
    logga in eller spara något alls. Utan dem kraschar `createClient()` direkt.
- **Läs `AGENTS.md` innan du kodar** — Next.js 16 här har brytande ändringar mot
  standardkunskap, dokumentationen finns i `node_modules/next/dist/docs/`.

## Teknikstack

- **Next.js 16.2.12** (App Router, Turbopack) + **React 19** + **TypeScript**.
- **Tailwind CSS v4**, CSS-first config via `@theme inline` i `src/app/globals.css`
  (ingen `tailwind.config.js`). Designtokens ("Morgonljus"-paletten): `--color-ink`
  (mjuk marinblå text, aldrig svart), `--color-ink-deep` (djupare marinblå, hjälte-
  kort/rekommendationskort), `--color-frost`/`--color-frost-2` (ljusa blågrå
  bakgrunder), `--color-forest`/`--color-forest-light` (himmelsblå primäraccent —
  namnet är kvar från en tidigare grön palett), `--color-amber`/`--color-amber-deep`
  (honungsgul sekundär-/semantisk accent), `--color-slate` (sekundär text). Ett
  typsnitt (Inter) för både rubriker och brödtext — Fraunces (serif) användes
  tidigare men togs bort i omdesignen. IBM Plex Mono för `.bd-eyebrow`-etiketter.
- **lucide-react** för alla ikoner.
- **Supabase** — riktig backend sedan persistens-etappen:
  - **Auth**: e-post + lösenord (`@supabase/ssr`s `createBrowserClient`, se
    `src/lib/supabase/client.ts`). Ingen server-klient/middleware behövs — appen är
    helt klientdriven, ingen sida beror på inloggning vid server-rendering.
  - **Databas**: tre tabeller (`profiles`, `items`, `policies`), alla med Row Level
    Security så en användare bara kan se/ändra sin egen data. Schema + policies +
    en trigger som auto-skapar en `profiles`-rad vid registrering ligger i
    `supabase/schema.sql` — måste köras manuellt i Supabase SQL Editor, är inte
    kopplat till någon migrations-pipeline.
  - `BuddyProvider` (`src/lib/buddy-context.tsx`) speglar sessionen och all data
    till/från Supabase istället för att bara hålla React-state. Alla ~15
    komponenter som använder `useBuddy()` är opåverkade — de läser samma
    `Profile`/`InsuranceItem[]`/`Record<string, Quote>`-former som förut.
- Inget annat backend-API förutom `/api/address-search` (proxy mot Geoapify, håller
  API-nyckeln server-side).
- Repo: `github.com/gledisbara-buddy/buddy-app` (`origin`). Live på Vercel
  (auto-deploy vid push till `main`), publik på `www.minbuddy.se` (apex
  `minbuddy.se` redirectar dit). `buddy-app-iota.vercel.app` fungerar
  fortfarande men är inte längre den kanoniska adressen.

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
    login/               Riktig inloggning (e-post + lösenord via Supabase)
    aterstall-losenord/  Glömt lösenord: begär länk + sätt nytt lösenord
    onboarding/          mode="full": bara namn, sen rakt till /dashboard?intro=1.
                         mode="add": lägg-till-hubben (nås från Dashboard)
    dashboard/           Inloggad översikt (läser ?intro=1 server-side, se nedan)
    compare/[id]/        Jämförelseflöde per sak
    rekommendation/      Regelbaserad rekommendation baserat på allt man lagt in
    halsokoll/           På-begäran-rapport: jämförda/ojämförda, besparingspotential,
                         saknade kategorier
    livshandelser/       Guidade checklistor (flytt / väntar barn) + sysselsättningstips
    varva-en-van/        Simulerat referralprogram
    chat/, claim/, book/ Fråga Buddy, skadeanmälan, boka specialist
    profil/, installningar/
    api/address-search/  Server-route mot Geoapify
  components/
    marketing/           Nav, footer, StartCta, CategoryCta, FaqAccordion, LegalPage
    onboarding/           BoendeForm, TelekomForm, KreditkortForm, AutoFetchStep,
                           AddressField, shared UI (inkl. PillGroupWithOther)
    Dashboard.tsx, Onboarding.tsx, CompareFlow.tsx, RecommendationView.tsx,
    HealthCheckView.tsx, LifeEventsView.tsx, ReferralView.tsx,
    ChatScreen.tsx, ClaimFlow.tsx, BookSpecialist.tsx, ProfileMenu.tsx,
    ProfilePage.tsx, SettingsPage.tsx, AuthForm.tsx, ResetPasswordView.tsx,
    TopBar.tsx, Logo.tsx, ProgressDots.tsx,
    Overlay.tsx (delad modal: introduktion + samlingsrabatt-popup)
  lib/
    items.ts             Datamodellen för allt man kan lägga in (se nedan)
    item-quotes.ts        Jämförelsemotor, fyra fiktiva bolag per kategori
    quote.ts              Quote-typ (inkl. avancerade avtalsfält) + pickWinner()
    needs.ts              Behovsanalys-frågebatterier för alla åtta jämförbara kategorier
    policy-fetch.ts        Simulerad auto-hämtning av befintlig försäkring
    recommendation.ts      Regelbaserad logik bakom /rekommendation
    health-check.ts        Aggregerad statistik bakom /halsokoll
    life-events.ts         Checklistor + sysselsättningstips bakom /livshandelser
    dates.ts               Datumparsing för förfallodag-påminnelser
    buddy-context.tsx     Global state (auth, profil, items, tecknade avtal) — Supabase-speglat
    supabase/client.ts     Supabase browser-klient
    address-lookup.ts, vehicle-lookup.ts   Uppslagsfunktioner (en riktig, en simulerad)
    insurance.ts, faq.ts, guides.ts, news.ts, jobs.ts, top-list.ts, booking.ts,
    chat.ts, claim.ts, types.ts             Statiskt/fiktivt innehåll + smådomäner
supabase/
  schema.sql             Tabeller + RLS-policies + auto-profil-trigger (körs manuellt)
public/
  images/founder.jpg     Riktigt foto av grundaren (Gledis Bara)
  images/hero-couple.jpg Riktigt foto, startsidans hero
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
- **`ComparableItem` / `isComparableItem()` / `COMPARABLE_KINDS`** — åtta av nio
  kategorier (boende/bil/ovrigt_fordon/person/djur/telekom/kreditkort/el) har en
  fungerande jämförelsemotor (`item-quotes.ts`), en behovsanalys (`needs.ts`) och
  typas separat, så TypeScript håller `computeItemQuotes` exhaustive. Bara
  **prenumeration** är kvar som ren datainsamling — en öppen samlingskategori utan
  naturliga "alternativ" att jämföra mot (medvetet avgränsat, upprepade gånger
  bekräftat).
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
hero i två kolumner (text + riktigt parfoto), fyra funktionskort, en fiktiv
topplista över "bolag", en nyheter/aktuellt-sektion, en sektion med grundarens
porträtt + citat ("Från vår specialist"), en guider-teaser, ett "Så funkar
det"-stegblock (steg 1 är numera "Skapa ett konto", inte BankID), inline FAQ, och
en avslutande CTA.

**/jamfor** är en produktsideliknande jämförelsetjänst: hero i två kolumner (text +
riktigt foto) med fiktiva förtroendesiffror, en fördelsrad (gratis/ingen
bindningstid/personlig hjälp/allt samlat), egna "så funkar det"-steg, tre
produktsektioner (en per `ITEM_GROUPS`-grupp) med en illustrerad ikon-visual och
kategori-kort, samt ett testimonial-avsnitt. Varje kategori-kort har en egen CTA
(`CategoryCta`) som hoppar rakt in i rätt onboarding-formulär om man är inloggad
(`/onboarding?mode=add&kind=X`), annars till `/kom-igang`.

### Inloggning & persistens
`/kom-igang` → privatperson/företag → `/login` → **riktig** inloggning med e-post
och lösenord via Supabase Auth (`AuthForm.tsx`, ersatte en tidigare simulerad
BankID-flow). Två lägen på samma komponent: "Skapa konto" (registrering, skickar
`user_type` som user-metadata så databastriggern sätter rätt värde direkt) och
"Logga in". Glömt lösenord hanteras av `ResetPasswordView.tsx`/`/aterstall-losenord`
(begär länk → sätter nytt lösenord, styrs av Supabase-eventet `PASSWORD_RECOVERY`).

`BuddyProvider` lyssnar på Supabase-sessionen (`onAuthStateChange`) och har en
`loading`-flagga som täcker den korta stunden innan sessionen är kontrollerad —
guardade sidor väntar med att redirecta till `/kom-igang` tills dess. Bara ett
genuint `SIGNED_IN`-event (färsk in-/registrering) triggar en full omladdning av
profil/items/policies — inte `TOKEN_REFRESHED`, som annars skulle få guardade sidor
att blinka till om vart 50:e minut.

Alla mutationer (`addItem`, `removeItem`, `setPolicy`, `updateProfile`,
`setReadyToCompare`) uppdaterar lokalt state direkt (för snabb UI-respons) och
skriver samtidigt igenom till Supabase. `removeItem` är en riktig databas-radering.

**Not:** `AutoFetchStep.tsx`s BankID-simulering (för att "hämta befintlig
försäkring från ditt bolag") är en separat, kosmetisk grej och rör inte
kontoinloggningen — den är fortfarande simulerad, se avsnittet om auto-hämtning
nedan.

### Onboarding / lägg till en sak (`Onboarding.tsx`)
Två lägen: `mode="full"` (första gången — bara ett namn-steg, sen direkt till
`/dashboard?intro=1`, se Dashboard nedan) och `mode="add"` (lägg-till-hubben, nås
från Dashboard). Hub:en visar alla nio kategorier som kort; att klicka på en öppnar
dess formulär (`activeCategory`-state). Stöder deep-link via `?kind=X` (satt av
`CategoryCta`, Dashboardens gruppvy och `HealthCheckView`/`LifeEventsView`s
förslagsknappar) som hoppar direkt till ett formulär och hoppar över hub-gridden.
Toast-notis ("X inlagd") visas i hub-läget varje gång något läggs till, istället
för att skicka användaren till kategori-väljaren igen.

Varje kategori har ett eget formulär anpassat efter vad den faktiskt behöver veta
(t.ex. Boende frågar helt olika saker för hyresrätt vs. villa vs. magasinering; Bil
har regnr-autofyllning; Kreditkort grenar på "har du redan ett kort?"; Telekom visar
uppskattad nätverkstäckning när man väljer en känd mobiloperatör). Telekom-,
kreditkort-, el- och prenumerationsfälten (operatör/utgivare/elbolag/leverantör)
använder `PillGroupWithOther` — en lista med vanliga svenska alternativ plus ett
"Annat"-läge som faller tillbaka på fritext.

**Auto-hämtning för Försäkring**: för de fem jämförbara kategorierna (boende/bil/
övrigt fordon/person/djur) visas först ett val — "Hämta automatiskt från mitt bolag"
eller "Fyll i själv". Auto-hämtning (`AutoFetchStep.tsx`) låter kunden välja bolag ur
en rullista med 18 **riktiga** svenska försäkringsbolag (`FORSAKRINGSBOLAG` i
`items.ts`), identifiera sig med en simulerad BankID-signering, och Buddy
syntetiserar åt en (`lib/policy-fetch.ts`) en trovärdig post plus pris, självrisk,
omfattning, förfallodatum **och avtalsdetaljer** (karenstid/ersättningstak/
bindningstid/uppsägningstid/undantag, för det avancerade jämförelseläget). Detta
markeras som `source: "fetched"` på `Quote` — inte samma sak som en riktig
jämförelse. Fler än 3 försäkringar i samma session ger en samlingsrabatt-popup, en
gång per session.

### Dashboard / översikt (`Dashboard.tsx`)
Två faser, styrda av `readyToCompare` (persisteras numera i `profiles`): en
"lägg-in"-fas (banner uppmanar att klicka "Klar? Nu jämför vi allt" när man är
redo) och en jämför-fas. Tre gruppkort (Försäkring / Telekom & prenumerationer /
Ekonomi) med antal tillagda saker och jämförelsestatus. Man klickar sig in i en
grupp för att se/lägga till just den gruppens saker; flera saker per kategori
stöds i alla nio kategorier.

En konsoliderad **"Mer att göra"**-sektion (kompakta rader, inte separata kort)
samlar: kommande förfallodatum (från auto-hämtade offerter, badge om ≤30 dagar),
länk till Årlig hälsokoll, de två livshändelse-checklistorna (flytt/barn), och
Värva en vän — allt på en gång istället för utspritt över flera fulla kort (en
medveten städning efter att fyra separata funktioner adderats en i taget).

Varje jämförbart item-kort visar ett av tre lägen: **tecknad genom en riktig
jämförelse** (`policies[id].source === "compared"`), **auto-hämtad men inte
jämförd** (`source === "fetched"`), eller **helt ojämförd**. Icke-jämförbara
kategorier visar "Sparad — jämförelse kommer snart".

Första gången man landar här efter onboarding (`?intro=1`) visas en kort
`Overlay`-introduktion om hur sidan fungerar.

### Jämförelseflöde (`CompareFlow.tsx`, `/compare/[id]`)
Bara för `ComparableItem`-kategorierna (åtta av nio). Föregås av en behovsanalys
(`NeedsAnalysis.tsx`, `lib/needs.ts`) för alla åtta kategorier — antingen fritext
(tolkas mot nyckelord) eller 5 korta ja/nej- eller flervalsfrågor — som påverkar
priset i `item-quotes.ts`.

**Försäkring-gruppen** (fem kategorier) får en tre-kolumnsvy: Din nuvarande
(auto-hämtad, med CTA att hämta om tom), Billigast, och Vår rekommendation
(`pickWinner()` — normaliserat pris+betyg, inte bara billigast). Fyra fiktiva
bolag per kategori (Klarsäker/Hemgrund/Nordvakt/**Björnskydd**, det sistnämnda
helt digitalt och billigast men med högst självrisk och lägst ersättningstak). En
Enkel/Avancerat-växlare styr om avtalsdetaljer (karenstid, ersättningstak,
bindningstid, uppsägningstid, undantag) visas. En expanderbar fullständig
jämförelsetabell under korten visar alla fyra bolag samtidigt.

**Telekom/Kreditkort/El** har fortfarande hjältekort + "Andra alternativ"-lista
(inte tabellen ovan), nu också med fyra fiktiva bolag vardera (Klarnät/Fiberpunkt/
Sambandet/**Surfpunkt**, Klarkort/Kontokraft/Guldkortet/**Silverkortet**,
Klarström/Kraftpunkt/Voltec/**Solkraft**). El-kategorin visar dessutom ett infokort
om bästa tid att använda el (olika text för rörligt/mix vs. fast avtal).
`handleSign` sätter `source: "compared"` och sparar i `policies`.

### Rekommendation (`RecommendationView.tsx`, `/rekommendation`)
Tittar på allt kunden lagt in och ger regelbaserade rader via `lib/recommendation.ts`
— t.ex. en jämförbar sak som inte jämförts än, med direktlänk till `/compare/[id]`.
Räknar också fram en illustrativ "uppskattad besparing", tydligt märkt som exempel.

### Bevakning (förfallodag-påminnelser + Årlig hälsokoll)
Förfallodag-raderna i Dashboardens "Mer att göra" (se ovan) — bara auto-hämtade
offerter har ett förfallodatum, så bara de kan påminna om förnyelse.

**Årlig hälsokoll** (`HealthCheckView.tsx`, `/halsokoll`) är en on-demand-rapport
(inte tidsstyrd — appen har ingen bakgrundsklocka): antal saker/jämförda,
uppskattad total månadskostnad, uppskattad besparingspotential (fetched-pris minus
billigaste offert för ojämförda saker), och en lista på saknade kategorier med
snabbknapp till rätt onboarding-formulär. Explicit **inte** byggd: prisvarningar
(price-change alerts) — avvisat av kunden.

### Livshändelser (`LifeEventsView.tsx`, `/livshandelser`)
Guidade checklistor för "Jag ska flytta" och "Vi väntar barn" (`lib/life-events.ts`)
— varje steg är en rad text plus en valfri CTA-knapp till ett befintligt
lägg-till/jämför-flöde. Medvetet **inte** en automatiserad flerstegswizard som
redigerar saker åt användaren. Samma sida visar också sysselsättningsbaserade tips
(`getSysselsattningTips`) härledda från det redan insamlade `sysselsattning`-fältet
på `PersonItem` — generella, ärliga råd (t.ex. dubbelförsäkring via jobbet),
inga fiktiva bolagsnamn.

### Värva en vän (`ReferralView.tsx`, `/varva-en-van`)
Simulerat referralprogram: en per-session genererad kod (härledd från profilnamnet),
en kopiera-knapp, och en belöningstext (150 kr var i "Buddy-kredit"). Statistiken
visar ett **ärligt nolläge** (0 vänner, 0 kr — inget backend finns för att räkna
riktig aktivitet) plus en tydligt märkt räkneexempel, snarare än att hitta på en
falsk aktivitetshistorik om användaren. Ingångar: profilmenyn och ett kompakt kort
på Dashboard.

### Chat, skadeanmälan, boka specialist
`/chat`, `/claim`, `/book` — alla med **kanned/simulerade** svar (`lib/chat.ts`,
`lib/claim.ts`, `lib/booking.ts`), ingen riktig AI eller backend bakom.
`/book` (`BookSpecialist.tsx`) har ett första steg där kunden kryssar i vilka av
sina saker samtalet gäller (eller "Övrigt"/"Total helhetslösning") plus fritext —
sammanfattas på bekräftelsesteget.

### Profil & inställningar
Profil-dropdown (`ProfileMenu.tsx`) i övre högra hörnet: Min översikt, Min profil
(redigerbar direkt, sparas till `profiles`), Värva en vän, Inställningar, Hjälp &
Support, Logga ut. Utloggning görs med en hård navigation
(`window.location.href = "/"`) för att undvika en race condition mot sidans egna
inloggningsvakt.

### Externa integrationer
- **Supabase** (auth + databas): riktig, skarp integration, se Teknikstack ovan.
- **Geoapify** (adressökning): riktig, skarp integration via `/api/address-search`,
  nyckel i `.env.local` (`GEOAPIFY_API_KEY`), fri nivå.
- **Fordonsuppslagning**: fortfarande **simulerad** (`lib/vehicle-lookup.ts`) — en
  liten inbyggd lista + deterministisk fallback. Bytpunkt är redan förberedd
  (samma funktionssignatur), men ingen riktig biluppgifts-API är kopplad in än.

### Visuell identitet / bilder
"Morgonljus"-omdesignen (se Teknikstack) bytte hela färgpaletten och typsnittet.
Ett riktigt foto av grundaren (`public/images/founder.jpg`) används i Om oss och på
startsidans specialist-sektion. Ett parfoto (`public/images/hero-couple.jpg`)
används i startsidans hero för en varmare, mer personlig känsla.

## Kända begränsningar / medvetna avgränsningar

- **Ingen jämförelsemotor för Prenumeration** (Övriga abonnemang) — enda kvarvarande
  kategorin som bara samlar in data, eftersom det är en öppen samlingskategori utan
  naturliga alternativ att jämföra mot. Medvetet avgränsat, bekräftat flera gånger.
- **Auto-hämtning av försäkring är helt simulerad** (`lib/policy-fetch.ts`) —
  ingen riktig öppen-försäkring-API. Bolagen i listan är riktiga (`FORSAKRINGSBOLAG`),
  men datan som "hämtas" är syntetiserad. Identifieringssteget i det flödet är
  fortfarande en simulerad BankID-signering (separat från kontoinloggningen, som nu
  är riktig e-post/lösenord).
- **Fordonsuppslagning är simulerad**, ingen riktig biluppgifts-API.
- **Chat/skadeanmälan/boka möte har kanned svar**, ingen AI eller riktig bokning.
- All jämförelsedata (bolagsnamn, priser, betyg, avtalsvillkor) är **fiktiv
  exempeldata**, tydligt markerad i UI:t där den förekommer. Att sätta riktiga
  bolagsnamn på den fiktiva prissättningen skulle vara missvisande/en juridisk
  risk — diskuterat och avvisat.
- **`minbuddy.se`** är köpt men väntade senast på godkännande hos domänregistraren
  (One.com) innan den kan kopplas till Vercel-deployen.
- Ingen mobil- eller tillgänglighetsgenomgång har gjorts på hela sajten, bara
  enstaka sidor punktkollade under utveckling.

## Utvecklingsområden (senast diskuterade, 2026-08-08)

Nyligen klart: fjärde fiktiva bolaget per kategori + fullständig jämförelsetabell
för Försäkring-gruppen + El-tips + Telekom-täckning, förfallodag-påminnelser +
Årlig hälsokoll, Livshändelser-checklistor + sysselsättningstips, ett simulerat
referralprogram, en städning av Dashboard till en konsoliderad "Mer att göra"-
sektion, och — den stora — **riktig persistens och riktig inloggning** (Supabase,
e-post/lösenord istället för simulerad BankID).

Kvarstående, ungefärlig prioritetsordning:

1. **`minbuddy.se`-domänen** — koppla in när One.com har godkänt beställningen.
2. **Mobil- och tillgänglighetsgenomgång** av hela sajten (kontrast, fokusrutor,
   aria-labels på ikonknappar) — inget av det har granskats systematiskt än.
3. **Konsekvent jämförelsetabell för Telekom/Kreditkort/El** — de har nu fyra
   fiktiva bolag precis som Försäkring, men visas fortfarande i det äldre
   hjältekort+lista-mönstret istället för samma tabell.
4. **Riktig auto-hämtning eller riktig fordonsuppslagning** — två separata
   simulerade flöden (`policy-fetch.ts`, `vehicle-lookup.ts`), båda förberedda
   för att byta ut mot en riktig extern API.
5. **Riktiga bolagsnamn i jämförelsen** — skulle kräva riktig data (pris-API:er
   eller avtal med bolagen), inte bara ett namnbyte på den fiktiva datan. Ett
   separat och mycket större projekt än allt ovan.
6. Mindre: SEO/metadata per sida, jämförelsehistorik, exportera sammanställning.

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
  översikten, göra om /jamfor till en produktsida, och lägga till riktiga hero-bilder.
- Kataloger istället för fritext i Telekom/Ekonomi-formulären, simulerad
  auto-hämtning av befintlig försäkring, en regelbaserad `/rekommendation`-sida,
  och ett bokningsformulär som frågar vad samtalet gäller.
- Städa onboarding-resan: hoppa över lägg-till-hubben och prioritetsfrågan,
  introduktions-popup, 18 riktiga bolag i auto-hämtningen, samlingsrabatt-popup,
  tydlig "auto-hämtad" vs "jämförd"-åtskillnad.
- Riktig jämförelsemotor för Telekom, Kreditkort och El (`b2fc208`): breddade
  `ComparableItem` till åtta av nio kategorier, tre fiktiva bolag per kategori,
  `Quote.selfRisk` valfri.
- Tre-kolumnslayout för Försäkring-gruppens jämförelse (nuvarande/billigast/
  rekommendation, `pickWinner()`), stöd för flera saker per kategori, strikt
  två-fas-flöde (`readyToCompare`) med toast-notiser, behovsanalys för alla åtta
  jämförbara kategorier, Enkel/Avancerat-växlare med avtalsvillkor.
- "Morgonljus"-omdesign (ny färgpalett, Fraunces bort), riktiga hero-/grundarbilder.
- Fjärde fiktiva bolaget per kategori-familj, fullständig jämförelsetabell för
  Försäkring, El-tips, Telekom-nätverkstäckning.
- Förfallodag-påminnelser + Årlig hälsokoll, Livshändelser-checklistor +
  sysselsättningstips, simulerat referralprogram, Dashboard-städning ("Mer att göra").
- **Persistens**: Supabase-koppling (`profiles`/`items`/`policies`, RLS), riktig
  e-post/lösenord-inloggning som ersätter simulerad BankID, glömt lösenord-flöde.
  Verifierat end-to-end mot ett riktigt Supabase-projekt inklusive RLS-isolering
  mellan konton.

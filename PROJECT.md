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
    onboarding/          Namn → lägg-till-hub → prioritet (och mode=add-varianten)
    dashboard/           Inloggad översikt
    compare/[id]/        Jämförelseflöde per sak
    chat/, claim/, book/ Fråga Buddy, skadeanmälan, boka specialist
    profil/, installningar/
    api/address-search/  Server-route mot Geoapify
  components/
    marketing/           Nav, footer, StartCta, CategoryCta, FaqAccordion, LegalPage
    onboarding/           BoendeForm, TelekomForm, KreditkortForm, AddressField, shared UI
    Dashboard.tsx, Onboarding.tsx, CompareFlow.tsx, ChatScreen.tsx, ClaimFlow.tsx,
    BookSpecialist.tsx, ProfileMenu.tsx, ProfilePage.tsx, SettingsPage.tsx,
    BankIdLogin.tsx, TopBar.tsx, Logo.tsx, ProgressDots.tsx
  lib/
    items.ts             Datamodellen för allt man kan lägga in (se nedan)
    item-quotes.ts        Jämförelsemotor (bara för de 5 "gamla" kategorierna)
    quote.ts              Quote-typ + tillval för Boende/Bil-jämförelse
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
- **`ComparableItem` / `isComparableItem()`** — de fem ursprungliga kategorierna
  (boende/bil/ovrigt_fordon/person/djur) har en fungerande jämförelsemotor
  (`item-quotes.ts`) och typas separat, så TypeScript håller `computeItemQuotes`
  exhaustive. De fyra nya kategorierna (telekom/kreditkort/el/prenumeration) är
  **bara datainsamling** än så länge — se "Kända begränsningar" nedan.
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
Två lägen: `mode="full"` (första gången: namn → lägg-till-hub → valfri prioritetsfråga)
och `mode="add"` (bara lägg-till-hub, nås från Dashboard). Hub:en visar alla nio
kategorier som kort; att klicka på en öppnar dess formulär (`activeCategory`-state).
Stöder deep-link via `?kind=X` (satt av `CategoryCta` och Dashboardens gruppvy) som
hoppar direkt till ett formulär och hoppar över hub-gridden.

Varje kategori har ett eget formulär anpassat efter vad den faktiskt behöver veta
(t.ex. Boende frågar helt olika saker för hyresrätt vs. villa vs. magasinering; Bil
har regnr-autofyllning; Kreditkort grenar på "har du redan ett kort?").

### Dashboard / översikt (`Dashboard.tsx`)
Visar tre gruppkort (Försäkring / Telekom & prenumerationer / Ekonomi) med antal
tillagda saker och jämförelsestatus. Man klickar sig **in i en grupp** för att se/lägga
till just den gruppens saker — andra gruppers kategorier läcker inte in (fixat bug:
tidigare kunde "Lägg till"-kort inuti en grupp öppna den ogrupperade hubben med alla
nio kategorier). Den generella "+ Lägg till en sak"-knappen (öppnar hela hubben) visas
bara i toppvyn, inte inuti en drilled-in grupp. Varje item-kort visar
"Jämför nu"/"Tecknad hos X" för jämförbara kategorier, eller "Sparad — jämförelse
kommer snart" för de fyra nya.

### Jämförelseflöde (`CompareFlow.tsx`, `/compare/[id]`)
Bara för `ComparableItem`-kategorierna. Visar tillval (t.ex. cykel/reseskydd för
Boende, hyrbil/glasskydd för Bil), räknar fram fiktiva offerter via
`item-quotes.ts`, och låter användaren "teckna" en offert (sparas i
`policies` i context).

### Chat, skadeanmälan, boka specialist
`/chat`, `/claim`, `/book` — alla med **kanned/simulerade** svar (`lib/chat.ts`,
`lib/claim.ts`, `lib/booking.ts`), ingen riktig AI eller backend bakom.

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
- **Ingen jämförelsemotor för Telekom/Kreditkort/El/Prenumeration.** De fyra nya
  kategorierna samlar bara in data — `isComparableItem()` filtrerar bort dem från
  `/compare`-flödet med flit.
- **BankID är simulerat**, inget riktigt e-legitimationsflöde.
- **Fordonsuppslagning är simulerad**, ingen riktig biluppgifts-API.
- **Chat/skadeanmälan/boka möte har kanned svar**, ingen AI eller riktig bokning.
- All statistik, alla omdömen/testimonials och topplistan är **fiktiv exempeldata**,
  tydligt markerad i UI:t där den förekommer.

## Utvecklingsområden (senast diskuterade, 2026-08-01)

Prioritetsordning enligt senaste avstämningen — se commit-historiken för vad som
redan är klart:

1. **Bilder & varmare känsla** — påbörjat (hero-bilder på startsida + /jamfor).
   Kvar: eventuellt fler bilder (Om oss, dashboard), fler äkta förtroendesignaler
   (riktiga omdömen, partner-logotyper) i stället för fiktiv exempeldata.
2. **Jämförelsemotor för de fyra nya kategorierna** (telekom/kreditkort/el/
   prenumeration) — störst funktionell lucka mot löftet "vi visar var du kan spara".
3. **Riktig fordonsuppslagning** — byt ut `lib/vehicle-lookup.ts` mot en riktig
   biluppgifts-API när en gratis/lämplig sådan hittas.
4. **Genomgång av chat/skadeanmälan/boka möte** — bedöma om flödena behöver djupare
   verklig logik.
5. **Persistens (databas)** — den stora tekniska frågan i bakgrunden. Supabase-projekt
   `buddy` finns kopplat men är inte satt upp — bedömdes tidigare "inte värt det än"
   eftersom det inte fanns något riktigt att spara. Blir mer motiverat ju mer skarpt
   produkten känns efter punkt 1–4.
6. Mindre: SEO/metadata per sida, tillgänglighetsgenomgång, mobilgenomgång.

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

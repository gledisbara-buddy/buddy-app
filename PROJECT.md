# Buddy — projektöversikt

Det här dokumentet är den levande sammanfattningen av vad Buddy är och vad som är byggt.
Uppdatera det när nya funktioner läggs till eller större beslut tas — det ska alltid gå
att läsa den här filen och förstå var projektet står, utan att gräva i commit-historiken.

**Senast omskriven i sin helhet: 2026-08-30.** Föregående version var från 2026-08-08
och saknade 80+ commits — hela internverktyget, nästan hela 21-sektionsplanen för
kundresa v2, och en stor genomgång av jämförelsemotorn. Om något här känns inaktuellt,
lita på `git log` och koden, inte på det här dokumentet, och uppdatera det.

## Vad är Buddy?

Buddy är en digital assistent för att **lägga in, hålla koll på och jämföra allt man
betalar för löpande** — inte bara försäkring. Appen täcker nio kategorier i tre grupper
(Försäkring / Telekom & prenumerationer / Ekonomi), har en riktig backend (Supabase),
riktig e-post/lösenord-inloggning, ett fullständigt internt admin-verktyg för
Buddy-anställda, och ett stort antal "kundresa v2"-funktioner (hushåll, trygghetspoäng,
dokumentarkiv, GDPR-verktyg, årsrapport). All jämförelsedata (bolagsnamn, priser, betyg,
villkor) är fortfarande fiktiv och märkt som exempeldata där den förekommer.

**Investerardemo ~2026-09-08.** Prioritering fram till dess: demo-säkerhet och en
sammanhängande kundresa väger tyngre än långsiktig arkitektonisk fullständighet.

## Snabbstart

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

- Node hanteras via **nvm** på den här maskinen (ingen Homebrew/sudo tillgängligt) —
  kör `source ~/.nvm/nvm.sh` i ett nytt skal innan `npm`/`npx` om de inte hittas.
- Kräver nycklar i `.env.local` (kopiera `.env.local.example`):
  - `GEOAPIFY_API_KEY` — adressökning i Boende-formuläret.
  - `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY` — krävs för att
    logga in eller spara något alls.
  - `RESEND_API_KEY`/`RESEND_FROM_EMAIL` — riktiga transaktionsmejl (bekräftelsekod,
    spara-sammanfattning, bokningsbekräftelse).
- Supabase-projektet på gratisnivå kan gå in i viloläge efter långa uppehåll i
  utveckling — om `.env.local`:s URL plötsligt inte går att slå upp (DNS-fel), vänta
  några minuter och testa igen innan du antar att projektet är borta.
- **Läs `AGENTS.md` innan du kodar** — Next.js 16 här har brytande ändringar mot
  standardkunskap, dokumentationen finns i `node_modules/next/dist/docs/`.

## Teknikstack

- **Next.js 16.2.12** (App Router, Turbopack) + **React 19** + **TypeScript**.
- **Tailwind CSS v4**, CSS-first config via `@theme inline` i `src/app/globals.css`
  (ingen `tailwind.config.js`). Designtokens ("Morgonljus"-paletten): `--color-ink`,
  `--color-ink-deep`, `--color-frost`/`--color-frost-2`, `--color-forest`/
  `--color-forest-light` (himmelsblå primäraccent), `--color-amber`/`--color-amber-deep`,
  `--color-slate`. Inter för rubriker/brödtext, IBM Plex Mono för `.bd-eyebrow`.
- **lucide-react** för alla ikoner.
- **Supabase** — riktig backend, klientdriven (ingen server-klient/middleware):
  - **Auth**: e-post + lösenord + obligatorisk 6-siffrig e-postbekräftelse vid
    registrering (`AuthForm.tsx`). Glömt lösenord via `ResetPasswordView.tsx`.
  - **Databas**: 18 tabeller (se `supabase/schema.sql` — enda källan till schemat,
    **ingen migrations-pipeline**, varje ändring körs manuellt av Gledis i Supabase
    SQL Editor). Kärntabeller: `profiles`, `items`, `policies`, `employees`,
    `bookings`, `claims`. Kundresa v2: `households`, `household_requests`,
    `referral_events`, `missing_insurance_requests`, `account_deletion_requests`,
    `policy_history`, `fullmakt_history`. Internverktyget: `customer_notes`,
    `activity_log`, `case_comments`, `employee_login_log`, `customer_view_log`.
    Alla med Row Level Security.
  - `BuddyProvider` (`src/lib/buddy-context.tsx`) speglar sessionen och all data
    till/från Supabase.
- Server-routes: `/api/address-search` (Geoapify-proxy) och `/api/send-email`
  (Resend-proxy, fasta mallar — aldrig fritt innehåll från klienten).
- Repo: `github.com/gledisbara-buddy/buddy-app` (`origin`). Live på Vercel, publik på
  `www.minbuddy.se` (apex redirectar dit). `buddy-app-iota.vercel.app` fungerar
  fortfarande men är inte kanonisk.

## Mappstruktur

```
src/
  app/
    (marketing)/        Publika sidor, delad nav+footer-layout
    kom-igang/           Val: privatperson / företag
    login/                Riktig inloggning (e-post+lösenord+kod) via Supabase
    aterstall-losenord/   Glömt lösenord
    onboarding/           Lägg till/redigera en sak (alla nio kategorier)
    dashboard/            Inloggad översikt
    compare/[id]/         Jämförelseflöde per sak (fork → behov → resultat → teckna)
    objekt/[id]/          Detaljvy per sak (villkor, historik, kalenderpåminnelse, PDF)
    hushall/              Hushåll v2 (personnummer-baserad dubbel-consent)
    arkiv/                Dokumentarkiv (fullmakt + historik)
    arsrapport/           Årsrapport
    mina-arenden/         Kundens egna bokningar/skadeärenden
    identifiera-igen/     BankID-rescan (hitta nytecknade avtal sen sist)
    importera/            Multi-import (BankID-liknande, flera saker samtidigt)
    anslut-bank/          Simulerad bankkoppling för att hitta prenumerationer
    rekommendation/       Regelbaserad rekommendation
    halsokoll/             På-begäran-rapport
    livshandelser/         Guidade checklistor (flytt/väntar barn) + sysselsättningstips
    varva-en-van/          Referralprogram (riktig backend, riktig räkning)
    chat/, claim/, book/   Fråga Buddy, skadeanmälan, boka specialist (kanned/simulerat)
    profil/, installningar/
    internt/               Internverktyget (kräver rad i employees + MFA)
    api/address-search/, api/send-email/
  components/
    marketing/             Nav, footer, StartCta, CategoryCta, FaqAccordion, LegalPage, Reveal
    onboarding/             BoendeForm, TelekomForm, KreditkortForm, AutoFetchStep,
                             AddressField, shared UI (PillGroup, PillGroupWithOther, Field)
    internal/               19 komponenter — se "Internverktyget" nedan
    Dashboard.tsx, Onboarding.tsx, CompareFlow.tsx, ItemDetail.tsx, HouseholdView.tsx,
    ArchiveView.tsx, AnnualReportView.tsx, MyCasesView.tsx, RecommendationView.tsx,
    HealthCheckView.tsx, LifeEventsView.tsx, ReferralView.tsx, ChatScreen.tsx,
    ClaimFlow.tsx, BookSpecialist.tsx, BankIdImport.tsx, BankIdRescan.tsx,
    BankConnect.tsx, FullmaktSigning.tsx, CoverageMap.tsx, ProfileMenu.tsx,
    ProfilePage.tsx, SettingsPage.tsx, AuthForm.tsx, ResetPasswordView.tsx,
    TopBar.tsx, TabBar.tsx, Logo.tsx, ProgressDots.tsx, PageSkeleton.tsx,
    NotificationBell.tsx, SyncErrorToast.tsx, Overlay.tsx
  lib/
    items.ts                Datamodellen (se nedan) — störst fil i projektet
    item-quotes.ts           Jämförelsemotor, fyra fiktiva bolag per kategori
    quote.ts                 Quote-typ + pickWinner()
    needs.ts                 Behovsanalys-frågebatterier, alla åtta jämförbara kategorier
    policy-fetch.ts           Simulerad BankID-auto-hämtning (FetchableKind: sju kategorier,
                               telekom undantaget — se eget operatörsuppslag)
    operator-lookup.ts, vehicle-lookup.ts, bank-fetch.ts   Simulerade uppslag
    address-lookup.ts         Riktig Geoapify-adressökning + postnummer→elområde
    recommendation.ts, health-check.ts, life-events.ts, trust-score.ts
    household.ts               Hushåll v2-logik
    referral.ts                 Värvningskod-generering
    activity-log.ts             Internverktygets ändringslogg (maskerar personnummer)
    case-checklist.ts           Ärendehanteringens checklistefrågor
    coverage.ts                  Täckningskarta-logik
    fullmakt.ts                  PDF-generering (pdf-lib) för fullmakten
    item-pdf.ts                  PDF-generering för enskild sak-sammanfattning
    email.ts                     Klient mot /api/send-email
    todo.ts                      "Att göra"-listans logik
    personnummer.ts, phone.ts    Formatvalidering + maskering
    dates.ts, auth-errors.ts, seo.ts
    buddy-context.tsx            Global state, Supabase-speglad
    supabase/client.ts
    faq.ts, guides.ts, news.ts, jobs.ts, top-list.ts, booking.ts, chat.ts, claim.ts, types.ts
supabase/
  schema.sql               18 tabeller, RLS, RPC:er — körs manuellt, ingen migrations-pipeline
public/
  images/founder.jpg, hero-couple.jpg, hero-compare.jpg   Riktiga foton
```

## Datamodellen (`src/lib/items.ts`)

Allt en användare lägger in är ett `InsuranceItem` — en diskriminerad union över nio
`kind`-värden. Flera kategorier grenar vidare på en `typ`:

- **Boende**: 8 typer — hyresrätt, bostadsrätt, fritidsbostadsrätt, villa, fritidshus,
  magasinering, **andrahandsuthyrning**, **student/inneboende**. Lösörevärde som skala
  (500k–2M kr) på lägenhets-/hustyperna. Villa/fritidshus har uppvärmningssätt,
  pool/jacuzzi, solceller; fritidshus har egna fält för användningsgrad, vinterbonad,
  uthyrning.
- **Bil**: regnr-autofyllning (simulerad), körsträcka, förvaring.
- **Övrigt fordon**: 13 typer — mc, husvagn, båt, släp, **lätt lastbil**, **moped
  (klass I/II)**, **husbil**, **snöskoter**, **terränghjuling/ATV**, **A-traktor/EPA**,
  **veteranfordon**, **elsparkcykel**, annat. Cykel medvetet inte en egen fordonstyp —
  täcks redan av hemförsäkringens lösöretak.
- **Person**: relation (mig själv/partner/barn/annan), sysselsättning, önskat skydd —
  åtta värden: olycksfall, sjuk-/efterlevandeskydd, liv, barnförsäkring, **gravid**,
  **sjukvård**, **inkomst**, **diagnosförsäkring**. Fyra av dem (sjukdom, liv, sjukvård,
  diagnosförsäkring — se `HALSODEKLARATION_SKYDD`) kräver en hälsodeklaration, som ställs
  **vid tecknande** (`CheckoutForm` i `CompareFlow.tsx`), inte i den indikativa
  jämförelsen.
- **Djur**: hund/katt/annat, med önskat veterinärvårdsbelopp som skala (hund 30–140k,
  katt 20–60k kr).
- **Telekom**: mobil (telefonnummer→operatör-uppslag, simulerat), bredband,
  TV-streaming (med "faktiskt använt senaste månaden?"-fråga → syns som en
  besparingsinsikt på Årlig hälsokoll).
- **Kreditkort**, **El** (postnummer→elområde-uppslag), **Prenumeration** (fri
  samlingskategori, enda kategorin utan jämförelsemotor).

**`ITEM_GROUPS`** styr Dashboard-grupperingen i tre kort — **notera att gruppindelningen
inte är intuitiv**: `mobil`-gruppen (etikett "Mobilabonnemang") visar bara
`telekom`-poster med `typ === "mobil"`; bredband och TV-streaming hamnar under
`prenumeration`-gruppen (etikett "Prenumerationer") tillsammans med `prenumeration`-kind.
Kontrollera alltid `matchesItem`-predikaten i `items.ts` om du ska skriva text om var
något visas — det här dokumentet och gammal marknadsföringskopia har båda tidigare sagt
fel.

**`ComparableItem`/`isComparableItem()`/`COMPARABLE_KINDS`** — åtta av nio kategorier har
en fungerande jämförelsemotor. Bara **prenumeration** är ren datainsamling.

## Funktioner byggda hittills

### Marknadsföringssajt (route group `(marketing)`)
Startsida, /jamfor (produktsida med en "Så jämför vi"-sektion som förklarar den
riktiga rankningsformeln — betyg 60%/pris 40%, `pickWinner()` i `quote.ts`), Om oss,
Jobb, Vanliga frågor (16 frågor, JSON-LD FAQPage), Kontakt, Nyheter, Guider (11 st,
korrigerade lästider, JSON-LD Article + BreadcrumbList), Villkor/Integritetspolicy/
Cookies. Huvudmenyn har fyra punkter (Jämför/Guider/Nyheter/Om oss) — Hem/Jobb/Vanliga
frågor/Kontakt nås via footern. Ett varumärke: **Buddy / minbuddy.se** överallt,
inklusive kontakt-e-postadresserna.

**Företaget bakom Buddy är inte formellt registrerat än** — villkor/integritetspolicy
säger det ärligt istället för att hitta på ett org.nr eller en tillsynsstatus. Uppdatera
de styckena den dagen det finns en riktig juridisk person.

### Inloggning & persistens
`/kom-igang` → `/login` → e-post + lösenord + obligatorisk 6-siffrig e-postbekräftelse.
Huvudmenyns "Logga in"-knapp går direkt till inloggningsläget (`?mode=login`), inte
registreringsflödet. `BuddyProvider` har en `loading`-flagga och triggar bara full
omladdning på ett genuint `SIGNED_IN`-event.

**Not:** `AutoFetchStep.tsx`/`BankIdImport.tsx`/`BankIdRescan.tsx`s BankID-simulering
(för att "hämta befintlig försäkring") är separat och rör inte kontoinloggningen.

### Onboarding / lägg till en sak (`Onboarding.tsx`)
Hub med alla nio kategorier. Deep-link via `?kind=X`. Varje kategori har ett eget
formulär — se Datamodellen ovan för hur mycket varje kategori faktiskt frågar om.
Genomgående princip (från en produktträds-genomgång 2026-08-30): fråga aldrig om något
som kan räknas fram — postnummer→elområde, telefonnummer→operatör, regnr→fordonsdata.

### Dashboard / översikt (`Dashboard.tsx`)
Två faser (`readyToCompare`). Tre gruppkort. Trygghetspoäng-mätare (`trust-score.ts`,
60% jämförelsegrad + 20% inga brådskande förnyelser + 20% signerad fullmakt). "Att
göra"-lista (`todo.ts`) med förfallodatum, hushållsförfrågningar, komplettera-mobilnummer,
livshändelser, värvning. Varje sak-kort visar Jämför/Säg upp/Hjälp med skada.

### Jämförelseflöde (`CompareFlow.tsx`, `/compare/[id]`)
Börjar alltid med en fork ("bara den här" vs "hela lösningen" → bokning), sen
behovsanalys (fritext eller 5 frågor, `needs.ts`), sen resultat. **Tre-kolumnsvyn**
(Nuvarande/Billigast/Rekommendation + Enkel/Avancerat-växlare + fullständig tabell)
gäller Försäkring-gruppens fem kategorier **plus kreditkort och el** — alla sju har
riktig auto-hämtning (`policy-fetch.ts`s `FetchableKind`). Telekom har ett eget,
enklare hjältekort+tabell-mönster eftersom det saknar en "hämta befintligt avtal"-väg
(har istället operatörsuppslag på telefonnummer) — se `hasThreeColumnLayout` i
CompareFlow.tsx för den exakta gränsen. Fyra fiktiva bolag per kategori.
`handleSign`/`finalizeSign` sätter `source: "compared"`, skriver till `policies` och
`policy_history` (append-only logg).

**Hälsodeklaration**: för personförsäkringar med ett skydd i `HALSODEKLARATION_SKYDD`
visas ett extra steg i `CheckoutForm` (röker, sjukskriven, pågående behandling, tidigare
avslag — bara ja/nej, ingen fritext) precis innan avtalet sparas.

### Detaljvy (`ItemDetail.tsx`, `/objekt/[id]`)
Nuvarande villkor, historik (om >1 rad i `policy_history`), kalenderpåminnelse (.ics),
PDF-nedladdning, Jämför/Säg upp/Hjälp med skada — samma åtgärder som Dashboard-kortet.

### Hushåll v2 (`HouseholdView.tsx`, `/hushall`)
Personnummer-baserad dubbel-consent (`household_requests`) — aldrig avslöjar via UI:t
om ett personnummer redan tillhör en Buddy-kund innan den personen godkänt. Aggregerad
vy (medlemsantal, total kostnad, saker per kategori) när >1 medlem, exponerar aldrig
en enskild medlems poster.

### Dokumentarkiv (`ArchiveView.tsx`, `/arkiv`)
Fullmakts-PDF (`FullmaktSigning.tsx`, riktig `signature_pad`-signering, laddas upp till
Supabase Storage) + fullmaktshistorik (`fullmakt_history`).

### Årsrapport (`AnnualReportView.tsx`, `/arsrapport`)

### GDPR (`SettingsPage.tsx`)
Dataexport (klientsidan JSON-nedladdning) + kontoraderingsbegäran
(`account_deletion_requests` — appen har bara anon-nyckeln och kan aldrig radera
`auth.users` själv, en anställd hanterar begäran manuellt i internverktyget).

### Värva en vän (`ReferralView.tsx`, `/varva-en-van`)
**Riktig backend** — `referral_events`-tabell, `count_referral_signups()`/
`count_qualified_referrals()`. En värvning räknas när vännen lagt till minst en sak och
klickat "Nu jämför vi allt" (`ready_to_compare`). Belöning: kostnadsfri hjälp av en
specialist vid skadereglering efter fem värvningar.

### Bevakning, hälsokoll, livshändelser
Förfallodag-påminnelser i "Att göra". Årlig hälsokoll (`/halsokoll`) — antal
saker/jämförda, månadskostnad, besparingspotential, saknade kategorier, **och sen
2026-08-30 en rad om obetalda-men-oanvända streamingtjänster**
(`unusedStreamingCost` i `health-check.ts`). Livshändelser (`/livshandelser`) —
flytt/väntar barn-checklistor + sysselsättningstips.

### Chat, skadeanmälan, boka specialist
`/chat`, `/claim`, `/book` — kanned/simulerade, tydligt märkta "Demo-läge". `/claim`
har ett riktigt statusspår. `/book` har en riktig avbokningsfunktion
(`ec3af33`) och skickar en riktig bekräftelse (om `RESEND_API_KEY` finns).

### Profil & inställningar
Redigerbar profil, byt lösenord, notifikationsinställningar (sparas på riktigt till
`profiles`), GDPR-verktyg. Utloggning via hård navigation.

### Internverktyget (`InternalView.tsx`, `/internt`)
För Buddy-anställda — kräver en rad i `employees`-tabellen **och** en verifierad MFA-
faktor (`MfaGate.tsx`, TOTP via Supabase). Sex kategorier, 19 komponenter:

1. **Medarbetarprofil** (`EmployeeProfile.tsx`) — egen profil, avatar, kalenderkoppling
   (demo).
2. **Dashboard** (`EmployeeDashboard.tsx`) — teamöversikt (`employee_directory`-vy,
   exponerar medvetet inte permission_level/telefon).
3. **Kundhantering** (`CustomerListView.tsx`, `CustomerWorkspace.tsx`,
   `CustomerSearchRail.tsx` + flikar för aktivitet/ärenden/dokument/saker/anteckningar)
   — personnummer maskeras för `kundservice`-rollen via `customer_profile_view`
   (server-side, en vy, inte bara UI-döljning).
4. **Ärendehantering** (`CaseAssignment.tsx`, `CaseChecklist.tsx`, `CaseComments.tsx`,
   `CustomerCasesTab.tsx`) — på `bookings`/`claims`, tilldelning/prioritet/deadline/
   checklista/eskalering.
5. **Notiser** (`InternalNotificationBell.tsx`, `RequestsInbox.tsx`,
   `MissingInsuranceQueue.tsx`, `CancellationQueue.tsx`, `AccountDeletionQueue.tsx`).
6. **Behörigheter & säkerhet** — fyra roller (admin/teamledare/specialist/kundservice)
   med riktigt genomdrivna skillnader (permanent radering, GDPR-godkännande,
   personnummer-maskering och redigeringsspärr — en trigger blockerar `kundservice`
   från att SPARA en ändring av personnummer, inte bara UI-döljning).

**Kvarvarande säkerhetslucka (känd, inte fixad):** `profiles_select_employee`- och
`activity_log_select_employee`-RLS-policyerna saknar rollfilter — en anställd kan i
teorin läsa personnummer i klartext via en rå Supabase-fråga i devtools istället för
via den maskerade vyn appens UI faktiskt använder. Kräver kolumn-nivå-behörigheter
eller att flytta alla anställd-läsningar genom RPC:er/vyer — en riktig
arkitekturändring på skydds-sidan, inte en snabbfix. Se `activity_log`-maskeringen
(redan fixad 2026-08-30) för samma klass av problem, löst för just den tabellen.

### Externa integrationer
- **Supabase** (auth + databas): riktig.
- **Geoapify** (adressökning): riktig.
- **Resend** (transaktionsmejl): riktig, om `RESEND_API_KEY` är satt.
- **Fordonsuppslagning, operatörsuppslagning, bankkoppling, BankID-import/rescan**:
  alla simulerade. Samma funktionssignatur som en riktig integration skulle ha, så
  bytpunkten är förberedd men inget är kopplat in.

## Kända begränsningar / medvetna avgränsningar

- **Ingen jämförelsemotor för Prenumeration** — medvetet, öppen samlingskategori.
- **Auto-hämtning, fordonsuppslagning, operatörsuppslagning, bankkoppling**: alla
  simulerade, tydligt märkta "Demo-läge" i UI:t sedan en konsekvenskoll 2026-08-30
  (täcker BookSpecialist.tsx, BankIdImport/Rescan, AutoFetchStep-resultatskärmarna,
  fordonsuppslagning i onboarding — inte bara chatt/skadeanmälan som tidigare).
- **Fastighetsregister-uppslag** (byggår/boyta/taxeringsvärde från adress) — utreds
  inte, skulle kräva en ny betald integration (Lantmäteriet-typ).
- **Cykel och reseförsäkring som egna produkter**: medvetet uteslutna trots att en
  produktträds-genomgång 2026-08-30 föreslog dem — båda skulle motsäga appens egen
  "sälj inte det du redan har"-princip (hemförsäkringens lösöretak täcker de flesta
  cyklar; reseskydd finns redan som tilläggsfråga på boende/kreditkort).
- **Kontrast**: primärknappar (`bg-forest`+vit text) och sekundärtext (`text-slate`)
  ligger under WCAG AA på många ställen — systemiskt, inte punktvis. Inte åtgärdat,
  rör hela färgpaletten.
- **Formulärfält**: `Field`-komponenten (`onboarding/shared.tsx`) kopplar nu ihop
  label/input automatiskt för raka `<input>`-barn (fixat 2026-08-30), men fält
  inlindade i en extra `<div>` (t.ex. PillGroup-baserade) är fortfarande utan
  programmatisk label-koppling.
- **`minbuddy.se`** är kopplad och publik. E-postadresserna `hej@`/`jobb@minbuddy.se`
  används i kontaktuppgifter — inte verifierat att de brevlådorna faktiskt tar emot
  post.
- Ingen fullständig mobil- eller tillgänglighetsgenomgång.

## Utvecklingsområden (senast diskuterade, 2026-08-30)

Hela 21-sektions-kundresa-v2-planen (`docs/kundresa-v2-steg2-plan.md` + uppföljande
sektioner) är klar och verifierad live. En stor del av dagens arbete var: en 30-punkters
extern trovärdighetsgranskning av marknadssajten (mestadels åtgärdad), en
säkerhetsgenomgång (två hål täppta, ett kvar — se ovan), och en genomgång av hela
jämförelseflödets frågespecifikation (El/Mobil/Boende/Fordon/Djur/Person/Streaming
byggda, se git-historiken för detaljer).

Kvarstående, ungefärlig prioritetsordning:

1. **RLS-hålet i internverktyget** (se ovan) — det viktigaste kvarvarande
   säkerhetsproblemet.
2. **Kontrastgenomgång** — designbeslut, rör hela paletten.
3. **Regnr-/fastighetsuppslagning mot en riktig extern API** — två separata simulerade
   flöden, redan förberedda för att bytas ut.
4. **Riktiga bolagsnamn i jämförelsen** — skulle kräva riktig data (pris-API:er eller
   avtal med bolagen), ett separat och mycket större projekt.
5. Mindre: nytt guide-/nyhetsinnehåll för kategorier som saknar det (djur, MC, husvagn,
   båt), en tydlig förklaring av hur Buddy tjänar pengar (FAQ + /jamfor).

## Git-historik

Fullständig historik i `git log`. Grundstommen (projektuppsättning, item-baserad
onboarding, jämförelseflöde, publik marknadsföringssajt) byggdes i de första ~22
commiten. Därefter, i grova drag: riktig adressökning, "Morgonljus"-omdesign, nio
kategorier i tre grupper, riktig persistens (Supabase) och riktig inloggning,
internverktyget (6 kategorier), och hela kundresa v2-planen (BankID-import,
hushåll v2, trygghetspoäng, dokumentarkiv, GDPR, årsrapport, referral). Se `git log`
för exakta hashar — det här dokumentet sammanfattar resultatet, inte ordningen.

# Buddy — Kundresa v2, Steg 2: BankID-import, Att göra-lista, jämförelse-fork, hushåll v2

## Kontext för den som tar vid

Det här är ett Next.js 16 (App Router/Turbopack) + React 19 + TypeScript-projekt
("Buddy", en svensk försäkrings-/abonnemangsjämförelsetjänst), Supabase som
backend (`@supabase/supabase-js` + `@supabase/ssr`), helt klientdrivet state
via `src/lib/buddy-context.tsx`. Live på minbuddy.se. Investerardemo ~2026-09-08
— prioritera att allt *ser* klart och sammanhängande ut framför långsiktig
komplettering.

**Redan byggt och ska INTE röras i det här steget:**
- Registrering: mejl + lösenord + **obligatoriskt mobilnummer**
  (`src/lib/phone.ts`, `src/components/AuthForm.tsx`), samt obligatorisk
  mejlbekräftelse med 6-siffrig kod (`supabase.auth.verifyOtp`) innan kontot
  är aktivt. Inloggning sker med mejl + lösenord — **ändras inte i det här
  steget** (se beslut nedan).
- Fyra dashboard-sektioner: **Försäkringar, Mobilabonnemang, Prenumerationer,
  Ekonomi** (`src/lib/items.ts` — `ITEM_GROUPS` med `matchesItem`/`addTargets`
  per grupp, `src/components/Dashboard.tsx`). Ekonomi (kreditkort + el) är
  oförändrad och ligger kvar som fjärde sektion.
- Simulerad "Hämta automatiskt"-BankID-flöde för **en post i taget**
  (`src/components/onboarding/AutoFetchStep.tsx`, faserna
  `bankid-idle` → `bankid-waiting` → `fetching` → klart, med
  "Simulerad identifiering i den här prototypen"-disclaimer). Det här steget
  bygger vidare på samma visuella mönster men breddar det till att hämta
  **flera försäkringar på en gång**.
- Fullmakt: `FullmaktSigning.tsx` + `src/lib/fullmakt.ts` (utkasttext +
  PDF-generering + signaturpad), redan inbyggd som ett `poa`-steg i
  `Onboarding.tsx` mellan namn och hub, med en "Hoppa över"-möjlighet.
- Hushåll v1: kod-baserad invite (`src/lib/household.ts`,
  `HouseholdView.tsx`) — **ska ersättas helt** i det här steget (se Del I).
- Internverktyget (`/internt`, `src/components/InternalView.tsx`) har redan
  ett etablerat mönster för "kö av ärenden en anställd hanterar":
  `src/components/internal/CancellationQueue.tsx` (frågar alla `policies`
  där `cancellationPending = true`, tvärs över kunder, med en "Öppna
  kund"-knapp). Det här steget återanvänder samma mönster för en ny kö.
- `src/lib/vehicle-lookup.ts` — `lookupVehicle(regnummer)`: en simulerad
  slå-upp-funktion med samma signatur som en riktig fordonsdata-API skulle
  ha, används i `BilForm`/`OvrigtFordonForm` i `Onboarding.tsx`. Det här är
  mönstret att kopiera för telefonnummer → operatör (se Del D).
- `src/lib/booking.ts` — `FIXED_TOPICS`, kopplat till `BookSpecialist.tsx`.
- `src/lib/dates.ts` — `daysUntilSwedishDate()`, redan använd för
  förfallodag-påminnelser på Dashboard idag.

## Beslut tagna inför det här steget

1. **Inloggning ändras INTE nu.** Mejl + lösenord + kod-verifiering kvarstår.
   BankID är bara ett importverktyg inne i dashboarden, inte en
   inloggningsmetod. Personnummer samlas in vid BankID-importen och vid
   hushålls-koppling — inte vid varje inloggning. (Fullständig BankID-login
   är en framtida fas, inte del av det här steget.)
2. **Saknad försäkring → ärende i internverktyget.** När BankID-importen
   missar något och kunden flaggar att en försäkring saknas, skapas ett
   riktigt ärende som en anställd hanterar manuellt i `/internt` — inte en
   till simulerad direkthämtning. Kunden ser en tydlig statuspil
   ("Under hantering hos Buddy") tills en anställd fyllt i uppgifterna.
3. **Fullmakten är valfri direkt efter importen.** Kunden kan hoppa över
   den och göra det senare. Om den inte är signerad dyker den upp som en
   post i den nya Att göra-listan tills den är klar.
4. **Mobil-operatör-uppslag:** slå upp operatör utifrån telefonnumret
   (simulerat, samma mönster som `lookupVehicle`), visa sedan den
   operatörens egna abonnemangspaket att välja mellan istället för att
   kunden skriver in allt manuellt. En riktig API kopplas in senare
   (byggs av Gledis själv) — den simulerade funktionen ska vara lätt att
   byta ut utan att UI:t behöver ändras.
5. **Redan beslutat i tidigare pass, gäller fortfarande:** personnummer
   maskeras bara i gränssnittet (visas t.ex. med sista fyra siffrorna),
   lagras i klartext i databasen. Kalenderintegration (Google/Outlook)
   är inte del av det här steget. Bank-transaktionsläsning för
   Prenumerationer är simulerad nu, riktig Tink-liknande integration är en
   framtida fas.

## Mål med det här steget

Göra hela "samla in det du har"-delen av kundresan radikalt enklare: från
att kunden idag manuellt fyller i varje sak för hand, till att BankID-import
(försäkringar) och simulerad bankkoppling (prenumerationer) gör det mesta
jobbet automatiskt — med en tydlig, liten "Att göra"-lista som styr vad
kunden faktiskt behöver agera på (förnyelser inom 45 dagar, osignerad
fullmakt, obesvarade hushålls-förfrågningar), istället för dagens statiska
"Mer att göra"-kort som tar för mycket plats utan att vara handlingsstyrt.

---

## Del A — Simulerad BankID-import av försäkringar (flera på en gång)

Ny fas i `Onboarding.tsx`, "full"-läget: efter mejlverifiering (redan klar
innan kontot ens är aktivt) blir nästa steg — istället för direkt till
namn/hub som idag — en ny **"Importera dina försäkringar"**-skärm:

- Återanvänd det visuella waiting/fetching-mönstret från `AutoFetchStep.tsx`
  (BankID-idle → väntar på BankID → hämtar), men rikta det mot **flera
  poster samtidigt** istället för en post i taget.
- Resultat: en fast/slumpad uppsättning simulerade `InsuranceItem`-poster
  (2–4 st boende/bil/person osv, liknande datakvalitet som
  `FORSAKRINGSBOLAG`-listan redan använder) dyker upp och sparas direkt via
  `addItem` i `buddy-context.tsx`, **märkta "Demo"** (samma krav som
  gäller övrigt simulerat i appen).
- Efter importen: en sammanfattningsskärm — "Vi hittade X försäkringar" med
  korten listade, plus en knapp **"Jag har fler försäkringar som inte
  dök upp"** → leder till Del B.
- "Hoppa över hela importen" ska finnas kvar som utväg (samma princip som
  redan gäller för namn/fullmakt-stegen), för kunder som hellre vill lägga
  in allt manuellt via sektionerna senare.

## Del B — Saknad försäkring → ärende i internverktyget

Ny formulärskärm efter Del A: kunden anger vilken typ av försäkring som
saknas (kind-väljare, samma kategorier som `ITEM_CATEGORIES`) plus valfri
fritext ("t.ex. bolag om du vet det"). Detta sparas som ett nytt ärende,
inte som en färdig `InsuranceItem`.

- **Schema:** ny tabell `missing_insurance_requests` (id, user_id, kind,
  note, status `open|done`, created_at) — eller återanvänd
  `customer_notes`-mönstret om det passar bättre; följ samma RLS-princip
  som övriga kundtabeller (kunden ser/skapar sina egna, anställda ser allt
  via `employees`-koppling som redan finns).
- **Internverktyget:** ny flik/kö i `InternalView.tsx`, byggd enligt exakt
  samma mönster som `CancellationQueue.tsx` — lista alla öppna ärenden
  tvärs över kunder, "Öppna kund"-knapp, en anställd fyller i uppgifterna
  (återanvänd samma formulär som redan finns för att lägga till en post
  manuellt i `CustomerItemsTab.tsx` om det går, annars en förenklad
  variant) och markerar ärendet `done`, vilket skriver en riktig
  `InsuranceItem` till kundens profil.
- **Kundsidan:** ärendet syns som ett kort med status "Under hantering hos
  Buddy" — både i Försäkringar-sektionen (som en pending-post, inte en
  vanlig `InsuranceItem`) och som en rad i Att göra-listan (Del F).

## Del C — Fullmakt: valfri, påmind i Att göra

`FullmaktSigning.tsx`/`poa`-fasen i `Onboarding.tsx` behålls som den är
strukturellt (den har redan "Hoppa över"), men:

- Flytta den till att visas direkt efter Del A/B (importen), inte efter
  namn-steget som idag — ordningen blir: mejlverifiering → BankID-import →
  (ev. saknad-försäkring-formulär) → fullmakt (valfri) → dashboard.
- Om kunden hoppar över: spara ett tydligt "inte signerad än"-state (finns
  redan implicit via `fullmaktSignedAt` som är `null`/satt i
  `buddy-context.tsx` — inget nytt schema behövs, bara en läspunkt för
  Att göra-listan).

## Del D — Mobilabonnemang: auto-ifyllt förstanummer, operatörsuppslag, förfallodag

- **Förstanumret:** telefonnumret som angavs vid registrering
  (`profile.phone`, redan sparat via `handle_new_user()`) blir automatiskt
  en första `MobilAbonnemangItem`-post i Mobilabonnemang-sektionen, med
  numret ifyllt men operatör/pris/förfallodag/bindningstid tomma —
  kunden kompletterar det (antingen direkt efter importen, eller senare via
  en post i Att göra-listan om det lämnas tomt).
- **Fler nummer (familjeabonnemang):** redan strukturellt möjligt via
  befintligt "Lägg till mobilabonnemang"-flöde (`TelekomForm.tsx` med
  `initialTyp="mobil"`) — inga ändringar behövs för själva multi-nummer-
  förmågan, bara säkerställ att flödet är tydligt återanvändbart.
- **Operatörsuppslag:** ny `src/lib/operator-lookup.ts`, `lookupOperator
  (phoneNumber): OperatorMatch | null` — samma abstraktionsnivå/signaturstil
  som `lookupVehicle()`. Simulerad logik (t.ex. baserat på siffermönster i
  numret, eller bara en fast fejklista) returnerar en operatör + en lista
  simulerade paket för just den operatören (pris/data-nivåer). UI:t i
  `TelekomForm.tsx` (mobil-grenen) byter från fri operatörsvalspill
  (`TELEKOM_MOBIL_OPERATORER`) till: slå upp automatiskt vid ifyllt nummer
  → visa den operatörens paketalternativ att välja mellan, med möjlighet
  att välja "Annan operatör" manuellt om uppslaget missar.
- **Förfallodag saknas i datamodellen idag** — `MobilAbonnemangItem` har
  `bindningstidManader` men inget explicit förfallo-/omdatum. Lägg till
  ett nytt valfritt fält (t.ex. `forfallodatum?: string`) på
  `MobilAbonnemangItem` (och troligen `PrenumerationItem`, se Del E) i
  `src/lib/items.ts`, eftersom Att göra-listans 45-dagars-nedräkning
  (Del F) behöver kunna läsa förfallodatum direkt från posten — idag finns
  förfallodatum bara på `Quote` (`policies[item.id]?.forfallodatum`), vilket
  bara existerar för poster som gått igenom jämförelseflödet.

## Del E — Prenumerationer: simulerad bankkoppling

Ny knapp i Prenumerationer-sektionen: **"Anslut din bank"** →
samma waiting/BankID-visuella mönster som Del A (signering via BankID för
att "läsa av transaktionsregistret"). Efter simulerad väntan: en lista
föreslagna återkommande dragningar dyker upp (samma typ av fejkdata som
`PRENUMERATION_LEVERANTORER`/`TV_STREAMING_TJANSTER` redan representerar,
t.ex. "Netflix — 149 kr/mån", "SATS — 399 kr/mån") som kunden kan bocka i
en och en eller alla på en gång → sparas som riktiga
`PrenumerationItem`/`TelekomItem`-poster. Märk tydligt som simulerad
("Demo") — riktig integration (Tink-liknande) är en framtida fas, inte del
av det här steget.

## Del F — "Att göra"-listan (ersätter dagens "Mer att göra"-kort)

Dagens statiska kort i `Dashboard.tsx` (hälsokoll, flytt, barn, värva en
vän, hushåll — ett fast antal genvägar som alltid visas, oavsett om det är
relevant) görs om till en **dynamisk, handlingsstyrd lista**:

- **Förnyelser inom 45 dagar:** bygg vidare på befintlig
  `upcomingRenewals`-logik i `Dashboard.tsx` (idag bara för `fetched`-källa
  via `Quote.forfallodatum`), men bredda den till att även läsa
  förfallodatum direkt från itemet där sådant finns (Del D/E:s nya fält).
  Varje rad ska gå att klicka för att direkt hoppa in i jämförelse-forken
  (Del H) eller uppsägningsflödet.
- **Osignerad fullmakt:** en rad om `fullmaktSignedAt` är `null` (Del C).
- **Öppna "saknad försäkring"-ärenden:** en rad per öppet ärende (Del B),
  med status "Under hantering".
- **Obesvarade hushålls-förfrågningar:** en rad om kunden har en väntande
  godkännande-notis (Del I).
- **De gamla genvägarna** (hälsokoll, flytt, barn, värva en vän, hushåll)
  flyttas till en mindre framträdande plats — t.ex. ett hopfällt "Mer"-
  avsnitt längst ner på Dashboard, eller in i profilmenyn/en egen sida —
  så de inte konkurrerar med det som faktiskt kräver kundens uppmärksamhet.
  (Exakt placering är en detalj som kan avgöras under bygget — huvudpoängen
  är att de ska ta väsentligt mindre plats än idag.)

## Del G — Klicka in på en försäkring: detaljvy

Varje post i sektionerna ska gå att klicka på för att se en fullständig
detaljvy innan man väljer att jämföra: nuvarande villkor, pris,
förfallodatum, eventuell historik. Kan byggas som en ny route
(`/objekt/[id]` eller liknande) eller en utökad expanderad kortvy — avgörs
under bygget. Från detaljvyn nås jämförelse-forken (Del H).

## Del H — Jämförelse-fork: "bara den här" vs "hela lösningen"

Varje gång kunden klickar "Jämför" (både i Dashboard-korten idag och i den
nya detaljvyn, Del G) ska först en fråga visas:

> Vill du jämföra bara den här saken, eller hela din lösning?

- **"Bara den här"** → dagens `CompareFlow` för just det itemet, helt
  oförändrat beteende.
- **"Hela lösningen"** → för direkt till bokningsformuläret
  (`BookSpecialist.tsx`) med ett förifyllt ämne/kontext (samma mönster som
  `FIXED_TOPICS` i `booking.ts` redan använder) — **ingen ny
  helhets-jämförelsemotor byggs**, det är en enklare omdirigering till att
  boka en specialist.

## Del I — Hushåll v2: personnummer + dubbelt godkännande (ersätter kod helt)

Ersätter `src/lib/household.ts`/`HouseholdView.tsx`s kod-baserade invite-
system helt (inte en påbyggnad):

- Kunden anger personnummer på personen de vill lägga till i hushållet
  (inte en kod).
- Om personnumret matchar en befintlig kund: den personen får en notis
  (t.ex. i Att göra-listan, Del F) att **godkänna eller neka** kopplingen.
  Om personnumret inte matchar någon befintlig kund: hantera som en
  inbjudan som aktiveras när/om den personen registrerar sig senare (kräver
  ett beslut om exakt flöde — flagga som öppen fråga vid granskning om det
  inte är uppenbart under bygget).
- **Viktigt integritetskrav (redan beslutat tidigare):** gränssnittet får
  **aldrig** avslöja om ett angivet personnummer tillhör en befintlig kund
  eller inte, innan den personen själv har godkänt kopplingen — annars
  läcker appen existens-information om andra kunders konton.
- Schema: troligen en ny `household_requests`-tabell (id, household_id,
  requested_personnummer, target_user_id nullable, status
  `pending|approved|declined`, created_at) med RLS som bara låter den
  inbjudna personen se/svara på sin egen förfrågan.

---

## Rekommenderad byggordning

1. **Del D (datamodell) + Del F-grund** — lägg till `forfallodatum` på
   itemtyperna och bygg om Att göra-listan mot befintlig data först, så det
   finns en tydlig platsi UI:t att koppla resten mot.
2. **Del A + Del C** — BankID-import + fullmakt-omflyttning, det första
   kunden möter.
3. **Del B** — saknad-försäkring-ärenden + ny kö i internverktyget.
4. **Del D (resten) + Del E** — operatörsuppslag, familjenummer,
   bankkoppling för prenumerationer.
5. **Del G + Del H** — detaljvy och jämförelse-fork.
6. **Del I** — hushåll v2 (störst enskild omskrivning, gör sist så den inte
   blockerar resten).

Verifiera varje del live (`npm run dev` + Playwright-smoketest-uppdatering
där det är rimligt) och committa separat per del, i linje med hur tidigare
steg i det här projektet har byggts och verifierats.

## Öppna antaganden att bekräfta/korrigera vid granskning

- Del A: exakt hur många/vilka simulerade försäkringar BankID-importen
  "hittar" (statisk lista vs. slumpad) är inte specificerat av Gledis —
  föreslagen lösning ovan, men bekräfta gärna.
- Del B: om `missing_insurance_requests` ska vara en helt ny tabell eller
  återanvända `customer_notes` — avgörs enklast under bygget mot faktisk
  schemastruktur.
- Del F: exakt UI för var de "gamla genvägarna" hamnar (hopfällt avsnitt
  vs. flyttas till profilmenyn) — ingen hård prioritering angiven, avgör
  under bygget.
- Del I: hanteringen av personnummer som INTE matchar en befintlig kund
  (ren framtida-inbjudan vs. blockeras) är inte helt specificerad —
  flaggad som öppen fråga i Del I ovan.

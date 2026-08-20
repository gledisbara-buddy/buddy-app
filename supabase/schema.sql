-- Buddy: persistens-schema. Kör hela detta skript i Supabase → SQL Editor.
-- Säkert att köra om — alla steg är idempotenta (create table if not exists,
-- drop policy if exists + create policy, create or replace function).

create extension if not exists pgcrypto;

-- profiles: en rad per användare, skapas automatiskt vid registrering (se trigger längst ner)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_type text not null default 'privat' check (user_type in ('privat', 'foretag')),
  name text not null default '',
  personnummer text,
  phone text,
  ready_to_compare boolean not null default false,
  created_at timestamptz not null default now()
);

-- E-post dupliceras hit från auth.users (som klienten inte får läsa direkt)
-- så att anställda kan söka upp en kund på e-post.
alter table public.profiles add column if not exists email text;

-- priority användes tidigare för ett prioritetsval i onboardingen som togs
-- bort — appen läser och skriver inte längre fältet.
alter table public.profiles drop column if exists priority;
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- items: en rad per sak (boende, bil, telekom, ...). Hela objektet sparas
-- som jsonb eftersom InsuranceItem-typen redan har 9 olika former.
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Sparade behovsanalys-svar (needs-id:n) för saken — så kunden slipper göra
-- om analysen varje gång den jämför igen. Läses om och omvalideras mot
-- getAvailableNeedIds vid inläsning (undertypen kan ha ändrats sedan sist).
alter table public.items add column if not exists needs jsonb;

alter table public.items enable row level security;

drop policy if exists "items_all_own" on public.items;
create policy "items_all_own" on public.items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- policies: en rad per offert/tecknad försäkring, en per item.
create table if not exists public.policies (
  item_id uuid primary key references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.policies enable row level security;

drop policy if exists "policies_all_own" on public.policies;
create policy "policies_all_own" on public.policies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- employees: vem som får se den interna sidan. Ingen självregistrering —
-- rader läggs in manuellt via SQL. RLS låter en användare bara se sin EGEN
-- rad (om den finns), så appen kan fråga "är jag anställd?" utan att
-- någonsin kunna lista vilka andra som är det.
create table if not exists public.employees (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;

drop policy if exists "employees_select_own" on public.employees;
create policy "employees_select_own" on public.employees
  for select using (email = auth.jwt() ->> 'email');

-- bookings: en rad per bokningsförfrågan från BookSpecialist.tsx.
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topics text[] not null default '{}',
  extra_note text,
  meeting_type text not null check (meeting_type in ('video', 'phone')),
  day date not null,
  time text not null,
  contact text not null,
  status text not null default 'ny' check (status in ('ny', 'hanterad', 'avbokad')),
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert with check (auth.uid() = user_id);

drop policy if exists "bookings_select_own_or_employee" on public.bookings;
create policy "bookings_select_own_or_employee" on public.bookings
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.employees where email = auth.jwt() ->> 'email')
  );

drop policy if exists "bookings_update_employee" on public.bookings;
create policy "bookings_update_employee" on public.bookings
  for update using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- Kunden kan själv avboka sitt eget möte (status -> 'avbokad'), se
-- cancelBooking() i buddy-context.tsx. Samma "egen rad"-mönster som övriga
-- kundskrivbara tabeller, ingen kolumnbegränsning på RLS-nivå — klienten
-- litar redan på att bara skriva rätt fält, precis som items/policies.
drop policy if exists "bookings_update_own" on public.bookings;
create policy "bookings_update_own" on public.bookings
  for update using (auth.uid() = user_id);

-- claims: en rad per skadeanmälan från ClaimFlow.tsx. Foton/kvitton sparas
-- inte som filer i den här omgången, bara antal — se PROJECT.md.
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transcript jsonb not null,
  photo_count int not null default 0,
  receipt_count int not null default 0,
  skadetyp text,
  allvarlighetsgrad text,
  status text not null default 'mottagen' check (status in ('mottagen', 'under_utredning', 'godkand', 'nekad', 'utbetald')),
  created_at timestamptz not null default now()
);

alter table public.claims enable row level security;

drop policy if exists "claims_insert_own" on public.claims;
create policy "claims_insert_own" on public.claims
  for insert with check (auth.uid() = user_id);

drop policy if exists "claims_select_own_or_employee" on public.claims;
create policy "claims_select_own_or_employee" on public.claims
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.employees where email = auth.jwt() ->> 'email')
  );

drop policy if exists "claims_update_employee" on public.claims;
create policy "claims_update_employee" on public.claims
  for update using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- Anställda får också läsa allas profiles/items/policies (kunduppsökning).
-- Additiv — Postgres OR:ar ihop flera permissiva policies för samma
-- kommando, så det här stör inte de befintliga "läs ditt eget"-policyna.
drop policy if exists "profiles_select_employee" on public.profiles;
create policy "profiles_select_employee" on public.profiles
  for select using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

drop policy if exists "items_select_employee" on public.items;
create policy "items_select_employee" on public.items
  for select using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

drop policy if exists "policies_select_employee" on public.policies;
create policy "policies_select_employee" on public.policies
  for select using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- Värva en vän: egen kod per användare (satt en gång i appen, se
-- Onboarding.tsx) och vem som värvade vem. Uppslaget av referral_code_used
-- görs i triggerfunktionen nedan (SECURITY DEFINER, kringgår RLS säkert)
-- istället för klientsidan, som annars skulle kräva en policy som läcker
-- andra användares profiler.
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);

-- Fullmakt: signeringsstatus + sökväg till PDF:en i Storage-bucketen
-- "fullmakter" (se policies längst ner i filen).
alter table public.profiles add column if not exists fullmakt_signed_at timestamptz;
alter table public.profiles add column if not exists fullmakt_pdf_path text;

-- Skapar automatiskt en profiles-rad när någon registrerar sig.
-- user_type, name, phone och personnummer skickas med som user-metadata
-- vid signup (obligatoriska fält sedan kundresa v2, se AuthForm.tsx),
-- liksom en ev. angiven värvningskod (referral_code_used) som slås upp
-- till ett riktigt användar-id här. phone/personnummer fanns redan som
-- kolumner men kopierades tidigare aldrig in från raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_referrer_id uuid;
begin
  if new.raw_user_meta_data->>'referral_code_used' is not null then
    select id into v_referrer_id from public.profiles
    where referral_code = upper(new.raw_user_meta_data->>'referral_code_used')
    limit 1;
  end if;

  insert into public.profiles (id, user_type, name, email, phone, personnummer, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_type', 'privat'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'personnummer', ''),
    v_referrer_id
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Två räknefunktioner för värvningsstatistik — returnerar bara ett tal,
-- exponerar aldrig rådata om andra användares profiler till klienten.
create or replace function public.count_referral_signups(referrer uuid)
returns int language sql security definer set search_path = public stable as $$
  select count(*)::int from public.profiles where referred_by = referrer;
$$;

create or replace function public.count_qualified_referrals(referrer uuid)
returns int language sql security definer set search_path = public stable as $$
  select count(*)::int from public.profiles p
  where p.referred_by = referrer
    and p.ready_to_compare = true
    and exists (select 1 from public.items i where i.user_id = p.id);
$$;

-- Fullmakt-PDF:er, en per kund. Privat bucket — bara ägaren eller en
-- anställd får läsa, samma mönster som RLS på övriga tabeller.
insert into storage.buckets (id, name, public) values ('fullmakter', 'fullmakter', false)
  on conflict (id) do nothing;

drop policy if exists "fullmakt_insert_own" on storage.objects;
create policy "fullmakt_insert_own" on storage.objects
  for insert with check (bucket_id = 'fullmakter' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "fullmakt_select_own_or_employee" on storage.objects;
create policy "fullmakt_select_own_or_employee" on storage.objects
  for select using (
    bucket_id = 'fullmakter' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.employees where email = auth.jwt() ->> 'email')
    )
  );

-- Teckna-flödets insamlade köpuppgifter (namn/personnummer/betalningsmetod
-- och ev. uppsägningshjälp) — en per tecknad sak, skrivs i samma upsert
-- som redan sätter policies.data.
alter table public.policies add column if not exists checkout jsonb;

-- Lägg till dig själv som anställd (byt ut e-postadressen):
-- insert into public.employees (email) values ('din@epost.se')
--   on conflict (email) do nothing;

-- Hushåll: en rad per familj/hushåll, kopplas till profiles via
-- household_id. Precis som referral_code genereras invite_code
-- klientsidan (src/lib/household.ts) — krockar mot unique-constrainten
-- görs om en gång klientsidan, se resonemanget där.
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  invite_code text not null unique,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.households enable row level security;

drop policy if exists "households_insert_own" on public.households;
create policy "households_insert_own" on public.households
  for insert with check (created_by = auth.uid());

-- Krävs för att createHousehold() ska kunna läsa tillbaka raden den
-- precis skapade (insert ... returning kräver även en SELECT-policy i
-- Postgres RLS, annars ser klienten "RLS violation" trots att INSERT:en
-- i sig lyckades). Löpande läsning av hushållet sker annars alltid via
-- get_my_household() (SECURITY DEFINER, kringgår RLS), så den här
-- policyn behöver bara täcka skaparens egen rad.
drop policy if exists "households_select_own" on public.households;
create policy "households_select_own" on public.households
  for select using (created_by = auth.uid());

-- profiles_update_own (redan satt) täcker redan att en kund sätter/tar
-- bort sin EGEN household_id/household_relation — inget nytt behövs
-- där. household_relation gäller bara hushålls-medlemskap, inte samma
-- sak som PersonRelation i items.ts (som gäller försäkringsobjekt).
alter table public.profiles add column if not exists household_id uuid references public.households(id) on delete set null;
alter table public.profiles add column if not exists household_relation text check (household_relation in ('partner', 'barn', 'annan'));

-- Adress på profilnivå — fanns tidigare bara på sak-nivå (boende-objektet).
alter table public.profiles add column if not exists address text;

create index if not exists idx_profiles_household_id on public.profiles(household_id);

-- En inloggad kund kan inte ges bred select på households bara för att
-- slå upp en kod (samma problem som referral_code löser via
-- handle_new_user()) — så uppslaget görs här, SECURITY DEFINER, och
-- skriver bara till anroparens EGEN rad (auth.uid(), aldrig ett
-- klient-skickat id).
create or replace function public.join_household(code text, relation text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  select id into v_household_id from public.households where invite_code = upper(code);
  if v_household_id is null then
    return null;
  end if;

  update public.profiles
  set household_id = v_household_id, household_relation = relation
  where id = auth.uid();

  return v_household_id;
end;
$$;

-- Kundens egen vy av sitt hushåll — returnerar bara namn för
-- medlemmarna, aldrig personnummer/telefon/mejl. Samma
-- försiktighetsprincip som count_referral_signups m.fl.
create or replace function public.get_my_household()
returns table(id uuid, name text, invite_code text, my_relation text, members jsonb)
language sql
security definer
set search_path = public
stable
as $$
  select h.id, h.name, h.invite_code, p1.household_relation,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', p2.id, 'name', p2.name, 'relation', p2.household_relation))
      from public.profiles p2
      where p2.household_id = h.id and p2.id <> p1.id
    ), '[]'::jsonb)
  from public.profiles p1
  join public.households h on h.id = p1.household_id
  where p1.id = auth.uid();
$$;

-- Anställda behöver kunna läsa och skapa hushåll för att koppla ihop
-- kunder från insidan (se Del I / "lägg till familjemedlem").
drop policy if exists "households_select_employee" on public.households;
create policy "households_select_employee" on public.households
  for select using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

drop policy if exists "households_insert_employee" on public.households;
create policy "households_insert_employee" on public.households
  for insert with check (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- Hushåll v2 (kundresa v2, Del I): personnummer + dubbelt godkännande,
-- ersätter det kod-baserade gå-med-flödet helt på klientsidan. Rör
-- medvetet INTE households/invite_code/join_household() — den kolumnen
-- krävs fortfarande av households (NOT NULL UNIQUE) och invite_code
-- genereras alltjämt av createHousehold()/CustomerSearchRail.tsx, bara
-- inte längre exponerad som ett sätt att gå med.
--
-- Ingen bred SELECT/INSERT-policy för kunder här, av samma skäl som
-- join_household()/get_my_household(): en policy som läter en kund fritt
-- läsa household_requests skulle kunna avslöja andra kunders personnummer
-- eller existens. Allt går via SECURITY DEFINER-funktionerna nedan.
create table if not exists public.household_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  requested_personnummer text not null,
  requested_relation text check (requested_relation in ('partner', 'barn', 'annan')),
  -- Satt direkt om personnumret matchade en befintlig profil vid
  -- skicka-tillfället, annars null tills matchningen sker "live" (se
  -- get_my_household_requests()) eller kunden själv svarar.
  target_user_id uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

alter table public.household_requests enable row level security;

drop policy if exists "household_requests_select_employee" on public.household_requests;
create policy "household_requests_select_employee" on public.household_requests
  for select using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

create index if not exists idx_household_requests_household_id on public.household_requests(household_id);
create index if not exists idx_household_requests_target_user_id on public.household_requests(target_user_id);

-- Skickar en hushålls-förfrågan för ett angivet personnummer. Matchar
-- tyst mot en befintlig profil om en sådan finns (target_user_id sätts
-- direkt) — avslöjar aldrig för anroparen om numret matchade eller inte,
-- samma retursignatur (void) oavsett utfall. Kräver att anroparen faktiskt
-- är kopplad till hushållet (skapare eller medlem), annars kunde vem som
-- helst spamma godtyckliga personnummer med förfrågningar.
create or replace function public.request_household_join(p_household_id uuid, p_personnummer text, p_relation text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid;
begin
  if not exists (
    select 1 from public.households where id = p_household_id and created_by = auth.uid()
  ) and not exists (
    select 1 from public.profiles where id = auth.uid() and household_id = p_household_id
  ) then
    raise exception 'not a member of this household';
  end if;

  if exists (
    select 1 from public.household_requests
    where household_id = p_household_id and requested_personnummer = p_personnummer and status = 'pending'
  ) then
    raise exception 'request already pending';
  end if;

  select id into v_target from public.profiles where personnummer = p_personnummer limit 1;

  insert into public.household_requests (household_id, requested_by, requested_personnummer, requested_relation, target_user_id)
  values (p_household_id, auth.uid(), p_personnummer, p_relation, v_target);
end;
$$;

-- Den inloggade kundens INKOMMANDE förfrågningar — matchar antingen en
-- redan satt target_user_id (matchade en profil direkt vid
-- skicka-tillfället) eller kundens EGET personnummer mot en öppen
-- förfrågan utan target_user_id ("live"-matchning, oavsett när
-- personnumret blev känt för Buddy — se docs/kundresa-v2-steg2-plan.md,
-- Del I). Visar bara namn, aldrig andra kunders personnummer.
create or replace function public.get_my_household_requests()
returns table(id uuid, household_id uuid, household_name text, requested_by_name text, relation text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.household_id, h.name, p.name, r.requested_relation, r.created_at
  from public.household_requests r
  join public.households h on h.id = r.household_id
  join public.profiles p on p.id = r.requested_by
  join public.profiles me on me.id = auth.uid()
  where r.status = 'pending'
    and (r.target_user_id = auth.uid() or (r.target_user_id is null and me.personnummer = r.requested_personnummer));
$$;

-- Förfrågningar den inloggade kunden själv har SKICKAT, för att visa
-- status i hushålls-vyn — avslöjar bara status (pending/approved/
-- declined), aldrig om numret matchade en befintlig kund eller inte.
create or replace function public.get_my_sent_household_requests()
returns table(id uuid, requested_personnummer text, relation text, status text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select id, requested_personnummer, requested_relation, status, created_at
  from public.household_requests
  where requested_by = auth.uid()
  order by created_at desc;
$$;

-- Godkänner eller nekar en inkommande förfrågan. Kör om samma
-- matchningslogik som get_my_household_requests() för att verifiera att
-- raden verkligen gäller den inloggade kunden innan den skriver något.
create or replace function public.respond_household_request(p_request_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_relation text;
  v_matches boolean;
begin
  select r.household_id, r.requested_relation,
    (r.target_user_id = auth.uid() or (r.target_user_id is null and r.requested_personnummer = (select personnummer from public.profiles where id = auth.uid())))
  into v_household_id, v_relation, v_matches
  from public.household_requests r
  where r.id = p_request_id and r.status = 'pending';

  if v_household_id is null or v_matches is not true then
    raise exception 'request not found';
  end if;

  update public.household_requests
  set status = case when p_approve then 'approved' else 'declined' end,
      target_user_id = auth.uid()
  where id = p_request_id;

  if p_approve then
    update public.profiles set household_id = v_household_id, household_relation = v_relation where id = auth.uid();
  end if;
end;
$$;

-- Attribution för anteckningar/logg — valfritt att fylla i per anställd.
alter table public.employees add column if not exists name text;

-- Interna anteckningar om en kund. Ingen update/delete-policy alls
-- (går inte att ändra/radera i efterhand) och ingen kund-policy alls
-- (en kund kan aldrig se sina egna anteckningar).
create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_email text not null references public.employees(email),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.customer_notes enable row level security;

drop policy if exists "customer_notes_insert_employee" on public.customer_notes;
create policy "customer_notes_insert_employee" on public.customer_notes
  for insert with check (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

drop policy if exists "customer_notes_select_employee" on public.customer_notes;
create policy "customer_notes_select_employee" on public.customer_notes
  for select using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- Ändringslogg (audit trail) för anställdas redigeringar av
-- kunduppgifter — se src/lib/activity-log.ts. Skrivskyddad i
-- efterhand: ingen update/delete-policy.
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  actor_email text not null references public.employees(email),
  table_name text not null,
  field text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

alter table public.activity_log enable row level security;

drop policy if exists "activity_log_insert_employee" on public.activity_log;
create policy "activity_log_insert_employee" on public.activity_log
  for insert with check (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

drop policy if exists "activity_log_select_employee" on public.activity_log;
create policy "activity_log_select_employee" on public.activity_log
  for select using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- Stänger den tidigare läsa-bara luckan: anställda hade tidigare bara
-- select på profiles/items/policies, ingen update. "Fri redigering +
-- ändringslogg" är ett medvetet beslut (se activity_log ovan) — samma
-- policyform som redan finns för bookings_update_employee/
-- claims_update_employee.
drop policy if exists "profiles_update_employee" on public.profiles;
create policy "profiles_update_employee" on public.profiles
  for update using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

drop policy if exists "items_update_employee" on public.items;
create policy "items_update_employee" on public.items
  for update using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

drop policy if exists "policies_update_employee" on public.policies;
create policy "policies_update_employee" on public.policies
  for update using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- Ärendehantering: en anställd ska kunna avboka ett möte (skiljt från
-- "hanterad" — mötet blir inte av) och radera felaktiga/dubbla poster.
-- Statusvärdet i sig räcker för avboka; radering kräver en ny policy
-- eftersom bara insert/select/update fanns för bookings/claims innan.
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check check (status in ('ny', 'hanterad', 'avbokad'));

drop policy if exists "bookings_delete_employee" on public.bookings;
create policy "bookings_delete_employee" on public.bookings
  for delete using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

drop policy if exists "claims_delete_employee" on public.claims;
create policy "claims_delete_employee" on public.claims
  for delete using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- Försäkringshantering: radering av en sak som aldrig tecknats (items
-- cascadar till en ev. policies-rad, se "on delete cascade" på
-- policies.item_id ovan). Uppsägning av ett REDAN tecknat avtal görs
-- inte med radering — se cancellationPending/cancellationRequestedAt i
-- src/lib/quote.ts (bara nya jsonb-fält i policies.data, ingen
-- schemaändring behövs för det).
drop policy if exists "items_delete_employee" on public.items;
create policy "items_delete_employee" on public.items
  for delete using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

drop policy if exists "policies_delete_employee" on public.policies;
create policy "policies_delete_employee" on public.policies
  for delete using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- Kontoradering: profiles.referred_by och households.created_by pekade
-- på en annan profil utan ON DELETE-hantering, så Postgres vägrade
-- radera en användare som värvat någon eller skapat ett hushåll ("update
-- or delete ... violates foreign key constraint"). Sätts till null
-- istället — historiken i referred_by/created_by behövs inte efter en
-- radering, bara att den kvarvarande raden inte pekar på ingenting.
alter table public.profiles drop constraint if exists profiles_referred_by_fkey;
alter table public.profiles add constraint profiles_referred_by_fkey
  foreign key (referred_by) references public.profiles(id) on delete set null;

alter table public.households alter column created_by drop not null;
alter table public.households drop constraint if exists households_created_by_fkey;
alter table public.households add constraint households_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

-- Värvningsräkning fick samma problem i andra riktningen: den byggde på
-- en live-fråga mot profiles (where referred_by = referrer), så en
-- raderad VÄRVAD kund drog automatiskt ner värvarens räknare — även om
-- värvningen redan var kvalificerad. referral_events är en permanent
-- logg, skriven en gång vid signup och uppdaterad till "qualified" när
-- det händer, som lever kvar oavsett vad som senare händer med den
-- värvade profilen. Ingen RLS-policy behövs (default: ingen klientåtkomst
-- alls) — allt går via SECURITY DEFINER-funktionerna nedan, samma
-- försiktighetsprincip som övriga räknefunktioner i filen.
create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid references public.profiles(id) on delete set null,
  qualified boolean not null default false,
  created_at timestamptz not null default now(),
  qualified_at timestamptz
);
alter table public.referral_events enable row level security;

-- Engångsbackfill av redan existerande värvningar in i loggen, så att
-- ingen tappar tidigare intjänad status när det här byter till att läsa
-- från referral_events istället för profiles.
insert into public.referral_events (referrer_id, referred_id, qualified, created_at, qualified_at)
select
  p.referred_by,
  p.id,
  (p.ready_to_compare and exists (select 1 from public.items i where i.user_id = p.id)),
  p.created_at,
  case when p.ready_to_compare and exists (select 1 from public.items i where i.user_id = p.id) then now() end
from public.profiles p
where p.referred_by is not null
  and not exists (
    select 1 from public.referral_events e where e.referrer_id = p.referred_by and e.referred_id = p.id
  );

create or replace function public.count_referral_signups(referrer uuid)
returns int language sql security definer set search_path = public stable as $$
  select count(*)::int from public.referral_events where referrer_id = referrer;
$$;

create or replace function public.count_qualified_referrals(referrer uuid)
returns int language sql security definer set search_path = public stable as $$
  select count(*)::int from public.referral_events where referrer_id = referrer and qualified = true;
$$;

-- handle_new_user() satte tidigare bara profiles.referred_by. Nu skriver
-- den även startraden i referral_events (qualified = false) om en giltig
-- värvningskod angavs vid signup.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_referrer_id uuid;
begin
  if new.raw_user_meta_data->>'referral_code_used' is not null then
    select id into v_referrer_id from public.profiles
    where referral_code = upper(new.raw_user_meta_data->>'referral_code_used')
    limit 1;
  end if;

  insert into public.profiles (id, user_type, name, email, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_type', 'privat'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    v_referrer_id
  );

  if v_referrer_id is not null then
    insert into public.referral_events (referrer_id, referred_id) values (v_referrer_id, new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Flippar referral_events.qualified till true första gången en värvad
-- kund blir redo att jämföra OCH har minst en sak — samma villkor som
-- count_qualified_referrals använde tidigare, fast nu skrivet permanent
-- istället för omräknat live. En redan kvalificerad rad rörs inte, så
-- att t.ex. en anställd som senare tar bort kundens saker inte kan dra
-- tillbaka en redan intjänad värvning.
create or replace function public.mark_referral_qualified()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.ready_to_compare = true
    and coalesce(old.ready_to_compare, false) = false
    and new.referred_by is not null
    and exists (select 1 from public.items where user_id = new.id)
  then
    update public.referral_events
    set qualified = true, qualified_at = now()
    where referrer_id = new.referred_by and referred_id = new.id and qualified = false;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_ready_to_compare on public.profiles;
create trigger on_profile_ready_to_compare
  after update on public.profiles
  for each row execute function public.mark_referral_qualified();

-- Kundresa v2 steg 1: mobilnummer är obligatoriskt vid registrering
-- (AuthForm.tsx) och skickas med som user-metadata precis som
-- referral_code_used, så det kan sparas redan när profiles-raden skapas.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_referrer_id uuid;
begin
  if new.raw_user_meta_data->>'referral_code_used' is not null then
    select id into v_referrer_id from public.profiles
    where referral_code = upper(new.raw_user_meta_data->>'referral_code_used')
    limit 1;
  end if;

  insert into public.profiles (id, user_type, name, email, phone, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_type', 'privat'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    nullif(trim(new.raw_user_meta_data->>'phone'), ''),
    v_referrer_id
  );

  if v_referrer_id is not null then
    insert into public.referral_events (referrer_id, referred_id) values (v_referrer_id, new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Kundresa v2 steg 2: kunden flaggar en försäkring som saknades i
-- BankID-importen (BankIdImport.tsx) — en anställd hanterar den manuellt i
-- internverktyget (MissingInsuranceQueue.tsx). Samma mönster som
-- bookings/claims: kunden infogar/läser sina egna, en anställd läser/
-- uppdaterar alla.
create table if not exists public.missing_insurance_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  note text,
  status text not null default 'ny' check (status in ('ny', 'hanterad', 'avbrutet')),
  created_at timestamptz not null default now()
);

alter table public.missing_insurance_requests enable row level security;

drop policy if exists "missing_insurance_requests_insert_own" on public.missing_insurance_requests;
create policy "missing_insurance_requests_insert_own" on public.missing_insurance_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "missing_insurance_requests_select_own_or_employee" on public.missing_insurance_requests;
create policy "missing_insurance_requests_select_own_or_employee" on public.missing_insurance_requests
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.employees where email = auth.jwt() ->> 'email')
  );

drop policy if exists "missing_insurance_requests_update_employee" on public.missing_insurance_requests;
create policy "missing_insurance_requests_update_employee" on public.missing_insurance_requests
  for update using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- En anställd fyller manuellt i en försäkring åt kunden när ett
-- missing_insurance_requests-ärende hanteras (MissingInsuranceQueue.tsx) —
-- det fanns tidigare bara select/update/delete-policyer för anställda på
-- items/policies, ingen insert.
drop policy if exists "items_insert_employee" on public.items;
create policy "items_insert_employee" on public.items
  for insert with check (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

drop policy if exists "policies_insert_employee" on public.policies;
create policy "policies_insert_employee" on public.policies
  for insert with check (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- GDPR-radering: kunden begär radering av sitt konto, en anställd
-- hanterar den manuellt (samma "kö av ärenden en anställd hanterar"-
-- mönster som missing_insurance_requests/cancellationPending — se
-- AccountDeletionQueue.tsx). Själva raderingen av auth.users-raden görs
-- utanför appen (Supabase Studio), eftersom det kräver service-role-
-- behörighet som den här klientdrivna appen aldrig har. Att markera
-- ärendet "done" här betyder alltså "kunden är borttagen", inte att
-- appen själv utfört raderingen.
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'done')),
  created_at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "account_deletion_requests_insert_own" on public.account_deletion_requests;
create policy "account_deletion_requests_insert_own" on public.account_deletion_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "account_deletion_requests_select_own_or_employee" on public.account_deletion_requests;
create policy "account_deletion_requests_select_own_or_employee" on public.account_deletion_requests
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.employees where email = auth.jwt() ->> 'email')
  );

drop policy if exists "account_deletion_requests_update_employee" on public.account_deletion_requests;
create policy "account_deletion_requests_update_employee" on public.account_deletion_requests
  for update using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

-- Historik per sak (21-punktsplanen): en append-only logg av varje offert
-- som sparats för en post, till skillnad från policies (som bara håller
-- den SENASTE — ett upsert skriver över föregående rad helt, ingen
-- historik bevaras där). Skrivs av setPolicy() i buddy-context.tsx varje
-- gång kunden sparar en ny offert (auto-hämtad eller tecknad). Historiken
-- börjar tom för redan befintliga poster — bara ändringar som sker EFTER
-- att den här tabellen finns samlas in, ingen bakåtfyllning är möjlig
-- eftersom policies aldrig behöll de gamla värdena.
create table if not exists public.policy_history (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.policy_history enable row level security;

drop policy if exists "policy_history_select_own_or_employee" on public.policy_history;
create policy "policy_history_select_own_or_employee" on public.policy_history
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.employees where email = auth.jwt() ->> 'email')
  );

drop policy if exists "policy_history_insert_own" on public.policy_history;
create policy "policy_history_insert_own" on public.policy_history
  for insert with check (auth.uid() = user_id);

create index if not exists idx_policy_history_item_id on public.policy_history(item_id);

-- Samlad hushållsvy (21-punktsplanen): bara AGGREGAT över hela hushållet
-- (antal medlemmar, total månadskostnad, antal saker per kind) — aldrig
-- enskilda medlemmars poster/priser en och en, av samma skäl som
-- referral-räknefunktionerna: en medlem ska kunna se att hushållet
-- tillsammans har t.ex. 6 saker och betalar 2 400 kr/mån utan att kunna
-- baklänges räkna ut exakt vad en NAMNGIVEN medlem har eller betalar för
-- en enskild sak. Läser bara den inloggades EGET household_id (aldrig ett
-- klient-skickat id), samma säkerhetsmönster som get_my_household().
create or replace function public.get_household_summary()
returns table(member_count int, total_monthly_cost numeric, kind_counts jsonb)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_household_id uuid;
begin
  select household_id into v_household_id from public.profiles where id = auth.uid();
  if v_household_id is null then
    return query select 0, 0::numeric, '{}'::jsonb;
    return;
  end if;

  return query
    select
      (select count(*)::int from public.profiles where household_id = v_household_id),
      coalesce((
        select sum((p.data->>'price')::numeric)
        from public.policies p
        where p.user_id in (select id from public.profiles where household_id = v_household_id)
      ), 0),
      coalesce((
        select jsonb_object_agg(k.kind, k.cnt) from (
          select kind, count(*) as cnt
          from public.items
          where user_id in (select id from public.profiles where household_id = v_household_id)
          group by kind
        ) k
      ), '{}'::jsonb);
end;
$$;

-- Hushållsmedlemmarnas FAKTISKA saker (inte bara aggregat, till skillnad
-- från get_household_summary ovan) — Gledis rapporterade att en kopplad
-- hushållsmedlems försäkringar "inte dyker upp" någonstans, vilket
-- stämmer: den ursprungliga hushålls-vyn visade bara summerade tal av
-- försiktighetsskäl. Efter dubbelt godkännande (household_requests) är
-- medlemmarna redan bekräftade familjemedlemmar, så att visa VILKA saker
-- de har (kind + sammanfattning + pris) är rimligt — precis vad ett
-- hushåll är till för. Fortfarande aldrig personnummer/telefon/mejl,
-- bara namn (samma fält som get_my_household() redan exponerar).
create or replace function public.get_household_items()
returns table(member_user_id uuid, member_name text, kind text, data jsonb, price numeric)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_household_id uuid;
begin
  select household_id into v_household_id from public.profiles where id = auth.uid();
  if v_household_id is null then
    return;
  end if;

  return query
    select i.user_id, p.name, i.kind, i.data,
      (select (pol.data->>'price')::numeric from public.policies pol where pol.item_id = i.id)
    from public.items i
    join public.profiles p on p.id = i.user_id
    where i.user_id in (select id from public.profiles where household_id = v_household_id)
    order by p.name, i.kind;
end;
$$;

-- Uppdaterad för att stödja en klickbar, skrivskyddad detaljvy per
-- hushållsmedlems sak (Dashboard.tsx/ItemDetail.tsx) — samma
-- "Nuvarande villkor"-rader (bolag, pris, omfattning, självrisk osv) som
-- kundens egna saker visar, inte bara en bar prissiffra. Måste droppas
-- och skapas om eftersom returtypen (price numeric → policy jsonb) inte
-- går att ändra med bara create or replace.
drop function if exists public.get_household_items();
create function public.get_household_items()
returns table(member_user_id uuid, member_name text, kind text, data jsonb, policy jsonb)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_household_id uuid;
begin
  select household_id into v_household_id from public.profiles where id = auth.uid();
  if v_household_id is null then
    return;
  end if;

  return query
    select i.user_id, p.name, i.kind, i.data,
      (select pol.data from public.policies pol where pol.item_id = i.id)
    from public.items i
    join public.profiles p on p.id = i.user_id
    where i.user_id in (select id from public.profiles where household_id = v_household_id)
    order by p.name, i.kind;
end;
$$;

-- Notisinställningar (Inställningar-sidan) — låg tidigare bara i lokalt
-- komponent-state i SettingsPage.tsx och sparades aldrig, så ändringar
-- försvann vid nästa inloggning. Vanliga profilkolumner, samma mönster
-- som email ovan.
alter table public.profiles add column if not exists notify_email boolean not null default true;
alter table public.profiles add column if not exists notify_sms boolean not null default false;
alter table public.profiles add column if not exists language text not null default 'sv';

-- Fullmakt-historik (Dokumentarkivet) — profiles.fullmakt_signed_at/
-- fullmakt_pdf_path håller bara den SENASTE signeringen (ett upsert),
-- precis som policies gjorde innan policy_history fanns. Samma
-- tillskrivande logg-mönster här: en rad per signering, aldrig skrivs
-- över. FullmaktSigning.tsx sparar numera varje PDF under ett unikt
-- filnamn (fullmakt-<timestamp>.pdf) istället för att skriva över
-- samma fil, så historiken faktiskt har riktiga filer att peka på.
create table if not exists public.fullmakt_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pdf_path text not null,
  signed_at timestamptz not null default now()
);

alter table public.fullmakt_history enable row level security;

drop policy if exists "fullmakt_history_select_own_or_employee" on public.fullmakt_history;
create policy "fullmakt_history_select_own_or_employee" on public.fullmakt_history
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.employees where email = auth.jwt() ->> 'email')
  );

drop policy if exists "fullmakt_history_insert_own" on public.fullmakt_history;
create policy "fullmakt_history_insert_own" on public.fullmakt_history
  for insert with check (auth.uid() = user_id);

-- Skadeärenden: ersätter det binära ny/hanterad med ett riktigt
-- statusspår (mottagen → under_utredning → godkand/nekad → utbetald), se
-- claim.ts. Befintliga rader migreras rakt av: "ny" har alltid betytt att
-- inget hänt än, "hanterad" har betytt "klar" utan att skilja på utfall —
-- närmaste rimliga nya värde är "godkand".
update public.claims set status = 'mottagen' where status = 'ny';
update public.claims set status = 'godkand' where status = 'hanterad';
alter table public.claims alter column status set default 'mottagen';
alter table public.claims drop constraint if exists claims_status_check;
alter table public.claims add constraint claims_status_check
  check (status in ('mottagen', 'under_utredning', 'godkand', 'nekad', 'utbetald'));

-- Låter en hushållsmedlem koppla loss en ANNAN medlem. Symmetriskt med
-- avsikt — hushållsmodellen har inget ägar-/adminbegrepp, vem som helst
-- av medlemmarna kan ta bort vem som helst annan (bekräftat val, se
-- HouseholdView.tsx). SECURITY DEFINER eftersom en klient annars inte får
-- skriva till en annan användares profiles-rad; verifierar att båda
-- faktiskt delar samma hushåll innan något ändras, så en medlem aldrig
-- kan koppla loss en godtycklig annan användare.
create or replace function public.remove_household_member(member_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_my_household_id uuid;
  v_member_household_id uuid;
begin
  if member_id = auth.uid() then
    return false;
  end if;

  select household_id into v_my_household_id from public.profiles where id = auth.uid();
  select household_id into v_member_household_id from public.profiles where id = member_id;

  if v_my_household_id is null or v_my_household_id <> v_member_household_id then
    return false;
  end if;

  update public.profiles
  set household_id = null, household_relation = null
  where id = member_id;

  return true;
end;
$$;

-- REGRESSION FIX: den senaste handle_new_user()-versionen som faktiskt
-- kördes live (signup-telefon-personnummer.sql, för att spara
-- telefonnummer/personnummer vid registrering) byggde på en ÄLDRE kopia av
-- funktionen från innan referral_events-omskrivningen längre upp i den här
-- filen — den skriver fortfarande profiles.referred_by, men saknar
-- INSERT-satsen till referral_events. Eftersom count_referral_signups()/
-- count_qualified_referrals() bara läser från referral_events numera (inte
-- profiles.referred_by), gjorde det att värvningskoden "verkade" fungera
-- (signupen gick igenom, referred_by sattes) men aldrig räknades någonstans
-- — det bugreport gällde. Den här versionen är en sammanslagning: samma
-- phone/personnummer-insert som fixen ovan, plus referral_events-raden som
-- tappades bort.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_referrer_id uuid;
begin
  if new.raw_user_meta_data->>'referral_code_used' is not null then
    select id into v_referrer_id from public.profiles
    where referral_code = upper(new.raw_user_meta_data->>'referral_code_used')
    limit 1;
  end if;

  insert into public.profiles (id, user_type, name, email, phone, personnummer, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_type', 'privat'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'personnummer', ''),
    v_referrer_id
  );

  if v_referrer_id is not null then
    insert into public.referral_events (referrer_id, referred_id) values (v_referrer_id, new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Medarbetarprofil (internverktyget, EmployeeProfile.tsx) — nya profilfält
-- på employees, en inloggningslogg, och en publik bucket för profilbilder.
alter table public.employees add column if not exists avatar_path text;
alter table public.employees add column if not exists title text;
alter table public.employees add column if not exists phone text;
alter table public.employees add column if not exists department text;
alter table public.employees add column if not exists permission_level text not null default 'handlaggare';
alter table public.employees add column if not exists hired_at date;
alter table public.employees add column if not exists status text not null default 'aktiv';
alter table public.employees add column if not exists responsibilities text;
alter table public.employees add column if not exists specialties text;
alter table public.employees add column if not exists languages text;
alter table public.employees add column if not exists working_hours text;
alter table public.employees add column if not exists signature text;
-- Kalenderkoppling är en demo i det här läget (ingen riktig Teams/Outlook-
-- integration) — se EmployeeProfile.tsx. Sparar bara vilken leverantör
-- som "anslutits" så kopplingen består mellan sessioner.
alter table public.employees add column if not exists calendar_connected_provider text;

-- Tidigare fanns bara SELECT på sin egen rad — inget sätt för en anställd
-- att uppdatera sin egen profil. Coarse-grained (hela raden) — appens UI
-- håller ändå permission_level/hired_at read-only istället för att
-- försöka spärra enskilda kolumner här (Postgres RLS gör inte
-- kolumn-nivå-spärrning enkelt utan triggers, överkurs för det här läget).
drop policy if exists "employees_update_own" on public.employees;
create policy "employees_update_own" on public.employees
  for update using (email = auth.jwt() ->> 'email')
  with check (email = auth.jwt() ->> 'email');

-- Inloggningshistorik — en rad per gång en anställd öppnar internverktyget
-- (skrivs klientsidan i InternalView.tsx, inte ett riktigt auth-event-
-- register — manipulerbart av klienten om man verkligen ville, samma
-- avvägning som appens övriga simulerade integrationer).
create table if not exists public.employee_login_log (
  id uuid primary key default gen_random_uuid(),
  employee_email text not null references public.employees(email),
  logged_in_at timestamptz not null default now()
);
alter table public.employee_login_log enable row level security;

drop policy if exists "employee_login_log_insert_own" on public.employee_login_log;
create policy "employee_login_log_insert_own" on public.employee_login_log
  for insert with check (employee_email = auth.jwt() ->> 'email');

drop policy if exists "employee_login_log_select_own" on public.employee_login_log;
create policy "employee_login_log_select_own" on public.employee_login_log
  for select using (employee_email = auth.jwt() ->> 'email');

-- Profilbilder — en fil per anställd (skrivs över vid ny uppladdning, till
-- skillnad från fullmakter där historik är poängen). Publik bucket
-- eftersom en profilbild är lågkänslig, till skillnad från
-- fullmakts-PDF:er — så en enkel getPublicUrl räcker.
insert into storage.buckets (id, name, public) values ('employee-avatars', 'employee-avatars', true)
  on conflict (id) do nothing;

drop policy if exists "employee_avatar_write_own" on storage.objects;
create policy "employee_avatar_write_own" on storage.objects
  for insert with check (bucket_id = 'employee-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "employee_avatar_update_own" on storage.objects;
create policy "employee_avatar_update_own" on storage.objects
  for update using (bucket_id = 'employee-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Dashboard (internverktyget, EmployeeDashboard.tsx) — en vy som låter
-- anställda se varandras namn/titel/avdelning/status/profilbild för
-- "Teamets status". Avsiktlig ändring av tidigare beslut: employees hade
-- innan bara "employees_select_own", specifikt för att en anställd
-- ALDRIG skulle kunna räkna upp vilka andra som är anställda. Bekräftat
-- 2026-08-20 att det är okej att vända på det för den här funktionen —
-- vyn exponerar medvetet INTE phone/hired_at/permission_level/signature
-- m.m., bara det som behövs för en teamöversikt.
create or replace view public.employee_directory as
select email, name, title, department, status, avatar_path
from public.employees
where exists (select 1 from public.employees e2 where e2.email = auth.jwt() ->> 'email');

grant select on public.employee_directory to authenticated;

-- Kundhantering (internverktyget) — kundstatus/segment/taggar på
-- profiles, samt interna kommentarer PER ÄRENDE (skiljer sig från
-- customer_notes som är skopat till hela kunden).
alter table public.profiles add column if not exists customer_status text not null default 'aktiv';
alter table public.profiles add column if not exists segment text;
alter table public.profiles add column if not exists tags text[] not null default '{}';

create table if not exists public.case_comments (
  id uuid primary key default gen_random_uuid(),
  case_type text not null check (case_type in ('booking', 'claim')),
  case_id uuid not null,
  author_email text not null references public.employees(email),
  comment text not null,
  created_at timestamptz not null default now()
);
alter table public.case_comments enable row level security;

drop policy if exists "case_comments_insert_employee" on public.case_comments;
create policy "case_comments_insert_employee" on public.case_comments
  for insert with check (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

drop policy if exists "case_comments_select_employee" on public.case_comments;
create policy "case_comments_select_employee" on public.case_comments
  for select using (exists (select 1 from public.employees where email = auth.jwt() ->> 'email'));

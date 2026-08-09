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
  status text not null default 'ny' check (status in ('ny', 'hanterad')),
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
  status text not null default 'ny' check (status in ('ny', 'hanterad')),
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
-- user_type och name skickas med som user-metadata vid signup, liksom en
-- ev. angiven värvningskod (referral_code_used) som slås upp till ett
-- riktigt användar-id här.
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

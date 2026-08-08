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

-- Skapar automatiskt en profiles-rad när någon registrerar sig.
-- user_type och name skickas med som user-metadata vid signup.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_type, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_type', 'privat'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lägg till dig själv som anställd (byt ut e-postadressen):
-- insert into public.employees (email) values ('din@epost.se')
--   on conflict (email) do nothing;

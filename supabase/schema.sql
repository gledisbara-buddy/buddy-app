-- Buddy: persistens-schema. Kör hela detta skript i Supabase → SQL Editor.
-- Skapar tre tabeller (profiles, items, policies) med Row Level Security
-- så varje användare bara kan se och ändra sin egen data.

create extension if not exists pgcrypto;

-- profiles: en rad per användare, skapas automatiskt vid registrering (se trigger längst ner)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_type text not null default 'privat' check (user_type in ('privat', 'foretag')),
  name text not null default '',
  priority text,
  personnummer text,
  phone text,
  ready_to_compare boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

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

create policy "policies_all_own" on public.policies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Skapar automatiskt en profiles-rad när någon registrerar sig.
-- user_type och name skickas med som user-metadata vid signup.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_type, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_type', 'privat'),
    coalesce(new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

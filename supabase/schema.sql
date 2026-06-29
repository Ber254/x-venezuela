-- ============================================================
-- Parcuve Sin Fronteras — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension (already enabled in Supabase)
-- create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────────
-- Extends auth.users with app-level fields
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text not null,
  role        text not null check (role in ('superadmin','admin','psic','user')),
  specialty   text,
  color       text,                -- hex color for psicólogos
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile; admins/superadmins read all
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: admin read all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','superadmin')
    )
  );

create policy "profiles: psic read all psics and self"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'psic'
    )
  );

create policy "profiles: superadmin full"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'superadmin'
    )
  );

create policy "profiles: admin insert psic/user"
  on public.profiles for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','superadmin')
    )
  );

create policy "profiles: admin update psic/user"
  on public.profiles for update
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','superadmin')
    )
  );

-- ─── AVAILABILITY ────────────────────────────────────────────
create table if not exists public.availability (
  id          uuid primary key default gen_random_uuid(),
  psic_id     uuid not null references public.profiles(id) on delete cascade,
  days        int[] not null,                     -- array of day-of-week integers
  shifts      jsonb not null,                     -- [{start: "09:00", end: "12:00"}, ...]
  valid_from  date not null,
  valid_until date not null,
  created_at  timestamptz not null default now(),
  constraint valid_dates check (valid_from <= valid_until)
);

alter table public.availability enable row level security;

create policy "availability: all authenticated read"
  on public.availability for select
  using (auth.role() = 'authenticated');

create policy "availability: admin/superadmin write"
  on public.availability for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','superadmin')
    )
  );

-- ─── BOOKINGS ────────────────────────────────────────────────
create table if not exists public.bookings (
  id                 uuid primary key default gen_random_uuid(),
  date               date not null,
  hour               text not null check (hour ~ '^[0-2][0-9]:00$'),
  psic_id            uuid not null references public.profiles(id),
  patient_id         uuid not null references public.profiles(id),
  meet_link          text,
  calendar_event_id  text,
  created_at         timestamptz not null default now(),
  constraint unique_slot unique (date, hour, psic_id)
);

alter table public.bookings enable row level security;

-- Patients see their own bookings
create policy "bookings: patient read own"
  on public.bookings for select
  using (auth.uid() = patient_id);

-- Psics see bookings where they are the provider
create policy "bookings: psic read own"
  on public.bookings for select
  using (auth.uid() = psic_id);

-- Admins see all
create policy "bookings: admin read all"
  on public.bookings for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','superadmin')
    )
  );

-- Patients create their own bookings (server validates quota)
create policy "bookings: patient insert own"
  on public.bookings for insert
  with check (auth.uid() = patient_id);

-- Patient or admin can cancel
create policy "bookings: patient/admin delete"
  on public.bookings for delete
  using (
    auth.uid() = patient_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','superadmin')
    )
  );

-- Server-side (service role) update for meet_link
create policy "bookings: service role update"
  on public.bookings for update
  using (true);

-- ─── ABSENCES ────────────────────────────────────────────────
create table if not exists public.absences (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null unique references public.bookings(id) on delete cascade,
  date            date not null,
  hour            text not null,
  psic_id         uuid not null references public.profiles(id),
  patient_id      uuid not null references public.profiles(id),
  patient_name    text not null,
  patient_email   text not null,
  registered_by   uuid not null references public.profiles(id),
  registered_at   timestamptz not null default now()
);

alter table public.absences enable row level security;

create policy "absences: psic read own"
  on public.absences for select
  using (auth.uid() = psic_id);

create policy "absences: admin read all"
  on public.absences for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','superadmin')
    )
  );

create policy "absences: psic insert own"
  on public.absences for insert
  with check (auth.uid() = psic_id);

create policy "absences: psic delete own"
  on public.absences for delete
  using (auth.uid() = psic_id);

-- ─── TRIGGER: auto-create profile on signup ──────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── SEED: SuperAdmin ─────────────────────────────────────────
-- Create via Supabase Auth Dashboard or CLI, then run:
-- insert into public.profiles (id, email, full_name, role)
-- values ('<auth-user-uuid>', 'super@x-venezuela.org', 'SuperAdmin', 'superadmin');

-- Moxera Connect additive migration.
-- SAFE: creates only moxera_* objects and does not alter existing tables.
create extension if not exists pgcrypto;

create table if not exists public.moxera_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text not null unique,
  phone text not null,
  email text not null,
  country text not null,
  status text not null default 'pending' check (status in ('pending','active','banned','inactive')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','rejected')),
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.moxera_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.moxera_users(id) on delete cascade,
  amount numeric(14,2) not null default 16000,
  currency text not null default 'TZS',
  provider text not null default 'activation',
  reference text,
  external_order_id text,
  transaction_id text,
  status text not null default 'pending' check (status in ('pending','paid','failed','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.moxera_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.moxera_users(id) on delete cascade,
  title text not null,
  message text not null,
  is_broadcast boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.moxera_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.moxera_payments add column if not exists transaction_id text;

create index if not exists moxera_payments_user_idx on public.moxera_payments(user_id);
create index if not exists moxera_notifications_user_idx on public.moxera_notifications(user_id, created_at desc);

alter table public.moxera_users enable row level security;
alter table public.moxera_payments enable row level security;
alter table public.moxera_notifications enable row level security;
alter table public.moxera_admins enable row level security;

create or replace function public.moxera_is_admin()
returns boolean
language sql stable security definer set search_path=public
as $$ select exists (select 1 from public.moxera_admins a where a.user_id = auth.uid()); $$;

drop policy if exists "moxera users own select" on public.moxera_users;
create policy "moxera users own select" on public.moxera_users for select using (id = auth.uid() or public.moxera_is_admin());

drop policy if exists "moxera users own insert" on public.moxera_users;
create policy "moxera users own insert" on public.moxera_users for insert with check (id = auth.uid());

drop policy if exists "moxera users own update" on public.moxera_users;
create policy "moxera users own update" on public.moxera_users for update using (id = auth.uid() or public.moxera_is_admin()) with check (id = auth.uid() or public.moxera_is_admin());

drop policy if exists "moxera payments own select" on public.moxera_payments;
create policy "moxera payments own select" on public.moxera_payments for select using (user_id = auth.uid() or public.moxera_is_admin());

drop policy if exists "moxera payments own insert" on public.moxera_payments;
create policy "moxera payments own insert" on public.moxera_payments for insert with check (user_id = auth.uid());

drop policy if exists "moxera payments admin update" on public.moxera_payments;
create policy "moxera payments admin update" on public.moxera_payments for update using (public.moxera_is_admin()) with check (public.moxera_is_admin());

drop policy if exists "moxera notifications own select" on public.moxera_notifications;
create policy "moxera notifications own select" on public.moxera_notifications for select using (user_id = auth.uid() or is_broadcast = true or public.moxera_is_admin());

drop policy if exists "moxera notifications own update" on public.moxera_notifications;
create policy "moxera notifications own update" on public.moxera_notifications for update using (user_id = auth.uid() or public.moxera_is_admin()) with check (user_id = auth.uid() or public.moxera_is_admin());

drop policy if exists "moxera notifications admin insert" on public.moxera_notifications;
create policy "moxera notifications admin insert" on public.moxera_notifications for insert with check (public.moxera_is_admin());

drop policy if exists "moxera admins self select" on public.moxera_admins;
create policy "moxera admins self select" on public.moxera_admins for select using (user_id = auth.uid());

-- After creating the admin account in Supabase Auth, insert it here:
-- insert into public.moxera_admins(user_id,email) values ('AUTH-USER-UUID','admin@example.com');

-- Run this migration in Supabase SQL Editor as project owner.
-- Fixes REST permission-denied errors and aligns withdrawal history/admin fields.

alter table public.moxera_withdrawals
  add column if not exists admin_remark text,
  add column if not exists reviewed_by uuid,
  add column if not exists admin_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists paid_at timestamptz;

-- Keep old admin_note and new admin_remark compatible for existing rows.
update public.moxera_withdrawals
set admin_remark = coalesce(admin_remark, admin_note)
where admin_remark is null and admin_note is not null;

-- RLS policies control which rows can be accessed; SQL grants are also required.
grant select on table public.moxera_withdrawals to authenticated;
grant update on table public.moxera_withdrawals to authenticated;
grant select on table public.moxera_earnings to authenticated;
grant select, update on table public.moxera_users to authenticated;

-- Ensure policy names are present and use the existing admin-check function.
alter table public.moxera_withdrawals enable row level security;
drop policy if exists "moxera withdrawals own read" on public.moxera_withdrawals;
create policy "moxera withdrawals own read" on public.moxera_withdrawals
  for select to authenticated
  using (user_id = auth.uid() or public.moxera_is_admin());
drop policy if exists "moxera withdrawals admin update" on public.moxera_withdrawals;
create policy "moxera withdrawals admin update" on public.moxera_withdrawals
  for update to authenticated
  using (public.moxera_is_admin())
  with check (public.moxera_is_admin());

alter table public.moxera_earnings enable row level security;
drop policy if exists "moxera earnings own read" on public.moxera_earnings;
create policy "moxera earnings own read" on public.moxera_earnings
  for select to authenticated
  using (user_id = auth.uid() or public.moxera_is_admin());

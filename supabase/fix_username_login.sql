-- Moxera username-login fix. Safe/additive: does not change existing tables or RLS.
-- Username lookup is performed server-side because users are not authenticated yet.
create or replace function public.moxera_login_email_by_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from public.moxera_users as u
  where lower(u.username) = lower(trim(p_username))
  limit 1;
$$;

revoke all on function public.moxera_login_email_by_username(text) from public;
grant execute on function public.moxera_login_email_by_username(text) to anon, authenticated;

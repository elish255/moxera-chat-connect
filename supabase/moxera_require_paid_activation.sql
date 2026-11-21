-- New signups start as pending; only payment confirmation (service role) or an admin can activate.
create or replace function public.moxera_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referrer_id uuid;
  v_referral_code text;
begin
  v_referral_code := nullif(btrim(new.raw_user_meta_data ->> 'referral_code'), '');

  if v_referral_code is not null then
    select u.id into v_referrer_id
    from public.moxera_users as u
    where lower(u.referral_code) = lower(v_referral_code)
      and u.id <> new.id
    limit 1;
  end if;

  insert into public.moxera_users (
    id, full_name, username, phone, email, country, status, payment_status, referred_by
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Moxera User'),
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'user_' || substr(replace(new.id::text, '-', ''), 1, 8)),
    coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), ''),
    lower(new.email),
    coalesce(nullif(new.raw_user_meta_data ->> 'country', ''), 'Tanzania'),
    'pending',
    'unpaid',
    v_referrer_id
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    email = excluded.email,
    country = excluded.country,
    updated_at = now();

  return new;
end;
$$;

-- Users talking to the API directly cannot change their own account state.
create or replace function public.moxera_protect_account_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if session_user = 'authenticator' and current_user in ('authenticated', 'anon') and not public.moxera_is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.payment_status := 'unpaid';
      new.balance := 0;
      new.membership_level := 'normal';
      new.paid_at := null;
    elsif new.status is distinct from old.status
       or new.payment_status is distinct from old.payment_status
       or new.balance is distinct from old.balance
       or new.membership_level is distinct from old.membership_level
       or new.paid_at is distinct from old.paid_at then
      raise exception 'Huna ruhusa kubadilisha hali ya account.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists moxera_protect_account_fields on public.moxera_users;
create trigger moxera_protect_account_fields
before insert or update on public.moxera_users
for each row execute function public.moxera_protect_account_fields();

-- Only active users can message customer service.
drop policy if exists moxera_support_messages_insert on public.moxera_support_messages;
create policy moxera_support_messages_insert on public.moxera_support_messages
for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and (
    (sender_role = 'user' and user_id = (select auth.uid()) and exists (
      select 1 from public.moxera_users u where u.id = (select auth.uid()) and u.status = 'active'
    ))
    or (sender_role = 'admin' and public.moxera_is_admin())
  )
);

begin;

alter table public.moxera_users
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.moxera_users(id) on delete set null;

update public.moxera_users
set referral_code = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
where referral_code is null or btrim(referral_code) = '';

alter table public.moxera_users
  alter column referral_code set default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  alter column referral_code set not null;

create unique index if not exists moxera_users_referral_code_key
  on public.moxera_users (referral_code);

create index if not exists moxera_users_referred_by_idx
  on public.moxera_users (referred_by)
  where referred_by is not null;

create or replace function public.moxera_sync_invited_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referrer_id uuid;
begin
  if tg_op = 'DELETE' then
    v_referrer_id := old.referred_by;
  else
    v_referrer_id := new.referred_by;
  end if;

  if v_referrer_id is not null then
    update public.moxera_users
    set invited_count = (
      select count(*)::integer
      from public.moxera_users
      where referred_by = v_referrer_id
    )
    where id = v_referrer_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists moxera_sync_invited_count on public.moxera_users;
create trigger moxera_sync_invited_count
after insert or delete on public.moxera_users
for each row execute function public.moxera_sync_invited_count();

create or replace function public.moxera_protect_referral_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      if new.referred_by is not null or new.invited_count <> 0 then
        raise exception using errcode = '42501', message = 'Referral fields are system managed.';
      end if;
    elsif new.invited_count is distinct from old.invited_count
      or new.referral_code is distinct from old.referral_code
      or new.referred_by is distinct from old.referred_by then
      raise exception using errcode = '42501', message = 'Referral fields are system managed.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists moxera_protect_referral_fields on public.moxera_users;
create trigger moxera_protect_referral_fields
before insert or update of invited_count, referral_code, referred_by on public.moxera_users
for each row execute function public.moxera_protect_referral_fields();

create or replace function public.moxera_get_referral_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.moxera_users
  where referred_by = auth.uid();
$$;

revoke all on function public.moxera_get_referral_count() from public;
grant execute on function public.moxera_get_referral_count() to authenticated;

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
    'active',
    'unpaid',
    v_referrer_id
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    email = excluded.email,
    country = excluded.country,
    status = case when public.moxera_users.status = 'banned' then 'banned' else 'active' end,
    updated_at = now();

  return new;
end;
$$;

commit;

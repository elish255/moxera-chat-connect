-- Run once before deploying SMS recovery. Only the service role can use these objects.
create table if not exists public.moxera_sms_recovery (
  id uuid primary key,
  phone text not null,
  ip_hash text not null,
  user_id uuid references auth.users(id) on delete cascade,
  code_hash text not null,
  grant_hash text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '5 minutes',
  attempts integer not null default 0,
  delivered boolean not null default false,
  verified boolean not null default false,
  consumed boolean not null default false
);
alter table public.moxera_sms_recovery enable row level security;
revoke all on public.moxera_sms_recovery from anon, authenticated;
create index if not exists moxera_sms_recovery_created on public.moxera_sms_recovery(created_at);
create index if not exists moxera_sms_recovery_phone on public.moxera_sms_recovery(phone, created_at);
create index if not exists moxera_sms_recovery_ip on public.moxera_sms_recovery(ip_hash, created_at);

-- Match existing Tanzanian formats without changing a user's saved profile.
create or replace function public.moxera_recovery_phone(p_phone text)
returns text language sql immutable set search_path = '' as $$
  select case
    when x ~ '^0[67][0-9]{8}$' then '255' || substr(x, 2)
    when x ~ '^[67][0-9]{8}$' then '255' || x
    when x ~ '^00255[67][0-9]{8}$' then substr(x, 3)
    else x end
  from (select regexp_replace(p_phone, '[^0-9]', '', 'g') x) s;
$$;

create or replace function public.moxera_issue_sms_recovery(p_id uuid, p_phone text, p_ip_hash text, p_code_hash text)
returns table(accepted boolean, recipient boolean)
language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_count integer;
begin
  -- Serialize issuance across instances so limits cannot race.
  perform pg_advisory_xact_lock(73194621);
  delete from public.moxera_sms_recovery where created_at < now() - interval '1 day';
  if exists(select 1 from public.moxera_sms_recovery where phone=p_phone and created_at > now()-interval '60 seconds')
     or (select count(*) from public.moxera_sms_recovery where phone=p_phone and created_at>now()-interval '1 hour') >= 5
     or (select count(*) from public.moxera_sms_recovery where ip_hash=p_ip_hash and created_at>now()-interval '1 hour') >= 10
     or (select count(*) from public.moxera_sms_recovery where created_at>now()-interval '1 hour') >= 200 then
    return query select false, false; return;
  end if;
  select count(*), (array_agg(id))[1] into v_count, v_user from public.moxera_users
    where public.moxera_recovery_phone(phone)=p_phone;
  -- Never guess which account a shared/duplicate phone belongs to.
  if v_count <> 1 then v_user := null; end if;
  update public.moxera_sms_recovery set consumed=true where phone=p_phone and not consumed;
  insert into public.moxera_sms_recovery(id, phone, ip_hash, user_id, code_hash)
    values(p_id, p_phone, p_ip_hash, v_user, p_code_hash);
  return query select true, v_user is not null;
end;
$$;

create or replace function public.moxera_verify_sms_recovery(p_id uuid, p_code_hash text, p_grant_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare r public.moxera_sms_recovery%rowtype;
begin
  select * into r from public.moxera_sms_recovery where id=p_id for update;
  if not found or r.consumed or not r.delivered or r.verified or r.expires_at<=now() or r.attempts>=5 then return false; end if;
  update public.moxera_sms_recovery set attempts=attempts+1 where id=p_id;
  if r.user_id is null or r.code_hash<>p_code_hash then return false; end if;
  update public.moxera_sms_recovery set verified=true, grant_hash=p_grant_hash,
    expires_at=now()+interval '5 minutes' where id=p_id;
  return true;
end;
$$;

create or replace function public.moxera_consume_sms_recovery(p_id uuid, p_grant_hash text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r public.moxera_sms_recovery%rowtype; v_count integer;
begin
  select * into r from public.moxera_sms_recovery where id=p_id for update;
  if not found or r.consumed or not r.verified or r.expires_at<=now() or r.grant_hash<>p_grant_hash then return null; end if;
  update public.moxera_sms_recovery set consumed=true where id=p_id;
  -- Recheck ownership mapping: reject changed numbers and newly introduced duplicates.
  select count(*) into v_count from public.moxera_users where public.moxera_recovery_phone(phone)=r.phone;
  if v_count<>1 or not exists(select 1 from public.moxera_users where id=r.user_id and public.moxera_recovery_phone(phone)=r.phone) then return null; end if;
  return r.user_id;
end;
$$;

revoke all on function public.moxera_recovery_phone(text) from public, anon, authenticated;
revoke all on function public.moxera_issue_sms_recovery(uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.moxera_verify_sms_recovery(uuid,text,text) from public, anon, authenticated;
revoke all on function public.moxera_consume_sms_recovery(uuid,text) from public, anon, authenticated;
grant execute on function public.moxera_recovery_phone(text) to service_role;
grant execute on function public.moxera_issue_sms_recovery(uuid,text,text,text) to service_role;
grant execute on function public.moxera_verify_sms_recovery(uuid,text,text) to service_role;
grant execute on function public.moxera_consume_sms_recovery(uuid,text) to service_role;

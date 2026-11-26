begin;

alter table public.moxera_users
  add column if not exists activation_push_count integer not null default 0,
  add column if not exists activation_blocked_at timestamptz;

create or replace function public.moxera_reserve_activation_push(p_user_id uuid)
returns table (attempt_count integer, is_blocked boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_blocked_at timestamptz;
  v_payment_status text;
begin
  select u.activation_push_count, u.activation_blocked_at, u.payment_status
    into v_count, v_blocked_at, v_payment_status
  from public.moxera_users as u
  where u.id = p_user_id
  for update;

  if not found then
    raise exception 'User profile not found.' using errcode = 'P0002';
  end if;

  if v_blocked_at is not null then
    return query select v_count, true;
    return;
  end if;

  if v_payment_status = 'paid' then
    return query select v_count, false;
    return;
  end if;

  v_count := v_count + 1;
  if v_count >= 4 then
    update public.moxera_users
    set activation_push_count = v_count,
        activation_blocked_at = now(),
        updated_at = now()
    where id = p_user_id;
    return query select v_count, true;
    return;
  end if;

  update public.moxera_users
  set activation_push_count = v_count,
      updated_at = now()
  where id = p_user_id;

  return query select v_count, false;
end;
$$;

create or replace function public.moxera_protect_account_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() in ('authenticated', 'anon') and not public.moxera_is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.payment_status := 'unpaid';
      new.balance := 0;
      new.membership_level := 'normal';
      new.paid_at := null;
      new.activation_push_count := 0;
      new.activation_blocked_at := null;
    elsif new.status is distinct from old.status
       or new.payment_status is distinct from old.payment_status
       or new.balance is distinct from old.balance
       or new.membership_level is distinct from old.membership_level
       or new.paid_at is distinct from old.paid_at
       or new.activation_push_count is distinct from old.activation_push_count
       or new.activation_blocked_at is distinct from old.activation_blocked_at then
      raise exception 'Huna ruhusa kubadilisha hali ya account.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.moxera_reserve_activation_push(uuid) from public, anon, authenticated;
grant execute on function public.moxera_reserve_activation_push(uuid) to service_role;

commit;

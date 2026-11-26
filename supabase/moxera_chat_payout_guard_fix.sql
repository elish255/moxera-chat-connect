-- Allow only the trusted chat-payout RPC to update wallet balance while preserving the account-field guard.
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
       or (
         new.balance is distinct from old.balance
         and pg_catalog.current_setting('moxera.chat_payout', true) is distinct from 'on'
       )
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

create or replace function public.moxera_complete_chat(p_foreigner_id text,p_amount numeric,p_chat_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_inserted integer;
  v_expected_amount numeric;
begin
  if v_user is null then raise exception 'Tafadhali ingia tena.'; end if;
  if length(coalesce(p_chat_key,'')) < 8 then raise exception 'Taarifa za chat si sahihi.'; end if;

  v_expected_amount := case p_foreigner_id
    when 'william' then 49500
    when 'jonathan' then 48000
    when 'amelia' then 41500
    when 'oliver' then 52000
    when 'chloe' then 44000
    when 'luca' then 46500
    when 'nora' then 39500
    when 'ethan' then 54500
    when 'mia' then 43000
    when 'harry' then 51000
    when 'elise' then 45500
    when 'noah' then 47500
    when 'liam' then 50500
    when 'clara' then 44500
    when 'erik' then 53000
    when 'grace' then 48500
    when 'sebastian' then 52500
    when 'isabella' then 42000
    when 'lucas' then 46000
    when 'charlotte' then 45000
    when 'emma' then 38000
    when 'james' then 39500
    when 'sophie' then 41000
    when 'hans' then 42500
    when 'lucy' then 44000
    when 'marco' then 45500
    when 'anna' then 47000
    when 'david' then 48500
    else null
  end;
  if v_expected_amount is null or p_amount is distinct from v_expected_amount then
    raise exception 'Kiasi cha malipo ya chat si sahihi.' using errcode = '22023';
  end if;

  insert into public.moxera_earnings(user_id,foreigner_id,amount,chat_key)
  values(v_user,p_foreigner_id,v_expected_amount,p_chat_key)
  on conflict(user_id,chat_key) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then
    perform pg_catalog.set_config('moxera.chat_payout', 'on', true);
    update public.moxera_users
    set balance = coalesce(balance, 0) + v_expected_amount, updated_at = now()
    where id = v_user;
    if not found then raise exception 'Akaunti haikupatikana.'; end if;
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.moxera_complete_chat(text,numeric,text) from public, anon;
grant execute on function public.moxera_complete_chat(text,numeric,text) to authenticated;

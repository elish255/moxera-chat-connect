-- Additive migration for Moxera wallet, earnings, withdrawal requests and notifications.
-- Run in Supabase SQL Editor as project owner. Existing tables/functions are not dropped.
create table if not exists public.moxera_earnings (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.moxera_users(id) on delete cascade,
 foreigner_id text not null, amount numeric(14,2) not null check(amount > 0), chat_key text not null,
 created_at timestamptz not null default now(), unique(user_id, chat_key)
);
create table if not exists public.moxera_withdrawals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.moxera_users(id) on delete cascade,
 amount numeric(14,2) not null check(amount >= 50000), fee numeric(14,2) not null,
 net_amount numeric(14,2) not null, method text not null, account text not null,
 status text not null default 'pending' check(status in ('pending','approved','paid','rejected')),
 admin_note text, created_at timestamptz not null default now(), reviewed_at timestamptz, paid_at timestamptz
);
create index if not exists moxera_earnings_user_idx on public.moxera_earnings(user_id, created_at desc);
create index if not exists moxera_withdrawals_user_idx on public.moxera_withdrawals(user_id, created_at desc);
alter table public.moxera_earnings enable row level security;
alter table public.moxera_withdrawals enable row level security;
drop policy if exists "moxera earnings own read" on public.moxera_earnings;
create policy "moxera earnings own read" on public.moxera_earnings for select to authenticated using(user_id=auth.uid() or public.moxera_is_admin());
drop policy if exists "moxera withdrawals own read" on public.moxera_withdrawals;
create policy "moxera withdrawals own read" on public.moxera_withdrawals for select to authenticated using(user_id=auth.uid() or public.moxera_is_admin());
drop policy if exists "moxera withdrawals admin update" on public.moxera_withdrawals;
create policy "moxera withdrawals admin update" on public.moxera_withdrawals for update to authenticated using(public.moxera_is_admin()) with check(public.moxera_is_admin());
create or replace function public.moxera_request_withdrawal(p_amount numeric,p_method text,p_account text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid := auth.uid(); v_balance numeric; v_id uuid; v_fee numeric; v_level text;
begin
 if v_user is null then raise exception 'Tafadhali ingia tena.'; end if;
 
 if coalesce(trim(p_method),'')='' or coalesce(trim(p_account),'')='' then raise exception 'Weka njia na namba ya kupokea pesa.'; end if;
 select balance, lower(coalesce(membership_level,'normal')) into v_balance, v_level from public.moxera_users where id=v_user for update;
 if v_level = 'vip' and p_amount < 500000 then raise exception 'Kiwango cha chini cha withdrawal kwa VIP ni TZS 500,000.'; end if;
 if v_level <> 'vip' and p_amount < 50000 then raise exception 'Kiwango cha chini cha withdrawal ni TZS 50,000.'; end if;
 if v_balance is null or v_balance < p_amount then raise exception 'Insufficient Balance.'; end if;
 v_fee := round(p_amount*0.05,2);
 update public.moxera_users set balance=balance-p_amount,updated_at=now() where id=v_user;
 insert into public.moxera_withdrawals(user_id,amount,fee,net_amount,method,account)
 values(v_user,p_amount,v_fee,p_amount-v_fee,trim(p_method),trim(p_account)) returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.moxera_request_withdrawal(numeric,text,text) from public;
grant execute on function public.moxera_request_withdrawal(numeric,text,text) to authenticated;
-- Only a completed chat should be credited. A unique chat_key prevents duplicate payouts.
create or replace function public.moxera_complete_chat(p_foreigner_id text,p_amount numeric,p_chat_key text)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_user uuid := auth.uid(); v_inserted integer;
begin
 if v_user is null then raise exception 'Tafadhali ingia tena.'; end if;
 if p_amount <= 0 or length(coalesce(p_chat_key,'')) < 8 then raise exception 'Taarifa za chat si sahihi.'; end if;
 insert into public.moxera_earnings(user_id,foreigner_id,amount,chat_key) values(v_user,p_foreigner_id,p_amount,p_chat_key) on conflict(user_id,chat_key) do nothing;
 get diagnostics v_inserted = row_count;
 if v_inserted=1 then update public.moxera_users set balance=balance+p_amount,updated_at=now() where id=v_user; return true; end if;
 return false;
end; $$;
revoke all on function public.moxera_complete_chat(text,numeric,text) from public;
grant execute on function public.moxera_complete_chat(text,numeric,text) to authenticated;

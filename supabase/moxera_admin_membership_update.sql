-- Additive Moxera admin, membership, notifications and withdrawal enhancements.
-- Run after moxera_schema.sql and moxera_wallet_withdrawals.sql.
create extension if not exists pgcrypto;

alter table public.moxera_users add column if not exists membership_level text not null default 'normal';
alter table public.moxera_users add column if not exists paid_at timestamptz;
alter table public.moxera_users add column if not exists deactivated_at timestamptz;
alter table public.moxera_users add column if not exists invited_count integer not null default 0;
alter table public.moxera_users drop constraint if exists moxera_users_membership_level_check;
alter table public.moxera_users add constraint moxera_users_membership_level_check check (membership_level in ('normal','premium','vip'));

alter table public.moxera_payments add column if not exists plan text not null default 'activation';
alter table public.moxera_payments add column if not exists paid_at timestamptz;
alter table public.moxera_withdrawals add column if not exists admin_remark text;
alter table public.moxera_withdrawals add column if not exists reviewed_by uuid references auth.users(id);
create table if not exists public.moxera_balance_transactions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.moxera_users(id) on delete cascade,
 admin_id uuid not null references auth.users(id), amount numeric(14,2) not null check(amount <> 0), balance_before numeric(14,2) not null,
 balance_after numeric(14,2) not null, remark text not null, created_at timestamptz not null default now()
);
create index if not exists moxera_balance_transactions_user_idx on public.moxera_balance_transactions(user_id,created_at desc);
alter table public.moxera_balance_transactions enable row level security;
drop policy if exists "moxera balance transactions admin read" on public.moxera_balance_transactions;
create policy "moxera balance transactions admin read" on public.moxera_balance_transactions for select to authenticated using(public.moxera_is_admin());

-- User notifications: direct message and broadcast rows are visible only to their intended user.
drop policy if exists "moxera notifications own select" on public.moxera_notifications;
create policy "moxera notifications own select" on public.moxera_notifications for select to authenticated using((user_id = auth.uid()) or (is_broadcast = true) or public.moxera_is_admin());
drop policy if exists "moxera notifications own update" on public.moxera_notifications;
create policy "moxera notifications own update" on public.moxera_notifications for update to authenticated using((user_id = auth.uid()) or public.moxera_is_admin()) with check((user_id = auth.uid()) or public.moxera_is_admin());

-- Preserve existing withdrawal behavior for normal accounts while allowing premium/vip rules.
alter table public.moxera_withdrawals drop constraint if exists moxera_withdrawals_amount_check;
alter table public.moxera_withdrawals add constraint moxera_withdrawals_amount_check check(amount > 0);
create or replace function public.moxera_request_withdrawal(p_amount numeric,p_method text,p_account text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid := auth.uid(); v_balance numeric; v_level text; v_invites integer; v_id uuid; v_fee numeric;
begin
 if v_user is null then raise exception 'Tafadhali ingia tena.'; end if;
 select balance,membership_level,invited_count into v_balance,v_level,v_invites from public.moxera_users where id=v_user and status='active' for update;
 if v_balance is null then raise exception 'Akaunti haijawashwa.'; end if;
 if p_amount <= 0 then raise exception 'Weka kiasi sahihi.'; end if;
 if coalesce(v_level,'normal')='normal' and coalesce(v_invites,0)<15 then raise exception 'Ili kuweza Kutoa Pesa zako, inakubidi kualika Watu 15 au UPGRADE Kwenda Premium'; end if;
 if coalesce(v_level,'normal')='premium' then raise exception 'UPGRADE Kwenda VIP ili kuweza Kutoa Pesa'; end if;
 if coalesce(v_level,'normal')<>'vip' and p_amount<50000 then raise exception 'Kiwango cha chini ni TZS 50,000.'; end if;
 if coalesce(v_balance,0)<p_amount then raise exception 'Insufficient Balance.'; end if;
 if coalesce(trim(p_method),'')='' or coalesce(trim(p_account),'')='' then raise exception 'Weka njia na namba ya kupokea pesa.'; end if;
 v_fee := round(p_amount*0.05,2);
 update public.moxera_users set balance=balance-p_amount,updated_at=now() where id=v_user;
 insert into public.moxera_withdrawals(user_id,amount,fee,net_amount,method,account)
 values(v_user,p_amount,v_fee,p_amount-v_fee,trim(p_method),trim(p_account)) returning id into v_id;
 insert into public.moxera_notifications(user_id,title,message) values(v_user,'Withdrawal request imepokelewa','Ombi lako la kutoa TZS '||to_char(p_amount,'FM999,999,999,990.00')||' limepokelewa na linasubiri mapitio ya Admin.');
 return v_id;
end; $$;
revoke all on function public.moxera_request_withdrawal(numeric,text,text) from public;
grant execute on function public.moxera_request_withdrawal(numeric,text,text) to authenticated;

-- Atomic admin balance adjustment with audit trail.
create or replace function public.moxera_admin_adjust_balance(p_user_id uuid,p_amount numeric,p_remark text)
returns numeric language plpgsql security definer set search_path=public as $$
declare v_before numeric; v_after numeric;
begin
 if not public.moxera_is_admin() then raise exception 'Admin pekee.'; end if;
 if p_amount=0 or coalesce(trim(p_remark),'')='' then raise exception 'Weka kiasi na sababu.'; end if;
 select balance into v_before from public.moxera_users where id=p_user_id for update;
 if v_before is null then raise exception 'User hajapatikana.'; end if;
 v_after:=v_before+p_amount;
 if v_after<0 then raise exception 'Balance haiwezi kuwa chini ya sifuri.'; end if;
 update public.moxera_users set balance=v_after,updated_at=now() where id=p_user_id;
 insert into public.moxera_balance_transactions(user_id,admin_id,amount,balance_before,balance_after,remark) values(p_user_id,auth.uid(),p_amount,v_before,v_after,trim(p_remark));
 insert into public.moxera_notifications(user_id,title,message) values(p_user_id,'Balance imebadilika','Admin amebadilisha balance yako kwa TZS '||to_char(p_amount,'FM999,999,999,990.00')||'. Sababu: '||trim(p_remark));
 return v_after;
end; $$;
revoke all on function public.moxera_admin_adjust_balance(uuid,numeric,text) from public;
grant execute on function public.moxera_admin_adjust_balance(uuid,numeric,text) to authenticated;

-- Keep paid timestamp available for old records and future activation payments.
update public.moxera_users u set paid_at = coalesce(u.paid_at, p.paid_at)
from public.moxera_payments p where p.user_id=u.id and p.status='paid' and p.plan='activation';

# Moxera Chat Connect — Updated

## Mfumo uliowekwa
- Register/Login kupitia Supabase Auth.
- User profile na taarifa zote zinahifadhiwa kwenye Supabase.
- Namba za Tanzania zina-normalize automatically kuwa `255XXXXXXXXX`.
- Activation payment ya TZS 16,000 kupitia mobile push.
- Payment secret inasomwa SERVER-SIDE pekee; haiwekwi kwenye browser.
- Payment status ina-poll automatically mpaka `SUCCESS`/failure.
- `SUCCESS` inaweka `moxera_payments.status = paid` na `moxera_users.payment_status = paid`.
- Account haifanyiwi active moja kwa moja; admin anaweza ku-approve/activate baada ya payment kuthibitishwa.
- Admin panel: `/admin`.
- Admin anaweza approve, ban, unban na kutuma notifications kwa user mmoja au wote.

## Supabase setup
1. Fungua Supabase → SQL Editor.
2. Run `supabase/moxera_schema.sql`.
3. Migration hii inatumia objects zenye prefix `moxera_` na haifanyi ALTER kwenye tables zako nyingine.
4. Tengeneza admin account kupitia Supabase Authentication.
5. Weka UUID ya admin kwenye `moxera_admins`, mfano:

```sql
insert into public.moxera_admins(user_id, email)
values ('AUTH-USER-UUID', 'admin@example.com');
```

## Vercel Environment Variables
Weka hizi kwenye Vercel Project Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_ACTIVATION_FEE=16000
PAYMENT_API_SECRET=YOUR_LIVE_PAYMENT_SECRET
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

**Usiweke secret keys zenye `VITE_` prefix.** `PAYMENT_API_SECRET` na `SUPABASE_SERVICE_ROLE_KEY` zinatumika server-side tu.

## Payment flow
1. User anajisajili.
2. Phone inabadilishwa automatically kuwa Tanzania international format.
3. User anabonyeza `LIPA SASA`.
4. Server inaanzisha mobile push.
5. Browser inafuatilia status automatically.
6. Ikifika `SUCCESS`, payment inawekwa `paid` kwenye database.
7. Admin anaona user huyo kwenye `/admin` na anaweza ku-approve/activate account.

## Security note
Usiweke secret payment key kwenye source code, `.env` inayowekwa GitHub, au variable yenye `VITE_`. Weka secret kwenye Vercel Environment Variables pekee.


## SplashPay payment setup

Configure these server-side variables in Vercel (Production/Preview as appropriate):
- `SPLASHPAY_API_KEY` — SplashPay test or live public API key (`pk_test_...` or `pk_live_...`)
- `SPLASHPAY_API_SECRET` — SplashPay test or live API secret (`sk_test_...` or `sk_live_...`)
- `SUPABASE_SERVICE_ROLE_KEY` — server-side Supabase service role key
- `SUPABASE_URL` (or existing `VITE_SUPABASE_URL`) — Supabase project URL
- `SUPABASE_ANON_KEY` (or existing `VITE_SUPABASE_ANON_KEY`) — Supabase anon key used to verify the signed-in user

SplashPay calls are made only from the server. The client never receives the API secret. Activation fee is fixed at TZS 15,000. Payment references sent to SplashPay begin with `INV-`. The app polls `POST /payments/check-status` using the reference (no webhook is required); activation or membership changes happen only after SplashPay returns `data.status = success`.

Remove the old `PAYMENT_API_SECRET` environment variable after verifying the SplashPay integration is working. Do not commit API credentials to source control.

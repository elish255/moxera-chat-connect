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

## Password recovery via SMS OTP

The requested policy is to use the phone recorded at signup, **without prior
email/admin verification**. This is a deliberate security tradeoff: a mistyped,
shared, transferred, or recycled phone number may allow its holder to take over
an account. Users prove possession by SMS OTP before changing a password. No
account is created and activation/payment restrictions are unchanged.

### Required setup BEFORE merge/release

1. Run `supabase/moxera_sms_recovery.sql` in the connected Supabase SQL Editor.
   Git/Vercel deploys do not apply this migration automatically. The migration
   adds private, service-role-only challenge storage and RPCs. No browser access
   to recovery tables or admin credentials is permitted.
2. Configure existing server-only `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_URL` (or `VITE_SUPABASE_URL`), `DARSMS_API_KEY`, and optionally
   `DARSMS_SENDER_ID`. Never prefix private keys with `VITE_` or commit them.
   Keep sufficient DARSMS balance and an approved sender. Use isolated preview
   database/provider credentials to test without affecting production users.
3. Test with an existing account and a phone/inbox you control. SMS delivery and
   live database setup are not implied by a successful build. No email template
   change is needed for SMS recovery. The old email recovery callback remains
   available only for previously issued links with configured redirects.

`/forgot-password` collects the signup phone, sends a 6-digit code, verifies it,
and shows the new-password form on the same page. Tanzanian formats `07…`,
`+2557…`, `2557…` normalize identically (also supports 06… mobile numbers).
Unknown and duplicate numbers receive a neutral message and no SMS: shared
phones must be resolved by admin rather than choosing an arbitrary account.

Codes are cryptographically random, HMAC-hashed using the server service-role
key with recovery-specific domains, valid for 5 minutes, with at most 5 guesses.
Verification creates a random 256-bit one-time grant, also hashed, valid for
5 minutes. Grants are consumed atomically **before** the Auth password update;
a failed/ambiguous update requires requesting a new OTP (or trying login if the
network response was lost). Codes/grants/passwords are never put in URLs, logs,
or browser storage. They remain only in component memory; reload starts over.

Database issuance limits: 1 request/minute and 5/hour/phone, 10/hour/IP, and
200/hour globally; limits are shared across server instances. New requests
invalidate old codes. Vercel's trusted `x-vercel-forwarded-for` header supplies
the IP; outside Vercel a conservative shared bucket is used. Older records are
pruned on issuance after 24 hours. These limits are not a replacement for WAF,
CAPTCHA and SMS budget monitoring under sustained distributed abuse.

Provider failures fail closed (the challenge is invalidated), and intentionally
return the same neutral message as an unknown number rather than revealing
account existence or provider data. Verify delivery/balance with the SMS provider.

### Smoke test

- Run the migration in a test database. Confirm anon/authenticated roles cannot
  read/write challenge rows or call the RPCs. Configure server keys privately.
- Request a code for a known single-account phone. Verify delivery, wrong code,
  expiry, 5-attempt lockout, resend limits, old-code invalidation, duplicate-phone
  rejection, and grant replay/concurrency rejection.
- Correct code → matching new password → login using original email/username
  and new password. Confirm old password fails. Activation rules must not change.
- Change the profile phone between issuance and completion: completion must fail.
- Simulate provider failures and auth update failures; no password change is
  allowed without a successful OTP and an unconsumed grant.

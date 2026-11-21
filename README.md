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

## Password recovery via email OTP

The login page links to **Umesahau Password?** (`/forgot-password`). A user
enters their registration email, receives an OTP, enters it on the same website,
and then chooses and confirms a new password on `/reset-password`. The app calls
`resetPasswordForEmail` and verifies with `verifyOtp({ email, token, type:
"recovery" })`. It does not use passwordless sign-in or create accounts.
Existing account activation/payment rules are unchanged. No OTPs, passwords, or
recovery tokens are stored in URLs or application logs.

### Required Supabase change BEFORE release

Publishing this repository does **not** update hosted Supabase email templates.
In Supabase **Email Templates**, select **Reset password** and replace its body
with `supabase/templates/recovery.html`. The important variable is
`{{ .Token }}` — it shows the actual one-time code. Do not replace it with
`{{ .TokenHash }}`, and do not change the Magic link or signup template.
Suggested subject: `Code yako ya kuweka password mpya — Moxera Agencies`.
Save the template. Without this change, users still receive the old link-only
email and cannot complete the new OTP entry flow. This is an admin-only setup;
users never need to open Supabase.

Use the project's configured OTP length and expiration; the form accepts 6–10
numeric digits (including 6- and 8-digit configurations). Supabase enforces code
expiry, one-time use, rate limits and password policy. The UI adds a 60-second
resend cooldown, but that is not a server security control. Configure appropriate
Auth rate limits and email/SMTP delivery for production.

The new code-entry flow does not follow email redirects, so a localhost Site URL
does not affect OTP verification. Still correct **Site URL** and **Redirect
URLs** in Supabase **URL Configuration** for other email flows and existing links:
set the production origin and allow the exact trusted origin + `/reset-password`.
Legacy recovery links remain supported when these redirects are configured.

See [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
and [redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls).

### Smoke test with an inbox you control

1. Request an OTP for an existing test account; confirm the email contains a
   numeric code (not only a link) and keeps the browser on the website.
2. Enter an incorrect/expired code; it must not show the new password form.
3. Verify the correct code; choose matching passwords and save. Log in with
   the new password and confirm the old password no longer works.
4. Check resending, changing email, and rejection of a consumed code. Never
   paste a real recovery code or token into an issue or pull request.
5. A missing/ordinary signed-in session must not unlock the reset form. A full
   page reload after verification intentionally requires a fresh recovery OTP.

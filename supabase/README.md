# Supabase migrations

1. Run `moxera_schema.sql` in Supabase SQL Editor if you have not already done so.
2. Run `fix_username_login.sql` to enable login with username. This is additive and does not alter other application tables.

## Admin account deletion

Run `moxera_admin_delete_users.sql` before deploying the admin deletion fix.
Vercel/Git deploys do not apply Supabase SQL. It adds a SECURITY DEFINER RPC
with an explicit authenticated-admin check; it does not grant blanket DELETE
on `moxera_users`. Normal users/anonymous callers cannot use it to delete profiles;
admin/self targets are refused. Batches of 1–100 IDs are atomic, and the panel
verifies returned IDs rather than reporting success for a silent no-op.

This deletes **Moxera application profiles**, matching the original panel action.
Existing cascading foreign keys delete related Moxera payments, withdrawals,
notifications, earnings and support records; referral links are set null by the
existing FK. Recovery challenges are removed when the recovery table is installed.
The shared Supabase Auth identity is deliberately NOT deleted: other applications
may use it. No specific live account is deleted by applying this migration.

After applying it and deploying, select only the intended username, check the
confirmation names, and delete. Verify it disappeared and the account to retain
is still present; then make one fresh recovery attempt. Test the migration with
normal-user, anonymous, self/admin-target, missing-ID, and mixed-batch cases before
production. Existing admin credentials/test auth setup are not documented here.

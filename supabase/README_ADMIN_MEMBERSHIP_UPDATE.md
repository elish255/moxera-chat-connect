Moxera Admin / Membership Update
================================

1. Open Supabase Dashboard -> SQL Editor.
2. Run `moxera_admin_membership_update.sql` AFTER `moxera_schema.sql` and `moxera_wallet_withdrawals.sql`.
3. Deploy the updated project to Vercel. Keep the existing Supabase and FimiPay environment variables unchanged.
4. Verify that the logged-in admin has a row in `public.moxera_admins`.

The new SQL adds membership_level (normal/premium/vip), payment timestamps, balance adjustment audit records, withdrawal remarks and the server-side withdrawal rules. Premium and VIP payments use the existing payment route/provider with plan-specific amounts (TZS 32,000 and TZS 35,500). Existing activation payment amount remains controlled by `VITE_ACTIVATION_FEE`.

Important: test payment callbacks in a staging project first. A successful provider status is what activates Premium/VIP; do not manually set payment records to paid as a substitute for provider confirmation.

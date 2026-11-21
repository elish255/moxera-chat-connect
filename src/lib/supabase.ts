import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function requireSupabase() {
  if (!supabase)
    throw new Error(
      "Supabase haijawekwa. Weka VITE_SUPABASE_URL na VITE_SUPABASE_ANON_KEY.",
    );
  return supabase;
}

// Register at client creation, before URL recovery can finish and before routes mount.
// Keep recovery permission in memory so a stale/ordinary login session alone never
// makes a missing or expired recovery link appear valid.
let recoveryUserId: string | null = null;
supabase?.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") recoveryUserId = session?.user.id ?? null;
  if (event === "SIGNED_OUT" || event === "SIGNED_IN") recoveryUserId = null;
});

export function isPasswordRecoverySession(userId: string | undefined) {
  return Boolean(userId && userId === recoveryUserId);
}

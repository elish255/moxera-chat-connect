import { requireSupabase, supabase } from "./supabase";
import type { MoxeraUser } from "./moxera";
import { normalizeTanzaniaPhone } from "./phone";

export async function registerMoxeraUser(data: {
  fullName: string; username: string; phone: string; email: string; country: string; password: string;
}) {
  const db = requireSupabase();
  const normalizedPhone = normalizeTanzaniaPhone(data.phone);
  const { data: auth, error } = await db.auth.signUp({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    options: { data: { full_name: data.fullName, username: data.username.trim(), phone: normalizedPhone, country: data.country } },
  });
  if (error) throw error;
  if (!auth.user) throw new Error("Usajili haujakamilika.");

  // The moxera_users row is created by a SECURITY DEFINER trigger on
  // auth.users. This is intentional: when email confirmation is enabled,
  // signUp() may not return an authenticated session, so a client-side
  // INSERT would be rejected by RLS with "permission denied".
  return auth.user;
}

export async function loginMoxeraUser(identifier: string, password: string) {
  const db = requireSupabase();
  let email = identifier.trim();
  if (!email.includes("@")) {
    const { data, error } = await db.from("moxera_users").select("email").eq("username", email).maybeSingle();
    if (error) throw error;
    if (!data?.email) throw new Error("Username haijapatikana.");
    email = data.email;
  }
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return getCurrentMoxeraUser();
}

export async function getCurrentMoxeraUser(): Promise<MoxeraUser | null> {
  if (!supabase) return null;
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user) return null;
  const { data, error } = await supabase.from("moxera_users").select("*").eq("id", session.session.user.id).maybeSingle();
  if (error) throw error;
  return data ? {
    id: data.id, fullName: data.full_name, username: data.username, phone: data.phone,
    email: data.email, country: data.country, status: data.status, paymentStatus: data.payment_status,
    balance: Number(data.balance ?? 0), registeredAt: data.created_at,
  } : null;
}

export async function signOutMoxera() {
  if (supabase) await supabase.auth.signOut();
}

export function subscribeAuth(callback: () => void) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(() => callback());
  return () => data.subscription.unsubscribe();
}

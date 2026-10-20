import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { requireSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin")({ component: Admin });

type User = {
  id: string; full_name: string; username: string; email: string; phone: string;
  country: string; status: string; payment_status: string; balance: number;
  created_at: string; updated_at?: string;
};
type Payment = { user_id: string; created_at: string; status: string; amount: number; currency?: string };
type Tab = "Users" | "Active" | "Not Active" | "Withdrawal Request";

function Admin() {
  const nav = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>("Users");
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("Moxera");
  const [message, setMessage] = useState("");
  const [balanceInputs, setBalanceInputs] = useState<Record<string, string>>({});
  const [balanceModes, setBalanceModes] = useState<Record<string, "add" | "subtract">>({});
  const db = (() => { try { return requireSupabase(); } catch { return null; } })();

  async function check() {
    if (!db) return;
    const { data } = await db.auth.getSession();
    if (!data.session) return;
    const { data: a } = await db.from("moxera_admins").select("user_id").eq("user_id", data.session.user.id).maybeSingle();
    if (a) setSession(data.session);
    else await db.auth.signOut();
  }
  async function login(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      if (!db) throw new Error("Supabase haijawekwa.");
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await check();
    } catch (e: any) { toast.error(e?.message || "Admin login imeshindikana."); }
    finally { setBusy(false); }
  }
  async function load() {
    if (!db) return;
    const { data, error } = await db.from("moxera_users").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setUsers((data || []) as User[]);
    const { data: p } = await db.from("moxera_payments").select("user_id,created_at,status,amount,currency").eq("status", "paid").order("created_at", { ascending: false });
    setPayments((p || []) as Payment[]);
    // Withdrawal table is optional in existing installations; keep the rest of admin working if absent.
    const { data: w } = await db.from("moxera_withdrawal_requests").select("*").order("created_at", { ascending: false });
    setWithdrawals(w || []);
  }
  useEffect(() => { void check(); }, []);
  useEffect(() => { if (session) void load(); }, [session]);

  async function update(id: string, patch: Partial<User>) {
    if (!db) return;
    const { error } = await db.from("moxera_users").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Mabadiliko yamehifadhiwa."); await load(); }
  }
  async function activate(u: User) {
    if (u.payment_status !== "paid") { toast.error("User huyu hajathibitishiwa malipo; huwezi ku-activate bado."); return; }
    await update(u.id, { status: "active" });
  }
  async function changeBalance(u: User) {
    if (!db) return;
    const amount = Number(balanceInputs[u.id]);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error("Weka kiasi sahihi kinachozidi sifuri."); return; }
    const next = Number(u.balance || 0) + (balanceModes[u.id] === "subtract" ? -amount : amount);
    if (next < 0) { toast.error("Balance haiwezi kuwa chini ya sifuri."); return; }
    const { error } = await db.from("moxera_users").update({ balance: next, updated_at: new Date().toISOString() }).eq("id", u.id);
    if (error) toast.error(error.message);
    else { toast.success("Balance imesasishwa."); setBalanceInputs(v => ({ ...v, [u.id]: "" })); await load(); }
  }
  async function send(target: string | null) {
    if (!db) return;
    if (!title.trim() || !message.trim()) { toast.error("Jaza title na ujumbe kwanza."); return; }
    const rows = target
      ? [{ user_id: target, title: title.trim(), message: message.trim(), is_broadcast: false }]
      : [...users.map(u => ({ user_id: u.id, title: title.trim(), message: message.trim(), is_broadcast: false })),
         { user_id: null, title: title.trim(), message: message.trim(), is_broadcast: true }];
    const { error } = await db.from("moxera_notifications").insert(rows);
    if (error) toast.error(error.message);
    else { toast.success(target ? "Notification imetumwa kwa user." : "Notification imetumwa kwa wote."); setMessage(""); }
  }

  const latestPayment = useMemo(() => {
    const map = new Map<string, Payment>();
    for (const p of payments) if (!map.has(p.user_id)) map.set(p.user_id, p);
    return map;
  }, [payments]);
  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const matchesTab = tab === "Users" ||
        (tab === "Active" && u.status === "active") ||
        (tab === "Not Active" && u.status !== "active" && u.status !== "banned") ||
        tab === "Withdrawal Request";
      return matchesTab && (tab !== "Withdrawal Request") &&
        (!q || (u.username || "").toLowerCase().includes(q) || (u.phone || "").toLowerCase().includes(q));
    });
  }, [users, tab, search]);

  if (!session) return <main className="flex min-h-screen items-center justify-center bg-background px-4"><form onSubmit={login} className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl"><h1 className="text-2xl font-extrabold">Admin Panel</h1><p className="mt-1 text-sm text-muted-foreground">Ingiza admin email na password.</p><div className="mt-6 space-y-3"><Input type="email" placeholder="Admin email" required value={email} onChange={e => setEmail(e.target.value)} /><Input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} /><Button disabled={busy} className="w-full">{busy ? "Inaingia…" : "Login"}</Button></div></form></main>;

  const tabs: Tab[] = ["Users", "Active", "Not Active", "Withdrawal Request"];
  return <main className="min-h-screen bg-slate-50 p-3 text-slate-900 sm:p-6"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-indigo-600">Management dashboard</p><h1 className="mt-1 text-2xl font-extrabold">Admin Panel</h1><p className="text-sm text-slate-500">Users, accounts, balances and notifications</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void load()}>Refresh</Button><Button variant="outline" onClick={async () => { await db?.auth.signOut(); nav({ to: "/" }); }}>Toka</Button></div></header>
    <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      ["Jumla ya Users", users.length], ["Active", users.filter(u => u.status === "active").length],
      ["Not Active", users.filter(u => u.status !== "active" && u.status !== "banned").length],
      ["Balance Jumla", `TZS ${users.reduce((n,u)=>n+Number(u.balance||0),0).toLocaleString("en-US")}`]
    ].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-xl font-extrabold">{value}</p></div>)}</section>
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-bold">Notifications</h2><div className="mt-3 grid gap-2 md:grid-cols-2"><Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} /><Input placeholder="Ujumbe wa notification" value={message} onChange={e => setMessage(e.target.value)} /></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => void send(null)}>Tuma kwa wote</Button><span className="self-center text-xs text-slate-500">Kutuma kwa mtu mmoja, tumia kitufe cha Notify kwenye orodha.</span></div></section>
    <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><h2 className="text-lg font-bold">Account Management</h2><div className="mt-3 flex flex-wrap gap-2">{tabs.map(t => <Button key={t} variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t}{t === "Users" ? ` (${users.length})` : t === "Active" ? ` (${users.filter(u=>u.status==="active").length})` : t === "Not Active" ? ` (${users.filter(u=>u.status!=="active"&&u.status!=="banned").length})` : ` (${withdrawals.length})`}</Button>)}</div>{tab !== "Withdrawal Request" && <div className="mt-3 max-w-md"><Input placeholder="Search Username au namba ya simu..." value={search} onChange={e => setSearch(e.target.value)} /></div>}</div>
    {tab === "Withdrawal Request" ? <div className="overflow-x-auto p-4">{withdrawals.length ? <table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b"><th className="p-2">User</th><th className="p-2">Kiasi</th><th className="p-2">Status</th><th className="p-2">Tarehe</th></tr></thead><tbody>{withdrawals.map((w,i)=><tr key={w.id||i} className="border-b"><td className="p-2">{w.username||w.user_id||"—"}</td><td className="p-2">{w.amount??w.balance??"—"}</td><td className="p-2">{w.status||"—"}</td><td className="p-2">{w.created_at?new Date(w.created_at).toLocaleString():"—"}</td></tr>)}</tbody></table> : <p className="py-8 text-center text-sm text-slate-500">Hakuna withdrawal requests zilizopatikana. Hakikisha mfumo wako una jedwali `moxera_withdrawal_requests`.</p>}</div>
    : <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">User</th><th className="p-3">Simu</th><th className="p-3">Registration</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3">Balance (TZS)</th><th className="p-3">Actions</th></tr></thead><tbody>{visibleUsers.map(u=>{const p=latestPayment.get(u.id);return <tr key={u.id} className="border-t border-slate-100 align-top hover:bg-slate-50"><td className="p-3"><b>{u.username}</b><div className="text-xs text-slate-500">{u.full_name}<br/>{u.email}</div></td><td className="p-3">{u.phone}</td><td className="p-3 whitespace-nowrap">{u.created_at?new Date(u.created_at).toLocaleString():"—"}</td><td className="p-3 whitespace-nowrap"><span className="font-semibold">{u.payment_status}</span><div className="text-xs text-slate-500">{p?new Date(p.created_at).toLocaleString():"Muda wa malipo haujapatikana"}</div></td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${u.status==="active"?"bg-emerald-100 text-emerald-700":u.status==="banned"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>{u.status}</span></td><td className="p-3"><b>{Number(u.balance||0).toLocaleString("en-US")}</b><div className="mt-2 flex gap-1"><select aria-label="Balance action" className="w-24 rounded-md border bg-white p-1 text-xs" value={balanceModes[u.id]||"add"} onChange={e=>setBalanceModes(v=>({...v,[u.id]:e.target.value as "add"|"subtract"}))}><option value="add">Ongeza</option><option value="subtract">Punguza</option></select><Input className="w-24" type="number" min="0.01" step="0.01" placeholder="Kiasi" value={balanceInputs[u.id]||""} onChange={e=>setBalanceInputs(v=>({...v,[u.id]:e.target.value}))}/><Button size="sm" onClick={()=>void changeBalance(u)}>OK</Button></div></td><td className="p-3"><div className="flex flex-wrap gap-1">{u.status!=="active"&&u.status!=="banned"&&<Button size="sm" disabled={u.payment_status!=="paid"} onClick={()=>void activate(u)}>Activate</Button>}{u.status==="active"&&<Button size="sm" variant="outline" onClick={()=>void update(u.id,{status:"inactive"})}>Deactivate</Button>}{u.status!=="banned"?<Button size="sm" variant="destructive" onClick={()=>void update(u.id,{status:"banned"})}>Ban</Button>:<Button size="sm" variant="outline" onClick={()=>void update(u.id,{status:u.payment_status==="paid"?"active":"inactive"})}>Unban</Button>}<Button size="sm" variant="outline" onClick={()=>void send(u.id)}>Notify</Button></div></td></tr>})}</tbody></table>{visibleUsers.length===0&&<p className="p-8 text-center text-sm text-slate-500">Hakuna user anayelingana na utafutaji huu.</p>}</div>}
    </section>
  </div></main>;
}

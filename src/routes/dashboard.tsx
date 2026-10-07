import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect,useState } from "react";
import { Copy, LogOut, Menu, Bell } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/moxera-logo.jpg";
import { getCurrentMoxeraUser, signOutMoxera } from "@/lib/auth";
import { pickForeigners, type Foreigner, type MoxeraUser } from "@/lib/moxera";
import { Button } from "@/components/ui/button";

export const Route=createFileRoute("/dashboard")({component:Dashboard});
function Dashboard(){
 const nav=useNavigate(); const [user,setUser]=useState<MoxeraUser|null>(null); const [ready,setReady]=useState(false); const [foreigners,setForeigners]=useState<Foreigner[]>([]);
 useEffect(()=>{getCurrentMoxeraUser().then(u=>{setUser(u);setReady(true);if(u?.status==="banned")toast.error("Account yako imefungiwa.");}).catch(()=>setReady(true));setForeigners(pickForeigners(4));const t=setInterval(()=>setForeigners(pickForeigners(4)),15000);return()=>clearInterval(t)},[]);
 if(!ready)return <main className="min-h-screen"/>;
 if(!user)return <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"><h1 className="text-xl font-bold">Ingia kwenye account yako</h1><Button onClick={()=>nav({to:"/login"})}>Login</Button></main>;
 if(user.status==="banned")return <main className="flex min-h-screen items-center justify-center px-6 text-center"><div><h1 className="text-xl font-bold text-destructive">Account imefungiwa</h1><p className="mt-2 text-sm text-muted-foreground">Wasiliana na support kwa msaada.</p></div></main>;
 if(user.paymentStatus!=="paid"||user.status!=="active")return <main className="flex min-h-screen items-center justify-center px-6 text-center"><div><img src={logo} className="mx-auto h-16 w-16 rounded-xl object-contain"/><h1 className="mt-4 text-xl font-bold">Account inasubiri activation</h1><p className="mt-2 text-sm text-muted-foreground">Kamilisha malipo ya activation na subiri approval ya admin.</p><Button className="mt-4" onClick={()=>nav({to:"/payment"})}>LIPA SASA</Button></div></main>;
 const refLink=`${window.location.origin}/register`;
 return <main className="min-h-screen pb-12"><header className="flex items-center justify-between bg-card px-3 py-2.5 shadow-sm"><Menu className="h-5 w-5 text-primary"/><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-0.5 shadow"><img src={logo} className="h-full w-full rounded-md object-contain"/></span><span className="text-sm font-extrabold text-accent">MOXERA SITE</span></div><div className="text-right"><p className="text-[11px] font-bold">{user.username}</p><p className="text-[9px] text-primary">ACTIVE</p></div></header>
 <div className="px-4 pt-4"><div className="flex items-center justify-between"><p className="text-sm">Karibu, <b>{user.username}</b></p><Bell className="h-5 w-5 text-primary"/></div>
 <section className="mt-3 rounded-2xl p-5 text-panel-foreground shadow-sm" style={{background:"var(--gradient-panel)"}}><p className="text-[10px] uppercase tracking-widest opacity-70">Net Income</p><p className="mt-1 text-3xl font-extrabold">{(user.balance??0).toLocaleString()} <span className="text-sm font-medium opacity-70">TZS</span></p></section>
 <section className="mt-5 rounded-2xl bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-bold text-accent">Foreigners wa kuchat nao</p><span className="text-[11px] text-primary">wanabadilika</span></div><div className="mt-3 space-y-2">{foreigners.map(f=><div key={f.id} className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2.5"><img src={f.avatar} className="h-10 w-10 rounded-full object-cover"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{f.name}</p><p className="text-[11px] text-muted-foreground">{f.country} · {f.rate.toLocaleString()} TZS</p></div><Button size="sm" onClick={()=>nav({to:"/chat/$id",params:{id:f.id}})}>Chat</Button></div>)}</div></section>
 <section className="mt-5 rounded-2xl bg-card p-4 shadow-sm"><p className="text-sm">Referral Link</p><div className="mt-2 flex items-center gap-2 rounded-xl bg-secondary p-2"><p className="min-w-0 flex-1 truncate text-xs">{refLink}</p><Button size="sm" onClick={()=>{navigator.clipboard?.writeText(refLink);toast.success("Link imekopiwa!")}}><Copy className="h-3.5 w-3.5"/></Button></div></section>
 <button onClick={async()=>{await signOutMoxera();nav({to:"/"})}} className="mx-auto mt-6 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><LogOut className="h-3.5 w-3.5"/> Toka</button></div></main>;
}

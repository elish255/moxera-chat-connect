import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { loginMoxeraUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route=createFileRoute("/login")({component:Login});
function Login(){
 const nav=useNavigate(); const [identifier,setIdentifier]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);try{const u=await loginMoxeraUser(identifier,password); if(u?.status==="banned"){toast.error("Account yako imefungiwa.");return;} nav({to:u?.paymentStatus==="paid"&&u?.status==="active"?"/dashboard":"/payment"});}catch(err:any){toast.error(err?.message||"Login imeshindikana.");}finally{setBusy(false);}}
 return <main className="flex min-h-screen items-center justify-center bg-background px-4"><div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl"><h1 className="text-2xl font-extrabold text-accent">Login</h1><p className="mt-1 text-sm text-muted-foreground">Welcome back! Log in to your account.</p><form onSubmit={submit} className="mt-6 space-y-4"><div><Label>Username or Email</Label><Input className="mt-1 h-11" required value={identifier} onChange={e=>setIdentifier(e.target.value)}/></div><div><Label>Password</Label><Input className="mt-1 h-11" type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></div><Button disabled={busy} className="h-12 w-full font-bold">{busy?"Inaingia…":"Sign in"}</Button></form><p className="mt-5 text-center text-sm text-muted-foreground">Don't have an account? <Link to="/register" className="font-bold text-primary">Create Account</Link></p></div></main>;
}

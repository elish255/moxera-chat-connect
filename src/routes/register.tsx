import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { registerMoxeraUser } from "@/lib/auth";
import { COUNTRIES } from "@/lib/moxera";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  const navigate = useNavigate();
  const [busy,setBusy]=useState(false);
  const [form,setForm]=useState({fullName:"",username:"",phone:"",email:"",country:"",password:"",confirm:""});
  const set=(k:string,v:string)=>setForm(x=>({...x,[k]:v}));
  async function submit(e:FormEvent){
    e.preventDefault();
    if(form.password.length<6) return toast.error("Password iwe na angalau herufi 6.");
    if(form.password!==form.confirm) return toast.error("Password hazifanani.");
    setBusy(true);
    try { await registerMoxeraUser({...form, country:form.country}); toast.success("Usajili umefanikiwa."); navigate({to:"/payment"}); }
    catch(err:any){ toast.error(err?.message || "Usajili umeshindikana."); }
    finally{setBusy(false);}
  }
  return <main className="min-h-screen bg-background px-4 py-8">
    <div className="mx-auto max-w-md rounded-3xl bg-card p-6 shadow-xl">
      <div className="mb-6 text-center"><h1 className="text-2xl font-extrabold text-accent">Create your account</h1><p className="mt-1 text-sm text-muted-foreground">Enter your personal details to create account</p></div>
      <form onSubmit={submit} className="space-y-4">
        {([["fullName","Full Name","text"],["username","Username","text"],["phone","Phone","tel"],["email","Email Address","email"]] as const).map(([k,l,t])=><div key={k}><Label>{l}</Label><Input className="mt-1 h-11" type={t} required value={(form as any)[k]} onChange={e=>set(k,e.target.value)} placeholder={k==="phone"?"255xxxxxxxx":l}/></div>)}
        <div><Label>Country</Label><select className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm" required value={form.country} onChange={e=>set("country",e.target.value)}><option value="">Choose Country...</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Password</Label><Input className="mt-1 h-11" type="password" required value={form.password} onChange={e=>set("password",e.target.value)}/></div><div><Label>Confirm Password</Label><Input className="mt-1 h-11" type="password" required value={form.confirm} onChange={e=>set("confirm",e.target.value)}/></div></div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" required/> Agree with Privacy Policy</label>
        <Button disabled={busy} className="h-12 w-full font-bold">{busy?"Inatengeneza account…":"Create Account"}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="font-bold text-primary">Sign in</Link></p>
    </div>
  </main>;
}

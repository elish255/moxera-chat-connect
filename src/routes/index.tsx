import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, ShieldCheck, Wallet, Globe2, ArrowUpRight, Sparkles, BadgeCheck } from "lucide-react";
import logo from "@/assets/moxera-logo.jpg.asset.json";
import { pickForeigners, type Foreigner, loadUser, ACTIVATION_FEE } from "@/lib/moxera";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moxera Agencies | Chati na Wazungu kwa Kiswahili, Ulipwe" },
      {
        name: "description",
        content:
          "Moxera Agencies inakuunganisha na wageni wanaotaka kujifunza Kiswahili. Chati nao kwa Kiswahili na upate malipo kwa kila mazungumzo.",
      },
      { property: "og:title", content: "Moxera Agencies | Chati na Wazungu, Ulipwe" },
      {
        property: "og:description",
        content: "Fungua chati na wageni wanaojifunza Kiswahili na upate malipo kwa kila ujumbe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [list, setList] = useState<Foreigner[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setList(pickForeigners(4));
    setUsername(loadUser()?.username ?? null);
    const t = setInterval(() => setList(pickForeigners(4)), 20000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden pb-16">
      <header className="bg-panel text-panel-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src={logo.url} alt="Moxera Agencies" className="h-11 w-11 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="font-heading text-sm font-bold uppercase">Moxera Agencies</p>
              <p className="text-[10px] uppercase tracking-widest text-panel-foreground/60">The chat agency</p>
            </div>
          </Link>
          <Button asChild size="sm" variant={username ? "secondary" : "default"} className="rounded-full px-5">
            <Link to={username ? "/dashboard" : "/register"}>{username ? "Dashboard" : "Jisajili"}</Link>
          </Button>
        </div>

        <section className="mx-auto grid max-w-5xl gap-8 px-5 pb-12 pt-8 sm:px-8 md:grid-cols-[1.2fr_0.8fr] md:items-end md:pb-16">
          <div>
            <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-4 w-4" /> Ongea · Fundisha · Lipwa
            </div>
            <h1 className="font-display text-5xl leading-none text-panel-foreground sm:text-6xl">
              Chati kwa Kiswahili, <span className="italic text-primary">lipwa</span> kwa muda wako.
            </h1>
          </div>
          <div className="md:pb-1">
            <p className="max-w-md text-sm leading-7 text-panel-foreground/65">
              Ungana na wageni kutoka nchi mbalimbali duniani, wafundishe Kiswahili kwa mazungumzo ya kawaida na ulipwe.
            </p>
            <div className="mt-6 h-1 w-20 rounded-full bg-primary" />
          </div>
        </section>
      </header>

      <section className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="-mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: Wallet, label: "Malipo kila siku" },
            { icon: Globe2, label: "Wageni wapya" },
            { icon: ShieldCheck, label: "Akaunti salama" },
          ].map((item) => (
            <div key={item.label} className="border border-border bg-card p-3 text-center shadow-sm backdrop-blur-xl sm:p-5">
              <item.icon className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-foreground sm:text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pt-12 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">Available now</p>
            <h2 className="font-display text-3xl leading-none text-foreground sm:text-4xl">Chagua mtu wa kuzungumza naye</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setList(pickForeigners(4))}
            className="shrink-0 rounded-full text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Badilisha
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {list.map((f) => (
            <article key={f.id} className="group border border-border bg-card p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-xl ring-4 ring-background">
                  {f.flag}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-foreground">{f.name}</p>
                    <span
                      className={`h-2 w-2 rounded-full ${f.online ? "bg-primary" : "bg-muted-foreground"}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {f.country} · Miaka {f.age} · {f.platform}
                  </p>
                  <p className="mt-1 text-xs text-foreground/80">{f.bio}</p>
                  <p className="mt-3 text-xs font-bold text-primary">
                    Malipo: {f.rate.toLocaleString()} TZS kwa mazungumzo
                  </p>
                </div>
              </div>
              <Button
                className="mt-4 w-full rounded-full"
                onClick={() => navigate({ to: "/chat/$id", params: { id: f.id } })}
              >
                <MessageCircle className="h-4 w-4" /> Start Chat <ArrowUpRight className="ml-auto h-4 w-4" />
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-5xl px-5 sm:px-8">
        <div className="grid gap-6 bg-panel p-6 text-panel-foreground shadow-lg sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Kuanza kulipwa</p>
          <p className="mt-2 font-display text-3xl">
            Activation fee ya {ACTIVATION_FEE.toLocaleString()} TZS
          </p>
          <p className="mt-2 max-w-lg text-sm text-panel-foreground/65">
            Malipo haya ni ya mara moja, yanakufungulia akaunti ya kuchat na kulipwa.
          </p>
          </div>
          <Button asChild className="h-12 rounded-full px-8 font-bold">
            <Link to="/register">JISAJILI SASA</Link>
          </Button>
        </div>
      </section>

      <footer className="mt-10 px-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Moxera Agencies. Haki zote zimehifadhiwa.
      </footer>
    </main>
  );
}

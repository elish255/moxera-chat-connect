import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, ShieldCheck, Wallet, Globe2, ArrowUpRight, Sparkles, BadgeCheck } from "lucide-react";
import logo from "@/assets/moxera-logo.jpg";
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
    const t = setInterval(() => setList(pickForeigners(4)), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden pb-16">
      <header className="text-panel-foreground" style={{ background: "var(--gradient-panel)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg ring-2 ring-primary/40">
              <img src={logo} alt="Moxera Agencies" className="h-full w-full rounded-xl object-contain" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-sm font-bold uppercase">Moxera Agencies</p>
              <p className="text-[10px] uppercase tracking-widest text-panel-foreground/60">The chat agency</p>
            </div>
          </Link>
          <Button asChild size="sm" variant={username ? "secondary" : "default"} className="rounded-full px-5">
            <a href={username ? "/dashboard" : "https://moxeraagencies.com/register?ref=Mtukazi"}>{username ? "Dashboard" : "Jisajili"}</a>
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
            <div key={item.label} className="rounded-2xl border border-border bg-card p-3 text-center shadow-md backdrop-blur-xl sm:p-5">
              <item.icon className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-foreground sm:text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pt-12 sm:px-8">
        <div className="mb-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">Available now</p>
          <h2 className="font-display text-3xl leading-none text-foreground sm:text-4xl">Chagua mtu wa kuzungumza naye</h2>
          <p className="mt-2 text-xs text-muted-foreground">Orodha inabadilika yenyewe kila sekunde chache.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {list.map((f) => (
            <article
              key={f.id}
              className="group animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-3xl border border-border bg-card shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative flex items-center gap-4 p-5">
                <span
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: "var(--gradient-flame)" }}
                />
                <div className="relative shrink-0">
                  <img
                    src={f.avatar}
                    alt={f.name}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-20 w-20 rounded-2xl object-cover shadow-md ring-2 ring-primary/30"
                  />
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-card px-1 text-base shadow">
                    {f.flag}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-heading font-bold text-foreground">{f.name}</p>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-sky" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {f.country} · Miaka {f.age}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground">
                      {f.platform}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        f.online ? "bg-lime/20 text-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {f.online ? "Mtandaoni" : "Hayupo"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="px-5 text-xs leading-6 text-foreground/75">{f.bio}</p>

              <div className="m-4 mt-4 flex items-center justify-between rounded-2xl p-4 text-panel-foreground shadow-md"
                style={{ background: "var(--gradient-flame)" }}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Unalipwa</p>
                  <p className="font-heading text-2xl font-extrabold leading-none">
                    {f.rate.toLocaleString()} <span className="text-xs font-bold">TZS</span>
                  </p>
                  <p className="mt-1 text-[10px] opacity-80">kwa mazungumzo moja</p>
                </div>
                <Wallet className="h-8 w-8 opacity-70" />
              </div>

              <div className="px-4 pb-5">
                <Button
                  className="w-full rounded-full font-bold shadow-md"
                  onClick={() => navigate({ to: "/chat/$id", params: { id: f.id } })}
                >
                  <MessageCircle className="h-4 w-4" /> Start Chat <ArrowUpRight className="ml-auto h-4 w-4" />
                </Button>
              </div>
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
            <a href="https://moxeraagencies.com/register?ref=Mtukazi">JISAJILI SASA</a>
          </Button>
        </div>
      </section>

      <footer className="mt-10 px-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Moxera Agencies. Haki zote zimehifadhiwa.
      </footer>
    </main>
  );
}

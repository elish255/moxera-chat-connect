import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, ShieldCheck, Wallet, Globe2, RefreshCw } from "lucide-react";
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
    <main className="min-h-screen pb-16">
      <header className="flex items-center justify-between gap-2 bg-card px-4 py-3 shadow-sm">
        <img src={logo.url} alt="Moxera Agencies" className="h-9 w-9 rounded-lg object-cover" />
        <div className="flex-1">
          <p className="text-sm font-extrabold tracking-tight text-accent">MOXERA AGENCIES</p>
          <p className="text-[11px] text-primary">Chati kwa Kiswahili · Ulipwe</p>
        </div>
        {username ? (
          <Button asChild size="sm">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link to="/register">Jisajili</Link>
          </Button>
        )}
      </header>

      <section className="px-4 pt-6">
        <h1 className="text-2xl font-extrabold leading-tight text-accent">
          Chati na Wazungu kwa Kiswahili, <span className="text-primary">ulipwe kila ujumbe</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Wageni kutoka Ulaya, Marekani na Canada wanahitaji mtu wa kuzungumza naye Kiswahili.
          Wewe unafundisha kwa mazungumzo ya kawaida, Moxera inakulipa.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: Wallet, label: "Malipo kila siku" },
            { icon: Globe2, label: "Wageni wapya" },
            { icon: ShieldCheck, label: "Akaunti salama" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-card p-3 text-center shadow-sm">
              <item.icon className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-1 text-[11px] font-medium text-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-accent">Chagua foreigner wa kuchat naye</h2>
          <button
            onClick={() => setList(pickForeigners(4))}
            className="flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Badilisha
          </button>
        </div>

        <div className="space-y-3">
          {list.map((f) => (
            <article key={f.id} className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-xl">
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
                  <p className="mt-2 text-xs font-semibold text-primary">
                    Malipo: {f.rate.toLocaleString()} TZS kwa mazungumzo
                  </p>
                </div>
              </div>
              <Button
                className="mt-3 w-full"
                onClick={() => navigate({ to: "/chat/$id", params: { id: f.id } })}
              >
                <MessageCircle className="h-4 w-4" /> Start Chat
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 px-4">
        <div className="rounded-2xl p-5 text-panel-foreground shadow-sm" style={{ background: "var(--gradient-panel)" }}>
          <p className="text-xs uppercase tracking-wide opacity-70">Kuanza kulipwa</p>
          <p className="mt-1 text-lg font-bold">
            Activation fee ya {ACTIVATION_FEE.toLocaleString()} TZS
          </p>
          <p className="mt-1 text-sm opacity-80">
            Malipo haya ni ya mara moja, yanakufungulia akaunti ya kuchat na kulipwa.
          </p>
          <Button asChild variant="secondary" className="mt-4 w-full font-bold">
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

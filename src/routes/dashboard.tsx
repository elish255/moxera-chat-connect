import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Share2, UserPlus, Briefcase, Package, Youtube, HelpCircle, Facebook, Music2,
  Menu, Copy, MessageCircle, Megaphone, PieChart, Languages, PenLine, Rocket, LogOut,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/moxera-logo.jpg";
import { Button } from "@/components/ui/button";
import { clearUser, loadUser, pickForeigners, type Foreigner, type MoxeraUser } from "@/lib/moxera";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Moxera Agencies" },
      {
        name: "description",
        content:
          "Dashboard ya Moxera Agencies: ona mapato yako, salio, wageni wapya wa kuchat nao na mtandao wako.",
      },
      { property: "og:title", content: "Dashboard | Moxera Agencies" },
      {
        property: "og:description",
        content: "Fuatilia mapato yako na chagua foreigner wa kuchat naye kwa Kiswahili.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const OTHER_BALANCES = [
  { icon: Music2, label: "TikTok", value: "0.00", bg: "bg-[oklch(0.2_0_0)]" },
  { icon: Megaphone, label: "Ads", value: "0.00", bg: "bg-[oklch(0.6_0.16_250)]" },
  { icon: PieChart, label: "Quiz", value: "0.00", bg: "bg-primary" },
  { icon: Youtube, label: "YouTube", value: "1,200.00", bg: "bg-[oklch(0.62_0.2_25)]" },
  { icon: MessageCircle, label: "WhatsApp Status", value: "0.00", bg: "bg-primary" },
  { icon: Languages, label: "Language Translate", value: "0.00", bg: "bg-primary" },
  { icon: MessageCircle, label: "Chat", value: "0.00", bg: "bg-primary" },
  { icon: PenLine, label: "Write & Earn", value: "0.00", bg: "bg-primary" },
  { icon: Rocket, label: "Spin Wheel", value: "0.00", bg: "bg-primary" },
];

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<MoxeraUser | null>(null);
  const [ready, setReady] = useState(false);
  const [foreigners, setForeigners] = useState<Foreigner[]>([]);

  useEffect(() => {
    const u = loadUser();
    setUser(u);
    setReady(true);
    setForeigners(pickForeigners(4));
    const t = setInterval(() => setForeigners(pickForeigners(4)), 15000);
    return () => clearInterval(t);
  }, []);

  if (!ready) return <main className="min-h-screen" />;

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <img src={logo} alt="Moxera Agencies" className="h-16 w-16 rounded-xl object-contain" />
        <h1 className="text-lg font-bold text-accent">Hujajisajili bado</h1>
        <p className="text-sm text-muted-foreground">
          Jisajili kwa Activation fee ya 16,000 TZS ili dashboard yako ifunguke.
        </p>
        <Button asChild className="font-bold">
          <a href="https://moxeraagencies.com/register?ref=Mtukazi">JISAJILI SASA</a>
        </Button>
      </main>
    );
  }

  const refLink = `https://moxeraagencies.com/register?ref=Mtukazi`;

  return (
    <main className="min-h-screen pb-12">
      <header className="flex items-center justify-between bg-card px-3 py-2.5 shadow-sm">
        <Menu className="h-5 w-5 text-primary" />
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-0.5 shadow ring-1 ring-primary/30">
            <img src={logo} alt="Moxera Agencies" className="h-full w-full rounded-md object-contain" />
          </span>
          <span className="text-sm font-extrabold text-accent">MOXERA SITE</span>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-accent">{user.username}</p>
          <p className="text-[9px] text-primary">MOXERA SITE</p>
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground">
            Karibu, <span className="font-bold text-accent">{user.username}</span>
          </p>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-lg shadow-sm">
            🇹🇿
          </span>
        </div>

        <section
          className="mt-3 rounded-2xl p-5 text-panel-foreground shadow-sm"
          style={{ background: "var(--gradient-panel)" }}
        >
          <p className="text-[10px] uppercase tracking-widest opacity-70">Net Income</p>
          <p className="mt-1 text-3xl font-extrabold">
            0.00 <span className="text-sm font-medium opacity-70">TZS</span>
          </p>
          <div className="mt-4 flex gap-8 border-t border-white/10 pt-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-70">Expenses</p>
              <p className="text-sm font-bold text-gold">0.00 TZS</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-70">Bonus</p>
              <p className="text-sm font-bold text-primary">10,000.00 TZS</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-4 gap-y-4">
          {[
            { icon: Share2, label: "Share", bg: "bg-[oklch(0.6_0.16_250)]" },
            { icon: UserPlus, label: "Pay Client", bg: "bg-primary" },
            { icon: Briefcase, label: "Cash Out", bg: "bg-[oklch(0.72_0.17_55)]" },
            { icon: Package, label: "Bundles", bg: "bg-[oklch(0.55_0.2_285)]" },
            { icon: Youtube, label: "YouTube", bg: "bg-[oklch(0.62_0.2_25)]" },
            { icon: HelpCircle, label: "Quiz", bg: "bg-primary" },
            { icon: Facebook, label: "Facebook", bg: "bg-[oklch(0.55_0.19_255)]" },
            { icon: Music2, label: "TikTok", bg: "bg-[oklch(0.2_0_0)]" },
          ].map((a) => (
            <button key={a.label} className="flex flex-col items-center gap-1.5">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg} shadow-sm`}>
                <a.icon className="h-5 w-5 text-primary-foreground" />
              </span>
              <span className="text-[10px] font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3 text-panel-foreground shadow-sm"
            style={{ background: "var(--gradient-violet)" }}
          >
            <div className="flex items-start justify-between">
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-bold">MOXERA SITE</span>
              <span className="text-[11px]">0.00</span>
            </div>
            <p className="mt-2 text-sm font-semibold">Balance</p>
            <div className="mt-3 h-1.5 rounded-full bg-white/25">
              <div className="h-full w-[10%] rounded-full bg-white" />
            </div>
          </div>
          <div
            className="rounded-xl p-3 text-panel-foreground shadow-sm"
            style={{ background: "var(--gradient-flame)" }}
          >
            <div className="flex items-start justify-between">
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-bold">MOXERA SITE</span>
              <span className="text-[11px]">0.00</span>
            </div>
            <p className="mt-2 text-sm font-semibold">Withdrawal</p>
            <div className="mt-3 h-1.5 rounded-full bg-white/25">
              <div className="h-full w-[5%] rounded-full bg-white" />
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Other Balances</p>
          <div className="mt-3 space-y-2">
            {OTHER_BALANCES.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2.5"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${b.bg}`}>
                  <b.icon className="h-4 w-4 text-primary-foreground" />
                </span>
                <span className="flex-1 text-sm text-foreground">{b.label}</span>
                <span className="rounded-lg bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
                  {b.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-accent">Foreigners wa kuchat nao</p>
            <span className="text-[11px] text-primary">wanabadilika kila mara</span>
          </div>
          <div className="space-y-2">
            {foreigners.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2.5">
                <span className="relative shrink-0">
                  <img
                    src={f.avatar}
                    alt={f.name}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/30"
                  />
                  <span className="absolute -bottom-1 -right-1 text-[10px]">{f.flag}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {f.country} · {f.platform} · {f.rate.toLocaleString()} TZS
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate({ to: "/chat/$id", params: { id: f.id } })}>
                  Chat
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">Network Growth</p>
            <span className="text-xs text-muted-foreground">0 Active</span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary p-2">
            <p className="min-w-0 flex-1 truncate text-[11px] text-foreground">{refLink}</p>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(refLink);
                toast.success("Link imekopiwa!");
              }}
            >
              <Copy className="h-3.5 w-3.5" /> COPY
            </Button>
          </div>
        </section>

        <button
          onClick={() => {
            clearUser();
            navigate({ to: "/" });
          }}
          className="mx-auto mt-6 flex items-center gap-2 text-xs font-semibold text-muted-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Toka
        </button>
      </div>
    </main>
  );
}

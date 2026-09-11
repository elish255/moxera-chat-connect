import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Lock } from "lucide-react";
import { getForeigner, loadUser, ACTIVATION_FEE, type MoxeraUser } from "@/lib/moxera";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({
    meta: [
      { title: "Chati na mgeni | Moxera Agencies" },
      {
        name: "description",
        content: "Fungua mazungumzo na mgeni anayejifunza Kiswahili na uanze kulipwa na Moxera Agencies.",
      },
      { property: "og:title", content: "Chati na mgeni | Moxera Agencies" },
      {
        property: "og:description",
        content: "Mazungumzo ya Kiswahili na wageni wanaotaka kujifunza — lipwa kwa kila mazungumzo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

type Msg = { from: "them" | "me"; text: string; time: string };

const now = () =>
  new Date().toLocaleTimeString("sw-TZ", { hour: "2-digit", minute: "2-digit", hour12: false });

function ChatPage() {
  const { id } = Route.useParams();
  const foreigner = getForeigner(id);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(true);
  const [input, setInput] = useState("");
  const [locked, setLocked] = useState(false);
  const [user, setUser] = useState<MoxeraUser | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(loadUser());
  }, []);

  useEffect(() => {
    if (!foreigner) return;
    setMessages([]);
    setTyping(true);
    const timers = foreigner.opener.map((text, i) =>
      setTimeout(
        () => {
          setMessages((m) => [...m, { from: "them", text, time: now() }]);
          if (i === foreigner.opener.length - 1) setTyping(false);
        },
        900 + i * 1600,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [foreigner]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  if (!foreigner) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">Mgeni huyu hapatikani kwa sasa.</p>
        <Button asChild>
          <Link to="/">Rudi mwanzo</Link>
        </Button>
      </main>
    );
  }

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "me", text, time: now() }]);
    setInput("");

    if (!user) {
      setTimeout(() => setLocked(true), 700);
      return;
    }

    const reply =
      foreigner.replies[sentCount % foreigner.replies.length] ?? "Asante sana rafiki!";
    setSentCount((c) => c + 1);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: "them", text: reply, time: now() }]);
    }, 1600);
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-card px-4 py-3 shadow-sm">
        <button onClick={() => navigate({ to: "/" })} aria-label="Rudi">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="relative shrink-0">
          <img
            src={foreigner.avatar}
            alt={foreigner.name}
            width={512}
            height={512}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/40"
          />
          <span className="absolute -bottom-1 -right-1 text-[11px]">{foreigner.flag}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{foreigner.name}</p>
          <p className="text-[11px] text-primary">
            {typing ? "anaandika…" : foreigner.online ? "mtandaoni" : foreigner.country}
          </p>
        </div>
        <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-primary">
          {foreigner.rate.toLocaleString()} TZS
        </span>
      </header>

      <div className="flex-1 space-y-3 px-4 py-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                m.from === "me"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              <p
                className={`mt-1 text-[10px] ${m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
              >
                {m.time}
              </p>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-card px-4 py-3 shadow-sm">
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-card px-3 py-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder="Andika jibu lako kwa Kiswahili…"
          className="max-h-28 flex-1 resize-none rounded-2xl bg-input px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <Button size="icon" className="h-10 w-10 rounded-full" onClick={handleSend} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={locked} onOpenChange={setLocked}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Jisajili ili uendelee kuchat</DialogTitle>
            <DialogDescription className="text-center">
              Ujumbe wako umefika. Ili uendelee kuchat na {foreigner.name} na kulipwa, unatakiwa
              kujisajili kwa Activation fee ya{" "}
              <span className="font-bold text-primary">{ACTIVATION_FEE.toLocaleString()} TZS</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-secondary p-3 text-xs text-foreground/80">
            Activation fee ni ya mara moja. Baada ya kujisajili, akaunti yako itafunguliwa, username
            yako itaonekana kwenye dashboard na malipo yako yataanza kuhesabiwa.
          </div>
          <Button asChild className="w-full font-bold">
            <a href="https://moxeraagencies.com/register?ref=Mtukazi">JISAJILI SASA</a>
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

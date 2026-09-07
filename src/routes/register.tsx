import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import logo from "@/assets/moxera-logo.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { ACTIVATION_FEE, COUNTRIES, saveUser } from "@/lib/moxera";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Jisajili | Moxera Agencies" },
      {
        name: "description",
        content:
          "Fungua akaunti yako ya Moxera Agencies kwa Activation fee ya 16,000 TZS na uanze kuchat na wageni kwa Kiswahili.",
      },
      { property: "og:title", content: "Jisajili | Moxera Agencies" },
      {
        property: "og:description",
        content: "Jaza taarifa zako, lipia Activation fee na uanze kulipwa kwa kuchat kwa Kiswahili.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Register,
});

const schema = z
  .object({
    fullName: z.string().trim().min(3, "Jina kamili linahitajika").max(100),
    username: z
      .string()
      .trim()
      .min(3, "Username iwe na herufi 3 au zaidi")
      .max(20, "Username ni ndefu sana")
      .regex(/^[a-zA-Z0-9_]+$/, "Username itumie herufi na namba tu"),
    phone: z.string().trim().min(9, "Namba ya simu si sahihi").max(20),
    email: z.string().trim().email("Barua pepe si sahihi").max(255),
    country: z.string().min(2, "Chagua nchi yako"),
    password: z.string().min(6, "Password iwe na herufi 6 au zaidi").max(72),
    confirm: z.string(),
    terms: z.literal(true, { message: "Kubali Terms of Service" }),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Password hazifanani",
  });

const field =
  "w-full rounded-xl bg-input px-4 py-3.5 text-sm text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2";

function Register() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    phone: "",
    email: "",
    country: "",
    password: "",
    confirm: "",
    terms: false,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    saveUser({
      fullName: parsed.data.fullName,
      username: parsed.data.username,
      phone: parsed.data.phone,
      email: parsed.data.email,
      country: parsed.data.country,
      registeredAt: new Date().toISOString(),
    });
    toast.success("Usajili umekamilika! Karibu Moxera Agencies.");
    navigate({ to: "/dashboard" });
  };

  const Err = ({ name }: { name: string }) =>
    errors[name] ? <p className="mt-1 px-1 text-xs text-destructive">{errors[name]}</p> : null;

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-md rounded-3xl bg-card p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <img src={logo.url} alt="Moxera Agencies" className="h-10 w-10 rounded-lg object-cover" />
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-accent">Create Account</h1>
            <p className="text-xs text-muted-foreground">Moxera Agencies</p>
          </div>
          <span className="text-xs text-muted-foreground">Step 1 of 1</span>
        </div>

        <div className="mt-4 rounded-xl bg-secondary p-3 text-xs text-foreground/80">
          Activation fee: <span className="font-bold text-primary">{ACTIVATION_FEE.toLocaleString()} TZS</span> —
          ya mara moja, inakufungulia kuchat na kulipwa.
        </div>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div>
            <input
              className={field}
              placeholder="Full Name"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
            <Err name="fullName" />
          </div>
          <div>
            <input
              className={field}
              placeholder="Username"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
            />
            <Err name="username" />
          </div>
          <div>
            <input
              className={field}
              placeholder="Phone Number"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
            <Err name="phone" />
          </div>
          <div>
            <input
              className={field}
              placeholder="Email Address"
              inputMode="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <Err name="email" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Country</label>
            <select
              className={field}
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
            >
              <option value="">Choose Your Country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Err name="country" />
          </div>
          <div>
            <div className="relative">
              <input
                className={field}
                type={show ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Onyesha password"
              >
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <Err name="password" />
          </div>
          <div>
            <input
              className={field}
              type={show ? "text" : "password"}
              placeholder="Confirm Password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
            />
            <Err name="confirm" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--primary)]"
                checked={form.terms}
                onChange={(e) => set("terms", e.target.checked)}
              />
              <span>
                Nakubali <span className="font-bold text-primary">Terms of Service</span>
              </span>
            </label>
            <Err name="terms" />
          </div>

          <Button type="submit" className="h-12 w-full text-base font-bold">
            Create My Account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Umeshajisajili?{" "}
          <Link to="/dashboard" className="font-bold text-primary">
            Login Here
          </Link>
        </p>
      </div>
    </main>
  );
}

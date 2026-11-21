import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  requestSmsRecovery,
  verifySmsRecovery,
  completeSmsRecovery,
} from "@/lib/sms-recovery";
import { normalizeTanzaniaPhone } from "@/lib/phone";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [step, setStep] = useState<"phone" | "otp" | "password" | "saved">(
    "phone",
  );
  const [phone, setPhone] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [grant, setGrant] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    if (busy || cooldown > 0) return;
    setBusy(true);
    setError("");
    try {
      const normalized = normalizeTanzaniaPhone(phone);
      const result = await requestSmsRecovery({ data: { phone: normalized } });
      setPhone(normalized);
      setChallengeId(result.challengeId);
      setCode("");
      setGrant("");
      setCooldown(60);
      setStep("otp");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "OTP haijatumwa. Jaribu tena baadaye.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Weka OTP ya tarakimu 6 kutoka kwenye SMS.");
      return;
    }
    setBusy(true);
    try {
      const result = await verifySmsRecovery({ data: { challengeId, code } });
      setGrant(result.grant);
      setCode("");
      setStep("password");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "OTP haijathibitishwa.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !grant) return;
    setError("");
    if (password.length < 6 || password.length > 128) {
      setError("Password iwe na herufi 6 hadi 128.");
      return;
    }
    if (password !== confirm) {
      setError("Password hazifanani.");
      return;
    }
    setBusy(true);
    try {
      await completeSmsRecovery({ data: { challengeId, grant, password } });
      await supabase?.auth.signOut({ scope: "local" }).catch(() => {});
      setPassword("");
      setConfirm("");
      setGrant("");
      setChallengeId("");
      setStep("saved");
    } catch (error) {
      // A consumed grant is never retried, including ambiguous network failures.
      setGrant("");
      setPassword("");
      setConfirm("");
      setStep("otp");
      setError(
        error instanceof Error
          ? error.message
          : "Hatujaweza kuthibitisha kama password imehifadhiwa. Jaribu kuingia; ikishindikana omba OTP mpya.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl">
        <h1 className="text-2xl font-extrabold text-accent">
          {step === "phone"
            ? "Umesahau Password?"
            : step === "otp"
              ? "Weka OTP ya SMS"
              : step === "password"
                ? "Weka password mpya"
                : "Password imebadilishwa"}
        </h1>
        {step === "phone" && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Weka namba ya simu uliyotumia kujisajili. Utapokea OTP kwenye SMS,
              kisha utaweka password mpya hapa.
            </p>
            <form onSubmit={sendCode} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="recovery-phone">Namba ya simu ya usajili</Label>
                <Input
                  id="recovery-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={40}
                  placeholder="07xxxxxxxx au 2557xxxxxxxx"
                  className="mt-1 h-11"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={busy}
                />
              </div>
              <Button
                type="submit"
                className="h-12 w-full font-bold"
                disabled={busy || cooldown > 0}
              >
                {busy
                  ? "Inatuma…"
                  : cooldown > 0
                    ? `Subiri sekunde ${cooldown}`
                    : "Tuma OTP kwa SMS"}
              </Button>
            </form>
          </>
        )}
        {step === "otp" && (
          <>
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              Kama namba hii ina account moja iliyosajiliwa, utapokea SMS. Tumia
              code mpya zaidi ndani ya dakika 5. Kama SMS haifiki, hakikisha
              namba ni sahihi au wasiliana na huduma kwa wateja.
            </p>
            <p className="mt-2 text-sm">Namba: +{phone}</p>
            <form onSubmit={verify} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="recovery-otp">OTP ya tarakimu 6</Label>
                <Input
                  id="recovery-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  required
                  className="mt-1 h-11"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  disabled={busy}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Usimpe mtu mwingine OTP yako. Una majaribio 5 kwa kila code.
              </p>
              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full font-bold"
              >
                {busy ? "Inathibitisha…" : "Thibitisha OTP"}
              </Button>
            </form>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy || cooldown > 0}
                onClick={() => void sendCode()}
              >
                {cooldown > 0
                  ? `Tuma tena baada ya sekunde ${cooldown}`
                  : "Tuma OTP nyingine"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setChallengeId("");
                  setError("");
                }}
              >
                Badilisha namba
              </Button>
            </div>
          </>
        )}
        {step === "password" && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Namba imethibitishwa kwa OTP. Chagua password mpya ndani ya dakika
              5.
            </p>
            <form onSubmit={save} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="new-password">Password mpya</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  maxLength={128}
                  className="mt-1 h-11"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={busy}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Rudia password mpya</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  maxLength={128}
                  className="mt-1 h-11"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  disabled={busy}
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full font-bold"
              >
                {busy ? "Inahifadhi…" : "Hifadhi password mpya"}
              </Button>
            </form>
          </>
        )}
        {step === "saved" && (
          <p role="status" className="mt-4 text-sm">
            Sasa ingia kwa username au email yako na password mpya.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="mt-5 text-center text-sm">
          <Link to="/login" className="font-bold text-primary hover:underline">
            {step === "saved" ? "Ingia kwa password mpya" : "Rudi Login"}
          </Link>
        </p>
      </div>
    </main>
  );
}

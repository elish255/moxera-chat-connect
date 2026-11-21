import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { isPasswordRecoverySession, requireSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [requestedEmail, setRequestedEmail] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
    setNotice("");
    const address = requestedEmail || email.trim().toLowerCase();
    try {
      // This is a recovery OTP, not passwordless sign-in: never create an account.
      // The Supabase Reset password email template must render {{ .Token }}.
      const { error } = await requireSupabase().auth.resetPasswordForEmail(
        address,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );
      if (error) throw error;
      setRequestedEmail(address);
      setToken("");
      setCooldown(60);
      setNotice(
        "Kama email hii imesajiliwa, utapokea OTP. Angalia inbox na spam, kisha weka code hapa. Tumia code ya email mpya zaidi.",
      );
    } catch {
      setError(
        "Imeshindikana kutuma OTP kwa sasa. Subiri kidogo kisha ujaribu tena.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (busy || !requestedEmail) return;
    setError("");
    const code = token.trim();
    // Supabase projects may use different OTP lengths (including 6 or 8 digits).
    if (!/^[0-9]{6,10}$/.test(code)) {
      setError("Weka code ya tarakimu ulizopokea kwenye email.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await requireSupabase().auth.verifyOtp({
        email: requestedEmail,
        token: code,
        type: "recovery",
      });
      if (
        error ||
        !data.session ||
        !isPasswordRecoverySession(data.session.user.id)
      ) {
        setError(
          "OTP si sahihi au muda wake umeisha. Tumia code mpya zaidi au omba nyingine.",
        );
        return;
      }
      setToken("");
      await navigate({ to: "/reset-password" });
    } catch {
      setError(
        "OTP haijathibitishwa. Angalia muunganisho wako kisha ujaribu tena.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl">
        <h1 className="text-2xl font-extrabold text-accent">
          {requestedEmail ? "Weka OTP ya email" : "Umesahau Password?"}
        </h1>
        {requestedEmail ? (
          <>
            <p className="mt-2 break-words text-sm text-muted-foreground">
              Email: {requestedEmail}
            </p>
            {notice && (
              <p role="status" className="mt-3 text-sm text-muted-foreground">
                {notice}
              </p>
            )}
            <form onSubmit={verifyCode} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="recovery-otp">Code ya OTP</Label>
                <Input
                  id="recovery-otp"
                  className="mt-1 h-11"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6,10}"
                  minLength={6}
                  maxLength={10}
                  required
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  disabled={busy}
                  aria-describedby="otp-help"
                />
                <p id="otp-help" className="mt-2 text-xs text-muted-foreground">
                  Weka code kutoka kwenye email, si password yako. Usimpe mtu
                  mwingine code hii.
                </p>
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full font-bold"
              >
                {busy ? "Inasubiri…" : "Thibitisha OTP"}
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
                  setRequestedEmail("");
                  setToken("");
                  setError("");
                  setNotice("");
                }}
              >
                Badilisha email
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Weka email uliyojisajili nayo. Tutakutumia OTP; utaithibitisha
              hapa kisha uchague password mpya.
            </p>
            <form onSubmit={sendCode} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="recovery-email">Email uliyojisajili nayo</Label>
                <Input
                  id="recovery-email"
                  className="mt-1 h-11"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={busy}
                />
              </div>
              <Button
                type="submit"
                disabled={busy || cooldown > 0}
                className="h-12 w-full font-bold"
              >
                {busy
                  ? "Inatuma…"
                  : cooldown > 0
                    ? `Subiri sekunde ${cooldown}`
                    : "Tuma OTP"}
              </Button>
            </form>
          </>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="mt-5 text-center text-sm">
          <Link to="/login" className="font-bold text-primary hover:underline">
            Rudi Login
          </Link>
        </p>
      </div>
    </main>
  );
}

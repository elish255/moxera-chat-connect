import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  isPasswordRecoverySession,
  supabase,
  requireSupabase,
} from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const [status, setStatus] = useState<
    "loading" | "invalid" | "ready" | "saved"
  >("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const db = supabase;
    if (!db) {
      setStatus("invalid");
      return;
    }
    let mounted = true;
    const check = (userId: string | undefined) => {
      if (mounted)
        setStatus(isPasswordRecoverySession(userId) ? "ready" : "invalid");
    };
    const { data } = db.auth.onAuthStateChange((_event, session) =>
      check(session?.user.id),
    );
    void db.auth
      .getSession()
      .then(({ data, error }) =>
        check(error ? undefined : data.session?.user.id),
      )
      .catch(() => check(undefined));
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || status !== "ready") return;
    setError("");
    if (password.length < 6) {
      setError("Password iwe na angalau herufi 6.");
      return;
    }
    if (password !== confirm) {
      setError("Password hazifanani.");
      return;
    }
    setBusy(true);
    try {
      const db = requireSupabase();
      const { data, error: sessionError } = await db.auth.getSession();
      if (sessionError || !isPasswordRecoverySession(data.session?.user.id)) {
        setStatus("invalid");
        return;
      }
      const { error } = await db.auth.updateUser({ password });
      if (error) throw error;
      // Password is already saved even if local sign-out fails; do not invite a
      // second update. The login screen accepts the user's new credentials.
      await db.auth.signOut({ scope: "local" }).catch(() => {});
      setPassword("");
      setConfirm("");
      setStatus("saved");
    } catch {
      setError(
        "Password haijabadilishwa. Jaribu tena au omba OTP mpya ikiwa muda wake umeisha. Hakikisha password inakidhi masharti ya account yako.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl">
        <h1 className="text-2xl font-extrabold text-accent">
          Weka password mpya
        </h1>
        {status === "loading" && (
          <p role="status" className="mt-4 text-sm">
            Inathibitisha ruhusa ya kuweka password…
          </p>
        )}
        {status === "invalid" && (
          <div className="mt-4 space-y-4">
            <p role="alert" className="text-sm text-muted-foreground">
              OTP haijathibitishwa au muda wa session umeisha. Omba OTP mpya
              kupitia email uliyojisajili nayo.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block font-bold text-primary hover:underline"
            >
              Omba OTP mpya
            </Link>
          </div>
        )}
        {status === "saved" && (
          <div className="mt-4 space-y-4">
            <p role="status" className="text-sm">
              Password imebadilishwa. Sasa ingia kwa password yako mpya.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Ingia kwa password mpya</Link>
            </Button>
          </div>
        )}
        {status === "ready" && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="new-password">Password mpya</Label>
              <Input
                id="new-password"
                className="mt-1 h-11"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Rudia password mpya</Label>
              <Input
                id="confirm-password"
                className="mt-1 h-11"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                disabled={busy}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}{" "}
                <Link to="/forgot-password" className="font-bold underline">
                  Omba OTP mpya
                </Link>
              </p>
            )}
            <Button
              type="submit"
              disabled={busy}
              className="h-12 w-full font-bold"
            >
              {busy ? "Inahifadhi…" : "Hifadhi password mpya"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

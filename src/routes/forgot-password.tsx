import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { requireSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await requireSupabase().auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );
      if (error) throw error;
      setSent(true);
    } catch {
      setError(
        "Imeshindikana kutuma kiungo kwa sasa. Subiri kidogo kisha ujaribu tena.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl">
        <h1 className="text-2xl font-extrabold text-accent">
          Umesahau Password?
        </h1>
        {sent ? (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            Kama email hii imesajiliwa, utapokea kiungo cha kuweka password
            mpya. Angalia inbox na spam. Fungua kiungo hicho ili kuendelea.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Weka email uliyojisajili nayo. Tutakutumia kiungo salama cha
              kuweka password mpya.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
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
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full font-bold"
              >
                {busy ? "Inatuma…" : "Tuma kiungo cha password mpya"}
              </Button>
            </form>
          </>
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

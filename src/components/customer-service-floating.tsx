import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Lock, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerSupportChat } from "@/components/customer-support-chat";
import { getCurrentMoxeraUser, subscribeAuth } from "@/lib/auth";

export function CustomerServiceFloating() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: user } = useQuery({
    queryKey: ["moxera-current-user"],
    queryFn: getCurrentMoxeraUser,
    staleTime: 30_000,
  });

  useEffect(() => {
    const unsubscribe = subscribeAuth(() => {
      window.setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["moxera-current-user"],
        });
      }, 0);
    });
    return unsubscribe;
  }, [queryClient]);

  if (user?.status === "active") {
    return <CustomerSupportChat user={user} floating />;
  }

  const ctaTo = user ? "/payment" : "/register";
  const ctaLabel = user ? "Active Account Sasa" : "Jisajili Sasa";

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-2 sm:right-6">
      {open && (
        <div
          role="dialog"
          aria-labelledby="support-locked-title"
          className="mb-1 flex w-[min(320px,calc(100vw-2rem))] flex-col items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 text-center shadow-2xl animate-in fade-in slide-in-from-bottom-2"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Lock className="size-6" />
          </span>
          <p
            id="support-locked-title"
            className="text-pretty text-base font-extrabold uppercase leading-snug text-foreground"
          >
            Jisajili kwanza kisha{" "}
            <span className="text-primary">active account</span> kupata msaada
          </p>
          <Button asChild className="w-full font-bold uppercase">
            <Link to={ctaTo} onClick={() => setOpen(false)}>
              {ctaLabel}
            </Link>
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Funga Customer Service" : "Fungua Customer Service"}
        aria-expanded={open}
        className="customer-service-blink group relative flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-full border-4 border-background bg-card shadow-2xl ring-2 ring-primary/40 transition-transform hover:scale-105 sm:h-20 sm:w-20"
      >
        <img
          src="/customer-care.png"
          alt="Customer Care"
          className="h-full w-full object-cover"
        />
        <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          {open ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <MessageCircle className="h-3.5 w-3.5" />
          )}
        </span>
      </button>
    </div>
  );
}

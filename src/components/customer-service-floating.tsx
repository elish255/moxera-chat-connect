import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export function CustomerServiceFloating() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-2 sm:right-6">
      {open && (
        <div className="mb-1 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-foreground">Customer Service</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Jisajili Kwanza na Activate Account yko ili Kupata Msaada
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Funga Customer Service" : "Fungua Customer Service"}
        aria-expanded={open}
        className="customer-service-blink group relative flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-full border-4 border-background bg-card shadow-2xl ring-2 ring-primary/40 transition-transform hover:scale-105 sm:h-20 sm:w-20"
      >
        <img src="/customer-care.png" alt="Customer Care" className="h-full w-full object-cover" />
        <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          {open ? <X className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
        </span>
      </button>
    </div>
  );
}

import { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";

const SMS_NUMBER = "0743871339";
const SMS_TEXT = "Nielekeze kuhusu Moxera";
const WHATSAPP_CHANNEL =
  "https://chat.whatsapp.com/HJR16xnRf53J54yvIrIJwA?s=cl&p=a&mlu=4&ilr=4";

export function CustomerServiceFloating() {
  const [open, setOpen] = useState(false);

  const smsHref = `sms:${SMS_NUMBER}?body=${encodeURIComponent(SMS_TEXT)}`;

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-2 sm:right-6">
      {open && (
        <div className="mb-1 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <p className="px-3 py-2 text-xs font-bold text-foreground">Customer Service</p>

          <a
            href={smsHref}
            className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-secondary"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Phone className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">Normal SMS</span>
              <span className="block text-xs text-muted-foreground">{SMS_NUMBER}</span>
              <span className="block truncate text-[10px] text-primary">“{SMS_TEXT}”</span>
            </span>
          </a>

          <a
            href={WHATSAPP_CHANNEL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-secondary"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">WhatsApp Channel</span>
              <span className="block text-xs text-muted-foreground">Jiunge nasi WhatsApp</span>
            </span>
          </a>
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

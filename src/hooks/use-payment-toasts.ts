import { useEffect } from "react";
import { toast } from "sonner";
import { playSound } from "@/lib/gochat-sound";

// Demo testimonials: sample UI entries; replace with verified customer feedback before publishing.
const PAYMENT_TESTIMONIALS = [
  { name: "Juma Malecela (+255 763...267)", text: "ametoa TSh 88,000 akiwa Iringa", time: "Dakika 9 zilizopita" },
  { name: "Amina Hassan (+255 754...875)", text: "amepokea TSh 50,000 kutoka Zanzibar", time: "Dakika 12 zilizopita" },
  { name: "Neema Joseph (+255 713...402)", text: "amelipwa TSh 120,000 kwa kuchat", time: "Dakika 15 zilizopita" },
  { name: "Hassan Ally (+255 768...119)", text: "amepokea TSh 150,000 kwa mazungumzo", time: "Dakika 18 zilizopita" },
  { name: "Rehema John (+255 655...831)", text: "amelipwa TSh 70,000 kupitia Moxera", time: "Dakika 21 zilizopita" },
  { name: "Baraka Mussa (+255 719...544)", text: "amepokea TSh 95,000 kwa kuchat", time: "Dakika 24 zilizopita" },
  { name: "Zawadi Said (+255 742...901)", text: "amelipwa TSh 110,000 baada ya mazungumzo", time: "Dakika 27 zilizopita" },
  { name: "Mariam Omar (+255 714...620)", text: "amepokea TSh 65,000 kwa kuchat", time: "Dakika 30 zilizopita" },
  { name: "Abdallah Salim (+255 756...315)", text: "amelipwa TSh 130,000 kwa mazungumzo", time: "Dakika 34 zilizopita" },
  { name: "Esther Peter (+255 687...208)", text: "amepokea TSh 80,000 kupitia Moxera", time: "Dakika 37 zilizopita" },
  { name: "Kelvin Simon (+255 625...774)", text: "amelipwa TSh 105,000 kwa kuchat", time: "Dakika 41 zilizopita" },
  { name: "Salma Juma (+255 699...462)", text: "amepokea TSh 55,000 baada ya kuchat", time: "Dakika 45 zilizopita" },
];

const TOAST_ID = "moxera-payment-testimonial";

export function usePaymentToasts(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let index = 0;

    // One toast at a time: visible for 3s, next one 10s later (13s cycle).
    const show = () => {
      const item = PAYMENT_TESTIMONIALS[index % PAYMENT_TESTIMONIALS.length];
      if (!item) return;
      playSound("notice");
      toast.success(item.name, {
        id: TOAST_ID,
        description: `${item.text} • ${item.time} • Malipo yamefanikiwa`,
        duration: 3000,
        className: "moxera-payment-toast",
      });
      index += 1;
    };

    const first = window.setTimeout(show, 1800);
    const interval = window.setInterval(show, 13000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      toast.dismiss(TOAST_ID);
    };
  }, [enabled]);
}

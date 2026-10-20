import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getCurrentMoxeraUser } from '@/lib/auth';
import { normalizeTanzaniaPhone } from '@/lib/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ACTIVATION_FEE = Number(import.meta.env.VITE_ACTIVATION_FEE || 16000);
const PLAN_FEES: Record<string, number> = { activation: ACTIVATION_FEE, premium: 32000, vip: 35500 };

export const Route = createFileRoute('/payment')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const action = String(body?.action ?? 'create');
          const plan = ['activation','premium','vip'].includes(String(body?.plan ?? 'activation')) ? String(body?.plan ?? 'activation') : 'activation';
          const authHeader = request.headers.get('authorization') ?? '';
          const token = authHeader.replace(/^Bearer\s+/i, '').trim();
          const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
          const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
          const secretKey = process.env.PAYMENT_API_SECRET;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (!supabaseUrl || !anonKey || !secretKey || !serviceKey) return Response.json({ error: 'Payment service is not configured.' }, { status: 500 });
          if (!token) return Response.json({ error: 'Unauthenticated.' }, { status: 401 });

          const { createClient } = await import('@supabase/supabase-js');
          const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
          const { data: authData, error: authError } = await authClient.auth.getUser(token);
          if (authError || !authData.user) return Response.json({ error: 'Unauthenticated.' }, { status: 401 });
          const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

          if (action === 'create') {
            const { data: user, error: userError } = await db.from('moxera_users').select('id,full_name,email,phone,status,payment_status,membership_level').eq('id', authData.user.id).maybeSingle();
            if (userError || !user) return Response.json({ error: 'User profile not found.' }, { status: 404 });
            if (user.status === 'banned') return Response.json({ error: 'Akaunti yako imezuiwa.' }, { status: 403 });
            if (plan === 'activation' && user.payment_status === 'paid') return Response.json({ error: 'Malipo ya activation tayari yamekamilika.' }, { status: 409 });
            if (plan === 'premium' && user.membership_level === 'premium') return Response.json({ error: 'Account yako tayari ni Premium.' }, { status: 409 });
            if (plan === 'vip' && user.membership_level === 'vip') return Response.json({ error: 'Account yako tayari ni VIP.' }, { status: 409 });

            const requestedPhone = String(body?.phone ?? '').trim();
            if (!requestedPhone) return Response.json({ error: 'Weka namba ya simu utakayotumia kulipia.' }, { status: 400 });
            let phone: string;
            try {
              phone = normalizeTanzaniaPhone(requestedPhone);
            } catch {
              return Response.json({ error: 'Weka namba sahihi ya Tanzania, kwa mfano 0787483953.' }, { status: 400 });
            }
            const amount = plan === 'premium' ? 32000 : plan === 'vip' ? 35500 : Number(process.env.VITE_ACTIVATION_FEE ?? 16000);
            const reference = `MX-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
            const upstream = await fetch('https://fimipay.com/api/v1/payment/create_order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'Moxera-Payment/1.0', Authorization: `Bearer ${secretKey}` },
              body: JSON.stringify({ buyer_email: user.email, buyer_name: user.full_name, buyer_phone: phone, amount, currency: 'TZS', payment_method: 'mobile' }),
            });
            const payload = await upstream.json().catch(() => ({}));
            if (!upstream.ok || payload?.status !== 'success' || !payload?.data?.order_id) return Response.json({ error: payload?.message || 'Imeshindikana kuanzisha malipo.' }, { status: 502 });

            const orderId = String(payload.data.order_id);
            const { error: insertError } = await db.from('moxera_payments').insert({ user_id: user.id, amount, currency: 'TZS', provider: 'mobile', plan, reference, external_order_id: orderId, status: 'pending' });
            if (insertError) return Response.json({ error: 'Malipo yameanzishwa lakini kumbukumbu haikuhifadhiwa.' }, { status: 500 });
            if (plan === 'activation') await db.from('moxera_users').update({ payment_status: 'pending', phone, updated_at: new Date().toISOString() }).eq('id', user.id);
            return Response.json({ ok: true, orderId, reference, paymentStatus: payload.data.payment_status ?? 'PENDING' });
          }

          if (action === 'status') {
            const orderId = String(body?.orderId ?? '').trim();
            if (!orderId) return Response.json({ error: 'Order ID missing.' }, { status: 400 });
            const { data: payment } = await db.from('moxera_payments').select('*').eq('external_order_id', orderId).eq('user_id', authData.user.id).maybeSingle();
            if (!payment) return Response.json({ error: 'Payment not found.' }, { status: 404 });

            const upstream = await fetch('https://fimipay.com/api/v1/payment/order_status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'Moxera-Payment/1.0', Authorization: `Bearer ${secretKey}` },
              body: JSON.stringify({ order_id: orderId }),
            });
            const payload = await upstream.json().catch(() => ({}));
            if (!upstream.ok || payload?.status !== 'success') return Response.json({ error: payload?.message || 'Status haikupatikana.' }, { status: 502 });

            const paymentStatus = String(payload?.data?.payment_status ?? 'PENDING').toUpperCase();
            const transactionId = payload?.data?.transid ? String(payload.data.transid) : null;
            if (['SUCCESS', 'COMPLETED'].includes(paymentStatus)) {
              await db.from('moxera_payments').update({ status: 'paid', paid_at: new Date().toISOString(), transaction_id: transactionId, updated_at: new Date().toISOString() }).eq('id', payment.id);
              const paidPlan = ['activation','premium','vip'].includes(String(payment.plan)) ? String(payment.plan) : 'activation';
              await db.from('moxera_users').update({ ...(paidPlan === 'activation' ? { payment_status: 'paid' } : { membership_level: paidPlan }), status: 'active', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', authData.user.id);
              await db.from('moxera_notifications').insert({ user_id: authData.user.id, title: paidPlan === 'premium' ? 'Premium imewashwa' : paidPlan === 'vip' ? 'VIP imewashwa' : 'Account imewashwa', message: paidPlan === 'premium' ? 'Malipo yamekamilika. Account yako sasa ni Premium.' : paidPlan === 'vip' ? 'Malipo yamekamilika. Account yako sasa ni VIP.' : 'Malipo ya activation yamekamilika.' });
            } else if (['CANCELLED', 'USERCANCELLED', 'REJECTED'].includes(paymentStatus)) {
              await db.from('moxera_payments').update({ status: 'rejected', transaction_id: transactionId, updated_at: new Date().toISOString() }).eq('id', payment.id);
              await db.from('moxera_users').update({ payment_status: 'rejected', updated_at: new Date().toISOString() }).eq('id', authData.user.id);
            }
            return Response.json({ ok: true, paymentStatus, transactionId });
          }
          return Response.json({ error: 'Unknown action.' }, { status: 400 });
        } catch (error) {
          console.error(error);
          return Response.json({ error: 'Imeshindikana kushughulikia malipo.' }, { status: 500 });
        }
      },
    },
  },
  component: Payment,
});

async function paymentRequest(body: Record<string, unknown>) {
  if (!supabase) throw new Error('Supabase haijawekwa.');
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Ingia kwanza.');
  const response = await fetch('/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Imeshindikana.');
  return data;
}

function Payment() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState('PENDING');
  const [paid, setPaid] = useState(false);
  const [failed, setFailed] = useState(false);
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<'activation'|'premium'|'vip'>('activation');
  const FEE = PLAN_FEES[plan];

  useEffect(() => {
    getCurrentMoxeraUser().then(async (u) => {
      if (!u) { nav({ to: '/register' }); return; }
      setPhone(u.phone);
      const requestedPlan = new URLSearchParams(window.location.search).get('plan');
      const currentPlan = requestedPlan === 'premium' || requestedPlan === 'vip' ? requestedPlan : 'activation';
      setPlan(currentPlan);
      if (currentPlan === 'activation' && u.paymentStatus === 'paid') {
        setPaid(true);
        if (u.status === 'active') nav({ to: '/dashboard' });
        return;
      }
      if (currentPlan === 'premium' && u.membershipLevel === 'premium') { setPaid(true); nav({ to: '/dashboard' }); return; }
      if (currentPlan === 'vip' && u.membershipLevel === 'vip') { setPaid(true); nav({ to: '/dashboard' }); return; }
      if (!supabase) return;
      const { data } = await supabase.from('moxera_payments').select('external_order_id,status').eq('user_id', u.id).eq('plan', currentPlan).eq('status', 'pending').not('external_order_id', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data?.external_order_id) setOrderId(data.external_order_id);
    }).catch(() => undefined);
  }, [nav]);

  useEffect(() => {
    if (!orderId || paid || failed) return;
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const result = await paymentRequest({ action: 'status', orderId });
        if (cancelled) return;
        setStatus(result.paymentStatus);
        if (['SUCCESS', 'COMPLETED'].includes(String(result.paymentStatus).toUpperCase())) { setPaid(true); toast.success('Malipo yamefanikiwa! Akaunti yako imewezeshwa.'); nav({ to: '/dashboard' }); return; }
        if (['CANCELLED', 'USERCANCELLED', 'REJECTED'].includes(result.paymentStatus)) { setFailed(true); return; }
      } catch (error) {
        if (attempts >= 40) { toast.error(error instanceof Error ? error.message : 'Imeshindikana kuangalia malipo.'); }
      }
      if (!cancelled && attempts < 40) window.setTimeout(poll, 3000);
    };
    void poll();
    return () => { cancelled = true; };
  }, [orderId, paid, failed, nav]);

  async function start() {
    setBusy(true);
    try {
      const normalizedPhone = normalizeTanzaniaPhone(phone);
      setPhone(normalizedPhone);
      const result = await paymentRequest({ action: 'create', phone: normalizedPhone, plan });
      setOrderId(result.orderId);
      setStatus(result.paymentStatus || 'PENDING');
      toast.success('Ombi la malipo limetumwa kwenye simu yako.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Imeshindikana kuanzisha malipo.'); }
    finally { setBusy(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
    <div className="w-full max-w-md rounded-3xl bg-card p-6 text-center shadow-xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><CreditCard className="h-8 w-8 text-primary" /></div>
      <h1 className="mt-4 text-2xl font-extrabold text-accent">{plan === 'premium' ? 'Upgrade Premium' : plan === 'vip' ? 'Upgrade VIP' : 'Activate Account'}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{plan === 'premium' ? 'Lipa ada ya Premium.' : plan === 'vip' ? 'Lipa ada ya VIP.' : 'Lipa ada ya kuanzisha account yako.'}</p>
      <div className="my-6 rounded-2xl bg-secondary p-5">
        <p className="text-xs text-muted-foreground">Activation Fee</p>
        <p className="mt-1 text-3xl font-extrabold">{FEE.toLocaleString()} TZS</p>
      </div>
      {!orderId && !paid && !failed && <>
        <div className="text-left">
          <label htmlFor="payment-phone" className="mb-2 block text-sm font-semibold">Namba ya simu ya kulipia</label>
          <Input
            id="payment-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0787483953"
            className="h-12 text-base"
            disabled={busy}
          />
        </div>
        <Button disabled={busy || !phone.trim()} onClick={start} className="mt-4 h-12 w-full font-bold">{busy ? 'Inaandaa malipo…' : 'LIPA SASA'}</Button>
      </>}
      {orderId && !paid && !failed && <div className="rounded-2xl bg-secondary p-5"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary"/><p className="mt-2 font-bold">Subiri uthibitisho wa malipo…</p><p className="mt-1 text-xs text-muted-foreground">Status: {status}. Mfumo unaangalia malipo moja kwa moja.</p></div>}
      {paid && <div className="rounded-2xl bg-secondary p-5"><CheckCircle2 className="mx-auto h-8 w-8 text-primary"/><p className="mt-2 font-bold">Malipo yamefanikiwa</p><p className="mt-1 text-sm text-muted-foreground">Malipo yamethibitishwa na akaunti yako imewezeshwa. Unaweza kuendelea kuchat na kupata malipo.</p><Button onClick={() => nav({ to: '/dashboard' })} variant="outline" className="mt-4">Nenda Dashboard</Button></div>}
      {failed && <div className="rounded-2xl bg-secondary p-5"><p className="font-bold">Malipo hayajakamilika</p><p className="mt-1 text-sm text-muted-foreground">Unaweza kujaribu tena.</p><Button onClick={() => { setOrderId(null); setFailed(false); }} className="mt-4">Jaribu tena</Button></div>}
      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Malipo salama</div>
    </div>
  </main>;
}

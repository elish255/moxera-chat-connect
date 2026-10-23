import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

type Recipient = { phone: string; username: string };

export const sendMoxeraAdminSms = createServerFn({ method: "POST" })
  .inputValidator((input: { accessToken: string; recipients: Recipient[]; message: string }) => {
    if (!input || typeof input.accessToken !== "string" || input.accessToken.length < 20) throw new Error("Admin session haijathibitishwa.");
    if (!Array.isArray(input.recipients) || input.recipients.length < 1 || input.recipients.length > 500) throw new Error("Chagua users 1 hadi 500 kwa kila batch.");
    if (typeof input.message !== "string" || !input.message.trim() || input.message.length > 1000) throw new Error("Weka SMS isiyozidi herufi 1000.");
    const recipients = input.recipients.map((r) => {
      if (!r || typeof r.phone !== "string" || typeof r.username !== "string") throw new Error("Taarifa za mpokeaji si sahihi.");
      let phone = r.phone.trim().replace(/[\s().-]/g, "");
      if (phone.startsWith("+")) phone = phone.slice(1);
      if (phone.startsWith("00")) phone = phone.slice(2);
      if (phone.startsWith("0")) phone = `255${phone.slice(1)}`;
      if (/^[67]\d{8}$/.test(phone)) phone = `255${phone}`;
      if (!/^255[67]\d{8}$/.test(phone)) throw new Error(`Namba si sahihi kwa username ${r.username}.`);
      const username = r.username.trim().slice(0, 80);
      if (!username) throw new Error("Username haipo kwa mmoja wa watumiaji.");
      return { phone, username };
    });
    return { accessToken: input.accessToken, recipients, message: input.message.trim() };
  })
  .handler(async ({ data }) => {
    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const apiKey = process.env.DARSMS_API_KEY;
    const senderId = process.env.DARSMS_SENDER_ID || "AJIRA PLUS";
    if (!url || !anonKey) throw new Error("Supabase server configuration haipo.");
    if (!apiKey) throw new Error("DARSMS_API_KEY haijawekwa kwenye Vercel.");

    // Verify the caller's Supabase session and admin membership on the server.
    const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await supabase.auth.getUser(data.accessToken);
    if (authError || !authData.user) throw new Error("Session imeisha. Ingia tena kama admin.");
    const { data: admin, error: adminError } = await supabase
      .from("moxera_admins").select("user_id").eq("user_id", authData.user.id).maybeSingle();
    if (adminError || !admin) throw new Error("Huruhusiwi kutuma SMS kupitia admin panel.");

    let sent = 0;
    const failed: { username: string; reason: string }[] = [];
    // Personalize each SMS so every user receives their own username.
    for (const recipient of data.recipients) {
      const message = data.message.replace(/\[\s*username\s*\]/gi, recipient.username);
      try {
        const response = await fetch("https://dev.darsms.co.tz/api/v1/integrations/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
          body: JSON.stringify({ senderId, to: [recipient.phone], message }),
          signal: AbortSignal.timeout(12000),
        });
        const result = await response.json().catch(() => null) as { success?: boolean; message?: string } | null;
        if (!response.ok || result?.success !== true) {
          failed.push({ username: recipient.username, reason: result?.message || `DARSMS HTTP ${response.status}` });
        } else sent++;
      } catch (e) {
        failed.push({ username: recipient.username, reason: e instanceof Error ? e.message : "Network error" });
      }
    }
    console.info("DARSMS admin bulk send result", { adminId: authData.user.id, attempted: data.recipients.length, sent, failed: failed.length });
    return { attempted: data.recipients.length, sent, failed };
  });

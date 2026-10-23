import { createServerFn } from "@tanstack/react-start";

/** Sends the post-registration SMS from the server; API credentials never reach the browser. */
export const sendMoxeraRegistrationSms = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string; username: string }) => {
    if (!input || typeof input.phone !== "string" || typeof input.username !== "string") {
      throw new Error("Taarifa za SMS si sahihi.");
    }
    const phone = input.phone.trim().replace(/[\s().-]/g, "");
    const username = input.username.trim();
    if (!username || username.length > 80) throw new Error("Username si sahihi.");
    let normalized = phone;
    if (normalized.startsWith("+")) normalized = normalized.slice(1);
    if (normalized.startsWith("00")) normalized = normalized.slice(2);
    if (normalized.startsWith("0")) normalized = `255${normalized.slice(1)}`;
    if (/^[67]\d{8}$/.test(normalized)) normalized = `255${normalized}`;
    if (!/^255[67]\d{8}$/.test(normalized)) throw new Error("Namba ya simu si sahihi.");
    return { phone: normalized, username };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.DARSMS_API_KEY;
    const senderId = process.env.DARSMS_SENDER_ID || "AJIRA PLUS";
    if (!apiKey) throw new Error("DARSMS_API_KEY haijawekwa kwenye Vercel.");

    const message = `Hongera! ${data.username}, usajili wako wa MOXERA AGENCIES umekamilika. Wezesha/Lipia akaunti kwa Tsh 15000 uanze kulipwa hadi 100,000 Tzs kwa siku kwa kuwafundisha wazungu Kiswahili. Gusa link https://www.moxeras.site/login Jaza Username na Password yako Kuingia.`;
    const response = await fetch("https://dev.darsms.co.tz/api/v1/integrations/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({ senderId, to: [data.phone], message }),
      signal: AbortSignal.timeout(12000),
    });
    const payload = await response.json().catch(() => null) as { success?: boolean; message?: string; data?: { messageIds?: string[]; batchId?: string } } | null;
    if (!response.ok || payload?.success !== true) {
      console.error("DARSMS registration SMS failed", { status: response.status, message: payload?.message });
      throw new Error("Usajili umefanikiwa, lakini SMS haikutumwa. Tafadhali wasiliana na huduma kwa wateja.");
    }
    return { queued: true, messageIds: payload.data?.messageIds ?? [], batchId: payload.data?.batchId ?? null };
  });

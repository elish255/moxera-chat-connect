import { sendSpringTechSms, springTechConfig } from "./springtech.server";
import { createHmac, randomInt, randomUUID, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";

function config() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key)
    throw new Error(
      "Huduma ya SMS OTP haijakamilishwa. Wasiliana na msimamizi.",
    );
  return {
    db: createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    hash: (value: string) =>
      createHmac("sha256", key)
        .update(`moxera-sms-recovery:${value}`)
        .digest("hex"),
  };
}
const unavailable = () =>
  new Error(
    "Huduma ya OTP haipatikani kwa sasa. Jaribu baadaye au wasiliana na msimamizi.",
  );

export async function requestCode(phone: string) {
  const { db, hash } = config();
  springTechConfig();
  const id = randomUUID();
  const code = String(randomInt(0, 1000000)).padStart(6, "0");
  // Vercel overwrites this header. Never trust arbitrary x-forwarded-for.
  // Outside Vercel use a shared conservative bucket rather than a spoofable IP.
  const ip = process.env["VERCEL"]
    ? getRequestHeader("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    : "local";
  const { data, error } = await db.rpc("moxera_issue_sms_recovery", {
    p_id: id,
    p_phone: phone,
    p_ip_hash: hash(`ip:${ip}`),
    p_code_hash: hash(`code:${id}:${code}`),
  });
  if (error) throw unavailable();
  const result = data?.[0];
  if (!result?.accepted)
    throw new Error(
      "Subiri kabla ya kuomba OTP nyingine. Umefikia kikomo cha maombi kwa sasa.",
    );
  if (result.recipient) {
    try {
      await sendSpringTechSms(
        phone,
        `Moxera Agencies: OTP yako ya kubadilisha password ni ${code}. Inaisha baada ya dakika 5. Usimpe mtu mwingine code hii. Kama hukuomba, puuza SMS hii.`,
      );
      const { error: deliveryError } = await db
        .from("moxera_sms_recovery")
        .update({ delivered: true })
        .eq("id", id);
      if (deliveryError) throw unavailable();
    } catch {
      // delivered=true means accepted by the provider, not confirmed handset delivery.
      // Verification requires it, so provider submission failures fail closed.
      await db
        .from("moxera_sms_recovery")
        .update({ consumed: true })
        .eq("id", id);
      // Same response for unknown, duplicate and undeliverable phone numbers.
      // Do not disclose provider payloads, OTPs, phone numbers or credentials.
    }
  }
  return { challengeId: id };
}

export async function verifyCode(id: string, code: string) {
  const { db, hash } = config();
  const grant = randomBytes(32).toString("hex");
  const { data, error } = await db.rpc("moxera_verify_sms_recovery", {
    p_id: id,
    p_code_hash: hash(`code:${id}:${code}`),
    p_grant_hash: hash(`grant:${id}:${grant}`),
  });
  if (error) throw unavailable();
  if (data !== true)
    throw new Error(
      "OTP si sahihi, imetumika au muda wake umeisha. Omba OTP mpya baada ya majaribio 5.",
    );
  return { grant };
}

export async function completeRecovery(
  id: string,
  grant: string,
  password: string,
) {
  const { db, hash } = config();
  const { data: userId, error } = await db.rpc("moxera_consume_sms_recovery", {
    p_id: id,
    p_grant_hash: hash(`grant:${id}:${grant}`),
  });
  if (error) throw unavailable();
  if (typeof userId !== "string" || !userId)
    throw new Error("Ruhusa imeisha au imetumika. Omba OTP mpya.");
  // Consume before updating: concurrent replay can never reset a password twice.
  // If the provider rejects the password or is unavailable, require a new OTP.
  const { error: updateError } = await db.auth.admin.updateUserById(userId, {
    password,
  });
  if (updateError)
    throw new Error(
      "Password haijabadilishwa. Omba OTP mpya na tumia password inayokidhi masharti ya account.",
    );
  return { saved: true };
}

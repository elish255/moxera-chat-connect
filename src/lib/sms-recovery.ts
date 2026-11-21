import { createServerFn } from "@tanstack/react-start";
import { normalizeTanzaniaPhone } from "./phone";

function challengeId(value: string) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new Error("Ombi si sahihi. Omba OTP mpya.");
  return value;
}

export const requestSmsRecovery = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string }) => {
    if (!input || typeof input.phone !== "string" || input.phone.length > 40)
      throw new Error("Weka namba sahihi ya simu.");
    return { phone: normalizeTanzaniaPhone(input.phone) };
  })
  .handler(async ({ data }) => {
    const { requestCode } = await import("./sms-recovery.server");
    return requestCode(data.phone);
  });

export const verifySmsRecovery = createServerFn({ method: "POST" })
  .inputValidator((input: { challengeId: string; code: string }) => {
    const id = challengeId(input?.challengeId);
    if (typeof input.code !== "string" || !/^\d{6}$/.test(input.code))
      throw new Error("OTP iwe tarakimu 6.");
    return { id, code: input.code };
  })
  .handler(async ({ data }) => {
    const { verifyCode } = await import("./sms-recovery.server");
    return verifyCode(data.id, data.code);
  });

export const completeSmsRecovery = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { challengeId: string; grant: string; password: string }) => {
      const id = challengeId(input?.challengeId);
      if (
        typeof input.grant !== "string" ||
        !/^[0-9a-f]{64}$/.test(input.grant)
      )
        throw new Error("Omba OTP mpya.");
      if (
        typeof input.password !== "string" ||
        input.password.length < 6 ||
        input.password.length > 128
      )
        throw new Error("Password iwe na herufi 6 hadi 128.");
      return { id, grant: input.grant, password: input.password };
    },
  )
  .handler(async ({ data }) => {
    const { completeRecovery } = await import("./sms-recovery.server");
    return completeRecovery(data.id, data.grant, data.password);
  });

const SEND_URL = "https://sms.springtech.co.tz/api/v1/vendor/message/send";

export function springTechConfig() {
  const apiKey = process.env["SPRINGTECH_API_KEY"];
  const apiSecret = process.env["SPRINGTECH_API_SECRET"];
  const senderId = process.env["SPRINGTECH_SENDER_ID"];
  const deliveryReportUrl =
    process.env["SPRINGTECH_DELIVERY_REPORT_URL"] ||
    "https://www.moxeras.site/api/springtech/delivery";
  if (!apiKey || !apiSecret || !senderId) {
    throw new Error(
      "Mipangilio ya SpringTech SMS haijakamilika. Wasiliana na msimamizi.",
    );
  }
  let callback: URL;
  try {
    callback = new URL(deliveryReportUrl);
  } catch {
    throw new Error("SpringTech delivery report URL si sahihi.");
  }
  if (
    callback.protocol !== "https:" ||
    callback.username ||
    callback.password
  ) {
    throw new Error(
      "SpringTech delivery report URL lazima iwe HTTPS bila credentials.",
    );
  }
  return { apiKey, apiSecret, senderId, deliveryReportUrl };
}

type Submission = {
  code?: number;
  success?: boolean;
  data?: {
    validContacts?: number;
    invalidContacts?: number;
    shootId?: string;
  };
};

/** Provider acceptance only, not proof of delivery to the handset. Never retry a send automatically. */
export async function sendSpringTechSms(phone: string, message: string) {
  if (!/^255[67]\d{8}$/.test(phone) || !message.trim()) {
    throw new Error("Namba au ujumbe wa SMS si sahihi.");
  }
  const config = springTechConfig();
  let receivedResponse = false;
  let httpStatus: number | undefined;
  let validResponse = false;
  try {
    console.info("[springtech] send_started");
    const response = await fetch(SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: config.apiKey,
        api_secret: config.apiSecret,
      },
      body: JSON.stringify({
        senderId: config.senderId,
        messageType: "text",
        message,
        contacts: phone,
        deliveryReportUrl: config.deliveryReportUrl,
      }),
      signal: AbortSignal.timeout(12000),
    });
    receivedResponse = true;
    httpStatus = response.status;
    const result = (await response
      .json()
      .catch(() => null)) as Submission | null;
    validResponse = result !== null && typeof result === "object";
    if (
      !response.ok ||
      result?.success !== true ||
      result.code !== 200 ||
      result.data?.validContacts !== 1 ||
      result.data?.invalidContacts !== 0
    ) {
      throw new Error("submission_rejected");
    }
    console.info("[springtech] submission_accepted", { httpStatus });
    return { queued: true as const };
  } catch {
    console.warn(
      !receivedResponse
        ? "[springtech] transport_failed"
        : !validResponse
          ? "[springtech] invalid_response"
          : "[springtech] submission_rejected",
      // Only the Fetch API HTTP status, never provider codes/messages/body/errors.
      { httpStatus },
    );
    // Provider bodies may echo the message (including OTP) or credentials.
    // Do not expose them in errors, logs, or server-function responses.
    throw new Error(
      "SpringTech haijathibitisha kupokea SMS. Hakiki hali kabla ya kutuma tena.",
    );
  }
}

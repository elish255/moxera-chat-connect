const MAX_REPORT_BYTES = 32 * 1024;

/**
 * Acknowledge and discard untrusted reports. SpringTech's supplied docs do not
 * specify callback authentication or a payload schema. Never use these reports
 * to authorize OTP, passwords, account activation, payments or delivery status.
 */
export async function receiveSpringTechDelivery(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (request.method !== "POST") {
    return new Response(null, {
      status: 405,
      headers: { ...headers, Allow: "POST" },
    });
  }
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_REPORT_BYTES) {
    return new Response(null, { status: 413, headers });
  }
  const reader = request.body?.getReader();
  let size = 0;
  try {
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_REPORT_BYTES) {
          await reader.cancel();
          return new Response(null, { status: 413, headers });
        }
      }
    }
  } catch {
    return new Response(null, { status: 400, headers });
  } finally {
    reader?.releaseLock();
  }
  // Do not log or persist bodies: reports may echo phone numbers and OTP text.
  return Response.json({ received: true }, { headers });
}

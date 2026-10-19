const RESEND_URL = "https://api.resend.com/emails";

export async function sendResendEmail({ apiKey, payload, idempotencyKey }) {
  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) {
    return { ok: false, status: response.status, data };
  }
  return { ok: true, id: data.id };
}

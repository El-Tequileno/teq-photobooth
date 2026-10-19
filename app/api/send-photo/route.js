import { activeCampaignConfig, savePhotoContact } from "../../../lib/active-campaign";
import { photoEmailCopy } from "../../../lib/email-copy";
import { json, isSameOrigin, readLimitedForm, MAX_REQUEST_BYTES } from "../../../lib/http";
import { parsePhotoMailForm, validPhoto } from "../../../lib/photo-mail";
import { allowAttempt } from "../../../lib/rate-limit";
import { sendResendEmail } from "../../../lib/resend";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return json({ error: "Invalid content type" }, 415);
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) return json({ error: "File too large" }, 413);

  let form;
  try {
    form = await readLimitedForm(request);
  } catch {
    return json({ error: "Invalid or oversized upload" }, 413);
  }

  const fields = parsePhotoMailForm(form);
  if (!fields) return json({ error: "Invalid photo or recipient" }, 400);
  const contactConfig = activeCampaignConfig();
  if (fields.marketingOptIn && !contactConfig?.listId) {
    return json({ error: "Marketing signup is unavailable", code: "marketing_unavailable" }, 503);
  }

  const sender = process.env.RESEND_FROM_EMAIL?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!sender || !apiKey) return json({ error: "Email sender is not configured", code: "not_configured" }, 503);

  const { email, name, marketingOptIn, language, kind, requestId, photo } = fields;
  const bytes = new Uint8Array(await photo.arrayBuffer());
  if (!validPhoto(bytes, kind)) return json({ error: "Invalid image data" }, 400);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (!allowAttempt(`ip:${ip}`, 30) || !allowAttempt(`email:${email}`, 4)) {
    return json({ error: "Too many requests", code: "rate_limited" }, 429);
  }

  const copy = photoEmailCopy(language, kind);
  const payload = {
    from: sender,
    to: [email],
    subject: copy.subject,
    text: copy.text,
    html: copy.html,
    attachments: [{ filename: copy.filename, content: Buffer.from(bytes).toString("base64"), content_type: photo.type }],
  };

  try {
    const result = await sendResendEmail({
      apiKey,
      payload,
      idempotencyKey: `teq-photo/${requestId}`,
    });
    if (!result.ok) {
      console.error("[TEQ email] Resend rejected the request:", result.status, result.data.name || "unknown");
      return json({ error: "Email was not accepted", code: result.status === 429 ? "rate_limited" : "provider_error" }, result.status === 429 ? 429 : 502);
    }
    if (!contactConfig) {
      console.error("[TEQ contact] ActiveCampaign is not configured");
      return json({ ok: true, id: result.id, contactSaved: false, marketingSubscribed: false });
    }
    try {
      const contact = await savePhotoContact(contactConfig, { email, name, marketingOptIn });
      return json({ ok: true, id: result.id, ...contact });
    } catch (error) {
      console.error("[TEQ contact] ActiveCampaign sync failed:", error.message);
      return json({ ok: true, id: result.id, contactSaved: false, marketingSubscribed: false });
    }
  } catch (error) {
    console.error("[TEQ email] Resend connection failed:", error.name);
    return json({ error: "Email service unavailable", code: "provider_error" }, 502);
  }
}

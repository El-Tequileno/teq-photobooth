const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function validEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

export function validPhoto(bytes, kind) {
  if (kind === "photo") return bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  return bytes.length > 6 && Buffer.from(bytes.subarray(0, 6)).toString("ascii") === "GIF89a";
}

export function parsePhotoMailForm(form) {
  const email = form.get("email")?.toString().trim().toLowerCase();
  const language = form.get("language");
  const kind = form.get("kind");
  const requestId = form.get("requestId");
  const photo = form.get("photo");
  const expectedType = kind === "gif" ? "image/gif" : "image/jpeg";

  if (!validEmail(email) || !["es", "en"].includes(language) || !["photo", "gif"].includes(kind) ||
      typeof requestId !== "string" || !REQUEST_ID.test(requestId) ||
      !photo || typeof photo.arrayBuffer !== "function" || photo.size === 0 || photo.size > MAX_PHOTO_BYTES ||
      photo.type !== expectedType) {
    return null;
  }

  return { email, language, kind, requestId, photo };
}

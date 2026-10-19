export const MAX_REQUEST_BYTES = 7 * 1024 * 1024;

export function json(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function readLimitedForm(request, maxBytes = MAX_REQUEST_BYTES) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request body");
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(value);
  }
  const copy = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": request.headers.get("content-type") },
    body: Buffer.concat(chunks, size),
  });
  return copy.formData();
}

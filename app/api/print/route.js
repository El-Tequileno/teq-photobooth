import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const SPOOL_DIR = process.env.PRINT_SPOOL_DIR || path.join(process.cwd(), "print-spool");
const PRINT_COMMAND = process.env.PRINT_COMMAND || "";

function stripDataUrl(s) {
  const i = s.indexOf(",");
  return s.startsWith("data:") && i !== -1 ? s.slice(i + 1) : s;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const { imageBase64 } = body || {};
  if (!imageBase64) {
    return NextResponse.json({ ok: false, reason: "missing_image" }, { status: 400 });
  }

  if (!PRINT_COMMAND) {
    return NextResponse.json({ ok: true, simulated: true });
  }

  try {
    await mkdir(SPOOL_DIR, { recursive: true });
    const filename = `booth-${Date.now()}.jpg`;
    const filePath = path.join(SPOOL_DIR, filename);
    await writeFile(filePath, Buffer.from(stripDataUrl(imageBase64), "base64"));

    const cmd = PRINT_COMMAND.replace("{file}", filePath);
    const [bin, ...args] = cmd.split(/\s+/);
    await execFileAsync(bin, args, { timeout: 30_000 });

    return NextResponse.json({ ok: true, file: filename });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err?.message || "print_failed" },
      { status: 500 },
    );
  }
}

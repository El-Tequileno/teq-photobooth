import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { getPreset } from "../../../lib/presets";

// The light client (kiosk browser) NEVER calls Gemini directly.
// All heavy generation lives here on the server, with the key protected.
export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
const MAX_RETRIES = Number(process.env.MAX_RETRIES ?? 2);
const DEMO_MODE = process.env.DEMO_MODE === "1";
const API_KEY = process.env.GEMINI_API_KEY;

// Load style reference image from disk (server only), if it exists.
async function loadReference(refName) {
  if (!refName) return null;
  try {
    const abs = path.join(process.cwd(), "reference", refName);
    const buf = await readFile(abs);
    return { mimeType: "image/png", data: buf.toString("base64") };
  } catch {
    return null; // no reference: runs with text prompt only
  }
}

// Extract the first inline image from the model response.
function extractImage(response) {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const inline = p.inlineData || p.inline_data;
    if (inline?.data) {
      return { mimeType: inline.mimeType || inline.mime_type || "image/png", data: inline.data };
    }
  }
  return null;
}

async function generateOnce(ai, prompt, userImage, refImage) {
  const parts = [
    { text: "FIRST image = the real person(s) to transform (keep their identity)." },
    { inlineData: { mimeType: userImage.mimeType, data: userImage.data } },
  ];
  if (refImage) {
    parts.push({
      text: "SECOND image = STYLE REFERENCE for the outfit only (color and coverage). Do NOT copy the reference as a person; it is a faceless mannequin.",
    });
    parts.push({ inlineData: { mimeType: refImage.mimeType, data: refImage.data } });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    // Force image output; field naming may vary by SDK version.
    config: { responseModalities: ["Image"] },
  });

  return extractImage(response);
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const { imageBase64, mimeType = "image/jpeg", presetId } = body || {};
  const preset = getPreset(presetId);

  if (!imageBase64 || !preset) {
    return NextResponse.json({ ok: false, reason: "missing_input" }, { status: 400 });
  }

  const userImage = { mimeType, data: stripDataUrl(imageBase64) };

  // ── No key: demo mode (rehearse booth flow) or honest retry ──
  if (!API_KEY) {
    if (DEMO_MODE) {
      // Return the photo as-is ONLY as a UX mock. Not a real transformation.
      return NextResponse.json({
        ok: true,
        demo: true,
        image: `data:${userImage.mimeType};base64,${userImage.data}`,
        presetName: preset.name,
      });
    }
    return NextResponse.json({ ok: false, reason: "no_api_key" }, { status: 503 });
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const refImage = await loadReference(preset.reference);

  // ── "All or nothing" rule: retry until an image is returned; never a hybrid ──
  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const img = await generateOnce(ai, preset.prompt, userImage, refImage);
      if (img?.data) {
        return NextResponse.json({
          ok: true,
          image: `data:${img.mimeType};base64,${img.data}`,
          presetName: preset.name,
          attempts: attempt + 1,
        });
      }
      lastError = "no_image_returned";
    } catch (err) {
      lastError = err?.message || "generation_error";
    }
  }

  // Retries exhausted: client shows retry, never a partial result.
  return NextResponse.json({ ok: false, reason: lastError || "failed" }, { status: 502 });
}

function stripDataUrl(s) {
  const i = s.indexOf(",");
  return s.startsWith("data:") && i !== -1 ? s.slice(i + 1) : s;
}

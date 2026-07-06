// ─────────────────────────────────────────────────────────────
// PRESETS
// ─────────────────────────────────────────────────────────────
// A preset IS a predefined, curated, frozen prompt. The kiosk user
// NEVER types: they pick a button. Each template combines:
//   preview   -> image shown on the selection screen (in /public/presets)
//   reference -> optional style image that anchors color and coverage
//                (path in /reference, read ONLY on the server)
//   prompt    -> the invisible engine; the fixed text that button triggers
//
// Prompts include the safeguards validated in Phase 1:
//   · Real identity and body preserved exactly (no slimming, no idealizing).
//   · FULL coverage: everyone in the photo gets costumed (typical group failure).
//   · Head-to-toe outfit (high collar, gloves, boots) — no skin/original clothing
//     showing at neck or hands.
//   · Generic characters, no brands or franchises (legal protection).
//   · Background fully replaced ("all or nothing" rule).

const IDENTITY_RULES = `
IDENTITY (who the person is):
- Keep every person's facial identity, bone structure, hairstyle, skin tone, glasses, and head coverings (hijab, turban) recognizably the same. Do not beautify, slim, or change facial features. The result must clearly be the SAME individual.

INTEGRATION — the person must be PHOTOGRAPHED INSIDE the scene, not pasted on top:
- RELIGHT the face and skin to match the scene's own light: same direction, same color temperature, same softness, and cast the correct shadows on the face and neck. Preserving identity does NOT mean keeping the original flat photo-booth lighting — the face must be lit by the scene's light sources. Avoid a bright, evenly-lit "cut-out sticker" face over a differently-lit body.
- Keep natural, anatomically correct HEAD-TO-BODY PROPORTIONS. The head must be sized and angled correctly for a real full-body photograph of this person — never oversized or floating on the shoulders.
- Blend the neck-to-shoulder transition seamlessly; no hard seam or halo around the head or hair.
- One cohesive photograph with a single unified color grade, matching depth of field, focus, and film grain across face, costume, and background — as if shot on one camera in that room.

BODY & COVERAGE:
- Preserve each person's real body — size, weight, shape, a pregnant belly, a wheelchair, any physical characteristic — visible and unchanged; the outfit drapes over their ACTUAL body.
- If there are multiple people, EVERY person is fully costumed. Do not leave anyone in original clothes.
- Cover head to toe in-theme (gloves/hands, shoes/feet). No original clothing or bare skin at the neckline, wrists, or ankles.
- Keep the original pose and camera angle. Correct anatomy only — never add extra limbs.
- Replace the ENTIRE background with the themed scene; no part of the original room, wall, or floor remains.
- Output ONE single realistic photograph.`;

const NO_BRAND = `Use only generic, original designs. No existing brand, franchise, logo, team, or trademarked character may appear.`;

export const PRESETS = [
  {
    id: "superhero",
    name: "Superhero",
    tagline: "Your identity, legendary edition",
    preview: "/presets/superhero.svg",
    reference: "traje_referencia.png", // optional; in /reference
    accent: "#FFC14D",
    prompt: `Transform the person (or people) in this photo into an original superhero, as a single realistic composite image.
${IDENTITY_RULES}
COSTUME:
- Sleek high-tech superhero suit with a HIGH COLLAR that fully covers the neck and collarbone (no shirt or skin showing at the neckline), matching gloves and boots, and a flowing crimson cape.
- Fixed color palette: deep navy blue base, gold accents, crimson cape. Keep this palette consistent.
BACKGROUND: a dramatic city skyline at golden-hour sunset.
${NO_BRAND}`,
  },
  {
    id: "astronaut",
    name: "Astronaut",
    tagline: "One step into space",
    preview: "/presets/astronaut.svg",
    reference: null,
    accent: "#8FB7FF",
    prompt: `Transform the person (or people) in this photo into an astronaut, as a single realistic composite image.
${IDENTITY_RULES}
COSTUME:
- Realistic modern white spacesuit with sealed high collar, gloves, and boots; subtle gold visor pushed up so the real face stays fully visible; teal and orange accents on the suit.
BACKGROUND: standing on a lunar surface with Earth rising and a starfield behind.
${NO_BRAND}`,
  },
  {
    id: "royalty",
    name: "Royalty",
    tagline: "Crown included",
    preview: "/presets/royalty.svg",
    reference: null,
    accent: "#E8C77A",
    prompt: `Transform the person (or people) in this photo into royalty, as a single realistic composite image.
${IDENTITY_RULES}
COSTUME:
- Ornate regal attire: rich velvet robe with fur trim and gold embroidery covering shoulders and chest, a jeweled crown, high collar so no original clothing shows.
BACKGROUND: an opulent palace throne room with warm candlelight.
${NO_BRAND}`,
  },
  {
    id: "cyberpunk",
    name: "Neon",
    tagline: "City of the future",
    preview: "/presets/cyberpunk.svg",
    reference: null,
    accent: "#FF5FD2",
    prompt: `Transform the person (or people) in this photo into a cyberpunk character, as a single realistic composite image.
${IDENTITY_RULES}
COSTUME:
- Futuristic techwear jacket with glowing neon trim, high collar, fingerless-look covered by gloves, subtle luminous accents. Keep skin and original clothes fully covered.
BACKGROUND: a rain-slicked neon city street at night with pink and cyan signage bokeh.
${NO_BRAND}`,
  },
];

export const PRESETS_PUBLIC = PRESETS.map(({ id, name, tagline, preview, accent }) => ({
  id,
  name,
  tagline,
  preview,
  accent,
}));

export function getPreset(id) {
  return PRESETS.find((p) => p.id === id) || null;
}

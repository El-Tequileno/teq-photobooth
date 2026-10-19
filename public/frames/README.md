# Photo frames

Store frame artwork in this folder as **transparent PNGs**. The initial exports
are `classic.png`, `agave.png`, and `celebration.png`.

## Artwork

- Recommended size: **1080 × 1620 pixels** (portrait, 2:3).
- Other resolutions must keep the exact 2:3 ratio; incompatible images cannot be used for capture.
- Leave the camera/photo area transparent. Include all logos, text, borders,
  and decorations in the PNG itself.
- Export in RGB/sRGB with transparency; do not flatten onto a solid background.
- The same PNG appears in the live preview, thumbnails, JPEG, and all three GIF
  photographs. Artwork is never mirrored.

## Replace an existing frame

Replace its PNG with a new file using the same filename and aspect ratio, then
refresh the booth. For a hosted booth, deploy the changed file first.

## Add, rename, reorder, or remove frames

Edit `frames.json`. Each entry needs a unique `id`, Spanish/English names, and
the public image URL. For example, add `holiday.png` to this folder and an entry:

```json
{
  "id": "holiday",
  "name": { "es": "Fiestas", "en": "Holiday" },
  "src": "/frames/holiday.png"
}
```

Keep at least one entry. The list order controls the selector; the first entry
is the default frame. Removing an entry hides that frame, so its PNG may be kept
for future events. List changes require rebuilding/redeploying in production;
Next.js development mode updates automatically.

Frame images are public artwork: do not put visitor photos or personal data in
this folder. Management currently uses files and this list, without an admin
upload screen.

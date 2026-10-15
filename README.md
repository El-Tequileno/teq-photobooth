# TEQ Photobooth — paso 1: bienvenida e idioma

Photo booth para el tasting room de El Tequileño, adaptado desde
`photobooth-kiosk`. El producto final usará fotografías con marcos
preestablecidos, sin IA ni impresión.

Este primer paso incluye:

- Bienvenida inspirada en las referencias de Curator: fondo rojizo, trama de
  puntos, agave y tarjetas decorativas.
- Logo oficial blanco de El Tequileño, reutilizado de los recursos de marca
  locales del proyecto El TEQ Game.
- Selector Español / English en la primera pantalla, con selección visible,
  textos traducidos y actualización del idioma del documento.
- Vuelta al español al reiniciar una sesión para el siguiente visitante.
- Fuentes del sistema, sin descargas de fuentes externas.

Las tarjetas son ilustraciones decorativas, no fotografías de visitantes.
El SVG del logo se conserva sin modificar sus trazados.

**Las pantallas posteriores y las rutas internas siguen siendo las del prototipo
original.** Los siguientes pasos sustituirán ese flujo por foto/GIF, cámara con
marcos, entrega por correo y preparación como PWA. La bienvenida se puede
revisar sin configurar servicios externos.

## Revisar este paso

```sh
npm ci
npm run dev
```

Abrir la dirección Local que muestre Next.js. Para elegir un puerto, usar
`npm run dev -- --port 3001`. Compilar con `npm run build`.

Archivos principales: `app/components/welcome-screen.js`, `app/welcome.css`,
`app/page.js`, `app/layout.js` y `public/brand/el-tequileno-white.svg`.

---

## Documentación del prototipo original (pendiente de sustituir)

Mini Next.js app that simulates the **unattended kiosk**: the guest taps the screen,
picks a template, takes a photo, and receives their transformed version. Reuses the
pipeline you validated in Phase 1 (Nano Banana / Gemini), now wrapped in the real
booth experience: attract → choose → capture → reveal → result, then back to start
on its own with no operator.

## Run

```bash
npm install
cp .env.local.example .env.local     # paste your GEMINI_API_KEY
npm run dev                           # http://localhost:3000
```

For the real booth: `npm run build && npm run kiosk` and open Chrome in kiosk mode
(full screen, `--kiosk`). The camera requires `localhost` or **HTTPS**
(getUserMedia does not work on remote http).

Without `GEMINI_API_KEY` and with `DEMO_MODE=1`, the full flow works for rehearsing
UX (returns your own photo as a mock — not a real transformation).

## How it's built (fits the project architecture)

- **Light client** = `app/page.js`. Camera, touch UI, and one `fetch` call only.
  Never touches the heavy model. It's the booth's capture machine.
- **Server** = `app/api/transform/route.js`. API key and Nano Banana call live here.
  The browser never sees the API key.
- **"All or nothing" rule**: the server returns either a complete image or an explicit
  failure; retries up to `MAX_RETRIES` times. The client only renders a returned result
  or the retry screen. No code path shows a hybrid (edited subject + original background).
- **Unattended**: idle timer (45 s) resets and **deletes the guest's photo**; the result
  auto-resets after 30 s for the next guest.
- **Presets, not free prompt**: `lib/presets.js`. Each template = preview + curated fixed
  prompt + optional reference image. Prompts include Phase 1 safeguards (real identity and
  body, full group coverage, high collar/gloves/boots, no brands, 100% background replacement).

## Swap in real assets

- **Previews**: replace the `.svg` files in `public/presets/` with your best real captures
  for each template (what the guest sees before posing).
- **Style reference**: put `traje_referencia.png` in `reference/` to anchor superhero suit
  color and coverage (same as Phase 1). Each preset's `reference` field points to the file;
  `null` = text only.
- **Model**: confirm the string in `.env.local` (`GEMINI_IMAGE_MODEL`). Check what's
  available at aistudio.google.com; preview naming changes often.

## Verify before the event (Phase 3)

At a real booth you need to measure what no script metric captures: shareable photo rate,
end-to-end session time, and how many people scan the QR. The QR currently points to a
placeholder link; in production the server uploads the image and the QR points to that URL.

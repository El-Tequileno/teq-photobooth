import { photoFilename } from "./photo-filename";

function htmlDocument(text, gifHelp) {
  const help = gifHelp
    ? `<p style="font-size:15px;line-height:1.5;margin:0">${gifHelp}</p>`
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;color:#183d55">
  <tr>
    <td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px">
        <tr>
          <td align="center">
            <h1 style="color:#a7443d;font-size:26px;margin:0 0 18px">EL TEQUILEÑO</h1>
            <p style="font-size:18px;line-height:1.5;margin:0 0 22px">${text}</p>
            ${help}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

const COPY = {
  es: {
    subject: "Tu recuerdo de El Tequileño",
    photo: "¡Gracias por visitar El Tequileño! Tu foto está adjunta a este correo. ¡Salud!",
    gif: "¡Gracias por visitar El Tequileño! Tu GIF animado está adjunto a este correo. ¡Salud!",
    gifHelp: "En iPhone, abre el adjunto y usa Compartir → Guardar imagen para conservar la animación. El botón Descargar puede guardar solo la primera imagen.",
  },
  en: {
    subject: "Your El Tequileño photo",
    photo: "Thank you for visiting El Tequileño! Your photo is attached to this email. Cheers!",
    gif: "Thank you for visiting El Tequileño! Your animated GIF is attached to this email. Cheers!",
    gifHelp: "On iPhone, open the attachment and use Share → Save image to keep the animation. The Download button may save only the first frame.",
  },
};

export function photoEmailCopy(language, kind, name) {
  const locale = COPY[language] || COPY.en;
  const isGif = kind === "gif";
  const text = isGif ? locale.gif : locale.photo;
  const gifHelp = isGif ? locale.gifHelp : "";

  return {
    subject: locale.subject,
    text: gifHelp ? `${text}\n\n${gifHelp}` : text,
    html: htmlDocument(text, gifHelp),
    filename: photoFilename(name, kind),
  };
}

const COPY = {
  es: {
    title: "ELIGE EL ESTILO",
    subtitle: "Choose an image style",
    back: "Volver",
    photo: "FOTO",
    photoDescription: "Una fotografía",
    gifDescription: "3 fotos en movimiento",
  },
  en: {
    title: "CHOOSE YOUR STYLE",
    subtitle: "Elige el estilo",
    back: "Back",
    photo: "SINGLE",
    photoDescription: "One photograph",
    gifDescription: "3 photos in motion",
  },
};

function PhotoIcon() {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M15 34V15h19m32 0h19v19m0 32v19H66m-32 0H15V66" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
      <circle cx="50" cy="42" r="12" fill="currentColor" />
      <path d="M29 73v-7a21 21 0 0 1 42 0v7" fill="currentColor" />
    </svg>
  );
}

function GifIcon() {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect x="13" y="13" width="74" height="74" rx="2" stroke="currentColor" strokeWidth="5" />
      <path d="M13 27h74M13 73h74M26 13v14m16-14v14m16-14v14m16-14v14M26 73v14m16-14v14m16-14v14m16-14v14" stroke="currentColor" strokeWidth="4" />
      <path d="m42 36 22 14-22 14V36Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

export default function ExperienceScreen({ language, onBack, onSelect }) {
  const copy = COPY[language];

  return (
    <section className="experience-screen" lang={language} aria-labelledby="experience-title">
      <header className="experience-header">
        <button className="experience-back" type="button" onClick={onBack} aria-label={copy.back}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <img className="experience-logo" src="/brand/el-tequileno-white.svg" alt="Tequila El Tequileño" />
        <span className="experience-language" aria-label={language === "es" ? "Español" : "English"}>{language.toUpperCase()}</span>
      </header>

      <div className="experience-heading">
        <h1 id="experience-title">{copy.title}</h1>
        <p lang={language === "es" ? "en" : "es"}>{copy.subtitle}</p>
      </div>

      <div className="experience-options">
        <button type="button" className="experience-option" onClick={() => onSelect("photo")}>
          <PhotoIcon />
          <span className="experience-option-title">{copy.photo}</span>
          <span className="experience-option-description">{copy.photoDescription}</span>
        </button>
        <button type="button" className="experience-option" onClick={() => onSelect("gif")}>
          <GifIcon />
          <span className="experience-option-title">GIF</span>
          <span className="experience-option-description">{copy.gifDescription}</span>
        </button>
      </div>
    </section>
  );
}

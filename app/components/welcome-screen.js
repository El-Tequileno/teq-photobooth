const COPY = {
  es: {
    title: "TOMA UNA FOTO",
    subtitle: "Take a picture",
    language: "Elige tu idioma",
    start: "Comenzar",
    note: "Un recuerdo de tu visita",
  },
  en: {
    title: "TAKE A PICTURE",
    subtitle: "Toma una foto",
    language: "Choose your language",
    start: "Start",
    note: "A memory of your visit",
  },
};

function CameraIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <path d="M47 47h26l10-16h34l10 16h26a13 13 0 0 1 13 13v65a13 13 0 0 1-13 13H47a13 13 0 0 1-13-13V60a13 13 0 0 1 13-13Z" stroke="currentColor" strokeWidth="4" />
      <circle cx="100" cy="91" r="27" stroke="currentColor" strokeWidth="4" />
      <circle cx="100" cy="91" r="17" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="146" cy="65" r="4" fill="currentColor" />
      <path d="M100 11V1M50 25l-7-8M150 25l7-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Agave({ className }) {
  return (
    <svg className={className} viewBox="0 0 420 540" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2">
        <path d="M390 530Q290 310 48 72Q250 325 390 530Z" />
        <path d="M390 530Q284 315 174 5Q225 333 390 530Z" />
        <path d="M390 530Q311 292 312 18Q258 332 390 530Z" />
        <path d="M390 530Q347 325 415 136Q308 326 390 530Z" />
        <path d="M390 530Q235 388 0 268Q265 467 390 530Z" />
        <path d="M390 530Q218 461 0 453Q239 526 390 530Z" />
        <path d="M390 530Q292 262 110 114" />
      </g>
    </svg>
  );
}

export default function WelcomeScreen({ language, onLanguageChange, onStart }) {
  const copy = COPY[language];

  return (
    <section className="welcome-screen" lang={language} aria-labelledby="welcome-title">
      <Agave className="welcome-agave" />
      <header className="welcome-header">
        <img className="welcome-logo" src="/brand/el-tequileno-white.svg" alt="Tequila El Tequileño" />
      </header>

      <div className="welcome-collage" aria-hidden="true">
        <div className="welcome-print welcome-print--left">
          <div className="welcome-print-art welcome-print-art--gold"><Agave /></div>
          <span>EL TEQUILEÑO</span>
        </div>
        <div className="welcome-print welcome-print--right">
          <div className="welcome-print-art welcome-print-art--red"><Agave /></div>
          <span>EL TEQUILEÑO</span>
        </div>
        <div className="welcome-print welcome-print--front">
          <div className="welcome-print-art welcome-print-art--blue">
            <img src="/brand/el-tequileno-white.svg" alt="" />
            <CameraIllustration />
            <span className="welcome-print-greeting">Saludos desde</span>
            <span className="welcome-print-brand">EL TEQUILEÑO</span>
          </div>
        </div>
      </div>

      <div className="welcome-heading" aria-live="polite">
        <h1 id="welcome-title">{copy.title}</h1>
        <p className="welcome-script" lang={language === "es" ? "en" : "es"}>{copy.subtitle}</p>
      </div>

      <div className="welcome-controls">
        <fieldset className="welcome-languages">
          <legend>{copy.language}</legend>
          <div className="welcome-language-options">
            <button type="button" lang="es" aria-pressed={language === "es"} onClick={() => onLanguageChange("es")}>
              <span>ES</span> Español
              {language === "es" && <span className="welcome-check" aria-hidden="true">✓</span>}
            </button>
            <button type="button" lang="en" aria-pressed={language === "en"} onClick={() => onLanguageChange("en")}>
              <span>EN</span> English
              {language === "en" && <span className="welcome-check" aria-hidden="true">✓</span>}
            </button>
          </div>
        </fieldset>
        <button type="button" className="welcome-start" onClick={onStart}>
          {copy.start}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <p className="welcome-note">{copy.note}</p>
      </div>
    </section>
  );
}

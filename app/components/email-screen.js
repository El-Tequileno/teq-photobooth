const DOMAINS = ["@gmail.com", "@hotmail.com", "@yahoo.com", "@outlook.com", "@icloud.com", "@live.com", ".com", ".net"];

export default function EmailScreen({ language, name, email, marketingOptIn, marketingEnabled, onNameChange, onEmailChange, onMarketingChange, onBack, onSend, error, sending }) {
  const spanish = language === "es";
  const addDomain = domain => {
    const local = email.split("@")[0].trim();
    onEmailChange(domain.startsWith("@") ? `${local}${domain}` : `${email.replace(/\.[^.@]*$/, "")}${domain}`);
  };

  return (
    <section className="email-screen" lang={language} aria-label={spanish ? "Enviar foto por correo" : "Email your photo"}>
      <header className="email-header">
        <button type="button" className="email-back" onClick={onBack} disabled={sending} aria-label={spanish ? "Volver a la foto" : "Back to photo"}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span>EL TEQUILEÑO</span>
      </header>

      <form className="email-form" onSubmit={event => { event.preventDefault(); onSend(); }}>
        <h1 className="email-title">{spanish ? "Ingresa tus datos" : "Enter your details"}</h1>
        <div className="email-field">
          <label htmlFor="guest-name">{spanish ? "Nombre" : "Name"}</label>
          <input id="guest-name" name="name" type="text" autoComplete="off" autoCapitalize="words" required maxLength={100}
            placeholder={spanish ? "Tu nombre" : "Your name"} value={name} onChange={event => onNameChange(event.target.value)} disabled={sending} />
        </div>
        <div className="email-field">
          <label htmlFor="guest-email">{spanish ? "Correo electrónico" : "Email address"}</label>
          <input id="guest-email" name="email" type="email" inputMode="email" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} required maxLength={254}
            placeholder={spanish ? "tu@correo.com" : "you@example.com"} value={email} onChange={event => onEmailChange(event.target.value)} disabled={sending} />
        </div>
        <p className="email-hint">{spanish ? "Enviaremos tu foto o GIF a esta dirección." : "We’ll send your photo or GIF to this address."}</p>
        <div className="email-domains" aria-label={spanish ? "Dominios frecuentes" : "Common email domains"}>
          {DOMAINS.map(domain => <button key={domain} type="button" onClick={() => addDomain(domain)} disabled={sending}>{domain}</button>)}
        </div>
        <label className="email-opt-in" htmlFor="marketing-opt-in">
          <input id="marketing-opt-in" name="marketingOptIn" type="checkbox" checked={marketingOptIn} onChange={event => onMarketingChange(event.target.checked)} disabled={sending || !marketingEnabled} />
          <span>{spanish ? "Sí, quiero recibir noticias y promociones de El Tequileño por correo electrónico." : "Yes, I want to receive news and promotional emails from El Tequileño."}</span>
        </label>
        {!marketingEnabled && <p className="email-marketing-unavailable">{spanish ? "La suscripción a comunicaciones estará disponible próximamente." : "Email subscriptions will be available soon."}</p>}
        {error && <p className="email-error" role="alert">{error}</p>}
        <button className="email-send" type="submit" disabled={sending || !name.trim() || !email.trim()}>
          {sending ? (spanish ? "ENVIANDO…" : "SENDING…") : (spanish ? "ENVIAR" : "SEND")}
        </button>
      </form>
    </section>
  );
}

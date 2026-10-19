const DOMAINS = ["@gmail.com", "@hotmail.com", "@yahoo.com", "@outlook.com", "@icloud.com", "@live.com", ".com", ".net"];

export default function EmailScreen({ language, email, onEmailChange, onBack, onSend, error, sending }) {
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
        <label htmlFor="guest-email">{spanish ? "Ingresa tu correo electrónico" : "Enter your email address"}</label>
        <input id="guest-email" name="email" type="email" inputMode="email" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} required maxLength={254}
          placeholder={spanish ? "tu@correo.com" : "you@example.com"} value={email} onChange={event => onEmailChange(event.target.value)} disabled={sending} />
        <p className="email-hint">{spanish ? "Enviaremos tu foto o GIF a esta dirección." : "We’ll send your photo or GIF to this address."}</p>
        <div className="email-domains" aria-label={spanish ? "Dominios frecuentes" : "Common email domains"}>
          {DOMAINS.map(domain => <button key={domain} type="button" onClick={() => addDomain(domain)} disabled={sending}>{domain}</button>)}
        </div>
        {error && <p className="email-error" role="alert">{error}</p>}
        <button className="email-send" type="submit" disabled={sending || !email.trim()}>
          {sending ? (spanish ? "ENVIANDO…" : "SENDING…") : (spanish ? "ENVIAR" : "SEND")}
        </button>
      </form>
    </section>
  );
}

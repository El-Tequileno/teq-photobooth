import { FRAMES } from "../../lib/frames";
import { CATRINA_STYLES, isCatrinaFilter } from "../../lib/catrina-filter";
import { AGAVE_BACKGROUND } from "../../lib/background";

function FrameOverlay({ image, thumbnail = false }) {
  const className = thumbnail ? "frame-thumbnail" : "camera-overlay";
  return image
    ? <img src={image.src} width={1080} height={1620} className={className} alt="" aria-hidden="true" />
    : <span className={className} aria-hidden="true" />;
}

export default function CameraScreen({ language, captureType, frameId, onFrameChange, frameImages, videoRef, filterId, onFilterChange, faceCanvasRef, faceStatus, faceCount, backgroundId, onBackgroundChange, backgroundCanvasRef, backgroundStatus, backgroundPerson, phoneCamera, cameraFacing, cameraSwitchError, onSwitchCamera, cameraReady, frameError, countdown, shot, busy, testCamera, onReady, onCapture, onBack }) {
  const isSpanish = language === "es";
  const frameImage = frameImages[frameId];
  const total = captureType === "gif" ? 3 : 1;
  const faceEffectActive = isCatrinaFilter(filterId);
  const backgroundActive = backgroundId === "agave";
  const backgroundBlocked = backgroundActive && (backgroundStatus !== "ready" || !backgroundPerson);
  const backgroundMessage = backgroundActive && (backgroundStatus === "error"
    ? (isSpanish ? "No se pudo preparar el fondo. Elige Sin fondo para continuar." : "The background could not start. Choose No background to continue.")
    : backgroundStatus !== "ready"
      ? (isSpanish ? "Preparando campos de agave…" : "Preparing agave fields…")
      : !backgroundPerson ? (isSpanish ? "Colócate al centro, de cintura hacia arriba" : "Stand in the center, framed from the waist up") : "");
  const labels = {
    back: isSpanish ? "Volver" : "Back",
    mode: total === 3 ? (isSpanish ? "GIF · 3 FOTOS" : "GIF · 3 PHOTOS") : (isSpanish ? "FOTO" : "PHOTO"),
    frame: isSpanish ? "Elige un marco" : "Choose a frame",
    effect: isSpanish ? "Efecto facial" : "Face effect",
    noEffect: isSpanish ? "Sin filtro" : "No filter",
    capture: total === 3 ? (isSpanish ? "Tomar 3 fotos" : "Take 3 photos") : (isSpanish ? "Tomar foto" : "Take photo"),
    switch: cameraFacing === "user" ? (isSpanish ? "Usar cámara trasera" : "Use rear camera") : (isSpanish ? "Usar cámara frontal" : "Use front camera"),
    status: !cameraReady ? (isSpanish ? "Abriendo cámara…" : "Opening camera…") : frameError ? (isSpanish ? "No se pudo cargar el marco. Elige otro o recarga la página." : "The frame could not be loaded. Choose another or reload the page.") : cameraSwitchError ? (isSpanish ? "No pudimos cambiar de cámara. Sigue usando la anterior." : "Could not switch cameras. The previous camera is still available.") : !frameImage ? (isSpanish ? "Cargando marco…" : "Loading frame…") : faceEffectActive && faceStatus === "error" ? (isSpanish ? "No se pudo iniciar el filtro. Elige Sin filtro para continuar." : "The effect could not start. Choose No filter to continue.") : faceEffectActive && faceStatus !== "ready" ? (isSpanish ? "Preparando filtro…" : "Preparing effect…") : faceEffectActive && !faceCount ? (isSpanish ? "Coloca tu rostro frente a la cámara" : "Place your face in front of the camera") : busy ? `${isSpanish ? "Foto" : "Photo"} ${shot} / ${total}` : (isSpanish ? "Mira a la cámara" : "Look at the camera"),
  };
  return (
    <section className="camera-screen" aria-label={isSpanish ? "Cámara" : "Camera"}>
      <header className="camera-header">
        <button type="button" className="camera-back" onClick={onBack} aria-label={labels.back}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <p>{labels.mode}</p>
        {phoneCamera ? (
          <button type="button" className="camera-switch" onClick={onSwitchCamera} disabled={!cameraReady || busy} aria-label={labels.switch} title={labels.switch}>
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M4 11a12 12 0 0 1 20-5l2 2M28 21a12 12 0 0 1-20 5l-2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m25 3 1 5-5-1M7 29l-1-5 5 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 13h3l1.5-2h2l1.5 2h3v9H11v-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="16.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        ) : <span>{language.toUpperCase()}</span>}
      </header>

      <div className="camera-stage">
        <div className={`camera-viewfinder${phoneCamera && cameraFacing === "environment" ? " camera-viewfinder--rear" : ""}`}>
          <video ref={videoRef} className="camera-video" autoPlay playsInline muted onLoadedData={onReady} onPlaying={onReady} />
          <canvas ref={backgroundCanvasRef} className="camera-background" hidden={!backgroundActive || backgroundStatus !== "ready"} aria-hidden="true" />
          <canvas ref={faceCanvasRef} className="camera-face-effect" aria-hidden="true" />
          <FrameOverlay image={frameImage} />
          {testCamera && <span className="camera-test-label">{isSpanish ? "Cámara de prueba" : "Test camera"}</span>}
          {countdown > 0 && <div className="camera-countdown" role="status" aria-label={`${isSpanish ? "Cuenta regresiva" : "Countdown"}: ${countdown}`} key={`${shot}-${countdown}`}>{countdown}</div>}
        </div>
      </div>

      <div className="camera-controls">
        <p className="camera-status" role="status">{cameraReady && backgroundMessage ? backgroundMessage : labels.status}</p>
        <fieldset className="camera-backgrounds camera-effects" disabled={busy}>
          <legend>{isSpanish ? "Fondo" : "Background"}</legend>
          <div className="camera-effect-options">
            <button type="button" aria-pressed={!backgroundActive} onClick={() => onBackgroundChange("none")}>
              {isSpanish ? "Sin fondo" : "No background"}
            </button>
            <button type="button" aria-pressed={backgroundActive} onClick={() => onBackgroundChange("agave")}>
              <img className="background-thumbnail" src={AGAVE_BACKGROUND} width="32" height="38" alt="" aria-hidden="true" />
              <span>{isSpanish ? "Campos de agave" : "Agave fields"}</span>
            </button>
          </div>
        </fieldset>
        {backgroundActive && <p className="camera-pose-hint">{isSpanish ? "Al centro y de cintura hacia arriba · Mira a la cámara" : "Centered, from the waist up · Look at the camera"}</p>}
        <fieldset className="camera-frames" disabled={busy}>
          <legend>{labels.frame}</legend>
          <div className="camera-frame-options">
            {FRAMES.map(frame => (
              <button type="button" key={frame.id} className="camera-frame-option" aria-pressed={frameId === frame.id} onClick={() => onFrameChange(frame.id)}>
                <FrameOverlay image={frameImages[frame.id]} thumbnail />
                <span>{frame.name[language]}</span>
                {frameId === frame.id && <span className="camera-frame-check" aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="camera-effects" disabled={busy}>
          <legend>{labels.effect}</legend>
          <div className="camera-effect-options">
            <button type="button" aria-pressed={filterId === "none"} onClick={() => onFilterChange("none")}>{labels.noEffect}</button>
            {CATRINA_STYLES.map(style => (
              <button type="button" key={style.id} aria-label={style.name[language]} aria-pressed={filterId === style.id} onClick={() => onFilterChange(style.id)}>
                <img src={style.src} width="28" height="32" alt="" aria-hidden="true" />
                <span>{style.name[language]}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <button type="button" className="camera-shutter" disabled={!cameraReady || !frameImage || frameError || busy || backgroundBlocked || (faceEffectActive && (faceStatus !== "ready" || !faceCount))} onClick={onCapture}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h4l2-3h4l2 3h4v14H4V6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" /></svg>
          {labels.capture}
        </button>
      </div>
    </section>
  );
}

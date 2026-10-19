import { FRAMES } from "../../lib/frames";

function FrameOverlay({ image, thumbnail = false }) {
  const className = thumbnail ? "frame-thumbnail" : "camera-overlay";
  return image
    ? <img src={image.src} width={1080} height={1620} className={className} alt="" aria-hidden="true" />
    : <span className={className} aria-hidden="true" />;
}

export default function CameraScreen({ language, captureType, frameId, onFrameChange, frameImages, videoRef, cameraReady, frameError, countdown, shot, busy, testCamera, onReady, onCapture, onBack }) {
  const isSpanish = language === "es";
  const frameImage = frameImages[frameId];
  const total = captureType === "gif" ? 3 : 1;
  const labels = {
    back: isSpanish ? "Volver" : "Back",
    mode: total === 3 ? (isSpanish ? "GIF · 3 FOTOS" : "GIF · 3 PHOTOS") : (isSpanish ? "FOTO" : "PHOTO"),
    frame: isSpanish ? "Elige un marco" : "Choose a frame",
    capture: total === 3 ? (isSpanish ? "Tomar 3 fotos" : "Take 3 photos") : (isSpanish ? "Tomar foto" : "Take photo"),
    status: !cameraReady ? (isSpanish ? "Abriendo cámara…" : "Opening camera…") : frameError ? (isSpanish ? "No se pudo cargar el marco. Elige otro o recarga la página." : "The frame could not be loaded. Choose another or reload the page.") : !frameImage ? (isSpanish ? "Cargando marco…" : "Loading frame…") : busy ? `${isSpanish ? "Foto" : "Photo"} ${shot} / ${total}` : (isSpanish ? "Mira a la cámara" : "Look at the camera"),
  };
  return (
    <section className="camera-screen" aria-label={isSpanish ? "Cámara" : "Camera"}>
      <header className="camera-header">
        <button type="button" className="camera-back" onClick={onBack} aria-label={labels.back}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <p>{labels.mode}</p>
        <span>{language.toUpperCase()}</span>
      </header>

      <div className="camera-stage">
        <div className="camera-viewfinder">
          <video ref={videoRef} className="camera-video" autoPlay playsInline muted onLoadedData={onReady} onPlaying={onReady} />
          <FrameOverlay image={frameImage} />
          {testCamera && <span className="camera-test-label">{isSpanish ? "Cámara de prueba" : "Test camera"}</span>}
          {countdown > 0 && <div className="camera-countdown" role="status" aria-label={`${isSpanish ? "Cuenta regresiva" : "Countdown"}: ${countdown}`} key={`${shot}-${countdown}`}>{countdown}</div>}
        </div>
      </div>

      <div className="camera-controls">
        <p className="camera-status" role="status">{labels.status}</p>
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
        <button type="button" className="camera-shutter" disabled={!cameraReady || !frameImage || frameError || busy} onClick={onCapture}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h4l2-3h4l2 3h4v14H4V6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" /></svg>
          {labels.capture}
        </button>
      </div>
    </section>
  );
}

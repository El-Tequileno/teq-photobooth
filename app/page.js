"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import WelcomeScreen from "./components/welcome-screen";
import ExperienceScreen from "./components/experience-screen";
import CameraScreen from "./components/camera-screen";
import EmailScreen from "./components/email-screen";
import { encodeGif } from "../lib/gif";
import { FRAMES, drawFrame, FRAME_WIDTH, FRAME_HEIGHT } from "../lib/frames";
import { isPhoneDevice } from "../lib/share-availability";
import { drawFittedVideo } from "../lib/camera-fit";

const IDLE_RESET_S = 90;
const RESULT_RESET_S = 60;
const COPY = {
  es: {
    photo: "Foto", gif: "GIF de 3 fotos", camera: "MIRA A LA CÁMARA",
    group: "Grupo", groupHint: "Horizontal", portrait: "Retrato", portraitHint: "Vertical",
    hint: "Colócate dentro del encuadre", back: "Volver", capture: "Tomar foto",
    captureGif: "Tomar 3 fotos", loading: "Abriendo cámara…", shot: "Foto",
    processing: "Preparando tu recuerdo…", email: "Correo", share: "Compartir", retake: "Repetir",
    shareError: "No pudimos abrir Compartir. Puedes enviarla por correo.",
    done: "Terminar", reset: "Volvemos al inicio en", seconds: "s",
    sentTitle: "Tu foto va en camino", sentHint: "La enviamos a", sendAnother: "Enviar a otro correo",
    sendError: "No pudimos enviar la foto. Revisa la conexión e inténtalo de nuevo.",
    sendNotConfigured: "El envío por correo aún no está configurado. Pide ayuda al personal.",
    sendRateLimited: "Hubo muchos envíos seguidos. Espera unos minutos e inténtalo de nuevo.",
    marketingUnavailable: "La suscripción aún no está disponible. Desmarca la casilla para enviar tu foto.",
    contactNotSaved: "La foto se envió, pero no pudimos guardar tus datos. Avisa al personal.",
    marketingNotSubscribed: "La foto se envió, pero no pudimos activar las comunicaciones por correo.",
    cameraError: "No pudimos abrir la cámara",
    cameraHelp: "Revisa el permiso de cámara del navegador y vuelve a intentarlo.",
    captureError: "No pudimos completar la captura", captureHelp: "Puedes volver a intentarlo.",
    retry: "Intentar de nuevo", startOver: "Volver al inicio",
    privacy: "Tu foto se procesa en este dispositivo.",
  },
  en: {
    photo: "Photo", gif: "3-photo GIF", camera: "LOOK AT THE CAMERA",
    group: "Group", groupHint: "Landscape", portrait: "Portrait", portraitHint: "Vertical",
    hint: "Step inside the frame", back: "Back", capture: "Take photo",
    captureGif: "Take 3 photos", loading: "Opening camera…", shot: "Photo",
    processing: "Preparing your memory…", email: "Email", share: "Share", retake: "Retake",
    shareError: "We couldn't open Share. You can send it by email.",
    done: "Done", reset: "Returning to start in", seconds: "s",
    sentTitle: "Your photo is on its way", sentHint: "We sent it to", sendAnother: "Send to another email",
    sendError: "We couldn't send your photo. Check the connection and try again.",
    sendNotConfigured: "Email delivery isn't configured yet. Please ask a staff member for help.",
    sendRateLimited: "There have been too many sends. Wait a few minutes and try again.",
    marketingUnavailable: "Email signup is not available yet. Uncheck the box to send your photo.",
    contactNotSaved: "Your photo was sent, but we could not save your details. Please tell a staff member.",
    marketingNotSubscribed: "Your photo was sent, but we could not activate promotional emails.",
    cameraError: "We could not open the camera",
    cameraHelp: "Check your browser's camera permission and try again.",
    captureError: "We could not complete the capture", captureHelp: "Please try again.",
    retry: "Try again", startOver: "Back to start",
    privacy: "Your photo is processed on this device.",
  },
};
const wait = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

export default function Kiosk() {
  const [screen, setScreen] = useState("attract");
  const [language, setLanguage] = useState("es");
  const [captureType, setCaptureType] = useState("photo");
  const [frameId, setFrameId] = useState(FRAMES[0].id);
  const [frameImages, setFrameImages] = useState({});
  const [frameErrors, setFrameErrors] = useState({});
  const [phoneCamera, setPhoneCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("user");
  const [cameraSwitchError, setCameraSwitchError] = useState(false);
  const [testCamera, setTestCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [shot, setShot] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [contactWarning, setContactWarning] = useState("");
  const [sendId, setSendId] = useState(null);
  const [resetIn, setResetIn] = useState(RESULT_RESET_S);
  const [errorKind, setErrorKind] = useState("camera");
  const [cameraFailure, setCameraFailure] = useState("");
  const videoRef = useRef(null);
  const backdropVideoRef = useRef(null);
  const streamRef = useRef(null);
  const switchFromRef = useRef(null);
  const idleTimer = useRef(null);
  const captureRun = useRef(0);
  const capturing = useRef(false);
  const sending = useRef(false);
  const frameImage = frameImages[frameId];
  const frameError = Boolean(frameErrors[frameId]);
  const copy = COPY[language];
  const modeName = captureType === "gif" ? copy.gif : copy.photo;
  const resultFilename = `el-tequileno.${captureType === "gif" ? "gif" : "jpg"}`;
  const cameraHelp = cameraFailure === "NotAllowedError" || cameraFailure === "SecurityError"
    ? (language === "es" ? "El sistema o el navegador bloqueó la cámara. Habilita su permiso para esta aplicación y vuelve a intentarlo." : "The system or browser blocked the camera. Allow camera access for this app and try again.")
    : cameraFailure === "NotFoundError"
      ? (language === "es" ? "No encontramos una cámara. Comprueba que esté conectada y vuelve a intentarlo." : "No camera was found. Check that it is connected and try again.")
      : cameraFailure === "NotReadableError"
        ? (language === "es" ? "No pudimos acceder a la cámara. Comprueba que otra aplicación no la esté usando." : "The camera could not be accessed. Check that another app is not using it.")
        : copy.cameraHelp;

  useEffect(() => {
    let cancelled = false;
    FRAMES.forEach(frame => {
      const image = new Image();
      const fail = () => {
        if (!cancelled) setFrameErrors(errors => ({ ...errors, [frame.id]: true }));
      };
      image.onload = () => {
        // Reject incompatible artwork rather than stretch it over the visitor's photo.
        if (!image.naturalWidth || image.naturalWidth * FRAME_HEIGHT !== image.naturalHeight * FRAME_WIDTH) {
          fail();
          return;
        }
        if (!cancelled) setFrameImages(images => ({ ...images, [frame.id]: image }));
      };
      image.onerror = fail;
      image.src = frame.src;
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phonePreview = process.env.NODE_ENV === "development" && params.get("phone") === "test";
    setPhoneCamera(isPhoneDevice(navigator) || phonePreview);
  }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result); }, [result]);
  useEffect(() => {
    if (!resultBlob || !isPhoneDevice(navigator, window.location.search) ||
        typeof navigator.share !== "function" || typeof navigator.canShare !== "function" ||
        typeof File === "undefined") {
      setShowShare(false);
      return;
    }
    try {
      const file = new File([resultBlob], resultFilename, { type: resultBlob.type });
      setShowShare(navigator.canShare({ files: [file] }));
    } catch {
      setShowShare(false);
    }
  }, [resultBlob, resultFilename]);
  useEffect(() => {
    if (screen !== "email") return;
    let active = true;
    setMarketingEnabled(false);
    fetch("/api/contact-settings", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(settings => { if (active) setMarketingEnabled(Boolean(settings?.marketingEnabled)); })
      .catch(() => { if (active) setMarketingEnabled(false); });
    return () => { active = false; };
  }, [screen]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (backdropVideoRef.current) backdropVideoRef.current.srcObject = null;
  }, []);

  const clearCapture = useCallback(() => {
    captureRun.current += 1;
    capturing.current = false;
    stopCamera();
    switchFromRef.current = null;
    setCameraFacing("user");
    setCameraSwitchError(false);
    setCameraReady(false);
    setBusy(false);
    setCountdown(0);
    setShot(0);
    setResult(null);
    setResultBlob(null);
    setShareError("");
    setName("");
    setEmail("");
    setMarketingOptIn(false);
    setEmailError("");
    setContactWarning("");
    setSendId(null);
  }, [stopCamera]);

  const resetToAttract = useCallback(() => {
    clearCapture();
    setLanguage("es");
    setCaptureType("photo");
    setFrameId(FRAMES[0].id);
    setScreen("attract");
  }, [clearCapture]);

  const kickIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (["attract", "processing", "result", "sending", "sent"].includes(screen) || busy) return;
    idleTimer.current = setTimeout(resetToAttract, IDLE_RESET_S * 1000);
  }, [screen, busy, resetToAttract]);

  useEffect(() => {
    kickIdle();
    return () => clearTimeout(idleTimer.current);
  }, [kickIdle]);

  useEffect(() => () => { captureRun.current += 1; stopCamera(); }, [stopCamera]);

  useEffect(() => {
    if (screen !== "camera") return;
    let cancelled = false;
    let stopTestCamera;
    setCameraReady(false);
    (async () => {
      try {
        const cameraMode = new URLSearchParams(window.location.search).get("camera");
        const useTestCamera = process.env.NODE_ENV === "development" && (cameraMode === "test" || cameraMode === "test-wide");
        setTestCamera(useTestCamera);
        let stream;
        if (useTestCamera) {
          const { createTestCamera } = await import("../lib/test-camera");
          if (cancelled) return;
          const test = createTestCamera({ wide: cameraMode === "test-wide" });
          stream = test.stream;
          stopTestCamera = test.stop;
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: phoneCamera
              ? { facingMode: { exact: cameraFacing }, resizeMode: "none" }
              : { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1620 } },
            audio: false,
          });
        }
        if (phoneCamera) {
          try {
            const track = stream.getVideoTracks()[0];
            const minZoom = track?.getCapabilities?.()?.zoom?.min;
            const currentZoom = track?.getSettings?.()?.zoom;
            if (Number.isFinite(minZoom) && Number.isFinite(currentZoom) && currentZoom > minZoom) {
              await track.applyConstraints({ advanced: [{ zoom: minZoom }] });
            }
          } catch {
            // Zoom controls are optional; keep the camera open when unavailable.
          }
        }
        if (cancelled) { stream.getTracks().forEach(track => track.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        if (backdropVideoRef.current) backdropVideoRef.current.srcObject = stream;
        switchFromRef.current = null;
      } catch (error) {
        if (!cancelled) {
          console.error(`[TEQ camera] ${error.name}: ${error.message}`);
          if (switchFromRef.current) {
            const previousFacing = switchFromRef.current;
            switchFromRef.current = null;
            setCameraSwitchError(true);
            setCameraFacing(previousFacing);
            return;
          }
          setCameraFailure(error.name);
          setErrorKind("camera"); setScreen("error");
        }
      }
    })();
    return () => { cancelled = true; stopCamera(); stopTestCamera?.(); };
  }, [screen, stopCamera, phoneCamera, cameraFacing]);

  useEffect(() => {
    if ((screen !== "result" && screen !== "sent") || sharing) return;
    setResetIn(RESULT_RESET_S);
    const interval = setInterval(() => setResetIn(value => Math.max(0, value - 1)), 1000);
    const timeout = setTimeout(resetToAttract, RESULT_RESET_S * 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [screen, sharing, resetToAttract]);

  const chooseExperience = (type) => {
    clearCapture();
    setCaptureType(type);
    setScreen("camera");
  };

  const backToSelection = () => { clearCapture(); setScreen("select"); };

  const switchCamera = () => {
    if (!phoneCamera || !cameraReady || busy) return;
    switchFromRef.current = cameraFacing;
    setCameraSwitchError(false);
    setCameraReady(false);
    setCameraFacing(cameraFacing === "user" ? "environment" : "user");
  };

  const startCapture = async () => {
    if (!cameraReady || !frameImage || frameError || capturing.current) return;
    const run = ++captureRun.current;
    capturing.current = true;
    setBusy(true);
    const frames = [];
    const total = captureType === "gif" ? 3 : 1;
    try {
      let canvas;
      for (let index = 0; index < total; index += 1) {
        setShot(index + 1);
        for (let second = 3; second >= 1; second -= 1) {
          setCountdown(second);
          await wait(1000);
          if (captureRun.current !== run) return;
        }
        setCountdown(0);
        const video = videoRef.current;
        if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) throw new Error("Camera is not ready");
        canvas = document.createElement("canvas");
        canvas.width = total === 3 ? 540 : FRAME_WIDTH;
        canvas.height = Math.round(canvas.width * FRAME_HEIGHT / FRAME_WIDTH);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context is unavailable");
        const mirrored = cameraFacing === "user";
        if (phoneCamera) {
          // Keep the entire mobile camera image visible; a darkened copy fills any side bands.
          drawFittedVideo(ctx, video, canvas.width, canvas.height, "cover", mirrored);
          ctx.fillStyle = "rgba(0, 0, 0, .58)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        drawFittedVideo(ctx, video, canvas.width, canvas.height, phoneCamera ? "contain" : "cover", mirrored);
        drawFrame(ctx, frameImage, canvas.width, canvas.height);
        if (total === 3) frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (index < total - 1) { await wait(350); if (captureRun.current !== run) return; }
      }
      stopCamera();
      setScreen("processing");
      const blob = total === 3
        ? new Blob([await encodeGif(frames)], { type: "image/gif" })
        : await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .92));
      if (captureRun.current !== run) return;
      if (!blob) throw new Error("Capture could not be encoded");
      setResultBlob(blob);
      setResult(URL.createObjectURL(blob));
      setSendId(crypto.randomUUID());
      setScreen("result");
    } catch (error) {
      if (captureRun.current === run) {
        console.error(`[TEQ capture/${captureType}] ${error.name}: ${error.message}`);
        setErrorKind("capture"); setScreen("error");
      }
    } finally {
      if (captureRun.current === run) { capturing.current = false; setBusy(false); setCountdown(0); }
    }
  };

  const updateEmail = value => {
    setEmail(value);
    setEmailError("");
    setSendId(crypto.randomUUID());
    kickIdle();
  };

  const updateName = value => {
    setName(value);
    setEmailError("");
    setSendId(crypto.randomUUID());
    kickIdle();
  };

  const updateMarketingOptIn = value => {
    setMarketingOptIn(value);
    setEmailError("");
    setSendId(crypto.randomUUID());
    kickIdle();
  };

  const sharePhoto = async () => {
    if (!showShare || !resultBlob || sharing) return;
    setShareError("");
    setSharing(true);
    try {
      const file = new File([resultBlob], resultFilename, { type: resultBlob.type });
      await navigator.share({ files: [file] });
    } catch (error) {
      if (error?.name !== "AbortError") setShareError(copy.shareError);
    } finally {
      setSharing(false);
    }
  };

  const sendPhoto = async () => {
    if (!resultBlob || !sendId || sending.current || !name.trim() || !email.trim()) return;
    sending.current = true;
    setEmailError("");
    setScreen("sending");
    const form = new FormData();
    form.append("name", name.trim());
    form.append("email", email.trim());
    form.append("marketingOptIn", String(marketingOptIn && marketingEnabled));
    form.append("language", language);
    form.append("kind", captureType);
    form.append("requestId", sendId);
    form.append("photo", resultBlob, `el-tequileno.${captureType === "gif" ? "gif" : "jpg"}`);
    try {
      const response = await fetch("/api/send-photo", { method: "POST", body: form, signal: AbortSignal.timeout(35000) });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setEmailError(data.code === "not_configured" ? copy.sendNotConfigured : data.code === "rate_limited" ? copy.sendRateLimited : data.code === "marketing_unavailable" ? copy.marketingUnavailable : copy.sendError);
        setScreen("email");
        return;
      }
      setContactWarning(!data.contactSaved ? copy.contactNotSaved : marketingOptIn && !data.marketingSubscribed ? copy.marketingNotSubscribed : "");
      setScreen("sent");
    } catch {
      setEmailError(copy.sendError);
      setScreen("email");
    } finally {
      sending.current = false;
    }
  };

  return (
    <main className={`kiosk ${screen === "attract" || screen === "select" ? "kiosk--welcome" : screen === "camera" ? "kiosk--camera" : screen === "email" || screen === "sending" ? "kiosk--email" : "kiosk--message"}`} onPointerDown={kickIdle}>
      {screen === "attract" && (
        <WelcomeScreen language={language} onLanguageChange={setLanguage} onStart={() => setScreen("select")} />
      )}
      {screen === "select" && (
        <ExperienceScreen language={language} onBack={() => setScreen("attract")} onSelect={chooseExperience} />
      )}
      {screen === "camera" && (
        <CameraScreen language={language} captureType={captureType} frameId={frameId}
          onFrameChange={setFrameId} frameImages={frameImages} frameError={frameError} videoRef={videoRef}
          backdropVideoRef={backdropVideoRef} phoneCamera={phoneCamera} cameraFacing={cameraFacing}
          cameraSwitchError={cameraSwitchError} onSwitchCamera={switchCamera}
          cameraReady={cameraReady} countdown={countdown} shot={shot} busy={busy}
          testCamera={testCamera} onReady={() => setCameraReady(Boolean(videoRef.current?.videoWidth && videoRef.current?.videoHeight))}
          onCapture={startCapture} onBack={backToSelection} />
      )}
      {screen === "processing" && <div className="stage-content"><p className="processing-label" role="status">{copy.processing}</p></div>}
      {screen === "result" && (
        <div className="stage-content">
          <div className="print print--portrait">
            <img className="print-img print-img--portrait" src={result} alt={modeName} />
          </div>
          <div className="result-actions">
            <button type="button" className="btn btn-primary" onClick={() => setScreen("email")}>{copy.email}</button>
            {showShare && <button type="button" className="btn btn-ghost" onClick={sharePhoto} disabled={sharing}>{copy.share}</button>}
            <button type="button" className="btn btn-ghost" onClick={() => { clearCapture(); setScreen("camera"); }}>{copy.retake}</button>
            <button type="button" className="btn btn-ghost" onClick={resetToAttract}>{copy.done}</button>
          </div>
          {shareError && <p className="subtitle" role="alert">{shareError}</p>}
          <p className="reset-note">{copy.reset} {resetIn}{copy.seconds}…</p>
        </div>
      )}
      {(screen === "email" || screen === "sending") && (
        <EmailScreen language={language} name={name} email={email} marketingOptIn={marketingOptIn} marketingEnabled={marketingEnabled}
          onNameChange={updateName} onEmailChange={updateEmail} onMarketingChange={updateMarketingOptIn}
          onBack={() => { setEmailError(""); setScreen("result"); }} onSend={sendPhoto}
          error={emailError} sending={screen === "sending"} />
      )}
      {screen === "sent" && (
        <div className="email-success stage-content" role="status">
          <h1>{copy.sentTitle}</h1>
          <p>{copy.sentHint} <strong>{email}</strong></p>
          {contactWarning && <p className="email-contact-warning">{contactWarning}</p>}
          <div className="print print--portrait"><img className="print-img print-img--portrait" src={result} alt={modeName} /></div>
          <div className="result-actions">
            <button type="button" className="btn btn-primary" onClick={() => { setName(""); setEmail(""); setMarketingOptIn(false); setContactWarning(""); setSendId(crypto.randomUUID()); setScreen("email"); }}>{copy.sendAnother}</button>
            <button type="button" className="btn btn-ghost" onClick={resetToAttract}>{copy.done}</button>
          </div>
          <p className="reset-note">{copy.reset} {resetIn}{copy.seconds}…</p>
        </div>
      )}
      {screen === "error" && (
        <div className="stage-content">
          <h1 className="error-title">{errorKind === "camera" ? copy.cameraError : copy.captureError}</h1>
          <p className="subtitle">{errorKind === "camera" ? cameraHelp : copy.captureHelp}</p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={() => { clearCapture(); setScreen("camera"); }}>{copy.retry}</button>
            <button type="button" className="btn btn-ghost" onClick={backToSelection}>{copy.back}</button>
            <button type="button" className="btn btn-ghost" onClick={resetToAttract}>{copy.startOver}</button>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import WelcomeScreen from "./components/welcome-screen";
import ExperienceScreen from "./components/experience-screen";
import CameraScreen from "./components/camera-screen";
import EmailScreen from "./components/email-screen";
import { encodeGif } from "../lib/gif";
import { FRAMES, drawFrame, FRAME_WIDTH, FRAME_HEIGHT } from "../lib/frames";

const IDLE_RESET_S = 90;
const RESULT_RESET_S = 60;
const COPY = {
  es: {
    photo: "Foto", gif: "GIF de 3 fotos", camera: "MIRA A LA CÁMARA",
    group: "Grupo", groupHint: "Horizontal", portrait: "Retrato", portraitHint: "Vertical",
    hint: "Colócate dentro del encuadre", back: "Volver", capture: "Tomar foto",
    captureGif: "Tomar 3 fotos", loading: "Abriendo cámara…", shot: "Foto",
    processing: "Preparando tu recuerdo…", email: "Correo", download: "Descargar", retake: "Repetir",
    done: "Terminar", reset: "Volvemos al inicio en", seconds: "s",
    sentTitle: "Tu foto va en camino", sentHint: "La enviamos a", sendAnother: "Enviar a otro correo",
    sendError: "No pudimos enviar la foto. Revisa la conexión e inténtalo de nuevo.",
    sendNotConfigured: "El envío por correo aún no está configurado. Pide ayuda al personal.",
    sendRateLimited: "Hubo muchos envíos seguidos. Espera unos minutos e inténtalo de nuevo.",
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
    processing: "Preparing your memory…", email: "Email", download: "Download", retake: "Retake",
    done: "Done", reset: "Returning to start in", seconds: "s",
    sentTitle: "Your photo is on its way", sentHint: "We sent it to", sendAnother: "Send to another email",
    sendError: "We couldn't send your photo. Check the connection and try again.",
    sendNotConfigured: "Email delivery isn't configured yet. Please ask a staff member for help.",
    sendRateLimited: "There have been too many sends. Wait a few minutes and try again.",
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
  const [testCamera, setTestCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [shot, setShot] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sendId, setSendId] = useState(null);
  const [resetIn, setResetIn] = useState(RESULT_RESET_S);
  const [errorKind, setErrorKind] = useState("camera");
  const [cameraFailure, setCameraFailure] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const idleTimer = useRef(null);
  const captureRun = useRef(0);
  const capturing = useRef(false);
  const sending = useRef(false);
  const frameImage = frameImages[frameId];
  const frameError = Boolean(frameErrors[frameId]);
  const copy = COPY[language];
  const modeName = captureType === "gif" ? copy.gif : copy.photo;
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
  useEffect(() => () => { if (result) URL.revokeObjectURL(result); }, [result]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const clearCapture = useCallback(() => {
    captureRun.current += 1;
    capturing.current = false;
    stopCamera();
    setCameraReady(false);
    setBusy(false);
    setCountdown(0);
    setShot(0);
    setResult(null);
    setResultBlob(null);
    setEmail("");
    setEmailError("");
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
        const useTestCamera = process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("camera") === "test";
        setTestCamera(useTestCamera);
        let stream;
        if (useTestCamera) {
          const { createTestCamera } = await import("../lib/test-camera");
          if (cancelled) return;
          const test = createTestCamera();
          stream = test.stream;
          stopTestCamera = test.stop;
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1620 } },
            audio: false,
          });
        }
        if (cancelled) { stream.getTracks().forEach(track => track.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        if (!cancelled) {
          console.error(`[TEQ camera] ${error.name}: ${error.message}`);
          setCameraFailure(error.name);
          setErrorKind("camera"); setScreen("error");
        }
      }
    })();
    return () => { cancelled = true; stopCamera(); stopTestCamera?.(); };
  }, [screen, stopCamera]);

  useEffect(() => {
    if (screen !== "result" && screen !== "sent") return;
    setResetIn(RESULT_RESET_S);
    const interval = setInterval(() => setResetIn(value => Math.max(0, value - 1)), 1000);
    const timeout = setTimeout(resetToAttract, RESULT_RESET_S * 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [screen, resetToAttract]);

  const chooseExperience = (type) => {
    clearCapture();
    setCaptureType(type);
    setScreen("camera");
  };

  const backToSelection = () => { clearCapture(); setScreen("select"); };

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
        // Match object-fit: cover in the preview, then mirror the photo only.
        const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
        const width = video.videoWidth * scale;
        const height = video.videoHeight * scale;
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        ctx.restore();
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

  const sendPhoto = async () => {
    if (!resultBlob || !sendId || sending.current || !email.trim()) return;
    sending.current = true;
    setEmailError("");
    setScreen("sending");
    const form = new FormData();
    form.append("email", email.trim());
    form.append("language", language);
    form.append("kind", captureType);
    form.append("requestId", sendId);
    form.append("photo", resultBlob, `el-tequileno.${captureType === "gif" ? "gif" : "jpg"}`);
    try {
      const response = await fetch("/api/send-photo", { method: "POST", body: form, signal: AbortSignal.timeout(35000) });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setEmailError(data.code === "not_configured" ? copy.sendNotConfigured : data.code === "rate_limited" ? copy.sendRateLimited : copy.sendError);
        setScreen("email");
        return;
      }
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
            <a className="btn btn-ghost result-download" href={result} download={`el-tequileno.${captureType === "gif" ? "gif" : "jpg"}`}>{copy.download}</a>
            <button type="button" className="btn btn-ghost" onClick={() => { clearCapture(); setScreen("camera"); }}>{copy.retake}</button>
            <button type="button" className="btn btn-ghost" onClick={resetToAttract}>{copy.done}</button>
          </div>
          <p className="reset-note">{copy.reset} {resetIn}{copy.seconds}…</p>
        </div>
      )}
      {(screen === "email" || screen === "sending") && (
        <EmailScreen language={language} email={email} onEmailChange={updateEmail}
          onBack={() => { setEmailError(""); setScreen("result"); }} onSend={sendPhoto}
          error={emailError} sending={screen === "sending"} />
      )}
      {screen === "sent" && (
        <div className="email-success stage-content" role="status">
          <h1>{copy.sentTitle}</h1>
          <p>{copy.sentHint} <strong>{email}</strong></p>
          <div className="print print--portrait"><img className="print-img print-img--portrait" src={result} alt={modeName} /></div>
          <div className="result-actions">
            <button type="button" className="btn btn-primary" onClick={() => { setEmail(""); setSendId(crypto.randomUUID()); setScreen("email"); }}>{copy.sendAnother}</button>
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

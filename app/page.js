"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { PRESETS_PUBLIC } from "../lib/presets";
import { printPhoto } from "../lib/printClient";
import WelcomeScreen from "./components/welcome-screen";

// Unattended kiosk timers (seconds)
const IDLE_RESET_S = 45;   // no touch -> back to attract (and clear photo)
const RESULT_RESET_S = 30; // on result screen, auto-reset for next guest

const CAM_MODES = {
  landscape: {
    label: "Group",
    sublabel: "Up to 5 people",
    hint: "Line up inside the frame",
    video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
    fallback: { width: 1920, height: 1080 },
  },
  portrait: {
    label: "Portrait",
    sublabel: "1–2 people",
    hint: "Full body inside the frame",
    video: { width: { ideal: 1080 }, height: { ideal: 1440 } },
    fallback: { width: 1080, height: 1440 },
  },
};

export default function Kiosk() {
  const [screen, setScreen] = useState("attract"); // attract|select|camera|processing|error|result
  const [language, setLanguage] = useState("es");
  const [preset, setPreset] = useState(null);
  const [captured, setCaptured] = useState(null);   // raw photo dataURL
  const [result, setResult] = useState(null);       // transformed dataURL
  const [resultName, setResultName] = useState("");
  const [qr, setQr] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [flash, setFlash] = useState(false);
  const [resetIn, setResetIn] = useState(RESULT_RESET_S);
  const [camMode, setCamMode] = useState("landscape");
  const [wantPrint, setWantPrint] = useState(false);
  const [printStatus, setPrintStatus] = useState(null); // null | "printing" | "done" | "failed"
  const printSentRef = useRef(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const idleTimer = useRef(null);

  useEffect(() => {
    document.documentElement.lang = screen === "attract" ? language : "en";
  }, [language, screen]);

  // Full reset: clear guest data and return to attract
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const resetToAttract = useCallback(() => {
    stopCamera();
    setLanguage("es");
    setPreset(null);
    setCaptured(null);   // privacy: never keep anyone's face in memory/on screen
    setResult(null);
    setResultName("");
    setQr(null);
    setCountdown(0);
    setCamMode("landscape");
    setWantPrint(false);
    setPrintStatus(null);
    printSentRef.current = false;
    setScreen("attract");
  }, [stopCamera]);

  // Global idle timer
  const kickIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (screen === "attract" || screen === "processing") return;
    idleTimer.current = setTimeout(resetToAttract, IDLE_RESET_S * 1000);
  }, [screen, resetToAttract]);

  useEffect(() => {
    kickIdle();
    return () => idleTimer.current && clearTimeout(idleTimer.current);
  }, [screen, kickIdle]);

  // Camera: start on enter or mode change, stop on leave
  useEffect(() => {
    if (screen !== "camera") return;
    let cancelled = false;
    const mode = CAM_MODES[camMode];

    (async () => {
      stopCamera();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", ...mode.video },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setScreen("error");
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [screen, camMode, stopCamera]);

  // Capture with countdown
  const startCapture = () => {
    let n = 3;
    setCountdown(n);
    const tick = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(tick);
        setCountdown(0);
        takePhoto();
      } else {
        setCountdown(n);
      }
    }, 1000);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const fallback = CAM_MODES[camMode].fallback;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || fallback.width;
    canvas.height = video.videoHeight || fallback.height;
    const ctx = canvas.getContext("2d");
    // Mirror to match the live preview the user sees
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCaptured(dataUrl);
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
    stopCamera();
    setScreen("processing");
    transform(dataUrl);
  };

  // Transform (backend) with atomic output
  const transform = async (dataUrl) => {
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: "image/jpeg",
          presetId: preset.id,
        }),
      });
      const data = await res.json();
      if (data.ok && data.image) {
        setResult(data.image);
        setResultName(data.presetName || preset.name);
        setScreen("result");
      } else {
        setScreen("error"); // never show a partial result
      }
    } catch {
      setScreen("error");
    }
  };

  // QR + auto-reset on result screen
  useEffect(() => {
    if (screen !== "result") return;
    // In production the server uploads the image and the QR points to that URL.
    // For the simulator, we encode a placeholder link.
    QRCode.toDataURL("https://your-photobooth.app/photo/demo", { margin: 1, width: 240 })
      .then(setQr)
      .catch(() => setQr(null));

    setResetIn(RESULT_RESET_S);
    const iv = setInterval(() => {
      setResetIn((s) => {
        if (s <= 1) { clearInterval(iv); resetToAttract(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [screen, resetToAttract]);

  // Print after result is ready (if guest opted in)
  useEffect(() => {
    if (screen !== "result" || !wantPrint || !result || printSentRef.current) return;
    printSentRef.current = true;
    setPrintStatus("printing");
    printPhoto(result)
      .then(() => setPrintStatus("done"))
      .catch(() => setPrintStatus("failed"));
  }, [screen, wantPrint, result]);

  const choosePreset = (p) => { setPreset(p); setScreen("printChoice"); };

  const choosePrintOption = (print) => {
    setWantPrint(print);
    setScreen("camera");
  };

  // ─────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <main className={`kiosk${screen === "attract" ? " kiosk--welcome" : ""}`} onPointerDown={kickIdle}>
      {flash && <div className="flash" />}

      {/* ATTRACT */}
      {screen === "attract" && (
        <WelcomeScreen
          language={language}
          onLanguageChange={setLanguage}
          onStart={() => setScreen("select")}
        />
      )}

      {/* SELECT */}
      {screen === "select" && (
        <div className="stage-content">
          <p className="eyebrow">Step 1 of 3</p>
          <h1 className="title" style={{ fontSize: "clamp(34px,6vw,64px)" }}>
            Choose your <span className="accent">transformation</span>
          </h1>
          <div className="grid">
            {PRESETS_PUBLIC.map((p) => (
              <button key={p.id} className="card" onClick={() => choosePreset(p)} aria-label={`${p.name}: ${p.tagline}`}>
                <img className="card-img" src={p.preview} alt="" />
                <span className="card-dot" style={{ background: p.accent }} />
                <span className="card-veil" />
                <span className="card-label">
                  <span className="card-name">{p.name}</span>
                  <span className="card-tag">{p.tagline}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={resetToAttract}>Cancel</button>
          </div>
        </div>
      )}

      {/* PRINT CHOICE */}
      {screen === "printChoice" && (
        <div className="stage-content">
          <p className="eyebrow">Step 2 of 3 · {preset?.name}</p>
          <h1 className="title" style={{ fontSize: "clamp(34px,6vw,64px)" }}>
            Want a <span className="accent">printed copy</span>?
          </h1>
          <p className="subtitle">Pick one — you can always scan the QR for a digital copy too.</p>
          <div className="print-choice-grid">
            <button
              type="button"
              className="print-choice-btn"
              onClick={() => choosePrintOption(true)}
              aria-label="Yes, print my photo"
            >
              <span className="print-choice-icon">🖨️</span>
              <span className="print-choice-label">Yes, print it</span>
              <span className="print-choice-sub">Collect your photo at the printer</span>
            </button>
            <button
              type="button"
              className="print-choice-btn print-choice-btn--ghost"
              onClick={() => choosePrintOption(false)}
              aria-label="Digital only, no print"
            >
              <span className="print-choice-icon">📱</span>
              <span className="print-choice-label">Digital only</span>
              <span className="print-choice-sub">Scan the QR to download</span>
            </button>
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => setScreen("select")}>Back</button>
          </div>
        </div>
      )}

      {/* CAMERA */}
      {screen === "camera" && (
        <div className="stage-content stage-content--camera">
          <p className="eyebrow">Step 3 of 3 · {preset?.name}</p>
          <h1 className="title">
            {camMode === "landscape" ? (
              <>Line up in the <span className="accent">frame</span></>
            ) : (
              <>Step into the <span className="accent">center</span></>
            )}
          </h1>
          <div className="cam-mode-toggle" role="group" aria-label="Photo format">
            {Object.entries(CAM_MODES).map(([id, mode]) => (
              <button
                key={id}
                type="button"
                className={`cam-mode-btn${camMode === id ? " cam-mode-btn--active" : ""}`}
                onClick={() => setCamMode(id)}
                disabled={countdown > 0}
                aria-pressed={camMode === id}
              >
                <span className="cam-mode-btn__label">{mode.label}</span>
                <span className="cam-mode-btn__sub">{mode.sublabel}</span>
              </button>
            ))}
          </div>
          <div className={`cam-wrap cam-wrap--${camMode}`}>
            <video ref={videoRef} className="cam-video" autoPlay playsInline muted />
            <div className="cam-guide" />
            {countdown > 0 && <div className="countdown">{countdown}</div>}
            {countdown === 0 && <div className="cam-hint">{CAM_MODES[camMode].hint}</div>}
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => setScreen("printChoice")}>Back</button>
            <button className="btn btn-primary" onClick={startCapture} disabled={countdown > 0}>
              Take photo
            </button>
          </div>
        </div>
      )}

      {/* PROCESSING */}
      {screen === "processing" && (
        <div className="stage-content">
          <div className={`developing developing--${camMode}`}>
            {captured && <img className="developing-img" src={captured} alt="" />}
            <div className="developing-shimmer" />
          </div>
          <p className="processing-label">Revealing your {preset?.name?.toLowerCase()}…</p>
          <p className="processing-sub">One moment — we&apos;re fine-tuning every detail</p>
        </div>
      )}

      {/* RESULT */}
      {screen === "result" && (
        <div className="stage-content">
          <div className={`print print--${camMode}`}>
            <img className={`print-img print-img--${camMode}`} src={result} alt="Result" />
            <span className="print-caption">{resultName}</span>
          </div>
          <div className="result-actions">
            {qr && (
              <span className="qr-block">
                <img src={qr} alt="Download QR code" />
                <span>Scan to download</span>
              </span>
            )}
            <button className="btn btn-primary" onClick={resetToAttract}>New photo</button>
          </div>
          <p className="reset-note">
            {wantPrint && printStatus === "printing" && "Sending your photo to the printer…"}
            {wantPrint && printStatus === "done" && "Your photo is printing — pick it up at the printer. "}
            {wantPrint && printStatus === "failed" && "Print failed — scan the QR to save your photo. "}
            {(!wantPrint || printStatus !== "printing") && `Returning to start in ${resetIn}s…`}
          </p>
        </div>
      )}

      {/* ERROR — never a broken hybrid, always a clear path forward */}
      {screen === "error" && (
        <div className="stage-content">
          <div className="error-mark">✨</div>
          <h1 className="error-title">Almost there</h1>
          <p className="subtitle">That shot didn&apos;t come out clean. Let&apos;s try again.</p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => setScreen("camera")}>
              Retake photo
            </button>
            <button className="btn btn-ghost" onClick={resetToAttract}>Start over</button>
          </div>
        </div>
      )}

      {/* Consent notice (PIPEDA): brief and always visible before capture */}
      {(screen === "select" || screen === "printChoice" || screen === "camera") && (
        <p className="consent">
          By taking your photo you agree that your image will be processed to generate the result.
          It is not stored or shared; it is deleted when your session ends.
        </p>
      )}
    </main>
  );
}

"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    // Development bundles change on every edit, so cache only production builds.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let active = true;
    const warmOfflineBundles = () => {
      if (active) import("gifenc").catch(error => console.warn("Photo booth GIF offline setup failed", error));
      if (active) import("../../lib/face-tracker").catch(error => console.warn("Photo booth face effect offline setup failed", error));
      if (active) import("../../lib/background-segmenter").catch(error => console.warn("Photo booth background offline setup failed", error));
    };
    const register = async () => {
      try {
        navigator.serviceWorker.addEventListener("controllerchange", warmOfflineBundles);
        await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        if (!active) return;
        if (navigator.serviceWorker.controller) warmOfflineBundles();
      } catch (error) {
        console.warn("Photo booth offline setup failed", error);
      }
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      active = false;
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener("controllerchange", warmOfflineBundles);
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    // Development bundles change on every edit, so cache only production builds.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let active = true;
    const warmGifEncoder = () => {
      if (active) import("gifenc").catch(error => console.warn("Photo booth GIF offline setup failed", error));
    };
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        if (!active) return;
        if (navigator.serviceWorker.controller) warmGifEncoder();
        else navigator.serviceWorker.addEventListener("controllerchange", warmGifEncoder, { once: true });
      } catch (error) {
        console.warn("Photo booth offline setup failed", error);
      }
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      active = false;
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener("controllerchange", warmGifEncoder);
    };
  }, []);

  return null;
}

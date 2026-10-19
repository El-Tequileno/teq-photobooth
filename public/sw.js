const CACHE_NAME = "teq-photobooth-v1";
const CACHE_PREFIX = "teq-photobooth-";
const APP_FILES = [
  "/",
  "/manifest.webmanifest",
  "/brand/el-tequileno-white.svg",
  "/frames/frames.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/favicon-32.png",
];

function pageAssets(html) {
  const assets = new Set();
  const attribute = /(?:src|href)="(\/_next\/static\/[^"?]+)"/g;
  for (const match of html.matchAll(attribute)) assets.add(match[1]);
  return [...assets];
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_FILES);
    const home = await cache.match("/");
    await cache.addAll(pageAssets(await home.text()));
    const frameList = await cache.match("/frames/frames.json");
    const frames = await frameList.json();
    const framePaths = frames.map(frame => frame.src).filter(path => /^\/frames\/[^/?#]+\.png$/.test(path));
    await cache.addAll(framePaths);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok && url.pathname === "/") await cache.put("/", response.clone());
        return response;
      } catch {
        return await cache.match("/") || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
    return;
  }

  if (APP_FILES.includes(url.pathname) || url.pathname.startsWith("/frames/")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return await cache.match(request) || Response.error();
      }
    })());
  }
});

const CACHE_NAME = "zodi-cache-v5";
const APP_SHELL = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/zodi-logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

function shouldBypass(request) {
  if (request.method !== "GET") return true;

  const url = new URL(request.url);

  // Solo manejamos same-origin: cross-origin (CDN, Firebase, gstatic, etc.) pasa directo.
  if (url.origin !== self.location.origin) return true;

  // Nunca interceptamos endpoints del runtime de Next (HMR, chunks, SSE, assets generados).
  if (url.pathname.startsWith("/_next/")) return true;
  if (url.pathname.startsWith("/__next")) return true;
  if (url.pathname.startsWith("/api/")) return true;

  // SSE / streams: si el cliente acepta event-stream no cacheamos.
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/event-stream")) return true;

  // Range requests (audio/video parciales): no cacheamos respuestas 206.
  if (request.headers.get("range")) return true;

  return false;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (shouldBypass(request)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ||
              new Response(
                "<!doctype html><title>ZODI Offline</title><body style='background:#050507;color:#b8ff17;font-family:Arial;padding:32px'>ZODI esta offline. El oraculo guardo el shell; vuelve cuando la red deje de hacer drama.</body>",
                { headers: { "Content-Type": "text/html" } }
              )
          )
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
          }
          return response;
        })
        .catch(() => Response.error());
    })
  );
});

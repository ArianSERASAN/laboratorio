/* Service worker del cuaderno.
 *
 * La lista de archivos y la versión las escribe `scripts/build-sw.mjs` después
 * de compilar; en desarrollo este archivo se sirve tal cual y no cachea nada.
 */

const VERSION = "dev";
const ASSETS = [];
const CACHE = `cuaderno-${VERSION}`;
const SHELL = new URL("./index.html", self.location.href).href;

self.addEventListener("install", (event) => {
  if (!ASSETS.length) return; // desarrollo: nada que precargar
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegación: siempre el index cacheado, para que la app abra sin conexión.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const shell = await cache.match(SHELL);
        try {
          const red = await fetch(req);
          if (red.ok) cache.put(SHELL, red.clone());
          return red;
        } catch {
          return shell || Response.error();
        }
      })()
    );
    return;
  }

  // Recursos: primero la caché (los nombres llevan hash), luego la red.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const guardado = await cache.match(req);
      if (guardado) return guardado;
      try {
        const red = await fetch(req);
        if (red.ok && red.type === "basic") cache.put(req, red.clone());
        return red;
      } catch {
        return guardado || Response.error();
      }
    })()
  );
});

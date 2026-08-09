/* Service worker del cuaderno.
 *
 * La lista de archivos y la versión las escribe `scripts/build-sw.mjs` después
 * de compilar; en desarrollo este archivo se sirve tal cual y no cachea nada.
 */

const VERSION = "ddb0918f3c";
const ASSETS = ["./assets/index-C0tdaMmj.js","./assets/index-D3spNi02.css","./fonts/bricolage-grotesque.woff2","./fonts/dm-mono-400.woff2","./fonts/dm-mono-500.woff2","./fonts/fonts.css","./fonts/public-sans.woff2","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon.svg","./icons/maskable-192.png","./icons/maskable-512.png","./","./manifest.webmanifest"];
const CACHE = `cuaderno-${VERSION}`;
// La carpeta, no `index.html`: es la URL que pide el navegador al abrir la app.
// Guardar la otra deja una respuesta redirigida, que no vale para una
// navegación y tira la carga sin conexión.
const SHELL = new URL("./", self.location.href).href;

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

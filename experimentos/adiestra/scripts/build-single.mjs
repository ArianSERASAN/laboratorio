// Empaqueta la app compilada en un único archivo .html con todo dentro
// (código, estilos, tipografías e iconos). Sirve para llevártela en un correo,
// en iCloud Drive o dejarla en cualquier alojamiento sin subir nada más.
//
// Lo que se pierde respecto al despliegue normal: el service worker y el
// manifest, o sea la instalación con icono propio y el funcionamiento sin
// conexión. Para eso hace falta servir la carpeta dist/ entera por HTTPS.
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const OUT = join(ROOT, "dist-single");
const SALIDA = "cuaderno-de-campo.html";

const dataURI = async (ruta, mime) => `data:${mime};base64,${(await readFile(ruta)).toString("base64")}`;

const assets = await readdir(join(DIST, "assets"));
const cssAsset = assets.find((f) => f.endsWith(".css"));
const jsAsset = assets.find((f) => f.endsWith(".js"));

const css = await readFile(join(DIST, "assets", cssAsset), "utf8");
// El cierre de etiqueta dentro de una cadena JS rompería el <script> que lo envuelve.
const js = (await readFile(join(DIST, "assets", jsAsset), "utf8")).replaceAll("</script", "<\\/script");

let fuentes = await readFile(join(DIST, "fonts", "fonts.css"), "utf8");
for (const woff of (await readdir(join(DIST, "fonts"))).filter((f) => f.endsWith(".woff2"))) {
  fuentes = fuentes.replaceAll(`./${woff}`, await dataURI(join(DIST, "fonts", woff), "font/woff2"));
}

const icono = await dataURI(join(DIST, "icons", "apple-touch-icon.png"), "image/png");
const favicon = await dataURI(join(DIST, "icons", "icon.svg"), "image/svg+xml");

// Siempre con función de reemplazo: en una cadena, `$&` o `$'` dentro del
// código empaquetado se interpretarían y duplicarían medio documento.
const pon = (texto) => () => texto;

const html = (await readFile(join(DIST, "index.html"), "utf8"))
  // Fuera todo lo que apunte a un archivo suelto: aquí no hay carpeta que servir.
  .replace(/\s*<link rel="manifest"[^>]*>/g, "")
  .replace(/\s*<link rel="preload"[^>]*>/g, "")
  .replace(/\s*<link rel="icon"[^>]*sizes[^>]*>/g, "")
  .replace(/<link rel="icon"[^>]*>/, pon(`<link rel="icon" href="${favicon}" type="image/svg+xml" />`))
  .replace(/<link rel="apple-touch-icon"[^>]*>/, pon(`<link rel="apple-touch-icon" href="${icono}" />`))
  .replace(/<link rel="stylesheet" href="\.\/fonts\/fonts\.css"[^>]*>/, pon(`<style>\n${fuentes}\n</style>`))
  .replace(new RegExp(`<link[^>]*href="[^"]*${cssAsset}"[^>]*>`), pon(`<style>\n${css}\n</style>`))
  .replace(new RegExp(`<script[^>]*src="[^"]*${jsAsset}"[^>]*></script>`), pon(`<script type="module">\n${js}\n</script>`));

await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, SALIDA), html);
console.log(`${SALIDA} listo · ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB · dist-single/`);

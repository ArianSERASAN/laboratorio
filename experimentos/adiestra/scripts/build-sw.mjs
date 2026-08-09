// Rellena el service worker compilado con la lista de archivos a precargar y
// una versión derivada de su contenido: cada despliegue invalida la caché
// anterior y la app entera queda disponible sin conexión.
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const EXCLUDE = new Set(["sw.js"]);

async function walk(dir) {
  const salida = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) salida.push(...(await walk(full)));
    else salida.push(full);
  }
  return salida;
}

const archivos = (await walk(DIST))
  .map((f) => relative(DIST, f).split(sep).join("/"))
  .filter((f) => !EXCLUDE.has(f))
  .sort();

const hash = createHash("sha1");
for (const f of archivos) {
  hash.update(f);
  hash.update(await readFile(join(DIST, f)));
}
const version = hash.digest("hex").slice(0, 10);

// `index.html` se precarga como la carpeta que lo contiene: es lo que pide el
// navegador al abrir la app, y así la respuesta guardada sirve para navegar.
const precarga = archivos.map((f) => (f === "index.html" ? "./" : "./" + f));

const swPath = join(DIST, "sw.js");
const sw = (await readFile(swPath, "utf8"))
  .replace('const VERSION = "dev";', `const VERSION = "${version}";`)
  .replace("const ASSETS = [];", `const ASSETS = ${JSON.stringify(precarga)};`);

await writeFile(swPath, sw);

const bytes = (await Promise.all(archivos.map((f) => stat(join(DIST, f))))).reduce((a, s) => a + s.size, 0);
console.log(`sw.js listo · versión ${version} · ${archivos.length} archivos · ${(bytes / 1024).toFixed(0)} KB`);

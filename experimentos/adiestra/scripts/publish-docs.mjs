// Copia la app compilada a la carpeta `docs/` de la raíz del repositorio.
//
// GitHub Pages sabe servir esa carpeta tal cual, sin pasar por Actions: se
// compila aquí, se commitea el resultado y con el push queda publicado. Es la
// vía que no consume minutos de integración continua.
import { cp, mkdir, rm, writeFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const DOCS = join(ROOT, "..", "..", "docs");

await rm(DOCS, { recursive: true, force: true });
await mkdir(DOCS, { recursive: true });
await cp(DIST, DOCS, { recursive: true });

// Sin esto, Pages pasa la carpeta por Jekyll y se salta lo que empiece por «_».
await writeFile(join(DOCS, ".nojekyll"), "");

const cuenta = (await readdir(DOCS, { recursive: true })).length;
console.log(`docs/ listo · ${cuenta} entradas copiadas desde dist/`);

// Genera los iconos PNG de la app a partir de una huella dibujada en SVG.
// Ejecutar con `npm run icons` sólo cuando cambie el diseño; los PNG se
// commitean para que el despliegue no dependa de esta herramienta.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
const INK = "#13201B";
const LIME = "#C6DE45";

/** Huella centrada en un lienzo de 512, con `scale` para dejar zona segura. */
function paw(scale = 1) {
  const t = (1 - scale) * 256; // desplazamiento para mantenerla centrada
  return `<g transform="translate(${t} ${t}) scale(${scale})" fill="${LIME}">
    <ellipse cx="124" cy="236" rx="46" ry="58" transform="rotate(-22 124 236)"/>
    <ellipse cx="212" cy="174" rx="45" ry="60" transform="rotate(-8 212 174)"/>
    <ellipse cx="300" cy="174" rx="45" ry="60" transform="rotate(8 300 174)"/>
    <ellipse cx="388" cy="236" rx="46" ry="58" transform="rotate(22 388 236)"/>
    <path d="M256 258c66 0 122 46 122 104 0 48-46 78-122 78s-122-30-122-78c0-58 56-104 122-104z"/>
  </g>`;
}

const square = (scale) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <rect width="512" height="512" fill="${INK}"/>${paw(scale)}</svg>`;

const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="${INK}"/>${paw(0.86)}</svg>`;

const png = (svg, size, file) =>
  sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(join(OUT, file));

await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, "icon.svg"), rounded + "\n");
// Cuadrados a sangre: iOS y Android aplican su propia máscara; un PNG con
// esquinas transparentes se vería con bordes negros en la pantalla de inicio.
await png(square(0.86), 512, "icon-512.png");
await png(square(0.86), 192, "icon-192.png");
await png(square(0.86), 180, "apple-touch-icon.png");
// Maskable: la huella ocupa el 62 % para sobrevivir al recorte circular.
await png(square(0.62), 512, "maskable-512.png");
await png(square(0.62), 192, "maskable-192.png");

console.log("Iconos generados en public/icons");

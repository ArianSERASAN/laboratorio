/* Copias de seguridad en un único archivo .json que se puede guardar en
 * iCloud, mandarse por correo o restaurar en otro móvil. */

import { normalize, SCHEMA_VERSION } from "./model.js";
import { todayISO } from "./dates.js";

const COLLECTIONS = ["clients", "bonos", "sessions", "followups", "payments"];

export const backupName = (day = todayISO()) => `cuaderno-adiestra-${day}.json`;

export function toBackupJSON(data) {
  return JSON.stringify({ app: "cuaderno-adiestra", version: SCHEMA_VERSION, exported: new Date().toISOString(), data }, null, 2);
}

/** Acepta tanto el archivo exportado como un volcado suelto del cuaderno. */
export function parseBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("El archivo no es un JSON válido.");
  }
  const candidate = raw?.data && typeof raw.data === "object" ? raw.data : raw;
  const looksRight = COLLECTIONS.some((k) => Array.isArray(candidate?.[k]));
  if (!looksRight) throw new Error("El archivo no parece una copia del cuaderno.");
  return normalize(candidate);
}

/** Une dos cuadernos: se queda con lo que ya hay y añade lo que falte por id. */
export function mergeData(current, incoming) {
  const merged = { ...current, settings: { ...current.settings, ...incoming.settings } };
  const added = {};
  COLLECTIONS.forEach((key) => {
    const known = new Set(current[key].map((x) => x.id));
    const nuevos = incoming[key].filter((x) => x?.id && !known.has(x.id));
    merged[key] = [...current[key], ...nuevos];
    added[key] = nuevos.length;
  });
  return { merged, added };
}

export const countOf = (data) => ({
  clientes: data.clients.length,
  sesiones: data.sessions.length,
  bonos: data.bonos.length,
  cobros: data.payments.length,
  avisos: data.followups.length,
});

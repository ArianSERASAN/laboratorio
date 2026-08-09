/* Almacenamiento local del cuaderno.
 *
 * Estrategia: IndexedDB como almacén principal (no lo vacía Safari con la
 * misma facilidad que localStorage) y una copia espejo en localStorage que
 * sirve de red de seguridad y permite guardar de forma síncrona cuando el
 * sistema está a punto de cerrar la app.
 */

const DB_NAME = "adiestra";
const DB_VERSION = 1;
const STORE = "kv";

export const DATA_KEY = "adiestra:data";
export const SNAPSHOTS_KEY = "adiestra:snapshots";
const LEGACY_KEYS = ["adiestra:v1"];
const MAX_SNAPSHOTS = 10;

let dbPromise = null;
let idbBroken = false;

function openDB() {
  if (idbBroken || typeof indexedDB === "undefined") return Promise.reject(new Error("sin indexedDB"));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("indexedDB bloqueada"));
    }).catch((e) => {
      idbBroken = true;
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

function tx(mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        t.onabort = () => reject(t.error);
        t.onerror = () => reject(t.error);
        t.oncomplete = () => resolve(req?.result);
      })
  );
}

const idbGet = (key) => tx("readonly", (store) => store.get(key));
const idbSet = (key, value) => tx("readwrite", (store) => store.put(value, key));

function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Lee el cuaderno. Prueba IndexedDB, luego el espejo, luego el formato antiguo. */
export async function loadState() {
  let fromIdb;
  try {
    fromIdb = await idbGet(DATA_KEY);
  } catch {
    /* seguimos con localStorage */
  }
  if (fromIdb) return fromIdb;

  const mirror = lsGet(DATA_KEY);
  if (mirror) return mirror;

  for (const key of LEGACY_KEYS) {
    const legacy = lsGet(key);
    if (legacy) return legacy;
  }
  return null;
}

/** Guarda en los dos almacenes. Devuelve true si al menos uno ha aceptado. */
export async function saveState(data) {
  const mirrored = lsSet(DATA_KEY, data);
  try {
    await idbSet(DATA_KEY, data);
    return true;
  } catch {
    return mirrored;
  }
}

/** Guardado síncrono de emergencia (al ocultar o cerrar la app). */
export function saveStateSync(data) {
  return lsSet(DATA_KEY, data);
}

/* ------------------------- copias automáticas ------------------------- */

export async function listSnapshots() {
  try {
    const list = await idbGet(SNAPSHOTS_KEY);
    if (Array.isArray(list)) return list;
  } catch {
    /* seguimos con localStorage */
  }
  const mirror = lsGet(SNAPSHOTS_KEY);
  return Array.isArray(mirror) ? mirror : [];
}

async function writeSnapshots(list) {
  lsSet(SNAPSHOTS_KEY, list);
  try {
    await idbSet(SNAPSHOTS_KEY, list);
  } catch {
    /* el espejo ya tiene la copia */
  }
}

/**
 * Guarda una copia del cuaderno si hoy todavía no hay ninguna.
 * Así siempre queda el estado del día anterior por si algo se borra sin querer.
 */
export async function snapshotOncePerDay(data, day, stamp) {
  if (!data) return null;
  const list = await listSnapshots();
  if (list.some((s) => s.day === day)) return null;
  const entry = {
    id: `snap-${day}`,
    day,
    stamp,
    counts: {
      clientes: data.clients?.length || 0,
      sesiones: data.sessions?.length || 0,
      bonos: data.bonos?.length || 0,
    },
    data,
  };
  const next = [entry, ...list].slice(0, MAX_SNAPSHOTS);
  await writeSnapshots(next);
  return entry;
}

/* --------------------------- estado del disco --------------------------- */

/** Pide al navegador que no borre estos datos al liberar espacio. */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* no soportado */
  }
  return false;
}

export async function storageInfo() {
  const info = { persisted: false, usage: null, quota: null, supported: false };
  try {
    if (navigator.storage?.persisted) {
      info.persisted = await navigator.storage.persisted();
      info.supported = true;
    }
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      info.usage = est.usage ?? null;
      info.quota = est.quota ?? null;
    }
  } catch {
    /* datos de cuota no disponibles */
  }
  return info;
}

/* Forma de los datos, migraciones y cálculos derivados.
 *
 * Regla de oro del dinero: la verdad está en `payments`. Ni el bono ni la
 * sesión guardan cuánto se ha cobrado; se suma a partir de los cobros
 * registrados, que sí llevan fecha y método.
 */

import { todayISO } from "./dates.js";

export const SCHEMA_VERSION = 2;

export const TAGS = ["#28564A", "#B8402B", "#2C4C7C", "#8A5A2B", "#5E4A7D", "#3E7A4E"];
export const METHODS = ["efectivo", "bizum", "transferencia", "tarjeta"];

export const EMPTY = {
  version: SCHEMA_VERSION,
  settings: {
    theme: "auto",
    // Lo que se repite en casi todas las sesiones, para no teclearlo cada vez.
    defaults: { duration: 60, price: "", place: "" },
  },
  clients: [],
  bonos: [],
  sessions: [],
  followups: [],
  payments: [],
};

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 12)
    : Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/**
 * Deja cualquier cuaderno guardado en el formato actual.
 * Acepta el formato del prototipo (sin `version`, con `paid` en bonos y
 * sesiones) y lo convierte en cobros con fecha.
 */
export function normalize(raw) {
  if (!raw || typeof raw !== "object") return { ...EMPTY };

  // La versión se mira en el original: al mezclarlo con EMPTY heredaría la
  // actual y un cuaderno antiguo se daría por migrado sin serlo.
  const versión = num(raw.version);

  const data = {
    ...EMPTY,
    ...raw,
    settings: {
      ...EMPTY.settings,
      ...(raw.settings || {}),
      defaults: { ...EMPTY.settings.defaults, ...(raw.settings?.defaults || {}) },
    },
    clients: arr(raw.clients),
    bonos: arr(raw.bonos),
    sessions: arr(raw.sessions),
    followups: arr(raw.followups),
    payments: arr(raw.payments),
  };

  if (versión >= SCHEMA_VERSION) return data;

  // v1 → v2: el importe cobrado pasa a ser un registro de cobro con fecha.
  const payments = [...data.payments];

  data.bonos = data.bonos.map((b) => {
    const { paid, ...rest } = b;
    if (num(paid) > 0) {
      payments.push({
        id: uid(),
        date: b.date || todayISO(),
        amount: num(paid),
        clientId: b.clientId,
        bonoId: b.id,
        method: "",
        note: "Traspaso de la versión anterior",
      });
    }
    return { ...rest, price: num(b.price), sessions: Math.max(1, num(b.sessions) || 1) };
  });

  data.sessions = data.sessions.map((s) => {
    const { paid, ...rest } = s;
    if (paid === true && num(s.price) > 0 && !s.bonoId) {
      payments.push({
        id: uid(),
        date: s.date || todayISO(),
        amount: num(s.price),
        clientId: s.clientId,
        sessionId: s.id,
        method: "",
        note: "Traspaso de la versión anterior",
      });
    }
    return rest;
  });

  data.payments = payments;
  data.version = SCHEMA_VERSION;
  return data;
}

/* ------------------------------ derivados ------------------------------ */

const sum = (list, f) => list.reduce((a, x) => a + f(x), 0);

export const clientOf = (data, id) => data.clients.find((c) => c.id === id) || null;

export const paidOfBono = (data, bonoId) =>
  sum(data.payments.filter((p) => p.bonoId === bonoId), (p) => num(p.amount));

export const paidOfSession = (data, sessionId) =>
  sum(data.payments.filter((p) => p.sessionId === sessionId), (p) => num(p.amount));

export const debtOfBono = (data, bono) => Math.max(0, num(bono.price) - paidOfBono(data, bono.id));

/** Sesiones consumidas de un bono; `exclude` evita contar la que se edita. */
export const usedOfBono = (data, bonoId, exclude) =>
  data.sessions.filter((s) => s.bonoId === bonoId && s.status !== "cancelada" && s.id !== exclude).length;

/** Una sesión suelta con precio deja de estar pendiente cuando se cubre. */
export const debtOfSession = (data, s) => {
  if (s.bonoId || s.status === "cancelada") return 0;
  return Math.max(0, num(s.price) - paidOfSession(data, s.id));
};

export const isSessionPaid = (data, s) => num(s.price) > 0 && debtOfSession(data, s) < 0.005;

export const clientDebt = (data, clientId) =>
  sum(data.bonos.filter((b) => b.clientId === clientId), (b) => debtOfBono(data, b)) +
  sum(data.sessions.filter((s) => s.clientId === clientId), (s) => debtOfSession(data, s));

export const totalDebt = (data) =>
  sum(data.bonos, (b) => debtOfBono(data, b)) + sum(data.sessions, (s) => debtOfSession(data, s));

export const incomeIn = (data, ym) =>
  sum(data.payments.filter((p) => String(p.date).startsWith(ym)), (p) => num(p.amount));

export const totalIncome = (data) => sum(data.payments, (p) => num(p.amount));

export const labelOfBono = (b) => b.label || (b.type === "programa" ? "Programa" : "Bono");

/** Lista de todo lo pendiente de cobro, de mayor a menor importe. */
export function pendingList(data) {
  const bonos = data.bonos
    .map((b) => ({ kind: "bono", ref: b, amount: debtOfBono(data, b) }))
    .filter((x) => x.amount > 0.005);
  const sesiones = data.sessions
    .map((s) => ({ kind: "sesion", ref: s, amount: debtOfSession(data, s) }))
    .filter((x) => x.amount > 0.005);
  return [...bonos, ...sesiones].sort((a, b) => b.amount - a.amount);
}

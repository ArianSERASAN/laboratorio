/* Fechas en formato ISO corto (AAAA-MM-DD), siempre en hora local. */

export const DOW = ["L", "M", "X", "J", "V", "S", "D"];
export const DOW_LONG = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
export const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const pad = (n) => String(n).padStart(2, "0");
export const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => isoOf(new Date());
export const parseISO = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const nowStamp = () => new Date().toISOString();

export const addDays = (iso, n) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return isoOf(d);
};

export const monthOf = (iso) => String(iso).slice(0, 7);
export const fmtMonth = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

export const fmtShort = (iso) => {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};

export const fmtFull = (iso) => {
  const d = parseISO(iso);
  return `${DOW_LONG[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
};

export const daysFromToday = (iso) => Math.round((parseISO(iso) - parseISO(todayISO())) / 86400000);

/** Rejilla del mes empezando en lunes; los huecos van a null. */
export function monthMatrix(year, month) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(isoOf(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

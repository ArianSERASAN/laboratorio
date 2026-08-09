export const money = (n) =>
  (Number(n) || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });

/** Importe sin decimales cuando son cero, para que quepa en las tarjetas. */
export const moneyShort = (n) => {
  const v = Number(n) || 0;
  return Number.isInteger(v)
    ? v.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 0 })
    : money(v);
};

export const cls = (...parts) => parts.filter(Boolean).join(" ");

/** Deja el teléfono en un formato marcable: sólo dígitos y el prefijo. */
export const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

export const waHref = (phone, text = "") => {
  const digits = String(phone).replace(/[^\d]/g, "");
  const withPrefix = digits.length === 9 ? `34${digits}` : digits;
  return `https://wa.me/${withPrefix}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

/* Exportación al calendario del móvil (.ics).
 *
 * El iPhone no permite que una web programe avisos, así que los recordatorios
 * y las sesiones se vuelcan al calendario del sistema, que sí avisa.
 */

import { pad } from "./dates.js";

const esc = (t = "") =>
  String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Las líneas de un .ics no deben pasar de 75 octetos. */
function fold(line) {
  if (line.length <= 73) return line;
  const parts = [line.slice(0, 73)];
  let rest = line.slice(73);
  while (rest.length > 72) {
    parts.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  if (rest) parts.push(" " + rest);
  return parts.join("\r\n");
}

function stamp(iso, time, addMin = 0) {
  const [y, m, d] = iso.split("-").map(Number);
  const [hh, mm] = (time || "09:00").split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm + addMin);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function utcStamp(date = new Date()) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/**
 * @param {Array<{uid,date,time,duration,summary,location,description,alarm}>} events
 */
export function buildICS(events) {
  const dtstamp = utcStamp();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cuaderno de campo//Adiestramiento//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  events.forEach((e) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@cuaderno-adiestra`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${stamp(e.date, e.time)}`,
      `DTEND:${stamp(e.date, e.time, Number(e.duration) || 60)}`,
      `SUMMARY:${esc(e.summary)}`
    );
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    if (e.alarm != null) {
      lines.push(
        "BEGIN:VALARM",
        `TRIGGER:-PT${Math.max(0, Number(e.alarm) || 0)}M`,
        "ACTION:DISPLAY",
        `DESCRIPTION:${esc(e.summary)}`,
        "END:VALARM"
      );
    }
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function sessionEvent(session, client) {
  const título = client ? `${client.dogName || client.name} · adiestramiento` : "Sesión de adiestramiento";
  return {
    uid: session.id,
    date: session.date,
    time: session.time,
    duration: session.duration,
    summary: título,
    location: session.place,
    description: [
      client ? `Guía: ${client.name}` : "",
      client?.phone ? `Tel: ${client.phone}` : "",
      session.notes || "",
    ]
      .filter(Boolean)
      .join("\n"),
    alarm: 60,
  };
}

export function followupEvent(followup, client) {
  return {
    uid: `f-${followup.id}`,
    date: followup.date,
    time: "09:00",
    duration: 15,
    summary: `Seguimiento${client ? `: ${client.dogName || client.name}` : ""}`,
    description: [followup.text, client?.phone ? `Tel: ${client.phone}` : ""].filter(Boolean).join("\n"),
    alarm: 0,
  };
}

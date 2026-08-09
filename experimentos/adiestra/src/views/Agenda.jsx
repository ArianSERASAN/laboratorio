import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Download } from "lucide-react";
import { Empty } from "../ui/components.jsx";
import { SessionRow } from "../ui/SessionRow.jsx";
import { clientOf } from "../lib/model.js";
import { MONTHS, DOW, monthMatrix, todayISO, parseISO, fmtFull, isoOf } from "../lib/dates.js";
import { cls } from "../lib/format.js";

export function Agenda({ data, act, openSession, newSessionOn }) {
  const [cur, setCur] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [sel, setSel] = useState(todayISO());

  const celdas = useMemo(() => monthMatrix(cur.y, cur.m), [cur]);
  const porDía = useMemo(() => {
    const map = {};
    data.sessions.forEach((s) => {
      (map[s.date] ||= []).push(s);
    });
    return map;
  }, [data.sessions]);

  const delDía = (porDía[sel] || []).slice().sort((a, b) => a.time.localeCompare(b.time));
  const futuras = data.sessions.filter((s) => s.date >= todayISO() && s.status !== "cancelada");
  const hoy = todayISO();
  const enMesActual = cur.y === parseISO(hoy).getFullYear() && cur.m === parseISO(hoy).getMonth();

  const mover = (delta) => {
    const d = new Date(cur.y, cur.m + delta, 1);
    setCur({ y: d.getFullYear(), m: d.getMonth() });
  };

  const irAHoy = () => {
    const d = new Date();
    setCur({ y: d.getFullYear(), m: d.getMonth() });
    setSel(isoOf(d));
  };

  return (
    <div className="view">
      <div className="mnav">
        <button type="button" className="icon-btn" onClick={() => mover(-1)} aria-label="Mes anterior">
          <ChevronLeft size={20} />
        </button>
        <h3>
          {MONTHS[cur.m]} {cur.y}
        </h3>
        <div className="mnav-right">
          {!enMesActual && (
            <button type="button" className="btn small ghost" onClick={irAHoy}>
              Hoy
            </button>
          )}
          <button type="button" className="icon-btn" onClick={() => mover(1)} aria-label="Mes siguiente">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid dow">
        {DOW.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid">
        {celdas.map((iso, i) => {
          if (!iso) return <span key={`v${i}`} className="cell void" />;
          const n = (porDía[iso] || []).filter((s) => s.status !== "cancelada").length;
          return (
            <button
              type="button"
              key={iso}
              className={cls("cell", iso === sel && "sel", iso === hoy && "today")}
              onClick={() => setSel(iso)}
              aria-label={fmtFull(iso)}
            >
              {parseISO(iso).getDate()}
              {n > 0 && (
                <span className="dots">
                  {Array.from({ length: Math.min(n, 3) }).map((_, k) => (
                    <i key={k} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="daybar">
        <h3 className="sec">{fmtFull(sel)}</h3>
        <button type="button" className="btn small" onClick={() => newSessionOn(sel)}>
          <Plus size={15} /> Sesión
        </button>
      </div>

      {delDía.length === 0 ? (
        <Empty title="Día libre." />
      ) : (
        delDía.map((s) => (
          <SessionRow
            key={s.id}
            session={s}
            client={clientOf(data, s.clientId)}
            onOpen={() => openSession(s)}
            onToggleDone={() => act.toggleDone(s)}
            onCalendar={() => act.exportSessions([s])}
          />
        ))
      )}

      {futuras.length > 0 && (
        <button type="button" className="btn ghost wide mt" onClick={() => act.exportSessions(futuras)}>
          <Download size={16} /> Exportar {futuras.length} sesiones al calendario
        </button>
      )}
      <p className="foot-note">
        Al abrir el archivo .ics, el móvil te ofrece añadirlo a tu calendario. Cada sesión lleva aviso una hora antes.
      </p>
    </div>
  );
}

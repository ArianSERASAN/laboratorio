import { Check, Calendar } from "lucide-react";
import { Empty } from "../ui/components.jsx";
import { SessionRow } from "../ui/SessionRow.jsx";
import { clientOf, totalDebt, incomeIn } from "../lib/model.js";
import { todayISO, fmtFull, fmtShort, daysFromToday, monthOf } from "../lib/dates.js";
import { money, moneyShort } from "../lib/format.js";

export function Today({ data, act, openSession, openClient, openFollow, goTo }) {
  const hoy = todayISO();
  const deHoy = data.sessions.filter((s) => s.date === hoy).sort((a, b) => a.time.localeCompare(b.time));
  const próximas = data.sessions
    .filter((s) => s.date > hoy && s.status === "programada")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3);
  const avisos = data.followups
    .filter((f) => !f.done && f.date <= hoy)
    .sort((a, b) => a.date.localeCompare(b.date));
  const pendiente = totalDebt(data);
  const cobradoMes = incomeIn(data, monthOf(hoy));
  const hechasSemana = data.sessions.filter(
    (s) => s.status === "hecha" && daysFromToday(s.date) > -7 && daysFromToday(s.date) <= 0
  ).length;

  return (
    <div className="view">
      <p className="datehead">{fmtFull(hoy)}</p>

      <div className="stats">
        <button type="button" className="stat" onClick={() => goTo("agenda")}>
          <span className="mono big">{deHoy.length}</span>
          <span className="lbl">sesiones hoy</span>
        </button>
        <div className="stat">
          <span className="mono big">{hechasSemana}</span>
          <span className="lbl">hechas 7 días</span>
        </div>
        <button type="button" className="stat warn" onClick={() => goTo("cobros")}>
          <span className="mono big">{moneyShort(pendiente)}</span>
          <span className="lbl">por cobrar</span>
        </button>
      </div>

      <h3 className="sec">Hoy</h3>
      {deHoy.length === 0 ? (
        <Empty title="Sin sesiones hoy. Buen día para papeleo." />
      ) : (
        deHoy.map((s) => (
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

      {avisos.length > 0 && (
        <>
          <h3 className="sec">
            Seguimientos <span className="badge">{avisos.length}</span>
          </h3>
          {avisos.map((f) => {
            const atraso = daysFromToday(f.date);
            return (
              <div key={f.id} className="frow">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => act.patchFollow(f.id, { done: true })}
                  aria-label="Marcar como hecho"
                >
                  <Check size={17} />
                </button>
                <button type="button" className="frow-txt" onClick={() => openFollow(f)}>
                  <strong>{clientOf(data, f.clientId)?.dogName || "—"}</strong>
                  <span className="sub">{f.text}</span>
                </button>
                {atraso < 0 && <span className="chip late mono">{Math.abs(atraso)} d</span>}
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => act.exportFollowups([f])}
                  aria-label="Añadir aviso al calendario"
                >
                  <Calendar size={16} />
                </button>
              </div>
            );
          })}
        </>
      )}

      {próximas.length > 0 && (
        <>
          <h3 className="sec">Próximas</h3>
          {próximas.map((s) => (
            <button type="button" key={s.id} className="nrow" onClick={() => openSession(s)}>
              <span className="mono">
                {fmtShort(s.date)} · {s.time}
              </span>
              <span>{clientOf(data, s.clientId)?.dogName}</span>
              <span className="sub2 push">{clientOf(data, s.clientId)?.name}</span>
            </button>
          ))}
        </>
      )}

      {cobradoMes > 0 && (
        <p className="foot-note">
          Cobrado este mes: <strong className="mono">{money(cobradoMes)}</strong>
        </p>
      )}
    </div>
  );
}

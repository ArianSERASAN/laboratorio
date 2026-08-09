import { useState } from "react";
import { ChevronLeft, Phone, MessageCircle, Pencil, Trash2, Plus, Check, Calendar } from "lucide-react";
import { Empty, Tag, Punch, Confirm } from "../ui/components.jsx";
import {
  clientOf, labelOfBono, debtOfBono, paidOfBono, usedOfBono, isSessionPaid, debtOfSession,
} from "../lib/model.js";
import { fmtShort } from "../lib/dates.js";
import { money, cls, telHref, waHref } from "../lib/format.js";

export function ClientDetail({ id, data, act, onBack, openSession, newSession, newBono, editBono, newFollow, editFollow, editClient }) {
  const [askDel, setAskDel] = useState(false);
  const [bonoDel, setBonoDel] = useState(null);

  const c = clientOf(data, id);
  if (!c) return null;

  const bonos = data.bonos.filter((b) => b.clientId === id);
  const sesiones = data.sessions
    .filter((s) => s.clientId === id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const avisos = data.followups.filter((f) => f.clientId === id && !f.done).sort((a, b) => a.date.localeCompare(b.date));
  const hechas = sesiones.filter((s) => s.status === "hecha");

  return (
    <div className="view">
      <div className="detail-head">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Volver">
          <ChevronLeft size={22} />
        </button>
        <button type="button" className="icon-btn" onClick={() => editClient(c)} aria-label="Editar ficha">
          <Pencil size={18} />
        </button>
      </div>

      <div className="hero">
        <Tag client={c} size={62} />
        <div>
          <h2 className="display">{c.dogName}</h2>
          <p className="sub">{[c.breed, c.age].filter(Boolean).join(" · ") || "Sin datos de raza"}</p>
        </div>
      </div>

      <div className="guide">
        <span>
          <strong>{c.name}</strong>
        </span>
        {c.phone && (
          <>
            <a className="chip link" href={telHref(c.phone)}>
              <Phone size={14} /> {c.phone}
            </a>
            <a className="chip link" href={waHref(c.phone)} target="_blank" rel="noreferrer">
              <MessageCircle size={14} /> WhatsApp
            </a>
          </>
        )}
      </div>

      {c.problem && (
        <div className="note-card">
          <span className="label">Motivo</span>
          <p>{c.problem}</p>
        </div>
      )}
      {c.notes && (
        <div className="note-card">
          <span className="label">Notas</span>
          <p>{c.notes}</p>
        </div>
      )}

      <div className="daybar">
        <h3 className="sec">Bonos y programas</h3>
        {bonos.length > 0 && (
          <button type="button" className="btn small" onClick={() => newBono(id)}>
            <Plus size={15} /> Bono
          </button>
        )}
      </div>
      {bonos.length === 0 && <Empty title="Sin bonos activos." action="Añadir bono" onAction={() => newBono(id)} />}
      {bonos.map((b) => {
        const usadas = usedOfBono(data, b.id);
        const deuda = debtOfBono(data, b);
        return (
          <div key={b.id} className="bono">
            <div className="bono-top">
              <button type="button" className="bono-name" onClick={() => editBono(b)}>
                <strong>{labelOfBono(b)}</strong>
                <Pencil size={13} />
              </button>
              <span className={cls("chip mono", deuda > 0.005 ? "warn" : "ok")}>
                {deuda > 0.005 ? `debe ${money(deuda)}` : "pagado"}
              </span>
            </div>
            <Punch total={Number(b.sessions)} used={usadas} />
            <div className="bono-bot">
              <span className="mono small">
                {Math.max(0, Number(b.sessions) - usadas)} restantes · {money(paidOfBono(data, b.id))} de {money(b.price)}
              </span>
              <div className="bono-acts">
                {deuda > 0.005 && (
                  <button type="button" className="btn small" onClick={() => act.openPay({ kind: "bono", ref: b })}>
                    Cobrar
                  </button>
                )}
                <button type="button" className="icon-btn" onClick={() => setBonoDel(b.id)} aria-label="Eliminar bono">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {bonoDel === b.id && (
              <Confirm
                text="Se elimina el bono y sus cobros. Las sesiones cargadas pasan a sueltas."
                onCancel={() => setBonoDel(null)}
                onConfirm={() => {
                  act.delBono(b.id);
                  setBonoDel(null);
                }}
              />
            )}
          </div>
        );
      })}

      <div className="daybar">
        <h3 className="sec">Seguimientos</h3>
        <button type="button" className="btn small" onClick={() => newFollow(id)}>
          <Plus size={15} /> Aviso
        </button>
      </div>
      {avisos.length === 0 ? (
        <p className="muted">Ninguno pendiente.</p>
      ) : (
        avisos.map((f) => (
          <div key={f.id} className="frow">
            <button
              type="button"
              className="icon-btn"
              onClick={() => act.patchFollow(f.id, { done: true })}
              aria-label="Marcar como hecho"
            >
              <Check size={17} />
            </button>
            <button type="button" className="frow-txt" onClick={() => editFollow(f)}>
              <strong className="mono small">{fmtShort(f.date)}</strong>
              <span className="sub">{f.text}</span>
            </button>
            <button type="button" className="icon-btn" onClick={() => act.exportFollowups([f])} aria-label="Añadir aviso al calendario">
              <Calendar size={16} />
            </button>
          </div>
        ))
      )}

      <div className="daybar">
        <h3 className="sec">
          Historial <span className="badge">{hechas.length}</span>
        </h3>
        <button type="button" className="btn small" onClick={() => newSession(id)}>
          <Plus size={15} /> Sesión
        </button>
      </div>
      {sesiones.length === 0 && <Empty title="Aún no hay sesiones." />}
      {sesiones.map((s) => {
        const pendiente = debtOfSession(data, s);
        return (
          <button type="button" key={s.id} className={cls("hrow", s.status)} onClick={() => openSession(s)}>
            <span className="mono small">{fmtShort(s.date)}</span>
            <span className="hrow-txt">
              <span className="sub2">
                {s.status === "hecha" ? "Hecha" : s.status === "cancelada" ? "Cancelada" : "Programada"} · {s.time}
                {!s.bonoId && Number(s.price) > 0 && (isSessionPaid(data, s) ? " · cobrada" : ` · debe ${money(pendiente)}`)}
              </span>
              <span className="ntext">{s.notes || "Sin notas de progreso"}</span>
            </span>
          </button>
        );
      })}

      {!askDel ? (
        <button type="button" className="btn ghost wide mt danger" onClick={() => setAskDel(true)}>
          Eliminar ficha
        </button>
      ) : (
        <Confirm
          text={`Se borra la ficha de ${c.dogName} con sus ${sesiones.length} sesiones, ${bonos.length} bonos y sus cobros. No hay vuelta atrás.`}
          onCancel={() => setAskDel(false)}
          onConfirm={() => {
            act.delClient(id);
            onBack();
          }}
        />
      )}
    </div>
  );
}

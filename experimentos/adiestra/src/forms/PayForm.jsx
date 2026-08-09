import { useState } from "react";
import { Sheet, Field } from "../ui/components.jsx";
import { uid, METHODS, debtOfBono, debtOfSession, labelOfBono } from "../lib/model.js";
import { todayISO, fmtShort } from "../lib/dates.js";
import { money } from "../lib/format.js";

export function PayForm({ data, target, onSave, onClose }) {
  const esBono = target.kind === "bono";
  const ref = target.ref;
  const pendiente = esBono ? debtOfBono(data, ref) : debtOfSession(data, ref);
  const [amount, setAmount] = useState(String(pendiente || ""));
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState(METHODS[0]);
  const importe = Number(amount) || 0;

  const guardar = () => {
    onSave({
      id: uid(),
      date,
      amount: importe,
      method,
      clientId: ref.clientId,
      ...(esBono ? { bonoId: ref.id } : { sessionId: ref.id }),
    });
    onClose();
  };

  return (
    <Sheet
      title="Registrar cobro"
      onClose={onClose}
      footer={
        <button type="button" className="btn primary wide" disabled={importe <= 0} onClick={guardar}>
          Registrar {money(importe)}
        </button>
      }
    >
      <p className="lead">
        {esBono ? labelOfBono(ref) : `Sesión del ${fmtShort(ref.date)}`} · pendiente <strong>{money(pendiente)}</strong>
      </p>

      <Field label="Importe cobrado">
        <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
      </Field>
      <div className="quick">
        <button type="button" className="btn ghost small" onClick={() => setAmount(String(pendiente))}>
          Todo
        </button>
        <button type="button" className="btn ghost small" onClick={() => setAmount(String(Math.round((pendiente / 2) * 100) / 100))}>
          La mitad
        </button>
      </div>

      <div className="row">
        <Field label="Fecha del cobro">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Método">
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {importe > pendiente + 0.005 && <p className="warn-line">Estás registrando más de lo pendiente.</p>}
    </Sheet>
  );
}

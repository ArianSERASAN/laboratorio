import { useState } from "react";
import { Sheet, Field, Segmented } from "../ui/components.jsx";
import { uid, paidOfBono } from "../lib/model.js";
import { todayISO } from "../lib/dates.js";
import { money } from "../lib/format.js";

export function BonoForm({ data, clientId, initial, onSave, onClose }) {
  const clients = data.clients;
  const [f, setF] = useState(
    initial || {
      id: uid(),
      clientId: clientId || clients[0]?.id || "",
      type: "bono",
      sessions: 5,
      price: "",
      date: todayISO(),
      label: "",
    }
  );
  const [cobroInicial, setCobroInicial] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const yaCobrado = initial ? paidOfBono(data, initial.id) : 0;
  const ok = f.clientId && Number(f.price) >= 0;

  return (
    <Sheet
      title={initial ? "Editar bono" : "Nuevo bono o programa"}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn primary wide"
          disabled={!ok}
          onClick={() => {
            onSave(
              {
                ...f,
                sessions: Math.max(1, Number(f.sessions) || 1),
                price: Number(f.price) || 0,
              },
              Number(cobroInicial) || 0
            );
            onClose();
          }}
        >
          Guardar
        </button>
      }
    >
      <Field label="Cliente">
        <select value={f.clientId} onChange={set("clientId")} disabled={Boolean(initial)}>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.dogName} · {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tipo">
        <Segmented
          value={f.type}
          onChange={(v) => setF({ ...f, type: v })}
          options={[["bono", "Bono"], ["programa", "Programa"]]}
        />
      </Field>

      <Field label="Nombre" hint="Cómo lo llamas tú: “Bono 5 sesiones”, “Programa cachorro 8 semanas”…">
        <input
          value={f.label}
          onChange={set("label")}
          placeholder={f.type === "programa" ? "Programa cachorro" : "Bono 5 sesiones"}
        />
      </Field>

      <div className="row">
        <Field label="Nº de sesiones">
          <input type="number" min="1" value={f.sessions} onChange={set("sessions")} inputMode="numeric" />
        </Field>
        <Field label="Precio total">
          <input type="number" min="0" step="0.01" value={f.price} onChange={set("price")} inputMode="decimal" placeholder="250" />
        </Field>
      </div>

      <div className="row">
        {initial ? (
          <Field label="Ya cobrado">
            <input value={money(yaCobrado)} readOnly />
          </Field>
        ) : (
          <Field label="Cobrado al firmar" hint="Se anota como cobro con la fecha de alta.">
            <input
              type="number"
              min="0"
              step="0.01"
              value={cobroInicial}
              onChange={(e) => setCobroInicial(e.target.value)}
              inputMode="decimal"
              placeholder="0"
            />
          </Field>
        )}
        <Field label="Fecha de alta">
          <input type="date" value={f.date} onChange={set("date")} />
        </Field>
      </div>

      {initial && <p className="hint">Los cobros se editan desde la pestaña Cobros.</p>}
    </Sheet>
  );
}

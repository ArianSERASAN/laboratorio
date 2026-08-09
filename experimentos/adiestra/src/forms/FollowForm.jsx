import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Sheet, Field } from "../ui/components.jsx";
import { uid } from "../lib/model.js";
import { todayISO, addDays } from "../lib/dates.js";

const ATAJOS = [
  ["En 3 días", 3],
  ["En 1 semana", 7],
  ["En 15 días", 15],
  ["En 1 mes", 30],
];

export function FollowForm({ data, clientId, initial, onSave, onDelete, onClose }) {
  const [f, setF] = useState(
    initial || { id: uid(), clientId: clientId || data.clients[0]?.id || "", date: addDays(todayISO(), 7), text: "", done: false }
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Sheet
      title={initial ? "Recordatorio" : "Nuevo recordatorio"}
      onClose={onClose}
      footer={
        <div className="foot-row">
          {initial && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                onDelete(f.id);
                onClose();
              }}
              aria-label="Eliminar recordatorio"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            type="button"
            className="btn primary wide"
            disabled={!f.text.trim()}
            onClick={() => {
              onSave(f);
              onClose();
            }}
          >
            Guardar recordatorio
          </button>
        </div>
      }
    >
      <Field label="Cliente">
        <select value={f.clientId} onChange={set("clientId")}>
          {data.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.dogName} · {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Fecha del aviso">
        <input type="date" value={f.date} onChange={set("date")} />
      </Field>
      <div className="quick wrap">
        {ATAJOS.map(([label, dias]) => (
          <button type="button" key={dias} className="btn small ghost" onClick={() => setF({ ...f, date: addDays(todayISO(), dias) })}>
            {label}
          </button>
        ))}
      </div>

      <Field label="Qué tengo que hacer">
        <textarea rows={3} value={f.text} onChange={set("text")} placeholder="Llamar para ver cómo va la separación gradual" />
      </Field>
    </Sheet>
  );
}

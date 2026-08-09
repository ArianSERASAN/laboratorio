import { useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { Sheet, Field, Segmented, Confirm } from "../ui/components.jsx";
import { uid, usedOfBono, labelOfBono, isSessionPaid } from "../lib/model.js";
import { todayISO } from "../lib/dates.js";

const REPEATS = [
  ["no", "Una vez"],
  ["7", "Cada semana"],
  ["14", "Cada 15 días"],
];

export function SessionForm({ data, initial, presetClient, presetDate, plantilla, onSave, onDelete, onClose }) {
  const clients = data.clients;
  const porDefecto = data.settings?.defaults || {};
  const [f, setF] = useState(
    initial ||
      // `plantilla` llega al repetir la última sesión de un cliente.
      plantilla || {
        id: uid(),
        clientId: presetClient || clients[0]?.id || "",
        bonoId: "",
        date: presetDate || todayISO(),
        time: "10:00",
        duration: porDefecto.duration || 60,
        place: porDefecto.place || "",
        price: porDefecto.price ?? "",
        status: "programada",
        notes: "",
      }
  );
  const [cobrada, setCobrada] = useState(initial ? isSessionPaid(data, initial) : false);
  const [repeat, setRepeat] = useState("no");
  const [veces, setVeces] = useState(4);
  const [askDel, setAskDel] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const bonosDelCliente = data.bonos.filter((b) => b.clientId === f.clientId);
  const bonoElegido = bonosDelCliente.find((b) => b.id === f.bonoId);
  const restantes = bonoElegido ? Number(bonoElegido.sessions) - usedOfBono(data, bonoElegido.id, f.id) : 0;
  const nuevas = repeat === "no" ? 1 : Math.max(1, Number(veces) || 1);
  const sePasa = Boolean(bonoElegido) && nuevas > restantes;
  const ok = f.clientId && f.date && f.time;

  const guardar = () => {
    onSave(
      { ...f, duration: Number(f.duration) || 60, price: f.bonoId ? "" : f.price },
      {
        repeat: repeat === "no" ? null : { step: Number(repeat), count: nuevas },
        cobrada: !f.bonoId && nuevas === 1 && cobrada,
      }
    );
    onClose();
  };

  return (
    <Sheet
      title={initial ? "Sesión" : "Nueva sesión"}
      onClose={onClose}
      footer={
        <div className="foot-row">
          {initial && (
            <button type="button" className="btn ghost" onClick={() => setAskDel(true)} aria-label="Eliminar sesión">
              <Trash2 size={18} />
            </button>
          )}
          <button type="button" className="btn primary wide" disabled={!ok} onClick={guardar}>
            {nuevas > 1 ? `Guardar ${nuevas} sesiones` : "Guardar sesión"}
          </button>
        </div>
      }
    >
      {askDel && (
        <Confirm
          text="Se elimina esta sesión y sus notas de progreso."
          onCancel={() => setAskDel(false)}
          onConfirm={() => {
            onDelete(f.id);
            onClose();
          }}
        />
      )}

      <Field label="Cliente">
        <select value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value, bonoId: "" })}>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.dogName} · {c.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="row">
        <Field label="Fecha">
          <input type="date" value={f.date} onChange={set("date")} />
        </Field>
        <Field label="Hora">
          <input type="time" value={f.time} onChange={set("time")} />
        </Field>
      </div>

      <div className="row">
        <Field label="Duración (min)">
          <input type="number" min="15" step="15" value={f.duration} onChange={set("duration")} inputMode="numeric" />
        </Field>
        <Field label="Lugar">
          <input value={f.place} onChange={set("place")} placeholder="Parque del Oeste" />
        </Field>
      </div>

      {!initial && (
        <>
          <Field label="Repetir">
            <Segmented value={repeat} onChange={setRepeat} options={REPEATS} />
          </Field>
          {repeat !== "no" && (
            <Field label="Número de sesiones" hint="Se crean todas de golpe, con los mismos datos.">
              <input type="number" min="2" max="24" value={veces} onChange={(e) => setVeces(e.target.value)} inputMode="numeric" />
            </Field>
          )}
        </>
      )}

      <Field label="Cargar a">
        <select value={f.bonoId} onChange={set("bonoId")}>
          <option value="">Sesión suelta</option>
          {bonosDelCliente.map((b) => (
            <option key={b.id} value={b.id}>
              {labelOfBono(b)} · quedan {Math.max(0, Number(b.sessions) - usedOfBono(data, b.id, f.id))} de {b.sessions}
            </option>
          ))}
        </select>
      </Field>

      {sePasa && (
        <p className="warn-line">
          <TriangleAlert size={15} /> El bono se queda sin sesiones: quedan {Math.max(0, restantes)} y vas a cargar {nuevas}.
        </p>
      )}

      {!f.bonoId && (
        <div className="row">
          <Field label={nuevas > 1 ? "Precio por sesión" : "Precio de la sesión"}>
            <input type="number" min="0" step="0.01" value={f.price} onChange={set("price")} inputMode="decimal" placeholder="45" />
          </Field>
          {nuevas === 1 && (
            <Field label="¿Cobrada?">
              <Segmented
                value={cobrada ? "si" : "no"}
                onChange={(v) => setCobrada(v === "si")}
                options={[["no", "Pendiente"], ["si", "Cobrada"]]}
              />
            </Field>
          )}
        </div>
      )}

      <Field label="Estado">
        <Segmented
          value={f.status}
          onChange={(v) => setF({ ...f, status: v })}
          options={[["programada", "Programada"], ["hecha", "Hecha"], ["cancelada", "Cancelada"]]}
        />
      </Field>

      <Field label="Notas de progreso" hint="Qué se ha trabajado, cómo respondió el perro, deberes para casa.">
        <textarea
          rows={4}
          value={f.notes}
          onChange={set("notes")}
          placeholder="Trabajo de llamada con distracción media. Buena respuesta a 5 m…"
        />
      </Field>
    </Sheet>
  );
}

import { useState } from "react";
import { Sheet, Field } from "../ui/components.jsx";
import { TAGS, uid } from "../lib/model.js";
import { cls } from "../lib/format.js";

export function ClientForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(
    initial || {
      id: uid(),
      name: "",
      phone: "",
      dogName: "",
      breed: "",
      age: "",
      problem: "",
      notes: "",
      color: TAGS[Math.floor(Math.random() * TAGS.length)],
    }
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ok = f.name.trim() && f.dogName.trim();

  return (
    <Sheet
      title={initial ? "Editar ficha" : "Nuevo cliente"}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn primary wide"
          disabled={!ok}
          onClick={() => {
            onSave(f);
            onClose();
          }}
        >
          Guardar ficha
        </button>
      }
    >
      <Field label="Nombre del guía">
        <input value={f.name} onChange={set("name")} placeholder="Marta Ruiz" autoComplete="name" />
      </Field>
      <Field label="Teléfono">
        <input value={f.phone} onChange={set("phone")} inputMode="tel" placeholder="600 000 000" autoComplete="tel" />
      </Field>
      <div className="row">
        <Field label="Nombre del perro">
          <input value={f.dogName} onChange={set("dogName")} placeholder="Luna" />
        </Field>
        <Field label="Edad">
          <input value={f.age} onChange={set("age")} placeholder="2 años" />
        </Field>
      </div>
      <Field label="Raza">
        <input value={f.breed} onChange={set("breed")} placeholder="Border collie" />
      </Field>
      <Field label="Motivo de consulta">
        <textarea rows={2} value={f.problem} onChange={set("problem")} placeholder="Reactividad con otros perros en la calle" />
      </Field>
      <Field label="Notas generales">
        <textarea rows={2} value={f.notes} onChange={set("notes")} placeholder="Vive en piso, dos niños, come pienso…" />
      </Field>
      <Field label="Color de la chapa">
        <div className="colors">
          {TAGS.map((c) => (
            <button
              type="button"
              key={c}
              className={cls("swatch", f.color === c && "on")}
              style={{ background: c }}
              onClick={() => setF({ ...f, color: c })}
              aria-label={`Color ${c}`}
              aria-pressed={f.color === c}
            />
          ))}
        </div>
      </Field>
    </Sheet>
  );
}

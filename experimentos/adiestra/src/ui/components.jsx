import { cloneElement, isValidElement, useEffect, useId } from "react";
import { X } from "lucide-react";
import { cls } from "../lib/format.js";

/** Chapa redonda con la inicial del perro. */
export function Tag({ client, size = 40 }) {
  const letter = (client?.dogName || client?.name || "?").trim().charAt(0).toUpperCase();
  return (
    <span
      className="tag"
      style={{ background: client?.color || "#28564A", width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

/** Tarjeta de sesiones estilo tarjeta de fidelidad. */
export function Punch({ total, used }) {
  if (total > 12) return <span className="mono small">{used}/{total} sesiones</span>;
  return (
    <span className="punch" aria-label={`${used} de ${total} sesiones usadas`}>
      {Array.from({ length: total }).map((_, i) => (
        <i key={i} className={i < used ? "p on" : "p"} />
      ))}
    </span>
  );
}

export function Sheet({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

/** Etiqueta + control. Enlaza el `for` con el control cuando es uno solo. */
export function Field({ label, hint, children }) {
  const id = useId();
  const child = isValidElement(children) && !children.props.id ? cloneElement(children, { id }) : children;
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      {child}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Segmented({ value, onChange, options, id }) {
  return (
    <div className="seg" id={id} role="group">
      {options.map(([v, label]) => (
        <button
          type="button"
          key={v}
          className={cls("seg-b", value === v && "on")}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ title, action, onAction }) {
  return (
    <div className="empty">
      <p>{title}</p>
      {action && (
        <button type="button" className="btn primary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

/** Confirmación en línea para lo que no tiene vuelta atrás. */
export function Confirm({ text, confirmLabel = "Sí, eliminar", onConfirm, onCancel }) {
  return (
    <div className="note-card danger-card">
      <p>{text}</p>
      <div className="quick">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="btn danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

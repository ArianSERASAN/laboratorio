import { Calendar, Check } from "lucide-react";
import { Tag } from "./components.jsx";
import { cls } from "../lib/format.js";

export function SessionRow({ session: s, client, onOpen, onToggleDone, onCalendar }) {
  return (
    <div className={cls("srow", s.status)}>
      <button type="button" className="srow-main" onClick={onOpen}>
        <span className="mono time">{s.time}</span>
        <span className="srow-txt">
          <strong>{client ? client.dogName : "—"}</strong>
          <span className="sub">
            {client?.name}
            {s.place ? ` · ${s.place}` : ""}
            {s.status === "cancelada" ? " · cancelada" : ""}
          </span>
        </span>
        {client && <Tag client={client} size={30} />}
      </button>
      <div className="srow-acts">
        <button type="button" className="icon-btn" onClick={onCalendar} aria-label="Añadir al calendario del móvil">
          <Calendar size={17} />
        </button>
        <button
          type="button"
          className={cls("icon-btn", s.status === "hecha" && "done")}
          onClick={onToggleDone}
          aria-label={s.status === "hecha" ? "Marcar como programada" : "Marcar como hecha"}
        >
          <Check size={17} />
        </button>
      </div>
    </div>
  );
}

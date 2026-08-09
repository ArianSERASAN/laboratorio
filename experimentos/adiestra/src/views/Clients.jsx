import { useState } from "react";
import { Search } from "lucide-react";
import { Empty, Tag } from "../ui/components.jsx";
import { clientDebt } from "../lib/model.js";
import { todayISO, fmtShort } from "../lib/dates.js";
import { money, cls } from "../lib/format.js";

const FILTROS = [
  ["todos", "Todos"],
  ["deuda", "Con deuda"],
  ["sin", "Sin próxima"],
];

export function Clients({ data, openClient, onNew }) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const próximaDe = (id) =>
    data.sessions
      .filter((s) => s.clientId === id && s.date >= todayISO() && s.status === "programada")
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];

  const texto = q.trim().toLowerCase();
  const lista = data.clients
    .map((c) => ({ c, deuda: clientDebt(data, c.id), próxima: próximaDe(c.id) }))
    .filter(({ c }) => {
      if (!texto) return true;
      const notas = data.sessions
        .filter((s) => s.clientId === c.id)
        .map((s) => s.notes || "")
        .join(" ");
      return `${c.name} ${c.dogName} ${c.breed} ${c.problem} ${c.notes} ${notas}`.toLowerCase().includes(texto);
    })
    .filter(({ deuda, próxima }) => {
      if (filtro === "deuda") return deuda > 0.005;
      if (filtro === "sin") return !próxima;
      return true;
    })
    .sort((a, b) => a.c.dogName.localeCompare(b.c.dogName, "es"));

  return (
    <div className="view">
      <div className="search">
        <Search size={17} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar perro, guía, problema o nota"
          type="search"
          enterKeyHint="search"
        />
      </div>

      {data.clients.length > 0 && (
        <div className="chips">
          {FILTROS.map(([v, label]) => (
            <button type="button" key={v} className={cls("chip tap", filtro === v && "on")} onClick={() => setFiltro(v)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {data.clients.length === 0 && <Empty title="Todavía no hay fichas." action="Añadir el primer cliente" onAction={onNew} />}
      {data.clients.length > 0 && lista.length === 0 && <Empty title="Nada que coincida con la búsqueda." />}

      {lista.map(({ c, deuda, próxima }) => (
        <button type="button" key={c.id} className="crow" onClick={() => openClient(c.id)}>
          <Tag client={c} />
          <span className="crow-txt">
            <strong>{c.dogName}</strong>
            <span className="sub">
              {c.name}
              {c.breed ? ` · ${c.breed}` : ""}
            </span>
            <span className="sub2">
              {próxima ? `Próxima: ${fmtShort(próxima.date)} ${próxima.time}` : "Sin sesión programada"}
            </span>
          </span>
          {deuda > 0.005 && <span className="chip warn mono">{money(deuda)}</span>}
        </button>
      ))}
    </div>
  );
}

import { useState } from "react";
import { Trash2, FileDown } from "lucide-react";
import { Empty, Tag, Confirm } from "../ui/components.jsx";
import { clientOf, labelOfBono, pendingList, totalDebt, incomeIn, totalIncome } from "../lib/model.js";
import { todayISO, monthOf, fmtShort, fmtMonth, pad } from "../lib/dates.js";
import { money, cls } from "../lib/format.js";

/** Los seis últimos meses, del más reciente al más antiguo. */
function últimosMeses(n = 6) {
  const hoy = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });
}

export function Cobros({ data, act, openClient }) {
  const [pagoDel, setPagoDel] = useState(null);

  const pendientes = pendingList(data);
  const total = totalDebt(data);
  const meses = últimosMeses().map((ym) => ({ ym, importe: incomeIn(data, ym) }));
  const máximo = Math.max(...meses.map((m) => m.importe), 1);
  const cobros = data.payments.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 12);

  const concepto = (p) => {
    if (p.bonoId) {
      const b = data.bonos.find((x) => x.id === p.bonoId);
      return b ? labelOfBono(b) : "Bono eliminado";
    }
    const s = data.sessions.find((x) => x.id === p.sessionId);
    return s ? `Sesión ${fmtShort(s.date)}` : "Sesión suelta";
  };

  return (
    <div className="view">
      <div className="total">
        <span className="lbl">Pendiente de cobro</span>
        <span className="mono huge">{money(total)}</span>
        <span className="lbl">
          Este mes: {money(incomeIn(data, monthOf(todayISO())))} · Total: {money(totalIncome(data))}
        </span>
      </div>

      <h3 className="sec">Pendiente</h3>
      {pendientes.length === 0 && <Empty title="Nada pendiente. Todo cobrado." />}
      {pendientes.map((x) => {
        const c = clientOf(data, x.ref.clientId);
        return (
          <div key={x.ref.id} className="prow">
            <button type="button" className="prow-main" onClick={() => c && openClient(c.id)}>
              {c && <Tag client={c} size={34} />}
              <span className="crow-txt">
                <strong>{c?.dogName || "—"}</strong>
                <span className="sub">{x.kind === "bono" ? labelOfBono(x.ref) : `Sesión ${fmtShort(x.ref.date)}`}</span>
              </span>
              <span className="mono amount">{money(x.amount)}</span>
            </button>
            <button type="button" className="btn small" onClick={() => act.openPay(x)}>
              Cobrar
            </button>
          </div>
        );
      })}

      <h3 className="sec">Ingresos por mes</h3>
      <div className="months">
        {meses.map(({ ym, importe }) => (
          <div key={ym} className="mrow">
            <span className="mlbl">{fmtMonth(ym)}</span>
            <span className="mbar">
              <i style={{ width: `${Math.round((importe / máximo) * 100)}%` }} />
            </span>
            <span className="mono small mamount">{money(importe)}</span>
          </div>
        ))}
      </div>

      {data.payments.length > 0 && (
        <button type="button" className="btn ghost wide" onClick={act.exportPayments}>
          <FileDown size={16} /> Exportar todos los cobros (CSV)
        </button>
      )}

      {cobros.length > 0 && (
        <>
          <h3 className="sec">Últimos cobros</h3>
          {cobros.map((p) => (
            <div key={p.id} className={cls("prow", pagoDel === p.id && "open")}>
              <span className="prow-main static">
                <span className="mono small w52">{fmtShort(p.date)}</span>
                <span className="crow-txt">
                  <strong>{clientOf(data, p.clientId)?.dogName || "—"}</strong>
                  <span className="sub">
                    {concepto(p)}
                    {p.method ? ` · ${p.method}` : ""}
                  </span>
                </span>
                <span className="mono amount ok">{money(p.amount)}</span>
              </span>
              <button type="button" className="icon-btn" onClick={() => setPagoDel(p.id)} aria-label="Deshacer cobro">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {pagoDel && (
            <Confirm
              text="Se borra ese cobro y el importe vuelve a quedar pendiente."
              confirmLabel="Deshacer cobro"
              onCancel={() => setPagoDel(null)}
              onConfirm={() => {
                act.delPayment(pagoDel);
                setPagoDel(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

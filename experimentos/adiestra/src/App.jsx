import { useCallback, useEffect, useRef, useState } from "react";
import { Calendar, Users, Wallet, Plus, Bell, Clock, Sun, Settings } from "lucide-react";

import { Today } from "./views/Today.jsx";
import { Agenda } from "./views/Agenda.jsx";
import { Clients } from "./views/Clients.jsx";
import { ClientDetail } from "./views/ClientDetail.jsx";
import { Cobros } from "./views/Cobros.jsx";
import { Ajustes } from "./views/Ajustes.jsx";

import { ClientForm } from "./forms/ClientForm.jsx";
import { BonoForm } from "./forms/BonoForm.jsx";
import { SessionForm } from "./forms/SessionForm.jsx";
import { FollowForm } from "./forms/FollowForm.jsx";
import { PayForm } from "./forms/PayForm.jsx";

import { EMPTY, normalize, uid, clientOf } from "./lib/model.js";
import { loadState, saveState, saveStateSync, snapshotOncePerDay, requestPersistence } from "./lib/storage.js";
import { buildICS, sessionEvent, followupEvent } from "./lib/ics.js";
import { downloadText } from "./lib/files.js";
import { mergeData } from "./lib/backup.js";
import { todayISO, addDays, nowStamp } from "./lib/dates.js";
import { cls } from "./lib/format.js";

const TABS = [
  ["hoy", Sun, "Hoy"],
  ["agenda", Calendar, "Agenda"],
  ["clientes", Users, "Clientes"],
  ["cobros", Wallet, "Cobros"],
];
const TITLES = { hoy: "Hoy", agenda: "Agenda", clientes: "Clientes", cobros: "Cobros" };

const esStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

export default function App() {
  const [data, setData] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("hoy");
  const [clientOpen, setClientOpen] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [fab, setFab] = useState(false);
  const [toast, setToast] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);

  const latest = useRef(data);
  const pendingSave = useRef(false);
  const saveTimer = useRef(null);
  latest.current = data;

  /* ------------------------------ carga ------------------------------ */
  useEffect(() => {
    let vivo = true;
    (async () => {
      const guardado = await loadState();
      const limpio = normalize(guardado);
      if (!vivo) return;
      setData(limpio);
      setLoaded(true);
      if (guardado) snapshotOncePerDay(limpio, todayISO(), nowStamp());
      if (esStandalone()) requestPersistence();
    })();
    return () => {
      vivo = false;
    };
  }, []);

  /* --------------------------- guardado ----------------------------- */
  const flush = useCallback(() => {
    if (!pendingSave.current) return;
    pendingSave.current = false;
    clearTimeout(saveTimer.current);
    saveState(latest.current).catch(() => setToast({ text: "No se ha podido guardar el último cambio." }));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    pendingSave.current = true;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, 250);
    return () => clearTimeout(saveTimer.current);
  }, [data, loaded, flush]);

  // El sistema puede cerrar la app sin avisar: al ocultarse se guarda ya,
  // y de forma síncrona, que es lo único fiable en ese momento.
  useEffect(() => {
    if (!loaded) return;
    const alOcultar = () => {
      if (document.visibilityState === "hidden") {
        saveStateSync(latest.current);
        flush();
      }
    };
    const alSalir = () => saveStateSync(latest.current);
    document.addEventListener("visibilitychange", alOcultar);
    window.addEventListener("pagehide", alSalir);
    return () => {
      document.removeEventListener("visibilitychange", alOcultar);
      window.removeEventListener("pagehide", alSalir);
    };
  }, [loaded, flush]);

  /* ------------------------------ tema ------------------------------ */
  useEffect(() => {
    const tema = data.settings?.theme || "auto";
    document.documentElement.setAttribute("data-theme", tema);
  }, [data.settings?.theme]);

  /* ----------------------- instalación y avisos ---------------------- */
  useEffect(() => {
    const alPoderInstalar = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const alActualizar = () =>
      setToast({
        text: "Hay una versión nueva.",
        actionLabel: "Actualizar",
        onAction: () => window.location.reload(),
      });
    window.addEventListener("beforeinstallprompt", alPoderInstalar);
    window.addEventListener("sw-update", alActualizar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alPoderInstalar);
      window.removeEventListener("sw-update", alActualizar);
    };
  }, []);

  useEffect(() => {
    if (!toast || toast.actionLabel) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------------------------- acciones ---------------------------- */
  const upsert = (list, item) =>
    list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

  const act = {
    toast: (text) => setToast({ text }),

    saveClient: (c) => setData((d) => ({ ...d, clients: upsert(d.clients, c) })),

    delClient: (id) =>
      setData((d) => {
        const sesiones = d.sessions.filter((s) => s.clientId === id).map((s) => s.id);
        return {
          ...d,
          clients: d.clients.filter((c) => c.id !== id),
          bonos: d.bonos.filter((b) => b.clientId !== id),
          sessions: d.sessions.filter((s) => s.clientId !== id),
          followups: d.followups.filter((f) => f.clientId !== id),
          payments: d.payments.filter((p) => p.clientId !== id && !sesiones.includes(p.sessionId)),
        };
      }),

    saveBono: (b, cobroInicial) =>
      setData((d) => {
        const bonos = upsert(d.bonos, b);
        const nuevo = !d.bonos.some((x) => x.id === b.id);
        const payments =
          nuevo && cobroInicial > 0
            ? [...d.payments, { id: uid(), date: b.date, amount: cobroInicial, clientId: b.clientId, bonoId: b.id, method: "" }]
            : d.payments;
        return { ...d, bonos, payments };
      }),

    delBono: (id) =>
      setData((d) => ({
        ...d,
        bonos: d.bonos.filter((b) => b.id !== id),
        sessions: d.sessions.map((s) => (s.bonoId === id ? { ...s, bonoId: "" } : s)),
        payments: d.payments.filter((p) => p.bonoId !== id),
      })),

    saveSession: (s, { repeat, cobrada } = {}) =>
      setData((d) => {
        const existe = d.sessions.some((x) => x.id === s.id);
        let sessions;
        if (existe || !repeat) {
          sessions = upsert(d.sessions, s);
        } else {
          const copias = Array.from({ length: repeat.count }, (_, i) => ({
            ...s,
            id: i === 0 ? s.id : uid(),
            date: addDays(s.date, i * repeat.step),
          }));
          sessions = [...d.sessions, ...copias];
        }
        return { ...d, sessions, payments: reconcileSessionPayment(d.payments, s, cobrada) };
      }),

    patchSession: (id, patch) =>
      setData((d) => ({ ...d, sessions: d.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),

    toggleDone: (s) => act.patchSession(s.id, { status: s.status === "hecha" ? "programada" : "hecha" }),

    delSession: (id) =>
      setData((d) => ({
        ...d,
        sessions: d.sessions.filter((s) => s.id !== id),
        payments: d.payments.filter((p) => p.sessionId !== id),
      })),

    saveFollow: (f) => setData((d) => ({ ...d, followups: upsert(d.followups, f) })),
    patchFollow: (id, patch) =>
      setData((d) => ({ ...d, followups: d.followups.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
    delFollow: (id) => setData((d) => ({ ...d, followups: d.followups.filter((f) => f.id !== id) })),

    addPayment: (p) => setData((d) => ({ ...d, payments: [...d.payments, p] })),
    delPayment: (id) => setData((d) => ({ ...d, payments: d.payments.filter((p) => p.id !== id) })),
    openPay: (target) => setSheet({ type: "pay", target }),

    patchSettings: (patch) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

    replaceAll: (nuevo) => setData(normalize(nuevo)),
    mergeIn: (entrante) => {
      const { merged, added } = mergeData(latest.current, entrante);
      setData(merged);
      return Object.values(added).reduce((a, n) => a + n, 0);
    },
    wipe: () => setData({ ...EMPTY, settings: latest.current.settings }),

    exportSessions: (lista) => {
      const eventos = lista.map((s) => sessionEvent(s, clientOf(latest.current, s.clientId)));
      const nombre = lista.length === 1 ? `sesion-${lista[0].date}.ics` : "agenda-adiestramiento.ics";
      if (!downloadText(nombre, buildICS(eventos), "text/calendar")) setToast({ text: "No se ha podido crear el archivo." });
    },
    exportFollowups: (lista) => {
      const eventos = lista.map((f) => followupEvent(f, clientOf(latest.current, f.clientId)));
      if (!downloadText("recordatorio.ics", buildICS(eventos), "text/calendar")) {
        setToast({ text: "No se ha podido crear el archivo." });
      }
    },
  };

  /* ----------------------- atajos de la pantalla --------------------- */
  const needClient = (fn) => (data.clients.length === 0 ? setSheet({ type: "client" }) : fn());
  const openSession = (s) => setSheet({ type: "session", session: s });
  const openClient = (id) => {
    setClientOpen(id);
    setTab("clientes");
  };

  useEffect(() => {
    if (!loaded) return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    const nuevo = params.get("nuevo");
    if (t && TITLES[t]) setTab(t);
    if (nuevo === "cliente") setSheet({ type: "client" });
    if (nuevo === "sesion" && data.clients.length > 0) setSheet({ type: "session" });
    if (t || nuevo) window.history.replaceState({}, "", window.location.pathname);
    // Sólo al arrancar: los parámetros llegan del acceso directo del sistema.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (!loaded) {
    return (
      <div className="app">
        <div className="view">
          <p className="muted">Abriendo el cuaderno…</p>
        </div>
      </div>
    );
  }

  const avisosDebidos = data.followups.filter((f) => !f.done && f.date <= todayISO()).length;

  return (
    <div className="app">
      <header className="top">
        <div className="top-row">
          <span className="brand">Cuaderno de campo</span>
          <button type="button" className="icon-btn on-strong" onClick={() => setSheet({ type: "ajustes" })} aria-label="Ajustes">
            <Settings size={19} />
          </button>
        </div>
        <h1 className="display">{clientOpen && tab === "clientes" ? "Ficha" : TITLES[tab]}</h1>
      </header>

      <main className="scroll">
        {tab === "hoy" && (
          <Today
            data={data}
            act={act}
            openSession={openSession}
            openClient={openClient}
            openFollow={(f) => setSheet({ type: "follow", follow: f })}
            goTo={setTab}
          />
        )}
        {tab === "agenda" && (
          <Agenda
            data={data}
            act={act}
            openSession={openSession}
            newSessionOn={(d) => needClient(() => setSheet({ type: "session", presetDate: d }))}
          />
        )}
        {tab === "clientes" && !clientOpen && (
          <Clients data={data} openClient={setClientOpen} onNew={() => setSheet({ type: "client" })} />
        )}
        {tab === "clientes" && clientOpen && (
          <ClientDetail
            id={clientOpen}
            data={data}
            act={act}
            onBack={() => setClientOpen(null)}
            openSession={openSession}
            newSession={(id) => setSheet({ type: "session", presetClient: id })}
            newBono={(id) => setSheet({ type: "bono", presetClient: id })}
            editBono={(b) => setSheet({ type: "bono", bono: b })}
            newFollow={(id) => setSheet({ type: "follow", presetClient: id })}
            editFollow={(f) => setSheet({ type: "follow", follow: f })}
            editClient={(c) => setSheet({ type: "client", client: c })}
          />
        )}
        {tab === "cobros" && <Cobros data={data} act={act} openClient={openClient} />}
      </main>

      {fab && <div className="fab-scrim" onClick={() => setFab(false)} />}
      <div className={cls("fab-wrap", fab && "open")}>
        {fab && (
          <div className="fab-menu">
            <button type="button" onClick={() => { setFab(false); needClient(() => setSheet({ type: "session" })); }}>
              <Clock size={16} /> Sesión
            </button>
            <button type="button" onClick={() => { setFab(false); needClient(() => setSheet({ type: "bono" })); }}>
              <Wallet size={16} /> Bono
            </button>
            <button type="button" onClick={() => { setFab(false); needClient(() => setSheet({ type: "follow" })); }}>
              <Bell size={16} /> Recordatorio
            </button>
            <button type="button" onClick={() => { setFab(false); setSheet({ type: "client" }); }}>
              <Users size={16} /> Cliente
            </button>
          </div>
        )}
        <button type="button" className="fab" onClick={() => setFab(!fab)} aria-label="Añadir" aria-expanded={fab}>
          <Plus size={26} />
        </button>
      </div>

      <nav className="tabs">
        {TABS.map(([k, Icon, label]) => (
          <button
            type="button"
            key={k}
            className={cls("tab", tab === k && "on")}
            onClick={() => {
              setTab(k);
              if (k !== "clientes") setClientOpen(null);
            }}
          >
            <span className="tab-ico">
              <Icon size={20} />
              {k === "hoy" && avisosDebidos > 0 && <i className="dot" />}
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.actionLabel && (
            <button type="button" className="toast-act" onClick={toast.onAction}>
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}

      {sheet?.type === "client" && (
        <ClientForm initial={sheet.client} onSave={act.saveClient} onClose={() => setSheet(null)} />
      )}
      {sheet?.type === "bono" && (
        <BonoForm
          data={data}
          clientId={sheet.presetClient}
          initial={sheet.bono}
          onSave={act.saveBono}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === "follow" && (
        <FollowForm
          data={data}
          clientId={sheet.presetClient}
          initial={sheet.follow}
          onSave={act.saveFollow}
          onDelete={act.delFollow}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === "pay" && (
        <PayForm data={data} target={sheet.target} onSave={act.addPayment} onClose={() => setSheet(null)} />
      )}
      {sheet?.type === "session" && (
        <SessionForm
          data={data}
          initial={sheet.session}
          presetClient={sheet.presetClient}
          presetDate={sheet.presetDate}
          onSave={act.saveSession}
          onDelete={act.delSession}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === "ajustes" && (
        <Ajustes
          data={data}
          act={act}
          onClose={() => setSheet(null)}
          installPrompt={installPrompt}
          standalone={esStandalone()}
        />
      )}
    </div>
  );
}

/**
 * Ajusta los cobros de una sesión suelta al marcarla como cobrada o pendiente.
 * Un cobro parcial registrado a mano no se toca nunca.
 */
function reconcileSessionPayment(payments, session, cobrada) {
  const precio = Number(session.price) || 0;
  const propios = payments.filter((p) => p.sessionId === session.id);
  const yaCobrado = propios.reduce((a, p) => a + (Number(p.amount) || 0), 0);

  if (session.bonoId || precio <= 0) return payments;

  if (cobrada && yaCobrado < precio - 0.005) {
    return [
      ...payments,
      {
        id: uid(),
        date: session.date,
        amount: Math.round((precio - yaCobrado) * 100) / 100,
        clientId: session.clientId,
        sessionId: session.id,
        method: "",
      },
    ];
  }
  if (!cobrada && propios.length > 0 && yaCobrado >= precio - 0.005) {
    return payments.filter((p) => p.sessionId !== session.id);
  }
  return payments;
}

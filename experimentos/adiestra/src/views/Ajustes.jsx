import { useEffect, useRef, useState } from "react";
import { Download, Upload, Share2, HardDriveDownload, Check, TriangleAlert } from "lucide-react";
import { Sheet, Segmented, Confirm } from "../ui/components.jsx";
import { listSnapshots, requestPersistence, storageInfo } from "../lib/storage.js";
import { backupName, toBackupJSON, parseBackup, countOf } from "../lib/backup.js";
import { downloadText, shareText, canShareFiles, readFileAsText } from "../lib/files.js";
import { fmtShort } from "../lib/dates.js";

const kb = (bytes) => (bytes == null ? "—" : `${(bytes / 1024).toFixed(0)} KB`);

export function Ajustes({ data, act, onClose, installPrompt, standalone }) {
  const [info, setInfo] = useState({ persisted: false, usage: null, quota: null, supported: false });
  const [snapshots, setSnapshots] = useState([]);
  const [importado, setImportado] = useState(null);
  const [error, setError] = useState("");
  const [restaurar, setRestaurar] = useState(null);
  const [borrarTodo, setBorrarTodo] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    storageInfo().then(setInfo);
    listSnapshots().then(setSnapshots);
  }, []);

  const cuentas = countOf(data);
  const json = () => toBackupJSON(data);

  const exportar = () => {
    if (downloadText(backupName(), json(), "application/json")) {
      act.patchSettings({ lastExport: new Date().toISOString() });
      act.toast("Copia descargada.");
    } else {
      act.toast("No se ha podido descargar la copia.");
    }
  };

  const compartir = async () => {
    const ok = await shareText(backupName(), json(), "application/json");
    if (ok) {
      act.patchSettings({ lastExport: new Date().toISOString() });
      act.toast("Copia compartida.");
    }
  };

  const elegirArchivo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      const entrante = parseBackup(await readFileAsText(file));
      setImportado(entrante);
    } catch (err) {
      setError(err.message);
    }
  };

  const últimaCopia = data.settings?.lastExport ? new Date(data.settings.lastExport) : null;
  const díasSinCopia = últimaCopia ? Math.floor((Date.now() - últimaCopia.getTime()) / 86400000) : null;

  return (
    <Sheet title="Ajustes" onClose={onClose}>
      <section className="set-block">
        <h3 className="sec">Copia de seguridad</h3>
        <p className="hint">
          Todo se guarda en el propio móvil. Descarga una copia de vez en cuando y guárdala en iCloud, Drive o el correo:
          es lo único que te protege si pierdes el teléfono.
        </p>
        <div className="quick wrap">
          <button type="button" className="btn" onClick={exportar}>
            <Download size={16} /> Descargar copia
          </button>
          {canShareFiles() && (
            <button type="button" className="btn" onClick={compartir}>
              <Share2 size={16} /> Compartir
            </button>
          )}
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Restaurar
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={elegirArchivo} />

        {últimaCopia && (
          <p className={díasSinCopia > 30 ? "warn-line" : "hint"}>
            {díasSinCopia > 30 && <TriangleAlert size={14} />}
            Última copia hace {díasSinCopia} {díasSinCopia === 1 ? "día" : "días"}.
          </p>
        )}
        {error && <p className="warn-line">{error}</p>}

        {importado && (
          <div className="note-card">
            <p>
              El archivo trae {countOf(importado).clientes} clientes, {countOf(importado).sesiones} sesiones y{" "}
              {countOf(importado).cobros} cobros. ¿Qué hago con lo que tienes ahora?
            </p>
            <div className="quick wrap">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const n = act.mergeIn(importado);
                  setImportado(null);
                  act.toast(`Añadidos ${n} registros nuevos.`);
                }}
              >
                Fusionar
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  act.replaceAll(importado);
                  setImportado(null);
                  act.toast("Cuaderno restaurado.");
                }}
              >
                Reemplazar todo
              </button>
              <button type="button" className="btn ghost" onClick={() => setImportado(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="set-block">
        <h3 className="sec">Copias automáticas</h3>
        <p className="hint">La app guarda sola una copia diaria dentro del móvil. Se conservan las diez últimas.</p>
        {snapshots.length === 0 ? (
          <p className="muted">Todavía no hay ninguna.</p>
        ) : (
          snapshots.map((s) => (
            <div key={s.id} className="snap">
              <span className="crow-txt">
                <strong className="mono small">{fmtShort(s.day)}</strong>
                <span className="sub2">
                  {s.counts.clientes} {s.counts.clientes === 1 ? "cliente" : "clientes"} · {s.counts.sesiones}{" "}
                  {s.counts.sesiones === 1 ? "sesión" : "sesiones"}
                </span>
              </span>
              <button type="button" className="btn small ghost" onClick={() => setRestaurar(s)}>
                <HardDriveDownload size={15} /> Restaurar
              </button>
            </div>
          ))
        )}
        {restaurar && (
          <Confirm
            text={`Se sustituye el cuaderno actual por la copia del ${fmtShort(restaurar.day)}. Lo apuntado después se pierde.`}
            confirmLabel="Restaurar"
            onCancel={() => setRestaurar(null)}
            onConfirm={() => {
              act.replaceAll(restaurar.data);
              setRestaurar(null);
              act.toast("Copia restaurada.");
            }}
          />
        )}
      </section>

      <section className="set-block">
        <h3 className="sec">Almacenamiento</h3>
        <div className="kv">
          <span>Espacio que ocupa la app</span>
          <strong className="mono">{kb(info.usage)}</strong>
        </div>
        <div className="kv">
          <span>Protegidos frente a limpiezas</span>
          <strong className={info.persisted ? "ok-text" : "warn-text"}>{info.persisted ? "sí" : "no"}</strong>
        </div>
        {!info.persisted && (
          <button
            type="button"
            className="btn wide"
            onClick={async () => {
              const ok = await requestPersistence();
              setInfo(await storageInfo());
              act.toast(ok ? "Datos marcados como permanentes." : "El navegador no lo ha concedido; con la app instalada suele concederse.");
            }}
          >
            <Check size={16} /> Pedir almacenamiento permanente
          </button>
        )}
        <div className="kv">
          <span>Contenido</span>
          <strong className="mono">
            {cuentas.clientes} · {cuentas.sesiones} · {cuentas.bonos} · {cuentas.cobros}
          </strong>
        </div>
        <p className="hint">Clientes · sesiones · bonos · cobros.</p>
      </section>

      <section className="set-block">
        <h3 className="sec">Aspecto</h3>
        <Segmented
          value={data.settings?.theme || "auto"}
          onChange={(v) => act.patchSettings({ theme: v })}
          options={[["auto", "Automático"], ["claro", "Claro"], ["oscuro", "Oscuro"]]}
        />
      </section>

      {!standalone && (
        <section className="set-block">
          <h3 className="sec">Tener la app en el móvil</h3>
          {installPrompt ? (
            <button
              type="button"
              className="btn primary wide"
              onClick={async () => {
                installPrompt.prompt();
                await installPrompt.userChoice;
              }}
            >
              Instalar la app
            </button>
          ) : (
            <p className="hint">
              En el iPhone: abre esta página en Safari, toca el botón de compartir y elige{" "}
              <strong>Añadir a pantalla de inicio</strong>. En Android, menú del navegador →{" "}
              <strong>Instalar aplicación</strong>. Después funciona sin conexión y con su propio icono.
            </p>
          )}
        </section>
      )}

      <section className="set-block">
        <h3 className="sec">Zona peligrosa</h3>
        {!borrarTodo ? (
          <button type="button" className="btn ghost wide danger" onClick={() => setBorrarTodo(true)}>
            Vaciar el cuaderno
          </button>
        ) : (
          <Confirm
            text="Se borra todo: clientes, sesiones, bonos y cobros. Descarga antes una copia si no estás seguro."
            confirmLabel="Sí, vaciar"
            onCancel={() => setBorrarTodo(false)}
            onConfirm={() => {
              act.wipe();
              setBorrarTodo(false);
              act.toast("Cuaderno vacío.");
            }}
          />
        )}
      </section>
    </Sheet>
  );
}

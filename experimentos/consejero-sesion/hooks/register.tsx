// Consejero de sesión: mide el contexto, el modelo y los límites de uso en
// cada turno y, cuando una buena práctica lo pide, muestra un consejo con
// botones sobre el prompt. Nunca actúa sin un clic o una respuesta.
//
// La lógica pura (umbrales, heurísticas, textos) está en reglas.ts y
// clasificador.ts; aquí se conectan los eventos del motor con esa lógica. El
// motor exige que toda función que recibe `$` esté declarada en este nivel,
// así que el estado de la conversación viaja en un objeto `Sesion`.

import { atom, read, update } from 'claude-code'
import type {
  EngineInterface,
  PluginOptions,
  Register,
  SessionContextUsage,
  SessionRateLimit,
} from 'claude-code'

import type { Accion, Consejo, Medicion, Nivel, Traspaso } from '../types'
import {
  CLAVE_PREGUNTA,
  JEV_URL,
  PREGUNTA_DIFICIL,
  PREGUNTA_TEMA,
  cuerpoJev,
  leerRespuestaJev,
  veredictoJev,
} from './clasificador'
import type { Pregunta, Veredicto } from './clasificador'
import {
  CARPETA_TRASPASOS,
  CORRECCIONES,
  DIAS_TRASPASO,
  INSTRUCCIONES_COMPACTAR,
  LINEAS_CLAUDE_MD,
  MOTIVO_PLAN_LIMPIO,
  PROMPT_IMPLEMENTAR,
  PROMPT_TRASPASO,
  TURNOS_RUTINA,
  consejoBajarModelo,
  consejoCambioModelo,
  consejoClaudeMd,
  consejoContexto,
  consejoCorrecciones,
  consejoFast,
  consejoLimite,
  consejoPlan,
  consejoSubagentes,
  consejoSubirModelo,
  consejoTraspasoDisponible,
  consejoTraspasoListo,
  contextoTraspaso,
  dificultad,
  encolar,
  esCorreccion,
  esGrande,
  esPequeno,
  esTurnoLigero,
  estadoTema,
  familiaDe,
  formatoReinicio,
  formatoTokens,
  lineaEstado,
  nombreTraspaso,
  panelMarkdown,
  pareceCompleja,
  pareceInvestigacion,
  promptNombre,
  slug,
  temaNuevo,
  tituloDe,
  umbralesDe,
} from './reglas'
import type { Familia, Umbrales } from './reglas'

type Motor = EngineInterface

/** Configuración y estado de la conversación en curso; /clear lo reinicia. */
type Sesion = {
  opciones: PluginOptions
  preset: string
  u: Umbrales
  clasificador: string
  preguntarTema: boolean
  vistos: Set<string>
  rachaCorrecciones: number
  rachaLigeros: number
  herramientas: number
  recientes: string[]
  modoPermisos: string | null
  esfuerzo: string | null
  noPreguntarTema: boolean
  noPreguntarPlan: boolean
  ultimaMedicion: Medicion | null
  planLimpioPendiente: boolean
  jevAvisado: boolean
}

const PANEL = 'consejos'
const CLAVE_SILENCIADAS = 'silenciadas'
const CLAVE_PENDIENTE = 'traspaso-pendiente'
const CLAVE_USADOS = 'traspasos-usados'

const consejos = atom({ plugin: 'consejero-sesion', key: 'consejos' } as const, [])
const medicion = atom({ plugin: 'consejero-sesion', key: 'medicion' } as const, null)

const ETIQUETA: Record<Nivel, string> = { urgente: 'Urgente', aviso: 'Aviso', info: 'Consejo' }
const COLOR: Record<Nivel, string | null> = { urgente: 'error', aviso: 'warning', info: null }

const TEXTO_ACCION: Record<Accion, string> = {
  compactar: 'Compactar',
  limpiar: 'Limpiar chat',
  traspaso: 'Traspaso + chat nuevo',
  'cargar-traspaso': 'Adjuntar',
  'quitar-traspaso': 'Quitar',
  silenciar: 'No volver a avisar',
  cerrar: 'Cerrar',
}

const LIMPIO = 'Chat limpio (recomendado)'
const AQUI = 'Enviar aquí'
const AQUI_SIEMPRE = 'Aquí, y no preguntar más en este chat'
const PLAN_LIMPIO = 'Chat limpio con el plan'
const PLAN_AQUI = 'Implementar aquí'

const nombreDe = (ruta: string): string => ruta.slice(ruta.lastIndexOf('/') + 1)

function recordar(s: Sesion, texto: string): void {
  s.recientes = [...s.recientes, texto.slice(0, 2_000)].slice(-6)
}

function reiniciar(s: Sesion): void {
  s.vistos = new Set()
  s.rachaCorrecciones = 0
  s.rachaLigeros = 0
  s.recientes = []
  s.noPreguntarTema = false
  s.noPreguntarPlan = false
  s.planLimpioPendiente = false
  s.ultimaMedicion = null
}

// ------------------------------------------------------------------ consejos

async function silenciadas($: Motor): Promise<string[]> {
  const valor = await $.store.get(CLAVE_SILENCIADAS)
  return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === 'string') : []
}

async function mostrar($: Motor, s: Sesion, c: Consejo | null, repetir = false): Promise<void> {
  if (c === null) return
  if (!repetir && s.vistos.has(c.id)) return
  if ((await silenciadas($)).includes(c.regla)) return
  s.vistos.add(c.id)
  await update($, consejos, lista => encolar(lista, c))
  if (c.nivel === 'urgente') $.ui.toast(`${ETIQUETA.urgente}: mira el aviso sobre el prompt.`, { timeoutMs: 6_000 })
}

async function quitar($: Motor, id: string): Promise<void> {
  await update($, consejos, lista => lista.filter(c => c.id !== id))
}

// ------------------------------------------------------------------ medición

async function publicar($: Motor, s: Sesion, m: Medicion): Promise<void> {
  s.ultimaMedicion = m
  await update($, medicion, () => m)
  $.ui.status(lineaEstado(m))
}

async function medir(
  $: Motor,
  s: Sesion,
  contexto: SessionContextUsage,
  limites: readonly SessionRateLimit[],
): Promise<Medicion> {
  const porcentajeDe = (tipo: string): number | null =>
    limites.find(l => l.kind === tipo)?.percentUsed ?? null
  const m: Medicion = {
    tokens: contexto.tokens ?? null,
    ventana: contexto.window,
    porcentaje: contexto.percent ?? null,
    cincoHoras: porcentajeDe('five_hour'),
    sieteDias: porcentajeDe('seven_day'),
    modelo: await $.session.model(),
    esfuerzo: s.esfuerzo,
  }
  await publicar($, s, m)
  return m
}

async function evaluar($: Motor, s: Sesion, m: Medicion, limites: readonly SessionRateLimit[]): Promise<void> {
  if (m.tokens !== null) await mostrar($, s, consejoContexto(m.tokens, s.u))
  const ahora = new Date(await $.clock.now())
  for (const l of limites) {
    if (l.kind !== 'five_hour' && l.kind !== 'seven_day') continue
    await mostrar($, s, consejoLimite(l.kind, l.percentUsed, formatoReinicio(l.resetsAt, ahora)))
  }
}

// --------------------------------------------------------------- clasificador

/** Haiku o Jev deciden los casos dudosos; null sin clasificador o si ninguno responde. */
async function clasificar($: Motor, s: Sesion, pregunta: Pregunta, texto: string): Promise<Veredicto | null> {
  if (s.clasificador === 'ninguno') return null
  if (s.clasificador === 'jev') {
    const veredicto = await preguntarJev($, s, pregunta, texto)
    if (veredicto !== null) return veredicto
  }
  try {
    const etiqueta = await $.model.classify(`${pregunta.instrucciones}\n\n${texto}`, pregunta.etiquetas, {
      model: 'haiku',
    })
    if (etiqueta === undefined) return null
    return etiqueta === pregunta.etiquetas[0] ? 'si' : 'no'
  } catch {
    return null
  }
}

/** Un solo aviso por conversación, para no llenar la pantalla si Jev falla. */
function avisarJev($: Motor, s: Sesion, motivo: string): void {
  if (s.jevAvisado) return
  s.jevAvisado = true
  $.ui.toast(`Jev: ${motivo}. Uso Haiku.`, { timeoutMs: 8_000 })
}

async function preguntarJev($: Motor, s: Sesion, pregunta: Pregunta, texto: string): Promise<Veredicto | null> {
  const clave = String(s.opciones.jev_api_key ?? '')
  if (clave === '') {
    avisarJev($, s, 'falta la API key en /config')
    return null
  }
  try {
    const respuesta = await $.http.fetch(JEV_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${clave}` },
      body: JSON.stringify(cuerpoJev(pregunta, texto)),
    })
    if (!respuesta.ok) {
      avisarJev($, s, `respondió ${respuesta.status}`)
      return null
    }
    const leida = leerRespuestaJev(JSON.parse(respuesta.text), CLAVE_PREGUNTA)
    if (leida === null) {
      avisarJev($, s, 'no reconozco el formato de la respuesta')
      return null
    }
    return veredictoJev(leida, Number(s.opciones.jev_confianza ?? 0.75))
  } catch {
    avisarJev($, s, 'no se pudo conectar')
    return null
  }
}

/** Nombre para el chat que se deja al limpiar; undefined sin clasificador o si falla. */
async function proponerNombre($: Motor, s: Sesion): Promise<string | undefined> {
  if (s.clasificador === 'ninguno' || s.recientes.length === 0) return undefined
  try {
    const r = await $.model.complete({ model: 'haiku', prompt: promptNombre(s.recientes), maxTokens: 30, effort: 'low' })
    if (!r.isAnswered) return undefined
    const nombre = slug(r.text.split('\n')[0] ?? '')
    return nombre === '' ? undefined : nombre
  } catch {
    return undefined
  }
}

// ----------------------------------------------------------------- traspasos

async function leerPendiente($: Motor, raiz: string): Promise<Traspaso | null> {
  const v = (await $.store.get(CLAVE_PENDIENTE)) as Partial<Traspaso> | undefined
  if (v === undefined || typeof v.ruta !== 'string' || v.raiz !== raiz) return null
  return { ruta: v.ruta, raiz, adjuntar: v.adjuntar === true }
}

async function marcarUsado($: Motor, ruta: string): Promise<void> {
  const usados = await $.store.get(CLAVE_USADOS)
  const lista = Array.isArray(usados) ? usados.filter((v): v is string => typeof v === 'string') : []
  await $.store.set(CLAVE_USADOS, [...lista.filter(r => r !== ruta), ruta].slice(-50))
  await $.store.delete(CLAVE_PENDIENTE)
}

async function guardarTraspaso($: Motor, markdown: string): Promise<string> {
  const carpeta = `${await $.session.root()}/${CARPETA_TRASPASOS}`
  const ignorar = `${carpeta}/.gitignore`
  if (!(await $.fs.exists(ignorar))) {
    await $.fs.write(ignorar, '# Traspasos de consejero-sesion: notas de trabajo, fuera de git\n*\n')
  }
  const ruta = `${carpeta}/${nombreTraspaso(new Date(await $.clock.now()), tituloDe(markdown) ?? 'traspaso')}`
  await $.fs.write(ruta, markdown.endsWith('\n') ? markdown : `${markdown}\n`)
  return ruta
}

async function crearTraspaso($: Motor): Promise<string | null> {
  $.ui.toast('Generando el traspaso…')
  const r = await $.model.fork({ prompt: PROMPT_TRASPASO })
  if (!r.isAnswered) {
    $.ui.toast(r.reason === 'nothing-to-fork' ? 'Aún no hay conversación que traspasar.' : 'No se pudo generar el traspaso.')
    return null
  }
  return guardarTraspaso($, r.text)
}

/** Ofrece al abrir un chat el traspaso más reciente que no se haya usado. */
async function ofrecerTraspaso($: Motor, s: Sesion, raiz: string): Promise<void> {
  const pendiente = await leerPendiente($, raiz)
  if (pendiente?.adjuntar) {
    await mostrar($, s, consejoTraspasoListo(nombreDe(pendiente.ruta)), true)
    return
  }
  const carpeta = `${raiz}/${CARPETA_TRASPASOS}`
  if (!(await $.fs.exists(carpeta))) return
  const usados = await $.store.get(CLAVE_USADOS)
  const yaUsados = new Set(Array.isArray(usados) ? usados : [])
  const ahora = await $.clock.now()
  const candidatos = (await $.fs.list(carpeta))
    .filter(f => f.kind === 'file' && f.name.endsWith('.md'))
    .filter(f => ahora - f.mtimeMs < DIAS_TRASPASO * 86_400_000 && !yaUsados.has(`${carpeta}/${f.name}`))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
  const ultimo = candidatos[0]
  if (ultimo === undefined) return
  await $.store.set(CLAVE_PENDIENTE, { ruta: `${carpeta}/${ultimo.name}`, raiz, adjuntar: false })
  await mostrar($, s, consejoTraspasoDisponible(ultimo.name))
}

/** Revisión al arrancar: tamaño de CLAUDE.md, fast mode y traspasos recientes. */
async function revisarInicio($: Motor, s: Sesion): Promise<void> {
  const raiz = await $.session.root()
  for (const nombre of ['CLAUDE.md', '.claude/CLAUDE.md']) {
    const ruta = `${raiz}/${nombre}`
    if (!(await $.fs.exists(ruta))) continue
    const lineas = (await $.fs.read(ruta)).split('\n').length
    if (lineas > LINEAS_CLAUDE_MD) await mostrar($, s, consejoClaudeMd(lineas, nombre))
  }
  if ((await $.settings.read()).fastMode === true) await mostrar($, s, consejoFast())
  await ofrecerTraspaso($, s, raiz)
}

// ------------------------------------------------------------------ acciones

async function limpiar($: Motor, s: Sesion): Promise<boolean> {
  const nombre = await proponerNombre($, s)
  try {
    await $.command.run({ command: 'clear', args: nombre ?? '' })
    return true
  } catch {
    $.ui.toast('No he podido limpiar el chat: escribe /clear.', { timeoutMs: 8_000 })
    return false
  }
}

/** Limpia y reenvía `texto` en el chat nuevo (el traspaso pendiente va con él). */
async function limpiarYEnviar($: Motor, s: Sesion, texto: string): Promise<void> {
  if (await limpiar($, s)) {
    // asUser: el modelo lo lee como palabras del usuario, sin el marco del plugin
    await $.prompt.submit({ text: texto, asUser: true })
    return
  }
  await $.prompt.fill({ text: texto })
}

async function traspasarYLimpiar($: Motor, s: Sesion): Promise<void> {
  const ruta = await crearTraspaso($)
  if (ruta === null) return
  await $.store.set(CLAVE_PENDIENTE, { ruta, raiz: await $.session.root(), adjuntar: true })
  if (await limpiar($, s)) {
    await mostrar($, s, consejoTraspasoListo(nombreDe(ruta)), true)
  } else {
    $.ui.toast(`Traspaso guardado en ${ruta}; irá con tu próximo mensaje.`, { timeoutMs: 10_000 })
  }
}

/** Tras rechazar ExitPlanMode, la respuesta del turno es el plan. */
async function guardarPlanYLimpiar($: Motor, s: Sesion, respuesta: string): Promise<void> {
  let plan = respuesta.trim()
  if (tituloDe(plan) === null) {
    if (plan.length >= 200) {
      plan = `# Plan\n\n${plan}`
    } else {
      const r = await $.model.fork({ prompt: PROMPT_TRASPASO })
      if (!r.isAnswered) {
        $.ui.toast('No pude guardar el plan; sigue en este chat.')
        return
      }
      plan = r.text
    }
  }
  const ruta = await guardarTraspaso($, plan)
  await $.store.set(CLAVE_PENDIENTE, { ruta, raiz: await $.session.root(), adjuntar: true })
  await limpiarYEnviar($, s, PROMPT_IMPLEMENTAR)
}

async function ejecutar($: Motor, s: Sesion, accion: Accion, c: Consejo): Promise<void> {
  await quitar($, c.id)
  switch (accion) {
    case 'cerrar':
      if (c.acciones.includes('cargar-traspaso')) {
        const p = await leerPendiente($, await $.session.root())
        if (p !== null) await marcarUsado($, p.ruta)
      }
      return
    case 'silenciar':
      await $.store.set(CLAVE_SILENCIADAS, [...new Set([...(await silenciadas($)), c.regla])])
      $.ui.toast(`Silenciado «${c.regla}». Reactívalo con /consejos reactivar.`)
      return
    case 'compactar':
      try {
        const r = await $.session.compact({ instructions: INSTRUCCIONES_COMPACTAR })
        if ('skip' in r && r.skip !== undefined) $.ui.toast(`Compactación omitida: ${r.skip}`)
      } catch {
        $.ui.toast('No se puede compactar mientras Claude trabaja; vuelve a pulsar al terminar.')
        await mostrar($, s, c, true)
      }
      return
    case 'limpiar':
      await limpiar($, s)
      return
    case 'traspaso':
      await traspasarYLimpiar($, s)
      return
    case 'cargar-traspaso': {
      const p = await leerPendiente($, await $.session.root())
      if (p === null) return
      await $.store.set(CLAVE_PENDIENTE, { ...p, adjuntar: true })
      await mostrar($, s, consejoTraspasoListo(nombreDe(p.ruta)), true)
      return
    }
    case 'quitar-traspaso':
      await $.store.delete(CLAVE_PENDIENTE)
      return
  }
}

// ----------------------------------------------------------- análisis prompt

/** Sugiere subir de modelo si la tarea parece difícil; el clasificador decide las dudosas. */
async function revisarDificultad($: Motor, s: Sesion, texto: string, familia: Familia): Promise<void> {
  if (!esPequeno(familia) || s.vistos.has('modelo-subir')) return
  const d = dificultad(texto)
  if (d === 'dificil') {
    await mostrar($, s, consejoSubirModelo(familia))
    return
  }
  if (d === 'rutinaria' || s.clasificador === 'ninguno') return
  // en segundo plano: no retrasa el envío del prompt
  $.clock.after(50, () => {
    void clasificarDificultad($, s, texto, familia)
  })
}

async function clasificarDificultad($: Motor, s: Sesion, texto: string, familia: Familia): Promise<void> {
  if ((await clasificar($, s, PREGUNTA_DIFICIL, texto)) === 'si') await mostrar($, s, consejoSubirModelo(familia))
}

async function preguntarChatLimpio($: Motor, s: Sesion, texto: string, tokens: number): Promise<boolean> {
  let eleccion: string
  try {
    eleccion = await $.ui.ask(
      `Parece una tarea nueva y llevas ${formatoTokens(tokens)} tokens de la anterior. ¿Dónde la envío?`,
      { header: 'Tarea nueva', options: [LIMPIO, AQUI, AQUI_SIEMPRE] },
    )
  } catch {
    return false
  }
  if (eleccion === AQUI_SIEMPRE) s.noPreguntarTema = true
  if (eleccion !== LIMPIO) return false
  $.clock.after(50, () => {
    void limpiarYEnviar($, s, texto)
  })
  return true
}

/** Revisa un prompt del usuario; true si se reenvía a un chat limpio. */
async function revisarPrompt($: Motor, s: Sesion, texto: string): Promise<boolean> {
  const familia = familiaDe(await $.session.model())

  s.rachaCorrecciones = esCorreccion(texto) ? s.rachaCorrecciones + 1 : 0
  if (s.rachaCorrecciones >= CORRECCIONES) await mostrar($, s, consejoCorrecciones(familia))
  if (pareceInvestigacion(texto)) await mostrar($, s, consejoSubagentes())
  if (s.modoPermisos !== 'plan' && pareceCompleja(texto)) await mostrar($, s, consejoPlan())
  await revisarDificultad($, s, texto, familia)

  const tokens = s.ultimaMedicion?.tokens ?? 0
  if (!s.preguntarTema || s.noPreguntarTema || s.rachaCorrecciones > 0) return false
  if (tokens < s.u.temaNuevo || s.recientes.length === 0) return false
  let veredicto = temaNuevo(texto, s.recientes)
  if (veredicto === 'duda') {
    veredicto = (await clasificar($, s, PREGUNTA_TEMA, estadoTema(s.recientes, texto))) ?? 'no'
  }
  return veredicto === 'si' && preguntarChatLimpio($, s, texto, tokens)
}

/** Adjunta el traspaso pendiente, si lo hay, al contexto del mensaje. */
async function adjuntarTraspaso($: Motor, contexto: readonly string[] | undefined): Promise<readonly string[] | undefined> {
  const pendiente = await leerPendiente($, await $.session.root())
  if (!pendiente?.adjuntar) return contexto
  let resultado = contexto
  try {
    const markdown = await $.fs.read(pendiente.ruta)
    resultado = [...(contexto ?? []), contextoTraspaso(pendiente.ruta, markdown)]
  } catch {
    $.ui.toast('No pude leer el traspaso; el mensaje va sin él.')
  }
  await marcarUsado($, pendiente.ruta)
  await update($, consejos, lista => lista.filter(c => c.regla !== 'traspaso'))
  return resultado
}

async function textoPanel($: Motor, s: Sesion): Promise<string> {
  return panelMarkdown(
    await read($, medicion),
    s.preset,
    s.u,
    s.clasificador,
    await read($, consejos),
    await silenciadas($),
  )
}

// -------------------------------------------------------------------- eventos

export const register: Register = (on, opciones) => {
  const preset = String(opciones.umbrales ?? 'equilibrado')
  const s: Sesion = {
    opciones,
    preset,
    u: umbralesDe(preset),
    clasificador: String(opciones.clasificador ?? 'haiku'),
    preguntarTema: opciones.preguntar_tema_nuevo !== false,
    vistos: new Set(),
    rachaCorrecciones: 0,
    rachaLigeros: 0,
    herramientas: 0,
    recientes: [],
    modoPermisos: null,
    esfuerzo: null,
    noPreguntarTema: false,
    noPreguntarPlan: false,
    ultimaMedicion: null,
    planLimpioPendiente: false,
    jevAvisado: false,
  }

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'consejos',
      description: 'Consejero de sesión: estado, chuleta de buenas prácticas y traspasos',
      argumentHint: '[traspaso|reactivar]',
    })
    // la app de escritorio puede no contar como interactiva, pero sí dibuja
    if (e.isInteractive || e.surface !== null) {
      try {
        await revisarInicio($, s)
      } catch {
        // la revisión inicial nunca debe impedir que arranque la sesión
      }
    }
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const m = await medir($, s, e.context, e.rateLimits)
    await evaluar($, s, m, e.rateLimits)
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const delUsuario = e.origin.kind === 'composer' || e.origin.kind === 'bridge' || e.origin.kind === 'sdk'
    const propio = e.origin.kind === 'plugin' && e.origin.name === $.plugin.name
    if (!delUsuario && !propio) return next(e)

    if (delUsuario && (await revisarPrompt($, s, e.text))) {
      return { drop: 'Lo envío a un chat limpio (consejero-sesion).' }
    }

    const contexto = await adjuntarTraspaso($, e.context)
    recordar(s, e.text)
    s.herramientas = 0
    return next(contexto === e.context ? e : { ...e, context: contexto })
  })

  on('tool.call', ($, e, next) => {
    if (e.agentId === undefined) s.herramientas += 1
    return next(e)
  })

  // Plan aprobado con mucho contexto: la doc recomienda implementar en limpio.
  on('tool.call', { tool: 'ExitPlanMode' }, async ($, e, next) => {
    const tokens = s.ultimaMedicion?.tokens ?? 0
    if (e.agentId !== undefined || s.noPreguntarPlan || tokens < s.u.temaNuevo) return next(e)
    if ((await silenciadas($)).includes('traspaso')) return next(e)
    let eleccion: string
    try {
      eleccion = await $.ui.ask(
        `Plan listo con ${formatoTokens(tokens)} tokens de contexto. Implementarlo en un chat limpio suele salir mejor. ¿Dónde lo implemento?`,
        { header: 'Plan', options: [PLAN_LIMPIO, PLAN_AQUI] },
      )
    } catch {
      return next(e)
    }
    if (eleccion !== PLAN_LIMPIO) {
      s.noPreguntarPlan = true
      return next(e)
    }
    s.planLimpioPendiente = true
    return { deny: MOTIVO_PLAN_LIMPIO }
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (e.agentId !== undefined || e.isAborted) return r
    if (e.answer !== '') recordar(s, e.answer)

    s.rachaLigeros = esTurnoLigero(e.usage?.output_tokens, s.herramientas) ? s.rachaLigeros + 1 : 0
    const familia = familiaDe(await $.session.model())
    if (esGrande(familia) && s.rachaLigeros >= TURNOS_RUTINA) {
      await mostrar($, s, consejoBajarModelo(familia, s.rachaLigeros))
    }

    if (s.planLimpioPendiente) {
      s.planLimpioPendiente = false
      const respuesta = e.answer
      $.clock.after(50, () => {
        void guardarPlanYLimpiar($, s, respuesta)
      })
    }
    return r
  })

  on('classic.UserPromptSubmit', ($, e, next) => {
    if (e.permission_mode !== undefined) s.modoPermisos = e.permission_mode
    return next(e)
  })

  on('classic.Stop', ($, e, next) => {
    if (e.permission_mode !== undefined) s.modoPermisos = e.permission_mode
    if (e.effort !== undefined) s.esfuerzo = e.effort.level
    return next(e)
  })

  on('classic.PreModelSwitch', async ($, e, next) => {
    if (e.prompt_cache_warm && e.context_tokens >= s.u.temaNuevo) {
      await mostrar($, s, consejoCambioModelo(e.to_model, e.context_tokens), true)
    }
    return next(e)
  })

  on('classic.PostModelSwitch', async ($, e, next) => {
    s.rachaLigeros = 0
    if (s.ultimaMedicion !== null) await publicar($, s, { ...s.ultimaMedicion, modelo: e.to_model })
    if ((await $.settings.read()).fastMode === true) await mostrar($, s, consejoFast())
    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    const r = await next(e)
    if (e.trigger === 'precompute' || e.agentId !== undefined) return r
    s.vistos.delete('contexto-suave')
    s.vistos.delete('contexto-fuerte')
    await update($, consejos, lista => lista.filter(c => c.regla !== 'contexto'))
    if (e.trigger === 'auto') {
      $.ui.toast('Auto-compactado. Si vas a cambiar de tarea, /clear es gratis y no resume nada.', { timeoutMs: 6_000 })
    }
    return r
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      reiniciar(s)
      await update($, consejos, lista => lista.filter(c => c.regla === 'traspaso'))
    }
    return next(e)
  })

  on('command.run', { command: 'consejos' }, async ($, e) => {
    const argumento = e.args.trim().toLowerCase()
    if (argumento === 'reactivar') {
      await $.store.set(CLAVE_SILENCIADAS, [])
      return { text: 'Todos los consejos vuelven a estar activos.' }
    }
    if (argumento === 'traspaso') {
      $.clock.after(50, () => {
        void traspasarYLimpiar($, s)
      })
      return { text: 'Genero el traspaso y abro un chat limpio; irá adjunto a tu primer mensaje.' }
    }
    const abierto = await $.ui.open({ id: PANEL, title: 'Consejero de sesión' })
    if (abierto.isPlaced) return { text: 'Panel del consejero abierto.' }
    return { text: await textoPanel($, s) }
  })

  on('ui.render', { component: 'Pane', requestId: PANEL }, async ($, e) => {
    const { Markdown } = $.ui.resolve(e)
    return <Markdown text={await textoPanel($, s)} />
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const lista = await read($, consejos)
    const c = lista[0]
    if (c === undefined) return next(e)

    const { Box, Text, Button } = $.ui.resolve(e)
    const color = COLOR[c.nivel]
    const mas = lista.length > 1 ? ` (+${lista.length - 1} en /consejos)` : ''
    return (
      <Box key="consejo" flexDirection="column">
        <Text wrap="wrap">
          <Text bold {...(color === null ? {} : { color })}>
            {ETIQUETA[c.nivel]}
          </Text>
          {` ${c.texto}${mas}`}
        </Text>
        <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
          {c.acciones.map((accion, i) => (
            <Button
              key={accion}
              label={TEXTO_ACCION[accion]}
              hotkey={String(i + 1)}
              {...(i === 0 ? { variant: 'primary' as const } : {})}
              onPress={() => {
                void ejecutar($, s, accion, c)
              }}
            />
          ))}
        </Box>
      </Box>
    )
  })
}

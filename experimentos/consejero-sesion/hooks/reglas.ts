// Lógica pura del consejero: umbrales, heurísticas y textos de cada consejo.
// No usa `$`, así que se prueba sin motor. Las recomendaciones salen de la
// documentación oficial de Claude Code (enlaces en el README); los umbrales
// numéricos son heurísticos porque la documentación no fija ninguno.

import type { Consejo, Medicion, Nivel } from '../types'

export type Familia = 'fable' | 'opus' | 'sonnet' | 'haiku' | 'otro'

// ---------------------------------------------------------------------------
// Umbrales

export type Preset = 'equilibrado' | 'conservador' | 'holgado'

export type Umbrales = {
  /** Tokens de contexto a partir de los que se avisa con suavidad. */
  suave: number
  /** Tokens a partir de los que el aviso es urgente. */
  fuerte: number
  /** Contexto mínimo para preguntar antes de enviar una tarea nueva o un plan. */
  temaNuevo: number
}

export const UMBRALES: Record<Preset, Umbrales> = {
  conservador: { suave: 80_000, fuerte: 150_000, temaNuevo: 30_000 },
  equilibrado: { suave: 150_000, fuerte: 300_000, temaNuevo: 50_000 },
  holgado: { suave: 300_000, fuerte: 600_000, temaNuevo: 100_000 },
}

export function umbralesDe(preset: unknown): Umbrales {
  return preset === 'conservador' || preset === 'holgado' ? UMBRALES[preset] : UMBRALES.equilibrado
}

/** Porcentaje de una ventana de uso (5 h o 7 días) que dispara cada nivel. */
export const LIMITE_AVISO = 75
export const LIMITE_URGENTE = 90

/** La doc: "después de dos correcciones fallidas, /clear". */
export const CORRECCIONES = 2

/** Turnos ligeros seguidos en Opus o Fable antes de sugerir Sonnet. */
export const TURNOS_RUTINA = 5

/** Un turno es ligero si genera poco y apenas usa herramientas. */
export function esTurnoLigero(tokensSalida: number | undefined, herramientas: number): boolean {
  return tokensSalida !== undefined && tokensSalida <= 2_000 && herramientas <= 3
}

/** La doc recomienda mantener CLAUDE.md por debajo de 200 líneas. */
export const LINEAS_CLAUDE_MD = 200

// ---------------------------------------------------------------------------
// Modelos

export function familiaDe(modelo: string): Familia {
  const m = modelo.toLowerCase()
  if (m.includes('fable') || m === 'best') return 'fable'
  if (m.includes('opus')) return 'opus'
  if (m.includes('sonnet')) return 'sonnet'
  if (m.includes('haiku')) return 'haiku'
  return 'otro'
}

export const esGrande = (f: Familia): boolean => f === 'opus' || f === 'fable'
export const esPequeno = (f: Familia): boolean => f === 'sonnet' || f === 'haiku'

const NOMBRE: Record<Familia, string> = {
  fable: 'Fable',
  opus: 'Opus',
  sonnet: 'Sonnet',
  haiku: 'Haiku',
  otro: 'el modelo actual',
}

export const nombreFamilia = (f: Familia): string => NOMBRE[f]

// ---------------------------------------------------------------------------
// Formato

/** 142_300 → "142K"; 1_000_000 → "1M"; 1_250_000 → "1,3M". */
export function formatoTokens(n: number): string {
  if (n >= 1_000_000) {
    const m = Math.round(n / 100_000) / 10
    return `${String(m).replace('.', ',')}M`
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

const dosCifras = (n: number): string => String(n).padStart(2, '0')

/** "16:40" para hoy; "jue 09/10 16:40" para otro día. */
export function formatoReinicio(iso: string | undefined, ahora: Date): string | null {
  if (iso === undefined) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const hora = `${dosCifras(d.getHours())}:${dosCifras(d.getMinutes())}`
  const mismoDia = d.toDateString() === ahora.toDateString()
  if (mismoDia) return hora
  const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
  return `${dias[d.getDay()]} ${dosCifras(d.getDate())}/${dosCifras(d.getMonth() + 1)} ${hora}`
}

/** El texto del indicador fijo bajo el prompt. */
export function lineaEstado(m: Medicion): string {
  const partes: string[] = []
  if (m.tokens !== null) {
    const ventana = m.ventana !== null ? `/${formatoTokens(m.ventana)}` : ''
    partes.push(`ctx ${formatoTokens(m.tokens)}${ventana}`)
  }
  if (m.cincoHoras !== null) partes.push(`5h ${Math.round(m.cincoHoras)}%`)
  if (m.sieteDias !== null) partes.push(`7d ${Math.round(m.sieteDias)}%`)
  const familia = familiaDe(m.modelo)
  partes.push(familia === 'otro' ? m.modelo : nombreFamilia(familia))
  if (m.esfuerzo !== null) partes.push(m.esfuerzo)
  return partes.join(' · ')
}

// ---------------------------------------------------------------------------
// Heurísticas sobre el texto del prompt

const ACENTOS: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n', à: 'a', è: 'e', ì: 'i', ò: 'o', ù: 'u',
}

/** Minúsculas y sin tildes, para que las expresiones no dupliquen variantes. */
export function normalizar(texto: string): string {
  return texto.toLowerCase().replace(/[áéíóúüñàèìòù]/g, c => ACENTOS[c] ?? c)
}

const CORRECCION = [
  /^no\s*[,.!]/,
  /\bsigue (sin|fallando|igual|mal|dando|roto|rompiendo)/,
  /\b(vuelve|vuelves) a (fallar|equivocarte|hacerlo mal|romper)/,
  /\btodavia (no|falla|sale|da)/,
  /\botra vez (lo mismo|mal|el mismo|igual)/,
  /\beso no (es|era|funciona|va)/,
  /\bno (funciona|compila|arranca)\b/,
  /\bno es (lo que|eso)/,
  /\b(te has equivocado|te equivocas|esta mal|estan mal|no era eso|lo has roto)/,
  /\b(still (failing|broken|wrong|not working)|that'?s (wrong|not it)|doesn'?t work|not what i (asked|wanted))/,
]

/** ¿El prompt corrige lo que Claude acaba de hacer? */
export function esCorreccion(texto: string): boolean {
  const t = normalizar(texto.trim())
  return CORRECCION.some(r => r.test(t))
}

const INVESTIGACION =
  /\b(investiga|explora|averigua|analiza (todo|el (repo|repositorio|proyecto|codigo))|revisa (todo|todos|el (repo|repositorio|proyecto|codigo))|entiende como|estudia como|busca (en todo|por todo|donde se)|investigate|explore|audit|look through|figure out how)/

/** ¿Pide explorar mucho código? Conviene delegarlo en subagentes. */
export function pareceInvestigacion(texto: string): boolean {
  return INVESTIGACION.test(normalizar(texto))
}

const COMPLEJA =
  /\b(refactoriza|refactor|arquitectura|migra|migracion|redisena|rediseno|implementa|nueva (funcionalidad|feature|pantalla|seccion|vista)|en varios (archivos|ficheros)|todo el (proyecto|repo)|integra|anade soporte|disena|architecture|migrate|implement|redesign)/

/** ¿Es un cambio de varios archivos o de enfoque incierto? Merece plan mode. */
export function pareceCompleja(texto: string): boolean {
  const t = normalizar(texto)
  return COMPLEJA.test(t) || t.length >= 600
}

const DIFICIL =
  /\b(arquitectura|bug (sutil|raro|intermitente)|condicion de carrera|race condition|deadlock|fuga de memoria|memory leak|no se por que|no entiendo por que|causa raiz|root cause|vulnerabilidad|concurrencia|que enfoque|decide entre|ambigu)/

const RUTINA =
  /\b(renombra|cambia el nombre|errata|typo|anade un log|formatea|traduce|actualiza el texto|cambia el texto|sube la version|quita (el|la|los|las) |borra la linea|rename|bump)/

/** Dificultad de la tarea: `duda` cuando la heurística no basta y decide el clasificador. */
export function dificultad(texto: string): 'dificil' | 'rutinaria' | 'duda' {
  const t = normalizar(texto)
  if (DIFICIL.test(t)) return 'dificil'
  if (RUTINA.test(t) || t.length < 120) return 'rutinaria'
  return 'duda'
}

const MARCA_TEMA =
  /\b(cambiando de tema|cambio de tema|otra cosa|nueva tarea|pasemos a otra|aparte de esto|olvida (lo anterior|eso)|tema distinto|siguiente tarea|new task|unrelated|switching (gears|topics)|something else)\b/

const VACIAS = new Set([
  'para', 'como', 'pero', 'este', 'esta', 'esto', 'estos', 'estas', 'esos', 'esas', 'sobre',
  'donde', 'cuando', 'tambien', 'hacer', 'quiero', 'puedes', 'podrias', 'ahora', 'luego',
  'antes', 'despues', 'todo', 'todos', 'todas', 'cada', 'otro', 'otra', 'algo', 'bien',
  'vale', 'gracias', 'favor', 'tiene', 'tienes', 'hace', 'haya', 'sera', 'seria', 'esta',
  'with', 'this', 'that', 'from', 'have', 'what', 'when', 'where', 'there', 'their', 'into',
  'please', 'thanks', 'should', 'would', 'could', 'about', 'then', 'them', 'they', 'your',
])

/** Palabras con contenido (4+ letras, sin las vacías) de un texto. */
export function palabras(texto: string): Set<string> {
  const lista = normalizar(texto)
    .split(/[^a-z0-9_]+/)
    .filter(p => p.length >= 4 && !VACIAS.has(p))
  return new Set(lista)
}

/** Coeficiente de solapamiento: comunes / tamaño del menor (0 a 1). */
export function solapamiento(a: Set<string>, b: Set<string>): number {
  const menor = Math.min(a.size, b.size)
  if (menor === 0) return 0
  let comunes = 0
  for (const p of a) if (b.has(p)) comunes += 1
  return comunes / menor
}

/** ¿El prompt empieza una tarea sin relación con lo reciente? */
export function temaNuevo(texto: string, recientes: readonly string[]): 'si' | 'no' | 'duda' {
  if (MARCA_TEMA.test(normalizar(texto))) return 'si'
  if (recientes.length === 0) return 'no'
  const propias = palabras(texto)
  // "vale, sigue" o "haz eso" no bastan para juzgar: es continuar
  if (propias.size < 3) return 'no'
  return solapamiento(propias, palabras(recientes.join(' '))) >= 0.25 ? 'no' : 'duda'
}

// ---------------------------------------------------------------------------
// Consejos

const DECISIVAS = ['silenciar', 'cerrar'] as const

export function consejoContexto(tokens: number, u: Umbrales): Consejo | null {
  if (tokens >= u.fuerte) {
    return {
      id: 'contexto-fuerte',
      regla: 'contexto',
      nivel: 'urgente',
      texto: `Contexto en ${formatoTokens(tokens)} tokens: el rendimiento empeora a medida que se llena. Tarea nueva → limpia (es gratis). Misma tarea → compacta o haz un traspaso a un chat nuevo.`,
      acciones: ['limpiar', 'compactar', 'traspaso', ...DECISIVAS],
    }
  }
  if (tokens >= u.suave) {
    return {
      id: 'contexto-suave',
      regla: 'contexto',
      nivel: 'aviso',
      texto: `Llevas ${formatoTokens(tokens)} tokens de contexto. Si cambias de tarea, limpia. Si sigues con la misma, compacta en una pausa natural en vez de esperar al auto-compact.`,
      acciones: ['limpiar', 'compactar', 'traspaso', ...DECISIVAS],
    }
  }
  return null
}

export function consejoLimite(
  ventana: 'five_hour' | 'seven_day',
  porcentaje: number,
  reinicio: string | null,
): Consejo | null {
  const nivel: Nivel | null =
    porcentaje >= LIMITE_URGENTE ? 'urgente' : porcentaje >= LIMITE_AVISO ? 'aviso' : null
  if (nivel === null) return null
  const nombre = ventana === 'five_hour' ? 'de 5 h' : 'semanal'
  const cuando = reinicio !== null ? ` (se renueva: ${reinicio})` : ''
  const pct = Math.round(porcentaje)
  const texto =
    nivel === 'aviso'
      ? `Has usado el ${pct}% de tu ventana ${nombre}${cuando}. Para estirarla: limpia entre tareas, Sonnet para lo rutinario y subagentes con Haiku para explorar.`
      : `Ventana ${nombre} al ${pct}%${cuando}. Prioriza lo imprescindible y no compactes chats enormes. Al llegar al límite, cambiar de modelo no lo recupera; Claude Code puede esperar al reinicio y seguir (/rate-limit-options).`
  return {
    id: `${ventana === 'five_hour' ? 'limite-5h' : 'limite-7d'}-${nivel}`,
    regla: ventana === 'five_hour' ? 'limite-5h' : 'limite-7d',
    nivel,
    texto,
    acciones: ['limpiar', ...DECISIVAS],
  }
}

export function consejoCorrecciones(familia: Familia): Consejo {
  const subir = esPequeno(familia)
    ? ' Si Claude tenía todo el contexto y aun así falla, prueba con Opus o Fable (/model).'
    : ''
  return {
    id: 'correcciones',
    regla: 'correcciones',
    nivel: 'aviso',
    texto: `Dos correcciones seguidas: el contexto ya arrastra intentos fallidos. Vuelve con Esc Esc (/rewind) a antes del error, o limpia y reescribe el prompt con lo aprendido.${subir} Si falla por saltarse archivos o tests, sube el esfuerzo (/effort high).`,
    acciones: ['limpiar', 'traspaso', ...DECISIVAS],
  }
}

export function consejoBajarModelo(familia: Familia, turnos: number): Consejo {
  return {
    id: 'modelo-bajar',
    regla: 'modelo-bajar',
    nivel: 'info',
    texto: `Llevas ${turnos} turnos rutinarios en ${nombreFamilia(familia)}. Para la próxima tarea, Sonnet irá más rápido y gastará menos cupo. Cámbialo al empezarla (/model y tecla s, solo para esta sesión): a mitad de tarea se pierde la caché.`,
    acciones: [...DECISIVAS],
  }
}

export function consejoSubirModelo(familia: Familia): Consejo {
  return {
    id: 'modelo-subir',
    regla: 'modelo-subir',
    nivel: 'info',
    texto: `Parece una tarea difícil (bug sutil, arquitectura o problema ambiguo) y estás en ${nombreFamilia(familia)}. Opus o Fable rinden mejor aquí; si cambias, hazlo ahora, antes de acumular contexto.`,
    acciones: [...DECISIVAS],
  }
}

export function consejoCambioModelo(destino: string, tokens: number): Consejo {
  const familia = familiaDe(destino)
  const nombre = familia === 'otro' ? destino : nombreFamilia(familia)
  return {
    id: 'cambio-modelo',
    regla: 'cambio-modelo',
    nivel: 'aviso',
    texto: `Cambiar a ${nombre} ahora reprocesa ${formatoTokens(tokens)} tokens sin caché (cada modelo tiene la suya). Si es para la próxima tarea, mejor justo después de limpiar.`,
    acciones: [...DECISIVAS],
  }
}

export function consejoFast(): Consejo {
  return {
    id: 'fast',
    regla: 'fast',
    nivel: 'info',
    texto: 'Fast mode activado: en Max se paga con créditos de uso extra aunque te quede cupo, y activarlo en un chat largo reprocesa todo el contexto a tarifa fast. Úsalo para iterar o depurar en vivo; desactívalo con /fast cuando no lo necesites.',
    acciones: [...DECISIVAS],
  }
}

export function consejoPlan(): Consejo {
  return {
    id: 'plan',
    regla: 'plan',
    nivel: 'info',
    texto: 'Parece un cambio de varios archivos o de enfoque incierto: plan mode (Shift+Tab) separa explorar de implementar. Si puedes describir el diff en una frase, sáltatelo.',
    acciones: [...DECISIVAS],
  }
}

export function consejoSubagentes(): Consejo {
  return {
    id: 'subagentes',
    regla: 'subagentes',
    nivel: 'info',
    texto: 'Investigar llena el contexto de lecturas. Pide "usa subagentes para investigar…": exploran en su propio contexto y solo vuelve el resumen.',
    acciones: [...DECISIVAS],
  }
}

export function consejoClaudeMd(lineas: number, ruta: string): Consejo {
  return {
    id: 'claudemd',
    regla: 'claudemd',
    nivel: 'info',
    texto: `${ruta} tiene ${lineas} líneas (la doc recomienda menos de ${LINEAS_CLAUDE_MD}). Pasa a skills lo que no aplique siempre: un CLAUDE.md largo hace que se ignoren reglas.`,
    acciones: [...DECISIVAS],
  }
}

export function consejoTraspasoDisponible(nombre: string): Consejo {
  return {
    id: `traspaso-disponible-${nombre}`,
    regla: 'traspaso',
    nivel: 'info',
    texto: `Hay un traspaso reciente: ${nombre}. ¿Lo adjunto a tu próximo mensaje?`,
    acciones: ['cargar-traspaso', 'cerrar'],
  }
}

export function consejoTraspasoListo(nombre: string): Consejo {
  return {
    id: `traspaso-listo-${nombre}`,
    regla: 'traspaso',
    nivel: 'info',
    texto: `Traspaso adjunto: irá con tu próximo mensaje (${nombre}).`,
    acciones: ['quitar-traspaso'],
  }
}

// ---------------------------------------------------------------------------
// Cola de consejos

const PESO: Record<Nivel, number> = { urgente: 0, aviso: 1, info: 2 }

/** Añade un consejo: sustituye al de la misma regla y ordena por importancia. */
export function encolar(lista: readonly Consejo[], nuevo: Consejo): Consejo[] {
  const resto = lista.filter(c => c.regla !== nuevo.regla)
  return [...resto, nuevo].sort((a, b) => PESO[a.nivel] - PESO[b.nivel])
}

// ---------------------------------------------------------------------------
// Traspasos

/** "Migrar login a OAuth" → "migrar-login-a-oauth" (máx. 40 caracteres). */
export function slug(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
}

/** El título de un traspaso: su primera línea `# …`. */
export function tituloDe(markdown: string): string | null {
  const linea = markdown.split('\n').find(l => /^#\s+\S/.test(l))
  return linea === undefined ? null : linea.replace(/^#\s+/, '').trim()
}

/** `AAAA-MM-DD_HHMM_slug.md`, la convención de fechas del repositorio. */
export function nombreTraspaso(fecha: Date, titulo: string): string {
  const dia = `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`
  const hora = `${dosCifras(fecha.getHours())}${dosCifras(fecha.getMinutes())}`
  return `${dia}_${hora}_${slug(titulo) || 'traspaso'}.md`
}

/** Días que un traspaso se ofrece al abrir un chat en el proyecto. */
export const DIAS_TRASPASO = 7

export const CARPETA_TRASPASOS = '.claude/handoffs'

export const PROMPT_TRASPASO = `Escribe un documento de traspaso para continuar esta tarea en un chat nuevo que no verá esta conversación. Markdown, en español, como mucho unas 400 palabras, con exactamente estas secciones:

# <título corto de la tarea>
## Objetivo
## Estado actual (qué está hecho y verificado)
## Decisiones tomadas (y por qué)
## Archivos relevantes (rutas y qué cambió en cada uno)
## Próximos pasos (lista ordenada y concreta)
## Cómo verificar (comandos de test o build)
## Pendiente o dudas

No incluyas exploraciones descartadas ni salidas de herramientas. Responde solo con el documento.`

export const INSTRUCCIONES_COMPACTAR =
  'Conserva el objetivo de la tarea, las decisiones tomadas y su porqué, la lista completa de archivos modificados, los comandos de test o build que funcionan, los errores pendientes y los próximos pasos. Descarta exploraciones fallidas y salidas largas de herramientas.'

export const MOTIVO_PLAN_LIMPIO =
  'El usuario quiere implementar este plan en un chat limpio. No implementes nada ni vuelvas a llamar a ExitPlanMode: responde únicamente con el plan completo en Markdown, empezando por una línea "# <título>", con objetivo, archivos a tocar, pasos ordenados y cómo verificar.'

export const PROMPT_IMPLEMENTAR = 'Implementa el plan del traspaso adjunto. Verifica cada paso con los comandos que indica.'

/** Contexto que se adjunta al primer mensaje del chat nuevo. */
export function contextoTraspaso(ruta: string, markdown: string): string {
  return `Traspaso de un chat anterior (${ruta}). Úsalo como punto de partida:\n\n${markdown}`
}

/** Instrucción para que Haiku proponga el nombre del chat que se deja. */
export function promptNombre(recientes: readonly string[]): string {
  return `Propón un nombre corto en kebab-case (de 2 a 4 palabras, en español, sin comillas ni explicación) para esta sesión de trabajo:\n\n${recientes.slice(-4).join('\n---\n').slice(0, 4_000)}`
}

/** Texto de entrada del clasificador de tema. */
export function estadoTema(recientes: readonly string[], texto: string): string {
  return `Conversación reciente:\n${recientes.slice(-4).join('\n---\n').slice(-6_000)}\n\nMensaje nuevo:\n${texto.slice(0, 2_000)}`
}

// ---------------------------------------------------------------------------
// Panel de /consejos

export function panelMarkdown(
  m: Medicion | null,
  preset: string,
  u: Umbrales,
  clasificador: string,
  pendientes: readonly Consejo[],
  silenciadas: readonly string[],
): string {
  const estado = m === null ? 'Sin medición todavía (llega tras el primer turno).' : lineaEstado(m)
  const avisos =
    pendientes.length === 0 ? '- Ninguno' : pendientes.map(c => `- **${c.nivel}**: ${c.texto}`).join('\n')
  const mudas = silenciadas.length === 0 ? 'ninguna' : silenciadas.join(', ')
  return `## Estado
${estado}

**Umbrales** (${preset}): aviso a ${formatoTokens(u.suave)}, urgente a ${formatoTokens(u.fuerte)}, pregunta por tarea nueva desde ${formatoTokens(u.temaNuevo)}.
**Clasificador**: ${clasificador}. **Silenciadas**: ${mudas} (\`/consejos reactivar\`).

## Avisos pendientes
${avisos}

## Chuleta
| Situación | Qué hacer |
|---|---|
| Tarea nueva sin relación | \`/clear\` (puedes nombrar el chat que dejas: \`/clear nombre\`) |
| Misma tarea, chat pesado | \`/compact <qué conservar>\` en una pausa, o \`/consejos traspaso\` |
| Dos correcciones fallidas | Esc Esc (\`/rewind\`) o \`/clear\` con un prompt mejor |
| Plan aprobado con mucho contexto | Implementar en chat limpio con el plan como traspaso |
| Tarea difícil o ambigua | Opus o Fable, elegido al empezar |
| Trabajo rutinario | Sonnet; Haiku para subagentes de exploración |
| Falla por saltarse pasos | Sube el esfuerzo: \`/effort high\` |
| Pregunta suelta | \`/btw\`: la respuesta no entra en el contexto |
| Investigar mucho código | "usa subagentes para investigar…" |
`
}

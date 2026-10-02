// Partes puras del clasificador de casos dudosos: las preguntas y el formato
// de Jev (modelo de decisión de TypeSafe, vía Vercel AI Gateway). Las
// llamadas en sí están en register.tsx, que es donde el motor permite usar `$`.
//
// El formato de Jev está SIN VERIFICAR contra su documentación oficial: el
// cuerpo sigue el ejemplo de /v1/evaluate que dan los buscadores, y la
// respuesta se lee de forma defensiva. Si algo falla, se cae a Haiku.

export type Veredicto = 'si' | 'no'

export type Pregunta = {
  /** Etiquetas para Haiku; la primera significa "sí". */
  etiquetas: readonly [string, string]
  /** La misma pregunta, en forma booleana, para Jev. */
  instrucciones: string
}

export const PREGUNTA_TEMA: Pregunta = {
  etiquetas: ['tarea-nueva-sin-relacion', 'continua-la-conversacion'],
  instrucciones:
    '¿El mensaje nuevo empieza una tarea sin relación con la conversación reciente, en lugar de continuarla?',
}

export const PREGUNTA_DIFICIL: Pregunta = {
  etiquetas: ['dificil', 'rutinaria-o-normal'],
  instrucciones:
    '¿Es una tarea de programación difícil (bug sutil, decisión de arquitectura, dominio poco conocido o problema ambiguo) y no un cambio que se pueda describir con precisión?',
}

export const JEV_URL = 'https://ai-gateway.vercel.sh/v1/evaluate'
const JEV_MODELO = 'typesafe-ai/jev'
export const CLAVE_PREGUNTA = 'pregunta'

/** Cuerpo de /v1/evaluate: una pregunta booleana sobre `texto`. */
export function cuerpoJev(pregunta: Pregunta, texto: string): unknown {
  return {
    model: JEV_MODELO,
    state: texto,
    questions: { [CLAVE_PREGUNTA]: { type: 'boolean', instructions: pregunta.instrucciones } },
  }
}

const comoObjeto = (v: unknown): Record<string, unknown> | null =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null

/**
 * Busca la respuesta a `clave` en los sitios donde razonablemente estará.
 * La probabilidad solo se usa cuando el valor es `true`, así que vale tanto si
 * es la de la opción elegida como la de `true`; sin probabilidad, cuenta 1.
 */
export function leerRespuestaJev(
  json: unknown,
  clave: string,
): { valor: boolean; probabilidad: number } | null {
  const raiz = comoObjeto(json)
  if (raiz === null) return null
  const contenedores = [raiz.answers, raiz.results, raiz.questions, raiz.evaluations, raiz.output, raiz]
  for (const contenedor of contenedores) {
    const respuesta = comoObjeto(comoObjeto(contenedor)?.[clave])
    if (respuesta === null) continue
    const valor = respuesta.value ?? respuesta.answer ?? respuesta.result ?? respuesta.decision
    if (typeof valor !== 'boolean') continue
    const p = respuesta.probability ?? respuesta.confidence ?? respuesta.score
    return { valor, probabilidad: typeof p === 'number' ? p : 1 }
  }
  return null
}

/** Veredicto de Jev: sí solo con valor `true` y la confianza mínima. */
export function veredictoJev(leida: { valor: boolean; probabilidad: number }, confianza: number): Veredicto {
  return leida.valor && leida.probabilidad >= confianza ? 'si' : 'no'
}

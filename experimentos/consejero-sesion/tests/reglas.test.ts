import { describe, expect, test } from 'claude-code/testing'

import { cuerpoJev, leerRespuestaJev, PREGUNTA_TEMA, veredictoJev } from '../hooks/clasificador'
import {
  UMBRALES,
  consejoContexto,
  consejoLimite,
  dificultad,
  encolar,
  esCorreccion,
  esTurnoLigero,
  familiaDe,
  formatoTokens,
  lineaEstado,
  nombreTraspaso,
  pareceCompleja,
  pareceInvestigacion,
  slug,
  temaNuevo,
  tituloDe,
  umbralesDe,
} from '../hooks/reglas'

describe('umbrales', () => {
  test('cada preset y el valor por defecto', () => {
    expect(umbralesDe('conservador')).toEqual(UMBRALES.conservador)
    expect(umbralesDe('holgado').fuerte).toBe(600_000)
    expect(umbralesDe('otro')).toEqual(UMBRALES.equilibrado)
    expect(umbralesDe(undefined)).toEqual(UMBRALES.equilibrado)
  })

  test('contexto: nada, aviso y urgente', () => {
    const u = UMBRALES.equilibrado
    expect(consejoContexto(100_000, u)).toBe(null)
    expect(consejoContexto(160_000, u)?.id).toBe('contexto-suave')
    expect(consejoContexto(320_000, u)?.nivel).toBe('urgente')
  })

  test('límites de uso: 75 % avisa, 90 % urgente, 5 h y semanal', () => {
    expect(consejoLimite('five_hour', 60, null)).toBe(null)
    expect(consejoLimite('five_hour', 78, '16:40')?.texto).toContain('16:40')
    expect(consejoLimite('seven_day', 92, null)?.id).toBe('limite-7d-urgente')
  })
})

describe('heurísticas', () => {
  test('correcciones en español e inglés, sin falsos positivos obvios', () => {
    expect(esCorreccion('No, eso no era lo que pedí')).toBe(true)
    expect(esCorreccion('sigue fallando el test de login')).toBe(true)
    expect(esCorreccion('Todavía no compila')).toBe(true)
    expect(esCorreccion("that's wrong, try again")).toBe(true)
    expect(esCorreccion('no sé cómo enfocar la caché, ¿qué opinas?')).toBe(false)
    expect(esCorreccion('añade un test para el logout')).toBe(false)
  })

  test('investigación y tareas complejas', () => {
    expect(pareceInvestigacion('Investiga cómo se gestiona la sesión')).toBe(true)
    expect(pareceInvestigacion('cambia el color del botón')).toBe(false)
    expect(pareceCompleja('Refactoriza el módulo de pagos')).toBe(true)
    expect(pareceCompleja('corrige la errata del título')).toBe(false)
  })

  test('dificultad: difícil, rutinaria o duda para el clasificador', () => {
    expect(dificultad('hay un bug intermitente en el websocket y no sé por qué pasa')).toBe('dificil')
    expect(dificultad('renombra la variable total a importe')).toBe('rutinaria')
    expect(dificultad('vale')).toBe('rutinaria')
    const media =
      'Añade al listado de clientes una columna con la fecha del último pago, ordenable, y que se exporte también en el CSV de la pantalla de cobros'
    expect(dificultad(media)).toBe('duda')
  })

  test('tema nuevo: marca explícita, continuación y duda', () => {
    const recientes = ['arregla el login con OAuth en src/auth', 'He corregido el refresco del token OAuth en auth.ts']
    expect(temaNuevo('Cambiando de tema: prepara el changelog', recientes)).toBe('si')
    expect(temaNuevo('ahora añade tests al refresco del token OAuth', recientes)).toBe('no')
    expect(temaNuevo('vale, sigue', recientes)).toBe('no')
    expect(temaNuevo('diseña el esquema de la base de datos de facturas mensuales', recientes)).toBe('duda')
    expect(temaNuevo('diseña el esquema de facturas', [])).toBe('no')
  })

  test('turno ligero', () => {
    expect(esTurnoLigero(800, 1)).toBe(true)
    expect(esTurnoLigero(5_000, 1)).toBe(false)
    expect(esTurnoLigero(800, 7)).toBe(false)
    expect(esTurnoLigero(undefined, 0)).toBe(false)
  })
})

describe('modelos y formato', () => {
  test('familia del modelo', () => {
    expect(familiaDe('claude-opus-5-5')).toBe('opus')
    expect(familiaDe('Sonnet 5.5')).toBe('sonnet')
    expect(familiaDe('claude-fable-5-1')).toBe('fable')
    expect(familiaDe('opusplan')).toBe('opus')
    expect(familiaDe('claude-haiku-4-5-20251001')).toBe('haiku')
  })

  test('tokens y línea de estado', () => {
    expect(formatoTokens(142_300)).toBe('142K')
    expect(formatoTokens(1_000_000)).toBe('1M')
    expect(formatoTokens(1_250_000)).toBe('1,3M')
    const linea = lineaEstado({
      tokens: 142_300,
      ventana: 1_000_000,
      porcentaje: 14,
      cincoHoras: 38.4,
      sieteDias: 12,
      modelo: 'claude-opus-5-5',
      esfuerzo: 'medium',
    })
    expect(linea).toBe('ctx 142K/1M · 5h 38% · 7d 12% · Opus · medium')
  })
})

describe('cola y traspasos', () => {
  test('encolar sustituye la misma regla y ordena por nivel', () => {
    const u = UMBRALES.equilibrado
    const suave = consejoContexto(160_000, u)
    const fuerte = consejoContexto(320_000, u)
    const limite = consejoLimite('five_hour', 80, null)
    if (suave === null || fuerte === null || limite === null) throw new Error('faltan consejos')
    const cola = encolar(encolar(encolar([], suave), limite), fuerte)
    expect(cola.map(c => c.id)).toEqual(['contexto-fuerte', 'limite-5h-aviso'])
  })

  test('nombre, título y slug del traspaso', () => {
    expect(slug('Migrar el login a OAuth (fase 2)')).toBe('migrar-el-login-a-oauth-fase-2')
    expect(tituloDe('intro\n# Migrar login\n## Objetivo')).toBe('Migrar login')
    expect(tituloDe('sin título')).toBe(null)
    const fecha = new Date(2026, 9, 2, 9, 5)
    expect(nombreTraspaso(fecha, 'Migrar login')).toBe('2026-10-02_0905_migrar-login.md')
    expect(nombreTraspaso(fecha, '¿?')).toBe('2026-10-02_0905_traspaso.md')
  })
})

describe('Jev (formato sin verificar)', () => {
  test('el cuerpo sigue el ejemplo de /v1/evaluate', () => {
    expect(cuerpoJev(PREGUNTA_TEMA, 'texto')).toEqual({
      model: 'typesafe-ai/jev',
      state: 'texto',
      questions: { pregunta: { type: 'boolean', instructions: PREGUNTA_TEMA.instrucciones } },
    })
  })

  test('lee la respuesta en varias formas y aplica la confianza', () => {
    const a = leerRespuestaJev({ answers: { pregunta: { value: true, probability: 0.9 } } }, 'pregunta')
    expect(a).toEqual({ valor: true, probabilidad: 0.9 })
    const b = leerRespuestaJev({ results: { pregunta: { answer: true } } }, 'pregunta')
    expect(b).toEqual({ valor: true, probabilidad: 1 })
    expect(leerRespuestaJev({ nada: 1 }, 'pregunta')).toBe(null)
    expect(leerRespuestaJev('texto', 'pregunta')).toBe(null)
    expect(veredictoJev({ valor: true, probabilidad: 0.6 }, 0.75)).toBe('no')
    expect(veredictoJev({ valor: true, probabilidad: 0.8 }, 0.75)).toBe('si')
    expect(veredictoJev({ valor: false, probabilidad: 0.99 }, 0.75)).toBe('no')
  })
})

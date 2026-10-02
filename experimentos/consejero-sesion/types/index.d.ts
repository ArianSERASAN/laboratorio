/** Importancia de un consejo: decide el orden y el color de la banda. */
export type Nivel = 'info' | 'aviso' | 'urgente'

/** Qué buena práctica dispara el consejo; es también la unidad que se silencia. */
export type Regla =
  | 'contexto'
  | 'correcciones'
  | 'modelo-bajar'
  | 'modelo-subir'
  | 'cambio-modelo'
  | 'limite-5h'
  | 'limite-7d'
  | 'fast'
  | 'plan'
  | 'subagentes'
  | 'claudemd'
  | 'traspaso'

/** Botones que puede llevar un consejo. */
export type Accion =
  | 'compactar'
  | 'limpiar'
  | 'traspaso'
  | 'cargar-traspaso'
  | 'quitar-traspaso'
  | 'silenciar'
  | 'cerrar'

export type Consejo = {
  /** Único por regla y nivel (`contexto-fuerte`): un mismo id no se repite en la sesión. */
  id: string
  regla: Regla
  nivel: Nivel
  texto: string
  acciones: Accion[]
}

/** Lo que muestra el indicador fijo y el panel de /consejos. */
export type Medicion = {
  tokens: number | null
  ventana: number | null
  porcentaje: number | null
  cincoHoras: number | null
  sieteDias: number | null
  modelo: string
  esfuerzo: string | null
}

/**
 * Fichero de traspaso pendiente. Vive en `$.store`, no en `$.state`, porque
 * tiene que sobrevivir a `/clear`; `raiz` evita adjuntarlo en otro proyecto.
 */
export type Traspaso = {
  ruta: string
  raiz: string
  adjuntar: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'consejero-sesion': {
      consejos: Consejo[]
      medicion: Medicion | null
    }
  }
}

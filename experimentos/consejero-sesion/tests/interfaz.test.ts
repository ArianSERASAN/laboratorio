import { expect, mock, test } from 'claude-code/testing'
import type { On, RenderPropsOf } from 'claude-code'

const PLUGIN = 'consejero-sesion'
const SUPERFICIES = ['terminal', 'desktop'] as const

const BANDA: RenderPropsOf['AbovePrompt'] = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 12,
  bodyColumns: 100,
  scroll: { offset: 0, bodyRows: 12 },
  view: {},
}

/** Lo que el motor contesta debajo del plugin en estos tests. */
function motor(on: On, modelo = 'claude-sonnet-5-5'): void {
  mock.store(on)
  mock.clock(on, { now: Date.UTC(2026, 9, 2, 10) })
  on('session.model', () => ({ value: modelo }))
  on('session.root', () => ({ value: '/proyecto' }))
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('prompt.submit', (_$, e) => ({ text: e.text, context: e.context }))
  // el motor no dibuja nada en la banda cuando ningún plugin la usa
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => $.ui.resolve(e).Box({}))
}

const medir = (tokens: number) => ({
  context: { tokens, window: 1_000_000, percent: Math.round(tokens / 10_000) },
  rateLimits: [],
  changed: ['context' as const],
})

const deUsuario = (text: string) => ({ text, origin: { kind: 'composer' as const }, wait: false })

test('160K de contexto: aviso con botones en terminal y escritorio', async ($, on) => {
  motor(on)
  await $.session.measure(medir(160_000))
  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AbovePrompt', props: BANDA })
    expect(await ui.find({ text: /160K tokens/ })).toBeDefined()
    expect(await ui.find({ key: 'compactar' })).toBeDefined()
    expect(await ui.find({ key: 'traspaso' })).toBeDefined()
    await ui.unmount()
  }
})

test('Cerrar quita el aviso y no vuelve a salir por la misma medición', async ($, on) => {
  motor(on)
  await $.session.measure(medir(160_000))
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BANDA })
  expect(await ui.find({ text: /160K tokens/ })).toBeDefined()
  await ui.press({ key: 'cerrar' })
  expect(await ui.find({ text: /160K tokens/ })).toBe(undefined)
  await $.session.measure(medir(170_000))
  expect(await ui.find({ text: /tokens de contexto/ })).toBe(undefined)
  await ui.unmount()
})

test('No volver a avisar silencia la regla', async ($, on) => {
  motor(on)
  await $.session.measure(medir(160_000))
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BANDA })
  expect(await ui.find({ key: 'silenciar' })).toBeDefined()
  await ui.press({ key: 'silenciar' })
  await $.session.measure(medir(320_000))
  expect(await ui.find({ text: /Contexto en/ })).toBe(undefined)
  await ui.unmount()
})

test('dos correcciones seguidas en Sonnet: sugiere rewind, limpiar y subir de modelo', async ($, on) => {
  motor(on, 'claude-sonnet-5-5')
  await $.prompt.submit(deUsuario('No, eso no es lo que pedí'))
  await $.prompt.submit(deUsuario('sigue fallando el mismo test'))
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BANDA })
  expect(await ui.find({ text: /Dos correcciones seguidas/ })).toBeDefined()
  expect(await ui.find({ text: /Opus o Fable/ })).toBeDefined()
  await ui.unmount()
})

test('la banda cede el sitio cuando hay una encuesta', async ($, on) => {
  motor(on)
  await $.session.measure(medir(400_000))
  const visible = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BANDA })
  expect(await visible.find({ text: /Contexto en/ })).toBeDefined()
  await visible.unmount()
  const ui = await $.ui.mount({
    plugin: PLUGIN,
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { ...BANDA, hasSurvey: true },
  })
  expect(await ui.find({ text: /Contexto en/ })).toBe(undefined)
  await ui.unmount()
})

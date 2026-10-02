# Consejero de sesión (mod de Claude Code)

**Pregunta:** ¿puede un mod de Claude Code avisarme, en el momento justo, de
cuándo cambiar de chat, de modelo o de hábito según las buenas prácticas
oficiales, sin estorbar?

**Qué hace:** mide en cada turno el contexto, el modelo, el esfuerzo y las
ventanas de uso de Max. Cuando una buena práctica lo pide, muestra un aviso
sobre el prompt con botones para actuar. **Nunca actúa sin un clic o una
respuesta.**

- **Indicador fijo** bajo el prompt: `ctx 142K/1M · 5h 38% · 7d 12% · Opus · medium`
- **Banda de avisos** con botones: Compactar, Limpiar chat, Traspaso + chat
  nuevo, No volver a avisar, Cerrar.
- **`/consejos`**: panel con el estado, los avisos pendientes y una chuleta.
  `/consejos traspaso` genera un traspaso y abre un chat limpio;
  `/consejos reactivar` deshace los «No volver a avisar».

## Reglas

| Regla | Cuándo salta | Qué propone | Base |
|---|---|---|---|
| Contexto | Supera el umbral suave / urgente | Tarea nueva → limpiar; misma tarea → compactar o traspaso | Oficial (umbral heurístico) |
| Tarea nueva | Prompt sin relación con lo reciente y contexto ≥ umbral | **Pregunta antes de enviar**: chat limpio o aquí | Oficial (`/clear` entre tareas) |
| Correcciones | Dos correcciones seguidas | `/rewind` o limpiar con mejor prompt; en Sonnet/Haiku, subir a Opus/Fable; subir esfuerzo si se salta pasos | Oficial |
| Plan → implementar | Se aprueba un plan con contexto ≥ umbral | **Pregunta**: implementar en chat limpio con el plan como traspaso | Oficial |
| Bajar de modelo | 5 turnos ligeros seguidos en Opus/Fable | Sonnet para la próxima tarea, cambiando al empezarla | Oficial (blog) + heurística |
| Subir de modelo | Tarea difícil en Sonnet/Haiku | Opus o Fable, antes de acumular contexto | Oficial (blog) + clasificador |
| Cambio de modelo | `/model` con la caché caliente y mucho contexto | Avisa de cuántos tokens se reprocesan | Oficial (caché por modelo) |
| Límites Max | Ventana de 5 h o semanal ≥ 75 % / 90 % | Limpiar, Sonnet, subagentes con Haiku; `/rate-limit-options` | Oficial (umbral heurístico) |
| Fast mode | Activado | En Max se paga con créditos extra; activarlo al principio | Oficial |
| Plan mode | Prompt de varios archivos o enfoque incierto | Shift+Tab, salvo que el diff quepa en una frase | Oficial |
| Subagentes | Prompt de «investiga / explora…» | «usa subagentes para investigar…» | Oficial |
| CLAUDE.md | Más de 200 líneas al abrir | Podar o pasar a skills | Oficial |

Cada aviso sale **una vez por chat**; `/clear` lo reinicia.

### Detección híbrida

La heurística local (palabras clave en español e inglés, solapamiento de
vocabulario, tamaño del turno) decide sola los casos claros. Solo en los
**dudosos** se consulta un clasificador:

- **Haiku** (por defecto): integrado y sin configurar. Gasta algo de cupo en
  cada caso dudoso.
- **Jev** (experimental): modelo de decisión de TypeSafe vía Vercel AI
  Gateway. Necesita API key y envía el texto del prompt a Vercel y TypeSafe.
  **El formato de la petición no está verificado** con su documentación
  oficial (no se pudo leer desde la sesión en que se hizo): si falla, avisa una
  vez y usa Haiku. Para cerrarlo hace falta el ejemplo `curl` oficial de
  `/v1/evaluate`.
- **Ninguno**: solo heurística; la pregunta de tarea nueva salta únicamente
  con marcas explícitas («cambiando de tema», «nueva tarea»…).

### Traspasos

Un traspaso es un resumen en Markdown que la sesión genera sobre sí misma
(objetivo, estado, decisiones, archivos, próximos pasos, cómo verificar).
Se guarda en `.claude/handoffs/AAAA-MM-DD_HHMM_slug.md` del proyecto, con un
`.gitignore` propio para que no entre en git, y se adjunta como contexto al
primer mensaje del chat nuevo. Al abrir un chat, el mod ofrece el traspaso
más reciente de los últimos 7 días que no se haya usado.

| Situación | Lo que propone el mod |
|---|---|
| Tarea nueva sin relación | Limpiar (el chat que dejas se nombra solo y sigue en `/resume`) |
| Misma tarea, chat pesado | Compactar o traspaso + chat nuevo |
| Planificar → implementar | Chat limpio con el plan como traspaso |

## Instalación

Requiere Claude Code **v2.1.271 o posterior** (hecho y probado con la 2.1.287).
La API de mods está en acceso anticipado y puede cambiar.

**App de escritorio:** en `~/.claude/settings.json` (el de usuario, no el del
proyecto), con la ruta absoluta a esta carpeta en tu equipo:

```json
{
  "env": {
    "CLAUDE_CODE_PLUGIN_DIRS": "/ruta/a/laboratorio/experimentos/consejero-sesion",
    "CLAUDE_CODE_PLUGIN_DIR_WATCH": "1"
  }
}
```

`CLAUDE_CODE_PLUGIN_DIR_WATCH` es opcional: recarga el mod al guardar cambios.
Abre una sesión nueva para que se cargue.

**Terminal:** `claude --plugin-dir /ruta/a/laboratorio/experimentos/consejero-sesion`

**Configuración:** en `/config` aparecen las filas del plugin: umbrales
(conservador 80K/150K, equilibrado 150K/300K, holgado 300K/600K), clasificador,
confianza mínima de Jev y si preguntar antes de enviar una tarea nueva. La API
key de Jev es un campo sensible: no sale en `/config` y se guarda en el almacén
seguro, no en `settings.json`. No he comprobado cómo la pide Claude Code a un
plugin cargado por carpeta.

## Cómo comprobarlo

```bash
claude plugin validate experimentos/consejero-sesion
claude plugin test experimentos/consejero-sesion
```

## Resultado

- Valida con `claude plugin validate`, compila sin errores con TypeScript
  estricto y pasa 19 tests: 14 de lógica pura y 5 de la banda dibujada en
  terminal y escritorio.
- **Sin probar en una sesión real** (pendiente en la app de escritorio): el
  `/clear` lanzado por el mod, el diálogo de «¿dónde la envío?», la
  generación de traspasos y el reenvío del prompt al chat nuevo. Los tests
  cubren la medición, la banda, Cerrar, Silenciar y la regla de correcciones.

**Aprendido:**

- El validador exige que toda función que recibe `$` esté declarada en el nivel
  superior del módulo; el estado de la conversación viaja en un objeto.
- `$.state` es por sesión; lo que debe sobrevivir a `/clear` (traspaso
  pendiente, reglas silenciadas) va en `$.store`.
- Un prompt reenviado con `asUser: true` llega al modelo como palabras del
  usuario, sin el marco «el plugin envió un mensaje».
- Con ventanas de 1M, el porcentaje de contexto engaña: los umbrales van en
  tokens absolutos.

**Conclusión:** en prueba. Siguiente paso: usarlo una semana en la app de
escritorio y ajustar umbrales y heurísticas con lo que moleste o se escape.

## Fuentes

- [Best practices](https://code.claude.com/docs/en/best-practices): `/clear`
  entre tareas, dos correcciones, subagentes, plan mode, CLAUDE.md conciso.
- [Manage costs](https://code.claude.com/docs/en/costs): Sonnet frente a Opus,
  Haiku en subagentes, CLAUDE.md < 200 líneas, por qué sube el uso en chats largos.
- [Prompt caching](https://code.claude.com/docs/en/prompt-caching): cambiar de
  modelo rompe la caché; `/compact` en pausas naturales; `/rewind` la conserva.
- [Model configuration](https://code.claude.com/docs/en/model-config): alias,
  esfuerzo por defecto (medium en Opus 5.5 y Sonnet 5.5), ventana de 1M.
- [Fast mode](https://code.claude.com/docs/en/fast-mode): créditos de uso
  extra en Max y coste de activarlo a mitad de chat.
- [Manage sessions](https://code.claude.com/docs/en/sessions): `/clear nombre`,
  `/rename`, `/resume`.
- [Choosing a Claude model and effort level](https://claude.com/blog/claude-model-and-effort-level-in-claude-code)
  (blog, 07/07/2026): cuándo subir o bajar de modelo y de esfuerzo.

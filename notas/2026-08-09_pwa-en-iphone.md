# Apps web instaladas en el iPhone: lo que hay que saber

Notas sacadas de montar `experimentos/adiestra` como app instalable.

## Instalar

- Sólo desde **Safari**: compartir → *Añadir a pantalla de inicio*. Chrome o
  Firefox en iOS no ofrecen la opción.
- Hace falta **HTTPS** (o `localhost`). Sin eso no hay service worker ni
  instalación.
- `beforeinstallprompt` no existe en iOS: no se puede ofrecer un botón
  "Instalar", hay que explicar el gesto con palabras.
- Etiquetas que sí importan: `apple-touch-icon` (PNG **cuadrado y opaco**; con
  transparencia salen esquinas negras), `apple-mobile-web-app-capable`,
  `apple-mobile-web-app-title` y `apple-mobile-web-app-status-bar-style`. Con
  `black-translucent` el contenido pasa por debajo de la barra de estado y hay
  que respetar `env(safe-area-inset-top)`.
- `viewport-fit=cover` en el viewport, y `100dvh` en lugar de `100vh` para que
  la barra del navegador no deje la interfaz cortada.

## Guardar datos sin perderlos

- **localStorage no basta.** En una web que se visita poco, Safari puede
  borrar los datos a las pocas semanas de inactividad.
- **IndexedDB + instalación en la pantalla de inicio** es lo fiable. Una app
  instalada tiene su propio almacenamiento y no entra en esa limpieza.
- `navigator.storage.persist()` marca los datos como permanentes. En una
  pestaña normal casi siempre lo deniega; instalada, lo concede.
- El único momento realmente peligroso es cuando el sistema mata la app en
  segundo plano: escribir en `visibilitychange`/`pagehide` y de forma
  **síncrona** (localStorage) es lo que salva el último apunte. Una escritura
  asíncrona en IndexedDB puede no llegar a terminar.
- Aun así, una copia exportable a un archivo es imprescindible: si se pierde
  el teléfono o se desinstala la app, no queda nada.

## Avisos

- Una web instalada en iOS **no puede programar notificaciones locales**. Las
  notificaciones push existen desde iOS 16.4, pero exigen servidor y que la
  app esté instalada.
- Alternativa que funciona sin nada: generar un archivo `.ics` y dejar que el
  usuario lo añada a su calendario, con `VALARM` para el aviso. El sistema se
  encarga del resto.

## Detalles menores que cuestan tiempo

- Un `<input>` con `font-size` menor de 16 px hace que Safari haga zoom al
  enfocarlo.
- `overscroll-behavior: none` en el `body` quita el rebote que descoloca una
  interfaz de app.
- Las fuentes de Google por `@import` rompen el funcionamiento sin conexión:
  hay que descargar el subconjunto y servirlo desde el propio proyecto.
- `color-scheme` en el CSS es lo que hace que los selectores nativos de fecha
  y hora se vean en oscuro.

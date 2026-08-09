# Cuaderno de campo (adiestramiento canino)

App de bolsillo para llevar la agenda, las fichas de los perros, los bonos y
los cobros. Se instala en el móvil como una aplicación más, funciona sin
conexión y guarda todo en el propio teléfono.

Partía de un prototipo de una sola pantalla que dependía de un almacenamiento
prestado por el entorno donde se ejecutaba. Aquí es un proyecto real: se
compila, se despliega y los datos son suyos.

---

## Qué se prueba

Si una aplicación web bien montada (PWA) basta para una herramienta de trabajo
diaria de una persona: instalable, sin conexión, sin servidor, sin cuentas y
sin que los datos se pierdan.

---

## Cómo ejecutarlo

```bash
cd experimentos/adiestra
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # compila a dist/ y sella el service worker
npm run preview  # sirve dist/ para probar la versión final
npm run icons    # regenera los PNG del icono (sólo si cambia el diseño)
```

El service worker sólo entra en juego en la versión compilada; en `npm run dev`
la app no cachea nada, que es lo cómodo mientras se toca el código.

---

## Cómo tenerla en el móvil

Hace falta servirla por HTTPS. El repositorio trae un flujo de GitHub Actions
(`.github/workflows/deploy-adiestra.yml`) que la publica en GitHub Pages en
cada push a `main`.

1. En GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Empuja a `main`. Al terminar el flujo, la app queda en
   `https://<usuario>.github.io/laboratorio/`.
3. En el iPhone, abre esa dirección **en Safari** (no en Chrome), toca el botón
   de compartir y elige **Añadir a pantalla de inicio**.
4. En Android: menú del navegador → **Instalar aplicación**.

A partir de ahí abre a pantalla completa, con su icono, y funciona en el campo
aunque no haya cobertura. Vale cualquier otro alojamiento estático (Netlify,
Vercel, un hosting propio): las rutas son relativas y no dependen de estar en
la raíz del dominio.

---

## Dónde se guardan los datos

- **IndexedDB** es el almacén principal, dentro del navegador del móvil.
- **localStorage** guarda una copia espejo en cada cambio y, además, un
  guardado síncrono cuando el sistema oculta o cierra la app: es el único
  momento en que iOS no garantiza que dé tiempo a terminar una escritura
  normal.
- Con la app instalada se pide **almacenamiento permanente**
  (`navigator.storage.persist()`), que impide que el sistema borre los datos
  para liberar espacio. El estado se ve en Ajustes.
- Cada día, al abrir, se guarda una **copia automática** del cuaderno. Se
  conservan las diez últimas y se pueden restaurar desde Ajustes.
- Desde Ajustes se puede **descargar o compartir una copia** en un archivo
  `.json` y restaurarla luego, fusionándola o sustituyendo lo que haya. Es lo
  único que protege ante la pérdida del teléfono, y conviene hacerlo de vez en
  cuando; la app avisa si hace más de un mes de la última.

Nada sale del móvil salvo que se comparta la copia a mano. No hay servidor,
ni cuentas, ni analítica, ni peticiones a terceros: las tipografías van dentro
del propio proyecto.

---

## Qué hace la app

- **Hoy**: sesiones del día, seguimientos vencidos, próximas citas y el dinero
  pendiente de un vistazo.
- **Agenda**: calendario mensual, sesiones por día y exportación al calendario
  del móvil en `.ics`, con aviso una hora antes. Los avisos de seguimiento
  también se exportan: es la manera de que el iPhone avise, porque una web
  instalada no puede programar notificaciones por su cuenta.
- **Clientes**: fichas del perro y del guía, con buscador que entra también en
  las notas de progreso, filtros por deuda o por falta de próxima cita, y
  llamada o WhatsApp directos.
- **Bonos y programas**: tarjeta de sesiones consumidas, cuánto queda por usar
  y cuánto por cobrar. Aviso al cargar más sesiones de las que quedan.
- **Cobros**: pendiente por cliente, cobros parciales con fecha y método,
  ingresos de los últimos seis meses y deshacer de un cobro mal apuntado.
- **Sesiones repetidas**: crear de golpe una serie semanal o quincenal.
- **Modo claro y oscuro**, automático o fijado a mano.

---

## Decisiones

- **El dinero se calcula, no se guarda.** La verdad son los cobros
  (`payments`), cada uno con su fecha e importe; lo pagado de un bono o de una
  sesión es la suma de los suyos. Así se puede saber cuánto se ingresó en mayo
  y deshacer un cobro sin descuadrar nada. El formato antiguo, que guardaba un
  número suelto, se migra solo al abrir por primera vez.
- **Sin dependencias de interfaz.** React, los iconos y poco más. Los estilos
  son una hoja CSS con variables por función (fondo, tarjeta, texto…), y por
  eso el modo oscuro es sólo otro juego de valores.
- **Service worker propio** en lugar de un plugin: precarga la lista exacta de
  archivos compilados y la versión sale del hash de su contenido, así que cada
  despliegue invalida la caché anterior sin trucos.
- **Rutas relativas en todo** (`base: "./"`), para poder alojarla en cualquier
  sitio.

---

## Estructura

```
src/
  App.jsx           estado, acciones y armazón de la app
  lib/              datos: modelo y migraciones, almacenamiento, .ics, copias
  ui/               piezas compartidas (hoja modal, campos, chapa, fila…)
  forms/            formularios de cliente, bono, sesión, aviso y cobro
  views/            las cuatro pestañas y los ajustes
public/
  fonts/            tipografías locales (subconjunto latino)
  icons/            iconos generados
  sw.js             service worker; la lista de archivos se rellena al compilar
scripts/            generación de iconos y sellado del service worker
```

---

## Qué se ha aprendido

- El almacenamiento del navegador en iOS es fiable **si la app está instalada
  en la pantalla de inicio** y se ha concedido el almacenamiento permanente.
  En una pestaña suelta de Safari, los datos de un sitio poco visitado pueden
  desaparecer a las pocas semanas. De ahí la insistencia en instalarla y en las
  copias.
- Una web instalada no puede programar avisos locales en iPhone. Volcar las
  citas al calendario del sistema resuelve el problema mejor que cualquier
  apaño dentro de la app.
- Guardar al ocultarse la app (`visibilitychange`, `pagehide`) es lo que evita
  perder el último apunte cuando el sistema mata la aplicación en segundo
  plano.

## Pendiente

- Sincronizar entre dos dispositivos sin montar servidor (¿archivo en iCloud
  Drive, elegido a mano?).
- Vista semanal en la agenda para las semanas cargadas.
- Fotos del perro en la ficha, que obligan a pensar en el tamaño del
  almacenamiento y en las copias.

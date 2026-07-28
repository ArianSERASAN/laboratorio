# Informes de visita de obra — herramienta interna

Fecha: 2026-07-28
Cambio de enfoque: deja de ser producto para vender y pasa a ser herramienta
interna. Eso cambia por completo qué hay que decidir.

---

## 1. Qué cambia al ser interno

| | Como producto | Como herramienta interna |
|---|---|---|
| Métrica de éxito | Clientes de pago | Horas de técnico ahorradas |
| Riesgo principal | Que nadie lo compre | Que el equipo no lo use |
| Competencia | Un problema | Una **opción**: comprar en vez de construir |
| Alcance | Mínimo, genérico | Ajustado al formato de informe de la casa |
| Precio | Tiene que cubrir CAC | Irrelevante |

La pregunta ya no es "¿hay mercado?". Es **"¿compensa construirlo pudiendo
comprarlo por 9 € al mes?"**.

---

## 2. El problema real

El coste de una visita de obra no está en la visita. Está en lo que pasa
después: el técnico vuelve al despacho con 40 fotos en el móvil, notas sueltas y
la memoria fresca, y dedica entre 30 y 60 minutos a montar el informe.
Normalmente lo hace al día siguiente, cuando ya no se acuerda de qué era la foto
17.

Consecuencias habituales:

- Informes que salen tarde o no salen.
- Fotos sin contexto que no sirven para justificar nada.
- **Observaciones que se pierden entre visitas.** Lo que se detectó en la visita
  3 nadie lo comprueba en la visita 4.
- Cuando hay que reclamar, defender una certificación o justificar una
  incidencia, no hay trazabilidad con fecha.

El tercer punto es el importante. Los demás son molestia; ése es dinero.

## 3. Aritmética del ahorro

Con supuestos que hay que ajustar a la realidad de la empresa:

- 3 técnicos × 4 visitas/semana = 12 informes/semana
- 45 min por informe = **9 h/semana**
- Coste interno estimado 30 €/h → **~1.100 €/mes**

Si la herramienta baja el informe a 10 minutos, el ahorro es de unas 7 h/semana,
~850 €/mes. Es un caso claro, **pero justifica igual de bien comprar que
construir**. Ese ahorro no es el argumento para construir.

---

## 4. Construir o comprar

El mercado español para esto **ya está resuelto y es barato**:

| Herramienta | Qué hace | Precio |
|---|---|---|
| OBRATEC | Dictas notas, subes fotos, PDF en 10 min. Informes diario, semanal y de visita | desde 9 €/mes |
| PLAVED | Hablas al móvil, transcribe y redacta, geolocaliza fotos, PDF firmable antes de salir de obra | consultar |
| myAEDES | Plantillas de informe con fotos desde móvil/tablet/PC | consultar |
| Archireport | Visitas con fotos y PDF automático tras cada visita | consultar |
| PlanRadar | Gestión de incidencias sobre plano, potente y caro | desde ~35 $/usuario/mes |
| Dalux Field | Equivalente, orientado a constructora grande | a consultar |

Traducido: **por menos de 30 €/mes para todo el equipo ya se resuelve el 80% del
problema**. Construir eso desde cero sería tirar 5-7 semanas de trabajo.

### Cuándo sí compensa construir

Solo por una de estas cuatro razones:

1. **El informe tiene que salir con el formato exacto de la casa** — plantilla,
   logo, estructura, y sobre todo con la **normativa citada** (RITE, REBT,
   RIPCI, CTE) que es lo que distingue un informe técnico de un parte de obra.
   Ninguna app genérica hace esto.
2. **Las observaciones tienen que arrastrarse entre visitas** hasta cerrarse,
   con su responsable y su plazo. Las apps generan documentos; casi ninguna
   gestiona el ciclo de vida de la observación.
3. **Los datos tienen que quedarse en casa** y alimentar otros entregables:
   informes de ITE/IEE, certificados, presupuestos, memorias. Si el dato muere
   en un PDF, hay que teclearlo otra vez.
4. **Confidencialidad o requisitos de cliente** que impidan meter fotos de
   instalaciones en una nube de terceros.

Si ninguna de las cuatro aplica: **comprar y no construir nada**.

### Camino intermedio (el más razonable)

Comprar la captura y construir solo el remate:

- OBRATEC o PLAVED para capturar en obra (fotos, voz, ubicación).
- Un script propio que coge esa salida y la mete en la plantilla de la casa con
  normativa citada, y que guarda las observaciones en base de datos propia.

Es 1-2 semanas de trabajo en vez de 6, y captura el valor que las apps no dan.

---

## 5. Qué haría exactamente la herramienta (si se construye)

### El flujo en obra
1. El técnico abre la visita del proyecto (ya existe, con su histórico).
2. **Lo primero que ve son las observaciones abiertas de la visita anterior**,
   para cerrarlas o mantenerlas. Esto es el núcleo, no un extra.
3. Por cada hallazgo: foto → dictado de 15 segundos → categoría y criticidad.
4. Al salir, pulsa generar. El informe llega al correo.

### El flujo en el despacho
- Revisión y edición del borrador antes de firmar. **Nunca envío automático**:
  el informe lo firma un técnico y responde de él.
- Exportación con la plantilla corporativa.

### Modelo de datos mínimo
```
proyecto        id, nombre, cliente, dirección, tipo
visita          id, proyecto, fecha, técnico, meteo, asistentes, estado
observacion     id, visita_origen, visita_cierre, categoría, criticidad,
                descripción, ubicación_en_obra, responsable, plazo, estado
foto            id, observacion, url, coordenadas, timestamp, anotaciones
```
La tabla que da el valor es `observacion`, no `foto`.

### Decisiones técnicas
- **PWA, no app nativa.** Evita tiendas, revisiones y dos bases de código. La
  cámara y la geolocalización funcionan bien en navegador.
- **Offline obligatorio.** En un sótano o un hueco de ascensor no hay cobertura.
  IndexedDB + cola de subida diferida. Esto es lo que más trabajo da y lo que
  hace fracasar la herramienta si se hace mal.
- **Fotos comprimidas en cliente** antes de subir. 40 fotos de 4 MB por visita
  se convierten en gigas en un mes.
- Audio → transcripción → estructuración con LLM en campos, no en prosa libre.
- PDF por HTML a Chromium headless, reutilizando la plantilla corporativa.

### Esfuerzo realista
A 8 h/semana: **5-7 semanas** para algo usable. El offline y la gestión de fotos
se llevan la mitad.

---

## 6. Riesgos de una herramienta interna

| Riesgo | Comentario |
|---|---|
| **Que no se use.** Es el riesgo número uno | Si el técnico tarda más en usarla que en hacer fotos con el móvil, vuelve al móvil. Regla: capturar un hallazgo debe costar menos de 20 segundos. |
| Mantenimiento eterno | Una herramienta interna no se termina nunca. Hay que asumir 1-2 h/mes indefinidas. |
| Bus factor | Si la construye una sola persona y esa persona se ocupa de otra cosa, la empresa se queda colgada de algo sin soporte. Comprar no tiene ese problema. |
| RGPD | Fotos con trabajadores identificables y geolocalización. Hay que definir retención y base legal. |
| Coste de almacenamiento | Crece siempre. Definir política de archivado desde el día uno. |

---

## 7. Qué decidir antes de escribir código

Preguntas cuya respuesta cambia el diseño:

1. **¿Cuántos técnicos y cuántas visitas por semana?** Con menos de 5 visitas
   semanales, no compensa construir nada: se compra.
2. **¿Qué tipo de visita?** No es lo mismo seguimiento de obra que inspección
   reglamentaria, ITE o levantamiento de instalaciones. Cada una tiene informe
   distinto; hay que elegir **uno** para el MVP.
3. **¿El informe se le entrega al cliente o es de uso interno?** Si es
   entregable, la plantilla y la firma son requisito, no adorno.
4. **¿Hace falta que las observaciones se arrastren entre visitas?** Si la
   respuesta es no, no construyas: compra OBRATEC y cierra el tema.
5. **¿Los datos tienen que alimentar otros entregables?** Es el argumento más
   fuerte a favor de construir.

---

## 8. Recomendación

**Antes de construir nada: dos semanas de prueba real.** Coger OBRATEC (9 €/mes)
y PLAVED, hacer 4 visitas reales con cada uno y comparar el PDF resultante con
el informe que la empresa entrega hoy.

- Si el resultado sirve tal cual → comprar, y no se construye nada.
- Si sirve al 80% pero falta plantilla y normativa → construir **solo la capa de
  plantilla**, 1-2 semanas.
- Si lo que falta es el seguimiento de observaciones entre visitas → entonces sí
  merece la pena construir la herramienta completa, porque eso no se compra.

El error a evitar es empezar por el código. Aquí, las 20 € de una suscripción de
prueba valen más que 40 horas de desarrollo.

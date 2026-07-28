# Ideas descartadas y por qué

Documentado para no volver a evaluarlas dentro de seis meses.
Criterio de descarte: perfil de 5-10 h/semana, self-serve, sin equipo comercial,
capital <3.000 €.

---

## VeriFactu / software de facturación

- **Disparador legal fortísimo:** sociedades desde el 1 ene 2026, autónomos
  desde el 1 jul 2026, multas hasta 50.000 €/ejercicio. La factura electrónica
  B2B de la Ley Crea y Crece se ha retrasado al 1 oct 2027.
- **Motivo del descarte:** la AEAT ofrece una **aplicación gratuita**, y el
  espacio lo ocupan Holded, B2Brouter, Sage, Odoo y decenas de ERPs con equipos
  comerciales. Competir contra "gratis" + incumbentes es inviable en solitario.
- **Reevaluar si:** aparece un nicho vertical desatendido con requisitos de
  facturación muy específicos. No antes.

## Registro horario digital

- **Motivo del descarte:** el disparador legal **no existe todavía**. La
  obligación vigente viene del RDL 8/2019 y admite registro analógico. El Real
  Decreto que exigiría registro digital no manipulable seguía sin publicarse en
  el BOE en junio de 2026, y el **Consejo de Estado emitió dictamen crítico el
  23 de marzo de 2026** ("no procede aprobar el real decreto proyectado"). El
  Gobierno anunció retomarlo en septiembre de 2026.
- Añadido: mercado ya ocupado (Factorial, Sesame, Woffu, Skello y decenas más).
- **Reevaluar si:** el RD se publica en el BOE con requisitos técnicos nuevos
  que los incumbentes no cubran. Incluso entonces, probablemente tarde.

## Canal de denuncias (Ley 2/2023)

- Obligatorio para ≥50 trabajadores desde el 1 dic 2023. Software entre 39 y
  300 €/mes. Sanciones de 30.001 a 300.000 €.
- **Motivo del descarte:** el comprador tiene 50+ empleados → compras, legal,
  DPA, auditoría de seguridad, ciclo largo. Además el producto maneja datos
  ultrasensibles y denuncias anónimas: **el riesgo operativo y legal de una
  brecha es desproporcionado para un desarrollador solo**.

## NIS2

- Transposición parcial (RDL 7/2025), ley completa en tramitación, sanciones
  hasta 10 M€ con responsabilidad personal de administradores, y efecto cascada
  real sobre proveedores (art. 21.2.d).
- **Motivo del descarte:** mercado enterprise puro. La venta requiere
  credibilidad en ciberseguridad, certificaciones y comerciales. Cero encaje
  self-serve.
- **Matiz:** el *efecto cascada* sobre proveedores pequeños (cuestionarios de
  seguridad que las grandes mandan a sus proveedores) sí podría ser un
  micro-SaaS. Queda anotado como idea de segundo orden.

## Herramientas GEO / visibilidad en buscadores IA

- Mercado en ebullición: Profound, KIME, Zerply, Otterly, Mentio (desde
  29 €/mes), LLM Pulse.
- **Motivo del descarte:** categoría de moda, muy financiada, con ventaja de
  first-mover en inglés y **coste variable de API que crece con cada cliente**.
  Márgenes malos y guerra de features contra empresas con equipo. Se llega tarde.

## Factura electrónica LATAM

- México, Brasil, Colombia, Chile y Argentina con regímenes consolidados y
  obligatorios; el problema real declarado es la falta de estándares comunes.
- **Motivo del descarte:** incumbentes locales fuertes (Sovos, SERES, PACs
  autorizados), integración con administraciones tributarias distintas y
  homologaciones. Barrera de entrada regulatoria alta y opaca desde España.
- LATAM se mantiene como **mercado de expansión** para las ideas seleccionadas,
  no como punto de entrada.

## ERP para administradores de fincas

- ~40.000 administradores (estimación de fuente comercial), soluciones de 1-6
  €/propietario/mes, sistemas a medida de 35.000-120.000 €.
- **Motivo del descarte:** el núcleo (contabilidad, juntas, remesas) está
  ocupado por Gesfincas, TAAF, Fincaplus, Netfincas y compañía, con décadas de
  encaje y coste de cambio altísimo. Se vende con comercial y demo, no self-serve.
- **Lo que sí se rescata:** el hueco de mantenimientos legales obligatorios, que
  ningún ERP resuelve bien → ver `2026-07-28_mantenimientos-legales-edificios.md`.

## Copiloto IA genérico para asesorías/gestorías

- ~30.000 despachos, proyectos típicos de 6.000-15.000 € con 6-8 semanas de
  implantación.
- **Motivo del descarte:** esos números describen un **negocio de servicios**,
  no un SaaS. Implantación a medida, integración con A3/Contaplus, y venta
  consultiva. Incompatible con self-serve y con 8 h/semana.
- **Lo que sí se rescata:** las asesorías como **canal de distribución** en
  marca blanca para las ideas seleccionadas.

---

## Regla general extraída

Las tres razones por las que se ha descartado todo lo anterior son siempre las
mismas:

1. **El comprador es demasiado grande** (>50 empleados ⇒ no hay self-serve).
2. **El disparador legal no está firme** (norma sin publicar ⇒ no se construye).
3. **Se compite contra gratis o contra incumbentes con comerciales.**

Antes de añadir cualquier idea nueva a `ideas/`, pasarla por estos tres filtros.

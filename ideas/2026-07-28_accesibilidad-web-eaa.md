# Idea 1 — Cumplimiento de accesibilidad web (EAA) para ecommerce y agencias

**Veredicto: es la apuesta recomendada para empezar.** Mejor relación
urgencia/competencia/esfuerzo del análisis.

---

## El problema

Desde el **28 de junio de 2025** la European Accessibility Act (Directiva UE
2019/882, transpuesta en España por la **Ley 11/2023**) obliga a las empresas
privadas a que sus webs y apps cumplan **WCAG 2.2 nivel AA**. Afecta a
comercio electrónico, banca online, transporte y telecomunicaciones. Solo se
libran las microempresas (<10 empleados **y** <2 M€).

Las sanciones van de **301 € a 1.000.000 €** y —esto importa más que la multa—
una empresa sancionada **pierde el acceso a subvenciones públicas**.

El dueño de una tienda online de 15 empleados no sabe qué es WCAG, no sabe si
cumple, no tiene un desarrollador accesible, y no quiere una consultoría de
3.000 €. Quiere saber si está expuesto y qué hacer.

## Quién paga

1. **Ecommerce y empresas de servicios de 10-200 empleados** con web propia.
   Decide el dueño, el responsable de marketing o el de IT. Compra con tarjeta.
2. **Agencias web y estudios de desarrollo** (canal multiplicador). Cada
   agencia lleva 10-80 webs de clientes. Es el mismo producto vendido en modo
   multi-cliente, y son quienes tienen el miedo más concreto: sus clientes les
   van a preguntar.

## Disparador de compra

- Un cliente, un competidor o un cliente institucional le pregunta si cumple.
- Va a solicitar una subvención y descubre el requisito.
- Recibe una reclamación de un usuario.
- Su agencia le manda el informe del escáner gratuito.

## Por qué hay hueco

El mercado está partido en dos y **ninguna mitad sirve a la pyme española**:

| Segmento | Ejemplos | Por qué no cubre el hueco |
|---|---|---|
| Gratis para devs | axe DevTools, WAVE, Lighthouse, Pa11y | Dan errores técnicos, no un entregable legal. El dueño de la tienda no los entiende. |
| Enterprise | Siteimprove | Precio y ciclo de venta fuera de rango. |
| Overlays | accessiBe, AudioEye (~49 $/mes) | Producto cuestionado: el overlay no da conformidad real y está siendo objeto de litigios. Vender esto es un riesgo reputacional. |
| Consultoría española | Tu Web Accesible, weAAAre | Es un servicio humano, caro y no recurrente. No es self-serve. |

**El hueco:** producto en español, self-serve, que no venda "auditoría" sino
**el paquete de conformidad** — informe priorizado + declaración de
accesibilidad publicable + monitorización continua que avisa cuando una
publicación rompe el cumplimiento.

## Ángulo diferencial (lo que hay que hacer distinto)

1. **No vender un overlay.** Vender diagnóstico + remediación + evidencia.
   Posicionarse explícitamente en contra del overlay es además un ángulo de
   contenido con demanda.
2. **Entregable legal, no lista de errores.** El output estrella es la
   *declaración de accesibilidad* y un informe firmado con fecha, apto para
   presentar ante una inspección o adjuntar a una subvención.
3. **Traducir a euros.** Cada incidencia con su artículo, su gravedad y su
   riesgo de sanción, no con su código WCAG.
4. **Modo agencia.** Panel multi-cliente, informes con marca blanca. Es lo que
   convierte un cliente en veinte.

## MVP (alcance concreto, ~6-8 semanas a 8 h/semana)

- Crawler que recorre hasta N URLs de un dominio.
- Motor de reglas automatizables sobre **axe-core** (open source, cubre
  ~30-40% de los criterios WCAG; el resto requiere revisión manual — **hay que
  decirlo con honestidad en el producto**).
- Informe PDF/HTML en español: incidencias priorizadas por impacto legal, con
  fragmento de código y corrección propuesta (aquí sí encaja el LLM: convertir
  el fallo técnico en instrucción concreta para el desarrollador de la web).
- Generador de declaración de accesibilidad conforme a la norma.
- Reescaneo programado semanal/mensual + email de alerta si empeora.
- Página pública de resultado por dominio (con opt-out) → SEO y viralidad.

Lo que **no** entra en el MVP: revisión manual, lector de pantalla, remediación
automática, app móvil.

## Canal (self-serve, sin comerciales)

- **Escáner gratuito** en portada: metes tu URL, obtienes nota y 3 fallos.
  El informe completo y la monitorización son de pago. Es el mecanismo de
  adquisición completo.
- **SEO programático:** una página por sector ("accesibilidad web para tiendas
  de moda"), por CMS ("cumplir la EAA en WooCommerce / Shopify / PrestaShop"),
  y por criterio WCAG explicado en español llano.
- **SEO informacional de alta intención:** "¿mi web tiene que ser accesible?",
  "multa accesibilidad web", "declaración de accesibilidad ejemplo",
  "European Accessibility Act pymes".
- **Canal agencias:** contenido dirigido a agencias ("cómo responder cuando tu
  cliente te pregunta por la EAA") + programa de reventa.

> Los términos anteriores son **hipótesis**. Antes de escribir código: validar
> volumen y dificultad real en Search Console / Ahrefs / Semrush.

## Precio (propuesta)

| Plan | Precio | Contenido |
|---|---|---|
| Free | 0 € | 1 dominio, 10 URLs, nota + 3 incidencias |
| Pro | 39 €/mes | 1 dominio, 500 URLs, informe completo, declaración, escaneo mensual |
| Business | 99 €/mes | 5 dominios, escaneo semanal, histórico, API |
| Agencia | 249 €/mes | 25 dominios, marca blanca, panel multi-cliente |

## Aritmética de validación

Estimación grosera del universo: en España hay del orden de cientos de miles de
tiendas online, de las que las que superan el umbral de microempresa serán
**varios miles a decenas de miles**. No hace falta acertar la cifra: con
**100 clientes a 39 €** se llega a ~3.900 €/mes recurrentes. Ése es el objetivo
de los primeros 12 meses, y es alcanzable con tráfico orgánico de nicho.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El cumplimiento real requiere revisión manual; lo automatizable es parcial | Ser explícito en el producto. Vender "reducción de riesgo y evidencia", nunca "cumplimiento garantizado". Ofrecer revisión manual como extra puntual. |
| Aparece un actor español bien financiado | La ventaja es el SEO acumulado y el canal de agencias, no el código. |
| Exposición legal por prometer conformidad | Redacción cuidadosa de términos. Nunca certificar. |
| Baja urgencia percibida mientras no haya sanciones sonadas | Apoyarse en la palanca de **subvenciones**, que es inmediata y no depende de que multen a nadie. |

## Métrica de validación (kill criteria)

A los **90 días** del lanzamiento del escáner gratuito:
- ≥ 300 escaneos gratuitos, y
- ≥ 10 clientes de pago.

Si no se cumple, no iterar el producto: **cambiar de idea**.

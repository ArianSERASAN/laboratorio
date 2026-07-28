# Idea 2 — Vigilancia normativa vertical (motor de largo plazo)

**Veredicto: el mejor negocio de los analizados a 3-5 años, pero más lento de
arrancar.** Máxima retención, máximo foso defensivo, competencia sorprendentemente
débil en el segmento self-serve.

---

## El problema

Miles de empresas españolas están obligadas a mantener actualizado un
**registro de requisitos legales aplicables**:

- Toda empresa certificada en **ISO 9001 / 14001 / 45001** debe documentarlo y
  demostrar en cada auditoría que lo revisa periódicamente.
- Industria, alimentación, sanidad, construcción, instalaciones, transporte y
  residuos lo necesitan por regulación sectorial propia.
- Despachos profesionales (asesorías, gestorías, ingenierías) lo necesitan para
  no dar consejo desactualizado a sus clientes.

Hoy esto se resuelve de dos formas, ambas malas: **un Excel que nadie actualiza**,
o **una consultora que cobra 1.500-6.000 €/año** por un PDF trimestral.

## Quién paga

- Responsable de calidad / medioambiente / PRL de una pyme industrial de 20-200
  empleados. Decide y firma él.
- Despacho de ingeniería o asesoría técnica (España tiene del orden de 30.000
  despachos profesionales, mayoritariamente de 3-20 personas — *estimación de
  fuente comercial, verificar contra DIRCE*).
- Consultoras pequeñas de calidad, que lo revenden a su cartera.

## Disparador de compra

- **Auditoría de certificación** (fecha fija, pánico dos semanas antes). Es un
  disparador de calendario perfecto y recurrente cada año.
- Cambio normativo relevante en su sector del que se enteran tarde.
- Una no conformidad en la auditoría anterior.

## Por qué hay hueco

El mercado existente está construido para grandes cuentas: venta consultiva,
contrato anual, factura a 60 días. **Nadie vende esto por 49 €/mes con alta por
tarjeta y sin hablar con un comercial.** Y la materia prima —BOE, 17 boletines
autonómicos, DOUE, resoluciones sectoriales— es **pública y gratuita**.

Es exactamente el tipo de mercado donde un desarrollador solo con buen pipeline
de datos vence a una consultora: la consultora tiene personas leyendo boletines;
él tiene un cron.

## Ángulo diferencial

1. **Verticalizar, no generalizar.** No "vigilancia normativa", sino
   "vigilancia normativa para instalaciones térmicas y frigoríficas" o "para
   industria alimentaria". Un vertical bien resuelto vale más que diez a medias,
   y es lo único que se puede hacer con 8 h/semana.
2. **El entregable es el registro auditable**, no el boletín. Exportable, con
   histórico de versiones, con la fecha de revisión que el auditor va a pedir.
3. **Resumen en lenguaje llano + evaluación de aplicabilidad.** El LLM aquí
   aporta valor real: de 40 páginas de BOE a "esto te afecta si tienes calderas
   >70 kW; tienes hasta el 1 de marzo".
4. **Citación verificable.** Cada afirmación con enlace al BOE y artículo. Sin
   esto, el producto no es vendible a un auditor.

## MVP (~10-14 semanas a 8 h/semana; es el más lento de los recomendados)

- Ingesta diaria del BOE (API/XML) + 2-3 boletines autonómicos + DOUE.
- Clasificación por vertical **uno solo** para empezar.
- Ficha de norma: qué cambia, a quién aplica, desde cuándo, qué hay que hacer.
- Registro de requisitos por cliente: alta/baja, estado, responsable, fecha de
  revisión, export a PDF/Excel para auditoría.
- Alerta por email cuando una norma del registro del cliente cambia.

## Canal

- **SEO programático masivo:** una página por norma (miles), con resumen,
  vigencia, modificaciones y "a quién aplica". Esto es exactamente lo que la
  gente busca: "RD 1027/2007 modificaciones", "periodicidad revisión RITE",
  "qué normativa aplica a una nave industrial".
- **SEO de intención de compra:** "registro de requisitos legales ISO 14001
  plantilla", "vigilancia normativa precio".
- Plantilla gratuita de registro de requisitos legales como lead magnet.

## Precio

| Plan | Precio | Contenido |
|---|---|---|
| Free | 0 € | Consulta de fichas de norma, sin registro propio |
| Pro | 49 €/mes | 1 vertical, registro auditable, alertas, export |
| Despacho | 149 €/mes | Multi-cliente, marca blanca |

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Calidad de la clasificación IA: un falso negativo es una no conformidad del cliente | Revisión humana del vertical inicial. Disclaimers claros. Empezar por un vertical que él domine técnicamente. |
| Ingesta de boletines autonómicos es trabajo sucio y continuo | Empezar solo con BOE + el autonómico de mayor peso del vertical. |
| Ciclo de venta ligado a la auditoría anual | Es también la razón de la retención altísima. |
| Responsabilidad si el cliente incumple | Términos claros: es una herramienta de apoyo, no asesoramiento legal. |

## Por qué encaja especialmente con este perfil

Es el único de los cinco donde el conocimiento sectorial previo del promotor
(edificación, instalaciones, normativa técnica) es una **ventaja injusta
directa**: sabe qué normas importan, sabe a quién le duelen y sabe cómo habla
el comprador. En el resto de ideas parte de cero.

## Métrica de validación

A los **120 días**: ≥ 5.000 visitas orgánicas/mes a fichas de norma y ≥ 8
clientes de pago. Si el SEO programático no despega en 4 meses, el modelo entero
no funciona.

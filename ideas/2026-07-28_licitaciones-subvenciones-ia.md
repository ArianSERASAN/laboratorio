# Idea 5 — Inteligencia de licitaciones y subvenciones con IA de redacción

**Veredicto: el mayor techo económico de la lista y el peor encaje con 5-10
h/semana.** Guardarla como opción de segunda fase o si se dispone de más tiempo.

---

## El problema

Presentarse a contratación pública es un trabajo administrativo brutal. Las
pymes españolas dejan pasar licitaciones que podrían ganar porque:

1. no se enteran a tiempo (fuentes dispersas: PLACSP, BOE, DOUE, perfiles de
   contratante autonómicos y locales),
2. no saben si les encaja sin leer 80 páginas de pliegos,
3. y sobre todo **no tienen a nadie para redactar la memoria técnica**.

Lo mismo con subvenciones: el BDNS publica cientos de miles de convocatorias y
la pyme se entera por su gestor, tarde.

## Quién paga

Pymes que ya venden o quieren vender al sector público: constructoras,
instaladoras, ingenierías, empresas de servicios, consultoras, limpieza,
suministros, tecnología. El sector público licita del orden de **3.000
contratos de tecnología al año** solo en ese vertical.

## Estado del mercado — leer con atención

Este es el vector con **más competencia instalada** del análisis:

| Actor | Posición |
|---|---|
| Infonalia | Alertas desde ~302 €/año, buscador sin límite de actividades |
| Licitify | Monitoriza PLACSP, BOE y perfiles locales, sin permanencia |
| lixAI | Declara 1,1 M de contratos y 620.000 subvenciones del BDNS cruzados con IA |
| Gobierto Contratación | Capa de análisis de competencia y seguimiento |
| Plataforma PYME (Estado) | Buscador **gratuito** oficial |

Es decir: **la alerta ya es una commodity**, y compite con una herramienta
pública gratuita. Entrar a hacer "otro buscador de licitaciones" es entrar a
perder.

## Dónde está realmente el hueco

No en encontrar la licitación. En **ganarla**.

1. **Lectura automática de pliegos.** Subir el PCAP y el PPT y obtener:
   requisitos de solvencia, criterios de valoración con su peso, umbrales,
   documentación exigida, plazos, y un **veredicto de encaje** ("no cumples
   solvencia técnica: piden 3 obras similares >200 k€").
   Esto solo, ya ahorra 3 horas por licitación.
2. **Borrador de memoria técnica** generado a partir de los criterios de
   valoración y del histórico de la propia empresa. Es el trabajo caro y es
   donde la IA aporta valor de verdad.
3. **Inteligencia de competencia:** quién ganó contratos parecidos, a qué baja,
   con qué órgano de contratación. El dato histórico es público y **es el
   único foso real** de este negocio.

## MVP (~14-20 semanas a 8 h/semana — demasiado para el perfil actual)

- Ingesta PLACSP + BDNS (el trabajo pesado, y hay que mantenerlo a diario).
- Perfil de empresa (CPV, solvencia, ámbito) → matching.
- Analizador de pliegos con extracción estructurada y veredicto de encaje.
- Generador de borrador de memoria técnica.
- Alertas.

## Canal

SEO programático de altísimo volumen: una página por licitación, por órgano de
contratación, por CPV y por provincia. Decenas de miles de páginas indexables
con actualización diaria. Es el mejor activo SEO de todas las ideas de la
lista — y también el más caro de mantener.

## Precio

| Plan | Precio |
|---|---|
| Free | Búsqueda y alertas básicas (commodity, sirve de gancho) |
| Pro | 79 €/mes — análisis de pliegos ilimitado, encaje, competencia |
| Equipo | 199 €/mes — memoria técnica asistida, multiusuario |

## Expansión LATAM

Chile (Mercado Público), Colombia (SECOP), México (Compranet) y Perú (SEACE)
tienen datos abiertos comparables. El mismo motor replicado por país. Es la
única idea de la lista con expansión geográfica genuinamente barata.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| **Competencia instalada con años de datos** | No competir en alertas. Entrar solo por análisis de pliegos y redacción. |
| Ingesta de datos frágil y con mantenimiento diario | Es el motivo por el que no cabe en 8 h/semana al principio. |
| Coste variable de LLM por pliego analizado (documentos largos) | Limitar por plan. Extraer estructura antes de pasar al modelo. |
| Un error en el veredicto de encaje le cuesta un contrato al cliente | Presentar siempre como apoyo con las citas del pliego, nunca como decisión. |

## Cuándo retomarla

Si tras validar la Idea 1 o la 3 el promotor puede subir a 20+ h/semana o
reinvertir ingresos, **esta es la que tiene techo de negocio vendible**. Antes,
no.

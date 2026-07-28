# Investigación de mercado — micro-SaaS / SaaS B2B para España + LATAM

Fecha: 2026-07-28
Encargo: encontrar ideas de negocio viables para desarrollar en solitario,
con base para crecer a futuro.

---

## 1. Perfil del emprendedor (restricciones de partida)

| Variable | Valor | Consecuencia directa |
|---|---|---|
| Tiempo | 5-10 h/semana | El producto debe funcionar **desatendido**. Nada con soporte 24/7, onboarding manual ni operativa diaria. |
| Capital | 500-3.000 € | Sin presupuesto de adquisición pagada sostenida. El canal tiene que ser orgánico. |
| Técnico | Full-stack | Ventaja real: puede construir pipelines de datos y producto sin subcontratar. Es su activo más caro. |
| Sector | Abierto | Se prioriza por demanda y competencia, no por afinidad. |
| Modelo | SaaS B2B + micro-SaaS IA | Recurrencia obligatoria. Se descartan servicios y proyectos a medida. |
| Mercado | España + LATAM (español) | Menos competencia que en inglés, precios más bajos, mercado suficiente. |
| Objetivo | Validar rápido | Prioridad: primeros clientes de pago, no tamaño de mercado teórico. |
| Canal | Self-serve, SEO/contenido | **Este es el filtro más restrictivo de todos** (ver §2). |

### 1.1 El filtro que descarta el 80% de las ideas

"Self-serve + 5-10 h/semana" elimina cualquier producto cuyo comprador:

- necesite pasar por compras, legal o un comité,
- exija auditoría de seguridad o DPA negociado,
- tenga ciclo de venta > 30 días,
- no busque en Google el problema (si no lo busca, no hay canal orgánico).

Corolario: el comprador válido es una **empresa de 1 a 50 personas donde el que
decide es el que paga y el que busca en Google**. Autónomo, dueño de pyme,
despacho profesional, responsable de tienda online, jefe de obra. No un CISO
ni un director de RRHH de una empresa de 500 empleados.

### 1.2 El patrón que sí funciona con estas restricciones

1. **Problema con disparador legal o de calendario.** No hay que educar al
   mercado ni crear la necesidad: la ley o una fecha la crean. Reduce el coste
   de adquisición a casi cero.
2. **Dato público como materia prima.** BOE, BDNS, PLACSP, DOUE, catastro,
   boletines autonómicos. Gratis, estructurado, actualizado a diario, y
   convierte al desarrollador en el único cuello de botella (que es su ventaja).
3. **SEO programático.** Un dato público bien modelado genera decenas de miles
   de páginas indexables sin escribir contenido a mano. Es la única forma de
   hacer SEO con 5 h/semana.
4. **Herramienta gratuita como entrada.** Un escáner o comprobador gratuito
   convierte tráfico frío en leads sin comerciales.
5. **Recurrencia por vigilancia, no por uso.** El cliente no paga por usar el
   producto; paga por estar cubierto mientras no lo usa. Retención alta,
   soporte bajo.

---

## 2. Dónde está la demanda ahora mismo (jul 2026)

He rastreado los disparadores regulatorios y de mercado activos. Ordenados por
utilidad para este perfil, no por tamaño.

### 2.1 Accesibilidad digital — European Accessibility Act

- Directiva (UE) 2019/882, aplicable en toda la UE desde el **28 de junio de
  2025**. Transposición española: **Ley 11/2023, de 8 de mayo**.
- Es la primera vez que la accesibilidad web obliga a **empresas privadas**, no
  solo al sector público. Afecta a comercio electrónico, banca online,
  transporte y telecomunicaciones.
- Exclusión: microempresas (<10 empleados **y** <2 M€ de facturación). Es
  decir, el objetivo es la pyme mediana y el ecommerce consolidado.
- Estándar exigido: **WCAG 2.2 nivel AA**.
- Sanciones: de 301 € a 1.000.000 € según gravedad, más **pérdida de acceso a
  subvenciones públicas**.
- Estado del mercado: herramientas maduras pero **en inglés y partidas en dos
  extremos** — o gratuitas para desarrolladores (axe, WAVE, Lighthouse, Pa11y)
  o enterprise (Siteimprove). En el rango medio: AudioEye y accessiBe desde
  ~49 $/mes, Tenon desde ~28 $/mes. En español, casi todo es **consultoría
  humana**, no producto.
- **Hueco identificado:** producto self-serve en español que no venda "una
  auditoría" sino **el entregable legal** (informe de conformidad + declaración
  de accesibilidad + monitorización continua) para ecommerce y agencias web.

### 2.2 Vigilancia normativa (regulatory watch)

- No es una norma nueva: es una obligación **transversal y permanente**. Toda
  empresa certificada en ISO 9001 / 14001 / 45001 debe mantener un registro
  documentado de "requisitos legales aplicables" y evidenciar su actualización
  en cada auditoría. También lo necesitan despachos, industria, sanidad,
  alimentación, construcción e instalaciones.
- Estado del mercado: dominado por **consultoras y servicios caros** (rango
  típico 1.500-6.000 €/año), con interfaces anticuadas y sin producto
  self-serve. Casi nadie vende una suscripción de 39 €/mes con alta por tarjeta.
- Materia prima: BOE, boletines autonómicos (17), DOUE, más resoluciones
  sectoriales. Todo público.
- **Hueco identificado:** el mercado está construido para grandes cuentas. La
  pyme certificada resuelve esto hoy con un Excel y un becario.

### 2.3 Inteligencia de contratación pública y subvenciones

- Datos públicos y masivos: PLACSP, BDNS, BOE, DOUE. Un actor existente
  (lixAI) declara manejar **1,1 M de contratos públicos y 620.000
  subvenciones** del BDNS. El sector público licita del orden de **3.000
  contratos de tecnología al año** solo en ese vertical.
- Precios de referencia: Infonalia desde **302 €/año**; Licitify y lixAI con
  suscripción sin permanencia; Gobierto con capa de análisis de competencia.
- Equivalentes en LATAM con API abierta: Mercado Público (Chile), SECOP
  (Colombia), Compranet (México), SEACE (Perú).
- **Riesgo:** es el vector con **más competencia ya instalada** y con
  incumbentes que llevan años de datos. El hueco no está en "avisarte de la
  licitación" sino en **preparar la oferta**.

### 2.4 EU AI Act — cumplimiento para pymes

- Aplicación plena para sistemas de alto riesgo el **2 de agosto de 2026**; las
  obligaciones del Anexo III se difieren al **2 de diciembre de 2027**.
- El **Artículo 4 (alfabetización en IA)** aplica desde el **2 de febrero de
  2025** y afecta a **cualquier empresa cuyo equipo use ChatGPT, Claude,
  Copilot o Gemini**: eres *deployer* y tienes obligaciones de formación,
  transparencia e inventario.
- Marco simplificado para pymes ampliado a empresas de hasta 750 empleados y
  150 M€. Autoridad supervisora en España: **AESIA**. Multas de alto riesgo
  hasta 15 M€ o el 3% de la facturación (para pymes, la menor de las dos).
- Estado del mercado: saturado de **abogados y formadores**, muy escaso de
  **producto**. El entregable real que piden (inventario de sistemas de IA,
  clasificación de riesgo, evidencias de formación) es literalmente una hoja de
  cálculo hoy.
- **Riesgo:** compra de una sola vez, retención baja si no se convierte en
  vigilancia continua. Y el pico de urgencia es **ahora** (agosto 2026), lo que
  es bueno para validar y malo para construir con calma.

### 2.5 Facturación electrónica y VeriFactu

- VeriFactu: obligatorio para **sociedades desde el 1 de enero de 2026** y para
  **autónomos desde el 1 de julio de 2026**. Multas de hasta 50.000 € por
  ejercicio.
- La factura electrónica B2B de la Ley Crea y Crece se ha **retrasado al 1 de
  octubre de 2027** para no solaparse con VeriFactu.
- **Descartado como idea principal:** la AEAT ofrece una aplicación gratuita, y
  el espacio está ocupado por Holded, B2Brouter, Sage, Odoo y decenas de ERPs.
  Competir en facturación es competir contra "gratis" y contra incumbentes con
  equipo comercial.

### 2.6 Registro horario digital

- Ojo con la desinformación en blogs de vendedores: la obligación vigente
  procede del **RDL 8/2019** (modificó el art. 34 ET), que **admite registro
  digital o analógico** si es fiable.
- El Real Decreto que exigiría registro **digital, personal y no manipulable**
  seguía **sin publicarse en el BOE** a junio de 2026. El **Consejo de Estado
  emitió dictamen crítico el 23 de marzo de 2026** concluyendo que "no procede
  aprobar el real decreto proyectado". El Gobierno anunció retomar la
  tramitación en **septiembre de 2026**.
- **Descartado por ahora:** mercado ya ocupado (Factorial, Sesame, Woffu,
  Skello, decenas de fichajes) y disparador legal **aplazado e incierto**.
  Construir contra una norma que el Consejo de Estado ha tumbado es apostar a
  un calendario que no controlas.

### 2.7 NIS2 y canal de denuncias (Ley 2/2023)

- NIS2: transposición **parcial** vía RDL 7/2025; la Ley de Coordinación y
  Gobernanza de la Ciberseguridad sigue en tramitación. España incumplió el
  plazo (17 oct 2024) y recibió dictamen motivado de la Comisión en mayo de
  2025. Efecto cascada real: el art. 21.2.d) obliga a las entidades esenciales
  a auditar a sus proveedores. Sanciones hasta 10 M€ con responsabilidad
  personal de administradores.
- Canal de denuncias: obligatorio para **≥50 trabajadores desde el 1 de
  diciembre de 2023**. Software entre **39 y 300 €/mes**. Sanciones de 30.001 a
  300.000 €.
- **Descartados para este perfil:** ambos apuntan a empresas de 50+ empleados.
  Eso significa compras, legal, DPA, auditoría de seguridad y ciclo de venta
  largo. Es exactamente lo que el filtro §1.1 excluye. Son buenos negocios,
  pero **no para 8 h/semana sin equipo comercial**.

### 2.8 LATAM — factura electrónica

- México, Brasil, Colombia, Chile y Argentina tienen facturación electrónica
  consolidada y obligatoria en 2026. Chile la exige a todos los contribuyentes
  desde 2018.
- El problema declarado del sector es la **falta de estándares comunes**:
  sintaxis, semántica y validaciones distintas hacen inviable la
  interoperabilidad regional.
- **Descartado como entrada:** es un mercado maduro con incumbentes locales
  fuertes (Sovos, SERES, decenas de PACs). LATAM es una **expansión posterior**,
  no un punto de partida.

### 2.9 Herramientas GEO / visibilidad en buscadores IA

- Mercado "en plena ebullición": Profound, KIME, Zerply, Otterly, y en español
  Mentio (desde 29 €/mes) y LLM Pulse.
- **Descartado:** categoría de moda, muy financiada, first-mover inglés, y con
  el coste variable de API creciendo con cada cliente. Un solo desarrollador a
  8 h/semana llega tarde y con peores márgenes.

### 2.10 Sector edificación / administración de fincas

- Estimación del sector: ~40.000 administradores de fincas en España, en su
  mayoría despachos de 1 a 20 personas, con márgenes ajustados. Alrededor del
  74% de los propietarios prefiere comunicarse por app o web.
- Precios de referencia: 1-6 €/propietario/mes en soluciones tipo Comunio,
  Fincalink o Admincontrol; los sistemas a medida van de 35.000 a 120.000 €.
  Incumbentes de gestión: Gesfincas (IESA), TAAF, Fincaplus, Netfincas.
- ~30.000 despachos profesionales (asesorías, gestorías, contables-laborales)
  de 3 a 20 personas.
- **Valoración mixta:** el ERP de fincas está ocupado y se vende con comercial.
  Pero hay una **rendija self-serve** en el calendario de mantenimientos
  legales obligatorios (RITE, REBT, RIPCI, legionela, ascensores, ITE/IEE), que
  ningún ERP resuelve bien y que genera muchísima búsqueda informacional.

---

## 3. Matriz de puntuación

Escala 1-5. "Ajuste" pondera específicamente 5-10 h/semana + self-serve.

| Idea | Demanda | Urgencia | Competencia (5 = poca) | SEO/self-serve | Facilidad build | Retención | **Ajuste** | **Total** |
|---|---|---|---|---|---|---|---|---|
| Accesibilidad EAA (ecommerce + agencias) | 4 | 5 | 4 | 5 | 4 | 4 | 5 | **31** |
| Vigilancia normativa vertical | 4 | 3 | 5 | 5 | 3 | 5 | 5 | **30** |
| Mantenimientos legales de edificios | 3 | 4 | 5 | 5 | 4 | 5 | 4 | **30** |
| Licitaciones + subvenciones (con IA de oferta) | 5 | 4 | 2 | 5 | 2 | 4 | 3 | **25** |
| Cumplimiento AI Act pymes | 4 | 5 | 4 | 4 | 5 | 2 | 4 | **28** |
| VeriFactu / facturación | 5 | 5 | 1 | 3 | 2 | 5 | 1 | 22 |
| Registro horario | 4 | 2 | 1 | 3 | 3 | 5 | 2 | 20 |
| Canal de denuncias / NIS2 | 4 | 4 | 2 | 2 | 3 | 5 | 1 | 21 |
| Herramientas GEO | 4 | 3 | 1 | 4 | 3 | 3 | 2 | 20 |

---

## 4. Tesis

**El mejor negocio para este perfil no es un producto: es una máquina de
contenido y datos públicos con una suscripción de cumplimiento encima.**

Concretamente:

1. **Entrada rápida (semanas 1-10):** accesibilidad EAA. Escáner gratuito →
   informe → suscripción de monitorización. Es lo más rápido de construir, el
   disparador legal ya está vigente y sancionado, y el canal (agencias web)
   multiplica sin comerciales.
2. **Motor de largo plazo (mes 4 en adelante):** convertir esa base en un
   **hub de cumplimiento digital para la pyme española**, añadiendo AI Act,
   cookies/RGPD y vigilancia normativa. Cada módulo reutiliza el mismo cliente,
   el mismo login y el mismo SEO.
3. **Apuesta alternativa de mayor techo:** licitaciones + subvenciones con IA
   de redacción de oferta. Más mercado, pero más competencia y más operación de
   datos de la que caben en 8 h/semana **al principio**.

Lo que **no** hay que hacer con este perfil: entrar en facturación, fichaje,
canal de denuncias, NIS2 o GEO.

---

## 5. Fuentes

VeriFactu y factura electrónica:
- https://www.b2brouter.net/es/verifactu-obligatorio-autonomos/
- https://www.holded.com/es/blog/autonomos-2026-adaptarse-factura-electronica
- https://gestoriagaliano.com/reglamento-verifactu/

Registro horario:
- https://mifichajelegal.com/blog/real-decreto-registro-horario-digital-mayo-2026-estado-tramitacion-pymes/
- https://www.protime.eu/es-es/noticias/registro-horario-digital-obligatorio-2026

Accesibilidad / EAA:
- https://www.legalitas.com/actualidad/european-accessibility-act
- https://northernbytes.dev/blog/accesibilidad-web-obligatoria-empresas-2026
- https://www.daas-group.com/blog/nueva-normativa-accesibilidad-web/
- https://web-accessibility-checker.com/en/blog/best-accessibility-checker-tools

EU AI Act:
- https://www.hispacolex.com/blog/civil-mercantil/el-ai-act-ya-obliga-en-espana-que-es-a-quien-afecta-y-que-deben-hacer-las-empresas-antes-del-2-de-agosto/
- https://www.javadex.es/blog/eu-ai-act-agosto-2026-checklist-pyme-espana
- https://academiadeia.es/formacion-articulo-4-ai-act/

NIS2 y canal de denuncias:
- https://www.audidat.com/blog/ciberseguridad/nis2/transposicion-espanola-de-nis2-en-2026-obligaciones-plazos/
- https://www.faseconsulting.es/articulos/directiva-nis2-ciberseguridad-empresas-espana-pymes-2026
- https://www.iberley.es/noticias/entra-vigor-obligacion-implantar-un-canal-denuncias-las-empresas-mas-50-empleados-32971
- https://www.emprenemjunts.es/?op=8&n=35821

Licitaciones y subvenciones:
- https://lixai.es/
- https://infonalia.es/
- https://www.licitify.com/sector/software
- https://contratos.gobierto.es/

Sector fincas y despachos:
- https://www.upliora.es/blog/ia-para-administradores-fincas-comunidades-propietarios-espana-2026
- https://systemforge.es/blog/software-comunidad-de-propietarios-administrador-fincas/
- https://www.javadex.es/blog/copiloto-ia-asesorias-gestorias-fiscal-laboral-contable-espana-2026

LATAM y mercado micro-SaaS:
- https://sovos.com/mx/blog/iva/facturacion-electronica-en-latinoamerica-una-senora-madura-en-evolucion-continua/
- https://cristiantala.com/micro-saas-con-ia-5-ideas-que-puedes-empezar-hoy-market-11-8b/
- https://cepymenews.es/micronichos-rentables-2026-sectores-con-baja-competencia-demanda-real/

GEO:
- https://www.inboundcycle.com/blog-de-inbound-marketing/guia-completa-de-herramientas-geo
- https://mentio.tech/blog/analizar-visibilidad-chatgpt

---

## 6. Advertencia sobre la calidad de las fuentes

Buena parte de lo que se publica en español sobre normativa está escrito por
proveedores que venden la solución, y contiene errores. Ejemplo detectado en
esta investigación: varios blogs citan un "Real Decreto-ley 8/2026, de 8 de
marzo" como origen del registro horario. **No existe**: la obligación viene del
RDL 8/2019. Cualquier cifra de mercado de este documento procedente de un blog
comercial (nº de administradores de fincas, nº de despachos, porcentajes de
ahorro) está marcada como estimación y **debe verificarse contra INE, DIRCE o
los colegios profesionales antes de usarla en un plan financiero**.

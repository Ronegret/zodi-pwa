# Zodi v2 — Prompts completos por fase (0 → 8)

Uso: pega primero el **Contexto común** y después el prompt de la fase que toque.
Las fases 0 y 1 ya están hechas en la rama `astro-v2`; sus prompts se incluyen por si hay que rehacerlas o auditarlas.
Estado y decisiones en `v2/docs/PROMPT-CONTINUACION.md`.

---

## CONTEXTO COMÚN (pegar siempre antes de cualquier fase)

Actúa como Arquitecto de Software y experto integral en UX/UI, Motion Design, interacciones web, Frontend/Backend y Astrología.

Proyecto: **Zodi**, app de astrología personal con IA en https://zodi.aibueno.es/ (Vercel). Repo `Ronegret/zodi-pwa`, local `C:\Users\rodri\Desktop\Zodi_Ultimate`.
- Producción (raíz): Next.js 16 + Firebase + Stripe + IA multiproveedor. **No tocar** hasta la Fase 8.
- Nueva versión: carpeta `v2/`, rama `astro-v2`. Astro + TypeScript estricto (islas React), Supabase (proyecto nuevo y limpio, sin migrar usuarios de Firebase), Three.js por escenas, cálculo astrológico real.
- Referencia de diseño: dashboard de AEM Planner (`C:\Users\rodri\Desktop\AEM-Planner`; captura `RN_porfolio_2026\public\assets\aem\screens\desktop-dashboard.webp`): sidebar fija 264 px, topbar con título serif grande, rejilla bento de tarjetas, una paleta, radios grandes, sombra suave, botón flotante de asistente.
- Todo en español (UI y copy). WCAG 2.2 AA obligatorio. Responsive móvil/tablet/escritorio, pixel perfect.

Reglas de trabajo:
- Rama `astro-v2`, commits pequeños por tarea, mensaje `feat(v2): …`. Sin push ni deploy sin mi confirmación.
- Ejecuta y verifica antes de afirmar: `npm run check`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` (desde `v2/`). Si algo falla, muéstralo con su salida.
- Versiones fijadas: TypeScript `~5.9`, ESLint `^9`. No registres `jsx-a11y` dos veces.
- En Windows/Git Bash no uses heredocs largos; crea ficheros con la herramienta de escritura.
- Secretos solo en `v2/.env.local` (ignorado). Nunca en el chat ni en commits.
- Acciones destructivas o que publican requieren confirmación explícita.
- Al terminar cada fase: actualiza `v2/docs/FASE-N-informe.md` (hecho, verificado, riesgos) y `PROMPT-CONTINUACION.md`.

---

## FASE 0 — Cimientos (HECHA, commit a606be5)

**Prompt:**
Crea en `v2/` un proyecto Astro + TypeScript estricto desplegable en Vercel, sin tocar la app Next de la raíz.
1. Rama `astro-v2`. Dependencias: `astro`, `@astrojs/react`, `@astrojs/vercel`, `@astrojs/check`, `react`, `react-dom`, `typescript@~5.9`, `three`; dev: tipos, `eslint@^9`, `@eslint/js@^9`, `typescript-eslint`, `eslint-plugin-astro`, `prettier` + plugin astro, `vitest`, `@playwright/test`, `@axe-core/playwright`.
2. `astro.config.mjs`: `site`, `output: 'server'`, adaptador Vercel, React, prefetch, `security.checkOrigin`. `tsconfig` extiende `astro/tsconfigs/strictest` con alias `@/*`.
3. Estructura: `src/{pages,layouts,components/ui,scenes,lib/astro-engine,lib/supabase,styles}`, `supabase/migrations`, `tests/{unit,e2e}`, `docs`.
4. Tokens CSS (`tokens.css`): superficies, tinta, marca con contraste ≥ 4.5:1, radios, sombra, sidebar 264 px, easing/duración, modo oscuro y `prefers-reduced-motion`.
5. Layouts `Base.astro` (lang es, skip-link, foco visible, `@view-transition`) y `AppShell.astro` (sidebar + topbar + rejilla `auto-fit`; en móvil nav inferior con objetivos de 44 px). Componente `ui/Card.astro`. Páginas `/` y `/app`.
6. Playwright con proyectos mobile/tablet/desktop y test axe (wcag2a, wcag2aa, wcag22aa) de `/` y `/app`. Vitest con alias `@`.
7. `.env.example` (variables Supabase + IA), `.gitignore`, informe `docs/FASE-0-informe.md` con riesgos y limpieza pendiente del repo raíz (sin ejecutarla).

**Aceptación:** `astro check` 0 errores, lint limpio, build OK, axe sin violaciones en los tres tamaños.

---

## FASE 1 — Motor astrológico real (HECHA, commit e4ab516)

**Prompt:**
Implementa en `v2/src/lib/astro-engine/` un motor de carta natal con efemérides reales (dep `astronomy-engine`), puro y testeable, que sustituya el cálculo falso de `lib/astral.ts` de la app antigua (Luna y Ascendente salían de la longitud del nombre de la ciudad).
1. API: `computeNatalChart({ date, time, timeZone, latitude, longitude, houseSystem? })` y `computeNatalChartAt(utc, lat, lon, system)`.
2. Planetas (Sol…Plutón + nodo norte medio): longitud eclíptica tropical aparente de la fecha, signo/grado/minuto, retrogradación (diferencia de longitud ±6 h), casa.
3. Ascendente y MC desde tiempo sidéreo aparente + oblicuidad verdadera. Casas Placidus por iteración (11/12 por arco diurno, 2/3 por arco nocturno, resto por oposición) y signos enteros; |lat| > 66° cae a signos enteros con `houseSystemNote`.
4. Aspectos (conjunción, sextil, cuadratura, trígono, oposición) con orbes 8/5/7/7/8° y +2° con luminares, ordenados por orbe.
5. `localToUtc` con `Intl` (DST). Documenta que no cubre hora solar local anterior a ~1970.
6. Tests: J2000 (Sol 280,37°, Luna ≈223,3°), carta de Einstein (Sol 23°30' Piscis, Luna 14°31' Sagitario, ASC 11°38' Cáncer), invariantes de casas (casa 1 = ASC, casa 10 = MC, opuestas a 180°, cada casa < 90°), retrogradación de Mercurio en 2000, polar, signos enteros, conversión de zonas.

**Aceptación:** todos los tests pasan; tipos estrictos; sin dependencias de DOM.
**Pendiente conocido:** contrastar cúspides Placidus con Astro.com antes de publicarlas.

---

## FASE 2 — Datos y autenticación (Supabase)

**Prompt:**
Construye el backend de v2 sobre Supabase (proyecto nuevo y limpio) con seguridad real.
1. **Esquema** en `v2/supabase/migrations/` (SQL versionado, idempotente donde proceda):
   - `profiles` (id = `auth.users.id`, nombre, usuario único, avatar, fecha/hora/lugar de nacimiento, lat/lon, `time_zone`, idioma `es|en|ca`, tono de lectura, temas favoritos, plan `free|premium|vip`, gems, xp, nivel, racha, referral).
   - `natal_charts` (user_id, input, JSON de la carta, versión del motor, `created_at`).
   - `readings` (user_id, `kind` con los 19 tipos de `ReadingKind` de la app antigua, contenido, modelo, tokens, `created_at`).
   - `usage_limits`/`usage_events` (cuotas diarias por plan para IA).
   - `community_posts`, `comments`, `friendships` (si procede por paridad).
   - `subscriptions` y `gem_transactions` (preparación para Stripe).
2. **RLS** activada en todas las tablas: cada usuario solo lee/escribe lo suyo; lectura pública solo donde esté justificada (posts publicados); escrituras sensibles (gems, plan) solo con service role. Triggers: crear `profiles` al registrarse, `updated_at`. Índices por `user_id` y fechas.
3. **Clientes tipados** en `src/lib/supabase/`: `browser.ts`, `server.ts` (con cookies de Astro, `@supabase/ssr`) y `admin.ts` (service role, solo servidor). Genera tipos con `supabase gen types`.
4. **Auth**: Google OAuth y email/contraseña, recuperación de contraseña, páginas `/auth/login`, `/auth/registro`, `/auth/callback`, cierre de sesión. Formularios accesibles (labels, errores asociados con `aria-describedby`, foco gestionado).
5. **Middleware** (`src/middleware.ts`): valida la sesión de verdad con `supabase.auth.getUser()` (nunca confiar en una cookie sin verificar), protege `/app/**` y `/api/**` privados, redirige a onboarding si falta perfil. Prohibido cualquier token "local_session" o bypass.
6. **API** `/api/*` con Zod para validar entradas, respuestas JSON tipadas, CSRF/origen comprobado, límites de uso por usuario antes de llamar a la IA, errores sin filtrar detalles internos.
7. **Seguridad**: cabeceras (CSP estricta, HSTS, `X-Content-Type-Options`, `Referrer-Policy`) vía `vercel.json` o middleware; secretos solo en variables de entorno de Vercel; documentar rotación.
8. Tests: unitarios de validadores y de límites; pruebas SQL/RLS (intentar leer filas de otro usuario debe fallar); e2e de login con usuario de prueba.
9. Si faltan credenciales en `v2/.env.local`, avanza solo con migraciones, tipos manuales y mocks, y dime exactamente qué variables faltan.

**Aceptación:** un usuario nuevo se registra, se crea su perfil, no puede leer datos ajenos (test RLS), `/app` exige sesión válida, y la carta natal se guarda y recupera por usuario.

---

## FASE 3 — Sistema de diseño, layout y onboarding

**Prompt:**
Lleva el shell de `v2` a producto: sistema de diseño, dashboard estilo AEM y onboarding con datos reales.
1. **Tokens y componentes** (`src/components/ui/`): Button, Card, Badge/Chip, Tabs, Dialog (con trampa de foco y `Esc`), Tooltip, Toast con `aria-live`, Form fields (Input, Select, DatePicker, TimePicker), Skeleton, ProgressBar, Avatar, EmptyState. Estados hover/focus/active/disabled/loading en todos. Tipografía: display serif + cuerpo sans, escala fluida con `clamp`.
2. **Dashboard** (`/app`): sidebar de secciones con iconos y `aria-current`, topbar con saludo y acciones, rejilla bento: "Hoy" (horóscopo + tránsito del día), "Tu carta" (resumen Sol/Luna/ASC), "Compatibilidad", "Racha y XP", "Rituales", gráfico de energía/biorritmo con KPIs y donut accesible (tablas alternativas `<table class="sr-only">`), botón flotante del asistente IA. Móvil: nav inferior; tablet: sidebar colapsada con iconos.
3. **Onboarding** (`/app/onboarding`): pasos con barra de progreso y guardado parcial: nombre y usuario, fecha/hora de nacimiento, **ciudad con geocodificación** (Open-Meteo Geocoding, devuelve lat/lon y zona IANA; debounce, lista accesible `role="listbox"`), tono de lectura, temas, notificaciones. Al terminar calcula y guarda la carta con `astro-engine` y crea el perfil.
4. **Página de carta natal** (`/app/carta`): datos reales del motor (planetas, casas, aspectos) en tablas accesibles; rueda SVG sin interactividad compleja aún (la versión animada llega en Fase 5).
5. Validación de formularios con Zod en cliente y servidor; mensajes de error claros en español.
6. Comparar cúspides Placidus con Astro.com para 3 cartas de referencia y añadir los resultados como tests.
7. Tests e2e: onboarding completo, navegación por teclado completa, axe en todas las páginas y los tres tamaños, sin scroll horizontal a 320 px.

**Aceptación:** dashboard con datos reales del usuario, onboarding que genera su carta, axe 0 violaciones en mobile/tablet/desktop, contraste ≥ 4.5:1.

---

## FASE 4 — Motion design

**Prompt:**
Añade una capa de movimiento coherente y accesible a `v2`.
1. **Sistema de movimiento**: tokens de duración/easing (`--dur`, `--ease`) y presets (entrada, salida, énfasis, resorte) en un único módulo `src/lib/motion/`. Todo respeta `prefers-reduced-motion` (animaciones esenciales reducidas a fundidos instantáneos, nada que parpadee más de 3 veces por segundo).
2. **Transiciones de página**: View Transitions API de Astro con `transition:name` en elementos compartidos (título, tarjeta → detalle) y fallback sin animación.
3. **Scroll**: smooth scroll (Lenis) y revelados al hacer scroll (GSAP ScrollTrigger o `animation-timeline: view()` con fallback). Parallax sutil solo en landing. No romper el foco ni la navegación con teclado; el scroll suave se desactiva con reduced-motion.
4. **Ratón y táctil**: hover magnético en CTAs, tilt 3D en tarjetas, cursor reactivo en el hero; nada de esto es imprescindible para usar la app ni se aplica en táctil.
5. **Microinteracciones**: botones con feedback de presión, checkboxes/switches animados, contadores que suben, barras de progreso, skeletons con shimmer, toasts con entrada/salida, confeti discreto al subir de nivel.
6. **Rendimiento**: animar solo `transform` y `opacity`, `will-change` puntual, sin layout thrash; presupuesto de INP < 200 ms y CLS 0. Medir con Lighthouse y Playwright tracing.
7. Pruebas: e2e con `reducedMotion: 'reduce'` verificando que no hay animaciones, y sin reduced-motion que los elementos acaban en su estado final visible.

**Aceptación:** toda la app tiene movimiento coherente; con reduced-motion no hay animación; CLS 0, INP < 200 ms; axe sigue en 0.

---

## FASE 5 — Escenas 3D (Three.js)

**Prompt:**
Implementa la experiencia 3D lúdica de Zodi con Three.js, modular por escenas.
1. **Arquitectura** `src/scenes/`: `core/` (renderer, loop con `requestAnimationFrame` pausado fuera de pantalla con `IntersectionObserver`, resize, DPR máximo 2, dispose completo de geometrías/materiales/texturas), `materials/toon.ts` (MeshToonMaterial con gradient map de 3–4 tonos), `effects/outline.ts` (`OutlineEffect` de `three/examples/jsm/effects`), `geometry/` (`RoundedBoxGeometry` de `three/examples/jsm/geometries`), y una carpeta por escena con interfaz común `{ mount(canvas), update(dt), dispose() }`.
2. **Escenas**: (a) `hero` — constelación/zodiaco lúdico con signos como cajas redondeadas toon; (b) `natal-wheel` — rueda con planetas posicionados con los datos del motor (longitudes reales), rotación suave y foco al seleccionar un planeta; (c) `tarot` — cartas RoundedBox que se voltean; (d) `sign-of-day` — personaje/objeto del signo del día. Paleta tomada de los tokens CSS.
3. **Carga perezosa**: `client:visible` en la isla, import dinámico de `three`, chunk aparte, fallback estático (imagen/SVG) mientras carga y cuando no hay WebGL o hay `prefers-reduced-motion`/ahorro de datos.
4. **Interacción**: ratón/táctil con raycaster; parallax por puntero/giroscopio opcional; sin atrapar el scroll de la página.
5. **Accesibilidad**: el canvas lleva `role="img"` con `aria-label` descriptivo y una alternativa textual equivalente (lista/tabla de planetas) siempre disponible; cualquier acción 3D tiene un control de teclado equivalente; pausa/stop visible.
6. **Rendimiento**: objetivo 60 fps en móvil medio, ≤ 150 draw calls por escena, texturas ≤ 1024², instancing donde haya repetición, medición con `renderer.info` y Lighthouse; presupuesto de JS de la escena ≤ 250 kB gzip (three tree-shaken).
7. Tests: unitarios de utilidades (conversión longitud → ángulo/posición), e2e que comprueban fallback sin WebGL y que no hay fugas (nº de geometrías estable tras navegar entre páginas).

**Aceptación:** 4 escenas funcionales en estilo toon con contorno, fallback y alternativa accesibles, sin fugas de memoria, rendimiento dentro de presupuesto.

---

## FASE 6 — PDF editorial personalizado

**Prompt:**
Crea la exportación a PDF del perfil astrológico y las lecturas, con diseño editorial que se adapta a cada persona.
1. **Pipeline**: ruta servidor `/api/pdf/[tipo]` (autenticada, con límite de uso) que renderiza una plantilla HTML/CSS de impresión (`@page`, CSS Paged Media) a PDF con Playwright/Chromium (o `@react-pdf/renderer` si Chromium no cabe en el plan de Vercel; justifica la elección). Resultado en streaming y opción de guardar en Supabase Storage con URL firmada.
2. **Plantilla editorial**: portada por signo solar (color y motivo del signo, nombre, fecha/lugar de nacimiento), índice, secciones: resumen (Sol/Luna/ASC), rueda natal en **SVG generado** con las posiciones reales, tabla de planetas y casas, aspectos principales con interpretación, numerología/camino de vida, lectura personalizada de IA (tono elegido), recomendaciones. Cabeceras/pies con número de página, márgenes de sangrado, tipografías embebidas, cuidado de viudas/huérfanas y saltos de página.
3. **Adaptación a datos**: la maquetación cambia según los datos (signo → paleta/ornamento, número de aspectos → una o dos columnas, ausencia de hora de nacimiento → omite casas/ASC y lo explica, idioma es/en/ca).
4. **Accesibilidad del PDF**: PDF etiquetado (estructura, títulos reales, `lang`, texto alternativo de la rueda, orden de lectura, contraste AA, metadatos de título); texto real seleccionable.
5. **UI**: botón "Descargar PDF" en carta y lecturas con estados de carga/error accesibles (`aria-live`), vista previa previa a descargar.
6. Tests: snapshot visual de páginas con Playwright para 3 signos distintos, validación del PDF (páginas, texto extraíble, fuentes embebidas) y de accesibilidad (por ejemplo veraPDF/PAC si es viable).

**Aceptación:** PDF bonito y distinto por persona/signo, con datos reales, etiquetado y descargable desde la app en < 10 s.

---

## FASE 7 — Portar funcionalidades de la app actual

**Prompt:**
Lleva a v2 la paridad funcional con la app Next antigua, reescribiendo en módulos pequeños (nada de ficheros de miles de líneas). Referencias: `components/dashboard/SectionSpecificUI.tsx`, `lib/ai/prompts.ts`, `lib/ai/personalization.ts`, `lib/ai/providers.ts`, `lib/dashboard-sections.ts`, `app/api/**`.
1. **Lecturas IA** (19 `ReadingKind`): un servicio `src/lib/ai/` con prompts por tipo, personalización por perfil/carta real y tono; proveedor principal Claude (modelo configurable por variable), con respaldo opcional; streaming; guardado en `readings`; límites por plan. Los datos astrológicos del prompt salen del `astro-engine`, no de la IA.
2. **Horóscopos** diario/semanal/mensual y **SEO por signo** (`/horoscopo/[signo]`, `/horoscopo-diario/[sign]`): páginas SSR/ISR con metadatos, JSON-LD, `sitemap.xml`, `robots.txt`.
3. **Secciones del dashboard**: tarot (simple y celta), compatibilidad (sinastría con dos cartas reales), sueños, tránsitos (calculados con el motor), numerología, nombre, palma, biorritmo (fórmula real: ciclos 23/28/33 días desde el nacimiento), horóscopo chino (con Año Nuevo Lunar correcto) y maya, runas, cristales, roast, asistente.
4. **Comunidad y amigos**: posts, comentarios, amistades sobre Supabase con RLS y moderación básica.
5. **Pagos**: Stripe (checkout, suscripción, gemas) con webhooks verificados por firma e idempotencia; los cambios de plan/gemas solo vía service role.
6. **Notificaciones**: emails (bienvenida, diario) y push con cron de Vercel protegido por `CRON_SECRET`.
7. **PWA** (manifest, service worker, instalable) y compartir como imagen.
8. Tests por módulo (unitarios de prompts/parsers, integración de webhooks con firmas de prueba, e2e de los flujos críticos).

**Aceptación:** checklist de paridad (cada ruta/función antigua marcada como portada, descartada con motivo, o pendiente); flujos críticos con e2e en verde.

---

## FASE 8 — QA, rendimiento y corte a producción

**Prompt:**
Prepara y ejecuta el lanzamiento de v2 en `zodi.aibueno.es`.
1. **Calidad**: Lighthouse móvil y escritorio ≥ 95 en Rendimiento, Accesibilidad, Buenas prácticas y SEO en landing, dashboard y una escena 3D; Core Web Vitals en verde (LCP < 2,5 s, INP < 200 ms, CLS < 0,1). axe 0 violaciones en mobile/tablet/desktop; prueba manual con NVDA/VoiceOver, navegación solo teclado y zoom 200 %.
2. **Seguridad**: revisión de RLS, de claves expuestas (grep de secretos), CSP sin `unsafe-inline` si es posible, dependencias (`npm audit`), rate limiting, cookies `Secure/HttpOnly/SameSite`, política de privacidad/cookies/RGPD y borrado de cuenta que elimina datos de verdad.
3. **Infra**: proyecto de Vercel para `v2/` (Root Directory `v2`), variables de entorno de producción, previews por PR, monitor (Vercel Analytics/Speed Insights), backups de Supabase.
4. **Limpieza del repo** (pedir confirmación): eliminar `error*.mp4`, duplicados de `ZODI IMAGENES/`, capturas sueltas y objetos corruptos; valorar `git filter-repo` para reducir `.git` solo con mi OK explícito y copia de seguridad previa.
5. **Corte**: redirects 301 de rutas antiguas a las nuevas (sin perder SEO), ensayo en preview, plan de rollback (volver el dominio al deploy anterior), ventana de despliegue, verificación post-deploy (smoke e2e contra producción), y retirada del código Next una vez estable.
6. Entregables: informe final `docs/FASE-8-informe.md` con métricas antes/después, checklist de corte firmado y lista de deuda técnica restante.

**Aceptación:** v2 en producción con métricas dentro de objetivo, rollback probado, sin regresiones en SEO ni en datos de usuarios nuevos.

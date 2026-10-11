# Prompt de continuación — Zodi v2 (Antigravity / Claude Code)

Pega todo lo de abajo como primer mensaje en la nueva herramienta.

---

Actúa como Arquitecto de Software y experto integral en UX/UI, Motion Design, interacciones web, desarrollo Frontend/Backend y Astrología. Continúas un trabajo ya empezado: no lo rehagas, léelo y sigue.

## 1. Proyecto
Zodi es una app de astrología personal con IA, desplegada en https://zodi.aibueno.es/ (Vercel). Repo: `Ronegret/zodi-pwa`, local en `C:\Users\rodri\Desktop\Zodi_Ultimate`.
- **Producción actual (raíz del repo):** Next.js 16 + React 19 + Firebase (Auth/Firestore/Storage) + Stripe + IA en paralelo (Claude/OpenAI/Gemini). PWA con Serwist y Capacitor (Android). NO tocar hasta el corte final. Build siempre con `npm run build` (usa `--webpack`).
- **Nueva versión (carpeta `v2/`, rama `astro-v2`):** reescritura completa. Se desarrolla en paralelo, sin afectar producción.

## 2. Objetivo de v2
1. **Estilo visual: el de Zodi, SIN cambios** (app actual, `app/globals.css`: negro neón, ácido `#b8ff17`, violeta, rosa, cian, oro; Syne + Plus Jakarta Sans + JetBrains Mono; paneles de cristal, halos y rejilla). AEM Planner aporta **solo ideas de estructura**, nunca colores ni tipografía.
2. **Layout:** replantear el dashboard inspirándose en la estructura del dashboard de mi proyecto AEM Planner (`C:\Users\rodri\Desktop\AEM-Planner`, capturas en `C:\Users\rodri\Desktop\RN_porfolio_2026\public\assets\aem\screens\desktop-dashboard.webp`): barra lateral fija de 264 px, título grande, rejilla bento de tarjetas, gráfico con KPIs, donut con leyenda, botón flotante de asistente.
3. **Stack:** Astro + TypeScript estricto (islas de React donde haya interactividad), Supabase (Postgres + RLS + Auth), código modular y escalable.
4. **Visual / 3D / motion:** experiencia inmersiva, todo animado (transiciones de página, scroll, ratón, microinteracciones). Three.js organizado en módulos/"escenas" (`src/scenes/`) usando `MeshToonMaterial`, `OutlineEffect` y `RoundedBoxGeometry` para un estilo lúdico y único.
5. **UX/UI y accesibilidad:** pixel perfect y fluido en móvil, tablet y escritorio. WCAG 2.2 AA (contrastes, lectores de pantalla, foco, `prefers-reduced-motion`) sin sacrificar estética. Las escenas 3D necesitan carga perezosa y fallback estático.
6. **PDF:** exportar perfil astrológico/lecturas en PDF editorial, hermoso y adaptado a los datos de cada persona. Generarlo en servidor desde plantilla HTML/CSS (Playwright/Chromium o `@react-pdf/renderer`): texto real, accesible, no una imagen pegada en un PDF.

## 3. Decisiones ya tomadas
- Supabase: **proyecto nuevo y limpio**, sin migrar usuarios de Firebase.
- v2 en `v2/` dentro del mismo repo (rama `astro-v2`), no sustituir Next hasta la Fase 8.
- Carta natal con **cálculo real** (efemérides), no el pseudoaleatorio actual.

## 4. Estado actual (hecho y commiteado en `astro-v2`)
**Fase 0 — cimientos** (`a606be5`):
- `v2/`: Astro 7 (`output: 'server'`, adaptador `@astrojs/vercel`, prefetch, view transitions nativas), `@astrojs/react`, TypeScript 5.9 `strictest`, alias `@/*` → `src/*`, Three.js instalado.
- Layouts `Base.astro` (skip-link, `lang="es"`) y `AppShell.astro` (sidebar + topbar + grid; en móvil la nav pasa a barra inferior), componente `ui/Card.astro`, tokens en `src/styles/tokens.css` (claro/oscuro, `--dur` a ~0 con reduced-motion). Páginas `/` y `/app`.
- Calidad: ESLint 9 + `jsx-a11y-strict` (vía eslint-plugin-astro), Prettier, Vitest, Playwright + `@axe-core/playwright` en proyectos mobile/tablet/desktop. Verificado: `astro check` 0 errores, lint limpio, build OK, axe sin violaciones en `/` y `/app` (mobile y desktop; tablet sin ejecutar).
- Informe: `v2/docs/FASE-0-informe.md`.

**Fase 1 — motor astrológico** (`e4ab516`), en `v2/src/lib/astro-engine/` (dep: `astronomy-engine`):
- `computeNatalChart({ date:'YYYY-MM-DD', time:'HH:mm', timeZone:'Europe/Madrid', latitude, longitude, houseSystem? })` y `computeNatalChartAt(utcDate, lat, lon, system)`.
- Devuelve Sol, Luna, Mercurio–Plutón y nodo norte medio (signo, grado, minuto, retrógrado, casa), Ascendente, Medio Cielo, 12 cúspides (Placidus o signos enteros; >66° de latitud cae a signos enteros con nota) y aspectos (orbes 8/5/7/7/8°, +2° con luminares).
- `localToUtc` usa solo `Intl` (maneja DST; no conoce hora solar local previa a ~1970).
- 22 tests en `v2/tests/unit/`. Contrastado con J2000 y con la carta de Einstein (Sol 23°30' Piscis, Luna 14°31' Sagitario, ASC 11°38' Cáncer).

**Fase 2 — datos y auth (Supabase)** (`a3d55f2`, `8000890`, `0494d89`, `b995dda`). Hecha **sin credenciales**; detalle y checklist de conexión en `v2/docs/FASE-2-informe.md`:
- `supabase/migrations/` (6 ficheros idempotentes): profiles (trigger al registrarse), natal_charts, readings, usage_limits/usage_events, community_posts, comments, friendships, subscriptions, gem_transactions, stripe_events. RLS en todas; plan/gemas/xp y lecturas solo con service role (permisos por columna). Funciones `consume_ai_quota` (cuota diaria atómica por plan: free 5, premium 40, vip 150), `ai_quota_status`, `apply_gem_transaction` (idempotente), `profile_cards`.
- `src/lib/supabase/`: clientes `browser`/`server` (@supabase/ssr, cookies HttpOnly)/`admin` (service role vía `astro:env/server`), `database.types.ts` escrito a mano (regenerar con `supabase gen types`), `enums.ts`.
- `src/middleware.ts`: `getUser()` en rutas privadas, `/api` privada por defecto (salvo `/api/salud`), CSRF por origen, redirección a onboarding, cabeceras de seguridad. CSP con hashes vía `security.csp` de Astro (no actúa en dev).
- Acceso en `/auth/*` (login, registro, recuperar, nueva-clave, Google PKCE, callback con `code` o `token_hash`, salir por POST). Zod en `src/lib/validation/`. API: `/api/perfil`, `/api/carta`, `/api/uso`, `/api/salud`. Onboarding mínimo en `/app/onboarding` (lat/lon/zona a mano hasta Fase 3) que guarda la carta real; `/app` muestra Sol/Luna/ASC.
- Tests: 30 de RLS contra Postgres real en PGlite (`tests/db/`, roles de Supabase simulados), 55 unitarios nuevos, e2e con Supabase simulado (`tests/e2e/support/mock-supabase.mjs`). Verificado: check 0 errores, lint limpio, 107/107 unitarios, build OK, 54/54 e2e en móvil/tablet/escritorio con axe sin violaciones.
- **Conectado al proyecto real** `mdtgjgfeoudiyotgcxsy` (`af7e970`, `5e17238`; detalle en `FASE-2-informe.md`, sección "Conexión con el proyecto real"):
  - 9 migraciones aplicadas con `node scripts/db/migrate.mjs`, que usa `SUPABASE_DB_URL` (pooler `aws-0-eu-west-1`).
  - Auth configurado: Site URL localhost:4321, redirects a localhost y zodi.aibueno.es, contraseña de 10 caracteres o más con letras y dígitos, y confirmación por correo.
- **Lugares propios con GeoNames** `cities500` (CC BY 4.0, uso comercial con atribución, incluye la zona IANA):
  - Tablas `places` y `place_aliases`, con 236.041 lugares y 91.636 alias en español cargados con `node scripts/places/import.mjs`.
  - RPC `search_places` por rango de índice (0–56 ms).
  - Sustituye a Open-Meteo, que es no comercial. `/api/geocodificar` y el combobox usan esta RPC.

**Fase 3 — diseño, layout y onboarding** (`d012e56` … `72a6536`). Detalle en `v2/docs/FASE-3-informe.md`:
- Sistema visual Zodi en `src/styles/` (tokens, `components.css` con primitivas por clase compartidas por Astro y React). Componentes en `src/components/ui/` (Button, Card, Badge/Chip, Tabs, Dialog nativo, Tooltip, Toast con aria-live, Field/Select, ProgressBar = `<progress>`, Skeleton, Avatar, EmptyState, Icon). Validación Zod en cliente: `src/lib/forms/enhance.ts`. Galería solo dev: `/dev/componentes`.
- AppShell (sidebar 264 / rail / barra inferior, FAB asistente), dashboard bento con datos reales (`src/lib/dashboard/build.ts`: tránsitos del día, Luna, biorritmo, elementos, nivel/XP, rituales), `/app/carta` (rueda SVG + tablas), `/app/ajustes`, placeholders de horóscopo/match/asistente.
- Onboarding de 5 pasos con guardado parcial (`src/lib/onboarding/steps.ts`), ciudad con combobox ARIA + `/api/geocodificar` (Open-Meteo) y alternativa sin JS. Columna nueva `birth_time_known`.
- Placidus contrastado con Swiss Ephemeris en 3 cartas (±2′). Verificado: check 0, lint limpio, 127/127 unitarios, build OK, 85/85 e2e (3 tamaños, axe en todas las páginas y estados).

**Fase 4 — motion** (`e7b2d38`, `cc53103`, `1d42c73`). Detalle en `v2/docs/FASE-4-informe.md`:
- `src/lib/motion/` (tokens CSS/TS sincronizados, presets, `reducedMotion()` = sistema o Ajustes, `client.ts` con Lenis, magnético, tilt, halo, contadores y confeti) y `src/styles/motion.css` (View Transitions con `.vt-title`/`.vt-sign-art`, revelados `.reveal` con `animation-timeline: view()` solo translate/scale, parallax, microinteracciones, `.switch`, red de seguridad de movimiento reducido). Hooks: `Card reveal tilt`, `Button magnetic`, `data-countup`, `data-celebrate`, `data-cursor-glow`.
- Interruptor "Reducir animaciones" en Ajustes. Fuentes precargadas (CLS 0). Verificado: 134/134 unitarios, 106/106 e2e (con y sin reducedMotion, CLS 0, INP < 200 ms), axe 0.

**Fase 5 — escenas 3D** (ver `git log`; detalle en `v2/docs/FASE-5-informe.md`):
- `src/scenes/`:
  - `core/`: Stage (DPR ≤ 2, `forceContextLoss`), bucle pausado fuera de pantalla, BaseScene con dispose completo, paleta leída de `tokens.css` y `sceneSupport()` (pide WebGL y que no haya movimiento reducido ni ahorro de datos).
  - `materials/toon.ts`, `effects/outline.ts`, `geometry/shapes.ts` y `math.ts` (puro, con tests).
  - Escenas: `hero`, `natal-wheel` (con datos reales), `tarot` y `sign-of-day`.
- Islas en `src/components/scenes/` (`useScene`, `SceneFrame`, `HeroZodiac`, `NatalWheel3D`, `TarotOfDay`, `SignOfDay3D`):
  - three se carga con `import()` en un chunk aparte.
  - Alternativa estática (imagen o SVG), canvas `role="img"` y pausa visible.
  - Controles de teclado equivalentes que vienen del servidor (`.js-only`, ocultos con `@media (scripting: none)`).
  - Gancho de dev `window.__zodiScenes[nombre]` con `stats()`, `leftover()` y `remount()`.
- Integradas en:
  - la portada (`client:load`);
  - el dashboard ("Carta del día", `src/lib/tarot/daily.ts`);
  - `/app/carta` (envuelve a la rueda SVG);
  - `/app/horoscopo` (signo de la temporada).
- Verificado:
  - check 0, lint limpio, 155/155 unitarios, build OK (CSP sin `unsafe-inline`).
  - 139/139 e2e en 3 tamaños: sin WebGL, sin JS, movimiento reducido y fugas = 0.
  - Draw calls: hero 40, tarot 4, rueda 86, signo 7 (límite 150).
  - JS de la escena más pesada: unos 137 kB gzip (límite 250).

**Despliegue:**
- `astro-v2` está en GitHub.
- Vercel, proyecto `zodi-pwa`: producción Next desde `main`, intacta.
- Vercel, proyecto nuevo **`zodi-v2`**: Root Directory `v2`, Astro, rama de producción `astro-v2`, dominio `zodi-v2.vercel.app`. Faltan sus variables de entorno (las pega Rodrigo).

## 5. Hallazgos de la app actual (a resolver en v2)
- `lib/astral.ts`: Luna y Ascendente salen de `signs[(seed + birthCity.length) % 12]` (falso). Solo el signo solar es correcto. El horóscopo chino usa el año natural, no el Año Nuevo Lunar.
- `middleware.ts` solo comprueba que exista la cookie `zodi_auth` sin validarla; la API acepta el token literal `"local_session"` y se salta la verificación.
- Repo raíz con ruido: `error.mp4`/`error1.mp4` (~70 MB) versionados, medios duplicados en `ZODI IMAGENES/`, capturas `zodi-*.png` sueltas, `.git` de 157 MB con objetos `tmp_obj_*` corruptos. `.env.local` NO está versionado (bien). No reescribir historial sin confirmación explícita.
- Código monolítico: `components/dashboard/SectionSpecificUI.tsx` (4.100+ líneas), `lib/ai/personalization.ts` (1.300+), `MarketingHome.tsx` (~1.000). Tipos y modelo de datos en `types/zodi.ts` (UserProfile, ReadingKind con 19 tipos de lectura, etc.).

## 6. Limitaciones conocidas / pendientes
- La atribución de GeoNames (CC BY 4.0) es obligatoria. Ya se muestra en el combobox de ciudad; hay que mantenerla en la página de créditos o legal de la Fase 8.
- Tablet en e2e corre en Chromium con viewport de iPad: WebKit no arranca en Windows (falta `icutu77.dll`). Probar Safari en CI Linux.
- Supabase está conectado, pero faltan tres cosas que hace Rodrigo:
  - **SMTP propio.** Recomendado: Resend con DNS de `aibueno.es`. Sin él, Supabase solo envía 2 correos por hora y solo a miembros del equipo.
  - **Google OAuth.** Crear el cliente en Google Cloud y pegar el secreto en Supabase.
  - **Rotar** la clave `sb_secret_…` y la contraseña de la base de datos (pasaron por el chat), y actualizar `v2/.env.local`.
- Vercel `zodi-v2`:
  - Pegar `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en Settings → Environment Variables.
  - Redeploy.
  - Añadir `https://zodi-v2.vercel.app/**` a las Redirect URLs de Supabase.
- 3D:
  - Los 60 fps no se han medido en un móvil real. En headless, la rueda natal da unos 47 fps con el perfil móvil.
  - Los glifos dependen de las fuentes de símbolos del sistema.
- `npm audit`: 8 altas heredadas de Fase 0 (`@astrojs/vercel` → `path-to-regexp`; `eslint-plugin-astro` → `braces`); `audit fix --force` es rompedor, revisar en Fase 8.

## 7. Plan restante
| Fase | Contenido |
|---|---|
| **2. Datos y auth (Supabase)** | Hecha y conectada al proyecto real. Pendiente del usuario: SMTP, Google OAuth, rotación de secretos. |
| **3. Diseño y layout** | Hecha (ver informe). |
| **4. Motion** | Hecha (ver informe). Lighthouse pendiente para Fase 8. |
| **5. Escenas 3D** | Hecha (ver informe). Medir fps en móvil real en Fase 8. |
| **6. PDF editorial** | Plantilla por signo, rueda natal en SVG, secciones según datos, tipografía cuidada, exportación desde el dashboard. |
| **7. Portar funcionalidades** | Lecturas IA, horóscopos y SEO por signo, comunidad, Stripe y gemas, push y emails. |
| **8. QA y corte** | Lighthouse, axe en 3 tamaños, redirects, pruebas de carga en `zodi.aibueno.es`, retirada de Next. |

## 8. Comandos (desde `v2/`)
```
npm run dev          # astro dev
npm run build        # astro build
npm run check        # astro check
npm run lint         # eslint .
npm test             # vitest run (unitarios + RLS en PGlite)
npm run test:e2e     # playwright: mock de Supabase en :54329 + dev server en :4329
node scripts/db/migrate.mjs [--dry-run]   # aplica migraciones pendientes al Supabase real
node scripts/places/import.mjs            # (re)carga GeoNames en places/place_aliases
```

## 9. Reglas de trabajo y trampas
- Trabaja en la rama `astro-v2`; commits pequeños por fase; no hagas push ni cambies producción sin pedírmelo.
- Fija versiones compatibles: TypeScript `~5.9` y ESLint `^9` (TS 7 y ESLint 10 rompen `typescript-eslint` y `jsx-a11y`). No registres `jsx-a11y` dos veces en ESLint (ya lo trae `astro.configs['jsx-a11y-strict']`).
- Windows: en Git Bash los heredocs largos con comillas fallan; crea archivos con la herramienta de escritura de ficheros, no con `cat <<EOF`.
- Antes de afirmar que algo funciona, ejecútalo (check, lint, tests, build, axe). Reporta fallos con su salida.
- Nunca pegues claves en el chat ni las versiones; van en `v2/.env.local` (ignorado por git).
- Idioma de UI y copy: español.
- **CSP estricta en producción** (no actúa en `astro dev`): prohibido `style=""` en el HTML, `define:vars` y estilos en línea de React en SSR. Usar clases, atributos SVG o `<progress>`/`<meter>`. Verificar el build con la función compilada (`.vercel/output/functions/_render.func/dist/server/entry.mjs`, export `fetch`).
- Prettier: formatea solo los ficheros que toques (`npx prettier --write <ficheros>`); hay ficheros de Fase 0 sin formatear y no conviene mezclarlos en otros commits.
- Los e2e nunca usan el Supabase real: Playwright pasa `PUBLIC_SUPABASE_URL` del mock al servidor (process.env manda sobre `.env.local`). Si un e2e necesita un endpoint nuevo de Supabase, añádelo al mock.
- Cambios de esquema: nueva migración en `supabase/migrations/`, idempotente, y su test en `tests/db/rls.test.ts` (reaplica todas las migraciones dos veces). Aplícala al proyecto real con `node scripts/db/migrate.mjs` y actualiza `database.types.ts`.
- Escenas 3D:
  - Nada de `style=""`.
  - Los controles interactivos se renderizan en el servidor, no solo al hidratar, para no perder el foco ni mover el diseño.
  - Cualquier `import` nuevo de `three/addons/...` va también en `vite.optimizeDeps.include` de `astro.config.mjs`. Si no, Vite recarga la página en dev.
- E2e:
  - Tras `login()` o `goto()` a páginas con islas, espera a `load` antes de recorrer con Tab: el HTML llega por streaming.
  - Espera a que la isla pierda el atributo `ssr` antes de pulsar sus controles.
- Acciones destructivas o que publican (borrar archivos del repo raíz, reescribir historial, push, deploy) requieren mi confirmación.

## 10. Primer paso que quiero ahora
1. Si ya están las variables de entorno en Vercel `zodi-v2`, comprueba el despliegue de `astro-v2`:
   - CSP y cabeceras en el preview.
   - Registro → onboarding → carta contra el Supabase real.
2. Sigue con la **Fase 6 (PDF editorial)**:
   - Perfil astrológico en PDF generado en servidor desde una plantilla HTML/CSS, con texto real y accesible.
   - Rueda natal en SVG y estilo Zodi.
   - Exportación desde el dashboard.

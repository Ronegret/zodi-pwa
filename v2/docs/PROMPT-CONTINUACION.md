# Prompt de continuación — Zodi v2 (Antigravity / Claude Code)

Pega todo lo de abajo como primer mensaje en la nueva herramienta.

---

Actúa como Arquitecto de Software y experto integral en UX/UI, Motion Design, interacciones web, desarrollo Frontend/Backend y Astrología. Continúas un trabajo ya empezado: no lo rehagas, léelo y sigue.

## 1. Proyecto
Zodi es una app de astrología personal con IA, desplegada en https://zodi.aibueno.es/ (Vercel). Repo: `Ronegret/zodi-pwa`, local en `C:\Users\rodri\Desktop\Zodi_Ultimate`.
- **Producción actual (raíz del repo):** Next.js 16 + React 19 + Firebase (Auth/Firestore/Storage) + Stripe + IA en paralelo (Claude/OpenAI/Gemini). PWA con Serwist y Capacitor (Android). NO tocar hasta el corte final. Build siempre con `npm run build` (usa `--webpack`).
- **Nueva versión (carpeta `v2/`, rama `astro-v2`):** reescritura completa. Se desarrolla en paralelo, sin afectar producción.

## 2. Objetivo de v2
1. **Layout:** replantear el dashboard inspirándose en el dashboard de mi proyecto AEM Planner (`C:\Users\rodri\Desktop\AEM-Planner`, capturas en `C:\Users\rodri\Desktop\RN_porfolio_2026\public\assets\aem\screens\desktop-dashboard.webp`): barra lateral fija de 264 px, topbar con título serif grande, rejilla bento de tarjetas (lista principal, tareas, gráfico con KPIs, donut con leyenda), una sola paleta, radios generosos, sombra suave, botón flotante de asistente.
2. **Stack:** Astro + TypeScript estricto (islas de React donde haya interactividad), Supabase (Postgres + RLS + Auth), código modular y escalable.
3. **Visual / 3D / motion:** experiencia inmersiva, todo animado (transiciones de página, scroll, ratón, microinteracciones). Three.js organizado en módulos/"escenas" (`src/scenes/`) usando `MeshToonMaterial`, `OutlineEffect` y `RoundedBoxGeometry` para un estilo lúdico y único.
4. **UX/UI y accesibilidad:** pixel perfect y fluido en móvil, tablet y escritorio. WCAG 2.2 AA (contrastes, lectores de pantalla, foco, `prefers-reduced-motion`) sin sacrificar estética. Las escenas 3D necesitan carga perezosa y fallback estático.
5. **PDF:** exportar perfil astrológico/lecturas en PDF editorial, hermoso y adaptado a los datos de cada persona. Generarlo en servidor desde plantilla HTML/CSS (Playwright/Chromium o `@react-pdf/renderer`): texto real, accesible, no una imagen pegada en un PDF.

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

## 5. Hallazgos de la app actual (a resolver en v2)
- `lib/astral.ts`: Luna y Ascendente salen de `signs[(seed + birthCity.length) % 12]` (falso). Solo el signo solar es correcto. El horóscopo chino usa el año natural, no el Año Nuevo Lunar.
- `middleware.ts` solo comprueba que exista la cookie `zodi_auth` sin validarla; la API acepta el token literal `"local_session"` y se salta la verificación.
- Repo raíz con ruido: `error.mp4`/`error1.mp4` (~70 MB) versionados, medios duplicados en `ZODI IMAGENES/`, capturas `zodi-*.png` sueltas, `.git` de 157 MB con objetos `tmp_obj_*` corruptos. `.env.local` NO está versionado (bien). No reescribir historial sin confirmación explícita.
- Código monolítico: `components/dashboard/SectionSpecificUI.tsx` (4.100+ líneas), `lib/ai/personalization.ts` (1.300+), `MarketingHome.tsx` (~1.000). Tipos y modelo de datos en `types/zodi.ts` (UserProfile, ReadingKind con 19 tipos de lectura, etc.).

## 6. Limitaciones conocidas / pendientes
- Cúspides Placidus **no contrastadas** con software de referencia (solo invariantes); compararlas con Astro.com antes de mostrarlas al público.
- Falta el paso ciudad → coordenadas + zona IANA (planeado en Fase 3 con geocodificación; Open-Meteo devuelve también la zona).
- Tablet en e2e corre en Chromium con viewport de iPad: WebKit no arranca en Windows (falta `icutu77.dll`). Probar Safari en CI Linux.
- Supabase real sin conectar: faltan `v2/.env.local`, aplicar migraciones, configurar Auth/Google y regenerar tipos (checklist en `FASE-2-informe.md`). La RLS solo se ha probado en PGlite.
- `npm audit`: 8 altas heredadas de Fase 0 (`@astrojs/vercel` → `path-to-regexp`; `eslint-plugin-astro` → `braces`); `audit fix --force` es rompedor, revisar en Fase 8.

## 7. Plan restante
| Fase | Contenido |
|---|---|
| **2. Datos y auth (Supabase)** | Hecha en código y tests. Pendiente: conectar el proyecto `mdtgjgfeoudiyotgcxsy` (variables en `v2/.env.local`: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), `supabase db push`, Auth/Google, `gen types`. |
| **3. Diseño y layout** | Tokens y componentes base, shell estilo AEM completo, geocodificación de lugar de nacimiento, onboarding, WCAG AA desde el principio. |
| **4. Motion** | View Transitions, scroll (Lenis o GSAP ScrollTrigger), microinteracciones, tiempo de movimiento unificado, modo reducido. |
| **5. Escenas 3D** | `src/scenes/`: hero zodiacal, rueda de carta natal, tarot, signo del día. Toon + outline + RoundedBox, carga perezosa, presupuesto de rendimiento. |
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
```

## 9. Reglas de trabajo y trampas
- Trabaja en la rama `astro-v2`; commits pequeños por fase; no hagas push ni cambies producción sin pedírmelo.
- Fija versiones compatibles: TypeScript `~5.9` y ESLint `^9` (TS 7 y ESLint 10 rompen `typescript-eslint` y `jsx-a11y`). No registres `jsx-a11y` dos veces en ESLint (ya lo trae `astro.configs['jsx-a11y-strict']`).
- Windows: en Git Bash los heredocs largos con comillas fallan; crea archivos con la herramienta de escritura de ficheros, no con `cat <<EOF`.
- Antes de afirmar que algo funciona, ejecútalo (check, lint, tests, build, axe). Reporta fallos con su salida.
- Nunca pegues claves en el chat ni las versiones; van en `v2/.env.local` (ignorado por git).
- Idioma de UI y copy: español.
- Prettier: formatea solo los ficheros que toques (`npx prettier --write <ficheros>`); hay ficheros de Fase 0 sin formatear y no conviene mezclarlos en otros commits.
- Los e2e nunca usan el Supabase real: Playwright pasa `PUBLIC_SUPABASE_URL` del mock al servidor (process.env manda sobre `.env.local`). Si un e2e necesita un endpoint nuevo de Supabase, añádelo al mock.
- Cambios de esquema: nueva migración en `supabase/migrations/`, idempotente, y su test en `tests/db/rls.test.ts` (reaplica todas las migraciones dos veces).
- Acciones destructivas o que publican (borrar archivos del repo raíz, reescribir historial, push, deploy) requieren mi confirmación.

## 10. Primer paso que quiero ahora
1. Si ya existe `v2/.env.local` con credenciales: conecta Supabase siguiendo la checklist de `v2/docs/FASE-2-informe.md` (migraciones, Auth, Google, `gen types`, Advisors) y verifica registro → onboarding → carta contra el proyecto real.
2. Después, **Fase 3**: sistema de diseño, dashboard estilo AEM, onboarding por pasos con geocodificación (Open-Meteo) y página `/app/carta`.

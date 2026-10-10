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

## 5. Hallazgos de la app actual (a resolver en v2)
- `lib/astral.ts`: Luna y Ascendente salen de `signs[(seed + birthCity.length) % 12]` (falso). Solo el signo solar es correcto. El horóscopo chino usa el año natural, no el Año Nuevo Lunar.
- `middleware.ts` solo comprueba que exista la cookie `zodi_auth` sin validarla; la API acepta el token literal `"local_session"` y se salta la verificación.
- Repo raíz con ruido: `error.mp4`/`error1.mp4` (~70 MB) versionados, medios duplicados en `ZODI IMAGENES/`, capturas `zodi-*.png` sueltas, `.git` de 157 MB con objetos `tmp_obj_*` corruptos. `.env.local` NO está versionado (bien). No reescribir historial sin confirmación explícita.
- Código monolítico: `components/dashboard/SectionSpecificUI.tsx` (4.100+ líneas), `lib/ai/personalization.ts` (1.300+), `MarketingHome.tsx` (~1.000). Tipos y modelo de datos en `types/zodi.ts` (UserProfile, ReadingKind con 19 tipos de lectura, etc.).

## 6. Limitaciones conocidas / pendientes
- Cúspides Placidus **no contrastadas** con software de referencia (solo invariantes); compararlas con Astro.com antes de mostrarlas al público.
- Falta el paso ciudad → coordenadas + zona IANA (planeado en Fase 3 con geocodificación; Open-Meteo devuelve también la zona).
- Tests e2e de tablet sin ejecutar.

## 7. Plan restante
| Fase | Contenido |
|---|---|
| **2. Datos y auth (Supabase)** | Esquema SQL + migraciones en `v2/supabase/migrations/`, RLS por usuario, cliente tipado servidor/navegador (`src/lib/supabase/`), auth Google + email, middleware que valide la sesión de verdad, API protegida, límite de uso para la IA. Variables en `v2/.env.local` (ver `.env.example`): `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. |
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
npm test             # vitest run
npm run test:e2e     # playwright test (levanta el dev server en :4321)
```

## 9. Reglas de trabajo y trampas
- Trabaja en la rama `astro-v2`; commits pequeños por fase; no hagas push ni cambies producción sin pedírmelo.
- Fija versiones compatibles: TypeScript `~5.9` y ESLint `^9` (TS 7 y ESLint 10 rompen `typescript-eslint` y `jsx-a11y`). No registres `jsx-a11y` dos veces en ESLint (ya lo trae `astro.configs['jsx-a11y-strict']`).
- Windows: en Git Bash los heredocs largos con comillas fallan; crea archivos con la herramienta de escritura de ficheros, no con `cat <<EOF`.
- Antes de afirmar que algo funciona, ejecútalo (check, lint, tests, build, axe). Reporta fallos con su salida.
- Nunca pegues claves en el chat ni las versiones; van en `v2/.env.local` (ignorado por git).
- Idioma de UI y copy: español.
- Acciones destructivas o que publican (borrar archivos del repo raíz, reescribir historial, push, deploy) requieren mi confirmación.

## 10. Primer paso que quiero ahora
Empieza la **Fase 2**: esquema SQL y migraciones de Supabase (profiles, readings, natal_charts, usage_limits, etc. con RLS), cliente tipado, auth y middleware de sesión real. Si aún no hay credenciales en `v2/.env.local`, avanza solo con el esquema y las migraciones sin conectar.

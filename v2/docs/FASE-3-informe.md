# Fase 3 — Sistema de diseño, layout y onboarding

Commits en `astro-v2`, sin push:

| Commit | Contenido |
|---|---|
| `d012e56` | Cúspides Placidus |
| `0821c5e` | Sistema visual |
| `90f5314` | Componentes |
| `e39e5df` | Lógica del dashboard |
| `25c48a2` | Shell, dashboard y carta |
| `a4d22ba` | Onboarding y ajustes |
| `fb96337` | e2e |
| `72a6536` | Fixture |

## Decisión de diseño (corregida a mitad de fase)
**El estilo visual es el de Zodi**, el de la app actual (`app/globals.css`):
- **Colores:** negro neón, ácido `#b8ff17`, violeta, rosa, cian y oro.
- **Superficies:** paneles de cristal oscuro.
- **Fondo:** halos de color y rejilla de 40 px.
- **Tipografías:** Syne extrabold, Plus Jakarta Sans y JetBrains Mono.
- **Etiquetas:** mayúsculas espaciadas en lima.

De AEM Planner solo se toma la **estructura**: sidebar de 264 px, título grande, rejilla bento, línea con KPIs, donut con leyenda y botón flotante. Los tokens marfil/índigo de la Fase 0 se han sustituido.

Para cumplir AA sin cambiar la paleta:
- El texto secundario es sólido `#9a9a99` (6,8:1).
- El violeta para texto es `#b98aff` (7,4:1).
- Los bordes de los controles son `#6e6e85` (3,9:1).
- Sobre lima, el texto siempre va en negro.

## Hecho

### Sistema de diseño (`src/styles/`, `src/components/ui/`)
- **Tokens** (`tokens.css`): escala fluida con `clamp`, espaciado, radios de la app actual, brillos y colores de gráfico. Las fuentes están autoalojadas con `@fontsource`, así que la CSP mantiene `font-src 'self'`.
- **Primitivas por clase** (`components.css`): las comparten los componentes Astro y las islas React. Todas tienen estados hover, focus, active, disabled y, donde aplica, loading.
- **Componentes:**
  - Button (`.astro` y `.tsx`), Card, Badge/Chip, chips seleccionables y tarjetas de opción. Estos tres últimos funcionan sin JS.
  - Field y SelectField.
  - ProgressBar: es un `<progress>` nativo, porque la CSP no admite `style=""`.
  - Skeleton, Avatar, EmptyState e Icon (un set de iconos propio).
- **Islas interactivas:**
  - Tabs: patrón APG.
  - Dialog: `<dialog>` nativo con ciclo de foco, Esc y devolución del foco al botón que lo abrió.
  - Tooltip: Esc, se puede pasar el puntero por encima y usa `aria-describedby`.
  - Toasts: región `aria-live`, se pausan con hover o foco y tienen botón de cerrar.
- **Fecha y hora:** se usan `input type=date|time` nativos. Es la opción más accesible y funciona con el teclado del móvil.
- **Validación en cliente** (`lib/forms/enhance.ts`): usa los mismos esquemas Zod que el servidor y pinta el mismo marcado de errores (campo y resumen con foco). El servidor revalida siempre.
- **Galería** en `/dev/componentes`: solo existe en desarrollo y en producción da 404. La usan los e2e de axe y de teclado.

### Layout y dashboard
- **AppShell:**
  - Escritorio (≥ 1100 px): sidebar con logo, navegación con `aria-current`, usuario con plan y gemas, y cerrar sesión.
  - Tablet: rail con icono y etiqueta.
  - Móvil (< 720 px): barra inferior.
  - En todos los tamaños: título grande en Syne, fecha en la etiqueta superior y botón flotante del asistente.
- **Dashboard** (`/app`), rejilla bento de 12/2/1 columnas:
  - **Hoy:** tránsitos reales sobre la carta, con orbe ≤ 3°, y fase y signo de la Luna.
  - **Tu carta:** imagen neón del signo solar y Sol, Luna y Ascendente.
  - **Energía:** biorritmo de 14 días (ciclos de 23/28/33 días) con KPIs y tendencia; las series se distinguen por color y trazo, con tabla oculta para lectores de pantalla.
  - **Elementos:** donut con leyenda y tabla, que se adapta al ancho de la tarjeta con container query.
  - **Racha y XP:** niveles con umbral 50·n·(n−1) y rango con tono Zodi.
  - **Rituales:** según la fase lunar.
  - **Match:** enlace a compatibilidad.
- **El titular del día no usa IA todavía:** sale de reglas a partir del tránsito más exacto. La Fase 7 lo sustituirá por la lectura de IA, pero los datos astrológicos seguirán saliendo del motor.
- **`/app/carta`:**
  - Rueda SVG estática con el Ascendente a la izquierda, signos coloreados por elemento, casas, ejes ASC/MC, glifos sin solaparse y aspectos armónicos o tensos distinguidos por color y trazo.
  - Tablas accesibles de planetas (℞ si es retrógrado), casas y aspectos.
  - Sin hora de nacimiento se omiten las casas y el ASC y se explica por qué.
- **Ajustes:** nombre, usuario, tono, temas y avisos, con aviso de "Guardado". Los datos de nacimiento se cambian volviendo al onboarding.
- **Páginas aún vacías:** Horóscopo, Match y Asistente muestran un estado vacío con el personaje de Zodi hasta la Fase 7.

### Onboarding (`/app/onboarding`)
- **Cinco pasos:** Tú → Nacimiento → Lugar → Tu Zodi → Avisos.
- **Progreso:** barra (`<progress>`) y lista de pasos con `aria-current="step"`.
- **Guardado parcial:** cada paso guarda en el perfil y no se pueden saltar los pasos obligatorios.
- **Ciudad:**
  - Es un combobox ARIA 1.2 con debounce de 300 ms, flechas, Enter, Esc y estado anunciado en una región viva.
  - Llama a `/api/geocodificar`, que consulta Open-Meteo y valida la respuesta con Zod. Devuelve latitud, longitud y zona IANA.
  - **Sin JS** el servidor busca la ciudad y la ofrece como lista de radios.
  - Si el usuario escribe antes de que React cargue, lo escrito no se pierde.
- **Al terminar** se calcula y se guarda la carta con `astro-engine`, y se muestra el aviso "Carta calculada".
- **Nueva columna `birth_time_known`:** distingue "no sé la hora" de "aún no contestado". Hay migración y test de RLS.

### Motor
- **Cúspides Placidus contrastadas con Swiss Ephemeris** (valores de Astrotheme, mismos datos que Astro.com): Einstein (48°N), Marilyn Monroe (34°N, longitud oeste) y Kylie Minogue (37°S). Las 36 cúspides coinciden con un margen menor de 2′ y quedan como test.

## Verificado (desde `v2/`)
| Comando | Resultado |
|---|---|
| `npm run check` | 0 errores (109 ficheros) |
| `npm run lint` | limpio |
| `npm test` | **127/127** |
| `npm run build` | OK |
| `npm run test:e2e` | **85/85** en móvil, tablet y escritorio (2 omitidos: la prueba sin JS solo corre en escritorio) |

Qué cubren los e2e:
- Onboarding completo con teclado, incluido el combobox.
- Onboarding sin JS y sin hora de nacimiento.
- Que no se pueden saltar pasos.
- Navegación entera con Tab y foco visible.
- Pestañas, diálogo, tooltip y avisos.
- axe WCAG 2.2 AA en todas las páginas públicas y privadas, en cada paso del onboarding y en los estados de error.
- Sin scroll horizontal a 320 px.

Sobre el build de producción también comprobé que la CSP no lleva `unsafe-inline`, que no hay atributos `style=""` y que `/dev/componentes` da 404.

## Riesgos y pendientes
- **Licencia de Open-Meteo:** el plan gratuito es para uso **no comercial** y Zodi tiene planes de pago. Antes de producción hay que contratar su plan comercial o cambiar de proveedor (GeoNames, Mapbox…). El proveedor está aislado en `lib/geo/places.ts` y `GEOCODING_API_URL`.
- **Supabase sigue sin conectar:** faltan las migraciones en el proyecto real, incluida `20261011100000_profile_birth_time_known.sql`. Todo lo de esta fase está probado contra el mock.
- **WebKit sin probar** (Safari): no arranca en Windows. Queda para CI en Linux.
- **CSP solo en producción:** `astro dev` no la aplica. Regla para las fases siguientes: nada de `style=""` en el HTML ni `define:vars`; para estilos dinámicos, atributos SVG, clases o `<progress>`/`<meter>`.
- **Rituales informativos:** todavía no se pueden marcar como hechos. La racha y la XP las calculará el servidor en la Fase 7.
- **Glifos astrológicos con fuente del sistema** (Segoe UI Symbol, Apple Symbols…): pueden verse distintos según el dispositivo. Si hace falta, se puede embeber una fuente de símbolos en la Fase 6 (PDF).
- **Barra de desarrollo de Astro desactivada:** tapaba los avisos y el botón flotante en los e2e.

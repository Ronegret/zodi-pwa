# Fase 5 — Escenas 3D (Three.js)

Rama `astro-v2`. Commits al final de este documento.

## Hecho
- **Arquitectura** en `src/scenes/`:
  - `core/`:
    - `stage.ts`: renderer, contorno, tamaño con ResizeObserver y DPR ≤ 2. Destruye el contexto WebGL al desmontar.
    - `loop.ts`: requestAnimationFrame que se pausa fuera de pantalla (IntersectionObserver), con la pestaña oculta o con el botón de pausa. Limita `dt`.
    - `base.ts`: luces toon, paleta, raycaster y `dispose()` completo.
    - `dispose.ts`, `palette.ts` (lee los colores de `tokens.css`), `support.ts` (WebGL, movimiento reducido, ahorro de datos) y `types.ts` (interfaz común `{ mount, update, dispose, pointer?, select? }`).
  - `materials/toon.ts`: MeshToonMaterial con gradiente de 4 tonos.
  - `effects/outline.ts`: OutlineEffect.
  - `geometry/shapes.ts`: RoundedBoxGeometry y texturas de glifos de 256 px.
  - `math.ts`: longitud eclíptica → posición, giro al frente y camino corto. Es puro y tiene tests.
- **Las 4 escenas**, en estilo toon con contorno y paleta Zodi:
  - `hero`: anillo de 12 cajas redondeadas (color por elemento, con su glifo) alrededor de un núcleo que late. Gira, se inclina hacia el puntero y trae al frente el signo elegido.
  - `natal-wheel`: rueda con los datos reales del motor (longitudes, Ascendente a la izquierda, aspectos en un solo `LineSegments`). Al elegir un planeta lo trae al frente y lo destaca.
  - `tarot`: carta RoundedBox que se voltea, con el arcano del día en la cara.
  - `sign-of-day`: tótem del signo de la temporada, con 40 chispas en un único `InstancedMesh`. Salta al pulsarlo.
- **Islas** en `src/components/scenes/`:
  - `useScene` gestiona el ciclo de vida: comprueba soporte, importa three en un chunk aparte, monta, arranca el bucle y libera todo al desmontar o en `pagehide`.
  - `SceneFrame` tiene proporción fija (CLS 0), alternativa estática, canvas `role="img"` con `aria-label`, botón de pausa visible y acciones superpuestas.
  - Componentes: `HeroZodiac`, `NatalWheel3D`, `TarotOfDay` y `SignOfDay3D`.
- **Integración:**
  - Portada: hero a dos columnas con el anillo 3D (`client:load`). La mascota es la alternativa.
  - Dashboard: tarjeta "Carta del día" (`client:visible`) con un arcano mayor estable por persona y día (`src/lib/tarot/daily.ts`). El bento queda 7+5 / 7+5 / 4+4+4 / 12 en escritorio y sin huecos en tablet.
  - `/app/carta`: la rueda 3D envuelve a la rueda SVG, que es su alternativa.
  - `/app/horoscopo`: tótem del signo en el que está el Sol ahora (`skyAt`) con su imagen neón como alternativa. El horóscopo escrito sigue pendiente para la Fase 7.
- **Accesibilidad:**
  - Cada acción 3D tiene su equivalente de teclado: 12 botones de signo, botones de planeta, "Voltear carta" y "¡Que salte!".
  - Hay una región `role="status"` que anuncia lo elegido.
  - Las tablas de la carta siguen siendo la alternativa textual completa.
  - Los controles vienen en el HTML del servidor, así que al hidratar es el mismo nodo: no se pierde el foco ni hay saltos de diseño.
  - Sin JS se ocultan con `@media (scripting: none)` y la carta del día se revela con `<details>` dentro de `<noscript>`.
- **Carga perezosa y alternativas:**
  - three solo se descarga si hay WebGL, sin movimiento reducido y sin ahorro de datos.
  - Si no, se queda la imagen o el SVG, y los botones siguen funcionando.
  - El canvas usa `touch-action: pan-y` para no atrapar el scroll.

## Verificado (desde `v2/`)
| Comando | Resultado |
|---|---|
| `npm run check` | 0 errores (143 ficheros) |
| `npm run lint` | limpio |
| `npm test` | **155/155**. 21 nuevos: geometría de escenas (también contra three), paleta = tokens.css, carta del día. |
| `npm run build` | OK. Portada compilada: CSP sin `unsafe-inline`, 0 `style=""`, isla con sus 12 controles en el HTML y three fuera del HTML inicial. |
| `npm run test:e2e` | **139/139** en los tres tamaños (2 omitidos por diseño), 3 ejecuciones completas seguidas en verde. |

Presupuesto medido con `renderer.info`, frame completo con las dos pasadas del contorno, a 1280 px:

| Escena | Draw calls (≤ 150) | Triángulos | Texturas |
|---|---|---|---|
| hero | 40 | 23,5 k | 13 (glifos de 256²) |
| tarot | 4 | 1,9 k | 3 (cara de 512×820) |
| natal-wheel | 86 | 47,5 k | 24 (256²) |
| sign-of-day | 7 | 14 k | 2 |

- **JS de la escena** (gzip): three tree-shaken más el código compartido suman 134,5 kB. Cada escena añade entre 1,1 y 1,5 kB y cada isla entre 0,6 y 1,3 kB. La escena más pesada cuesta unos 137 kB, por debajo del límite de 250 kB.
- Las islas no importan three de forma estática: se carga con `import()` al montar.

Qué cubren los e2e (`tests/e2e/scenes.spec.ts`):
- Las 4 escenas llegan a "lista" y están dentro de presupuesto.
- La pausa usa `aria-pressed`.
- Signos y planetas se eligen con teclado y se anuncian.
- Sin fugas: al remontar quedan 0 geometrías y 0 texturas en GPU.
- Sin WebGL: alternativa visible, sin canvas, sin botón de pausa, y los controles siguen funcionando.
- Con movimiento reducido no se descarga three.
- Sin JS no hay botones muertos y la carta se revela con `<details>`.
- No hay errores de hidratación.
- El foco se conserva aunque la isla hidrate con un control enfocado.

## Errores encontrados y corregidos
- `.scene-fallback { display: grid }` anulaba el atributo `hidden`, así que la imagen tapaba el canvas. Se añadió `[hidden] { display: none }`.
- Al remontar se reutilizaba un canvas con el contexto ya liberado (`forceContextLoss`) y three fallaba con `precision of null`. Ahora el canvas lleva `key` por generación.
- Los controles que solo se pintaban tras hidratar hacían perder el foco (la carta del día cambiaba `<details>` por `<button>`) y movían el diseño. Ahora vienen del servidor y se ocultan sin JS.
- Encuadre: el anillo y la rueda se salían por los lados en marcos cuadrados. Se alejó la cámara.
- El título de la portada se partía con guiones ("uni-verso") en la columna estrecha: ahora usa `hyphens: manual` con una escala propia.
- `renderer.info` solo contaba la última pasada del OutlineEffect: ahora se reinicia por frame.
- En dev, Vite descubría three al montar la primera escena y recargaba la página. three va ahora en `optimizeDeps.include`.
- E2e intermitente del recorrido con Tab: con el servidor de dev en frío el HTML llega por partes y el test pulsaba Tab antes de que llegara el final. Ahora espera a `load`. En producción no ocurre porque no se compila nada al vuelo.

## Riesgos y pendientes
- **60 fps en móvil medio:** no se ha medido en dispositivo real. En headless (SwiftShader, CPU) hay 60 fps en todas las escenas salvo la rueda natal en el perfil móvil (≈ 47). Medir en un Android de gama media en la Fase 8 y, si hace falta, bajar DPR o segmentos de RoundedBox en esa escena.
- **Instancing:** solo en las chispas. Las cajas de signos y planetas son mallas sueltas porque OutlineEffect no contornea bien `InstancedMesh`. Aun así están muy por debajo del límite de draw calls.
- **Giroscopio:** no implementado (era opcional). Solo hay parallax por puntero.
- **Lighthouse** queda para la Fase 8, sobre un preview de Vercel.
- **Glifos:** usan las fuentes de símbolos del sistema (Segoe UI Symbol, Apple Symbols, Noto Sans Symbols 2). En un sistema sin ninguna podrían verse cajas. Valorar una fuente de glifos propia en la Fase 8.
- **Antes de hidratar** (unos ms con `client:load` o `client:visible`), pulsar un control no hace nada.

## Despliegue (11/10/2026)
- `astro-v2` subido a GitHub (`Ronegret/zodi-pwa`).
- En Vercel, el proyecto existente `zodi-pwa` crea un preview de Next para cada push a `astro-v2` (último en estado Ready). Producción (`main`) no se ha tocado.
- Nuevo proyecto de Vercel **`zodi-v2`** para la v2, que ya importa el repositorio:
  - Root Directory `v2`.
  - Framework Astro.
  - Rama de producción `astro-v2` (dominio `zodi-v2.vercel.app`).
- **Primer despliegue: dos fallos corregidos.**
  1. El build se hacía como Next.js ("No Next.js version detected"). Ahora `v2/vercel.json` fija `framework: astro`.
  2. Todas las rutas daban 500 (`FUNCTION_INVOCATION_FAILED`). Es un fallo de `@astrojs/vercel` 11.0.13 (la última versión): su entrypoint deja `import "rolldown"` e `import "@vercel/routing-utils"` en la función, y en Vercel no está el binario nativo de rolldown.
     - Arreglo: en `astro.config.mjs` (`vite.build.rolldownOptions.treeshake.moduleSideEffects`) se marcan sin efectos secundarios y el bundler los descarta.
     - Verificado ejecutando la función compilada copiada fuera del repo, sin variables de entorno.
     - Cuando salga una versión del adaptador que lo corrija, quitar la regla.
- **Pendiente (Rodrigo):** pegar en Vercel → zodi-v2 → Settings → Environment Variables:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

  Después, añadir `https://zodi-v2.vercel.app/**` a las Redirect URLs de Supabase Auth.

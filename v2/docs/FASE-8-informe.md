# Fase 8 — Informe (en curso)

Rama `fase-7` · 12/10/2026 · Plan y comparación con la Zodi de antes en `FASE-8-plan.md`.

## Hecho

### 8A — Lecturas completas e informativas
- **Tarot ZODI vivo**: mazo de 31 cartas (22 arcanos mayores + 9 Arcanos ZODI con su arte: La Verdad, El Ego, El Ex que Vuelve, El Karma, La Red Flag, La Mala Idea, La Ilusión, La Venganza Cósmica, El Destino). Las cartas caen boca abajo con el reverso "TAROT ZODI" y se voltean en 3D una a una; las invertidas salen giradas. Tiradas de una y tres cartas (`/app/lecturas/tarot`).
- **Seis lecturas nuevas**: cruz celta (10 cartas), runas vikingas (Elder Futhark dibujado en SVG; las simétricas nunca salen invertidas), cristales por intención (según elemento del Sol y día), nombre y apellidos (numerología pitagórica con vista previa al escribir), lectura de mano guiada (forma y cuatro líneas) y horóscopo maya (Sincronario de 13 Lunas, con numeración maya de puntos y barras). En total, 18 lecturas.
- **Informativo**: cada lectura tiene "¿Qué es esto?", temas y glosario desplegable (textos de la Zodi de antes revisados). El hub agrupa por Horóscopos, Tarot y runas, Tu carta y tus números, y Amor, sueños y rituales.
- **Oráculo de ZODI**: `/app/oraculo` (antes asistente, que redirige) con guía, botón flotante "Pregúntale a ZODI" y entrada en el menú.

### 8B — Lo que ve el público sin cuenta
- **Horóscopo de hoy por signo** (`/horoscopo`, `/horoscopo/[signo]`): calculado con el cielo real por casas solares (Luna, Venus, Marte, Júpiter, retrógrados), sin depender de la IA. Amor, trabajo y energía con estrellas, consejo de ZODI, número, color y signo aliado, ficha del signo y llamada a crear la carta. Canonical y Open Graph con el arte del signo. La CDN lo guarda como mucho una hora y nunca pasada la medianoche de Madrid. `/horoscopo-diario/[sign]` (URL antigua) redirige con 301.
- **Portada completa**: ZODI con la corona 3D, banda de cine con su vídeo, los doce signos, "Mira lo que ZODI sabe de ti" (Sol, camino de vida, horóscopo chino, sello maya y carta de nacimiento con solo la fecha; funciona sin JS), carrusel de Arcanos ZODI, todas las lecturas, la verdad sin suavizar, cómo funciona, comunidad, planes (Premium "muy pronto", sin inventar precios), preguntas frecuentes y pie con los horóscopos por signo.
- **Vídeos y música**: `zodi-portada` (7,5 → 1,5 MB) y `zodi-cartas` (8,8 → 1,2 MB), mudos, pausables, parados con movimiento reducido y fuera de pantalla. "ZODI te lo dijo" (96 kbps) solo suena si se pulsa.
- **Bienvenida**: ZODI bailando con cartas al entrar al panel, una vez por sesión, sin bloquear clics ni foco.
- **Acceso**: la carta "La Identificación" del Tarot ZODI junto al login y el registro.
- No se han traído los "testimonios" de la portada antigua: eran inventados.

### 8C — Volver cada día (primera parte)
- **Migración `20261012130000_activity.sql`** (aplicada y verificada en el Supabase real con `scripts/db/verify-activity.mjs`): `record_activity()` suma la racha una vez al día en la zona de cada persona, XP por acción (lectura 10, publicación 8, comentario 3, favorita 2, primer paso del día 5) y nivel; desbloquea 19 logros reales (por lecturas hechas, racha, nivel y comunidad, no por puntos inventados como en la versión antigua) y da 5 gemas por logro y 10 por cada semana de racha. `toggle_favorite()` solo sobre lecturas propias. Nadie puede escribir puntos, racha ni logros a mano (probado en `tests/db/rls.test.ts`).
- **App**: el panel registra la visita del día; leer, consultar al oráculo, publicar y comentar suman; los logros nuevos salen como aviso. `/app/progreso` (nivel, racha, mejor racha, gemas, logros y tabla de puntos), estrella de favoritas, `/app/lecturas/historial` con filtro de favoritas y paginación.
- **Arreglo**: con las secciones nuevas, en pantallas de 720 px de alto "Cerrar sesión" quedaba fuera del menú lateral (fallo que llegó a producción en la subida anterior); ahora el menú se desplaza. En el móvil, los avisos salen por encima de la barra inferior.

## Verificado (12/10/2026)
- `npm run check`: 0 errores. `npm run lint`: limpio.
- `npm test`: 209/209 (nuevos: `divination.test.ts` con kines mayas de referencia, runas, cristales, nombre, validación y preparación; `public.test.ts` con casas solares y caché; `progress.test.ts` comprueba que el catálogo de logros es el mismo que el de la base de datos; 6 pruebas nuevas de RLS para la actividad).
- `npm run test:e2e`: 241 pasan y 8 se saltan a propósito (capturas de revisión), en móvil, tablet y escritorio, con axe WCAG 2.2 AA en las páginas nuevas (mano, nombre, maya, horóscopo público, progreso, historial).
- Función compilada probada fuera del repo como en Vercel (`/`, muestra con fecha, `/horoscopo`, `/horoscopo/leo`, redirección 301, login y 404).
- Producción (`zodi.aibueno.es`) comprobada tras el despliegue: portada nueva, horóscopos por signo, vídeos y cartas.
- `npm run build`: correcto.
- Revisión visual con capturas: tarot, cruz celta, runas, sello maya, hub, portada, Leo y login.

## Riesgos y pendientes
- **IA en producción**: sin `ANTHROPIC_API_KEY` en Vercel las lecturas muestran "Zodi está afilando la lengua". El horóscopo público no la necesita.
- **Google**: el proveedor sigue desactivado en Supabase (`/auth/v1/authorize?provider=google` → 400). El botón aparece solo cuando se active.
- **Windows bloquea el compilador nativo de Astro** (Control inteligente de aplicaciones). En local se usa el compilador WebAssembly con `NAPI_RS_FORCE_WASI=1`; Vercel no está afectado. Detalle en `PROMPT-CONTINUACION.md`.
- Los vídeos llevan la marca de agua "Veo" del generador; no se ha recortado.
- El sello maya usa la cuenta de las 13 Lunas (la que busca el público), no la cuenta tradicional del Tzolkin.
- Pendiente de la 8C: predicciones a 90 días, ritual del día y amigos. Después 8D (Stripe y gemas, compartir como imagen, PDF, emails y push).

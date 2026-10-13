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

### Ronda de usabilidad y automatización (12/10/2026, tarde)
- **Estudio de usabilidad** de la primera vez en móvil: hallazgos y cambios en `ESTUDIO-UX.md`.
- **30 días con todo gratis** por cuenta (migración `trial_and_oracle`, aplicada en Supabase) y **cuota propia del oráculo** (conversar no gasta lecturas).
- Oráculo rediseñado; panel con primeros pasos y explicaciones sin jerga; alta explicada por ZODI con "Sobre ti"; Ajustes completos (sobre ti, cuenta, contraseña, borrar cuenta); carta con los tres pilares; portada con "Qué es ZODI" y demo interactiva; rangos sin género.
- **CI en GitHub** (`.github/workflows/v2-ci.yml`): lint, tipos, unitarias con RLS, compilación y e2e en Linux en cada subida a `fase-7`. Primer pase en verde. Destapó que faltaba `@types/node` en la v2 (se tomaba de la app antigua).
- **Correos de acceso en español** (`supabase/templates/`, instrucciones en `CORREOS-SUPABASE.md`).
- **Vercel Web Analytics y Speed Insights** sin cookies (solo en producción; hay que activarlos en el panel de Vercel). Privacidad actualizada.
- **Incidencia resuelta**: Vercel estuvo sin desplegar desde las 11:45 UTC y después sacó la cola de golpe.

### Personalización a fondo (12/10/2026, noche)
- **El significado de tu carta** (`/app/carta/significado`): Sol, Luna, Ascendente, Mercurio, Venus, Marte, suerte y lecciones (Júpiter y Saturno), generación, elementos, modalidad, casas, aspectos, numerología con las ilustraciones de cada número (`/numeros/*`), horóscopo chino, maya y carta del tarot. Sin IA, al momento. Cada sección lleva **"Pregúntale a ZODI"**, que abre el oráculo con la pregunta escrita (`?pregunta=`, no se envía sola).
- **Tu nombre**: diccionario propio (más de 200 nombres y 90 apellidos con origen, significado y curiosidades) y reglas para patronímicos (-ez = «hijo de»), apellidos vascos y mapuches por sus partes. Se puede escribir el nombre completo (no se guarda); cambia también los números.
- **PDF completo**: la carta, el significado entero y el del nombre.
- **Tu gente** (`/app/gente`, migración `20261012160000_people.sql`, aplicada en Supabase): pareja, familia, amistades y trabajo con su fecha (y hora opcional). Fichas privadas (RLS, máx. 50). Afinidad por Sol, Luna, Venus/Marte cruzados, Mercurio, horóscopo chino y numerología; **"Hoy entre los dos"** con la Luna del día y el biorritmo, consejo según la relación y aviso de cumpleaños. En el panel: "Tu gente hoy".
- **Compatibilidad pública** (`/compatibilidad`, `/compatibilidad/aries-y-leo`): vínculo en la rueda, elementos, ritmo, amor, amistad y trabajo; 144 combinaciones con canónica única; enlazada desde el horóscopo de cada signo y el pie.
- **Móvil**: barra inferior Inicio · Lecturas · Tu gente · Carta · **Más** (hoja que sube desde abajo con el resto y "Cerrar sesión", `popover` nativo sin JS). Títulos sin partir palabras, índice deslizable, columna que no se ensancha a 320 px. Revisión con capturas en Pixel 7.
- **Vercel y avisos**: `ANTHROPIC_API_KEY` estaba en el proyecto antiguo (`zodi-pwa`), no en `zodi-v2`; añadida (Production y Preview, sensible) y la IA responde en producción (`/api/salud` → `"ia": true`). Apagados los comentarios del bot en commits y PR de los dos proyectos. `zodi-v2` ya no despliega `fase-7` y `zodi-pwa` ignora las ramas v2. El CI corre una vez por cambio (solo al subir a `astro-v2`, cancela la anterior y reintenta una vez los e2e). PR #3 cerrado por duplicado del #2.

### Efecto guau (12/10/2026, medianoche)
- **El día que naciste** (`src/lib/chart/birth-day.ts`, `BirthSky.astro`, `BirthDayPanel.astro`): mapa del cielo sobre el lugar de nacimiento en ese minuto (cénit en el centro, planetas por altura y acimut, etiquetas que no se pisan), Luna de ese día con su significado, día o noche con amanecer y atardecer, estación según el hemisferio (Chile en abril = otoño), generación, vida en números y próximas citas: retorno solar exacto, de Júpiter y de Saturno. Comprobado con fechas reales (15/04/1990 fue domingo; primer retorno de Saturno en 2019-2020). Adelanto en el panel.
- **Tu ficha cósmica**: lo esencial en una línea, enlazado a cada sección.
- **Registro de nombres y apellidos**: `scripts/names/` genera con IA origen, significado y curiosidad comprobable (reanudable). Hay 739 nombres y 119 apellidos generados, más el diccionario propio y las reglas. Lo que falte lo investiga la IA al momento (`/api/nombre`, migración `name_meanings` con caché compartida y tope de 30 al día por persona) y queda para todos.
- **Portada**: "Mira lo que ZODI sabe de ti" admite el nombre y cuenta qué significa y el día de la semana y la Luna del nacimiento.
- **Hoja "Más"**: va antes que su botón en el HTML (en streaming, el botón podía no abrir nada; se veía en e2e bajo carga).
- **Incidencia**: la cuenta de Anthropic se quedó **sin saldo** durante la generación del registro. Sin saldo, el oráculo y las lecturas fallan en producción. Al recargar: `node scripts/names/generate.mjs --lote 25 --paralelo 2` completa el registro (unos 700 apellidos y 150 nombres pendientes).

### Todo sobre mí, informe en PDF, pie y legal (13/10/2026)
- **Todo sobre mí** (`/app/yo`): ficha cósmica (Sol, Luna, Ascendente, número, animal chino, sello maya, tarot, día que naciste, energía), signos afines, accesos a cada sección y "Tus datos son tuyos". Datos reunidos en `lib/report/build.ts` (sin IA).
- **Informe cósmico en PDF** (`/app/yo/informe`; `/app/carta/imprimir` redirige): portada oscura con el logo, hojas de papel con marca de agua, pie con "Hoja N" y "Creado por rodrigonegrete.es" (márgenes de página), tinte del fondo de la web desactivado al imprimir, cierre con humor y crédito. Verificado con PDF real (22 hojas A4, desktop y móvil) rasterizado con PyMuPDF; test e2e comprueba A4 y que nada sobresale.
- **Pie de página nuevo** (`SiteFooter.astro`): ticker con humor, enlaces del creador (✦ rodrigonegrete.es ↗, rodd.es ↗), legal, volver arriba; compacto en la app.
- **Legal**: privacidad rehecha (responsable, bases legales, IA y qué se envía, encargados, transferencias, derechos RGPD, edad 16+), términos ampliados, **cookies** (tabla exacta de lo que se guarda), **aviso legal**. Registro con casilla obligatoria de edad, términos y privacidad. Descarga de datos en JSON (`/api/mis-datos`). `robots.txt`, `sitemap.xml` y `/.well-known/security.txt`.
- **Seguridad revisada**: sin secretos en el repositorio; cabeceras (CSP con hashes, HSTS, X-Frame, nosniff, COOP, Referrer y Permissions-Policy) activas en producción; sin sumideros XSS; `checkOrigin` activo; RLS probada (59 pruebas). `npm audit`: 3 avisos altos en `path-to-regexp` dentro de `@astrojs/vercel` (solo en compilación de rutas; el arreglo propuesto es bajar de versión): riesgo aceptado y a revisar.
- **Pendiente de Rodrigo (no se puede inventar)**: NIF/RUT y domicilio si procede, un correo de contacto propio para derechos de privacidad, y confirmar la jurisdicción (los textos dicen legislación española).

## Verificado (12/10/2026)
- Noche: `astro check` 0 errores, lint limpio, 241 unitarias (incluye 56 de RLS), e2e completos en móvil, tablet y escritorio con axe (incluye Tu gente, el significado, la hoja Más y la compatibilidad pública).
- `npm run check`: 0 errores. `npm run lint`: limpio.
- `npm test`: 209/209 (nuevos: `divination.test.ts` con kines mayas de referencia, runas, cristales, nombre, validación y preparación; `public.test.ts` con casas solares y caché; `progress.test.ts` comprueba que el catálogo de logros es el mismo que el de la base de datos; 6 pruebas nuevas de RLS para la actividad).
- `npm run test:e2e`: 241 pasan y 8 se saltan a propósito (capturas de revisión), en móvil, tablet y escritorio, con axe WCAG 2.2 AA en las páginas nuevas (mano, nombre, maya, horóscopo público, progreso, historial).
- Función compilada probada fuera del repo como en Vercel (`/`, muestra con fecha, `/horoscopo`, `/horoscopo/leo`, redirección 301, login y 404).
- Producción (`zodi.aibueno.es`) comprobada tras el despliegue: portada nueva, horóscopos por signo, vídeos y cartas.
- `npm run build`: correcto.
- Revisión visual con capturas: tarot, cruz celta, runas, sello maya, hub, portada, Leo y login.

## Riesgos y pendientes
- **IA en producción**: resuelto (la clave estaba en el proyecto equivocado). `/api/salud` dice si está configurada.
- **Google**: el proveedor sigue desactivado en Supabase (`/auth/v1/authorize?provider=google` → 400). El botón aparece solo cuando se active.
- **Windows bloquea el compilador nativo de Astro** (Control inteligente de aplicaciones). En local se usa el compilador WebAssembly con `NAPI_RS_FORCE_WASI=1`; Vercel no está afectado. Detalle en `PROMPT-CONTINUACION.md`.
- Los vídeos llevan la marca de agua "Veo" del generador; no se ha recortado.
- El sello maya usa la cuenta de las 13 Lunas (la que busca el público), no la cuenta tradicional del Tzolkin.
- Pendiente de la 8C: predicciones a 90 días y ritual del día ("amigos" queda cubierto por Tu gente). Después 8D (Stripe y gemas, compartir como imagen, emails y push).
- Codex (ChatGPT) revisa el PR #2 en cada subida: para no recibir esos correos, desactivar sus revisiones automáticas o cerrar el PR.

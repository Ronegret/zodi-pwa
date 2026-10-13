# Fase 7 — Funcionalidades (en curso)

Rama `fase-7`: cada push genera un preview en Vercel (proyecto `zodi-v2`) sin tocar `zodi.aibueno.es`. Se fusiona en `astro-v2` (producción) cuando Rodrigo lo apruebe.

Prioridad marcada por Rodrigo: **lecturas con IA y comunidad**, mucho mejor que en la app anterior. La Fase 6 (PDF) queda para después.

## Hecho

### Lecturas con IA (`src/lib/ai/`, `src/lib/server/readings.ts`)

- **Contexto real por persona** (`context.ts`), calculado de verdad. En la app anterior la Luna y el Ascendente eran pseudoaleatorios. Incluye:
  - carta natal con efemérides: Sol, Luna, Ascendente y Medio Cielo (solo si hay hora), el resto de planetas, elemento dominante y aspectos fuertes;
  - tránsitos de hoy a su carta, Luna del día y retrógrados;
  - biorritmo, camino de vida y año personal;
  - zodiaco chino con el **Año Nuevo Lunar real** (la app anterior usaba el año natural);
  - situación sentimental, temas favoritos y bio.
- **La voz de Zodi** (`prompts.ts`): system prompt con las reglas de Rodrigo.
  - Siempre con los datos del perfil y llamando a la persona por su nombre.
  - Jerga del país y nunca fórmulas de chatbot.
  - Traduce cada término astrológico a lenguaje de calle.
  - Cierra siempre con "**Hoy haz esto:**".
  - Tonos (suave, directo, brutal, sarcástico), extensión y enfoque.
  - El system prompt va con `cache_control`, así cada lectura sale más barata.
- **12 tipos de lectura** (`kinds.ts`): horóscopo diario, semanal y mensual; carta natal; tránsitos; tarot de 3 cartas; compatibilidad; sueños; numerología; biorritmo; horóscopo chino; roast astral.
- **Tarot:** se tira en el servidor con aleatoriedad criptográfica; la IA no puede cambiar las cartas.
- **Compatibilidad:** sinastría real entre las dos cartas (aspectos entre planetas personales), no solo signos solares.
- **Modelo** `claude-sonnet-5-5`, configurable con `ANTHROPIC_MODEL`. Respuesta en streaming.
- **Endpoint `POST /api/lecturas`** (streaming NDJSON: meta → texto → done | error):
  - valida y comprueba que haya datos de nacimiento;
  - consume cuota por plan (free 5, premium 40, vip 150 al día);
  - guarda con service role;
  - devuelve la cuota si la IA falla.
- **Interfaz:**
  - `/app/lecturas`: hub con arte, cuota e historial.
  - `/app/lecturas/<tipo>`: estudio con la lectura escrita en directo y tirada de tarot animada.
  - Lectura guardada.
- **`/app/horoscopo`:** el horóscopo de hoy se genera una vez y se queda; al lado, el tótem 3D del signo de la temporada y enlaces a semana, mes y horóscopo chino.
- **`/app/compatibilidad`** ("Match" en el menú) abre el estudio de compatibilidad.
- **Asistente** (`/app/asistente`): chat con Zodi.
  - Misma voz y modo chat, con la carta y el cielo de hoy en contexto.
  - Las sugerencias inician la conversación; Intro envía y Mayús+Intro salta de línea.
  - La conversación vive en la pestaña.
  - Cada respuesta cuenta como una lectura.

### Comunidad (`/app/comunidad`)

- **Migración `20261012110000_community_v2.sql`**, aplicada al Supabase real y verificada con `node scripts/db/verify-community.mjs`:
  - temas en los posts;
  - reacciones (🔥 ✨ 💀 💜) con RLS;
  - signo solar del autor, mantenido por trigger desde su carta;
  - denuncias: con 3 personas distintas el contenido se oculta solo;
  - `community_feed()` y `post_comments()`, que exponen **solo** la tarjeta pública del autor (nombre, usuario, avatar, nivel y signo).
- **Interfaz:**
  - publicar con tema y filtrar por tema (con la URL `?tema=`);
  - tarjeta de autor con signo y nivel;
  - reacciones optimistas;
  - comentarios que se cargan al abrir;
  - borrar lo propio con confirmación en línea y denunciar lo ajeno;
  - paginación "Ver más";
  - reglas de la tribu y acceso al chat privado con Zodi.
- El autor del post modera los comentarios de su post (lo hace la RLS).

### Navegación

- El menú pasa a: Inicio · Lecturas · Comunidad · Carta · Horóscopo · Match · Ajustes.
- En la barra inferior del móvil van 5 (Horóscopo y Match se abren desde Lecturas).
- Página 404 con estilo Zodi.

## Verificado (desde `v2/`)

| Comando            | Resultado                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `npm run check`    | 0 errores                                                                                                         |
| `npm run lint`     | limpio                                                                                                            |
| `npm test`         | **182/182**, incluidos 42 de RLS con la migración nueva, reaplicada dos veces.                                    |
| `npm run build`    | OK. Función compilada probada aislada con `node --no-experimental-detect-module`: el SDK de Anthropic carga bien. |
| `npm run test:e2e` | **211/211** en los 3 tamaños (2 omitidos por diseño), 3 ejecuciones seguidas.                                     |

**Cómo se prueba la IA en los e2e:** no se llama a la IA real. El servidor falso responde en `/v1/messages` como Anthropic, en streaming SSE, y repite el nombre y las cartas que recibe. Así los tests comprueban que:

- el prompt lleva los datos de la persona;
- el system prompt va cacheado;
- las cartas que interpreta la IA son las que se tiraron.

## Estado del pendiente (12/10/2026)

- `ANTHROPIC_API_KEY`: puesta por Rodrigo en Vercel y en `v2/.env.local`. ✅
- Horóscopos públicos por signo (SEO): hechos en la Fase 8B (`/horoscopo/[signo]`). ✅
- Moderación: hecha (`/app/moderacion`, migración `moderation`, `scripts/db/make-moderator.mjs`; Rodrigo es moderador). ✅
- PDF de la carta (Fase 6): hecho (`FASE-6-informe.md`). ✅
- Stripe y gemas: **aplazado por decisión de Rodrigo** (30 días con todo gratis; los planes se definen después). Las tablas de pagos y gemas ya existen.
- Notificaciones push y emails: **bloqueado** hasta verificar el dominio en Resend (faltan los 3 registros DNS en Hostinger). Plantillas de acceso en español y script de configuración listos.

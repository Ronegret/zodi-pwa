# Fase 2 — Datos y autenticación (Supabase)

Commits en `astro-v2`: `a3d55f2` (esquema + RLS), `8000890` (clientes, Zod, seguridad),
`0494d89` (middleware, acceso, API), `b995dda` (e2e). Sin push.

Se ha hecho **sin credenciales**: no existe `v2/.env.local`. La RLS se probó contra
Postgres real en local (PGlite) y el flujo de acceso contra un Supabase simulado. Falta
conectarlo al proyecto real (`mdtgjgfeoudiyotgcxsy`), ver "Para conectar el proyecto".

## Hecho

### Esquema (`supabase/migrations/`, 6 ficheros, idempotentes)
| Tabla | Quién lee | Quién escribe |
|---|---|---|
| `profiles` (1:1 con `auth.users`, trigger al registrarse) | el propio usuario | usuario: solo columnas editables · `plan`, `gems`, `xp`, `level`, `streak`, referidos: solo service role |
| `natal_charts` (input, carta JSON, `engine_version`) | el propio | el propio (insertar/borrar; inmutables) |
| `readings` (19 `reading_kind`, modelo, tokens) | el propio | solo service role (tras consumir cuota) |
| `usage_limits` (free 5 · premium 40 · vip 150 al día) | público | service role |
| `usage_events` | el propio | solo vía `consume_ai_quota()` |
| `community_posts`, `comments` | publicados: público · los propios: autor | autor (solo `body`); moderación (`status`): service role |
| `friendships` | las dos partes | pide el emisor; acepta o bloquea solo el destinatario |
| `subscriptions`, `gem_transactions` | el propio | service role |
| `stripe_events` (idempotencia de webhooks) | nadie | service role |

Funciones:
- `consume_ai_quota(kind)`: atómica, con bloqueo de fila. Cuenta por día natural en la zona horaria del usuario y, si la zona no es válida, usa UTC.
- `ai_quota_status()`: devuelve el estado de la cuota sin consumirla.
- `apply_gem_transaction(...)`: idempotente por `(reason, reference)` y nunca deja saldo negativo. Solo la puede ejecutar el service role.
- `profile_cards(ids)`: tarjeta pública de un usuario (nombre, usuario, avatar, nivel) sin exponer su fecha de nacimiento.

### Código (`src/`)
- **`lib/supabase/`**:
  - Clientes `browser.ts`, `server.ts` (con `@supabase/ssr`) y `admin.ts`. `admin.ts` importa de `astro:env/server`, así que el build falla si alguien lo usa desde código de navegador.
  - `database.types.ts`, escrito a mano en el formato de `supabase gen types`.
  - `enums.ts`, con los valores de los enums en tiempo de ejecución.
- **Sesión**: cookies `HttpOnly`, `SameSite=Lax` y `Secure` en https. Las respuestas que escriben cookies llevan las cabeceras anticaché de `@supabase/ssr`.
- **`middleware.ts`**:
  - Llama a `supabase.auth.getUser()` en cada ruta privada.
  - Todo `/api` es privado salvo `/api/salud`.
  - Si el perfil no tiene el onboarding hecho, redirige a `/app/onboarding`.
  - En `/api` rechaza las escrituras desde otro origen (CSRF; Astro solo lo comprueba en formularios).
  - Aplica cabeceras de seguridad y `Cache-Control: private, no-store`.
  - Si faltan credenciales, las rutas privadas quedan cerradas. No hay atajos.
- **Acceso** (`/auth/*`):
  - Páginas `login`, `registro`, `recuperar` y `nueva-clave`.
  - `google` (OAuth con PKCE), `callback` (acepta `?code=` y `?token_hash=&type=`) y `salir` (solo POST).
  - Formularios sin JavaScript obligatorio: labels, `aria-invalid`, errores asociados con `aria-describedby` y un resumen de errores que recibe el foco y enlaza a cada campo.
  - El `next` tras el login se valida contra open redirect.
  - Ningún mensaje confirma si un correo existe.
- **API**:
  - `GET/PATCH /api/perfil`: Zod estricto, así que `plan` o `gems` se rechazan con 422.
  - `GET/POST /api/carta`: calcula con `astro-engine` en el servidor y guarda la carta.
  - `GET /api/uso`.
  - `GET /api/salud`.
  - Todas responden JSON con la forma `{ data }` o `{ error: { code, message, fields? } }` y sin detalles internos.
- **Cuota de IA** (`lib/server/quota.ts`): `withAiQuota()` consume antes de llamar a la IA y devuelve la lectura si la generación falla. Lo usará el endpoint de lecturas de la Fase 7.
- **Onboarding mínimo** (`/app/onboarding`): guarda los datos de nacimiento, calcula y guarda la carta, y `/app` muestra Sol, Luna y Ascendente reales. Si no se sabe la hora, calcula a las 12:00 y no muestra el ascendente.
- **Seguridad**:
  - CSP con hashes mediante `security.csp` de Astro, sin `unsafe-inline`. En rutas SSR se envía como cabecera, así que `frame-ancestors 'none'` es efectivo.
  - Cabeceras HSTS, `nosniff`, `Referrer-Policy`, `X-Frame-Options`, COOP y `Permissions-Policy`.
  - Las directivas están en `lib/security/policy.ts`.

## Verificado (desde `v2/`)
| Comando | Resultado |
|---|---|
| `npm run check` | 0 errores, 0 avisos (62 ficheros) |
| `npm run lint` | limpio |
| `npm test` | **107/107**: 30 de RLS en PGlite, 55 nuevos de validación/rutas/cuota/seguridad y 22 previos (21 del motor + 1 smoke) |
| `npm run build` | OK |
| `npm run test:e2e` | **54/54** en móvil, tablet y escritorio |

- **Tests de RLS**:
  - Aplican las migraciones dos veces para comprobar que son idempotentes.
  - Comprueban que todas las tablas tienen RLS y que ninguna función `security definer` es ejecutable por `anon`.
  - Comprueban que ningún usuario lee ni modifica datos de otro.
  - Comprueban la cuota: la sexta lectura del plan free se bloquea y no se puede reiniciar borrando eventos.
  - Antes de dar los tests por buenos, añadí `plan` a los permisos de UPDATE y abrí la política de lectura: 4 tests fallaron, como debía ser.
- **e2e**:
  - Usan un mock de GoTrue/PostgREST (`tests/e2e/support/mock-supabase.mjs`).
  - Cubren: redirección al login, que una cookie de sesión falsificada no abre `/app`, foco en los errores, login y cierre de sesión con cookie HttpOnly, `next` externo bloqueado, CSRF, cabeceras de seguridad y axe WCAG 2.2 AA en todas las páginas, también con sesión y en estado de error. Tampoco hay scroll horizontal a 320 px.
  - El onboarding se prueba de punta a punta: para el 15/04/1990 a las 10:30 en Madrid, `/app` muestra Sol Aries 25°06′, Luna Sagitario 22°08′ y ASC Géminis 19°10′, calculados por el motor.
- **CSP**: ejecuté la función de Vercel compilada en local. `/auth/login` devuelve `content-security-policy` con hashes y sin `unsafe-inline`, y las redirecciones y el JSON llevan HSTS, `X-Frame-Options` y `no-store`.

## Para conectar el proyecto real (pendiente, requiere tus credenciales)
1. Crea **`v2/.env.local`** (Supabase → Settings → API) con:
   - `PUBLIC_SUPABASE_URL=https://mdtgjgfeoudiyotgcxsy.supabase.co`
   - `PUBLIC_SUPABASE_ANON_KEY=` con la clave anon o publishable (`sb_publishable_…`)
   - `SUPABASE_SERVICE_ROLE_KEY=` con la clave service_role o secret (`sb_secret_…`)
2. **Migraciones**: `npx supabase link --project-ref mdtgjgfeoudiyotgcxsy` y después `npx supabase db push`. También se pueden aplicar con el MCP de Supabase una vez autenticado.
3. **Tipos**: `npx supabase gen types typescript --project-id mdtgjgfeoudiyotgcxsy --schema public > src/lib/supabase/database.types.ts`. Después hay que pasar `npm run check`. Los valores de los enums viven en `enums.ts`, así que no se pierden al regenerar.
4. **Auth → URL Configuration**:
   - Site URL: `https://zodi.aibueno.es`.
   - Redirect URLs: `https://zodi.aibueno.es/auth/callback`, `http://localhost:4321/auth/callback` y el patrón de previews de Vercel.
5. **Auth → Providers → Email**:
   - Confirmación de correo activada.
   - Contraseña de 10 caracteres como mínimo, con letras y dígitos (igual que en Zod).
6. **Plantillas de correo**: usar `token_hash`, que funciona aunque el enlace se abra en otro navegador.
   - Confirmar registro: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/app/onboarding`
   - Recuperar contraseña: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`
7. **Google**: crear un cliente OAuth en Google Cloud con la URI de redirección `https://mdtgjgfeoudiyotgcxsy.supabase.co/auth/v1/callback`, y pegar el ID y el secreto en Supabase → Providers → Google.
8. **Comprobación final**: ejecutar los Security y Performance Advisors de Supabase y probar a mano: registrarse, confirmar el correo, completar el onboarding, cerrar sesión, recuperar la contraseña y entrar con Google.

## Secretos y rotación
- Solo en `v2/.env.local` (ignorado por git) y en las variables de entorno de Vercel, nunca en el chat ni en commits.
- `SUPABASE_SERVICE_ROLE_KEY` solo se lee en `admin.ts`.
- **Rotación** (si una clave se filtra, o cada 6 meses):
  1. En Supabase → Settings → API, crea una clave secret nueva. Las claves nuevas permiten tener dos a la vez.
  2. Actualízala en Vercel (Production y Preview) y en `.env.local`.
  3. Vuelve a desplegar.
  4. Revoca la clave antigua.
  5. Revisa los logs de Auth y de la base de datos del periodo expuesto.
- La clave anon/publishable es pública por diseño: la protección la da la RLS, no el secreto de esa clave.

## Riesgos y limitaciones
- **La RLS está probada en PGlite** con una réplica de los roles de Supabase (`tests/db/supabase-shim.sql`), no contra Supabase. Hay que repetirla con los Advisors en cuanto se apliquen las migraciones.
- **Los tipos están escritos a mano** hasta que se ejecute `supabase gen types`.
- **La CSP no actúa en `astro dev`**, así que los e2e no la cubren. Está verificada sobre el build; falta confirmarla en un preview de Vercel, sobre todo `form-action` en el flujo de Google.
- **Tablet en e2e** usa Chromium con el viewport y el táctil de un iPad: WebKit no arranca en Windows porque falta `icutu77.dll`. El motor Safari queda pendiente para CI en Linux (Fase 8).
- **Onboarding provisional**: latitud, longitud y zona horaria se escriben a mano hasta que llegue la geocodificación en la Fase 3.
- **Cliente de navegador sin sesión**, por las cookies HttpOnly. Lo privado se pide a `/api/*`. Si en el futuro hace falta realtime autenticado, habrá que revisarlo.
- **Coste de `getUser()`**: hace una petición a Supabase Auth en cada ruta privada. Si la latencia pesa, en la Fase 8 se puede valorar `getClaims()` con claves JWT asimétricas.
- **Bloqueos de amistad**: solo se puede bloquear una solicitud pendiente. Bloquear a un amigo ya aceptado queda para la Fase 7.
- **`npm audit`** marca 8 vulnerabilidades altas, todas heredadas de la Fase 0:
  - 3 en producción: `@astrojs/vercel` → `@vercel/routing-utils` → `path-to-regexp`, que se usa al construir las rutas.
  - El resto en herramientas de lint: `eslint-plugin-astro` → `braces`.
  - `npm audit fix --force` haría cambios rompedores, así que lo dejo para la revisión de la Fase 8.
- **Sin rate limiting propio**: de momento solo están los límites de Supabase Auth y la cuota de IA. Fase 8.
- **Enlaces a páginas inexistentes**: los de la navegación (`/app/carta`, `/app/horoscopo`…) dan 404 hasta la Fase 3.
- **Sigue pendiente de antes**: contrastar las cúspides Placidus con Astro.com (Fase 3).

## Conexión con el proyecto real (11/10/2026)
Hecho en `mdtgjgfeoudiyotgcxsy` (West EU, Postgres 17.11):
- **Base de datos.** Contraseña regenerada desde el panel (generada por Supabase). `SUPABASE_DB_URL` (pooler de sesión `aws-0-eu-west-1`) está en `v2/.env.local`.
- **Migraciones.** 9 aplicadas con `node scripts/db/migrate.mjs`, que las registra en `supabase_migrations.schema_migrations`, el mismo historial que usa la CLI.
- **Lugares.** 236.041 y 91.636 alias cargados con `node scripts/places/import.mjs`.
- **Verificado en remoto:**
  - Todas las tablas tienen RLS y ninguna función `security definer` es ejecutable por `anon`.
  - Con la clave pública no se puede escribir en `places` ni leer `profiles` (401).
  - El trigger de alta de perfil existe.
  - `search_places` tarda 0–2 ms con nombres completos y ≤ 56 ms con prefijos de 2 letras.
  - Los tipos manuales coinciden con 13 tablas, 103 columnas y 6 funciones.
- **Auth.**
  - Site URL: `http://localhost:4321`. Pasará a `https://zodi.aibueno.es` en la Fase 8: ese dominio todavía sirve la app Next con Firebase.
  - Redirect URLs: `http://localhost:4321/**` y `https://zodi.aibueno.es/**`.
  - Contraseña: mínimo 10 caracteres, con letras y dígitos (igual que la validación Zod).
  - Confirmación por correo activada.
- **Smoke test local contra el proyecto real.** Las páginas públicas responden 200, `/app/**` redirige al login con `next` y la API privada devuelve 401.

Pendiente (requiere al usuario):
1. **SMTP propio**: sin él, Supabase solo envía correos a miembros del equipo y 2 por hora, así que los usuarios reales no recibirían la confirmación. Además, sin SMTP las plantillas no se pueden editar.
   - **Recomendado: Resend** (gratis 3.000/mes y 100/día). Servirá también para los emails de la Fase 7.
   - Necesita crear la cuenta y verificar el dominio `aibueno.es` con registros DNS.
   - Después, poner las plantillas `token_hash` (ver arriba) y subir el límite en Rate Limits.
   - Hasta entonces, las plantillas por defecto funcionan con el flujo PKCE (`?code=`), siempre que el enlace se abra en el mismo navegador.
2. **Google OAuth**: crear el cliente OAuth en Google Cloud con la redirect URI `https://mdtgjgfeoudiyotgcxsy.supabase.co/auth/v1/callback` y pegar el ID y el secreto en Supabase → Sign In / Providers → Google. El secreto debe pegarlo el usuario.
3. **Rotar** la clave `sb_secret_…` (se pegó en el chat) y la contraseña de la base de datos (pasó por la conversación al guardarla). Después, actualizar `.env.local`.

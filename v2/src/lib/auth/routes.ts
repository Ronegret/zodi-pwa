/**
 * Reglas de acceso por ruta. Puras para poder testearlas: el middleware solo
 * las aplica. Todo /api es privado salvo lo listado aquí (deny by default).
 */

export type RouteKind =
  | 'public'
  | 'guest-only' // login, registro, recuperar: con sesión se va a /app
  | 'session-only' // requiere sesión pero no onboarding (nueva contraseña)
  | 'onboarding'
  | 'app'
  | 'api-public'
  | 'api-private';

const PUBLIC_API = new Set(['/api/salud']);
const GUEST_ONLY = new Set(['/auth/login', '/auth/registro', '/auth/recuperar']);
const SESSION_ONLY = new Set(['/auth/nueva-clave']);

/** Minúsculas y sin barra final: `/APP/` y `/app` no pueden recibir trato distinto. */
export function normalizePath(pathname: string): string {
  const lower = pathname.toLowerCase();
  return lower.length > 1 ? lower.replace(/\/+$/, '') || '/' : lower;
}

export function classifyRoute(pathname: string): RouteKind {
  const path = normalizePath(pathname);
  if (path === '/api' || path.startsWith('/api/')) {
    return PUBLIC_API.has(path) ? 'api-public' : 'api-private';
  }
  if (path === '/app/onboarding') return 'onboarding';
  if (path === '/app' || path.startsWith('/app/')) return 'app';
  if (GUEST_ONLY.has(path)) return 'guest-only';
  if (SESSION_ONLY.has(path)) return 'session-only';
  return 'public';
}

export function requiresSession(kind: RouteKind): boolean {
  return (
    kind === 'app' || kind === 'onboarding' || kind === 'session-only' || kind === 'api-private'
  );
}

/**
 * Destino interno seguro tras login. Rechaza URLs absolutas, `//host`,
 * barras invertidas y caracteres de control (open redirect).
 */
export function safeNext(next: string | null | undefined, fallback = '/app'): string {
  if (!next || next.length > 512 || !next.startsWith('/') || next.startsWith('//')) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f]/.test(next)) return fallback;
  try {
    const base = 'https://zodi.invalid';
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

export function loginPath(url: URL): string {
  const next = safeNext(url.pathname + url.search);
  return next === '/app' ? '/auth/login' : `/auth/login?next=${encodeURIComponent(next)}`;
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
export const isMutating = (method: string) => MUTATING.has(method.toUpperCase());

/**
 * CSRF para /api: Astro solo comprueba el origen en envíos de formulario,
 * así que aquí se exige también para JSON. Sin Origin se acepta solo si el
 * navegador declara Sec-Fetch-Site same-origin.
 */
export function isSameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get('origin');
  if (origin) return origin === url.origin;
  return request.headers.get('sec-fetch-site') === 'same-origin';
}

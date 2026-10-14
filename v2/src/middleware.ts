import { defineMiddleware } from 'astro:middleware';
import { fail, unauthorized } from '@/lib/api/http';
import {
  classifyRoute,
  isMutating,
  isSameOrigin,
  loginPath,
  requiresSession,
} from '@/lib/auth/routes';
import { SECURITY_HEADERS } from '@/lib/security/policy';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Sesión real en cada petición privada: getUser() valida el token contra
 * Supabase Auth (no basta con que exista una cookie). Sin Supabase
 * configurado las rutas privadas se cierran; no hay ningún atajo.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request } = context;
  const kind = classifyRoute(url.pathname);
  const isApi = kind === 'api-private' || kind === 'api-public';

  if (isApi && isMutating(request.method) && !isSameOrigin(request, url)) {
    return finalize(fail(403, 'forbidden', 'Origen no permitido.'));
  }

  const supabase = createSupabaseServerClient(context);
  context.locals.supabase = supabase?.client ?? null;
  context.locals.user = null;
  context.locals.profile = null;

  let response: Response;
  if (kind === 'public' || kind === 'api-public' || !supabase) {
    response = requiresSession(kind) ? deny(kind, url) : await next();
  } else {
    const { data } = await supabase.client.auth.getUser();
    const user = data.user;
    context.locals.user = user;

    if (kind === 'guest-only') {
      response = user ? context.redirect('/app', 303) : await next();
    } else if (!user) {
      response = deny(kind, url);
    } else if (kind === 'app' || kind === 'onboarding') {
      // Una sola lectura del perfil por petición: la usan layout y páginas.
      const { data: profile } = await supabase.client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      context.locals.profile = profile;
      response =
        kind === 'app' && !profile?.onboarding_completed_at
          ? context.redirect('/app/onboarding', 303)
          : await next();
    } else {
      response = await next();
    }
  }

  return finalize(response, supabase?.pendingHeaders, kind !== 'public');
});

function deny(kind: ReturnType<typeof classifyRoute>, url: URL): Response {
  if (kind === 'api-private') return unauthorized();
  return new Response(null, { status: 303, headers: { Location: loginPath(url) } });
}

/** Cabeceras de seguridad y, en rutas con sesión, nada de caché compartida. */
function finalize(response: Response, sessionHeaders?: Headers, isPrivate = true): Response {
  let res = response;
  try {
    res.headers.set('X-Content-Type-Options', 'nosniff');
  } catch {
    // Respuestas con cabeceras inmutables (Response.redirect, fetch): se clonan.
    res = new Response(response.body, response);
  }
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) res.headers.set(key, value);
  sessionHeaders?.forEach((value, key) => res.headers.set(key, value));
  if (isPrivate && !res.headers.has('Cache-Control'))
    res.headers.set('Cache-Control', 'private, no-store');
  return res;
}

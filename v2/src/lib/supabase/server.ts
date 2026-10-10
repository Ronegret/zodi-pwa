import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import { getSupabaseConfig } from './config';
import type { Database } from './database.types';

export type ZodiSupabaseClient = SupabaseClient<Database>;

interface RequestContext {
  request: Request;
  url: URL;
  cookies: AstroCookies;
}

/**
 * Cliente por petición con la sesión en cookies HttpOnly. Crear uno nuevo en
 * cada petición: @supabase/ssr solo entrega las cabeceras anticaché en la
 * primera escritura de cookies de cada cliente.
 * Las cabeceras anticaché se guardan en `pendingHeaders` y el middleware las
 * aplica a la respuesta, para que ninguna CDN sirva la sesión de otro.
 */
export function createSupabaseServerClient(ctx: RequestContext) {
  const config = getSupabaseConfig();
  if (!config) return null;
  const pendingHeaders = new Headers();
  const secure = ctx.url.protocol === 'https:';

  const client = createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(ctx.request.headers.get('cookie') ?? '').map(
          ({ name, value }) => ({
            name,
            value: value ?? '',
          }),
        );
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          ctx.cookies.set(name, value, {
            ...options,
            path: '/',
            httpOnly: true,
            secure,
            sameSite: 'lax',
          });
        }
        for (const [key, value] of Object.entries(headers)) pendingHeaders.set(key, value);
      },
    },
  });

  return { client, pendingHeaders };
}

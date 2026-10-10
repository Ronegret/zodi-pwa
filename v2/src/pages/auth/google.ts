import type { APIRoute } from 'astro';
import { safeNext } from '@/lib/auth/routes';

/** POST (formulario) → Supabase → Google. El verificador PKCE queda en cookie HttpOnly. */
export const POST: APIRoute = async ({ url, locals, redirect }) => {
  const supabase = locals.supabase;
  if (!supabase) return redirect('/auth/login?aviso=no-disponible', 303);

  const next = safeNext(url.searchParams.get('next'));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) return redirect('/auth/login?aviso=google-error', 303);
  return redirect(data.url, 303);
};

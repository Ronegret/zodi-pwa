import type { APIRoute } from 'astro';

/** Solo POST: un <img src="/auth/salir"> de otra web no puede cerrarte la sesión. */
export const POST: APIRoute = async ({ locals, redirect }) => {
  await locals.supabase?.auth.signOut({ scope: 'local' });
  return redirect('/auth/login?aviso=salida', 303);
};

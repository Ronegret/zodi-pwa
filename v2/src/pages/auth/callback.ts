import type { EmailOtpType } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';
import { safeNext } from '@/lib/auth/routes';

const OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);
const isOtpType = (t: string | null): t is EmailOtpType =>
  t !== null && OTP_TYPES.has(t as EmailOtpType);

/**
 * Vuelta desde Google (PKCE: ?code=) y desde los enlaces de correo
 * (?token_hash=&type=, ver plantillas en docs/FASE-2-informe.md).
 */
export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const supabase = locals.supabase;
  if (!supabase) return redirect('/auth/login?aviso=no-disponible', 303);

  const next = safeNext(url.searchParams.get('next'));
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirect(next, 303);
    console.error('[auth] exchangeCodeForSession', error.code ?? error.status);
  } else if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return redirect(type === 'recovery' ? '/auth/nueva-clave' : next, 303);
    console.error('[auth] verifyOtp', error.code ?? error.status);
  }

  return redirect('/auth/login?aviso=enlace-invalido', 303);
};

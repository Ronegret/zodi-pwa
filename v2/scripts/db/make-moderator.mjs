/**
 * Da (o quita, con --quitar) permisos de moderación a una cuenta por su correo.
 * Solo se puede hacer así: desde la app nadie puede hacerse moderador.
 *   node scripts/db/make-moderator.mjs persona@correo.com
 *   node scripts/db/make-moderator.mjs persona@correo.com --quitar
 */
import postgres from 'postgres';
import { loadEnv } from './env.mjs';

const email = process.argv[2];
const remove = process.argv.includes('--quitar');
if (!email || !email.includes('@'))
  throw new Error('Uso: node scripts/db/make-moderator.mjs <correo>');

const env = loadEnv();
if (!env.SUPABASE_DB_URL) throw new Error('Falta SUPABASE_DB_URL en .env.local');
const sql = postgres(env.SUPABASE_DB_URL, { ssl: 'require', max: 1, prepare: false });

try {
  const rows = await sql`
    update public.profiles p set is_moderator = ${!remove}
    from auth.users u
    where u.id = p.id and lower(u.email) = lower(${email})
    returning p.id`;
  console.log(
    rows.length
      ? `${remove ? 'Quitada' : 'Dada'} la moderación a la cuenta (${rows.length}).`
      : 'No hay ninguna cuenta con ese correo.',
  );
} finally {
  await sql.end();
}

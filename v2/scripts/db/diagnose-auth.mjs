/**
 * Diagnóstico de altas: usuarios de Auth sin perfil y estado del trigger
 * que crea el perfil. Solo recuentos y fechas, sin datos personales.
 *   node scripts/db/diagnose-auth.mjs
 */
import postgres from 'postgres';
import { loadEnv } from './env.mjs';

const env = loadEnv();
if (!env.SUPABASE_DB_URL) throw new Error('Falta SUPABASE_DB_URL en .env.local');
const sql = postgres(env.SUPABASE_DB_URL, { ssl: 'require', max: 1, prepare: false });

try {
  const [counts] = await sql`
    select
      (select count(*)::int from auth.users) as auth_users,
      (select count(*)::int from public.profiles) as profiles,
      (select count(*)::int from auth.users u
        where not exists (select 1 from public.profiles p where p.id = u.id)) as sin_perfil`;
  const triggers = await sql`
    select t.tgname, t.tgenabled, c.relname, n.nspname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal and n.nspname = 'auth' and c.relname = 'users'`;
  const users = await sql`
    select u.created_at, u.email_confirmed_at is not null as confirmado,
      u.raw_app_meta_data ->> 'provider' as proveedor,
      exists (select 1 from public.profiles p where p.id = u.id) as tiene_perfil
    from auth.users u order by u.created_at desc limit 12`;
  console.log({ counts, triggers, users });
} finally {
  await sql.end({ timeout: 5 });
}

/**
 * Comprueba en el Supabase real lo que añade la migración de actividad (8C):
 * RLS de user_achievements, funciones cerradas a anon y columnas nuevas.
 * Solo lee el catálogo: no toca datos de nadie.
 *   node scripts/db/verify-activity.mjs
 */
import postgres from 'postgres';
import { loadEnv } from './env.mjs';

const env = loadEnv();
if (!env.SUPABASE_DB_URL) throw new Error('Falta SUPABASE_DB_URL en .env.local');
const sql = postgres(env.SUPABASE_DB_URL, { ssl: 'require', max: 1, prepare: false });

try {
  const [table] = await sql`
    select c.relrowsecurity as rls,
      has_table_privilege('anon', c.oid, 'select') as anon_select,
      has_table_privilege('authenticated', c.oid, 'insert') as auth_insert
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'user_achievements'`;
  const fns = await sql`
    select p.proname,
      has_function_privilege('anon', p.oid, 'execute') as anon,
      has_function_privilege('authenticated', p.oid, 'execute') as authenticated
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('record_activity', 'toggle_favorite')
    order by 1`;
  const cols = await sql`
    select table_name, column_name from information_schema.columns
    where table_schema = 'public'
      and ((table_name = 'profiles' and column_name in ('last_active_on', 'best_streak'))
        or (table_name = 'readings' and column_name = 'favorite'))
    order by 1, 2`;
  const [{ level }] = await sql`select public.level_for_xp(300) as level`;

  console.log('user_achievements:', table);
  console.log('funciones:', fns);
  console.log('columnas:', cols.map((c) => `${c.table_name}.${c.column_name}`).join(', '));
  console.log('level_for_xp(300) =', level);

  const ok =
    table?.rls === true &&
    table.anon_select === false &&
    table.auth_insert === false &&
    fns.length === 2 &&
    fns.every((f) => !f.anon && f.authenticated) &&
    cols.length === 3 &&
    level === 3;
  console.log(ok ? 'OK: actividad, logros y favoritas listos' : 'FALLO: revisa la salida');
  process.exitCode = ok ? 0 : 1;
} finally {
  await sql.end();
}

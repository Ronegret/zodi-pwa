/**
 * Comprueba en el Supabase real lo que añade la migración de comunidad v2:
 * RLS en las tablas nuevas y funciones cerradas a anon.
 *   node scripts/db/verify-community.mjs
 */
import postgres from 'postgres';
import { loadEnv } from './env.mjs';

const env = loadEnv();
if (!env.SUPABASE_DB_URL) throw new Error('Falta SUPABASE_DB_URL en .env.local');
const sql = postgres(env.SUPABASE_DB_URL, { ssl: 'require', max: 1, prepare: false });

try {
  const rls = await sql`
    select c.relname, c.relrowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('post_reactions', 'content_reports')`;
  const fns = await sql`
    select p.proname,
      has_function_privilege('anon', p.oid, 'execute') as anon,
      has_function_privilege('authenticated', p.oid, 'execute') as authenticated
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('community_feed', 'post_comments', 'sync_sun_sign', 'hide_reported_content')`;
  const [cols] = await sql`
    select
      exists (select 1 from information_schema.columns
              where table_name = 'community_posts' and column_name = 'topic') as topic,
      exists (select 1 from information_schema.columns
              where table_name = 'profiles' and column_name = 'sun_sign') as sun_sign`;
  const [signs] = await sql`
    select count(*) filter (where sun_sign is not null)::int as con_signo, count(*)::int as perfiles
    from public.profiles`;
  console.log({ rls, fns, cols, signs });
} finally {
  await sql.end({ timeout: 5 });
}

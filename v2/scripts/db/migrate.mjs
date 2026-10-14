/**
 * Aplica supabase/migrations/*.sql pendientes contra SUPABASE_DB_URL y los
 * apunta en supabase_migrations.schema_migrations (el mismo historial que usa
 * la CLI de Supabase, así `supabase db push` sabrá qué está aplicado).
 *
 *   node scripts/db/migrate.mjs            # aplica las pendientes
 *   node scripts/db/migrate.mjs --dry-run  # solo las lista
 *
 * Cada migración va en su propia transacción: si una falla, no queda a medias.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { loadEnv } from './env.mjs';

const dryRun = process.argv.includes('--dry-run');
const dir = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url));
const env = loadEnv();
if (!env.SUPABASE_DB_URL) throw new Error('Falta SUPABASE_DB_URL en .env.local');

const sql = postgres(env.SUPABASE_DB_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
  onnotice: () => {},
});

try {
  await sql.unsafe(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text not null primary key,
      statements text[],
      name text
    );
  `);
  const applied = new Set(
    (await sql`select version from supabase_migrations.schema_migrations`).map((r) => r.version),
  );
  const files = readdirSync(dir)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();
  const pending = files.filter((f) => !applied.has(f.split('_')[0]));
  console.log(
    `Migraciones: ${files.length} · aplicadas: ${applied.size} · pendientes: ${pending.length}`,
  );

  for (const file of pending) {
    const [version, ...rest] = file.replace(/\.sql$/, '').split('_');
    const name = rest.join('_');
    if (dryRun) {
      console.log(`  pendiente ${file}`);
      continue;
    }
    const body = readFileSync(dir + file, 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`
        insert into supabase_migrations.schema_migrations (version, name, statements)
        values (${version}, ${name}, ${[body]})
      `;
    });
    console.log(`  ✓ ${file}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}

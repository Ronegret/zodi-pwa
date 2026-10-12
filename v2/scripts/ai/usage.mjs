/**
 * Consumo de IA por tipo de lectura (solo lectura): número, tokens medios de
 * entrada y salida y coste estimado. Uso (desde v2/):
 *   node scripts/ai/usage.mjs [--dias 30]
 * Precios por millón de tokens: ajústalos aquí si cambian.
 */
import postgres from 'postgres';
import { loadEnv } from '../db/env.mjs';

// USD por millón de tokens (estándar). Revisar en platform.claude.com/docs/en/about-claude/pricing.
const PRICES = {
  haiku: { input: 0.1, output: 0.5 },
  sonnet: { input: 2, output: 10 },
  opus: { input: 4, output: 20 },
};
const priceOf = (model) =>
  PRICES[Object.keys(PRICES).find((k) => (model ?? '').includes(k)) ?? 'sonnet'];
const i = process.argv.indexOf('--dias');
const days = i > -1 ? Number(process.argv[i + 1]) : 30;

const env = loadEnv();
if (!env.SUPABASE_DB_URL) throw new Error('Falta SUPABASE_DB_URL en .env.local');
const sql = postgres(env.SUPABASE_DB_URL, { ssl: 'require', max: 1, prepare: false, onnotice: () => {} });

try {
  const rows = await sql`
    select kind::text as kind, model, count(*)::int as n,
           round(avg(input_tokens))::int as avg_in, round(avg(output_tokens))::int as avg_out,
           sum(input_tokens)::bigint as sum_in, sum(output_tokens)::bigint as sum_out
    from public.readings
    where created_at > now() - make_interval(days => ${days})
    group by kind, model order by sum(output_tokens) desc nulls last`;
  let total = 0;
  console.log(`Últimos ${days} días`);
  console.log(
    'tipo'.padEnd(20),
    'modelo'.padEnd(18),
    'n'.padStart(5),
    'entrada'.padStart(9),
    'salida'.padStart(8),
    'USD'.padStart(8),
  );
  for (const r of rows) {
    const price = priceOf(r.model);
    const usd = (Number(r.sum_in) * price.input + Number(r.sum_out) * price.output) / 1e6;
    total += usd;
    console.log(
      r.kind.padEnd(20),
      String(r.model ?? '—').padEnd(18),
      String(r.n).padStart(5),
      String(r.avg_in ?? '-').padStart(9),
      String(r.avg_out ?? '-').padStart(8),
      usd.toFixed(3).padStart(8),
    );
  }
  console.log(`Total estimado: ${total.toFixed(2)} USD (sin contar el descuento de la caché)`);
} finally {
  await sql.end();
}

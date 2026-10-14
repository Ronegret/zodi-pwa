/**
 * Genera (una vez) el significado de los nombres y apellidos de lists.mjs con
 * la IA y lo guarda en src/lib/names/data/{nombres,apellidos}.json.
 * Reanudable: salta lo que ya está. Uso (desde v2/):
 *   node scripts/names/generate.mjs --lotes-api   # API por lotes: 50 % más barato (recomendado)
 *   node scripts/names/generate.mjs [--solo nombres|apellidos] [--max 200] [--lote 40] [--paralelo 4]
 * Sin razonamiento previo y con esfuerzo bajo: el razonamiento se cobra como salida.
 */
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../db/env.mjs';
import { APELLIDOS, NOMBRES } from './lists.mjs';

const env = loadEnv();
if (!env.ANTHROPIC_API_KEY) throw new Error('Falta ANTHROPIC_API_KEY en .env.local');
const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const MODEL = env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const OUT = fileURLToPath(new URL('../../src/lib/names/data/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const only = arg('--solo');
const max = Number(arg('--max') ?? Infinity);
// Tamaño de tanda y tandas a la vez (bajar si la API devuelve 429).
const BATCH = Number(arg('--lote') ?? 40);
const PARALLEL = Number(arg('--paralelo') ?? 4);

export const norm = (w) =>
  w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');

const RULES = {
  nombres: `Para cada NOMBRE DE PILA da su origen (lengua o cultura: hebreo, latino, griego, germánico, árabe, vasco, catalán, náhuatl, quechua, mapuche, inglés…) y su significado.`,
  apellidos: `Para cada APELLIDO da su origen y tipo (patronímico, toponímico —de qué lugar—, de oficio, apodo, religioso…; y la lengua: castellano, vasco, catalán, gallego, portugués, italiano, alemán, árabe, mapuche, quechua, aimara, maya, chino, japonés…) y su significado. En los mapuches, quechuas, aimaras o mayas explica las partes (p. ej. «milla = oro + pan = puma»). En los patronímicos, de qué nombre vienen.`,
};

const SYSTEM = `Eres experto en onomástica hispana (etimología de nombres y apellidos). Escribes en español neutro, claro y breve.
Devuelves SOLO un objeto JSON válido, sin texto alrededor, con esta forma exacta:
{"Palabra": {"o": "origen (máx. 70 caracteres)", "m": "significado (máx. 140 caracteres, sin punto final)", "n": "curiosidad opcional (máx. 140)"}}
Reglas de oro:
- Exactitud ante todo. Si la etimología no es segura, dilo: «de origen discutido: …» con las hipótesis más aceptadas. Nunca inventes.
- "n" solo si es un dato conocido y comprobable (un santo, un personaje histórico, un lugar, una obra que lo popularizó). Si no, omite "n".
- Sin juicios de valor ni estereotipos. Sin emojis.
- Respeta la grafía de la palabra tal como te llega como clave.`;

function words(list) {
  const seen = new Set();
  const out = [];
  for (const w of list.split(/\s+/).filter(Boolean)) {
    const k = norm(w);
    if (k.length < 2 || seen.has(k)) continue;
    seen.add(k);
    out.push(w);
  }
  return out;
}

// Ahorro: sin razonamiento previo (se cobra como salida) y esfuerzo bajo.
const COST = MODEL.includes('haiku')
  ? { thinking: { type: 'disabled' } }
  : { thinking: { type: 'between_tools' }, output_config: { effort: 'low' } };
const params = (kind, batch) => ({
  model: MODEL,
  max_tokens: 8000,
  system: SYSTEM,
  messages: [{ role: 'user', content: `${RULES[kind]}\n\nLista:\n${batch.join('\n')}` }],
  ...COST,
});
const parse = (text) => JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));

async function ask(kind, batch) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await client.messages.create(params(kind, batch));
      return parse(res.content.map((c) => (c.type === 'text' ? c.text : '')).join(''));
    } catch (error) {
      console.warn(`  intento ${attempt} fallido: ${error.message?.slice(0, 120)}`);
      if (attempt === 3) return {};
      // Si es el límite por minuto, esperar de verdad.
      await new Promise((r) => setTimeout(r, (error.status === 429 ? 30_000 : 3000) * attempt));
    }
  }
  return {};
}

const clean = (s, n) =>
  typeof s === 'string' && s.trim()
    ? s.trim().replace(/\s+/g, ' ').replace(/\.$/, '').slice(0, n)
    : undefined;

const KINDS = [
  ['nombres', NOMBRES],
  ['apellidos', APELLIDOS],
].filter(([kind]) => !only || only === kind);
const fileOf = (kind) => `${OUT}${kind}.json`;
const load = (kind) => (existsSync(fileOf(kind)) ? JSON.parse(readFileSync(fileOf(kind), 'utf8')) : {});
function merge(data, json) {
  for (const [word, v] of Object.entries(json)) {
    const o = clean(v?.o, 80);
    const m = clean(v?.m, 140);
    if (!o || !m) continue;
    const entry = { w: word.trim(), o, m };
    const n = clean(v?.n, 140);
    if (n) entry.n = n;
    data[norm(word)] = entry;
  }
}
function save(kind, data) {
  const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(fileOf(kind), JSON.stringify(sorted, null, 0).replace(/},"/g, '},\n"') + '\n');
}
function pendingBatches(kind, list, data) {
  const pending = words(list)
    .filter((w) => !data[norm(w)])
    .slice(0, max);
  console.log(`${kind}: ${Object.keys(data).length} hechos, ${pending.length} por hacer`);
  const batches = [];
  for (let i = 0; i < pending.length; i += BATCH) batches.push(pending.slice(i, i + BATCH));
  return batches;
}

if (process.argv.includes('--lotes-api')) {
  // Todas las tandas en un solo lote de la API (50 % de descuento); se espera a que acabe.
  const requests = [];
  const datas = {};
  for (const [kind, list] of KINDS) {
    datas[kind] = load(kind);
    pendingBatches(kind, list, datas[kind]).forEach((b, i) =>
      requests.push({ custom_id: `${kind}-${i}`, params: params(kind, b) }),
    );
  }
  if (!requests.length) {
    console.log('Nada pendiente.');
  } else {
    const batch = await client.messages.batches.create({ requests });
    console.log(`Lote ${batch.id}: ${requests.length} peticiones. Esperando…`);
    let status = batch;
    while (status.processing_status !== 'ended') {
      await new Promise((r) => setTimeout(r, 30_000));
      status = await client.messages.batches.retrieve(batch.id);
      const c = status.request_counts;
      console.log(`  ${status.processing_status} · ok ${c.succeeded} · en curso ${c.processing} · error ${c.errored}`);
    }
    for await (const r of await client.messages.batches.results(batch.id)) {
      const kind = r.custom_id.split('-')[0];
      if (r.result.type !== 'succeeded') {
        console.warn(`  ${r.custom_id}: ${r.result.type}`);
        continue;
      }
      try {
        merge(datas[kind], parse(r.result.message.content.map((c) => (c.type === 'text' ? c.text : '')).join('')));
      } catch {
        console.warn(`  ${r.custom_id}: respuesta no válida`);
      }
    }
    for (const [kind] of KINDS) {
      save(kind, datas[kind]);
      console.log(`${kind}: ${Object.keys(datas[kind]).length} en total`);
    }
  }
} else {
  for (const [kind, list] of KINDS) {
    const data = load(kind);
    const batches = pendingBatches(kind, list, data);
    // Varias tandas a la vez, guardando tras cada grupo.
    for (let i = 0; i < batches.length; i += PARALLEL) {
      const results = await Promise.all(batches.slice(i, i + PARALLEL).map((b) => ask(kind, b)));
      for (const json of results) merge(data, json);
      save(kind, data);
      console.log(
        `  ${Math.min(i + PARALLEL, batches.length)}/${batches.length} tandas · ${Object.keys(data).length} en total`,
      );
    }
  }
}

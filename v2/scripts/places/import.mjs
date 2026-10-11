/**
 * Carga los lugares de nacimiento en Supabase (tablas places y
 * place_aliases) desde el volcado oficial de GeoNames (CC BY 4.0).
 *
 *   node scripts/places/import.mjs            # descarga y sube
 *   node scripts/places/import.mjs --dry-run  # solo cuenta, no sube
 *
 * Lee PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de v2/.env.local.
 * Idempotente: hace upsert por id, se puede repetir para actualizar.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const DUMP = 'https://download.geonames.org/export/dump/';
const DATASET = 'cities500';
const ALIAS_MIN_POPULATION = 50_000;
/**
 * Cuántos nombres alternativos (escritura latina) guardar según el tamaño:
 * en GeoNames las formas en español ("Londres", "Nueva York", "Pekín")
 * aparecen hacia la posición 25–45, así que las ciudades grandes van completas.
 */
const aliasCap = (population) => (population >= 100_000 ? 80 : 15);
const BATCH = 1000;
const dryRun = process.argv.includes('--dry-run');

function loadEnv() {
  const file = fileURLToPath(new URL('../../.env.local', import.meta.url));
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
  );
}

async function download(name, dir) {
  const target = join(dir, name);
  if (existsSync(target)) return target;
  const res = await fetch(DUMP + name);
  if (!res.ok) throw new Error(`Descarga de ${name}: HTTP ${res.status}`);
  writeFileSync(target, Buffer.from(await res.arrayBuffer()));
  return target;
}

/** Extrae un fichero de un .zip (deflate) sin dependencias. */
function unzipEntry(zipPath, entryName) {
  const buf = readFileSync(zipPath);
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('zip sin directorio central');
  let ptr = buf.readUInt32LE(eocd + 16);
  const entries = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < entries; i++) {
    const method = buf.readUInt16LE(ptr + 10);
    const size = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const local = buf.readUInt32LE(ptr + 42);
    const name = buf.toString('utf8', ptr + 46, ptr + 46 + nameLen);
    if (name === entryName) {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(start, start + size);
      return (method === 8 ? inflateRawSync(data) : data).toString('utf8');
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${entryName} no está en ${zipPath}`);
}

const normalize = (s) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');

const validZone = (tz) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const LATIN = /^[\p{Script=Latin}\s'’.-]+$/u;

function parse(citiesTsv, admin1Tsv) {
  const admin1 = new Map(
    admin1Tsv
      .split('\n')
      .filter(Boolean)
      .map((l) => l.split('\t'))
      .map(([code, name]) => [code, name]),
  );
  const places = [];
  const aliases = [];
  for (const line of citiesTsv.split('\n')) {
    if (!line) continue;
    const c = line.split('\t');
    const [id, name, , alternates, lat, lon, , , country, , admin1Code] = c;
    const population = Number(c[14]) || 0;
    const tz = c[17];
    if (!tz || !validZone(tz) || !country || country.length !== 2) continue;
    const nameNorm = normalize(name);
    places.push({
      id: Number(id),
      name,
      name_norm: nameNorm,
      country_code: country,
      admin1: admin1.get(`${country}.${admin1Code}`) ?? null,
      latitude: Number(lat),
      longitude: Number(lon),
      time_zone: tz,
      population,
    });
    if (population >= ALIAS_MIN_POPULATION && alternates) {
      const seen = new Set([nameNorm]);
      for (const alt of alternates.split(',')) {
        const norm = normalize(alt);
        if (norm.length < 2 || norm.length > 40 || seen.has(norm) || !LATIN.test(alt)) continue;
        seen.add(norm);
        aliases.push({ place_id: Number(id), alias_norm: norm });
        if (seen.size > aliasCap(population)) break;
      }
    }
  }
  return { places, aliases };
}

async function upsert(url, key, table, rows, conflict) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const res = await fetch(`${url}/rest/v1/${table}?on_conflict=${conflict}`, {
      method: 'POST',
      headers: {
        apikey: key,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows.slice(i, i + BATCH)),
    });
    if (!res.ok)
      throw new Error(`${table} lote ${i / BATCH}: HTTP ${res.status} ${await res.text()}`);
    process.stdout.write(`\r${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  process.stdout.write('\n');
}

const dir = join(tmpdir(), 'zodi-geonames');
mkdirSync(dir, { recursive: true });
console.log(`Descargando GeoNames ${DATASET} en ${dir}…`);
const zip = await download(`${DATASET}.zip`, dir);
const admin1File = await download('admin1CodesASCII.txt', dir);
const { places, aliases } = parse(
  unzipEntry(zip, `${DATASET}.txt`),
  readFileSync(admin1File, 'utf8'),
);
console.log(`Lugares: ${places.length} · alias: ${aliases.length}`);

if (dryRun) {
  console.log(
    'Ejemplo:',
    places.find((p) => p.name === 'Madrid'),
  );
  process.exit(0);
}

const env = loadEnv();
const url = process.env.PUBLIC_SUPABASE_URL ?? env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error('Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
await upsert(url, key, 'places', places, 'id');
await upsert(url, key, 'place_aliases', aliases, 'place_id,alias_norm');
console.log('Listo.');

/**
 * Base de conocimiento de ZODI: textos largos, graciosos y fáciles, generados
 * UNA vez con la API por lotes (50 % más barata) y guardados en
 * src/lib/knowledge/*.json. La app los lee sin gastar un solo token.
 * Reanudable: salta lo que ya está. Uso (desde v2/):
 *   node scripts/knowledge/generate.mjs [--solo numeros|chino|pares|planetas|nombres|apellidos] [--prueba]
 */
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../db/env.mjs';

const env = loadEnv();
const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const MODEL = env.ANTHROPIC_MODEL_FAST || 'claude-haiku-5-5';
const OUT = fileURLToPath(new URL('../../src/lib/knowledge/', import.meta.url));
const NAMES = fileURLToPath(new URL('../../src/lib/names/data/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const arg = (n) => process.argv[process.argv.indexOf(n) + 1];
const only = process.argv.includes('--solo') ? arg('--solo') : null;
const trial = process.argv.includes('--prueba');

const SIGNS = [
  'Aries',
  'Tauro',
  'Géminis',
  'Cáncer',
  'Leo',
  'Virgo',
  'Libra',
  'Escorpio',
  'Sagitario',
  'Capricornio',
  'Acuario',
  'Piscis',
];
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Datos objetivos calculados aquí (la IA NO los inventa: se le pasan como verdad).
const ELEM = ['Fuego', 'Tierra', 'Aire', 'Agua'];
const MODAL = ['Cardinal', 'Fijo', 'Mutable'];
const RULER = {
  Aries: 'Marte',
  Tauro: 'Venus',
  Géminis: 'Mercurio',
  Cáncer: 'la Luna',
  Leo: 'el Sol',
  Virgo: 'Mercurio',
  Libra: 'Venus',
  Escorpio: 'Plutón (y Marte en la astrología clásica)',
  Sagitario: 'Júpiter',
  Capricornio: 'Saturno',
  Acuario: 'Urano (y Saturno en la astrología clásica)',
  Piscis: 'Neptuno (y Júpiter en la astrología clásica)',
};
const ASPECT = [
  'son el mismo signo',
  'son signos vecinos, sin aspecto mayor (30°)',
  'están en sextil (60°)',
  'están en cuadratura (90°)',
  'están en trígono (120°)',
  'están en quincuncio (150°)',
  'están en oposición (180°)',
];
function pairFacts(a, b) {
  const i = SIGNS.indexOf(a),
    j = SIGNS.indexOf(b);
  const d = Math.abs(i - j);
  const dist = Math.min(d, 12 - d);
  const sign = (s, k) =>
    `${s}: elemento ${ELEM[k % 4]}, modalidad ${MODAL[k % 3]}, regido por ${RULER[s]}`;
  return `DATOS VERIFICADOS (úsalos tal cual, no los contradigas ni inventes otros):
- ${sign(a, i)}.
- ${sign(b, j)}.
- En la rueda ${a} y ${b} ${ASPECT[dist]}.`;
}
const ANIMALS = [
  'Rata',
  'Buey',
  'Tigre',
  'Conejo',
  'Dragón',
  'Serpiente',
  'Caballo',
  'Cabra',
  'Mono',
  'Gallo',
  'Perro',
  'Cerdo',
];
const SECRET = {
  Rata: 'Buey',
  Buey: 'Rata',
  Tigre: 'Cerdo',
  Cerdo: 'Tigre',
  Conejo: 'Perro',
  Perro: 'Conejo',
  Dragón: 'Gallo',
  Gallo: 'Dragón',
  Serpiente: 'Mono',
  Mono: 'Serpiente',
  Caballo: 'Cabra',
  Cabra: 'Caballo',
};
const TRIANGLES = [
  ['Rata', 'Dragón', 'Mono'],
  ['Buey', 'Serpiente', 'Gallo'],
  ['Tigre', 'Caballo', 'Perro'],
  ['Conejo', 'Cabra', 'Cerdo'],
];
function chineseFacts(a) {
  const aliados = TRIANGLES.find((t) => t.includes(a)).filter((x) => x !== a);
  const choque = ANIMALS[(ANIMALS.indexOf(a) + 6) % 12];
  return { aliados, amigo_secreto: SECRET[a], choque };
}

const VOICE = `Eres ZODI, el oráculo astral más cercano y gracioso: hablas de tú, como un amigo listo y con chispa que explica astrología y numerología a quien no sabe nada.
ESTILO (obligatorio):
- Frases cortas y claras. Cero jerga sin traducir: si dices "trígono" o "kin", explícalo en la misma frase con palabras de calle.
- Humor cariñoso en CADA texto: una comparación cotidiana o una ironía ("tu paciencia dura menos que el wifi del tren"), sin burlarte de nadie.
- Español neutro con calle (vale para España y Latinoamérica). Sin jerga de un solo país.
- Nada de predicciones absolutas ni consejos médicos/legales/financieros: es guía simbólica y entretenimiento.
- Nada de estereotipos hirientes. Sin emojis.
- Persona: los textos de numerología, horóscopo chino y planetas se escriben SIEMPRE en segunda persona, hablándole a quien tiene ese número, animal o posición ("tú ligas con intensidad", "te cuesta pedir ayuda"), nunca en tercera ("el 1 ama…"). Los de compatibilidad hablan en tercera persona de los dos signos ("cuando un Aries y un Leo se juntan…").
- Exactitud: los datos tradicionales (elementos, regentes, animales aliados, significados de números) tienen que ser los de la tradición, no inventados.
Devuelves SOLO un objeto JSON válido, sin texto alrededor ni bloques de código.`;

const SETS = {
  numeros: {
    file: 'numeros.json',
    items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33].map((n) => ({
      key: String(n),
      ask: `Numerología pitagórica: el número ${n}${[11, 22, 33].includes(n) ? ' (número maestro)' : ''}.
JSON: {"titulo":"apodo corto y gracioso (3-4 palabras)","frase":"una frase para compartir (máx. 110 caracteres)","esencia":"qué significa y cómo es, 3-4 frases (máx. 380 car.)","amor":"cómo ama y qué busca (máx. 300)","trabajo":"cómo trabaja, en qué brilla (máx. 300)","dinero":"su relación con el dinero (máx. 260)","salud":"hábitos y cuerpo, sin consejos médicos (máx. 240)","sombra":"su cara difícil, con cariño (máx. 280)","reto":"la lección de vida (máx. 240)","consejo":"qué hacer HOY con esto, en una frase (máx. 180)","compatibles":[números que encajan, de 1-9],"choca":[números que chocan, de 1-9],"compat_texto":"por qué encaja y por qué choca, 2 frases (máx. 280)"}`,
    })),
  },
  chino: {
    file: 'chino.json',
    items: [
      ...[
        'Rata',
        'Buey',
        'Tigre',
        'Conejo',
        'Dragón',
        'Serpiente',
        'Caballo',
        'Cabra',
        'Mono',
        'Gallo',
        'Perro',
        'Cerdo',
      ].map((a) => ({
        key: a,
        ask: `Horóscopo chino: el animal ${a}.
DATOS VERIFICADOS (úsalos tal cual): aliados ${chineseFacts(a).aliados.join(' y ')}; amigo secreto ${chineseFacts(a).amigo_secreto}; choque ${chineseFacts(a).choque}.
JSON: {"titulo":"apodo corto y gracioso (3-4 palabras)","frase":"frase para compartir (máx. 110 car.)","esencia":"cómo es, 3-4 frases (máx. 380)","amor":"cómo ama (máx. 300)","trabajo":"trabajo y talentos (máx. 300)","dinero":"relación con el dinero (máx. 240)","salud":"hábitos, sin consejos médicos (máx. 220)","sombra":"su cara difícil, con cariño (máx. 260)","consejo":"qué hacer hoy (máx. 180)","aliados":["los 2 animales del mismo triángulo de aliados"],"amigo_secreto":"el animal que es su amigo secreto (pareja de 6 alianzas)","choque":"el animal opuesto (a 6 posiciones)","compat_texto":"con quién encaja y con quién choca, 2 frases (máx. 280)","suerte":{"numeros":[3 números tradicionales],"colores":[2 colores tradicionales]}}`,
      })),
      {
        key: '_elementos',
        ask: `Los 5 elementos del horóscopo chino (Madera, Fuego, Tierra, Metal, Agua) como segundo apellido de un animal.
JSON: {"Madera":"cómo cambia al animal (máx. 220 car.)","Fuego":"…","Tierra":"…","Metal":"…","Agua":"…"} Cada uno con humor suave y datos tradicionales.`,
      },
    ],
  },
  pares: {
    file: 'pares.json',
    items: SIGNS.flatMap((a, i) =>
      SIGNS.slice(i).map((b) => ({
        key: `${slug(a)}-${slug(b)}`,
        ask: `Compatibilidad entre dos signos del zodiaco: ${a} y ${b}${a === b ? ' (dos personas del mismo signo)' : ''}. Explica con astrología real pero en palabras de calle.
${pairFacts(a, b)}
JSON: {"resumen":"la película en 2 frases con humor (máx. 260 car.)","por_que":"el motivo astrológico explicado fácil (máx. 260)","amor":"en pareja (máx. 300)","amistad":"como amistades (máx. 260)","trabajo":"trabajando juntos (máx. 260)","choque":"dónde chocan y cómo evitarlo (máx. 260)","truco":"el truco para que funcione, en una frase (máx. 170)"}`,
      })),
    ),
  },
  planetas: {
    file: 'planetas.json',
    items: [
      ['sol', 'el Sol (la esencia, quién eres cuando eres tú)'],
      ['luna', 'la Luna (las emociones, lo que necesitas para sentirte a salvo)'],
      ['ascendente', 'el Ascendente (la primera impresión, cómo te ven)'],
      ['mercurio', 'Mercurio (cómo piensas, hablas y aprendes)'],
      ['venus', 'Venus (cómo amas y qué te gusta)'],
      ['marte', 'Marte (cómo actúas, te enfadas y vas a por lo que quieres)'],
    ].flatMap(([id, what]) =>
      SIGNS.map((s) => ({
        key: `${id}-${slug(s)}`,
        ask: `Carta natal: ${what} en ${s}. Explícalo a alguien que no sabe astrología.
JSON: {"texto":"qué significa, en 4-5 frases claras y con humor, hablándole de tú (máx. 520 car.)","en_el_dia_a_dia":"un ejemplo concreto de la vida diaria (máx. 220)","luz":"su mejor versión (máx. 140)","sombra":"su cara difícil, con cariño (máx. 140)","tip":"un consejo práctico (máx. 160)"}`,
      })),
    ),
  },
};

// Nombres y apellidos: se AMPLÍA lo ya generado con una descripción larga (campo d).
function nameItems(kind) {
  const file = `${NAMES}${kind}.json`;
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const keys = Object.keys(data).filter((k) => !data[k].d);
  const out = [];
  for (let i = 0; i < keys.length; i += 20) {
    const part = keys.slice(i, i + 20);
    out.push({
      key: `${kind}#${i / 20}`,
      names: part,
      ask: `${kind === 'nombres' ? 'Nombres de pila' : 'Apellidos'} (ya tienen origen y significado verificados; NO los contradigas, amplíalos):
${part.map((k) => `- ${data[k].w}: ${data[k].o}; ${data[k].m}`).join('\n')}
Para cada uno escribe "d": ${
        kind === 'nombres'
          ? 'una descripción de 3-4 frases (máx. 380 car.): de dónde viene, cómo ha viajado por el mundo hispano, qué aire o fama cultural tiene (sin inventar rasgos de personalidad como hechos: di "se le atribuye" o "suena a"), con humor cariñoso. Si hay un santo, personaje o dato real conocido, cuéntalo.'
          : 'una descripción de 3-4 frases (máx. 380 car.): origen del apellido, cómo nació (oficio, lugar, apodo, hijo de…), dónde abunda y alguna curiosidad real y comprobable, con humor cariñoso. Si no estás seguro de algo, di que es discutido.'
      }
JSON: {"palabra_en_minuscula_sin_tildes":"descripción", ...} usando exactamente estas claves: ${part.join(', ')}`,
    });
  }
  return out;
}

async function run(name) {
  const isName = name === 'nombres' || name === 'apellidos';
  const file = isName ? `${NAMES}${name}.json` : `${OUT}${SETS[name].file}`;
  const data = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  let items = isName ? nameItems(name) : SETS[name].items.filter((it) => !data[it.key]);
  if (trial) items = items.slice(0, 2);
  console.log(`${name}: ${items.length} peticiones`);
  if (!items.length) return;
  const requests = items.map((it, i) => ({
    custom_id: `r${i}`,
    params: {
      model: MODEL,
      max_tokens: isName ? 5000 : name === 'pares' ? 2000 : 2000,
      system: [{ type: 'text', text: VOICE, cache_control: { type: 'ephemeral', ttl: '1h' } }],
      messages: [{ role: 'user', content: it.ask }],
      thinking: { type: 'disabled' },
    },
  }));
  const batch = await client.messages.batches.create({ requests });
  console.log(`  lote ${batch.id}`);
  let st = batch;
  while (st.processing_status !== 'ended') {
    await new Promise((r) => setTimeout(r, 20_000));
    st = await client.messages.batches.retrieve(batch.id);
    console.log(
      `  ${st.processing_status} ok ${st.request_counts.succeeded} · en curso ${st.request_counts.processing} · error ${st.request_counts.errored}`,
    );
  }
  let ok = 0;
  for await (const r of await client.messages.batches.results(batch.id)) {
    const it = items[Number(r.custom_id.slice(1))];
    if (r.result.type !== 'succeeded') {
      console.warn(`  ${it.key}: ${r.result.type}`);
      continue;
    }
    try {
      const text = r.result.message.content.map((c) => c.text ?? '').join('');
      const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
      if (isName) {
        for (const [k, d] of Object.entries(json)) {
          if (data[k] && typeof d === 'string' && d.trim()) {
            data[k].d = d.trim().replace(/\s+/g, ' ').slice(0, 420);
            ok++;
          }
        }
      } else {
        data[it.key] = json;
        if (name === 'chino' && !it.key.startsWith('_')) Object.assign(json, chineseFacts(it.key));
        ok++;
      }
    } catch {
      console.warn(`  ${it.key}: respuesta no válida`);
    }
  }
  const sorted = Object.fromEntries(
    Object.entries(data).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })),
  );
  writeFileSync(
    file,
    JSON.stringify(sorted, null, isName ? 0 : 1).replace(
      isName ? /},"/g : /^$/,
      isName ? '},\n"' : '',
    ) + '\n',
  );
  console.log(`  guardado: ${ok} nuevos`);
}

for (const name of ['numeros', 'chino', 'planetas', 'pares', 'nombres', 'apellidos']) {
  if (!only || only === name) await run(name);
}

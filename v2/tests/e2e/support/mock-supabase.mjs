/**
 * Supabase falso para e2e: lo mínimo de GoTrue (/auth/v1) y PostgREST
 * (/rest/v1) que usa la app, con estado en memoria y "RLS" por token.
 * Los tests crean usuarios propios con POST /__test/users, así los proyectos
 * de Playwright (móvil, tablet, escritorio) no se pisan entre sí.
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54329);
const PASSWORD = 'Estrella2024';

/** @type {Map<string, {id: string, email: string, password: string}>} */
const users = new Map();
/** @type {Map<string, Record<string, unknown>>} */
const profiles = new Map();
/** @type {Map<string, Record<string, unknown>[]>} */
const charts = new Map();
/** access/refresh token → user id */
const accessTokens = new Map();
const refreshTokens = new Map();
/** Lecturas guardadas (todas; la "RLS" filtra por usuario). */
const readings = [];
/** Cuota de IA usada hoy por usuario, y eventos (id → user id). */
const quotaUsed = new Map();
const quotaEvents = new Map();
let nextEventId = 1;
const DAILY_LIMIT = 5;
/** Clave de service role que Playwright pasa al servidor de la app. */
export const SERVICE_KEY = 'e2e-service-role-key';
/** Última petición a la IA falsa (para que los tests miren el prompt). */
/** Peticiones a la IA falsa (cada test busca la suya por un texto único). */
const aiRequests = [];

// Carta real (generada por el motor, ver tests/unit/e2e-fixture.test.ts).
const FIXTURE = JSON.parse(readFileSync(new URL('./fixture-chart.json', import.meta.url), 'utf8'));

/** Fila de perfil con las mismas columnas que la tabla real. */
function blankProfile(id, now) {
  return {
    id,
    display_name: 'E2E',
    username: null,
    avatar_url: null,
    birth_date: null,
    birth_time: null,
    birth_time_known: null,
    birth_place: null,
    birth_lat: null,
    birth_lon: null,
    time_zone: null,
    language: 'es',
    reading_tone: 'directo',
    favorite_topics: [],
    notification_prefs: [],
    relationship_status: null,
    partner_name: null,
    has_kids: null,
    kids_count: null,
    personal_bio: null,
    plan: 'free',
    gems: 0,
    xp: 0,
    level: 1,
    streak: 0,
    last_active_on: null,
    referral_code: id.slice(0, 10),
    referred_by: null,
    onboarding_completed_at: null,
    created_at: now,
    updated_at: now,
  };
}

function createUser({ onboarded }) {
  const id = randomUUID();
  const email = `e2e-${id.slice(0, 8)}@zodi.test`;
  users.set(id, { id, email, password: PASSWORD });
  const now = new Date().toISOString();
  profiles.set(id, {
    ...blankProfile(id, now),
    ...(onboarded
      ? {
          display_name: 'Ana Estrella',
          username: `ana_${id.slice(0, 6)}`,
          birth_date: '1990-04-15',
          birth_time: '10:30:00',
          birth_time_known: true,
          birth_place: 'Madrid, Comunidad de Madrid, España',
          birth_lat: 40.4168,
          birth_lon: -3.7038,
          time_zone: 'Europe/Madrid',
          xp: 340,
          level: 3,
          streak: 5,
          gems: 12,
          onboarding_completed_at: now,
        }
      : {}),
  });
  charts.set(
    id,
    onboarded
      ? [
          {
            id: randomUUID(),
            user_id: id,
            label: 'Yo',
            is_self: true,
            input: FIXTURE.input,
            chart: FIXTURE.chart,
            engine_version: FIXTURE.engine_version,
            created_at: now,
          },
        ]
      : [],
  );
  return { id, email, password: PASSWORD };
}

/** Tabla places simulada (mismas columnas que search_places). */
const PLACES = [
  {
    id: 3117735,
    name: 'Madrid',
    country_code: 'ES',
    admin1: 'Comunidad de Madrid',
    latitude: 40.4165,
    longitude: -3.70256,
    time_zone: 'Europe/Madrid',
    population: 3255944,
  },
  {
    id: 3871336,
    name: 'Santiago',
    country_code: 'CL',
    admin1: 'Región Metropolitana',
    latitude: -33.45694,
    longitude: -70.64827,
    time_zone: 'America/Santiago',
    population: 4837295,
  },
  {
    id: 3109642,
    name: 'Santiago de Compostela',
    country_code: 'ES',
    admin1: 'Galicia',
    latitude: 42.88052,
    longitude: -8.54569,
    time_zone: 'Europe/Madrid',
    population: 95092,
  },
  {
    id: 3128760,
    name: 'Barcelona',
    country_code: 'ES',
    admin1: 'Cataluña',
    latitude: 41.38879,
    longitude: 2.15899,
    time_zone: 'Europe/Madrid',
    population: 1620343,
  },
];
const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function searchPlaces(body) {
  const q = fold(String(body.p_query ?? ''));
  if (q.length < 2) return [];
  return PLACES.filter((p) => fold(p.name).startsWith(q))
    .sort(
      (x, y) =>
        Number(fold(y.name) === q) - Number(fold(x.name) === q) || y.population - x.population,
    )
    .slice(0, body.p_limit ?? 8);
}

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

function userJson(u) {
  return {
    id: u.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: u.email,
    email_confirmed_at: new Date(0).toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  };
}

function issueSession(u) {
  const now = Math.floor(Date.now() / 1000);
  const access = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({
      sub: u.id,
      role: 'authenticated',
      aud: 'authenticated',
      exp: now + 3600,
      iat: now,
      session_id: randomUUID(),
    }),
    'mock-signature',
  ].join('.');
  const refresh = randomUUID();
  accessTokens.set(access, u.id);
  refreshTokens.set(refresh, u.id);
  return {
    access_token: access,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: refresh,
    user: userJson(u),
  };
}

/** Responde y devuelve true (para saber que la petición ya está atendida). */
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
  return true;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function currentUser(req) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
  const id = accessTokens.get(token);
  return id ? users.get(id) : undefined;
}

const isServiceRole = (req) =>
  (req.headers.authorization ?? '').replace(/^Bearer /, '') === SERVICE_KEY;

/** Filtros `col=eq.valor` de PostgREST. */
function applyFilters(rows, params) {
  let out = rows;
  for (const [key, value] of params) {
    if (['select', 'order', 'limit'].includes(key)) continue;
    const [op, ...rest] = value.split('.');
    const expected = rest.join('.');
    if (op === 'eq') out = out.filter((r) => String(r[key]) === expected);
    if (op === 'neq') out = out.filter((r) => String(r[key]) !== expected);
    if (op === 'gte') out = out.filter((r) => String(r[key]) >= expected);
  }
  const order = params.get('order');
  if (order) {
    const [col, dir] = order.split('.');
    out = [...out].sort(
      (a, b) => (dir === 'desc' ? -1 : 1) * String(a[col]).localeCompare(String(b[col])),
    );
  }
  const limit = params.get('limit');
  return limit ? out.slice(0, Number(limit)) : out;
}

function respondRows(req, res, rows, status = 200) {
  const wantsObject = (req.headers.accept ?? '').includes('vnd.pgrst.object');
  if (!wantsObject) return send(res, status, rows);
  if (rows.length !== 1) {
    return send(res, 406, {
      code: 'PGRST116',
      message: 'JSON object requested, multiple (or no) rows returned',
      details: null,
      hint: null,
    });
  }
  return send(res, status, rows[0]);
}

async function handleAuth(req, res, url) {
  const path = url.pathname.replace('/auth/v1', '');
  if (path === '/token' && req.method === 'POST') {
    const body = await readBody(req);
    if (url.searchParams.get('grant_type') === 'refresh_token') {
      const id = refreshTokens.get(body.refresh_token);
      if (!id)
        return send(res, 400, {
          code: 'refresh_token_not_found',
          error_code: 'refresh_token_not_found',
          msg: 'Invalid Refresh Token',
        });
      return send(res, 200, issueSession(users.get(id)));
    }
    const u = [...users.values()].find(
      (x) => x.email === body.email && x.password === body.password,
    );
    if (!u)
      return send(res, 400, {
        code: 'invalid_credentials',
        error_code: 'invalid_credentials',
        msg: 'Invalid login credentials',
      });
    return send(res, 200, issueSession(u));
  }
  // Ajustes públicos de Auth: la app solo enseña "Continuar con Google" si está activado.
  if (path === '/settings' && req.method === 'GET') {
    return send(res, 200, { external: { google: true, email: true }, disable_signup: false });
  }
  if (path === '/user' && req.method === 'GET') {
    const u = currentUser(req);
    if (!u) return send(res, 403, { code: 'bad_jwt', error_code: 'bad_jwt', msg: 'invalid JWT' });
    return send(res, 200, userJson(u));
  }
  if (path === '/logout' && req.method === 'POST') {
    const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
    accessTokens.delete(token);
    return send(res, 204);
  }
  if (path === '/signup' && req.method === 'POST') {
    const body = await readBody(req);
    // Confirmación por correo activa: usuario sin sesión.
    return send(res, 200, {
      ...userJson({ id: randomUUID(), email: body.email }),
      email_confirmed_at: null,
    });
  }
  if (path === '/recover' && req.method === 'POST') return send(res, 200, {});
  return send(res, 404, { msg: `mock: ${req.method} ${url.pathname} no implementado` });
}

async function handleRest(req, res, url) {
  const u = currentUser(req);
  const [, , , resource, fn] = url.pathname.split('/');
  if (resource === 'rpc' && fn === 'search_places') {
    return send(res, 200, searchPlaces(await readBody(req)));
  }
  if (resource === 'rpc' && fn === 'ai_quota_status') {
    return send(res, 200, u ? [{ used: quotaUsed.get(u.id) ?? 0, daily_limit: DAILY_LIMIT }] : []);
  }
  if (resource === 'rpc' && fn === 'consume_ai_quota') {
    if (!u) return send(res, 401, { code: '42501', message: 'permission denied' });
    const used = quotaUsed.get(u.id) ?? 0;
    if (used >= DAILY_LIMIT) {
      return send(res, 200, [{ allowed: false, used, daily_limit: DAILY_LIMIT, event_id: null }]);
    }
    const id = nextEventId++;
    quotaUsed.set(u.id, used + 1);
    quotaEvents.set(id, u.id);
    return send(res, 200, [
      { allowed: true, used: used + 1, daily_limit: DAILY_LIMIT, event_id: id },
    ]);
  }
  if (resource === 'usage_events' && req.method === 'DELETE' && isServiceRole(req)) {
    const id = Number((url.searchParams.get('id') ?? '').replace('eq.', ''));
    const owner = quotaEvents.get(id);
    if (owner) {
      quotaEvents.delete(id);
      quotaUsed.set(owner, Math.max(0, (quotaUsed.get(owner) ?? 1) - 1));
    }
    return send(res, 204);
  }
  if (resource === 'readings') {
    if (req.method === 'POST') {
      if (!isServiceRole(req))
        return send(res, 401, { code: '42501', message: 'permission denied' });
      const row = {
        id: randomUUID(),
        created_at: new Date().toISOString(),
        ...(await readBody(req)),
      };
      readings.push(row);
      return respondRows(req, res, [row], 201);
    }
    if (req.method === 'GET') {
      const own = u ? readings.filter((r) => r.user_id === u.id) : [];
      return respondRows(req, res, applyFilters(own, url.searchParams));
    }
  }
  if (resource === 'profiles') {
    const visible = u ? [profiles.get(u.id)] : [];
    if (req.method === 'GET') return respondRows(req, res, applyFilters(visible, url.searchParams));
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const target = applyFilters(visible, url.searchParams);
      if (
        body.username &&
        [...profiles.values()].some((p) => p.username === body.username && p.id !== u?.id)
      ) {
        return send(res, 409, {
          code: '23505',
          message: 'duplicate key value violates unique constraint "profiles_username_key"',
          details: null,
          hint: null,
        });
      }
      for (const row of target) Object.assign(row, body, { updated_at: new Date().toISOString() });
      return respondRows(req, res, target);
    }
  }
  if (resource === 'natal_charts') {
    const own = u ? (charts.get(u.id) ?? []) : [];
    if (req.method === 'GET') return respondRows(req, res, applyFilters(own, url.searchParams));
    if (req.method === 'POST') {
      if (!u) return send(res, 401, { code: '42501', message: 'permission denied' });
      const body = await readBody(req);
      const row = {
        id: randomUUID(),
        user_id: u.id,
        created_at: new Date().toISOString(),
        ...body,
      };
      own.push(row);
      charts.set(u.id, own);
      return respondRows(req, res, [row], 201);
    }
  }
  const community = await handleCommunity(req, res, url, u, resource, fn);
  if (community !== undefined) return community;
  return send(res, 404, { message: `mock: ${req.method} ${url.pathname} no implementado` });
}

// ---------- Comunidad (misma lógica que la RLS y las funciones reales) ----------
const posts = [];
const comments = [];
const reactions = [];
const reports = [];

function authorCard(userId) {
  const p = profiles.get(userId) ?? {};
  return {
    author_id: userId,
    author_name: p.display_name ?? 'Alguien',
    author_username: p.username ?? null,
    author_avatar: p.avatar_url ?? null,
    author_level: p.level ?? 1,
    author_sign: (charts.get(userId) ?? []).length ? 'Aries' : null,
  };
}

function feedRow(p, viewerId) {
  const counts = {};
  for (const r of reactions.filter((x) => x.post_id === p.id)) {
    counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  }
  return {
    id: p.id,
    body: p.body,
    topic: p.topic,
    created_at: p.created_at,
    ...authorCard(p.author_id),
    comment_count: comments.filter((c) => c.post_id === p.id && c.status === 'published').length,
    reactions: counts,
    my_reactions: reactions
      .filter((x) => x.post_id === p.id && x.user_id === viewerId)
      .map((x) => x.kind)
      .sort(),
  };
}

const conflict = (res) =>
  send(res, 409, { code: '23505', message: 'duplicate key value', details: null, hint: null });

async function handleCommunity(req, res, url, u, resource, fn) {
  const id = (key) => (url.searchParams.get(key) ?? '').replace('eq.', '');
  if (resource === 'rpc' && fn === 'community_feed') {
    if (!u) return send(res, 401, { code: '42501', message: 'permission denied' });
    const { p_topic, p_before, p_limit } = await readBody(req);
    const rows = posts
      .filter((p) => p.status === 'published')
      .filter((p) => !p_topic || p.topic === p_topic)
      .filter((p) => !p_before || p.created_at < p_before)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, Math.min(Math.max(p_limit ?? 20, 1), 50));
    return send(
      res,
      200,
      rows.map((p) => feedRow(p, u.id)),
    );
  }
  if (resource === 'rpc' && fn === 'post_comments') {
    if (!u) return send(res, 401, { code: '42501', message: 'permission denied' });
    const { p_post } = await readBody(req);
    return send(
      res,
      200,
      comments
        .filter((c) => c.post_id === p_post && c.status === 'published')
        .map((c) => ({
          id: c.id,
          body: c.body,
          created_at: c.created_at,
          ...authorCard(c.author_id),
        })),
    );
  }
  if (
    !u &&
    ['community_posts', 'comments', 'post_reactions', 'content_reports'].includes(resource)
  ) {
    return send(res, 401, { code: '42501', message: 'permission denied' });
  }
  if (resource === 'community_posts' && req.method === 'POST') {
    const body = await readBody(req);
    const row = {
      id: randomUUID(),
      author_id: u.id,
      body: body.body,
      topic: body.topic ?? 'general',
      status: 'published',
      created_at: new Date().toISOString(),
    };
    posts.push(row);
    return respondRows(req, res, [{ id: row.id }], 201);
  }
  if (resource === 'community_posts' && req.method === 'DELETE') {
    const i = posts.findIndex((p) => p.id === id('id') && p.author_id === u.id);
    return send(res, 200, i >= 0 ? posts.splice(i, 1).map((p) => ({ id: p.id })) : []);
  }
  if (resource === 'comments' && req.method === 'POST') {
    const body = await readBody(req);
    const post = posts.find((p) => p.id === body.post_id && p.status === 'published');
    if (!post) return send(res, 403, { code: '42501', message: 'row-level security' });
    const row = {
      id: randomUUID(),
      post_id: body.post_id,
      author_id: u.id,
      body: body.body,
      status: 'published',
      created_at: new Date().toISOString(),
    };
    comments.push(row);
    return respondRows(req, res, [{ id: row.id }], 201);
  }
  if (resource === 'comments' && req.method === 'DELETE') {
    const i = comments.findIndex(
      (c) =>
        c.id === id('id') &&
        (c.author_id === u.id || posts.find((p) => p.id === c.post_id)?.author_id === u.id),
    );
    return send(res, 200, i >= 0 ? comments.splice(i, 1).map((c) => ({ id: c.id })) : []);
  }
  if (resource === 'post_reactions' && req.method === 'POST') {
    const { post_id, kind } = await readBody(req);
    if (reactions.some((r) => r.post_id === post_id && r.user_id === u.id && r.kind === kind)) {
      return conflict(res);
    }
    reactions.push({ post_id, user_id: u.id, kind });
    return send(res, 201);
  }
  if (resource === 'post_reactions' && req.method === 'DELETE') {
    const keep = reactions.filter(
      (r) => !(r.post_id === id('post_id') && r.user_id === u.id && r.kind === id('kind')),
    );
    reactions.splice(0, reactions.length, ...keep);
    return send(res, 204);
  }
  if (resource === 'content_reports' && req.method === 'POST') {
    const body = await readBody(req);
    const target = body.post_id ?? body.comment_id;
    if (reports.some((r) => r.reporter === u.id && r.target === target)) return conflict(res);
    reports.push({ reporter: u.id, target });
    const reporters = new Set(reports.filter((r) => r.target === target).map((r) => r.reporter));
    if (reporters.size >= 3) {
      const post = posts.find((p) => p.id === target);
      if (post) post.status = 'hidden';
    }
    return send(res, 201);
  }
  return undefined;
}

/**
 * API de Anthropic falsa: responde en streaming SSE como la real. Repite el
 * nombre y, en el tarot, las cartas que recibe, para que los tests
 * comprueben que el prompt lleva los datos de la persona.
 */
async function handleAi(req, res) {
  const body = await readBody(req);
  aiRequests.push(body);
  const prompt = [...body.system.map((b) => b.text), ...body.messages.map((m) => m.content)].join(
    '\n',
  );
  const name = /Nombre: ([^ (\n]+)/.exec(prompt)?.[1] ?? 'tú';
  const cards = [...prompt.matchAll(/- (Pasado|Presente|Futuro): [^·]+· ([^\n(]+)/g)].map((m) =>
    m[2].trim(),
  );
  const isChat = body.system.some((b) => b.text.includes('MODO CHAT'));
  const text = isChat
    ? `Oye **${name}**, respira. Cuéntame qué te pesa y lo miramos con tu carta.`
    : [
        `Mira, **${name}**: tu Sol en Aries llega con ganas de lío hoy.`,
        cards.length ? `Tus cartas: ${cards.join(', ')}.` : 'La Luna te pide calma.',
        '- **Amor:** di lo que piensas antes de las ocho.',
        '- **Trabajo:** termina lo pendiente.',
        '',
        '**Hoy haz esto:** escribe tres cosas que quieres soltar.',
      ].join('\n');
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
  const event = (type, data) =>
    res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
  event('message_start', {
    message: {
      id: 'msg_e2e',
      type: 'message',
      role: 'assistant',
      model: body.model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 120, output_tokens: 1 },
    },
  });
  event('content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
  for (const chunk of text.match(/[\s\S]{1,24}/g)) {
    event('content_block_delta', { index: 0, delta: { type: 'text_delta', text: chunk } });
    await new Promise((r) => setTimeout(r, 15));
  }
  event('content_block_stop', { index: 0 });
  event('message_delta', {
    delta: { stop_reason: 'end_turn', stop_sequence: null },
    usage: { output_tokens: 42 },
  });
  event('message_stop', {});
  res.end();
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
    if (url.pathname === '/__test/health') return send(res, 200, { ok: true });
    if (url.pathname === '/__test/users' && req.method === 'POST') {
      return send(res, 201, createUser(await readBody(req)));
    }
    if (url.pathname === '/__test/ai') {
      // Última petición cuyo system + mensajes contengan `contains`.
      const needle = url.searchParams.get('contains') ?? '';
      const found = aiRequests.findLast((r) =>
        JSON.stringify([r.system, r.messages]).includes(needle),
      );
      return send(res, found ? 200 : 404, found ?? { message: 'sin coincidencias' });
    }
    if (url.pathname === '/__test/quota' && req.method === 'POST') {
      const { userId, used } = await readBody(req);
      quotaUsed.set(userId, used);
      return send(res, 200, { ok: true });
    }
    if (url.pathname === '/v1/messages' && req.method === 'POST') return await handleAi(req, res);
    if (url.pathname.startsWith('/auth/v1/')) return await handleAuth(req, res, url);
    if (url.pathname.startsWith('/rest/v1/')) return await handleRest(req, res, url);
    return send(res, 404, { message: 'mock: ruta desconocida' });
  } catch (error) {
    console.error('[mock-supabase]', error);
    return send(res, 500, { message: 'mock: error interno' });
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`mock-supabase en http://127.0.0.1:${PORT}`);
});

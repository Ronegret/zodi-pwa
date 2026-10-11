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

/** Open-Meteo Geocoding simulado: unas pocas ciudades conocidas. */
const CITIES = [
  {
    id: 3117735,
    name: 'Madrid',
    latitude: 40.4165,
    longitude: -3.70256,
    timezone: 'Europe/Madrid',
    country: 'España',
    admin1: 'Comunidad de Madrid',
  },
  {
    id: 3871336,
    name: 'Santiago',
    latitude: -33.45694,
    longitude: -70.64827,
    timezone: 'America/Santiago',
    country: 'Chile',
    admin1: 'Región Metropolitana',
  },
  {
    id: 3109642,
    name: 'Santiago de Compostela',
    latitude: 42.88052,
    longitude: -8.54569,
    timezone: 'Europe/Madrid',
    country: 'España',
    admin1: 'Galicia',
  },
  {
    id: 3128760,
    name: 'Barcelona',
    latitude: 41.38879,
    longitude: 2.15899,
    timezone: 'Europe/Madrid',
    country: 'España',
    admin1: 'Cataluña',
  },
];
const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function handleGeocoding(res, url) {
  const q = fold(url.searchParams.get('name') ?? '');
  const results = CITIES.filter((c) => fold(c.name).startsWith(q));
  return send(res, 200, results.length ? { results } : { generationtime_ms: 0.1 });
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

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
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

/** Filtros `col=eq.valor` de PostgREST. */
function applyFilters(rows, params) {
  let out = rows;
  for (const [key, value] of params) {
    if (['select', 'order', 'limit'].includes(key) || !value.startsWith('eq.')) continue;
    const expected = value.slice(3);
    out = out.filter((r) => String(r[key]) === expected);
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
  if (resource === 'rpc' && fn === 'ai_quota_status') {
    return send(res, 200, u ? [{ used: 0, daily_limit: 5 }] : []);
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
  return send(res, 404, { message: `mock: ${req.method} ${url.pathname} no implementado` });
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
    if (url.pathname === '/__test/health') return send(res, 200, { ok: true });
    if (url.pathname === '/__test/users' && req.method === 'POST') {
      return send(res, 201, createUser(await readBody(req)));
    }
    if (url.pathname === '/v1/search') return handleGeocoding(res, url);
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

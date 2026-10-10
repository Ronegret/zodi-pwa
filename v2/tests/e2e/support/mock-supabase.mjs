/**
 * Supabase falso para e2e: lo mínimo de GoTrue (/auth/v1) y PostgREST
 * (/rest/v1) que usa la app, con estado en memoria y "RLS" por token.
 * Los tests crean usuarios propios con POST /__test/users, así los proyectos
 * de Playwright (móvil, tablet, escritorio) no se pisan entre sí.
 */
import { randomUUID } from 'node:crypto';
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

const SEED_CHART = {
  utc: '1990-04-15T08:30:00.000Z',
  planets: [
    { id: 'sun', lon: 10.08, sign: 'Aries', degree: 10, minute: 5, retrograde: false, house: 10 },
    { id: 'moon', lon: 32, sign: 'Tauro', degree: 2, minute: 0, retrograde: false, house: 11 },
  ],
  ascendant: { lon: 140.5, sign: 'Leo', degree: 20, minute: 30 },
  midheaven: { lon: 20, sign: 'Aries', degree: 20, minute: 0 },
  houses: [],
  aspects: [],
};

function createUser({ onboarded }) {
  const id = randomUUID();
  const email = `e2e-${id.slice(0, 8)}@zodi.test`;
  users.set(id, { id, email, password: PASSWORD });
  const now = new Date().toISOString();
  profiles.set(id, {
    id,
    display_name: 'E2E',
    username: null,
    plan: 'free',
    gems: 0,
    time_zone: null,
    reading_tone: 'directo',
    onboarding_completed_at: onboarded ? now : null,
    created_at: now,
    updated_at: now,
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
            input: { date: '1990-04-15', time: '10:30', timeKnown: true },
            chart: SEED_CHART,
            engine_version: '1.0.0',
            created_at: now,
          },
        ]
      : [],
  );
  return { id, email, password: PASSWORD };
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

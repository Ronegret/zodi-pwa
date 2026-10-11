/**
 * Migraciones + RLS contra Postgres real (PGlite) con los roles de Supabase
 * simulados en supabase-shim.sql. Cada consulta corre en su propia transacción
 * con `set local role` y el `sub` del JWT, igual que hace PostgREST.
 */
import { PGlite, type Transaction } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const migrationsDir = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url));
const migrations = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(migrationsDir + f, 'utf8'));
const shim = readFileSync(fileURLToPath(new URL('./supabase-shim.sql', import.meta.url)), 'utf8');

type Who = 'anon' | 'service_role' | { uid: string };

let db: PGlite;

async function as<T>(who: Who, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const sub = typeof who === 'object' ? who.uid : '';
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [sub]);
    await tx.exec(`set local role ${typeof who === 'object' ? 'authenticated' : who}`);
    return fn(tx);
  });
}

async function q<T = Record<string, unknown>>(who: Who, sql: string, params: unknown[] = []) {
  return as(who, async (tx) => (await tx.query<T>(sql, params)).rows);
}

async function denied(who: Who, sql: string, params: unknown[] = []) {
  await expect(q(who, sql, params)).rejects.toThrow(
    /permission denied|row-level security|violates/,
  );
}

async function newUser(email: string, meta: Record<string, unknown> = {}) {
  const { rows } = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
    [email, JSON.stringify(meta)],
  );
  return { uid: rows[0]!.id };
}

let A: { uid: string };
let B: { uid: string };
let C: { uid: string };

beforeAll(async () => {
  db = new PGlite();
  await db.exec(shim);
  for (const sql of migrations) await db.exec(sql);
  A = await newUser('ana@example.com', {
    full_name: '  Ana Estrella  ',
    avatar_url: 'http://inseguro.example/a.png',
  });
  B = await newUser('bruno@example.com', { name: 'Bruno' });
  C = await newUser('carla@example.com');
}, 60_000);

describe('migraciones', () => {
  it('se pueden reaplicar sin errores (idempotentes)', async () => {
    for (const sql of migrations) await db.exec(sql);
    const { rows } = await db.query('select plan from public.usage_limits');
    expect(rows).toHaveLength(3);
  });

  it('todas las tablas de public tienen RLS activada', async () => {
    const { rows } = await db.query(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(rows).toEqual([]);
  });

  it('ninguna función security definer es ejecutable por anon', async () => {
    const { rows } = await db.query(
      `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.prosecdef and has_function_privilege('anon', p.oid, 'execute')`,
    );
    expect(rows).toEqual([]);
  });
});

describe('profiles', () => {
  it('el registro crea el perfil con nombre recortado y sin avatar http', async () => {
    const [p] = await q<{ display_name: string; avatar_url: string | null; plan: string }>(
      A,
      'select display_name, avatar_url, plan from public.profiles',
    );
    expect(p).toEqual({ display_name: 'Ana Estrella', avatar_url: null, plan: 'free' });
    const [c] = await q<{ display_name: string }>(C, 'select display_name from public.profiles');
    expect(c?.display_name).toBe('carla');
  });

  it('resuelve el código de referido del registro', async () => {
    const [{ referral_code }] = (await q<{ referral_code: string }>(
      A,
      'select referral_code from public.profiles',
    )) as [{ referral_code: string }];
    const D = await newUser('dani@example.com', { referral_code });
    const [d] = await q<{ referred_by: string }>(D, 'select referred_by from public.profiles');
    expect(d?.referred_by).toBe(A.uid);
  });

  it('cada usuario solo ve su perfil', async () => {
    const rows = await q<{ id: string }>(A, 'select id from public.profiles');
    expect(rows.map((r) => r.id)).toEqual([A.uid]);
    expect(await q(A, 'select id from public.profiles where id = $1', [B.uid])).toEqual([]);
  });

  it('anon no puede leer perfiles', async () => {
    await denied('anon', 'select id from public.profiles');
  });

  it('edita su perfil pero no el ajeno', async () => {
    const own = await q(
      A,
      `update public.profiles set display_name = 'Ana' where id = $1 returning id`,
      [A.uid],
    );
    expect(own).toHaveLength(1);
    const other = await q(
      A,
      `update public.profiles set display_name = 'x' where id = $1 returning id`,
      [B.uid],
    );
    expect(other).toEqual([]);
  });

  it('no puede tocar plan, gemas, xp ni referidos', async () => {
    await denied(A, `update public.profiles set plan = 'vip' where id = $1`, [A.uid]);
    await denied(A, `update public.profiles set gems = 9999 where id = $1`, [A.uid]);
    await denied(A, `update public.profiles set xp = 1 where id = $1`, [A.uid]);
    await denied(A, `update public.profiles set referred_by = $2 where id = $1`, [A.uid, B.uid]);
  });

  it('no puede crear perfiles a mano', async () => {
    await denied(A, `insert into public.profiles (id) values (gen_random_uuid())`);
  });

  it('valida formato de usuario', async () => {
    await expect(
      q(A, `update public.profiles set username = 'Con Espacios' where id = $1`, [A.uid]),
    ).rejects.toThrow(/check constraint/);
  });

  it('profile_cards solo expone datos públicos y exige sesión', async () => {
    const cards = await q(A, 'select * from public.profile_cards($1)', [[B.uid]]);
    expect(Object.keys(cards[0]!).sort()).toEqual(
      ['avatar_url', 'display_name', 'id', 'level', 'username'].sort(),
    );
    await denied('anon', 'select * from public.profile_cards($1)', [[B.uid]]);
  });

  it('puede guardar si conoce o no su hora de nacimiento', async () => {
    const rows = await q(
      A,
      'update public.profiles set birth_time_known = false where id = $1 returning birth_time_known',
      [A.uid],
    );
    expect(rows).toEqual([{ birth_time_known: false }]);
  });
});

describe('natal_charts', () => {
  const chart = JSON.stringify({ utc: '2000-01-01T12:00:00.000Z', planets: [] });
  const input = JSON.stringify({ date: '2000-01-01', time: '12:00' });

  it('guarda y recupera solo la carta propia', async () => {
    await q(
      A,
      `insert into public.natal_charts (input, chart, engine_version) values ($1, $2, '1.0.0')`,
      [input, chart],
    );
    const mine = await q<{ user_id: string }>(A, 'select user_id from public.natal_charts');
    expect(mine.map((r) => r.user_id)).toEqual([A.uid]);
    expect(await q(B, 'select id from public.natal_charts')).toEqual([]);
    await denied('anon', 'select id from public.natal_charts');
  });

  it('no puede guardar cartas a nombre de otro ni modificarlas', async () => {
    await denied(
      A,
      `insert into public.natal_charts (user_id, input, chart, engine_version) values ($1, $2, $3, '1.0.0')`,
      [B.uid, input, chart],
    );
    await denied(A, `update public.natal_charts set label = 'x'`);
  });
});

describe('readings', () => {
  it('solo el service role escribe lecturas', async () => {
    await denied(
      A,
      `insert into public.readings (user_id, kind, content, model) values ($1, 'tarot', 'x', 'm')`,
      [A.uid],
    );
    await q(
      'service_role',
      `insert into public.readings (user_id, kind, content, model) values ($1, 'tarot', 'Hola', 'claude')`,
      [A.uid],
    );
    expect(await q(A, 'select kind from public.readings')).toEqual([{ kind: 'tarot' }]);
    expect(await q(B, 'select kind from public.readings')).toEqual([]);
  });

  it('el usuario puede borrar sus lecturas pero no editarlas', async () => {
    await denied(A, `update public.readings set content = 'falsa'`);
    expect(await q(A, 'delete from public.readings returning id')).toHaveLength(1);
  });
});

describe('cuota diaria de IA', () => {
  it('free permite 5 lecturas al día y bloquea la sexta', async () => {
    const results = [];
    for (let i = 0; i < 6; i++) {
      const [r] = await q<{ allowed: boolean; used: number; daily_limit: number }>(
        B,
        `select allowed, used, daily_limit from public.consume_ai_quota('tarot')`,
      );
      results.push(r);
    }
    expect(results.map((r) => r?.allowed)).toEqual([true, true, true, true, true, false]);
    expect(results[5]).toMatchObject({ used: 5, daily_limit: 5 });
    expect(await q(B, 'select used, daily_limit from public.ai_quota_status()')).toEqual([
      { used: 5, daily_limit: 5 },
    ]);
  });

  it('no se puede reiniciar la cuota borrando o insertando eventos', async () => {
    await denied(B, 'delete from public.usage_events');
    await denied(B, `insert into public.usage_events (user_id, kind) values ($1, 'tarot')`, [
      B.uid,
    ]);
    expect(await q(A, 'select id from public.usage_events')).toEqual([]);
  });

  it('subir de plan (service role) amplía el límite', async () => {
    await q('service_role', `update public.profiles set plan = 'premium' where id = $1`, [B.uid]);
    const [r] = await q(B, `select allowed, daily_limit from public.consume_ai_quota('dream')`);
    expect(r).toEqual({ allowed: true, daily_limit: 40 });
  });

  it('una zona horaria inválida cae a UTC en vez de romper', async () => {
    await q(C, `update public.profiles set time_zone = 'Marte/Olimpo' where id = $1`, [C.uid]);
    const [r] = await q(C, `select allowed from public.consume_ai_quota('roast')`);
    expect(r).toEqual({ allowed: true });
  });

  it('anon no puede consumir cuota', async () => {
    await denied('anon', `select * from public.consume_ai_quota('tarot')`);
  });
});

describe('comunidad', () => {
  let postId: string;

  it('los posts publicados son públicos', async () => {
    const [p] = await q<{ id: string }>(
      A,
      `insert into public.community_posts (body) values ('Mercurio me odia') returning id`,
    );
    postId = p!.id;
    expect(await q('anon', 'select body from public.community_posts')).toEqual([
      { body: 'Mercurio me odia' },
    ]);
  });

  it('nadie publica como otro ni cambia el estado de moderación', async () => {
    await denied(
      B,
      `insert into public.community_posts (author_id, body) values ($1, 'suplantación')`,
      [A.uid],
    );
    await denied(A, `update public.community_posts set status = 'published' where id = $1`, [
      postId,
    ]);
  });

  it('comentarios: se comenta en publicados y el autor del post modera', async () => {
    const [c] = await q<{ id: string }>(
      B,
      `insert into public.comments (post_id, body) values ($1, 'Y a mí') returning id`,
      [postId],
    );
    expect(await q('anon', 'select body from public.comments')).toEqual([{ body: 'Y a mí' }]);
    expect(await q(C, 'delete from public.comments where id = $1 returning id', [c!.id])).toEqual(
      [],
    );
    expect(
      await q(A, 'delete from public.comments where id = $1 returning id', [c!.id]),
    ).toHaveLength(1);
  });

  it('un post oculto por moderación desaparece para los demás', async () => {
    await q('service_role', `update public.community_posts set status = 'hidden' where id = $1`, [
      postId,
    ]);
    expect(await q('anon', 'select id from public.community_posts')).toEqual([]);
    expect(await q(B, 'select id from public.community_posts')).toEqual([]);
    expect(await q(A, 'select id from public.community_posts')).toHaveLength(1);
    expect(
      await q(A, `update public.community_posts set body = 'editado' where id = $1 returning id`, [
        postId,
      ]),
    ).toEqual([]);
    await denied(B, `insert into public.comments (post_id, body) values ($1, 'hola')`, [postId]);
  });
});

describe('amistades', () => {
  it('solo el destinatario acepta y terceros no ven nada', async () => {
    await q(A, 'insert into public.friendships (addressee_id) values ($1)', [B.uid]);
    expect(
      await q(A, `update public.friendships set status = 'accepted' returning status`),
    ).toEqual([]);
    expect(
      await q(B, `update public.friendships set status = 'accepted' returning status`),
    ).toEqual([{ status: 'accepted' }]);
    expect(await q(C, 'select * from public.friendships')).toEqual([]);
  });

  it('no se duplica la pareja en sentido inverso', async () => {
    await expect(
      q(B, 'insert into public.friendships (addressee_id) values ($1)', [A.uid]),
    ).rejects.toThrow(/duplicate key/);
  });

  it('quien fue bloqueado no puede borrar el bloqueo para insistir', async () => {
    await q(C, 'insert into public.friendships (addressee_id) values ($1)', [A.uid]);
    await q(A, `update public.friendships set status = 'blocked' where requester_id = $1`, [C.uid]);
    expect(await q(C, 'delete from public.friendships returning status')).toEqual([]);
  });
});

describe('pagos y gemas', () => {
  it('suscripciones y eventos de Stripe solo los escribe el servidor', async () => {
    await denied(
      A,
      `insert into public.subscriptions (id, user_id, stripe_customer_id, plan, status) values ('sub_1', $1, 'cus_1', 'vip', 'active')`,
      [A.uid],
    );
    await q(
      'service_role',
      `insert into public.subscriptions (id, user_id, stripe_customer_id, plan, status) values ('sub_1', $1, 'cus_1', 'vip', 'active')`,
      [A.uid],
    );
    expect(await q(A, 'select id from public.subscriptions')).toEqual([{ id: 'sub_1' }]);
    expect(await q(B, 'select id from public.subscriptions')).toEqual([]);
    await denied(A, 'select id from public.stripe_events');
  });

  it('apply_gem_transaction es idempotente, no deja saldo negativo y no es público', async () => {
    const apply = (delta: number, ref: string) =>
      q<{ balance: number }>(
        'service_role',
        `select public.apply_gem_transaction($1, $2, 'purchase', $3) as balance`,
        [A.uid, delta, ref],
      );
    expect(await apply(100, 'evt_1')).toEqual([{ balance: 100 }]);
    expect(await apply(100, 'evt_1')).toEqual([{ balance: 100 }]);
    await expect(apply(-150, 'evt_2')).rejects.toThrow(/check constraint/);
    await denied(A, `select public.apply_gem_transaction($1, 500, 'reward', 'x')`, [A.uid]);
    expect(await q(A, 'select delta, balance_after from public.gem_transactions')).toEqual([
      { delta: 100, balance_after: 100 },
    ]);
    expect(await q(B, 'select id from public.gem_transactions')).toEqual([]);
  });
});

describe('lugares (buscador propio)', () => {
  beforeAll(async () => {
    await db.exec(`
      insert into public.places (id, name, name_norm, country_code, admin1, latitude, longitude, time_zone, population) values
        (3117735, 'Madrid', 'madrid', 'ES', 'Madrid', 40.4165, -3.70256, 'Europe/Madrid', 3255944),
        (3675707, 'Madrid', 'madrid', 'CO', 'Cundinamarca', 4.73245, -74.26419, 'America/Bogota', 135000),
        (3117732, 'Madridejos', 'madridejos', 'ES', 'Castille-La Mancha', 39.468, -3.532, 'Europe/Madrid', 10500),
        (3871336, 'Santiago', 'santiago', 'CL', 'Santiago Metropolitan', -33.45694, -70.64827, 'America/Santiago', 4837295),
        (3109642, 'Santiago de Compostela', 'santiago de compostela', 'ES', 'Galicia', 42.88, -8.54, 'Europe/Madrid', 95092),
        (2643743, 'London', 'london', 'GB', 'England', 51.50853, -0.12574, 'Europe/London', 8961989),
        (3117000, 'Ávila', 'avila', 'ES', 'Castille and León', 40.656, -4.681, 'Europe/Madrid', 52000);
      insert into public.place_aliases (place_id, alias_norm) values (2643743, 'londres');
    `);
  });

  const search = (who: Who, query: string, limit = 8) =>
    q<{ id: number }>(who, 'select id from public.search_places($1, $2)', [query, limit]).then(
      (r) => r.map((x) => x.id),
    );

  it('es público: anon y usuarios buscan, nadie escribe', async () => {
    expect(await search('anon', 'madrid')).toEqual([3117735, 3675707, 3117732]);
    expect(await search(A, 'madrid')).toEqual([3117735, 3675707, 3117732]);
    await denied(
      'anon',
      `insert into public.places (id, name, name_norm, country_code, latitude, longitude, time_zone) values (1, 'x', 'x', 'ES', 0, 0, 'UTC')`,
    );
    await denied(A, `delete from public.places`);
  });

  it('prefijo, coincidencia exacta primero y después población', async () => {
    expect(await search('anon', 'mad')).toEqual([3117735, 3675707, 3117732]);
    expect(await search('anon', 'santiago')).toEqual([3871336, 3109642]);
  });

  it('acentos y mayúsculas no importan', async () => {
    expect(await search('anon', 'ÁVILA')).toEqual([3117000]);
    expect(await search('anon', 'Ávi')).toEqual([3117000]);
  });

  it('encuentra exónimos en español', async () => {
    expect(await search('anon', 'londres')).toEqual([2643743]);
    expect(await search('anon', 'lond')).toEqual([2643743]);
  });

  it('los comodines del usuario no amplían la búsqueda', async () => {
    expect(await search('anon', '%%')).toEqual([]);
    expect(await search('anon', '_adrid')).toEqual([]);
    expect(await search('anon', 'm')).toEqual([]);
  });

  it('limita el número de resultados', async () => {
    expect(await search('anon', 'ma', 1)).toEqual([3117735]);
    expect(await search('anon', 'ma', 999)).toHaveLength(3);
  });
});

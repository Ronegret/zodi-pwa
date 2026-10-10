import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { fail, readJson } from '@/lib/api/http';
import { buildChartRecord } from '@/lib/server/charts';
import { QuotaExceededError, type QuotaStore, withAiQuota } from '@/lib/server/quota';
import { CSP_DIRECTIVES, SECURITY_HEADERS } from '@/lib/security/policy';
import { READING_KINDS } from '@/lib/supabase/enums';
import { profileUpdateSchema } from '@/lib/validation/profile';

function fakeStore(limit: number) {
  let used = 0;
  const released: number[] = [];
  const store: QuotaStore = {
    consume: vi.fn(async () => {
      if (used >= limit) return { used, limit, eventId: null };
      used += 1;
      return { used, limit, eventId: used };
    }),
    release: vi.fn(async (id: number) => {
      released.push(id);
      used -= 1;
    }),
  };
  return { store, released, getUsed: () => used };
}

describe('withAiQuota', () => {
  it('consume antes de generar y devuelve el resultado', async () => {
    const { store } = fakeStore(2);
    const run = vi.fn(async () => 'lectura');
    await expect(withAiQuota(store, 'tarot', run)).resolves.toEqual({
      value: 'lectura',
      quota: { used: 1, limit: 2 },
    });
    expect(store.consume).toHaveBeenCalledBefore(run);
  });

  it('sin cuota no llama a la IA', async () => {
    const { store } = fakeStore(0);
    const run = vi.fn(async () => 'nunca');
    await expect(withAiQuota(store, 'tarot', run)).rejects.toBeInstanceOf(QuotaExceededError);
    expect(run).not.toHaveBeenCalled();
  });

  it('si la IA falla devuelve la lectura consumida', async () => {
    const { store, released, getUsed } = fakeStore(5);
    await expect(
      withAiQuota(store, 'dream', async () => {
        throw new Error('proveedor caído');
      }),
    ).rejects.toThrow('proveedor caído');
    expect(released).toEqual([1]);
    expect(getUsed()).toBe(0);
  });
});

describe('buildChartRecord', () => {
  const madrid = {
    date: '1979-03-14',
    timeZone: 'Europe/Madrid',
    latitude: 40.4168,
    longitude: -3.7038,
  };

  it('calcula en el servidor y marca la versión del motor', () => {
    const rec = buildChartRecord({ ...madrid, time: '11:30' });
    expect(rec.engine_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(rec.input.timeKnown).toBe(true);
    expect(rec.chart.planets.find((p) => p.id === 'sun')?.sign).toBe('Piscis');
    expect(rec.chart.houses).toHaveLength(12);
  });

  it('sin hora calcula a mediodía y lo deja anotado', () => {
    const rec = buildChartRecord({ ...madrid, time: null });
    expect(rec.input.timeKnown).toBe(false);
    expect(rec.chart.utc).toBe('1979-03-14T11:00:00.000Z');
  });
});

describe('http', () => {
  const req = (body: string, type = 'application/json') =>
    new Request('https://zodi.aibueno.es/api/perfil', {
      method: 'PATCH',
      body,
      headers: { 'content-type': type },
    });

  it('readJson exige JSON y valida con Zod', async () => {
    const wrongType = await readJson(req('{}', 'text/plain'), profileUpdateSchema);
    expect(wrongType.ok || wrongType.response.status).toBe(415);
    const broken = await readJson(req('{'), profileUpdateSchema);
    expect(broken.ok || broken.response.status).toBe(400);
    const invalid = await readJson(req('{"plan":"vip"}'), profileUpdateSchema);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.response.status).toBe(422);
      expect((await invalid.response.json()).error.code).toBe('validation_failed');
    }
    const ok = await readJson(req('{"display_name":"Ana"}'), profileUpdateSchema);
    expect(ok).toEqual({ ok: true, data: { display_name: 'Ana' } });
  });

  it('las respuestas de error no se cachean', () => {
    expect(fail(500, 'internal', 'x').headers.get('cache-control')).toBe('private, no-store');
  });
});

describe('política de seguridad', () => {
  it('CSP sin unsafe-inline/eval, sin iframes ajenos ni plugins', () => {
    const csp = CSP_DIRECTIVES.join('; ');
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it('incluye HSTS, nosniff y Referrer-Policy', () => {
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toMatch(/max-age=\d{8}/);
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    expect(SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });
});

describe('tipos ↔ SQL', () => {
  it('READING_KINDS coincide con el enum reading_kind de la migración', () => {
    const sql = readFileSync(
      fileURLToPath(new URL('../../supabase/migrations/20261011090000_base.sql', import.meta.url)),
      'utf8',
    );
    const block = /create type public\.reading_kind as enum \(([^)]+)\)/.exec(sql)?.[1] ?? '';
    const values = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(values).toEqual([...READING_KINDS]);
    expect(values).toHaveLength(19);
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '@/lib/progress/achievements';

const SQL = readFileSync(
  new URL('../../supabase/migrations/20261012130000_activity.sql', import.meta.url),
  'utf8',
);

describe('logros', () => {
  it('el catálogo de la app es exactamente el que desbloquea la base de datos', () => {
    const inSql = [...SQL.matchAll(/then '([a-z0-9-]+)' end/g)].map((m) => m[1]).sort();
    expect(ACHIEVEMENTS.map((a) => a.id).sort()).toEqual(inSql);
  });

  it('ids válidos para la tabla y sin repetir', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]{2,40}$/);
  });
});

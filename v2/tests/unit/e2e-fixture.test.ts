/**
 * La carta que el Supabase simulado de los e2e devuelve a los usuarios ya
 * registrados. Se genera con el motor real; si el motor cambia, regenerar:
 *   UPDATE_FIXTURES=1 npx vitest run tests/unit/e2e-fixture.test.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { buildChartRecord } from '@/lib/server/charts';

const file = fileURLToPath(new URL('../e2e/support/fixture-chart.json', import.meta.url));

it('la carta de prueba de los e2e coincide con el motor actual', () => {
  const record = buildChartRecord({
    date: '1990-04-15',
    time: '10:30',
    timeZone: 'Europe/Madrid',
    latitude: 40.4168,
    longitude: -3.7038,
  });
  const json = `${JSON.stringify(record, null, 2)}\n`;
  if (process.env.UPDATE_FIXTURES) writeFileSync(file, json);
  expect(readFileSync(file, 'utf8')).toBe(json);
});

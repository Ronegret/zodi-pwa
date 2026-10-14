import { describe, expect, it } from 'vitest';
import { countryName, normalizePlaceName, rowsToPlaces } from '@/lib/geo/places';

describe('lugares', () => {
  it('normaliza igual que la base de datos', () => {
    expect(normalizePlaceName('  Ávila ')).toBe('avila');
    expect(normalizePlaceName('São  Paulo')).toBe('sao paulo');
    expect(normalizePlaceName('MÜNCHEN')).toBe('munchen');
  });

  it('nombres de país en español', () => {
    expect(countryName('ES')).toBe('España');
    expect(countryName('cl')).toBe('Chile');
    expect(countryName('GB')).toBe('Reino Unido');
  });

  it('arma la etiqueta sin repetir la región y descarta zonas inválidas', () => {
    const places = rowsToPlaces([
      {
        id: 3117735,
        name: 'Madrid',
        country_code: 'ES',
        admin1: 'Madrid',
        latitude: 40.416501,
        longitude: -3.702561,
        time_zone: 'Europe/Madrid',
        population: 3255944,
      },
      {
        id: 3871336,
        name: 'Santiago',
        country_code: 'CL',
        admin1: 'Santiago Metropolitan',
        latitude: -33.45694,
        longitude: -70.64827,
        time_zone: 'America/Santiago',
        population: 4837295,
      },
      {
        id: 1,
        name: 'Atlántida',
        country_code: 'XX',
        admin1: null,
        latitude: 0,
        longitude: 0,
        time_zone: 'Mar/Profundo',
        population: 0,
      },
    ]);
    expect(places.map((p) => p.label)).toEqual([
      'Madrid, España',
      'Santiago, Santiago Metropolitan, Chile',
    ]);
    expect(places[0]).toMatchObject({ id: '3117735', latitude: 40.4165, longitude: -3.7026 });
  });

  it('rechaza respuestas con otra forma', () => {
    expect(() => rowsToPlaces([{ id: 'x' }])).toThrow(/inesperada/);
  });
});

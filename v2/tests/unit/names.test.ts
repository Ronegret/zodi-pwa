import { describe, expect, it } from 'vitest';
import { FIRST_NAMES, MAPUCHE, PATRONYMIC, SURNAMES } from '@/lib/names/dictionary';
import { nameMeaning } from '@/lib/names/meaning';

describe('significado del nombre', () => {
  it('nombre del diccionario, apellido conocido y uno que no está', () => {
    const parts = nameMeaning('Rodrigo Negrete Aros');
    expect(parts.map((p) => [p.word, p.kind])).toEqual([
      ['Rodrigo', 'nombre'],
      ['Negrete', 'apellido'],
      ['Aros', 'apellido'],
    ]);
    expect(parts[0]!.entry?.meaning).toBe('famoso por su poder');
    expect(parts[1]!.entry?.meaning).toMatch(/negro/);
    expect(parts[2]!.entry).toBeNull();
  });

  it('nombres compuestos, tildes y partículas', () => {
    const parts = nameMeaning('maría josé de la fuente');
    expect(parts.map((p) => p.word)).toEqual(['María', 'José', 'Fuente']);
    expect(parts.slice(0, 2).every((p) => p.kind === 'nombre')).toBe(true);
  });

  it('patronímicos: -ez es «hijo de»', () => {
    const [, fer, ruiz, otro] = nameMeaning('Ana Fernández Ruiz Benavídez');
    expect(fer!.rule).toBe('patronímico');
    expect(fer!.entry?.meaning).toBe('«hijo de Fernando»');
    expect(fer!.entry?.note).toMatch(/audaz en la paz/);
    expect(ruiz!.entry?.meaning).toMatch(/Ruy/);
    expect(otro!.entry?.origin).toMatch(/probable patronímico/);
  });

  it('apellidos mapuches por sus partes y vascos por su forma', () => {
    const [, milla, catri, lef] = nameMeaning('Ana Millapán Catrileo Lefimil');
    expect(milla!.rule).toBe('mapuche');
    expect(milla!.entry?.meaning).toBe('milla = oro · pan = puma');
    expect(catri!.entry?.meaning).toBe('catri = cortado · leo = río');
    expect(lef!.entry?.meaning).toBe('lef = veloz · mil = oro');
    const [, goi] = nameMeaning('Ana Goicoechea');
    expect(goi!.rule).toBe('vasco');
  });

  it('no confunde apellidos españoles con mapuches o vascos', () => {
    for (const s of ['León', 'Pantoja', 'Manrique', 'Cadena', 'Mancilla', 'Pirela']) {
      const [, part] = nameMeaning(`Ana ${s}`);
      expect(part!.rule, s).toBeUndefined();
    }
  });

  it('el diccionario está completo y bien escrito', () => {
    for (const [k, v] of Object.entries({ ...FIRST_NAMES, ...SURNAMES })) {
      expect(k, k).toMatch(/^[a-z]+$/);
      expect(v.origin.length, k).toBeGreaterThan(3);
      expect(v.meaning.length, k).toBeGreaterThan(2);
    }
    for (const k of Object.keys(PATRONYMIC)) expect(k).toMatch(/^[a-z]+$/);
    for (const [m] of MAPUCHE) expect(m).toMatch(/^[a-z]+$/);
    expect(Object.keys(FIRST_NAMES).length).toBeGreaterThan(200);
    expect(Object.keys(SURNAMES).length).toBeGreaterThan(90);
  });
});

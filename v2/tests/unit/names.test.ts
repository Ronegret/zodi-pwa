import { describe, expect, it } from 'vitest';
import APELLIDOS from '@/lib/names/data/apellidos.json';
import NOMBRES from '@/lib/names/data/nombres.json';
import { FIRST_NAMES, MAPUCHE, PATRONYMIC, SURNAMES } from '@/lib/names/dictionary';
import { knownEntry, nameMeaning, REGISTRY_SIZE } from '@/lib/names/meaning';
import { parseEntry } from '@/lib/names/parse';

describe('significado del nombre', () => {
  it('nombre y apellidos del registro', () => {
    const parts = nameMeaning('Rodrigo Negrete Aros');
    expect(parts.map((p) => [p.word, p.kind])).toEqual([
      ['Rodrigo', 'nombre'],
      ['Negrete', 'apellido'],
      ['Aros', 'apellido'],
    ]);
    expect(parts[0]!.entry?.meaning).toMatch(/poder|fama|famoso/i);
    expect(parts[1]!.entry?.meaning).toMatch(/negr|oscur|moren/i);
  });

  it('nombres compuestos, tildes y partículas', () => {
    const parts = nameMeaning('maría josé de la vega');
    expect(parts.map((p) => p.word)).toEqual(['María', 'José', 'Vega']);
    expect(parts.slice(0, 2).every((p) => p.kind === 'nombre')).toBe(true);
    expect(parts.every((p) => p.entry)).toBe(true);
  });

  it('patronímicos: -ez es «hijo de»', () => {
    const [, fer, otro] = nameMeaning('Ana Fernández Benavídez');
    expect(`${fer!.entry?.origin} ${fer!.entry?.meaning}`).toMatch(/Fernando/);
    expect(otro!.rule).toBe('patronímico');
    expect(otro!.entry?.origin).toMatch(/probable patronímico/);
  });

  it('apellidos mapuches por sus partes y vascos por su forma', () => {
    const [, calfu, paine, lef] = nameMeaning('Ana Calfuleo Painecura Lefimil');
    expect(calfu!.rule).toBe('mapuche');
    expect(calfu!.entry?.meaning).toBe('calfu = azul · leo = río');
    expect(paine!.entry?.meaning).toBe('paine = celeste · cura = piedra');
    expect(lef!.entry?.meaning).toBe('lef = veloz · mil = oro');
    const [, goi] = nameMeaning('Ana Goicoetxea');
    expect(goi!.rule).toBe('vasco');
  });

  it('no confunde apellidos españoles con mapuches o vascos', () => {
    for (const s of ['Pantojo', 'Manriques', 'Cadenas', 'Mancillas', 'Pirelas']) {
      const [, part] = nameMeaning(`Ana ${s}`);
      expect(part!.rule, s).toBeUndefined();
    }
  });

  it('el registro de serie es grande y está bien formado', () => {
    expect(REGISTRY_SIZE.nombres).toBeGreaterThan(740);
    expect(REGISTRY_SIZE.apellidos).toBeGreaterThan(650);
    const gen = { ...NOMBRES, ...APELLIDOS } as Record<string, { w: string; o: string; m: string }>;
    for (const [k, v] of Object.entries(gen)) {
      expect(k, k).toMatch(/^[a-z]+$/);
      expect(v.o.length, k).toBeGreaterThan(2);
      expect(v.m.length, k).toBeGreaterThan(2);
      expect(v.m, k).not.toMatch(/undefined|null/);
    }
    for (const [k, v] of Object.entries({ ...FIRST_NAMES, ...SURNAMES })) {
      expect(k, k).toMatch(/^[a-z]+$/);
      expect(v.meaning.length, k).toBeGreaterThan(2);
    }
    for (const k of Object.keys(PATRONYMIC)) expect(k).toMatch(/^[a-z]+$/);
    for (const [m] of MAPUCHE) expect(m).toMatch(/^[a-z]+$/);
    expect(knownEntry('nombre', 'sofia')).not.toBeNull();
  });

  it('lee la respuesta de la IA y descarta lo inventado', () => {
    expect(parseEntry('{"o": "vasco", "m": "carpintero."}')).toEqual({
      origin: 'vasco',
      meaning: 'carpintero',
    });
    expect(parseEntry('Claro: {"o": "latino", "m": "luz", "n": "Una santa."}')).toEqual({
      origin: 'latino',
      meaning: 'luz',
      note: 'Una santa',
    });
    expect(parseEntry('{"o": "desconocido", "m": "desconocido"}')).toBeNull();
    expect(parseEntry('no sé')).toBeNull();
  });
});

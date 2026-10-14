import { describe, expect, it } from 'vitest';
import { iconFor, splitReading } from '@/lib/readings/cards';

const FULL = [
  'Hoy tu motivación está en cuidados paliativos.',
  '',
  '**Amor**',
  'Tu ex vuelve como los impuestos.',
  'Haz como que no lo ves.',
  '',
  '**Trabajo y dinero**',
  'El jefe te ignora; aprovecha.',
  '',
  '**Hoy haz esto:** Apaga el móvil a las diez.',
].join('\n');

describe('splitReading', () => {
  it('reparte resumen, bloques y acción', () => {
    const c = splitReading(FULL);
    expect(c.structured).toBe(true);
    expect(c.summary).toBe('Hoy tu motivación está en cuidados paliativos.');
    expect(c.sections.map((s) => s.title)).toEqual(['Amor', 'Trabajo y dinero']);
    expect(c.sections[0]!.body).toHaveLength(2);
    expect(c.sections[0]!.icon).toBe('heart');
    expect(c.action).toEqual({ label: 'Hoy haz esto:', text: 'Apaga el móvil a las diez.' });
  });

  it('un texto antiguo sin estructura no se parte', () => {
    const c = splitReading('Un párrafo normal.\n\nOtro párrafo.');
    expect(c.structured).toBe(false);
  });

  it('tolera el streaming a medias', () => {
    expect(splitReading('Frase.\n\n**Am').sections).toHaveLength(0);
    const c = splitReading('Frase.\n\n**Amor**\nTu ex');
    expect(c.sections[0]).toMatchObject({ title: 'Amor', body: ['Tu ex'] });
    expect(splitReading('Frase.\n\n**Amor**').sections).toHaveLength(1);
  });

  it('acepta el formato de bullets anterior', () => {
    const c = splitReading('Hola.\n- **Amor:** di lo que piensas.\n**Hoy haz esto:** respira.');
    expect(c.sections[0]).toMatchObject({ title: 'Amor', body: ['di lo que piensas.'] });
    expect(c.action?.text).toBe('respira.');
  });

  it('elige icono por palabra clave', () => {
    expect(iconFor('Trabajo')).toBe('bolt');
    expect(iconFor('Energía')).toBe('flame');
    expect(iconFor('Lo que sea')).toBe('sparkles');
  });
});

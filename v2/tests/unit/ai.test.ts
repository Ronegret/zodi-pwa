import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { NatalChart } from '@/lib/astro-engine';
import { buildReadingContext, type ProfileForReading } from '@/lib/ai/context';
import { drawTarot, partnerChart, partnerText, synastry, tarotText } from '@/lib/ai/extras';
import { KINDS, KIND_BY_SLUG } from '@/lib/ai/kinds';
import {
  chineseZodiac,
  expressionNumber,
  lifePathNumber,
  lunarNewYear,
  personalYear,
} from '@/lib/ai/numerology';
import { ZODI_SYSTEM, buildUserMessage } from '@/lib/ai/prompts';
import { RichText, parseBlocks } from '@/components/readings/RichText';
import { excerpt } from '@/lib/readings/format';
import { costParams } from '@/lib/ai/cost';
import { chatRequestSchema, prepareChat } from '@/lib/server/assistant';
import { prepareReading, readingStream, type StreamEvent } from '@/lib/server/readings';
import { readingRequestSchema } from '@/lib/validation/reading';

const FIXTURE = JSON.parse(
  readFileSync(new URL('../e2e/support/fixture-chart.json', import.meta.url), 'utf8'),
) as { chart: NatalChart };

const PROFILE: ProfileForReading = {
  display_name: 'Ana Estrella',
  birth_date: '1990-04-15',
  birth_time: '10:30',
  birth_time_known: true,
  birth_place: 'Madrid, España',
  time_zone: 'Europe/Madrid',
  reading_tone: 'sarcastico',
  favorite_topics: ['amor', 'dinero'],
  relationship_status: 'complicated',
  partner_name: 'Leo',
  has_kids: false,
  kids_count: null,
  personal_bio: 'Diseñadora con insomnio.',
};
const NOW = new Date('2026-10-11T08:00:00Z');

describe('numerología', () => {
  it('camino de vida respeta los números maestros', () => {
    expect(lifePathNumber('1990-04-15')).toBe(11);
    // 1985→23→5, julio→7, 23→5: 5+7+5 = 17 → 8.
    expect(lifePathNumber('1985-07-23')).toBe(8);
    expect(lifePathNumber('2000-01-01')).toBe(4);
  });

  it('año personal cambia en el cumpleaños', () => {
    expect(personalYear('1990-04-15', '2026-04-14')).not.toBe(
      personalYear('1990-04-15', '2026-04-15'),
    );
  });

  it('número de expresión ignora tildes y espacios', () => {
    expect(expressionNumber('Ána María')).toBe(expressionNumber('ana maria'));
    expect(expressionNumber('123')).toBeNull();
  });

  it('Año Nuevo Lunar en sus fechas reales', () => {
    const iso = (y: number) => lunarNewYear(y).toISOString().slice(0, 10);
    expect(iso(2023)).toBe('2023-01-22');
    expect(iso(2024)).toBe('2024-02-10');
    expect(iso(2025)).toBe('2025-01-29');
    expect(iso(2026)).toBe('2026-02-17');
  });

  it('zodiaco chino usa el año lunar, no el natural', () => {
    expect(chineseZodiac('1990-01-20')).toMatchObject({
      animal: 'Serpiente',
      element: 'Tierra',
      year: 1989,
    });
    expect(chineseZodiac('1990-03-01')).toMatchObject({
      animal: 'Caballo',
      element: 'Metal',
      year: 1990,
    });
    expect(chineseZodiac('2024-02-10')).toMatchObject({ animal: 'Dragón', element: 'Madera' });
  });
});

describe('contexto de la lectura', () => {
  it('lleva nombre, carta real, tránsitos, cielo y números', () => {
    const ctx = buildReadingContext(PROFILE, { chart: FIXTURE.chart, timeKnown: true }, NOW);
    expect(ctx.firstName).toBe('Ana');
    expect(ctx.text).toContain('Nombre: Ana');
    expect(ctx.text).toMatch(/Sol en \w+ \d+°/);
    expect(ctx.text).toMatch(/Ascendente en/);
    expect(ctx.text).toContain('Tránsitos de hoy');
    expect(ctx.text).toMatch(/Luna: .+ en \w+/);
    expect(ctx.text).toContain('Camino de vida: 11');
    expect(ctx.text).toContain('Zodiaco chino: Caballo de Metal');
    expect(ctx.text).toContain('en algo complicado (pareja: Leo)');
    expect(ctx.text).toContain('Diseñadora con insomnio');
  });

  it('sin hora de nacimiento no hay Ascendente, y lo dice', () => {
    const ctx = buildReadingContext(PROFILE, { chart: FIXTURE.chart, timeKnown: false }, NOW);
    expect(ctx.text).not.toMatch(/Ascendente en/);
    expect(ctx.text).toContain('No te los inventes');
  });

  it('sin carta avisa de no inventar posiciones', () => {
    const ctx = buildReadingContext({ ...PROFILE, birth_date: null }, null, NOW);
    expect(ctx.text).toContain('no inventes posiciones');
    expect(ctx.text).not.toContain('Camino de vida');
  });

  it('detecta el cumpleaños', () => {
    const ctx = buildReadingContext(PROFILE, null, new Date('2026-04-15T10:00:00Z'));
    expect(ctx.text).toContain('HOY ES SU CUMPLEAÑOS');
  });
});

describe('prompts', () => {
  it('el system prompt fija la voz y las reglas de Rodrigo', () => {
    expect(ZODI_SYSTEM).toContain('ZODI');
    expect(ZODI_SYSTEM).toMatch(/Llámala por su nombre/);
    expect(ZODI_SYSTEM).toMatch(/Hoy haz esto/);
    expect(ZODI_SYSTEM).toMatch(/Nunca|NUNCA/);
  });

  it('el mensaje lleva perfil, lectura, enfoque, tono y extensión', () => {
    const def = KIND_BY_SLUG.get('horoscopo-diario')!;
    const msg = buildUserMessage({
      def,
      context: 'CTX',
      tone: 'brutal',
      length: 'breve',
      focus: 'amor',
    });
    expect(msg).toContain('<perfil>\nCTX\n</perfil>');
    expect(msg).toContain('HORÓSCOPO DE HOY');
    expect(msg).toContain('[Enfócate especialmente en el área de: amor]');
    expect(msg).toContain('TONO BRUTAL');
    expect(msg).toContain('EXTENSIÓN: breve');
  });

  it('cada tipo de lectura tiene slug único e instrucciones', () => {
    expect(new Set(KINDS.map((k) => k.slug)).size).toBe(KINDS.length);
    for (const k of KINDS) expect(k.instructions.length).toBeGreaterThan(80);
  });
});

describe('validación de peticiones', () => {
  it('el tarot exige pregunta; los sueños, sueño; el match, otra persona', () => {
    const issues = (body: unknown) =>
      readingRequestSchema.safeParse(body).error?.issues.map((i) => i.path.join('.')) ?? [];
    expect(issues({ slug: 'tarot' })).toEqual(['question']);
    expect(issues({ slug: 'suenos' })).toEqual(['dream']);
    expect(issues({ slug: 'compatibilidad' })).toEqual(['partner.name']);
    expect(issues({ slug: 'horoscopo-diario' })).toEqual([]);
    expect(issues({ slug: 'no-existe' })).toContain('slug');
    expect(
      issues({ slug: 'compatibilidad', partner: { name: 'Leo', date: '1991-02-31' } }),
    ).toContain('partner.date');
  });
});

describe('extras', () => {
  it('tres arcanos distintos con posición', () => {
    const cards = drawTarot('tres', () => 0.5);
    expect(cards.map((c) => c.position)).toEqual(['Pasado', 'Presente', 'Futuro']);
    expect(new Set(cards.map((c) => c.name)).size).toBe(3);
    expect(tarotText(cards, '¿Me mudo?')).toContain('Pregunta: "¿Me mudo?"');
  });

  it('sinastría con la carta de la otra persona', () => {
    const theirs = partnerChart({ name: 'Leo', date: '1991-08-03' }, 'Europe/Madrid');
    const aspects = synastry(FIXTURE.chart, theirs);
    expect(aspects.every((a) => a.orb <= 7)).toBe(true);
    const text = partnerText({ name: 'Leo', date: '1991-08-03' }, theirs, aspects);
    expect(text).toContain('Sol en Leo');
    expect(text).toContain('sin hora de nacimiento la Luna puede variar');
  });
});

describe('texto enriquecido', () => {
  it('párrafos, listas, negrita y cursiva sin HTML crudo', () => {
    expect(parseBlocks('Hola\n\n- uno\n- dos\n\nFin').map((b) => b.type)).toEqual(['p', 'ul', 'p']);
    const html = renderToStaticMarkup(
      RichText({ text: '**Ojo** con *esto* <script>alert(1)</script>\n- uno' }),
    );
    expect(html).toContain('<strong>Ojo</strong>');
    expect(html).toContain('<em>esto</em>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<li>uno</li>');
  });

  it('extracto sin Markdown y cortado por palabra', () => {
    expect(excerpt('**Hola** mundo cruel', 100)).toBe('Hola mundo cruel');
    expect(excerpt('uno dos tres cuatro cinco seis', 14)).toBe('uno dos tres…');
  });
});

describe('stream de una lectura', () => {
  const prepared = () =>
    prepareReading(
      { slug: 'tarot', length: 'normal', question: '¿Me mudo?' },
      PROFILE,
      { chart: FIXTURE.chart, timeKnown: true },
      NOW,
      () => 0.1,
    );

  async function collect(stream: ReadableStream<Uint8Array>): Promise<StreamEvent[]> {
    const text = await new Response(stream).text();
    return text
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l) as StreamEvent);
  }

  it('meta con cartas, texto en trozos, guarda y termina', async () => {
    const save = vi.fn().mockResolvedValue('id-1');
    const events = await collect(
      readingStream({
        prepared: prepared(),
        userId: 'u1',
        quota: { consume: vi.fn(), release: vi.fn() },
        eventId: 7,
        remaining: 4,
        saveReading: save,
        generateFn: async (_s, _m, _max, onText) => {
          onText('Hola ');
          onText('**Ana**');
          return { model: 'm', inputTokens: 10, outputTokens: 5 };
        },
      }),
    );
    expect(events[0]).toMatchObject({ type: 'meta' });
    expect((events[0] as { cards: unknown[] }).cards).toHaveLength(3);
    expect(
      events.filter((e) => e.type === 'text').map((e) => (e as { text: string }).text),
    ).toEqual(['Hola ', '**Ana**']);
    expect(events.at(-1)).toEqual({ type: 'done', id: 'id-1', remaining: 4 });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        kind: 'tarot',
        content: 'Hola **Ana**',
        model: 'm',
      }),
    );
  });

  it('si la IA falla, devuelve la cuota y avisa', async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const events = await collect(
      readingStream({
        prepared: prepared(),
        userId: 'u1',
        quota: { consume: vi.fn(), release },
        eventId: 7,
        remaining: 4,
        saveReading: vi.fn(),
        generateFn: async () => {
          throw new Error('boom');
        },
      }),
    );
    expect(release).toHaveBeenCalledWith(7);
    expect(events.at(-1)).toMatchObject({ type: 'error' });
  });

  it('la consulta lleva las cartas y el perfil; lo guardado no lleva el perfil', () => {
    const p = prepared();
    expect(p.system).toEqual([ZODI_SYSTEM]);
    expect(p.messages).toHaveLength(1);
    expect(p.messages[0]!.content).toContain('Nombre: Ana');
    expect(p.messages[0]!.content).toContain('Cartas tiradas (tres cartas):');
    expect(JSON.stringify(p.input)).not.toContain('Ana');
    expect(p.input).toMatchObject({ slug: 'tarot', tone: 'sarcastico', question: '¿Me mudo?' });
  });
});

describe('ahorro de tokens', () => {
  it('Haiku sin razonamiento; Sonnet sin pensar antes y con esfuerzo bajo', () => {
    expect(costParams('claude-haiku-5-5')).toEqual({ thinking: { type: 'disabled' } });
    expect(costParams('claude-sonnet-5-5')).toEqual({
      thinking: { type: 'between_tools' },
      output_config: { effort: 'low' },
    });
    expect(costParams('claude-opus-5-5')).toEqual({ output_config: { effort: 'low' } });
  });

  it('las lecturas profundas van con Sonnet y el resto y el oráculo con Haiku', () => {
    const stored = { chart: FIXTURE.chart, timeKnown: true };
    const tier = (slug: string) =>
      prepareReading({ slug, length: 'normal', question: '¿Sí?' } as never, PROFILE, stored, NOW)
        .tier;
    expect(tier('carta-natal')).toBe('deep');
    expect(tier('tarot')).toBe('deep');
    expect(tier('horoscopo-diario')).toBe('fast');
    expect(tier('numerologia')).toBe('fast');
    const chat = prepareChat(
      { messages: [{ role: 'user', content: 'Hola' }] },
      PROFILE,
      stored,
      NOW,
    );
    expect(chat).toMatchObject({ tier: 'fast', cacheHistory: true });
  });
});

describe('el oráculo conoce a su gente', () => {
  it('añade cada persona con su cielo, la afinidad y el día', () => {
    const p = prepareChat(
      { messages: [{ role: 'user', content: '¿Cómo me irá hoy con mi madre?' }] },
      PROFILE,
      { chart: FIXTURE.chart, timeKnown: true },
      NOW,
      [{ id: 'x', name: 'Mamá', relation: 'familia', birthDate: '1965-08-03', birthTime: null }],
    );
    expect(p.system[1]).toContain('## Su gente');
    expect(p.system[1]).toMatch(/- Mamá \(familia, nació el 1965-08-03\): Sol en Leo/);
    expect(p.system[1]).toMatch(/Afinidad: \d+ %/);
    expect(p.system[1]).not.toMatch(/undefined|NaN/);
    // Sin gente, no aparece la sección.
    const sin = prepareChat(
      { messages: [{ role: 'user', content: 'Hola' }] },
      PROFILE,
      { chart: FIXTURE.chart, timeKnown: true },
      NOW,
    );
    expect(sin.system[1]).not.toContain('## Su gente');
  });
});

describe('chat con Zodi', () => {
  it('voz cacheada + modo chat con perfil; solo los últimos turnos', () => {
    const many = Array.from({ length: 21 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `m${i}`,
    }));
    const p = prepareChat(
      { messages: many },
      PROFILE,
      { chart: FIXTURE.chart, timeKnown: true },
      NOW,
    );
    expect(p.kind).toBe('assistant');
    expect(p.system[0]).toBe(ZODI_SYSTEM);
    expect(p.system[1]).toContain('MODO CHAT');
    expect(p.system[1]).toContain('TONO SARCÁSTICO');
    expect(p.system[1]).toContain('Nombre: Ana');
    expect(p.messages.length).toBeLessThanOrEqual(16);
    expect(p.messages[0]!.role).toBe('user');
    expect(p.messages.at(-1)).toEqual({ role: 'user', content: 'm20' });
    expect(p.input).toEqual({ question: 'm20' });
  });

  it('el último mensaje tiene que ser de la persona', () => {
    expect(
      chatRequestSchema.safeParse({ messages: [{ role: 'assistant', content: 'hola' }] }).success,
    ).toBe(false);
    expect(
      chatRequestSchema.safeParse({ messages: [{ role: 'user', content: '  ' }] }).success,
    ).toBe(false);
  });
});

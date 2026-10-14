import type { CSSProperties } from 'react';
import type { NameNumbers } from '@/lib/divination/name';
import type { MayanSign } from '@/lib/divination/maya';
import type { DrawnRune } from '@/lib/divination/runes';
import type { Crystal } from '@/lib/divination/crystals';
import { INTENTS, type Intent } from '@/lib/divination/crystals';

/**
 * Trazos de las 24 runas (viewBox 20×32). Se dibujan en SVG porque muchas
 * fuentes del móvil no traen el bloque rúnico de Unicode.
 */
const RUNE_PATHS: Record<string, string> = {
  Fehu: 'M7 2V30M7 11L15 4M7 18L15 11',
  Uruz: 'M6 30V2L14 11V30',
  Thurisaz: 'M7 2V30M7 10L14 16L7 22',
  Ansuz: 'M7 2V30M7 4L14 11M7 12L14 19',
  Raidho: 'M6 2V30M6 2L14 8L6 15L14 30',
  Kenaz: 'M14 4L6 16L14 28',
  Gebo: 'M4 4L16 28M16 4L4 28',
  Wunjo: 'M7 2V30M7 2L14 8L7 15',
  Hagalaz: 'M5 2V30M15 2V30M5 12L15 20',
  Naudiz: 'M10 2V30M5 12L15 20',
  Isa: 'M10 2V30',
  Jera: 'M9 4L4 11L9 18M11 14L16 21L11 28',
  Eihwaz: 'M10 2V30M10 2L15 7M10 30L5 25',
  Perthro: 'M6 2V30M6 2L12 8L16 4M6 30L12 24L16 28',
  Algiz: 'M10 2V30M10 12L4 4M10 12L16 4',
  Sowilo: 'M13 2L6 12L14 20L7 30',
  Tiwaz: 'M10 2V30M10 2L4 10M10 2L16 10',
  Berkano: 'M6 2V30M6 2L14 9L6 16L14 23L6 30',
  Ehwaz: 'M5 2V30M15 2V30M5 2L10 10L15 2',
  Mannaz: 'M5 2V30M15 2V30M5 2L15 14M15 2L5 14',
  Laguz: 'M7 2V30M7 2L14 9',
  Ingwaz: 'M10 6L16 16L10 26L4 16Z',
  Dagaz: 'M4 4V28M16 4V28M4 4L16 28M16 4L4 28',
  Othala: 'M10 3L16 11L10 19L4 11ZM8 17L4 29M12 17L16 29',
};

export function RuneGlyph({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 32" aria-hidden="true" focusable="false">
      <path d={RUNE_PATHS[name] ?? 'M10 2V30'} />
    </svg>
  );
}

export function RuneCast({ runes }: { runes: DrawnRune[] }) {
  return (
    <ol className="rune-cast" aria-label="Runas tiradas">
      {runes.map((r, i) => (
        <li key={r.position} className="rune-slot" style={{ '--i': i } as CSSProperties}>
          <p className="kicker">{r.position}</p>
          <div className="rune-stone" data-reversed={r.reversed ? '' : undefined}>
            <RuneGlyph name={r.name} className="rune-glyph" />
          </div>
          <p className="rune-name">
            {r.name}
            {r.reversed && <span className="muted"> · invertida</span>}
          </p>
          <p className="rune-meaning">{r.meaning}</p>
        </li>
      ))}
    </ol>
  );
}

export function CrystalCard({ crystal }: { crystal: Crystal & { intent: string } }) {
  return (
    <figure className="crystal-card" style={{ '--gem': crystal.color } as CSSProperties}>
      <svg className="crystal-gem" viewBox="0 0 64 80" aria-hidden="true" focusable="false">
        <path className="gem-body" d="M32 2 58 26 32 78 6 26Z" />
        <path className="gem-facet" d="M6 26h52M32 2 20 26l12 52 12-52Z" />
      </svg>
      <figcaption>
        <p className="kicker">Para {INTENTS[crystal.intent as Intent]?.toLowerCase() ?? 'ti'}</p>
        <p className="crystal-name">{crystal.name}</p>
        <p className="muted">{crystal.use}</p>
      </figcaption>
    </figure>
  );
}

/** Numeral maya: barras de cinco y puntos. */
function MayaNumeral({ n }: { n: number }) {
  const bars = Math.floor(n / 5);
  const dots = n % 5;
  return (
    <span className="maya-numeral" aria-hidden="true">
      <span className="maya-dots">
        {Array.from({ length: dots }, (_, i) => (
          <i key={i} />
        ))}
      </span>
      {Array.from({ length: bars }, (_, i) => (
        <b key={i} />
      ))}
    </span>
  );
}

const MAYA_COLORS: Record<string, string> = {
  Rojo: '#ff4d6d',
  Blanco: '#f4f7ff',
  Azul: '#4d8bff',
  Amarillo: '#ffd23f',
};

export function MayaCard({ maya }: { maya: MayanSign }) {
  return (
    <figure
      className="maya-card"
      style={{ '--maya': MAYA_COLORS[maya.seal.color] ?? '#b8ff17' } as CSSProperties}
    >
      <MayaNumeral n={maya.toneNumber} />
      <figcaption>
        <p className="kicker">Kin {maya.kin} de 260</p>
        <p className="maya-name">{maya.name}</p>
        <dl className="maya-facts">
          <div>
            <dt>Sello</dt>
            <dd>
              {maya.seal.name}: {maya.seal.essence}
            </dd>
          </div>
          <div>
            <dt>Tono {maya.toneNumber}</dt>
            <dd>
              {maya.tone.masculine}: {maya.tone.power}
            </dd>
          </div>
        </dl>
      </figcaption>
    </figure>
  );
}

const NUMBER_ART = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);

export function NameNumbersCard({ numbers }: { numbers: NameNumbers }) {
  return (
    <figure className="name-card">
      {NUMBER_ART.has(numbers.expression) && (
        <img
          src={`/numeros/${numbers.expression}-480.webp`}
          alt=""
          width="480"
          height="480"
          decoding="async"
        />
      )}
      <figcaption>
        <ul className="chip-group" aria-label="Vibración de cada parte">
          {numbers.parts.map((p) => (
            <li key={p.label} className="badge badge-violet">
              {p.text} → {p.value}
            </li>
          ))}
        </ul>
        <dl className="name-numbers">
          <div>
            <dt>Expresión</dt>
            <dd>{numbers.expression}</dd>
          </div>
          <div>
            <dt>Alma</dt>
            <dd>{numbers.soul}</dd>
          </div>
          <div>
            <dt>Personalidad</dt>
            <dd>{numbers.personality}</dd>
          </div>
        </dl>
      </figcaption>
    </figure>
  );
}

/**
 * Todo lo que ZODI sabe de una persona, reunido en un solo objeto: lo usan la
 * sección "Todo sobre mí" y el informe en PDF. Nada de IA aquí: la carta, los
 * números, el animal chino, el sello maya y los nombres salen del cálculo y de
 * la base de conocimiento (salvo un nombre que no esté de serie, que se
 * investiga una sola vez).
 */
import { todayFor } from '@/lib/ai/context';
import { chineseZodiac, lifePathNumber } from '@/lib/ai/numerology';
import type { NatalChart } from '@/lib/astro-engine';
import { biorhythmOn } from '@/lib/daily/biorhythm';
import { mayanSign } from '@/lib/divination/maya';
import { birthDay, type BirthDay } from '@/lib/chart/birth-day';
import { chartMeaning, type MeaningSection } from '@/lib/chart/meaning';
import { chineseKnowledge, numberKnowledge } from '@/lib/knowledge';
import { nameMeaning, type NamePart } from '@/lib/names/meaning';
import { personSky } from '@/lib/people/affinity';
import { personView, type PersonView } from '@/lib/people/view';
import { birthCard } from '@/lib/public/teaser';
import { getLatestSelfChart, type StoredChart } from '@/lib/server/charts';
import { lookupName } from '@/lib/server/names';
import { listPeople } from '@/lib/server/people';
import type { Profile } from '@/lib/server/profile';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';

export interface CosmicCard {
  id: string;
  label: string;
  value: string;
  /** Una línea con gracia, de la base de conocimiento. */
  line: string;
  /** Sección de "El significado" a la que lleva. */
  href: string;
}

export interface PersonalReport {
  stored: StoredChart;
  chart: NatalChart;
  timeKnown: boolean;
  timeZone: string;
  fullName: string;
  firstName: string;
  born: BirthDay;
  meaning: MeaningSection[];
  nameParts: NamePart[];
  people: PersonView[];
  cards: CosmicCard[];
  today: string;
  /** El Sol, la Luna y el Ascendente, para la portada. */
  big3: { sun: string; moon: string; asc: string | null };
}

export interface BuildOptions {
  supabase: ZodiSupabaseClient;
  profile: Profile;
  /** Nombre completo escrito a mano (si no, el guardado en el perfil). */
  fullName?: string | undefined;
  /** Investigar con IA los nombres que no estén de serie (solo el informe). */
  lookupNames?: boolean;
  now?: Date;
}

export async function buildReport(opts: BuildOptions): Promise<PersonalReport | null> {
  const { supabase, profile } = opts;
  const now = opts.now ?? new Date();
  const stored = await getLatestSelfChart(supabase);
  if (!stored) return null;

  const timeZone = profile.time_zone ?? 'Europe/Madrid';
  const today = todayFor(now, timeZone);
  const fullName = (opts.fullName ?? profile.full_name ?? profile.display_name).trim();
  const firstName = fullName.split(/\s+/)[0] || profile.display_name;
  const { chart } = stored;
  const timeKnown = stored.input.timeKnown;
  const birthDate = stored.input.date;

  const meaning = chartMeaning({ chart, timeKnown, birthDate, displayName: fullName, today });
  const born = birthDay({
    chart,
    birthDate,
    timeKnown,
    timeZone: stored.input.timeZone,
    today,
    now,
  });

  let nameParts = nameMeaning(fullName);
  if (opts.lookupNames) {
    nameParts = await Promise.all(
      nameParts.map(async (part) => {
        if (part.entry) return part;
        const r = await lookupName(supabase, part.kind, part.word).catch(() => null);
        return r?.status === 'ok' ? { ...part, entry: r.entry } : part;
      }),
    );
  }

  const myTime = timeKnown ? stored.input.time : null;
  const me = { birthDate, sky: personSky(birthDate, myTime, timeZone) };
  const people = (await listPeople(supabase).catch(() => [])).map((p) =>
    personView(p, me, { timeZone, today, now }),
  );

  const planet = (id: string) => chart.planets.find((p) => p.id === id)!;
  const life = lifePathNumber(birthDate);
  const lifeK = numberKnowledge(life);
  const cz = chineseZodiac(birthDate);
  const czK = chineseKnowledge(cz.animal);
  const maya = mayanSign(birthDate);
  const card = birthCard(birthDate);
  const bio = biorhythmOn(birthDate, today);
  const peak = Object.entries(bio)
    .filter(([k]) => k !== 'date')
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0]!;

  const cards: CosmicCard[] = [
    {
      id: 'sol',
      label: 'Tu Sol',
      value: planet('sun').sign,
      line: 'Quién eres cuando nadie te mira.',
      href: '/app/carta/significado#sol',
    },
    {
      id: 'luna',
      label: 'Tu Luna',
      value: planet('moon').sign,
      line: 'Lo que necesitas para sentirte a salvo (y por qué lloras con los anuncios).',
      href: '/app/carta/significado#moon',
    },
    ...(timeKnown
      ? [
          {
            id: 'asc',
            label: 'Tu Ascendente',
            value: chart.ascendant.sign,
            line: 'La cara que pones antes de que te conozcan.',
            href: '/app/carta/significado#ascendente',
          },
        ]
      : []),
    {
      id: 'numero',
      label: 'Camino de vida',
      value: lifeK ? `${life} · ${lifeK.titulo}` : String(life),
      line: lifeK?.frase ?? 'Tu número de la suerte (o de los deberes).',
      href: '/app/carta/significado#numeros',
    },
    {
      id: 'chino',
      label: 'Animal chino',
      value: `${cz.animal} de ${cz.element}`,
      line: czK?.frase ?? 'Tu animal, según un calendario de hace 4.000 años.',
      href: '/app/carta/significado#chino',
    },
    {
      id: 'maya',
      label: 'Sello maya',
      value: maya.name,
      line: `Kin ${maya.kin} de 260. Sí, hay 260 días: los mayas no se conformaban con 12 meses.`,
      href: '/app/carta/significado#maya',
    },
    {
      id: 'tarot',
      label: 'Tu carta del tarot',
      value: `${card.numeral} · ${card.name}`,
      line: card.message,
      href: '/app/carta/significado#tarot',
    },
    {
      id: 'nacimiento',
      label: 'El día que naciste',
      value: `Un ${born.weekday.day} de ${born.moon.name.toLowerCase()}`,
      line: `Retorno solar en ${born.nextSolarReturn ? Math.ceil((born.nextSolarReturn.getTime() - now.getTime()) / 86_400_000) : '—'} días: tu cumpleaños astrológico.`,
      href: '/app/carta/significado#nacimiento',
    },
    {
      id: 'energia',
      label: 'Tu energía hoy',
      value: `${Math.round(((Number(peak[1]) + 1) / 2) * 100)} % de ${peak[0]}`,
      line: 'Biorritmo: lo que tu cuerpo, tu corazón y tu cabeza dan de sí hoy.',
      href: '/app',
    },
  ];

  return {
    stored,
    chart,
    timeKnown,
    timeZone,
    fullName,
    firstName,
    born,
    meaning,
    nameParts,
    people,
    cards,
    today,
    big3: {
      sun: planet('sun').sign,
      moon: planet('moon').sign,
      asc: timeKnown ? chart.ascendant.sign : null,
    },
  };
}

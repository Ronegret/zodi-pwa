/**
 * Datos del dashboard a partir del perfil, la carta guardada y "ahora".
 * Puro (sin Supabase) para poder testearlo.
 */
import type { NatalChart, PlanetPosition } from '@/lib/astro-engine';
import { elementBalance, signSlug } from '@/lib/astro-engine/labels';
import { moonInfo, transitsToNatal } from '@/lib/astro-engine/sky';
import { addDays, biorhythmSeries, civilDate } from '@/lib/daily/biorhythm';
import { levelProgress, rankFor } from '@/lib/daily/progress';
import { headline, ritualsFor } from '@/lib/daily/today';
import type { Tables } from '@/lib/supabase/database.types';

type ProfileForDashboard = Pick<
  Tables<'profiles'>,
  'display_name' | 'birth_date' | 'time_zone' | 'xp' | 'streak' | 'gems'
>;

export const ENERGY_DAYS_BEFORE = 3;
export const ENERGY_DAYS = 14;

export function buildDashboard(
  profile: ProfileForDashboard,
  chart: { chart: NatalChart; timeKnown: boolean } | null,
  now: Date,
) {
  const tz = profile.time_zone ?? 'Europe/Madrid';
  const today = civilDate(now, tz);
  const moon = moonInfo(now);
  const transits = chart
    ? transitsToNatal(chart.chart, now, { includeAscendant: chart.timeKnown })
    : [];
  const find = (id: PlanetPosition['id']) => chart?.chart.planets.find((p) => p.id === id);
  const sun = find('sun');

  return {
    firstName: profile.display_name.trim().split(/\s+/)[0] || 'Viajera',
    today,
    moon,
    headline: headline(transits[0], moon),
    transits: transits.slice(0, 3),
    rituals: ritualsFor(moon),
    chart: chart
      ? {
          sun: sun!,
          moon: find('moon')!,
          ascendant: chart.timeKnown ? chart.chart.ascendant : null,
          sunImage: `/zodiac/${signSlug(sun!.sign)}-640.webp`,
          elements: elementBalance(chart.chart.planets),
        }
      : null,
    energy: profile.birth_date
      ? {
          series: biorhythmSeries(
            profile.birth_date,
            addDays(today, -ENERGY_DAYS_BEFORE),
            ENERGY_DAYS,
          ),
          todayIndex: ENERGY_DAYS_BEFORE,
        }
      : null,
    progress: { ...levelProgress(profile.xp), rank: rankFor(levelProgress(profile.xp).level) },
    streak: profile.streak,
    gems: profile.gems,
  };
}

export type Dashboard = ReturnType<typeof buildDashboard>;

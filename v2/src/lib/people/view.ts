/** Lo que se pinta de cada persona de "Tu gente". Puro. */
import { signSlug } from '@/lib/astro-engine/labels';
import type { Person } from '@/lib/server/people';
import {
  affinity,
  dayWith,
  personSky,
  type Affinity,
  type DayWith,
  type PersonSky,
} from './affinity';

export interface Me {
  birthDate: string;
  sky: PersonSky;
}

export interface PersonView {
  person: Person;
  sky: PersonSky;
  affinity: Affinity;
  day: DayWith;
  avatar: string;
}

export const signAvatar = (sign: PersonSky['sun']) => `/signos/${signSlug(sign)}-avatar-240.webp`;

export function personView(
  person: Person,
  me: Me,
  ctx: { timeZone: string; today: string; now: Date },
): PersonView {
  const sky = personSky(person.birthDate, person.birthTime, ctx.timeZone);
  return {
    person,
    sky,
    affinity: affinity(me, { birthDate: person.birthDate, sky }, person.relation),
    day: dayWith({
      you: { birthDate: me.birthDate, sun: me.sky.sun },
      them: { birthDate: person.birthDate, sun: sky.sun, name: person.name },
      relation: person.relation,
      today: ctx.today,
      now: ctx.now,
    }),
    avatar: signAvatar(sky.sun),
  };
}

export function birthdayLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days === 0) return '¡Hoy es su cumpleaños!';
  if (days === 1) return 'Cumple mañana';
  return `Cumple en ${days} días`;
}

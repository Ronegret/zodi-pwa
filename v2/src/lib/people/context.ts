/**
 * "Su gente" para el oráculo: quién es cada persona que ha añadido, su
 * cielo, la afinidad y cómo está el día entre los dos. Así ZODI puede
 * contestar "¿cómo me irá hoy con mi madre?" con datos. Puro.
 */
import type { ProfileForReading } from '@/lib/ai/context';
import { chineseZodiac, lifePathNumber } from '@/lib/ai/numerology';
import { civilDate } from '@/lib/daily/biorhythm';
import type { Person } from '@/lib/server/people';
import { personSky } from './affinity';
import { RELATIONS } from './relations';
import { personView } from './view';

const MAX = 12;

export function peopleContext(people: Person[], profile: ProfileForReading, now: Date): string {
  if (!people.length || !profile.birth_date) return '';
  const timeZone = profile.time_zone ?? 'Europe/Madrid';
  const today = civilDate(now, timeZone);
  const myTime =
    profile.birth_time_known && profile.birth_time ? profile.birth_time.slice(0, 5) : null;
  const me = {
    birthDate: profile.birth_date,
    sky: personSky(profile.birth_date, myTime, timeZone),
  };
  const lines = people.slice(0, MAX).map((p) => {
    const x = personView(p, me, { timeZone, today, now });
    const cz = chineseZodiac(p.birthDate);
    const moon = x.sky.moon ?? `${x.sky.moonOptions.join(' o ')} (sin hora)`;
    const bday =
      x.day.birthdayIn === 0
        ? ' **HOY ES SU CUMPLEAÑOS**.'
        : x.day.birthdayIn !== null
          ? ` Cumple en ${x.day.birthdayIn} días.`
          : '';
    return (
      `- ${p.name} (${RELATIONS[p.relation].label.toLowerCase()}, nació el ${p.birthDate}): ` +
      `Sol en ${x.sky.sun}, Luna en ${moon}, Venus en ${x.sky.venus}, Marte en ${x.sky.mars}; ` +
      `${cz.animal} de ${cz.element}; camino de vida ${lifePathNumber(p.birthDate)}. ` +
      `Afinidad: ${x.affinity.score} % (${x.affinity.parts[0]!.name} entre los Soles). ` +
      `Hoy entre los dos: ${x.day.label.toLowerCase()}; ${x.day.text}${bday}`
    );
  });
  return [
    '## Su gente (fichas privadas que ha añadido)',
    'Si pregunta por alguien de esta lista, usa sus datos; si nombra a alguien que no está, sugiere añadirlo en "Tu gente".',
    ...lines,
  ].join('\n');
}

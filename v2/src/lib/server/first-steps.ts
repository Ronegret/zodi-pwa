/**
 * "Tus primeros pasos": lo que conviene hacer al llegar, en orden, con el
 * porqué en una frase. Se calcula con lo que la persona ya ha hecho.
 */
import type { ZodiSupabaseClient } from '@/lib/supabase/server';
import type { Profile } from './profile';

export interface FirstStep {
  id: string;
  done: boolean;
  title: string;
  why: string;
  href: string;
  cta: string;
}

const TRACKED = ['daily-horoscope', 'assistant', 'tarot', 'celtic-tarot'] as const;

export async function firstSteps(
  supabase: ZodiSupabaseClient,
  profile: Pick<Profile, 'personal_bio' | 'relationship_status'>,
  hasChart: boolean,
): Promise<FirstStep[]> {
  const { data, error } = await supabase
    .from('readings')
    .select('kind')
    .in('kind', [...TRACKED])
    .limit(200);
  if (error) console.error('[primeros pasos]', error.message);
  const kinds = new Set((data ?? []).map((r) => r.kind));
  return [
    {
      id: 'carta',
      done: hasChart,
      title: 'Calcula tu carta',
      why: 'Es el mapa del cielo del día que naciste: la base de todo lo que te dice ZODI.',
      href: hasChart ? '/app/carta' : '/app/onboarding',
      cta: hasChart ? 'Ver mi carta' : 'Calcularla',
    },
    {
      id: 'horoscopo',
      done: kinds.has('daily-horoscope'),
      title: 'Lee tu horóscopo de hoy',
      why: 'El tuyo de verdad: con tus planetas, no el de tu signo a secas.',
      href: '/app/horoscopo',
      cta: 'Leer mi día',
    },
    {
      id: 'oraculo',
      done: kinds.has('assistant'),
      title: 'Pregúntale algo al oráculo',
      why: 'Escribe lo que te ronda y ZODI te contesta con tu carta delante.',
      href: '/app/oraculo',
      cta: 'Preguntar',
    },
    {
      id: 'tarot',
      done: kinds.has('tarot') || kinds.has('celtic-tarot'),
      title: 'Tira tus primeras cartas',
      why: 'Una pregunta, tres cartas y una respuesta sin rodeos.',
      href: '/app/lecturas/tarot',
      cta: 'Tirar cartas',
    },
    {
      id: 'sobre-ti',
      done: Boolean(profile.personal_bio || profile.relationship_status),
      title: 'Cuéntale a ZODI sobre ti',
      why: 'Tu situación sentimental o a qué te dedicas: así las lecturas hablan de tu vida real.',
      href: '/app/ajustes#sobre-ti',
      cta: 'Completar',
    },
  ];
}

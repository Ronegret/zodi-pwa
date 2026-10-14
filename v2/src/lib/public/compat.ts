/**
 * Compatibilidad de signos para las páginas públicas (/compatibilidad):
 * el vínculo en la rueda, los elementos, el ritmo y cómo funciona en el amor,
 * la amistad y el trabajo. Solo con el Sol: la versión completa (Luna,
 * Venus, Marte…) está en "Tu gente". Puro.
 */
import { SIGNS, type Sign } from '@/lib/astro-engine/types';
import { pairKnowledge, type PairKnowledge } from '@/lib/knowledge';
import { signMatch, type SignMatch } from '@/lib/people/affinity';
import { SIGN_INFO, type SignInfo } from './signs';

const DEGREES = ['0°', '30°', '60°', '90°', '120°', '150°', '180°'];

const WHEEL: string[] = [
  'Son el mismo signo: están en el mismo punto de la rueda.',
  'Están pegados en la rueda (30°): signos vecinos.',
  'Los separan dos signos (60°): eso se llama sextil.',
  'Los separan tres signos (90°): eso se llama cuadratura.',
  'Los separan cuatro signos (120°): eso se llama trígono, y comparten elemento.',
  'Los separan cinco signos (150°): eso se llama quincuncio.',
  'Están frente a frente en la rueda (180°): son signos opuestos.',
];

const AREAS: Record<'amor' | 'amistad' | 'trabajo', string[]> = {
  amor: [
    'Se entienden a la primera, pero también se aburren de verse en el espejo. Necesitan planes nuevos para no caer en la rutina.',
    'Atracción por lo diferente: uno enseña al otro lo que no sabe. Funciona si no intentan cambiarse.',
    'Química fácil y buena conversación. El amor crece a fuego lento, desde la amistad.',
    'Chispa y discusiones a partes iguales. Si aprenden a pelear bien, es una pareja que hace crecer.',
    'De las mejores combinaciones: se sienten en casa. El riesgo es acomodarse y dejar de sorprenderse.',
    'Se gustan, pero cuesta encajar los ritmos. Hace falta hablar mucho y no dar nada por hecho.',
    'Imán puro: lo que uno no tiene, lo tiene el otro. Mucha pasión y mucha negociación.',
  ],
  amistad: [
    'Amistad de espejo: mismos chistes, mismas manías. Se defienden a muerte.',
    'Amistad que suma: cada cual aporta lo que al otro le falta.',
    'Amistad fácil y divertida, de las que duran años sin esfuerzo.',
    'Amistad con roces: se dicen las verdades. Si sobrevive a la primera bronca, es para siempre.',
    'Amistad natural: se entienden sin explicar nada.',
    'Amistad curiosa: no se entienden del todo, y eso la hace interesante.',
    'Amistad de polos opuestos: se complementan y se desesperan a partes iguales.',
  ],
  trabajo: [
    'Mismo estilo de trabajo: rinden rápido, pero les cuesta ver sus puntos ciegos.',
    'Buen equipo si se reparten bien las tareas: miran el mismo problema desde lados distintos.',
    'Buen equipo: se animan, se pasan ideas y avanzan.',
    'Choque de estilos: si se respetan, el resultado es mejor que el de cada cual por separado.',
    'Equipo fluido: se entienden sin reuniones eternas.',
    'Les cuesta coordinarse: mejor objetivos claros y por escrito.',
    'Equipo complementario: uno arranca y el otro remata, si nadie quiere mandar a la vez.',
  ],
};

const RHYTHM: Record<string, string> = {
  'Cardinal-Cardinal':
    'Los dos son cardinales: quieren empezar y liderar. Ojo con pelear por el volante.',
  'Fijo-Fijo': 'Los dos son fijos: leales y constantes, pero tozudos. Ceder no es perder.',
  'Mutable-Mutable':
    'Los dos son mutables: flexibles y curiosos, pero les cuesta decidir y terminar.',
  'Cardinal-Fijo': 'Uno arranca (cardinal) y el otro sostiene (fijo): buen tándem si no se frenan.',
  'Cardinal-Mutable': 'Uno propone (cardinal) y el otro se adapta (mutable): ritmo ágil.',
  'Fijo-Mutable':
    'Uno da estabilidad (fijo) y el otro cambio (mutable): se equilibran si se escuchan.',
};

export interface CompatPage {
  a: SignInfo;
  b: SignInfo;
  match: SignMatch;
  degrees: string;
  wheel: string;
  rhythm: string;
  areas: { id: 'amor' | 'amistad' | 'trabajo'; title: string; text: string }[];
  /** Textos específicos de esta pareja (base de conocimiento), si existen. */
  kb: PairKnowledge | null;
}

const bySlug = new Map(SIGN_INFO.map((s) => [s.slug, s]));
const MOD_ORDER = ['Cardinal', 'Fijo', 'Mutable'];

/** "aries-y-leo" → los dos signos (o null). */
export function parsePair(slug: string): [SignInfo, SignInfo] | null {
  const m = /^([a-z]+)-y-([a-z]+)$/.exec(slug);
  const a = m && bySlug.get(m[1]!);
  const b = m && bySlug.get(m[2]!);
  return a && b ? [a, b] : null;
}

export const pairSlug = (a: SignInfo, b: SignInfo) => `${a.slug}-y-${b.slug}`;

/** La URL canónica pone primero el signo que va antes en el zodiaco. */
export function canonicalPair(a: SignInfo, b: SignInfo): string {
  return SIGNS.indexOf(a.name) <= SIGNS.indexOf(b.name) ? pairSlug(a, b) : pairSlug(b, a);
}

export function compatPage(a: SignInfo, b: SignInfo): CompatPage {
  const match = signMatch(a.name as Sign, b.name as Sign);
  const kb = pairKnowledge(a.name as Sign, b.name as Sign);
  const mods = [a.modality, b.modality].sort((x, y) => MOD_ORDER.indexOf(x) - MOD_ORDER.indexOf(y));
  return {
    a,
    b,
    match,
    degrees: DEGREES[match.distance]!,
    wheel: WHEEL[match.distance]!,
    rhythm: RHYTHM[mods.join('-')]!,
    areas: [
      { id: 'amor', title: 'En el amor', text: kb?.amor ?? AREAS.amor[match.distance]! },
      {
        id: 'amistad',
        title: 'En la amistad',
        text: kb?.amistad ?? AREAS.amistad[match.distance]!,
      },
      {
        id: 'trabajo',
        title: 'En el trabajo',
        text: kb?.trabajo ?? AREAS.trabajo[match.distance]!,
      },
    ],
    kb,
  };
}

/** Las tres mejores parejas de cada signo (para enlazar). */
export function bestFor(a: SignInfo): SignInfo[] {
  return SIGN_INFO.filter((b) => b.slug !== a.slug)
    .map((b) => ({ b, score: signMatch(a.name as Sign, b.name as Sign).score }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map((x) => x.b);
}

/**
 * Horóscopo de hoy para un signo, sin IA: el cielo real del día leído por
 * casas solares (el signo es la casa 1), que es como se escriben los
 * horóscopos por signo. Determinista: mismo signo y día, mismo texto. Puro.
 */
import { isRetrograde } from '@/lib/astro-engine/planets';
import { moonInfo, skyAt, type MoonInfo } from '@/lib/astro-engine/sky';
import { SIGNS, type PlanetId, type Sign } from '@/lib/astro-engine/types';
import { hash32 } from '@/lib/tarot/daily';
import { SIGN_INFO } from './signs';

const MOON_HOUSE = [
  'La Luna pasa por tu signo: hoy se te nota todo en la cara. Sensibilidad a tope y ganas de que el mundo gire a tu ritmo.',
  'La Luna te remueve el bolsillo: antojos caros y hambre de seguridad. Revisa el carrito antes de pagar.',
  'Día de mensajes, audios y recados. Tu cabeza va a mil: apunta antes de soltar.',
  'La Luna te pide casa, sofá y gente de confianza. Lo familiar pesa hoy más de lo normal.',
  'Ganas de ligar, de jugar y de que te miren. Lo que hagas con el corazón hoy sale bien.',
  'Día de ordenar: la rutina, la agenda y el cuerpo te piden atención. Lo pequeño suma.',
  'Hoy todo pasa por otra persona: pareja, socios o ese alguien. Escucha antes de reaccionar.',
  'La Luna baja al sótano: emociones intensas, celos y verdades que pican. No todo se dice por WhatsApp.',
  'Te apetece escapar, aprender o cambiar de aires. Un plan diferente te recoloca la cabeza.',
  'Los focos te apuntan: lo que hagas hoy en público se recuerda. Cuida las formas.',
  'Día de grupo: amistades, planes y redes. Alguien de tu gente trae una idea que vale oro.',
  'La Luna te pide bajar el volumen. Descansa y no tomes decisiones con el cansancio.',
];

const VENUS_HOUSE = [
  'Venus está en tu signo: tienes un imán puesto. Si hay que dar un paso, que sea ahora.',
  'El amor se demuestra con detalles y con tiempo. Ojo con intentar comprar cariño.',
  'Coqueteo por escrito: las palabras bonitas abren puertas. Manda ese mensaje (sin audios de cuatro minutos).',
  'Amor en modo casero: plan tranquilo y conversación de verdad. La familia opina; tú decides.',
  'Venus te pone en modo conquista: romance, risas y química. Si no tienes pareja, sal de casa.',
  'El cariño está en lo cotidiano: ayuda, cuida, cocina. Un gesto pequeño vale más que una declaración.',
  'Venus pasa por tu zona de pareja: buen momento para acuerdos, reconciliaciones y hablar claro.',
  'Pasión intensa y algún celo. Lo que se mueve bajo la superficie pide honestidad.',
  'Te atrae lo diferente: alguien de lejos o con otra forma de ver la vida. Déjate sorprender.',
  'El amor se cruza con tu imagen pública. Cuidado con mezclar trabajo y química.',
  'Una amistad puede subir de nivel, o alguien te presenta a alguien. Di que sí al plan.',
  'Amores secretos, nostalgia y algún ex rondando la cabeza. No escribas de madrugada.',
];

const MARS_HOUSE = [
  'Marte en tu signo: energía de sobra y paciencia de menos. Empuja tus proyectos, no a la gente.',
  'Toca pelear por tu dinero: pide, cobra y negocia. Y frena los gastos por impulso.',
  'Discusiones rápidas y decisiones más rápidas aún. Cuenta hasta diez antes de contestar.',
  'Tensión en casa o ganas de reformarlo todo. Canaliza la energía en ordenar, no en gritar.',
  'Energía creativa y competitiva: ideal para lanzar algo tuyo. No apuestes lo que no tienes.',
  'Mucho trabajo y ganas de sacarlo. Organízate o el cuerpo te pasará factura.',
  'Roces con socios o pareja: se negocia, no se gana. Elige tus batallas.',
  'Dinero compartido, deudas y juegos de poder. Lee la letra pequeña.',
  'Ganas de moverte, estudiar o defender tus ideas. Que no se convierta en sermón.',
  'Marte empuja tu carrera: es día de pedir, proponer y liderar.',
  'Energía para proyectos en equipo, con algún choque de egos. Tú, al objetivo.',
  'Energía baja o escondida. Trabaja en la sombra y descansa: el sprint llega después.',
];

const ADVICE = [
  'No contestes ese mensaje hasta después de comer.',
  'Haz hoy la llamada que llevas una semana posponiendo.',
  'Bebe agua. No es espiritual, pero funciona.',
  'Di que no a un plan. El universo no se va a ofender.',
  'Ordena una cosa pequeña: un cajón también es un ritual.',
  'Deja de mirar su perfil. Ya sabes lo que hay.',
  'Pide lo que vales. Con cifras.',
  'Escucha más de lo que hablas: hoy se aprende.',
  'Sal a caminar diez minutos sin auriculares.',
  'Termina algo antes de empezar otra cosa.',
  'Hoy el drama no es tuyo. Míralo desde la grada.',
  'Haz un cumplido sincero. Vuelve multiplicado.',
  'Apaga el móvil una hora. Nadie se muere.',
  'Escribe tres cosas que quieres soltar y suéltalas.',
  'Si dudas entre dos opciones, elige la que da menos miedo a largo plazo.',
  'Ríete de ti un rato. Es gratis y quita peso.',
];

const COLORS: Record<SignDayElement, string[]> = {
  Fuego: ['rojo', 'naranja', 'dorado'],
  Tierra: ['verde', 'marrón', 'beige'],
  Aire: ['amarillo', 'azul cielo', 'blanco'],
  Agua: ['azul marino', 'violeta', 'turquesa'],
};

type SignDayElement = 'Fuego' | 'Tierra' | 'Aire' | 'Agua';

export interface SignDay {
  sign: Sign;
  date: string;
  moon: MoonInfo & { house: number };
  /** Una frase que resume el día. */
  headline: string;
  love: string;
  work: string;
  energy: string;
  advice: string;
  /** Avisos de retrógrados que tocan hoy. */
  alerts: string[];
  scores: { love: number; work: number; energy: number };
  luckyNumber: number;
  color: string;
  /** Signo con el que mejor fluye hoy. */
  ally: Sign;
  /** Casas solares de los planetas personales (para la IA y para quien sepa). */
  houses: Partial<Record<PlanetId, number>>;
}

const clamp = (n: number) => Math.max(1, Math.min(5, n));

function phaseNote(moon: MoonInfo): string {
  if (moon.name === 'Luna nueva')
    return 'Luna nueva: momento de intención. Escribe lo que quieres empezar.';
  if (moon.name === 'Luna llena')
    return 'Luna llena: todo se intensifica. Cosecha, pero no decidas a lo loco.';
  return moon.waxing
    ? 'Luna creciente: lo que empujes ahora coge fuerza.'
    : 'Luna menguante: suelta, limpia y cierra lo que ya no va.';
}

/** `date` es la fecha civil (AAAA-MM-DD); el cielo se mira a mediodía UTC. */
export function signDay(signIdx: number, date: string): SignDay {
  const at = new Date(`${date}T12:00:00Z`);
  const sign = SIGNS[signIdx]!;
  const houseOf = (s: Sign) => ((SIGNS.indexOf(s) - signIdx + 12) % 12) + 1;
  const sky = skyAt(at);
  const houses: Partial<Record<PlanetId, number>> = {};
  for (const p of sky) houses[p.id] = houseOf(p.sign);
  const moon = { ...moonInfo(at), house: houses.moon! };
  const venusRetro = isRetrograde('venus', at);
  const mercuryRetro = isRetrograde('mercury', at);

  const alerts: string[] = [];
  if (mercuryRetro)
    alerts.push('Mercurio retrógrado: revisa antes de enviar, firmar o comprar tecnología.');
  if (venusRetro)
    alerts.push('Venus retrógrada: vuelven exes y dudas. Revisa, no decidas en caliente.');

  const h = (id: PlanetId) => houses[id]!;
  const love = clamp(
    3 +
      ([1, 5, 7, 11].includes(h('venus')) ? 1 : 0) -
      ([8, 12].includes(h('venus')) ? 1 : 0) -
      (venusRetro ? 1 : 0) +
      ([5, 7].includes(moon.house) ? 1 : 0),
  );
  const work = clamp(
    3 +
      ([1, 6, 10].includes(h('mars')) ? 1 : 0) -
      (h('mars') === 12 ? 1 : 0) -
      (mercuryRetro ? 1 : 0) +
      ([2, 6, 10].includes(h('jupiter')) ? 1 : 0),
  );
  const energy = clamp(
    3 + (moon.waxing ? 1 : 0) - (moon.house === 12 ? 1 : 0) + (h('mars') === 1 ? 1 : 0),
  );

  const seed = hash32(`${sign}:${date}`);
  const element = SIGN_INFO[signIdx]!.element;
  const allies = [(signIdx + 4) % 12, (signIdx + 8) % 12, (signIdx + 2) % 12, (signIdx + 10) % 12];
  const moonIdx = SIGNS.indexOf(moon.sign);
  const ally = SIGNS[allies.includes(moonIdx) ? moonIdx : allies[seed % allies.length]!]!;

  return {
    sign,
    date,
    moon,
    headline: MOON_HOUSE[moon.house - 1]!,
    love: VENUS_HOUSE[h('venus') - 1]!,
    work: MARS_HOUSE[h('mars') - 1]!,
    energy: phaseNote(moon),
    advice: ADVICE[seed % ADVICE.length]!,
    alerts,
    scores: { love, work, energy },
    luckyNumber: (seed % 99) + 1,
    color: COLORS[element][(seed >>> 8) % 3]!,
    ally,
    houses,
  };
}

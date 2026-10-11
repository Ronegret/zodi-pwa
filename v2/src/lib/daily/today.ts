/**
 * Lo que enseña la tarjeta "Hoy" sin IA: tránsito más exacto, Luna y
 * rituales según la fase. Copy con el tono Zodi. La lectura generada por IA
 * llega en la Fase 7 y sustituirá el titular, no los datos.
 */
import type { MoonInfo, Transit } from '@/lib/astro-engine/sky';
import { ASPECT_NAMES, PLANET_NAMES } from '@/lib/astro-engine/labels';

const HEADLINES: Record<Transit['type'], string> = {
  conjunction: 'pega fuerte en tu',
  trine: 'te sopla a favor sobre tu',
  sextile: 'te abre una puerta en tu',
  square: 'te pincha justo en tu',
  opposition: 'te tira del lado contrario de tu',
};

const natalName = (id: Transit['natal']) => (id === 'ascendant' ? 'Ascendente' : PLANET_NAMES[id]);
/** Sujeto de frase: "El Sol", "La Luna", "Marte". */
const subject = (id: Transit['transiting']) =>
  id === 'sun' ? 'El Sol' : id === 'moon' ? 'La Luna' : PLANET_NAMES[id];

/** "Marte en trígono a tu Sol" */
export function describeTransit(t: Transit): string {
  return `${PLANET_NAMES[t.transiting]} en ${ASPECT_NAMES[t.type]} a tu ${natalName(t.natal)}`;
}

export function headline(t: Transit | undefined, moon: MoonInfo): string {
  if (!t) {
    return `${moon.name} en ${moon.sign}. Día tranquilo en tu carta: aprovecha antes de que el universo se aburra.`;
  }
  return `${subject(t.transiting)} ${HEADLINES[t.type]} ${natalName(t.natal)}. ${
    t.type === 'square' || t.type === 'opposition'
      ? 'Respira antes de contestar ese mensaje.'
      : 'Si no lo aprovechas hoy, no culpes a Mercurio.'
  }`;
}

const RITUALS: Record<'nueva' | 'creciente' | 'llena' | 'menguante', string[]> = {
  nueva: [
    'Escribe una intención. Una. No una lista de la compra.',
    'Apaga el móvil 20 minutos y aguanta el síndrome de abstinencia.',
    'Limpia un cajón: lo de fuera se ordena antes que lo de dentro.',
  ],
  creciente: [
    'Da el primer paso de eso que llevas semanas posponiendo.',
    'Riega algo vivo: planta, amistad o proyecto.',
    'Di que sí a un plan que te dé un poco de miedo.',
  ],
  llena: [
    'Agradece tres cosas en voz alta (sí, en voz alta).',
    'Suelta un rencor. No hace falta avisar a nadie.',
    'Deja agua al aire de la noche y bébela mañana con intención.',
  ],
  menguante: [
    'Cancela algo que ya no te apetece. Sin culpa.',
    'Haz limpieza de chats que te restan energía.',
    'Acuéstate pronto: la Luna también descansa.',
  ],
};

export function ritualsFor(moon: MoonInfo): string[] {
  if (moon.name === 'Luna nueva') return RITUALS.nueva;
  if (moon.name === 'Luna llena' || moon.name === 'Gibosa creciente') return RITUALS.llena;
  return moon.waxing ? RITUALS.creciente : RITUALS.menguante;
}

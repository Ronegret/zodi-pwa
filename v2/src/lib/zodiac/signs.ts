/** Fechas y una línea de carácter por signo (tono Zodi). Sin dependencias pesadas. */
import type { Sign } from '@/lib/astro-engine/types';

export const SIGN_INFO: Record<Sign, { dates: string; blurb: string }> = {
  Aries: { dates: '21 mar – 19 abr', blurb: 'Primero actúa, luego pregunta. A veces ni pregunta.' },
  Tauro: { dates: '20 abr – 20 may', blurb: 'Paciencia infinita hasta que le tocas la comida.' },
  Géminis: { dates: '21 may – 20 jun', blurb: 'Dos opiniones por tema y las dos con argumentos.' },
  Cáncer: { dates: '21 jun – 22 jul', blurb: 'Coraza dura, corazón de mantequilla.' },
  Leo: { dates: '23 jul – 22 ago', blurb: 'No busca protagonismo: el protagonismo le encuentra.' },
  Virgo: { dates: '23 ago – 22 sep', blurb: 'Lo ha revisado tres veces. Y lo va a revisar otra.' },
  Libra: { dates: '23 sep – 22 oct', blurb: 'Equilibrio perfecto… salvo para elegir restaurante.' },
  Escorpio: { dates: '23 oct – 21 nov', blurb: 'Lo sabe todo. Lo cuenta cuando quiere.' },
  Sagitario: { dates: '22 nov – 21 dic', blurb: 'Maleta hecha y una verdad incómoda en la boca.' },
  Capricornio: {
    dates: '22 dic – 19 ene',
    blurb: 'Tiene un plan a cinco años. Y otro de reserva.',
  },
  Acuario: { dates: '20 ene – 18 feb', blurb: 'Raro con orgullo y con razón casi siempre.' },
  Piscis: { dates: '19 feb – 20 mar', blurb: 'Sueña despierto y acierta más de lo que admites.' },
};

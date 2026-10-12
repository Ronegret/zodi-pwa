/**
 * Catálogo de lecturas: lo que ve la persona (título, gancho, arte) y lo que
 * recibe la IA (instrucciones). Serializable: las islas lo reciben tal cual.
 */
import type { Enums } from '@/lib/supabase/database.types';
import type { SpreadId } from '@/lib/tarot/deck';

export type ReadingKind = Enums<'reading_kind'>;
export type ReadingInput =
  'none' | 'question' | 'dream' | 'partner' | 'name' | 'palm' | 'runes' | 'crystal';

/** Para agrupar el catálogo en el hub. */
export type KindGroup = 'horoscopos' | 'tarot' | 'tu-carta' | 'misticos';

export interface KindDef {
  kind: ReadingKind;
  slug: string;
  title: string;
  kicker: string;
  blurb: string;
  /** Imagen de fondo de la tarjeta (de public/). */
  art: string;
  input: ReadingInput;
  /** Necesita fecha de nacimiento (y carta). */
  needsChart: boolean;
  /** Qué tiene que hacer la IA en este tipo de lectura. */
  instructions: string;
  /** Texto del botón. */
  cta: string;
  group: KindGroup;
  /** Tiradas de tarot que admite (la primera es la de por defecto). */
  spreads?: SpreadId[];
}

/** Arte del personaje ZODI para cada sección (scripts/brand-assets.mjs). */
const ART = (slug: string) => `/art/${slug}-640.webp`;

export const KINDS: KindDef[] = [
  {
    kind: 'daily-horoscope',
    slug: 'horoscopo-diario',
    title: 'Tu horóscopo de hoy',
    kicker: 'Diario',
    blurb: 'Lo que te toca hoy, con tus tránsitos reales. No el de la revista del dentista.',
    art: ART('horoscopo-diario'),
    input: 'none',
    needsChart: true,
    cta: 'Leer mi día',
    group: 'horoscopos',
    instructions: `HORÓSCOPO DE HOY. Usa los tránsitos de hoy a su carta (el más exacto primero), la Luna del día y su biorritmo.
Estructura: una frase de entrada que resuma el día; luego **Amor**, **Trabajo y dinero**, **Energía** (una o dos frases cada uno, concretas, nada de vaguedades); cierra con **Hoy haz esto:** y una acción concreta.`,
  },
  {
    kind: 'weekly-horoscope',
    slug: 'horoscopo-semanal',
    title: 'Tu semana',
    kicker: 'Semanal',
    blurb: 'Qué días empujar y cuáles esconderte bajo la manta.',
    art: ART('prediccion'),
    input: 'none',
    needsChart: true,
    cta: 'Ver mi semana',
    group: 'horoscopos',
    instructions: `HORÓSCOPO DE LA SEMANA (los próximos 7 días desde hoy). Céntrate en los tránsitos lentos (Sol, Mercurio, Venus, Marte, Júpiter, Saturno) y en el cambio de fase lunar.
Estructura: el tema de la semana en una frase; **Mejor momento** y **Cuidado con** (días concretos de la semana si puedes deducirlos); **Amor**, **Trabajo**; cierra con un plan de acción para esta semana.`,
  },
  {
    kind: 'monthly-horoscope',
    slug: 'horoscopo-mensual',
    title: 'Tu mes',
    kicker: 'Mensual',
    blurb: 'El mapa del mes: dónde invertir energía y dónde no gastar ni un euro.',
    art: ART('destino'),
    input: 'none',
    needsChart: true,
    cta: 'Ver mi mes',
    group: 'horoscopos',
    instructions: `HORÓSCOPO DEL MES (los próximos 30 días). Usa los planetas lentos y los retrógrados actuales sobre su carta, y su año personal.
Estructura: el tema del mes; **Amor**, **Trabajo y dinero**, **Crecimiento personal**; una advertencia honesta; cierra con tres objetivos concretos para el mes.`,
  },
  {
    kind: 'natal-chart',
    slug: 'carta-natal',
    title: 'Tu carta, sin filtro',
    kicker: 'Carta natal',
    blurb: 'Quién eres según el cielo del día que naciste. Con traducción al cristiano.',
    art: ART('carta-astral'),
    input: 'none',
    needsChart: true,
    cta: 'Interpretar mi carta',
    group: 'tu-carta',
    instructions: `INTERPRETACIÓN DE SU CARTA NATAL. Es la lectura más personal: usa TODAS las posiciones que tienes.
Estructura: **Tu esencia** (Sol), **Tu mundo emocional** (Luna), **Cómo te ven** (Ascendente; si no hay hora, dilo y sáltalo), **Tu superpoder** y **Tu talón de Aquiles** (desde el elemento dominante, el flojo y los aspectos fuertes), **En el amor** (Venus y Marte). Traduce cada término a lenguaje de calle. Cierra con una acción para esta semana.`,
  },
  {
    kind: 'transits',
    slug: 'transitos',
    title: 'Tus tránsitos',
    kicker: 'Ahora mismo',
    blurb: 'Qué planeta te está tocando las narices y por qué.',
    art: ART('consejo'),
    input: 'none',
    needsChart: true,
    cta: 'Ver mis tránsitos',
    group: 'tu-carta',
    instructions: `TRÁNSITOS ACTUALES. Explica uno por uno los tránsitos de la lista (como mucho cinco, el más exacto primero): qué planeta, qué toca de su carta, cómo se nota en su vida y cuánto dura más o menos (la Luna horas, el Sol y los personales días o semanas, los lentos meses). Si no hay tránsitos cercanos, explica qué significa esa calma. Cierra con cómo aprovecharlos.`,
  },
  {
    kind: 'tarot',
    slug: 'tarot',
    title: 'Tarot ZODI',
    kicker: 'Tarot',
    blurb:
      'Una o tres cartas del mazo clásico y de los Arcanos ZODI. Tú barajas; ZODI no se calla.',
    art: ART('tarot'),
    input: 'question',
    needsChart: false,
    cta: 'Tirar las cartas',
    group: 'tarot',
    spreads: ['tres', 'una'],
    instructions: `TIRADA DE TAROT. Las cartas ya están tiradas: vienen en la consulta, con su posición y si salieron invertidas. NO cambies las cartas. Los Arcanos ZODI (numeral Z·…) son cartas propias de Zodi: usa el significado que viene con ellas.
Si es UNA carta: su nombre en negrita, qué dice sobre la pregunta y **La respuesta** directa (sí, no o depende, y de qué).
Si son TRES (pasado, presente, futuro): para cada carta su nombre en negrita, qué significa en esa posición (invertida = energía bloqueada o al revés) y cómo conecta con su pregunta y con su carta natal si la tienes. Después **La respuesta**: una conclusión directa a su pregunta.
Cierra con una acción para hoy.`,
  },
  {
    kind: 'compatibility',
    slug: 'compatibilidad',
    title: 'Compatibilidad',
    kicker: 'Match',
    blurb: 'Sinastría de verdad entre tu carta y la suya. Prepárate para la verdad.',
    art: ART('compatibilidad'),
    input: 'partner',
    needsChart: true,
    cta: 'Comparar cartas',
    group: 'misticos',
    instructions: `COMPATIBILIDAD (sinastría). Tienes su carta y la de la otra persona, con los aspectos entre ambas calculados. Úsalos: no hables solo de signos solares.
Estructura: **Puntuación** (del 0 al 100, justificada en una frase), **Química** (Venus y Marte), **Cómo se hablan** (Mercurio y Luna), **Dónde chocan** (las cuadraturas y oposiciones), **Lo que les une** (trígonos y conjunciones). Cierra con un consejo concreto para la relación.`,
  },
  {
    kind: 'dream',
    slug: 'suenos',
    title: 'Interpreta tu sueño',
    kicker: 'Sueños',
    blurb: 'Cuéntame lo que soñaste. Prometo no juzgar (mucho).',
    art: ART('rituales'),
    input: 'dream',
    needsChart: false,
    cta: 'Interpretar sueño',
    group: 'misticos',
    instructions: `INTERPRETACIÓN DE UN SUEÑO. Analiza los símbolos principales del sueño (máximo cuatro), qué emoción domina y qué tiene que ver con su momento actual (su Luna natal y la Luna de hoy si los tienes). Sin misticismo barato: psicología y símbolo. Cierra con una pregunta para que se haga hoy y una acción.`,
  },
  {
    kind: 'numerology',
    slug: 'numerologia',
    title: 'Numerología',
    kicker: 'Tus números',
    blurb: 'Tu camino de vida y tu año personal. Los números no mienten; tú a veces sí.',
    art: ART('numerologia'),
    input: 'none',
    needsChart: true,
    cta: 'Ver mis números',
    group: 'tu-carta',
    instructions: `NUMEROLOGÍA. Usa su camino de vida y su año personal (están en el contexto, ya calculados; no los recalcules).
Estructura: **Tu camino de vida** (qué significa ese número y cómo se le nota), **Tu año personal** (qué toca este ciclo), **Cómo encaja con tu carta** (cruza con su Sol y su elemento dominante). Cierra con una acción alineada con su año personal.`,
  },
  {
    kind: 'biorhythm',
    slug: 'biorritmo',
    title: 'Tu biorritmo',
    kicker: 'Energía',
    blurb: 'Cuerpo, emoción y cabeza: dónde estás hoy y cuándo remontas.',
    art: ART('energia'),
    input: 'none',
    needsChart: true,
    cta: 'Leer mi energía',
    group: 'tu-carta',
    instructions: `BIORRITMO. Interpreta sus tres ciclos de hoy (físico, emocional, intelectual) con los porcentajes del contexto y crúzalos con la Luna de hoy. Di para qué es buen día y para qué no. Cierra con una recomendación concreta de horario o actividad.`,
  },
  {
    kind: 'chinese-horoscope',
    slug: 'horoscopo-chino',
    title: 'Horóscopo chino',
    kicker: 'Oriente',
    blurb: 'Tu animal y tu elemento, calculados con el Año Nuevo Lunar real.',
    art: ART('chino'),
    input: 'none',
    needsChart: true,
    cta: 'Ver mi animal',
    group: 'horoscopos',
    instructions: `HORÓSCOPO CHINO. Usa su animal y su elemento del contexto (ya calculados con el Año Nuevo Lunar; si nació en enero o febrero puede no coincidir con el año natural: si es el caso, explícalo).
Estructura: **Tu animal**, **Tu elemento**, **Cómo te va este año** (con el animal del año en curso), **Con quién te llevas mejor y peor**. Cierra con una acción.`,
  },
  {
    kind: 'roast',
    slug: 'roast',
    title: 'Roast astral',
    kicker: 'Sin piedad',
    blurb: 'Tu carta, despellejada con cariño. Solo para valientes.',
    art: ART('frase-venenosa'),
    input: 'none',
    needsChart: true,
    cta: 'Destrózame',
    group: 'misticos',
    instructions: `ROAST ASTRAL. Búrlate con cariño de su carta: de su Sol, su Luna, su Ascendente (si lo hay) y sus aspectos más evidentes. Chistes concretos sobre comportamientos típicos de esas posiciones, nunca sobre su físico, su identidad ni nada sensible. Termina con un giro tierno: lo mejor de esa misma carta, y una acción.`,
  },
  {
    kind: 'celtic-tarot',
    slug: 'tirada-celta',
    title: 'Cruz celta',
    kicker: 'Tarot profundo',
    blurb: 'Diez cartas para las preguntas gordas. Cuando una carta no da ni para empezar.',
    art: ART('tarot-zodi'),
    input: 'question',
    needsChart: false,
    cta: 'Echar la cruz celta',
    group: 'tarot',
    spreads: ['celta'],
    instructions: `TIRADA DE CRUZ CELTA (diez cartas). Las cartas ya están tiradas, con su posición y si salieron invertidas: NO las cambies. Los Arcanos ZODI (numeral Z·…) son cartas propias de Zodi: usa el significado que viene con ellas.
Estructura: **El corazón del asunto** (cartas 1 y 2: la situación y lo que se cruza), **De dónde viene** (3 y 4), **Hacia dónde va** (5 y 6), **Tú y tu entorno** (7 y 8), **Lo que temes y lo que esperas** (9), **El desenlace** (10). Nombra cada carta en negrita y conéctala con su pregunta, sin repetir definiciones de diccionario. Cierra con **La respuesta** (directa) y una acción para esta semana.`,
  },
  {
    kind: 'runes',
    slug: 'runas',
    title: 'Runas vikingas',
    kicker: 'Señales nórdicas',
    blurb: 'Una o tres runas del Elder Futhark. Directas, como un dios antiguo un lunes.',
    art: ART('runas'),
    input: 'runes',
    needsChart: false,
    cta: 'Tirar las runas',
    group: 'tarot',
    instructions: `LECTURA DE RUNAS (Elder Futhark). Las runas ya están tiradas, con su posición y si salieron invertidas (merkstave): NO las cambies.
Para cada runa: su símbolo y nombre en negrita, qué significa en esa posición (invertida = la cara difícil de la runa o una advertencia) y qué le dice sobre su pregunta o su momento. Las runas son secas y directas: tú también. Cierra con **El mensaje de las runas** en una frase y una acción.`,
  },
  {
    kind: 'crystals',
    slug: 'cristales',
    title: 'Tu cristal',
    kicker: 'Ritual simple',
    blurb: 'Eliges una intención y ZODI te da cristal y ritual. Sin vaciar la tienda mística.',
    art: ART('zodi-energia'),
    input: 'crystal',
    needsChart: false,
    cta: 'Ver mi cristal',
    group: 'misticos',
    instructions: `LECTURA DE CRISTALES. El cristal ya está elegido (viene en la consulta con su intención): explícale por qué ese cristal encaja con su intención y con su signo, y dale un **Ritual de 5 minutos** con pasos numerados (cosas que tenga en casa; si no tiene el cristal, una alternativa). Añade **Cuándo hacerlo** (cruza con la Luna de hoy si la tienes) y **Lo que el cristal no hace** en una frase (no cura ni sustituye nada: es un ancla para su intención). Cierra con una acción.`,
  },
  {
    kind: 'name-reading',
    slug: 'nombre',
    title: 'Nombre y apellidos',
    kicker: 'Tu firma energética',
    blurb:
      'Lo que vibran tu nombre y tus apellidos, letra a letra. Con herencia familiar incluida.',
    art: ART('numerologia-zodi'),
    input: 'name',
    needsChart: false,
    cta: 'Leer mi nombre',
    group: 'tu-carta',
    instructions: `LECTURA DE NOMBRE Y APELLIDOS (numerología pitagórica). Los números ya están calculados en la consulta: NO los recalcules.
Estructura: **Tu nombre** (cómo te expresas), **Tus apellidos** (lo que heredas: el primero, la línea paterna o la que se transmite primero; el segundo, la otra herencia; si no hay, sáltalo), **Expresión**, **Alma** y **Personalidad** (qué dice cada número, en una o dos frases con ejemplos de su vida). Si está su camino de vida, crúzalo. Cierra con una acción.`,
  },
  {
    kind: 'palm-reading',
    slug: 'mano',
    title: 'Lectura de mano',
    kicker: 'Quiromancia',
    blurb:
      'Mírate la palma, dime cómo son tus líneas y te cuento qué dicen. Sin dramas de cuánto vas a vivir.',
    art: ART('mano'),
    input: 'palm',
    needsChart: false,
    cta: 'Leer mi mano',
    group: 'misticos',
    instructions: `LECTURA DE MANO (quiromancia simbólica). Tienes la forma de su mano (con su elemento) y cómo ha visto cada línea. NUNCA hables de cuánto va a vivir, de salud ni de muertes: la línea de la vida habla de energía y de cómo vive los cambios.
Estructura: **Tu mano es de…** (su elemento y qué dice de su forma de ser), **Línea de la vida**, **Línea del corazón**, **Línea de la cabeza**, **Línea del destino** (si no la ve, explica que es libertad para trazar su camino). Cruza con su signo si lo tienes. Cierra con una acción.`,
  },
  {
    kind: 'mayan-horoscope',
    slug: 'horoscopo-maya',
    title: 'Horóscopo maya',
    kicker: 'Sello y tono',
    blurb: 'Tu kin del Sincronario maya: sello, tono y misión. Ancestral, pero con wifi.',
    art: ART('zodi-trono'),
    input: 'none',
    needsChart: true,
    cta: 'Ver mi sello maya',
    group: 'horoscopos',
    instructions: `HORÓSCOPO MAYA (Sincronario de las 13 Lunas). Su kin, su sello y su tono ya están calculados en la consulta: NO los recalcules.
Estructura: **Tu kin** (nombre completo y qué significa en una frase), **Tu sello** (la energía que aportas: con ejemplos de su vida), **Tu tono** (cómo la usas), **Tu misión** (sello y tono juntos), **Tu sombra** (la cara difícil). Si tienes su carta, crúzalo con su Sol. Cierra con una acción.`,
  },
];

export const GROUPS: { id: KindGroup; title: string; blurb: string }[] = [
  {
    id: 'horoscopos',
    title: 'Horóscopos',
    blurb: 'Tu día, tu semana, tu mes y los calendarios de otras culturas.',
  },
  { id: 'tarot', title: 'Tarot y runas', blurb: 'Preguntas concretas, cartas sobre la mesa.' },
  {
    id: 'tu-carta',
    title: 'Tu carta y tus números',
    blurb: 'Lo que dice de ti el día que naciste y tu nombre.',
  },
  {
    id: 'misticos',
    title: 'Amor, sueños y rituales',
    blurb: 'Química, inconsciente, manos y cristales.',
  },
];

export const KIND_BY_SLUG = new Map(KINDS.map((k) => [k.slug, k]));
export const KIND_BY_KIND = new Map(KINDS.map((k) => [k.kind, k]));

export { FOCUS, LENGTHS, type ReadingFocus, type ReadingLength } from './options';

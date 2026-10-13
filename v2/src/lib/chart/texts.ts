/**
 * Textos de interpretación de la carta natal con la voz de ZODI: directos,
 * con humor y sin género (segunda persona). Uno por signo para cada punto
 * personal, más números, animal chino, elementos y modalidades.
 */
import type { Sign } from '@/lib/astro-engine/types';

type BySign = Record<Sign, string>;

/** Sol: quién eres cuando eres tú. */
export const SUN: BySign = {
  Aries:
    'Naciste con el botón de arrancar pulsado. Te mueve empezar cosas, ganar y ser la primera persona en llegar. Tu luz es el valor; tu sombra, la paciencia que no tienes.',
  Tauro:
    'Tu fuerza es la calma: construyes despacio y lo que construyes dura. Te importan el placer, la seguridad y que nadie te meta prisa. Tu reto es soltar cuando algo ya no da más.',
  Géminis:
    'Tu cabeza va a mil y te aburre lo repetido. Conectas ideas, personas y conversaciones como nadie. Tu luz es la curiosidad; tu sombra, dejar cosas a medias por la siguiente novedad.',
  Cáncer:
    'Sientes antes de pensar y cuidas antes de que nadie lo pida. Tu casa, tu gente y tu memoria lo son todo. Tu reto es no esconderte en la coraza cuando algo duele.',
  Leo: 'Viniste a brillar y a que se note. Generosidad, carisma y un corazón enorme. Tu luz es inspirar; tu sombra, necesitar aplausos para creerte lo que vales.',
  Virgo:
    'Ves el detalle que a todo el mundo se le escapa y sabes cómo arreglarlo. Ayudar te da sentido. Tu reto es dejar de exigirte la perfección a ti antes que a nadie.',
  Libra:
    'Buscas el equilibrio, la belleza y que todo sea justo. Se te da de lujo unir a la gente. Tu reto: decidir sin pedir tres opiniones y sin miedo a que alguien se enfade.',
  Escorpio:
    'Vas al fondo de todo: personas, secretos, emociones. Intensidad pura y una lealtad que no se negocia. Tu luz es transformarte; tu sombra, controlar lo que te da miedo perder.',
  Sagitario:
    'Necesitas horizonte: viajar, aprender, reír y cambiar de idea si encuentras una mejor. Optimismo contagioso. Tu reto es aterrizar las promesas que haces con tanta alegría.',
  Capricornio:
    'Te tomas la vida en serio y llegas donde te propones, aunque tardes. Ambición, constancia y humor seco. Tu reto es permitirte disfrutar antes de llegar a la cima.',
  Acuario:
    'Piensas distinto y te encanta. Libertad, amistades y causas que mejoren el mundo. Tu luz es la originalidad; tu sombra, alejarte de las emociones cuando se ponen intensas.',
  Piscis:
    'Sientes el mundo entero y lo conviertes en arte, empatía o magia. Intuición enorme. Tu reto es poner límites para que tu sensibilidad no te deje sin energía.',
};

/** Luna: lo que necesitas para sentirte bien. */
export const MOON: BySign = {
  Aries:
    'Emocionalmente vas a mil: te enfadas rápido y se te pasa rápido. Necesitas acción y espacio propio; encerrarte en un drama largo te ahoga.',
  Tauro:
    'Necesitas calma, rutina y placeres simples: buena comida, abrazos, tu manta. Cuando todo tiembla, tú eres la roca (y te cuesta muchísimo cambiar).',
  Géminis:
    'Procesas lo que sientes hablándolo. Necesitas conversación, estímulos y cambiar de aires. Si te callas lo que sientes, te pones de los nervios.',
  Cáncer:
    'Tu Luna está en casa: sientes todo, recuerdas todo y cuidas a todo el mundo. Necesitas un refugio seguro y gente que te cuide de vuelta.',
  Leo: 'Necesitas sentirte especial y que te lo digan. Das muchísimo cariño y esperas reconocimiento a cambio; si no llega, te apagas aunque no lo digas.',
  Virgo:
    'Te calma tener las cosas en orden. Expresas el cariño haciendo cosas por los demás. Ojo con preocuparte por todo antes de que pase.',
  Libra:
    'Necesitas armonía y compañía. Los conflictos te sientan fatal, así que a veces callas lo que sientes para no romper la paz. Mala idea a largo plazo.',
  Escorpio:
    'Sientes con una intensidad que asusta (también a ti). Necesitas confianza total y verdad; las medias tintas emocionales no van contigo.',
  Sagitario:
    'Necesitas libertad, optimismo y planes. Cuando algo duele, tu primera reacción es irte de viaje (físico o mental). Te recuperas rápido.',
  Capricornio:
    'Llevas las emociones por dentro y con control. Te sientes bien cuando eres útil y tienes las cosas bajo control; te cuesta pedir ayuda.',
  Acuario:
    'Necesitas espacio y amistades que respeten tu libertad. Analizas lo que sientes antes de sentirlo; a veces parece frialdad y solo es tu manera.',
  Piscis:
    'Absorbes las emociones de quien tienes al lado como una esponja. Necesitas momentos a solas, música y fantasía para recargar.',
};

/** Ascendente: tu primera impresión. */
export const ASC: BySign = {
  Aries:
    'Entras pisando fuerte: directo, con energía y algo de prisa. La gente te ve con iniciativa (y alguna vez con poca paciencia).',
  Tauro:
    'Transmites calma y fiabilidad. Tu presencia tranquila, tu estilo cuidado y tu voz pausada dan confianza a la primera.',
  Géminis:
    'Se te ve con chispa, curiosidad y conversación fácil. Aparentas menos edad y más nervio del que tienes por dentro.',
  Cáncer:
    'Inspiras cercanía y ternura, aunque al principio te guardas. La gente siente que puede contarte cosas.',
  Leo: 'No pasas desapercibido: presencia, estilo y un brillo que llena la habitación. Te ven con seguridad aunque por dentro dudes.',
  Virgo:
    'Das una imagen ordenada, discreta y competente. Te ven con criterio; algunos piensan que juzgas más de lo que realmente juzgas.',
  Libra:
    'Encanto, buenos modales y una estética cuidada. Caes bien a casi todo el mundo y sabes suavizar cualquier tensión.',
  Escorpio:
    'Mirada intensa y aire misterioso. Te ven con fuerza y reserva: la gente nota que hay mucho más debajo de la superficie.',
  Sagitario:
    'Optimismo, risa fácil y ganas de aventura. Te ven con frescura y franqueza (a veces demasiada).',
  Capricornio:
    'Seriedad, madurez y un punto elegante. Te ven con autoridad desde joven; con los años, te sueltas y rejuveneces.',
  Acuario:
    'Original, diferente y algo distante al principio. Te ven con ideas propias y un estilo que no copia a nadie.',
  Piscis:
    'Dulzura, imaginación y un aire soñador. Te ven con sensibilidad; mucha gente se abre contigo sin saber por qué.',
};

/** Mercurio: cómo piensas y te comunicas. */
export const MERCURY: BySign = {
  Aries:
    'Piensas rápido y hablas sin filtro. Decides en segundos; tu reto es escuchar hasta el final.',
  Tauro: 'Piensas despacio pero seguro. Cuando te decides, no hay quien te mueva de la idea.',
  Géminis: 'Mente brillante, rápida y curiosa: hablas, escribes y conectas ideas sin esfuerzo.',
  Cáncer:
    'Piensas con el corazón y tienes una memoria prodigiosa (sobre todo para lo que te dolió).',
  Leo: 'Hablas con convicción y te encanta contar historias. Sabes convencer y entretener.',
  Virgo: 'Mente analítica y precisa: ves el error en la letra pequeña antes que nadie.',
  Libra:
    'Piensas buscando el equilibrio y comunicas con diplomacia. Decidir te cuesta porque ves todos los lados.',
  Escorpio:
    'Mente de detective: investigas, intuyes lo que no se dice y no te conformas con respuestas fáciles.',
  Sagitario:
    'Piensas en grande y hablas con franqueza. Te apasiona aprender; el detalle, no tanto.',
  Capricornio: 'Mente práctica y estratégica: piensas a largo plazo y hablas poco pero claro.',
  Acuario: 'Ideas originales, adelantadas y a veces raras para los demás. Te encanta debatir.',
  Piscis: 'Piensas en imágenes y emociones. Intuición enorme; la lógica fría no es lo tuyo.',
};

/** Venus: cómo amas y qué te gusta. */
export const VENUS: BySign = {
  Aries: 'En el amor vas a por todas: te gusta conquistar, la pasión y la emoción del principio.',
  Tauro:
    'Amas con los cinco sentidos: lealtad, cariño físico y planes tranquilos. Tu amor es para quedarse.',
  Géminis:
    'Te enamoras de una mente: necesitas risas, conversación y alguien que no te aburra nunca.',
  Cáncer:
    'Amas cuidando y protegiendo. Buscas un hogar emocional y alguien que también cuide de ti.',
  Leo: 'Amas a lo grande y necesitas sentir admiración. Romántico, generoso y algo teatral.',
  Virgo: 'Demuestras el amor con hechos y detalles. Te enamora la gente que cumple lo que dice.',
  Libra:
    'Necesitas pareja, belleza y armonía. Gran romántico, gran diplomático; ojo con callar para no discutir.',
  Escorpio: 'Amas con intensidad total y lealtad absoluta. Para ti el amor es todo o nada.',
  Sagitario:
    'Necesitas libertad y aventura en pareja. Te enamora quien te hace reír y te abre el mundo.',
  Capricornio:
    'Amas con compromiso y a largo plazo. Tardas en abrirte, pero cuando lo haces es en serio.',
  Acuario:
    'Necesitas amistad dentro del amor y mucho espacio. Te atrae lo diferente y lo inteligente.',
  Piscis:
    'Amas de forma romántica, entregada y casi mágica. Ojo con idealizar a quien no lo merece.',
};

/** Marte: cómo actúas y cómo te enfadas. */
export const MARS: BySign = {
  Aries:
    'Energía a tope: actúas ya y te enfadas rápido. Si lo canalizas en deporte o proyectos, eres imparable.',
  Tauro:
    'Lento para arrancar e imposible de parar. Te enfadas poco, pero cuando pasa, tiembla el suelo.',
  Géminis: 'Tu energía es mental: haces mil cosas a la vez y peleas con palabras.',
  Cáncer: 'Actúas para proteger a los tuyos. Te enfadas por dentro y lo sacas de forma indirecta.',
  Leo: 'Energía de protagonista: te mueve el orgullo y la pasión. Te enfadas si te ignoran.',
  Virgo: 'Energía práctica y trabajadora: actúas con método. Te enfada la chapuza.',
  Libra: 'Prefieres negociar a pelear. Actúas mejor en equipo y te cuesta decir que no.',
  Escorpio: 'Energía intensa y estratégica: cuando quieres algo, nada te frena. No olvidas fácil.',
  Sagitario:
    'Energía aventurera: te mueve la libertad y las causas en las que crees. Explotas y se te pasa.',
  Capricornio:
    'Energía de corredor de fondo: disciplina, ambición y resultados. Te enfadas en frío.',
  Acuario: 'Actúas a tu manera y por tus ideales. Te enfada que te digan lo que tienes que hacer.',
  Piscis:
    'Energía que va y viene con tus emociones. Actúas por intuición y evitas el conflicto directo.',
};

/** Saturno: la lección que te toca aprender. */
export const SATURN_LESSON: BySign = {
  Aries: 'a tener paciencia y a liderar sin atropellar',
  Tauro: 'a soltar el miedo a perder lo que tienes',
  Géminis: 'a profundizar y terminar lo que empiezas',
  Cáncer: 'a cuidar sin dejar de cuidarte',
  Leo: 'a brillar sin necesitar aplausos',
  Virgo: 'a hacerlo bien sin hacerlo perfecto',
  Libra: 'a decidir y poner límites en tus relaciones',
  Escorpio: 'a confiar y soltar el control',
  Sagitario: 'a comprometerte y aterrizar tus ideas',
  Capricornio: 'a disfrutar del camino, no solo de la meta',
  Acuario: 'a mostrar lo que sientes sin miedo',
  Piscis: 'a poner límites y bajar de las nubes',
};

/** Elemento dominante y elemento flojo. */
export const ELEMENT_STRONG = {
  Fuego:
    'Mucho fuego: acción, entusiasmo y ganas de comerte el mundo. Inspiras a los demás; ojo con quemarte por ir siempre a tope.',
  Tierra:
    'Mucha tierra: lo tuyo es lo práctico, lo concreto y lo que se puede tocar. Haces que las cosas pasen; ojo con la rigidez.',
  Aire: 'Mucho aire: vives en el mundo de las ideas, las palabras y la gente. Conectas como nadie; ojo con pensar tanto que no sientas.',
  Agua: 'Mucha agua: emociones profundas, intuición y empatía. Lees a la gente al vuelo; ojo con cargar con lo que no es tuyo.',
} as const;

export const ELEMENT_WEAK = {
  Fuego:
    'Te falta fuego: a veces te cuesta arrancar o creer en ti. Busca gente y planes que te enciendan.',
  Tierra:
    'Te falta tierra: lo práctico (rutinas, dinero, cuerpo) puede costarte. Una lista y una agenda son tus mejores amuletos.',
  Aire: 'Te falta aire: te cuesta tomar distancia y explicar lo que sientes. Escribir o hablarlo te ordena.',
  Agua: 'Te falta agua: las emociones te pillan por sorpresa. Darte permiso para sentir es tu superpoder pendiente.',
} as const;

export const MODALITY = {
  Cardinal:
    'Eres de empezar cosas: iniciativa, liderazgo y ganas de abrir caminos. Lo difícil para ti es mantener.',
  Fijo: 'Eres de sostener: constancia, lealtad y aguante. Lo difícil para ti es cambiar de rumbo cuando toca.',
  Mutable:
    'Eres de adaptarte: flexibilidad, curiosidad y cintura para todo. Lo difícil para ti es comprometerte con una sola cosa.',
} as const;

/** Camino de vida (numerología). */
export const LIFE_PATH: Record<number, string> = {
  1: 'Camino 1: liderar y abrir caminos propios. Viniste a ser independiente, aunque te toque aprender a pedir ayuda.',
  2: 'Camino 2: unir, cuidar y crear armonía. Tu don es la sensibilidad; tu reto, no desaparecer por complacer.',
  3: 'Camino 3: expresar, crear y comunicar. Tu don es la alegría; tu reto, la constancia.',
  4: 'Camino 4: construir con esfuerzo y orden. Tu don es la fiabilidad; tu reto, la flexibilidad.',
  5: 'Camino 5: libertad, cambio y aventura. Tu don es adaptarte a todo; tu reto, no huir cuando algo se pone serio.',
  6: 'Camino 6: amor, familia y responsabilidad. Tu don es cuidar; tu reto, no cargar con todo.',
  7: 'Camino 7: buscar la verdad y entender. Tu don es la profundidad; tu reto, confiar en los demás.',
  8: 'Camino 8: poder, logros y abundancia. Tu don es materializar; tu reto, equilibrar éxito y corazón.',
  9: 'Camino 9: servir y cerrar ciclos. Tu don es la compasión; tu reto, soltar el pasado.',
  11: 'Camino 11 (maestro): intuición e inspiración. Viniste a iluminar a otros; tu reto es manejar tu sensibilidad.',
  22: 'Camino 22 (maestro): construir algo grande para muchos. Tu reto es no paralizarte por la presión.',
  33: 'Camino 33 (maestro): amor y enseñanza. Tu reto es cuidar sin sacrificarte del todo.',
};

/** Año personal: qué ciclo estás viviendo. */
export const PERSONAL_YEAR: Record<number, string> = {
  1: 'Año 1: empieza un ciclo de nueve años. Siembra, arranca, atrévete.',
  2: 'Año 2: paciencia y relaciones. Lo que sembraste crece despacio; alíate.',
  3: 'Año 3: expresión y vida social. Muéstrate, crea y diviértete.',
  4: 'Año 4: trabajo y bases sólidas. Ordena, organiza y construye.',
  5: 'Año 5: cambios y libertad. Muévete, viaja, prueba cosas nuevas.',
  6: 'Año 6: hogar, familia y compromisos. Cuida y deja que te cuiden.',
  7: 'Año 7: introspección y aprendizaje. Menos ruido, más profundidad.',
  8: 'Año 8: logros y dinero. Cosechas lo que has trabajado; pide lo que vales.',
  9: 'Año 9: cierre de ciclo. Suelta, limpia y despídete de lo que ya no va.',
  11: 'Año 11: intuición a tope e inspiración. Escucha las señales.',
  22: 'Año 22: año para construir algo grande. Piensa a lo grande y con método.',
};

/** Animal del horóscopo chino. */
export const CHINESE: Record<string, string> = {
  Rata: 'Rata: lista, rápida y con un olfato increíble para las oportunidades.',
  Buey: 'Buey: trabajo, paciencia y una fiabilidad a prueba de bombas.',
  Tigre: 'Tigre: valentía, pasión y espíritu rebelde.',
  Conejo: 'Conejo: elegancia, diplomacia y un gusto exquisito.',
  Dragón: 'Dragón: carisma, ambición y energía que no pasa desapercibida.',
  Serpiente: 'Serpiente: intuición, misterio y una inteligencia estratégica.',
  Caballo: 'Caballo: libertad, energía y ganas de aventura.',
  Cabra: 'Cabra: sensibilidad, creatividad y un corazón enorme.',
  Mono: 'Mono: ingenio, humor y capacidad para salir de cualquier lío.',
  Gallo: 'Gallo: precisión, orgullo y honestidad sin filtros.',
  Perro: 'Perro: lealtad, justicia y protección a los suyos.',
  Cerdo: 'Cerdo: generosidad, disfrute y buen fondo.',
};

/** Qué vibra cada número, para los números del nombre y del día de nacimiento. */
export const NUMBER_ESSENCE: Record<number, string> = {
  1: 'independencia, iniciativa y liderazgo',
  2: 'sensibilidad, diplomacia y trabajo en equipo',
  3: 'creatividad, comunicación y alegría',
  4: 'orden, esfuerzo y estabilidad',
  5: 'libertad, cambio y aventura',
  6: 'cuidado, responsabilidad y amor por los tuyos',
  7: 'profundidad, análisis y búsqueda de la verdad',
  8: 'ambición, poder y talento para los negocios',
  9: 'compasión, generosidad y visión amplia',
  11: 'intuición, inspiración y sensibilidad especial (número maestro)',
  22: 'visión práctica a lo grande, el constructor (número maestro)',
  33: 'amor que enseña y sana (número maestro)',
};

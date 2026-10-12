/**
 * La parte informativa de cada lectura: qué es, qué temas toca y un glosario
 * para entender lo que dice ZODI. Textos de la Zodi de antes, revisados.
 */
export interface Concept {
  term: string;
  def: string;
}

export interface Guide {
  /** "¿Qué es esto?" en un párrafo. */
  explainer: string;
  /** Lo que cubre la lectura. */
  topics: string[];
  concepts: Concept[];
}

export const GUIDES: Record<string, Guide> = {
  'horoscopo-diario': {
    explainer:
      'Piénsalo como el pronóstico del tiempo, pero para tu energía. No te dice qué va a pasar exactamente (eso sería mala suerte confirmada): te dice con qué clima astral juegas hoy para que elijas mejor cuándo actuar, cuándo esperar y cuándo directamente no contestar ese mensaje. El tuyo sale de los planetas de hoy sobre tu carta real, no de tu signo a secas.',
    topics: ['Amor', 'Trabajo', 'Dinero', 'Energía', 'Señal del día'],
    concepts: [
      {
        term: 'Signo solar',
        def: 'Tu signo del zodiaco, el de las revistas. Depende del día en que naciste y habla de tu identidad central: cómo brillas y cómo funciona tu ego en modo normal.',
      },
      {
        term: 'Luna del día',
        def: 'La Luna cambia de signo cada dos días y medio y marca el humor colectivo. Luna en Escorpio: todo se vuelve intenso. Luna en Géminis: nadie para de hablar.',
      },
      {
        term: 'Tránsito',
        def: 'Un planeta de hoy formando un ángulo con un planeta de tu carta natal. Es lo que hace que tu día no sea igual que el de todos los de tu signo.',
      },
      {
        term: 'Mercurio retrógrado',
        def: 'Cuando Mercurio parece ir hacia atrás. Afecta a la comunicación, la tecnología y los contratos. No canceles tu vida, pero guarda copia de todo.',
      },
    ],
  },
  'horoscopo-semanal': {
    explainer:
      'Una vista de siete días: en qué áreas tienes viento a favor, dónde habrá turbulencias y qué conviene resolver antes del viernes. Útil si planificas. Útil también si no y buscas una excusa para empezar.',
    topics: ['La semana', 'Mejor día', 'Cuidado con', 'Amor', 'Trabajo', 'Misión'],
    concepts: [
      {
        term: 'Planetas rápidos',
        def: 'Luna, Mercurio, Venus y Marte cambian de signo en días o semanas: son los que dan el ritmo de una semana.',
      },
      {
        term: 'Fase lunar',
        def: 'Creciente para empujar, llena para cosechar (y llorar un poco), menguante para soltar, nueva para empezar.',
      },
    ],
  },
  'horoscopo-mensual': {
    explainer:
      'El ciclo del mes completo. Los astros marcan ritmos, no eventos fijos: saber que este mes hay energía de cierre te ayuda a no abrir diez proyectos a la vez; saber que hay apertura te anima a dar ese paso que llevas posponiendo.',
    topics: ['El mes', 'Ciclo', 'Alerta', 'Objetivos', 'Cierre'],
    concepts: [
      {
        term: 'Luna nueva',
        def: 'El comienzo del ciclo lunar. Energía de intención: el mejor momento del mes para decidir qué quieres construir.',
      },
      {
        term: 'Luna llena',
        def: 'El pico del ciclo. Todo se intensifica y lo tapado sale a la luz. No es el mejor día para decisiones impulsivas.',
      },
      {
        term: 'Año personal',
        def: 'El ciclo numerológico en el que estás (del 1 al 9). Tiñe todos los meses del año.',
      },
    ],
  },
  'carta-natal': {
    explainer:
      'Tu carta natal es el mapa del cielo en el momento exacto en que naciste. Cada planeta estaba en un signo y en una casa, y eso deja huella. No te condena a nada, pero explica por qué reaccionas como reaccionas, por qué te enamoras de cierto tipo de persona y por qué repites algunos patrones sin querer.',
    topics: ['Sol', 'Luna', 'Ascendente', 'Casas', 'Patrones'],
    concepts: [
      {
        term: 'Sol',
        def: 'Tu identidad central y tu ego consciente. Cómo necesitas brillar para sentirte vivo o viva.',
      },
      {
        term: 'Luna',
        def: 'Tu mundo emocional: qué necesitas para sentirte a salvo y cómo reaccionas antes de pensar. La parte de ti que solo ven los cercanos.',
      },
      {
        term: 'Ascendente',
        def: 'El signo que salía por el horizonte al nacer. Tu primera impresión, la máscara pública. Necesita la hora de nacimiento.',
      },
      {
        term: 'Casas',
        def: 'Doce áreas de la vida: identidad, dinero, comunicación, hogar, creatividad, rutina, pareja, crisis, viajes, carrera, amistades y mundo interior.',
      },
      {
        term: 'Aspectos',
        def: 'Ángulos entre planetas. Conjunción (fusión), trígono y sextil (fluyen), cuadratura y oposición (tensión que te hace crecer).',
      },
    ],
  },
  transitos: {
    explainer:
      'Los tránsitos son los planetas moviéndose hoy y tocando tu carta natal. Júpiter pasando por tu zona profesional: oportunidades. Saturno cuadrando tu Sol: exigencia y aprendizaje forzado. No son excusas para no actuar: son contexto para entender por qué las cosas tienen la textura que tienen.',
    topics: ['Venus', 'Marte', 'Luna', 'Alerta', 'Timing'],
    concepts: [
      {
        term: 'Júpiter en tránsito',
        def: 'Expansión y suerte. Donde transita, crecen las cosas y se abren puertas. Pasa cerca de un año en cada signo.',
      },
      {
        term: 'Saturno en tránsito',
        def: 'Lección y estructura. Donde transita hay exigencia y consecuencias de lo que construiste (o no). No es mala suerte: es madurar a la fuerza.',
      },
      {
        term: 'Orbe',
        def: 'Cuántos grados le faltan al aspecto para ser exacto. Cuanto más pequeño, más se nota.',
      },
    ],
  },
  tarot: {
    explainer:
      'El tarot son 78 cartas con arquetipos que llevan siglos ayudando a la gente a pensar en voz alta. ZODI añade los Arcanos ZODI, cartas propias como La Red Flag o El Ex que Vuelve. No predicen el futuro con exactitud: son un espejo que te enseña lo que ya sabes y no querías ver. Las cartas no deciden por ti; iluminan el panorama.',
    topics: ['Una carta', 'Tres cartas', 'Decisión', 'Bloqueo', 'Consejo'],
    concepts: [
      {
        term: 'Arcanos mayores',
        def: '22 cartas con temas grandes. La Torre: cambio radical. El Loco: nuevo comienzo. La Muerte: transformación (no literal). El Mundo: ciclo completado.',
      },
      {
        term: 'Arcanos ZODI',
        def: 'Nueve cartas de la casa: La Verdad, El Ego, El Ex que Vuelve, El Karma, La Red Flag, La Mala Idea, La Ilusión, La Venganza Cósmica y El Destino.',
      },
      {
        term: 'Tirada',
        def: 'Cómo se colocan las cartas. Cada posición tiene un significado fijo: pasado, presente y futuro en la de tres.',
      },
      {
        term: 'Invertida',
        def: 'Cuando la carta sale del revés: su energía está bloqueada, hacia dentro o en proceso de cambio.',
      },
    ],
  },
  'tirada-celta': {
    explainer:
      'La cruz celta usa diez cartas en posiciones fijas. Es la lectura más completa del tarot clásico: la situación, lo que la cruza, la raíz, el pasado reciente, lo que buscas, lo que viene, tú, tu entorno, tus miedos y esperanzas, y el desenlace posible. Para preguntas que necesitan más de una carta para tener sentido.',
    topics: ['Situación', 'Obstáculo', 'Pasado', 'Futuro', 'Desenlace'],
    concepts: [
      {
        term: 'La cruz',
        def: 'Las dos primeras cartas: el corazón del asunto y lo que lo complica. Se leen juntas.',
      },
      {
        term: 'El báculo',
        def: 'Las cuatro últimas (de la 7 a la 10): tú, tu entorno, lo que temes o esperas y hacia dónde va todo.',
      },
      {
        term: 'Desenlace',
        def: 'No es una sentencia: es hacia dónde va la cosa si nada cambia. Si no te gusta, cambia algo.',
      },
    ],
  },
  compatibilidad: {
    explainer:
      'Sinastría: comparar dos cartas natales para ver dónde hay química natural, dónde habrá roces y qué necesita trabajo consciente. No te dice si sois almas gemelas (ese concepto existe sobre todo para justificar relaciones que debieron acabar antes). Te dice cómo funcionáis juntos.',
    topics: ['Pareja', 'Amistad', 'Química', 'Comunicación', 'Señales rojas'],
    concepts: [
      {
        term: 'Elementos',
        def: 'Fuego (Aries, Leo, Sagitario), Tierra (Tauro, Virgo, Capricornio), Aire (Géminis, Libra, Acuario) y Agua (Cáncer, Escorpio, Piscis). Los del mismo elemento se entienden fácil.',
      },
      {
        term: 'Venus y Marte',
        def: 'Venus es cómo amas y qué te atrae; Marte, cómo deseas y cómo peleas. Sus contactos entre cartas son la química.',
      },
      {
        term: 'Cuadratura',
        def: 'Dos planetas a 90°. Alta tensión y mucho potencial de crecimiento, o mucho drama si no hay madurez.',
      },
      {
        term: 'Trígono',
        def: 'Dos planetas a 120°, del mismo elemento. Fluye sin esfuerzo. A veces tan cómodo que no hay crecimiento.',
      },
    ],
  },
  suenos: {
    explainer:
      'Los sueños son el lenguaje del inconsciente: exagerado, simbólico y nada literal. Soñar que se te caen los dientes no significa que te vaya a pasar algo malo: tu mente está procesando una pérdida, un cambio o una inseguridad. El inconsciente habla raro; ZODI traduce.',
    topics: ['Símbolos', 'Emoción', 'Mensaje', 'Sombra', 'Acción'],
    concepts: [
      {
        term: 'Sueño recurrente',
        def: 'Un sueño que se repite. Tu mente insiste en algo que sigues ignorando: casi siempre un conflicto sin resolver.',
      },
      {
        term: 'Arquetipo',
        def: 'Figuras con significado universal: la sombra (lo que niegas de ti), el héroe (tu potencial), la madre (el cuidado), el sabio.',
      },
      {
        term: 'Sueño lúcido',
        def: 'Cuando sabes que estás soñando y puedes actuar. No tiene misterio especial, pero se puede entrenar.',
      },
    ],
  },
  numerologia: {
    explainer:
      'La numerología estudia la vibración de los números de tu fecha de nacimiento. Cada número del 1 al 9 (y los maestros 11, 22 y 33) tiene un arquetipo: el 1 inicia y lidera, el 4 construye, el 7 investiga, el 9 cierra y sirve. Tu camino de vida es el más importante; tu año personal dice qué ciclo estás viviendo.',
    topics: ['Camino de vida', 'Año personal', 'Patrón', 'Fechas clave'],
    concepts: [
      {
        term: 'Camino de vida',
        def: 'Se suma toda la fecha de nacimiento hasta un solo dígito (15/03/1990 → 1+5+0+3+1+9+9+0 = 28 → 10 → 1). Define tu misión y los temas que se repiten.',
      },
      {
        term: 'Año personal',
        def: 'Día y mes de nacimiento más el año en curso. El 1 es inicio, el 5 cambio y libertad, el 9 cierre.',
      },
      {
        term: 'Número maestro',
        def: 'El 11, el 22 y el 33 no se reducen. Más potencial y más responsabilidad, también más tensión.',
      },
    ],
  },
  nombre: {
    explainer:
      'En numerología cada letra vale un número. Tu nombre completo suma una frecuencia que define tu identidad pública. El nombre de pila habla de cómo te expresas; los apellidos, de lo que heredas. Juntos forman tu firma energética.',
    topics: ['Nombre', 'Primer apellido', 'Segundo apellido', 'Vibración total'],
    concepts: [
      {
        term: 'Número de expresión',
        def: 'Todas las letras del nombre completo. Tus talentos naturales y cómo te percibe el entorno.',
      },
      {
        term: 'Número del alma',
        def: 'Solo las vocales. Tus motivaciones íntimas: lo que de verdad quieres aunque no lo digas en voz alta.',
      },
      {
        term: 'Número de personalidad',
        def: 'Solo las consonantes. Cómo te ven antes de conocerte.',
      },
      {
        term: 'Tabla pitagórica',
        def: 'A, J y S valen 1; B, K y T valen 2; y así hasta I y R, que valen 9. Las tildes y la ñ cuentan como su letra base.',
      },
    ],
  },
  mano: {
    explainer:
      'Las líneas de la mano son simbólicas, no deterministas: no dicen cuándo vas a morir ni si te va a tocar la lotería. Reflejan tendencias de energía y carácter. Te guiamos para que te mires la palma y ZODI la interpreta junto con tu perfil.',
    topics: [
      'Línea de la vida',
      'Línea del corazón',
      'Línea de la cabeza',
      'Línea del destino',
      'Forma de la mano',
    ],
    concepts: [
      {
        term: 'Línea de la vida',
        def: 'No indica cuánto vivirás: habla de tu energía vital y de cómo afrontas los cambios grandes.',
      },
      {
        term: 'Línea del corazón',
        def: 'Cómo amas. Recta: amor más mental y controlado. Curva: más expresivo y emocional.',
      },
      {
        term: 'Línea de la cabeza',
        def: 'Tu forma de pensar. Horizontal: práctica y analítica. Inclinada: intuitiva e imaginativa.',
      },
      {
        term: 'Línea del destino',
        def: 'Propósito y carrera. Si no la ves no pasa nada: suele indicar libertad para trazar tu camino.',
      },
      {
        term: 'Mano de tierra, aire, fuego o agua',
        def: 'La forma de la palma y la largura de los dedos: práctica, mental, impulsiva o sensible.',
      },
    ],
  },
  biorritmo: {
    explainer:
      'El biorritmo estudia tres ciclos que empiezan cuando naces y nunca paran: el físico (23 días) rige tu energía corporal, el emocional (28 días) tu sensibilidad y el intelectual (33 días) tu claridad mental. Saber en qué punto estás ayuda a planificar mejor. A veces no es bloqueo espiritual: es cansancio con luces de neón.',
    topics: ['Físico', 'Emocional', 'Intelectual', 'Descanso', 'Ritmo'],
    concepts: [
      {
        term: 'Fase alta',
        def: 'La mitad positiva del ciclo: más energía y rendimiento. Buen momento para empujar.',
      },
      {
        term: 'Fase baja',
        def: 'La mitad negativa: menos energía. No estás mal; simplemente no es día de sobreexigirte.',
      },
      {
        term: 'Día crítico',
        def: 'Cuando un ciclo cruza el cero. Días de transición: más despistes. Ve con cuidado.',
      },
    ],
  },
  'horoscopo-chino': {
    explainer:
      'El horóscopo chino organiza el tiempo en ciclos de 12 años, cada uno con un animal. Tu animal (según el año lunar en que naciste) define rasgos de carácter y compatibilidades, y cada animal tiene un elemento: Madera, Fuego, Tierra, Metal o Agua. Ojo: el año chino empieza entre enero y febrero, así que quien nace a principios de año suele ser del animal anterior. Aquí se calcula con la luna nueva real.',
    topics: ['Animal', 'Elemento', 'Año en curso', 'Compatibilidad'],
    concepts: [
      {
        term: 'Los 12 animales',
        def: 'Rata, Buey, Tigre, Conejo, Dragón, Serpiente, Caballo, Cabra, Mono, Gallo, Perro y Cerdo.',
      },
      {
        term: 'Elemento',
        def: 'Madera (crecer), Fuego (expandir), Tierra (estabilizar), Metal (precisión), Agua (adaptarse). Con el animal dan 60 combinaciones.',
      },
      {
        term: 'Año Nuevo Lunar',
        def: 'La segunda luna nueva después del solsticio de invierno. Cambia de fecha cada año.',
      },
    ],
  },
  'horoscopo-maya': {
    explainer:
      'El calendario sagrado maya (Tzolkin) combina 20 sellos con 13 tonos: 260 kines distintos. Tu sello es el tipo de energía que aportas al mundo; tu tono, cómo la manifiestas. Aquí usamos el Sincronario de las 13 Lunas, la cuenta más extendida cuando se habla de horóscopo maya.',
    topics: ['Kin', 'Sello', 'Tono', 'Misión', 'Sombra'],
    concepts: [
      { term: 'Kin', def: 'Tu número del 1 al 260. Es tu firma cósmica maya: sello más tono.' },
      {
        term: 'Los 20 sellos',
        def: 'Dragón, Viento, Noche, Semilla, Serpiente, Enlazador de Mundos, Mano, Estrella, Luna, Perro, Mono, Humano, Caminante del Cielo, Mago, Águila, Guerrero, Tierra, Espejo, Tormenta y Sol.',
      },
      {
        term: 'Los 13 tonos',
        def: 'Del Magnético (1, propósito) al Cósmico (13, presencia). Se escriben con puntos (uno) y barras (cinco), como los números mayas.',
      },
      {
        term: 'Colores',
        def: 'Rojo inicia, Blanco refina, Azul transforma y Amarillo madura. Cada sello pertenece a uno.',
      },
    ],
  },
  runas: {
    explainer:
      'Las runas son el antiguo alfabeto nórdico y también un sistema de sabiduría. Cada runa tiene nombre, símbolo y significado. Úsalas para preguntas que piden respuestas directas: no dan rodeos, que es justo para lo que están.',
    topics: ['Runa', 'Destino', 'Protección', 'Bloqueo', 'Acción'],
    concepts: [
      {
        term: 'Elder Futhark',
        def: 'El alfabeto rúnico más antiguo: 24 runas en tres grupos (aettir) de ocho. Es el que usa ZODI.',
      },
      {
        term: 'Runa invertida (merkstave)',
        def: 'Cuando sale del revés: la cara difícil de la runa o una advertencia. Las simétricas, como Isa o Gebo, nunca salen invertidas.',
      },
      {
        term: 'Runas fuertes',
        def: 'Fehu (riqueza), Hagalaz (ruptura necesaria), Tiwaz (justicia) e Ingwaz (potencial a punto de nacer).',
      },
    ],
  },
  cristales: {
    explainer:
      'Los cristales son herramientas simbólicas de intención. No curan nada ni tienen poderes comprobados, y no sustituyen a ningún profesional. Pero como objeto físico de foco te ayudan a centrar una intención, recordar un compromiso contigo o tener algo tangible cuando la mente se dispersa.',
    topics: ['Cristal', 'Intención', 'Ritual', 'Cuándo hacerlo'],
    concepts: [
      { term: 'Amatista', def: 'Calma mental y límites sin drama. La piedra que apaga el ruido.' },
      {
        term: 'Cuarzo transparente',
        def: 'El comodín: amplifica la intención que le pongas. Si no sabes cuál usar, este.',
      },
      {
        term: 'Obsidiana negra',
        def: 'Protección y honestidad brutal. Hace de espejo de lo que no quieres ver.',
      },
      {
        term: 'Intención',
        def: 'Lo que quieres trabajar, en una frase concreta. Sin intención, un cristal es un pisapapeles bonito.',
      },
    ],
  },
  roast: {
    explainer:
      'El roast es la herramienta más honesta de ZODI: tu carta bajo análisis, sin filtros y con humor. Porque a veces el universo tiene que decirte lo que tus amistades no se atreven. Duele un poco, aclara mucho. Si resuena demasiado… pregúntate por qué.',
    topics: ['Roast', 'Patrón', 'Humor', 'Giro tierno'],
    concepts: [
      {
        term: 'Patrón',
        def: 'Eso que haces siempre igual y te sorprende siempre igual. El roast lo señala con el dedo (con cariño).',
      },
    ],
  },
  oraculo: {
    explainer:
      'El oráculo es consulta libre, sin formato. Escribe lo que te ronda: una decisión que no puedes tomar, una situación que no entiendes, una duda que no quieres buscar en internet. ZODI responde desde tu carta y tu cielo de hoy, en el tono que elijas en Ajustes.',
    topics: ['Pregunta libre', 'Consejo', 'Decisiones', 'Amor', 'Trabajo'],
    concepts: [
      {
        term: 'Cómo preguntar',
        def: 'Concreto y con contexto: "¿Acepto el trabajo de Valencia aunque deje a mi gente?" funciona mejor que "¿Qué hago con mi vida?".',
      },
    ],
  },
};

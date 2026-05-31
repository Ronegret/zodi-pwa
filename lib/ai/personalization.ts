/**
 * Módulo de personalización cultural ZODI
 * Enriquece el contexto del usuario más allá del signo zodiacal:
 * - Generación según año de nacimiento
 * - Contexto cultural y jerga según país/ciudad de origen
 * - Significado del nombre
 * - Palabras y referencias regionales
 */

// ── Generación por año de nacimiento ─────────────────────────────────────────
export function getGeneration(birthDate?: string): { label: string; context: string } | null {
  if (!birthDate) return null;
  const year = parseInt(birthDate.split("-")[0]);
  if (isNaN(year)) return null;

  if (year <= 1945) return {
    label: "Silent Generation",
    context: "Has visto guerras, crisis y cambios que los demás solo leen en libros. Tu perspectiva tiene un peso que la mayoría no entiende todavía."
  };
  if (year <= 1964) return {
    label: "Baby Boomer",
    context: "Generación que construyó el mundo moderno y ahora ve cómo lo rebautizan como vintage. Entre el esfuerzo que costó todo y los hijos que dicen que fue fácil."
  };
  if (year <= 1980) return {
    label: "Generación X",
    context: "Los olvidados más cool de la historia. Crecieron sin internet, sobrevivieron el dial-up y ahora dominan ambos mundos sin hacer ruido. La generación del 'yo me arreglo'."
  };
  if (year <= 1996) return {
    label: "Millennial",
    context: "El 'cuando sea grande' que nunca terminó de llegar. Entre la deuda, el aguacate en tostada y la crisis existencial de los 30. Pero también: la generación más resiliente sin saberlo."
  };
  if (year <= 2012) return {
    label: "Generación Z",
    context: "TikTok, ansiedad social, consciencia ecológica y un BS-detector que no falla. No aguantan las mentiras pero sí los memes de 3AM. Directos o nada."
  };
  return {
    label: "Generación Alpha",
    context: "Nacieron con tablet en mano y IA de fondo. Su infancia ya es futurista. La paciencia no es su fuerte, pero la adaptación sí."
  };
}

// ── Contexto cultural por país ────────────────────────────────────────────────
interface CulturalContext {
  humor: string;
  expressions: string[];
  references: string;
  cityNotes?: Record<string, string>;
}

const CULTURAL_MAP: Record<string, CulturalContext> = {
  "España": {
    humor: "castizo, directo, con ironía sin filtro — el humor que va de frente y si duele ya te reirás después",
    expressions: ["tío/tía", "jolín", "mola", "flipar", "¡venga va!", "guay", "ostras", "coñazo", "hala"],
    references: "el fútbol (siempre el fútbol), las tapas, el calor de agosto, el 'mañana lo hago', las quejas sobre Hacienda y el 'en este país...'",
    cityNotes: {
      "Madrid": "madrileño/a de pura cepa — velocidad, descaro y ese orgullo capitalino que saca de quicio a media España",
      "Barcelona": "donde conviven el catalán, el castellano y el turista confundido — energía dual, identidad fuerte",
      "Sevilla": "la gracia, el duende, el calor humano y ese ritmo que no para ni en agosto",
      "Bilbao": "carácter vasco: trabajador, orgulloso, directo y con sidra o txakoli en mano",
      "Valencia": "la huerta, el mar, las Fallas — energía mediterránea con mucho sol y algo de caos organizado"
    }
  },
  "México": {
    humor: "picante, callejero, con albur posible y ternura familiar — el humor del que ya no le tiene miedo a nada",
    expressions: ["wey/güey", "órale", "chido/chida", "no manches", "qué pedo", "cuate/cuata", "chamba", "jalá", "fierro"],
    references: "los tacos (siempre), las chanclas de la abuela como arma de corrección, el tráfico de CDMX, el tianguis, el 'ahorita' que puede ser 5 minutos o 3 días",
    cityNotes: {
      "Ciudad de México": "la gran CDMX — ritmo brutal, creatividad sin freno y ese orgullo capitalino con todo el caos incluido",
      "Guadalajara": "la perla tapatía — mariachi, tequila, y un carácter más tranquilo pero igual de picante",
      "Monterrey": "regio: trabajador nato, práctico, emprendedor — si no suma, no interesa",
      "Cancún": "entre el Caribe y la industria turística — energía de flujo, adaptación constante"
    }
  },
  "Argentina": {
    humor: "irónico porteño, melancólico-filosófico, con psicoanálisis en cada oración — el humor que llora mientras ríe",
    expressions: ["che", "boludo/a", "re", "posta", "flashar", "laburo", "gil", "copado/a", "groso/a", "birra"],
    references: "el asado sagrado, el mate como ritual diario, el psicólogo (todos tienen uno), Messi, la crisis (siempre hay una), el Obelisco como punto cardinal",
    cityNotes: {
      "Buenos Aires": "el porteno/a — intenso, apasionado, opinionado y con esa melancolía bonita que confunden con arrogancia",
      "Córdoba": "el acento más reconocible y el humor más ácido de Argentina — 'qué sé yo'",
      "Rosario": "ciudad de creadores, de Messi y de Che — energía de rebeldía creativa"
    }
  },
  "Colombia": {
    humor: "calidez paisa mezclada con ingenio costeño — el humor que abraza y pincha al mismo tiempo",
    expressions: ["parce", "bacano/a", "chimba", "marica (cariñoso)", "uy parce", "el man/la man", "plata", "vaina"],
    references: "el tinto a toda hora, el calor de Barranquilla o el frío de Bogotá, la cumbia y el vallenato, el 'qué nota tan bacana'",
    cityNotes: {
      "Bogotá": "el rolo — intelectual, frío de clima y cálido de gente, con ese acento que suena a telenovela",
      "Medellín": "el paisa — emprendedor, familiar, orgulloso de su ciudad transformada y su fútbol",
      "Barranquilla": "puro Caribe: alegría, calor, carnaval — la energía más festiva de Colombia",
      "Cali": "la salsa en las venas — caleño/a de pura cepa, con ritmo y carácter propio"
    }
  },
  "Chile": {
    humor: "ácido, con doble sentido y mucha chilenada — el humor que parece insulto pero es cariño",
    expressions: ["po (siempre)", "weon/weona", "la raja", "al tiro", "pucha", "fome", "bacán", "caleta", "seco/a"],
    references: "el terremoto (bebida y sísmico — ambos frecuentes), la once sagrada, el frío del sur, Santiago y el resto del país, el 'no po'",
    cityNotes: {
      "Santiago": "santiaguino/a — ritmo de metrópolis andina, entre el cerro y el mall",
      "Valparaíso": "porteño/a — artístico, bohemio, con ese caos colorido de los cerros",
      "Concepción": "penquista — trabajador del sur, más directo y menos cuento"
    }
  },
  "Perú": {
    humor: "cálido limeño o directo serrano — el humor que mezcla orgullo milenario con sarcasmo cotidiano",
    expressions: ["causa", "pata (amigo)", "bacán", "chévere", "al toque", "yapa", "bamba (falso)"],
    references: "el ceviche como religión, el tráfico de Lima como penitencia, Machu Picchu, la chicha morada y ese orgullo gastronómico que ya conquistó el mundo",
    cityNotes: {
      "Lima": "limeño/a — mezcla de todo Perú en una ciudad caótica con el mejor ceviche del universo",
      "Cusco": "cuzqueño/a — entre lo ancestral inca y el turista confundido, con una identidad muy fuerte",
      "Arequipa": "arequipeño/a — el Misti al fondo y ese carácter independiente que les pone"
    }
  },
  "Venezuela": {
    humor: "ingenioso, resiliente, costeño — el humor del que aprendió a reírse de todo porque sino lloraría",
    expressions: ["pana", "chamo/a", "arrecho/a (intenso)", "burda de (mucho)", "na guará", "chevere"],
    references: "la familia como ancla, el calor caribeño, el béisbol, la arepa como comida sagrada, la resiliencia que ya es superpoder"
  },
  "Ecuador": {
    humor: "cálido, con sazón serrana o costeña — el humor del que mezcla tradición con picardía",
    expressions: ["causa", "bicho (persona)", "ñaño/a (hermano/a)", "chévere", "man"],
    references: "el Cotopaxi y sus volcanes, el ceviche guayaquileño, las cuatro regiones del país en una sola conversación"
  },
  "Estados Unidos": {
    humor: "adaptable — si es hispano en USA: bicultural, mezcla el Spanglish con orgullo",
    expressions: ["ok", "sure", "whatever", "lit", "vibe — o su equivalente en español según herencia"],
    references: "la vida entre dos mundos si es latino/a, el sueño americano y sus contradicciones, el sistema de crédito como pesadilla"
  },
  "Francia": {
    humor: "irónico europeo, con esa elegancia que puede sonar pedante pero tiene fondo",
    expressions: ["c'est la vie", "mais oui", "bof", "voilà"],
    references: "el queso, el buen vino, la huelga (siempre hay una), el Louvre como vecindario"
  },
  "Alemania": {
    humor: "directo, sin rodeos — el humor que va al grano aunque el chiste llegue 3 segundos después",
    expressions: ["genau", "tschüss", "schön"],
    references: "la puntualidad como virtud sagrada, el Oktoberfest, el orden como filosofía de vida"
  },
  "Italia": {
    humor: "apasionado, gestual, operístico — la emoción al 100% siempre",
    expressions: ["mamma mia", "dai!", "cazzo (suavizado)", "perfetto"],
    references: "la pasta como arte, la famiglia, el calcio, el espresso como única forma de café correcta"
  },
};

export function getCulturalContext(country?: string, city?: string): string | null {
  if (!country) return null;

  const ctx = CULTURAL_MAP[country];
  if (!ctx) {
    return `De ${country}${city ? `, ${city}` : ""}. Adapta el tono al contexto cultural de esa región cuando sea relevante.`;
  }

  const cityNote = city && ctx.cityNotes?.[city]
    ? ` — ${ctx.cityNotes[city]}`
    : city ? ` de ${city}` : "";

  return `De ${country}${cityNote}. Humor ${ctx.humor}. Expresiones que puede usar: ${ctx.expressions.slice(0, 5).join(", ")}. Referencias culturales que resuenen: ${ctx.references}.`;
}

// ── Significado del nombre ────────────────────────────────────────────────────
const NAME_MEANINGS: Record<string, string> = {
  // Masculinos
  "rodrigo":    "Guerrero glorioso (germánico). Energía de líder nato que a veces se olvida de pedir ayuda.",
  "gabriel":    "Mensajero de Dios (hebreo). Don de comunicar verdades que la gente no siempre quiere escuchar.",
  "alejandro":  "El que protege (griego). Quiere salvar al mundo — primero que aprenda a salvarse a sí mismo.",
  "sebastian":  "El venerado (griego). Energía magnética que atrae y a veces confunde lo que quiere con lo que necesita.",
  "daniel":     "Dios es mi juez (hebreo). Sentido de la justicia muy marcado — y sí, a veces juzga también.",
  "nicolas":    "Victoria del pueblo (griego). Visión de conjunto clara pero se pierde en los detalles pequeños.",
  "juan":       "Dios es misericordioso (hebreo). Energía de puente entre mundos, necesita encontrar el suyo.",
  "carlos":     "Hombre libre (germánico). Independencia en el ADN — no lo intentes controlar.",
  "jorge":      "El agricultor (griego). Paciencia y constancia, pero hay que recordarle que disfrute la cosecha.",
  "miguel":     "¿Quién como Dios? (hebreo). Búsqueda constante, nunca del todo satisfecho.",
  "pablo":      "El pequeño (latino). Los mejores planes vienen en paquete compacto.",
  "david":      "El amado (hebreo). Energía de perseverancia — los Goliat le dan igual.",
  "andres":     "Valeroso (griego). Fuerza callada que explota cuando menos se espera.",
  "luis":       "Guerrero ilustre (germánico). Ambición con clase — sabe lo que quiere y cómo conseguirlo.",
  "fernando":   "Atrevido en la paz (germánico). Contradictorio de nombre, fascinante en persona.",
  "diego":      "El que suplanta (hebreo). Energía de reinvención constante — cada vez mejor versión.",
  "ignacio":    "El ardiente (latino). Pasión que enciende todo lo que toca — para bien y para mal.",
  "mateo":      "Don de Dios (hebreo). Los Mateo suelen aparecer en el momento exacto que se les necesita.",
  "emilio":     "El que trabaja (latino). Energía de constancia — no son los más rápidos pero llegan los primeros.",
  "sergio":     "El guardián (latino). Protector nato que a veces se olvida de que él también necesita protección.",
  // Femeninos
  "sofia":      "Sabiduría (griego). Acumula más inteligencia de la que muestra — no la subestimes.",
  "camila":     "La que sirve al templo (latino). Dedicación total — aprende también a recibir.",
  "valeria":    "Fuerte y sana (latino). Resiliencia brutal que ella misma no siempre reconoce.",
  "isabella":   "Consagrada a Dios (hebreo). Intensidad emocional — su mayor fuerza y su mayor trampa.",
  "valentina":  "Fuerte y valiente (latino). Guerrera que a veces se cansa de pelear sola.",
  "mariana":    "Del mar (hebreo). Profundidad emocional e intuición alta — a veces demasiado tiempo en el fondo.",
  "laura":      "Laureada, victoriosa (latino). Suelen llegar tarde al éxito... pero llegan.",
  "patricia":   "Noble (latino). Estándares altos — a veces demasiado altos para los demás.",
  "lucia":      "Luz (latino). Ilumina los espacios que habita, aunque ella no siempre lo vea.",
  "andrea":     "Valerosa (griego). Energía dual que se adapta a casi cualquier situación.",
  "elena":      "Brillante, luminosa (griego). Energía que atrae sin proponérselo.",
  "maria":      "La amada (hebreo). Un nombre que lleva el peso de la historia y la ternura de lo cotidiano.",
  "paula":      "La pequeña (latino). No te dejes engañar por el nombre — tiene una presencia enorme.",
  "claudia":    "La que cojea (latino). Los nombres con historia difícil suelen tener dueñas con fuerza extraordinaria.",
  "natalia":    "Día de Navidad (latino). Energía de celebración y generosidad que necesita aprender a guardarse algo.",
  "carolina":   "Mujer libre (germánico). Independiente desde el nombre — no espera permiso de nadie.",
  "daniela":    "Dios es mi juez (hebreo). Justicia interna muy marcada — cuando algo no le parece, lo dice.",
  "ana":        "La graciosa (hebreo). Simple en la forma, profunda en el fondo — no se deja ver fácilmente.",
  "beatriz":    "La que trae felicidad (latino). Energía que suma en cada espacio que habita.",
  "raquel":     "Oveja (hebreo). Dulce en la apariencia, tenaz en la dirección.",
  "monica":     "La que aconseja (griego). Sabiduría práctica que la gente busca sin saber por qué.",
};

export function getNameMeaning(displayName?: string): string | null {
  if (!displayName) return null;
  const firstName = displayName.split(" ")[0].toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "");

  const meaning = NAME_MEANINGS[firstName];
  if (!meaning) return null;
  return meaning;
}

// ── Pop culture por generación y país ────────────────────────────────────────
// Referenciamos lo que marcó sus 10-18 años (época de formación)

interface PopCultureEra {
  music: string;      // Artistas y canciones de su época
  tvFilms: string;    // Series y pelis que todo el mundo vio
  school: string;     // Experiencias del cole/instituto/universidad
  tech: string;       // Tecnología de su era
  phrases: string;    // Frases/expresiones de moda
}

const POP_CULTURE: Record<string, Record<string, PopCultureEra>> = {
  "España": {
    "boomer": {
      music: "Camilo Sesto, Julio Iglesias, Rocío Jurado, Los Pekenikes, el flamenco de verdad",
      tvFilms: "El Cordobés, Curro Jiménez, la TVE en blanco y negro, el NO-DO",
      school: "el pupitre de madera, la cartilla escolar, los curas en clase, las enciclopedias Larousse",
      tech: "el primer televisor en casa, la radio de transistores",
      phrases: "'¡Hombre ya!', 'ni hablar del peluquín', 'más raro que un perro verde'"
    },
    "x": {
      music: "Mecano, Heroes del Silencio, La Guardia, Hombres G, Los Rodríguez, Duncan Dhu, Siniestro Total",
      tvFilms: "La bola de cristal, El equipo A, MacGyver, Falcon Crest, Los Locos Addams, E.T.",
      school: "los recreos con cromos de la Liga, el chupa-chups en la lengua, el 'Doraemon' antes del cole",
      tech: "los cassettes pirateados, el Spectrum, el Amiga 500, los primeros CD",
      phrases: "'¿Cuánto cuesta?', 'qué fuerte tío', 'estoy flipando', 'me mola mogollón'"
    },
    "millennial": {
      music: "Operación Triunfo 2001, La Oreja de Van Gogh, Estopa, Amaral, Alejandro Sanz, David Bisbal, El Canto del Loco, Bisbal vs Chenoa",
      tvFilms: "Los Serrano, Aquí no hay quien viva, Compañeros, Dragon Ball Z, Los Simpson, El Internado, Física o Química, Los Hombres de Paco",
      school: "las libretas con TipEx, el 'tú me gustas' escrito en una hoja doblada, el bocadillo de nocilla, las gomas con olor a frutas",
      tech: "Tuenti (no Facebook, TUENTI), MSN Messenger, el Nokia 3310 indestructible, el Fotolog, los primeros iPod",
      phrases: "'¿Qué fuerte, tío?', 'en plan', 'o sea', 'estoy como loco', 'flipas en colores', 'cómo mola'"
    },
    "z": {
      music: "Bad Bunny, Rosalía, C. Tangana, Bizarrap, Quevedo, Rauw Alejandro, J Balvin, Daddy Yankee",
      tvFilms: "La Casa de Papel, Élite, Stranger Things, Euphoria, Squid Game, Encanto, todo lo de Netflix",
      school: "los Airpods en clase a escondidas, el grupo de WhatsApp, TikTok en el baño, el 'profe, que me estás llamando mal'",
      tech: "Instagram Stories, BeReal (que ya nadie usa), Spotify, Discord, Twitch",
      phrases: "'Es un tok', 'no te creo', 'qué random', 'es que me flipa', 'uff qué cansino', 'literalmente'"
    }
  },
  "México": {
    "boomer": {
      music: "Pedro Infante (en la tele de los abuelos), Agustín Lara, Los Panchos, Javier Solís",
      tvFilms: "El Chavo del 8 en sus primeras temporadas, Chabelo, las telenovelas de Verónica Castro",
      school: "el recreo con la señora de los chicharrones, el cuaderno profesional, las sandalias de cuero",
      tech: "la primera tele en blanco y negro, la rockola en la esquina",
      phrases: "'¡Híjole!', '¿Qué pasó?', 'no hay rollo', 'ahorita (= nunca)'"
    },
    "x": {
      music: "Juan Gabriel, Los Bukis, Timbiriche, Soda Stereo, Los Yonics, Ana Gabriel",
      tvFilms: "El Chapulín Colorado, Chabelo todos los domingos, las telenovelas de Televisa, Robotech",
      school: "el lonche de la mamá, el cuadernito de apuntes con portada de la Barbie, el 'maestro me presta su pluma'",
      tech: "el Atari, los cassettes pirata de tepito, las primeras computadoras verdes",
      phrases: "'Órale pues', '¡Aguas!', '¿Qué onda?', 'está de pelos', '¡No manches!'"
    },
    "millennial": {
      music: "RBD (era religión), Jaguares, Café Tacvba, Julieta Venegas, Jenni Rivera, La Arrolladora, Daddy Yankee en sus inicios",
      tvFilms: "Dragon Ball Z (sagrado), Caballeros del Zodiaco, El Chavo animado, Rebelde, Acorralada, La familia P. Luche",
      school: "el puesto de antojitos afuera de la escuela, los folderes con divisiones, el 'me puedes echar un borrador', los balazos con Pelikan",
      tech: "Hi5 (antes que Facebook), MSN con el nick raro, los Motorolas de tapita, bajar mp3 del LimeWire",
      phrases: "'Wey', 'chido/chida', '¡Qué pedo!', 'está chido', 'no manches wey', 'a huevo'"
    },
    "z": {
      music: "Bad Bunny, Natanael Cano, Peso Pluma, Los Tucanes (irónicamente), Rauw Alejandro, Karol G",
      tvFilms: "La rosa de Guadalupe (modo meme), Narcos, Club de Cuervos, todo lo de Netflix México",
      school: "el TikTok en el baño, los Airpods, el 'profe ya se acabó la clase', los memes del grupo de WhatsApp",
      tech: "TikTok, VSCO, Spotify, los memes de formato mexicano, el SHEIN como religión",
      phrases: "'Es que sí', 'le puse', '¿ya viste?', 'no mames', 'ta bien culero', '¡Asco!'"
    }
  },
  "Argentina": {
    "boomer": {
      music: "Palito Ortega, Sandro, Mercedes Sosa, Astor Piazzolla, folklore en todos los asados",
      tvFilms: "la tele en blanco y negro del 78, el Mundial de Argentina — el más memorable, Pol-Ka de los primeros",
      school: "los cuadernos Rivadavia, la regla de madera, el delantal blanco",
      tech: "el primer televisor color, la radio AM toda la noche",
      phrases: "'Dale', 'qué sé yo', 'me parece bárbaro', 'ni ahí'"
    },
    "x": {
      music: "Soda Stereo (dios), Los Fabulosos Cadillacs, Virus, Los Twist, Sumo, Charly García",
      tvFilms: "Crónica TV a toda hora, Videomatch, El show de Xuxa, Condorito, la época oscura del rock",
      school: "el recreo con medias 3/4 y zapatillas Topper, el cuaderno Gloria, el boleto estudiantil",
      tech: "el Amiga, los cassettes, el primer Motorola ladrillo, el diskette de 3½",
      phrases: "'Re', 'copado/a', 'qué garcha', 'grosso', 'posta', '¿viste?'"
    },
    "millennial": {
      music: "Soda Stereo (religión), Los Piojos, Bersuit, La Vela Puerca, El Cuarteto de Nos, El Mató a un Policía Motorizado, Kevin Johansen",
      tvFilms: "Chiquititas, Cebollitas, Son Amores, Dragon Ball Z, Los Simpson (doblaje rioplatense), Rebelde Way",
      school: "el Fotolog con frase de Los Piojos, el recreo con Mogul, los sándwiches de miga, el cuaderno Gloria cuadriculado",
      tech: "el ICQ, el Fotolog como red social antes de las redes, MSN con 'pañuelo en mano', bajar del Ares o Kazaa",
      phrases: "'Re', 'posta', 'qué copado', 'me flashé', 'estoy podrido/a', 'che boludo/a (con cariño)'"
    },
    "z": {
      music: "Bizarrap, Duki, Wos, Bad Bunny, Nicki Nicole, Trueno, María Becerra",
      tvFilms: "Okupas (redescubierto), Stranger Things, Euphoria, el anime en general, El marginal",
      school: "el Tinder desde los 18, el TikTok en el colectivo, las stories de Instagram como diario",
      tech: "Discord, Spotify, Twitch, el streaming como forma de vida, el Wordle argentinizado",
      phrases: "'Nos vemos', 'está buenísimaaa', 'qué re copado', 're loco', 'full', 'literal'"
    }
  },
  "Colombia": {
    "millennial": {
      music: "Carlos Vives, Shakira (antes del Barça), Juanes, Fonseca, La Barra, Joe Arroyo en las fiestas familiares",
      tvFilms: "Betty la fea (orgullo nacional), El Cartel de los Sapos, Padres e Hijos, Yo soy Betty",
      school: "el recreo con chitos y papas margarita, el saludo con beso, el 'llave, préstame la copia'",
      tech: "el MSN con nick de Shakira, el primer Nokia de prepago, el internet por minutos",
      phrases: "'Parce', 'uy qué chimba', 'bacano/a', 'marica (con cariño)', '¿Qué más?'"
    },
    "z": {
      music: "Maluma, J Balvin, Karol G (BICHOTA), Ryan Castro, Rauw Alejandro, Bad Bunny",
      tvFilms: "Narcos (con rabia), La reina del flow, Todo es amor, el reggaeton como BSO de la vida",
      school: "el parche en el patio, los Airpods, el TikTok como pasatiempo oficial",
      tech: "Instagram, TikTok, Spotify, los memes de 'ay parce'",
      phrases: "'Chimba', 'parce', 'bacano', 'qué nota', 'uy llave'"
    }
  },
  "Chile": {
    "millennial": {
      music: "Los Bunkers, Joe Vasconcellos, Javiera Mena, Francisca Valenzuela, Chancho en Piedra, La Ley",
      tvFilms: "31 minutos (ZODI también conoce a Tulio), Morandé con Compañía, Mea Culpa, Aquí hay fantasmas",
      school: "el recreo con sopaipillas, la once sagrada, el cuaderno de 7 líneas, el 'ya po profe'",
      tech: "el Portal Mágico (antes de YouTube), el Hi5 chileno, el primer Motorola con antena",
      phrases: "'Po', 'weon/weona', 'la raja', 'fome', 'no seas fome', 'bacán', 'al tiro'"
    },
    "z": {
      music: "Bad Bunny, Mon Laferte, Paloma Mami, Cami, Benjamín Leftheriotis, Duki",
      tvFilms: "Élite, La Casa de Papel, todo Netflix, Los 80 (nostalgia de papás)",
      school: "el TikTok en la sala, los Airpods, las pruebas PAES como trauma generacional",
      tech: "Instagram, TikTok, Spotify, los memes de Wena Profe",
      phrases: "'Wena', 'ta' bien', 'no te creo', 'qué random', 'literal'"
    }
  },
  "Perú": {
    "millennial": {
      music: "Bareto, Libido, Mar de Copas, Eva Ayllón (en casa), Los Mojarras, Pedro Suárez Vértiz",
      tvFilms: "El especial del humor (viernes sagrado), Al fondo hay sitio, Los Cómicos Ambulantes",
      school: "el recreo con chifles y anticuchos, el cuaderno Justus, el 'causa préstame tu borrador'",
      tech: "el Ares para descargar música, el Hi5 peruano, los primeros Nokia con antena",
      phrases: "'Causa', 'pata (amigo)', 'bacán', 'al toque', 'qué hay de nuevo, causa'"
    }
  }
};

function getGenerationKey(birthDate?: string): string {
  if (!birthDate) return "millennial";
  const year = parseInt(birthDate.split("-")[0]);
  if (year <= 1964) return "boomer";
  if (year <= 1980) return "x";
  if (year <= 1996) return "millennial";
  return "z";
}

export function getPopCultureContext(birthDate?: string, country?: string): string | null {
  if (!birthDate || !country) return null;

  const genKey = getGenerationKey(birthDate);
  const countryData = POP_CULTURE[country];
  if (!countryData) return null;

  const era = countryData[genKey];
  if (!era) return null;

  return `REFERENCIAS POP CULTURE DE SU ÉPOCA (úsalas cuando encaje natural, no forzado):
🎵 Música de su era: ${era.music}
📺 Series y pelis: ${era.tvFilms}
🏫 Recuerdos del cole/uni: ${era.school}
📱 Tecnología de su época: ${era.tech}
💬 Frases que usaban: ${era.phrases}

Úsalas como un amigo que vivió lo mismo — "¿te acuerdas cuando...?", "esto es como cuando...", "eso lo hacías mientras escuchabas a...". Que se sienta nostalgia real, no Wikipedia.`;
}

// ── Bloque completo de personalización para el prompt ────────────────────────
export interface PersonalizationData {
  displayName?: string;
  birthDate?: string;
  birthCity?: string;
  birthCountry?: string;
  currentCity?: string;
  currentCountry?: string;
}

export function buildPersonalizationBlock(data: PersonalizationData): string {
  const parts: string[] = [];

  // Nombre y su significado
  const nameMeaning = getNameMeaning(data.displayName);
  if (data.displayName) {
    const firstName = data.displayName.split(" ")[0];
    parts.push(`NOMBRE: ${firstName}${nameMeaning ? ` — "${nameMeaning}"` : ""}`);
  }

  // Generación
  const gen = getGeneration(data.birthDate);
  if (gen) {
    parts.push(`GENERACIÓN: ${gen.label} — ${gen.context}`);
  }

  // Pop culture de su época y país
  const popCtx = getPopCultureContext(data.birthDate, data.birthCountry);
  if (popCtx) {
    parts.push(popCtx);
  }

  // Origen
  const birthCtx = getCulturalContext(data.birthCountry, data.birthCity);
  if (birthCtx) {
    parts.push(`ORIGEN: ${birthCtx}`);
  }

  // Ubicación actual si es diferente al origen
  if (data.currentCountry && data.currentCountry !== data.birthCountry) {
    const currentCtx = getCulturalContext(data.currentCountry, data.currentCity);
    if (currentCtx) {
      parts.push(`VIVE AHORA EN: ${data.currentCountry}${data.currentCity ? `, ${data.currentCity}` : ""} — mezcla cultural de origen + destino.`);
    }
  }

  if (parts.length === 0) return "";

  return `
══ CONTEXTO CULTURAL DEL USUARIO ══
${parts.join("\n")}

INSTRUCCIÓN: Usa este contexto para personalizar las respuestas. Incluye referencias culturales de su origen cuando sea natural. Usa alguna expresión regional si encaja bien. Menciona el significado del nombre cuando sea relevante para la lectura. La generación da contexto sobre su etapa vital y referencias culturales compartidas.
══════════════════════════════════`;
}

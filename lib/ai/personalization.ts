import { calculateSunSign } from "@/lib/astral";

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

// ── Infancia / Edad de oro (5-12 años) ───────────────────────────────────────
interface ChildhoodEra {
  cartoons: string;   // Dibujos animados y pelis de su infancia
  toys: string;       // Juguetes icónicos
  games: string;      // Juegos de patio/calle
  snacks: string;     // Golosinas y comidas de infancia
  schoollife: string; // Vida escolar de esa época
  fear: string;       // El miedo clásico de esa generación
}

// Clave = país + década de infancia (año de nacimiento + 7 ≈ centro de la edad de oro)
// Ejemplo: nacido 1990 → infancia centrada en ~1997 → clave "90s"
const CHILDHOOD: Record<string, Record<string, ChildhoodEra>> = {
  "España": {
    "70s": {
      cartoons: "Heidi, Marco, Mazinger Z (doblado), El Correcaminos, Scooby-Doo y Los Picapiedra en TVE",
      toys: "el trompo de madera, el yo-yo, las canicas, los soldaditos de plomo, los coches de Scalextric del vecino rico",
      games: "la rayuela, el escondite, el pañuelo, el bote, chapas en la calle",
      snacks: "chupachups a 1 peseta, las pipas de girasol en bolsita, las gaseosas en botella de vidrio, caramelos a granel en la tienda de la esquina",
      schoollife: "el pupitre de madera con tintero, el cuaderno Rubio, la palmeta del maestro, el bocadillo de chorizo en el recreo",
      fear: "el coco y el 'hombre del saco' como amenaza real de los padres, el miedo a la oscuridad del pasillo",
    },
    "80s": {
      cartoons: "He-Man, Thundercats, Los Pitufos, Inspector Gadget, ET (en el cine con los padres), Dragon Ball primeras temporadas",
      toys: "el Scalextric, los Clicks de Famobil, Hot Wheels, Barbie rubia de pelo duro, los Playmobil, Spectrum ZX (el del vecino afortunado)",
      games: "los recreativos con monedas de 5 duros, la máquina de Pac-Man, el parchís los domingos, chapas en el patio",
      snacks: "los Bollicao, Donettes, el Cola Cao en el desayuno, patatas fritas Churrería, el Nestlé de bote, los Sugus",
      schoollife: "el estuche enorme con compás y escuadra, la agenda escolar con pegatinas de fútbol, el bocadillo de jamón york",
      fear: "el SIDA en las noticias que no entendías, Freddy Krueger visto de refilón en el vídeo del vecino mayor",
    },
    "90s": {
      cartoons: "Dragon Ball Z (sagrado), Los Simpsons (primeras), Doraemon, Los Fruittis, Sailor Moon, Bola de Drac en Cataluña",
      toys: "Tamagotchi (el que moría si ibas al cole), Super Nintendo/Game Boy, los tazos de las bolsas de patatas, el yo-yo Yomega, Furby",
      games: "los tazos de DBZ en el recreo, el GoldenEye en casa del colega, las maquinitas Game & Watch, pelé-pelé en el patio",
      snacks: "los Risketos, las bolsas de Cheetos a 25 pesetas, los Conguitos, el Cheeseburger de McDonalds como premio de cumpleaños",
      schoollife: "las agendas con candado, los bolígrafos de 8 colores, la carpeta Archivador con fotos de grupos de música, el chivatazo en clase",
      fear: "el efecto 2000 que iba a acabar con todo, los vídeos de terror que circulaban en VHS pirata",
    },
    "00s": {
      cartoons: "SpongeBob, Avatar La Leyenda de Aang, Naruto (primeros arcos), Ben 10, Lazy Town, las pelis de Pixar",
      toys: "Game Boy Advance SP, Nintendo DS, Wii en Navidad, los Bakugan, las cartas de Pokémon, el iPod nano de colores",
      games: "Club Penguin, Habbo Hotel, Friv, el Counter-Strike en el cyber del barrio, los Sims 2",
      snacks: "los Ruffles con sabores nuevos cada año, los Gummies de HARIBO, el Kinder Sorpresa del domingo, las galletas Príncipe",
      schoollife: "el messenger en el Messenger de MSN al llegar a casa, el Tuenti recién creado para los mayores, el primer Nokia de los padres que te dejaban usar",
      fear: "los vídeos de terror de YouTube que te mandaban por MSN, el Slenderman y las creepypastas",
    },
  },
  "México": {
    "70s": {
      cartoons: "El Chavo del 8 (primeras temporadas EN VIVO), Chespirito, Los Picapiedra, La Familia Burrón en historieta",
      toys: "el trompo, la pirinola, el balero, los soldaditos de plástico, las canicas de vidrio en la banqueta",
      games: "el avioncito en la banqueta, las escondidas en el callejón, el bote pateado, el yoyo",
      snacks: "las paletas de hielo artesanales del carrito, los cacahuates enchilados, las papas con limón y chile, la nieve raspada",
      schoollife: "el cuaderno Scribe, el lápiz Mirado, el recreo con los tamales de la señora, las bancas de madera",
      fear: "el cucuy, el 'coco' que traían los abuelitos, la llorona del río del barrio",
    },
    "80s": {
      cartoons: "He-Man, Dragon Ball primeras, Transformers, Los Súper Campeones (Oliver y Benji), Inspector Gadget, Robotech",
      toys: "Atari 2600, Hot Wheels, las muñecas Barbie 'piratas' del tianguis, los Transformers 'taiwaneses', el juego de serpientes y escaleras",
      games: "los recreativos de la feria con fichas, el Nintendo que costaba un mes de sueldo del papá, el trompo en el patio",
      snacks: "el Gansito Marinela (eterno), los Pingüinos, el Boing de guayaba, los Choco Roles, la paleta payaso",
      schoollife: "el cuaderno profesional cuadriculado, el dictado a mano, el himno nacional los lunes, el uniforme con escudo cosido",
      fear: "las historias de brujería de la abuela, el chupacabras cuando salió en las noticias",
    },
    "90s": {
      cartoons: "Dragon Ball Z (religión), Los Simpsons doblado en México, Caballeros del Zodiaco, Sailor Moon, Dexter's Lab, Johnny Bravo",
      toys: "el Tamagotchi que escondías en clase, la Super Nintendo / Sega Genesis, los tazos de sabritas con DBZ, Game Boy",
      games: "los tazos en el recreo (el juego de apilar y golpear), Mortal Kombat en el Oxxo/recreativo, las matatenas",
      snacks: "las sabritas originales con limón, el Choco Krispies de caja, el Yakult, los Pulparindos, el Gatorade que era de ricos",
      schoollife: "el folder Scribe con plastiflor, el cuaderno con portada de Barbie o DBZ, la cooperativa escolar, el día del niño con pastel",
      fear: "el chupacabras (completamente real según los primos), las piñas y leyendas del barrio",
    },
    "00s": {
      cartoons: "Naruto (obligatorio), SpongeBob doblado en México, Ben 10, Avatar, El Chavo animado, Caillou",
      toys: "Nintendo DS, Wii, las cartas Pokémon / Yu-Gi-Oh!, los Bakugan, el Tamagotchi v2",
      games: "Club Penguin, Habbo Hotel, el Grand Theft Auto en casa del primo mayor, los Sims",
      snacks: "las Maruchan como almuerzo completo, los Hot Cheetos, los Takis (recién aparecidos), el Gatorade azul neón",
      schoollife: "el MSN con el nick raro en el Messenger, el Hi5 antes de Facebook, bajar música del LimeWire",
      fear: "los vídeos de terror de YouTube (Momo, Slenderman), el spam de cadenas de MSN que te mataban si no reenviabas",
    },
  },
  "Argentina": {
    "70s": {
      cartoons: "Heidi y Marco en TVE (llegaban tarde), El Zorro, Los Picapiedra, Hijitus (dibujo animado argentino)",
      toys: "el balero, el trompo, las bolitas de vidrio, los soldaditos de plomo, el elástico en el patio",
      games: "la mancha, las escondidas, el fútbol en la calle con una pelota de trapo o de goma",
      snacks: "los alfajores de maicena de la abuela, el submarino (chocolate en la leche caliente), las paletas Stani, la soda en sifón",
      schoollife: "el delantal blanco obligatorio, la carpeta con tapas duras, el dictado de la señorita, los Cuadernos Rivadavia",
      fear: "el viejo de la bolsa, el 'te va a llevar el lobizón' de los abuelos del interior",
    },
    "80s": {
      cartoons: "He-Man, Transformers, Dragon Ball primeras, Los Pitufos, La Abeja Maya, Robotech, Candy Candy",
      toys: "el Atari (el que tenía era dios del barrio), los Clicks de Famobil, el Scalextric, los muñecos He-Man taiwaneses",
      games: "el recreativo con fichas de 50 centavos, el fútbol en el potrero, la rayuela, las bolitas",
      snacks: "los Cachafaz, las galletitas Terrabusi, el Facturas de panadería del domingo, los Alfajores Havanna de los ricos",
      schoollife: "el cuaderno Gloria, el lápiz negro Faber Castell, el guardapolvo blanco, el servicio cívico los lunes",
      fear: "las noticias de la dictadura que los padres bajaban la voz para hablar (sin entender bien qué pasaba)",
    },
    "90s": {
      cartoons: "Dragon Ball Z (SAGRADO), Los Simpsons rioplatenses, Rugrats, Aaahh! Real Monsters, Beavis y Butt-Head, Pokémon",
      toys: "Tamagotchi, Super Nintendo, los tazos de las papas fritas, Game Boy, los muñecos de Pokémon",
      games: "los tazos en el recreo (el deporte nacional), el Mortal Kombat en el cyber, las figuritas del álbum",
      snacks: "las Papas 3D, el Yogurisimo, el Mogul, el sándwich de miga del kiosco, los alfajores Jorgito",
      schoollife: "el cuaderno Gloria cuadriculado, el estuche con mil lapiceras de colores, las figuritas del álbum Panini",
      fear: "el efecto 2000 que iba a fundir los bancos (encima en Argentina tenía todo el sentido)",
    },
    "00s": {
      cartoons: "Naruto, SpongeBob, Avatar, Chiquititas (últimas temporadas), Rebelde Way (los mayores), Pokémon y Digimon",
      toys: "Game Boy Advance, Nintendo DS, los Bakugan, Yu-Gi-Oh! cartas, el iPod mini",
      games: "El fotolog con frase de Los Piojos, el MSN con el nick dramático, los Sims, el Counter Strike en el cyber",
      snacks: "las Palitos de la Selva, Rhodesia, el Tofi, el Flan Milka de la vianda, los Chizitos",
      schoollife: "el Fotolog con foto de perfil moody, el 'cambio el número' por el primer celular Nokia de tapita",
      fear: "los vídeos de terror de MSN ('abre este adjunto a las 12 de la noche'), la cadena de los 7 años de mala suerte",
    },
  },
  "Chile": {
    "80s": {
      cartoons: "He-Man, Thundercats, Dragon Ball primeras, Los Pitufos, Mazinger Z, Heidi (repeticiones)",
      toys: "el trompo, el yo-yo, los muñecos He-Man 'chuecos' del Persa, el Scalextric del primo rico",
      games: "la pinta en el patio, el elástico, las chapas, el fútbol en la villa",
      snacks: "las Papas Fritas Recart, los Super Ocho, el Tritón de helado, el Watt's de durazno, las galletas Tritón",
      schoollife: "el delantal azul (niños) o cuadrillé (niñas), el cuaderno cuadriculado, el 'silencio niños' de la tía",
      fear: "el cuco, el 'hombre de la bolsa', y las historias del viejo pascuero malo que traían los adultos",
    },
    "90s": {
      cartoons: "Dragon Ball Z (misa dominical), Los Simpsons, Doraemon en TVN, Pokémon, Sailor Moon, Digimon",
      toys: "Tamagotchi (el que moría en la mochila), Super Nintendo, Game Boy, los tazos de las papas Lays con DBZ",
      games: "tazos en el recreo (deporte olímpico), el recreativo con monedas de 100, el GoldenEye N64",
      snacks: "los Papas Lays a 100 pesos, los Mc Donald's como premio mensual, el Zuko, el Chocman, las Tritón",
      schoollife: "el Estuche con 800 cosas inútiles, la Agenda escolar con pegatinas de Pokémon, el kiosco del colegio",
      fear: "el efecto 2000 que 'iba a apagar todos los computadores', los vídeos de terror en VHS del hermano mayor",
    },
    "00s": {
      cartoons: "Naruto, SpongeBob en Chilevision, Avatar, Ben 10, 31 Minutos (NACIONAL Y SAGRADO), Tulio Triviño",
      toys: "Game Boy Advance SP, Nintendo DS, los Bakugan, las cartas Pokémon, el iPod nano de colores",
      games: "Habbo Hotel (el cyber del barrio), Counter-Strike en el cyber, Club Penguin, el Messenger",
      snacks: "los Doritos nuevos sabores, las papas Lays sabor Limón, los Chips Ahoy, el Zuko de uva",
      schoollife: "el Hi5 antes del Facebook, el MSN con el nick de Los Bunkers, bajar música del Ares",
      fear: "los vídeos de terror de MSN, la cadena del 'si no reenvías esto en 10 minutos te va a pasar algo malo'",
    },
  },
  "Colombia": {
    "80s": {
      cartoons: "El Chapulín Colorado, He-Man, Los Pitufos, Dragon Ball primeras, Candy Candy, Los Picapiedra",
      toys: "el trompo, el yo-yo, las canicas, los soldaditos de plástico, las muñecas de trapo de la abuela",
      games: "el partido de fútbol en el potrero, la lleva, el encostalado en fiestas del barrio",
      snacks: "los Chitos, las papas de paquete Margarita, el Bon Bon Bum, el Frescolita, las paletas artesanales",
      schoollife: "el cuaderno de 100 hojas, el lápiz Koh-I-Noor, el recreo con el perro caliente de la señora",
      fear: "el monstruo del closet, y los apagones frecuentes que hacían todo más aterrador",
    },
    "90s": {
      cartoons: "Dragon Ball Z, Los Simpsons, Pokémon, Digimon, Dexter's Lab, Johnny Bravo, Betty la Fea (los mayores)",
      toys: "Tamagotchi, Super Nintendo, tazos de las papas Margarita, Game Boy, los muñecos Pokémon",
      games: "tazos en el recreo, el 'ponchado' en el patio, los recreativos del centro comercial",
      snacks: "el Chocoramo (religioso), las Papas Margarita, el Colombina, el Bon Bon Bum de fresa, el Milo de tarro",
      schoollife: "el cuaderno cuadriculado, los colores Faber Castell, el recreo con el caldo de pollo en termo",
      fear: "los vídeos de terror en VHS del primo mayor, el Y2K, el 'no hagas eso que te va a llevar el diablo'",
    },
    "00s": {
      cartoons: "Naruto, SpongeBob, Avatar, Ben 10, Drake & Josh doblado, Pokémon Advanced",
      toys: "Nintendo DS, los Bakugan, Yu-Gi-Oh! cartas, la Bratz vs Barbie, el iPod shuffle",
      games: "el Messenger con el nick de Shakira, Hi5, Club Penguin, el Counter-Strike en el café internet",
      snacks: "los Doritos, los Cheetos Poffs, el Colombina, las galletas Festival de limón, el Milo en el recreo",
      schoollife: "el primer Nokia de papá prestado, el MSN en el cyber, bajar canciones del LimeWire",
      fear: "los videos de terror de MSN, la cadena de la niña del vestido blanco",
    },
  },
};

function getChildhoodDecade(birthDate?: string): string {
  if (!birthDate) return "90s";
  const year = parseInt(birthDate.split("-")[0]);
  // Centro de infancia = año nacimiento + 7
  const midChildhood = year + 7;
  if (midChildhood < 1980) return "70s";
  if (midChildhood < 1990) return "80s";
  if (midChildhood < 2000) return "90s";
  return "00s";
}

export function getChildhoodContext(birthDate?: string, country?: string): string | null {
  if (!birthDate || !country) return null;

  const decade = getChildhoodDecade(birthDate);
  const countryData = CHILDHOOD[country];
  if (!countryData) return null;

  // Buscar la era exacta o la más cercana disponible
  const era = countryData[decade] ??
    countryData["90s"] ??
    countryData["80s"] ??
    Object.values(countryData)[0];

  if (!era) return null;

  return `INFANCIA / EDAD DE ORO (sus 5-12 años, cuando todo era posible):
📺 Dibujos que veía: ${era.cartoons}
🧸 Juguetes de su infancia: ${era.toys}
🏃 Juegos en la calle/patio: ${era.games}
🍬 Golosinas y sabores de infancia: ${era.snacks}
🏫 Vida escolar de esa época: ${era.schoollife}
😱 El miedo clásico de su generación: ${era.fear}

Úsalo con emoción y nostalgia — "de niño/a seguro que...", "¿a que todavía recuerdas el olor de...?", "eso lo aprendiste antes que el alfabeto". Que sienta que ZODI también vivió esa infancia con él/ella.`;
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

// ── Etapa de vida ─────────────────────────────────────────────────────────────
export function getLifeStage(birthDate?: string, hasKids?: boolean): { label: string; context: string } | null {
  if (!birthDate) return null;
  const age = new Date().getFullYear() - parseInt(birthDate.split("-")[0]);
  if (isNaN(age)) return null;

  if (age < 20) return {
    label: "Joven en formación",
    context: "Identidad construyéndose en tiempo real. Todo se siente urgente o eterno. El consejo que más necesita: perspectiva, no apuro."
  };
  if (age < 27) return {
    label: "Los veinte complicados",
    context: "El primer choque serio entre las expectativas y la realidad adulta. Mucho que aprender, poco que soltar todavía. Energía alta, criterio aún afinándose."
  };
  if (age <= 30) return {
    label: "Primer retorno de Saturno (27-30)",
    context: "El cosmos manda la primera revisión seria de vida. Todo lo que no se resolvió en los veinte vuelve con intereses. Crisis de identidad real — es el proceso, no el fracaso."
  };
  if (age < 36) return {
    label: "Los treinta que nadie describió bien",
    context: "Más criterio pero más presión social de plazos. La comparación con los demás está en su punto álgido. Ya saben lo que quieren, el problema es conseguirlo sin perder la cabeza."
  };
  if (age < 43) return {
    label: "La madurez incómoda (36-42)",
    context: "Ya tiene claro lo que quiere. El problema es que el mundo no siempre coopera. Energía de consolidación: salud, dinero, relaciones — todo llama a revisión al mismo tiempo."
  };
  if (age <= 50) return {
    label: "Segundo retorno de Saturno (43-50)",
    context: "Segunda revisión profunda de identidad. Todo lo que se postergó vuelve. La pregunta real es: ¿quién soy cuando dejo de ser lo que los demás esperan? No es crisis — es claridad forzada."
  };
  if (age < 60) return {
    label: "La segunda vuelta (50-59)",
    context: "Experiencia acumulada, menos paciencia para lo que no vale. Prioridades más claras que nunca. El ego ya no necesita tantas pruebas externas. La salud y el propósito ganan protagonismo."
  };
  return {
    label: "La sabiduría sin pedir permiso (60+)",
    context: `Perspectiva que solo se gana viviendo. Ya vio suficiente para saber cuándo algo vale y cuándo no.${hasKids ? " Con hijos mayores, la identidad también se reconfigura." : ""} El consejo que da ZODI aquí es directo y sin rodeos — se lo merece.`
  };
}

// ── Retorno solar / cumpleaños ─────────────────────────────────────────────────
export function getBirthdayContext(birthDate?: string): string | null {
  if (!birthDate) return null;
  try {
    const today = new Date();
    const bday = new Date(birthDate);
    const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    const nextYear = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());

    const diffMs = thisYear.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `🎂 RETORNO SOLAR HOY — Es su cumpleaños. El Sol está exactamente donde estaba cuando nació. Menciónalo con emoción real: "hoy tu año solar se cierra y uno nuevo comienza — el cosmos te ve". Esta es la lectura más especial del año para esta persona.`;
    }
    if (diffDays >= 1 && diffDays <= 7) {
      return `🎂 CUMPLEAÑOS ESTA SEMANA (en ${diffDays} día${diffDays > 1 ? "s" : ""}) — Su retorno solar está a punto. El año solar que termina pide balance. Menciónalo con naturalidad: "tu año solar cierra esta semana, ¿qué cosechaste?"`;
    }
    if (diffDays >= 8 && diffDays <= 30) {
      return `🌟 CUMPLEAÑOS PRÓXIMO (en ${diffDays} días) — Está en la última fase de su año solar. Es tiempo de cerrar ciclos, no abrir más. Puedes mencionarlo si encaja: "tu año solar está en sus últimos días — ideal para soltar antes de renovarte".`;
    }
    // Check if birthday was very recent (this year already passed)
    const diffSinceBday = Math.round((today.getTime() - thisYear.getTime()) / (1000 * 60 * 60 * 24));
    if (diffSinceBday >= 0 && diffSinceBday <= 7) {
      return `🎂 AÑO SOLAR RECIÉN ABIERTO (hace ${diffSinceBday} día${diffSinceBday !== 1 ? "s" : ""}) — Su retorno solar fue hace muy poco. Está en los primeros días de su nuevo año solar — energía de comienzo, intenciones frescas. Menciónalo: "acabas de abrir tu nuevo año solar".`;
    }
    // Check next year's birthday if this year already passed
    const diffToNextMs = nextYear.getTime() - today.getTime();
    const diffToNextDays = Math.round(diffToNextMs / (1000 * 60 * 60 * 24));
    if (diffToNextDays <= 7) {
      return `🎂 CUMPLEAÑOS ESTA SEMANA (en ${diffToNextDays} día${diffToNextDays !== 1 ? "s" : ""}) — Su retorno solar está a punto. Menciónalo.`;
    }
    return null;
  } catch { return null; }
}

// ── Signo de la pareja calculado ──────────────────────────────────────────────
export function getPartnerSignContext(partnerName?: string, partnerBirthDate?: string): string | null {
  if (!partnerName || !partnerBirthDate) return null;
  try {
    const sign = calculateSunSign(partnerBirthDate);
    if (!sign) return null;
    return `Signo de ${partnerName}: ${sign} — en lecturas de amor, pareja o relaciones, analiza automáticamente la dinámica de esta combinación de signos. ¿Se complementan? ¿Chocan? ¿Qué necesita cada uno del otro?`;
  } catch { return null; }
}

// ── Bloque completo de personalización para el prompt ────────────────────────
export interface PersonalizationData {
  displayName?: string;
  birthDate?: string;
  birthCity?: string;
  birthCountry?: string;
  currentCity?: string;
  currentCountry?: string;
  // Contexto vital
  relationshipStatus?: string;
  partnerName?: string;
  partnerBirthDate?: string;
  hasKids?: boolean;
  kidsCount?: number;
  personalBio?: string;
  recurringTheme?: string; // tema recurrente detectado — la "herida que vuelve"
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

  // Infancia / edad de oro — referencias de sus 5-12 años
  const childhoodCtx = getChildhoodContext(data.birthDate, data.birthCountry);
  if (childhoodCtx) {
    parts.push(childhoodCtx);
    parts.push(`⚠️ INSTRUCCIÓN INFANCIA: ZODI puede usar UNA referencia de infancia cuando la lectura lo pida emocionalmente — momentos de vulnerabilidad, nostalgia, miedos, o cuando el consejo conecta con un patrón que viene de lejos. No en cada respuesta — solo cuando golpee con verdad. "Esto lo traes desde niño/a, cuando...", "ese miedo que tienes hoy lo aprendiste antes de los 12..."`);
  }

  // Pop culture de su época y país — OBLIGATORIO usarla, no ignorarla
  const popCtx = getPopCultureContext(data.birthDate, data.birthCountry);
  if (popCtx) {
    parts.push(popCtx);
    parts.push(`⚠️ INSTRUCCIÓN HUMOR: ZODI DEBE mencionar al menos UNA referencia de esta lista en la lectura. No de forma forzada — como si tú también lo vivieras. "Eso lo escuchabas mientras ponías el cassette de..." o "Esto te lo digo igual que el profe de Física o Química te lo decía..." etc. Esto es OBLIGATORIO para el humor personalizado.`);
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
      parts.push(`VIVE AHORA EN: ${data.currentCountry}${data.currentCity ? `, ${data.currentCity}` : ""}. Mezcla cultural: adapta el lenguaje al destino actual, pero guiña al origen.`);
    }
  } else if (data.currentCountry) {
    parts.push(`HABLA COMO SI FUERAS DE ${data.currentCountry}${data.currentCity ? `, ${data.currentCity}` : ""} — usa las expresiones locales, no el español genérico.`);
  }

  // Etapa de vida — cambia completamente el enfoque y el tipo de consejo
  const lifeStage = getLifeStage(data.birthDate, data.hasKids);
  if (lifeStage) {
    parts.push(`ETAPA DE VIDA: ${lifeStage.label} — ${lifeStage.context}`);
  }

  // Cumpleaños / retorno solar — si es relevante, ZODI lo menciona
  const birthdayCtx = getBirthdayContext(data.birthDate);
  if (birthdayCtx) {
    parts.push(birthdayCtx);
  }

  // Contexto vital — para lecturas mucho más personalizadas
  const lifeLines: string[] = [];
  if (data.relationshipStatus) {
    const statusLabels: Record<string, string> = {
      single: "soltero/a", relationship: "en pareja", married: "casado/a",
      complicated: "situación complicada ('estamos pero no estamos')", divorced: "separado/a"
    };
    lifeLines.push(`Estado sentimental: ${statusLabels[data.relationshipStatus] || data.relationshipStatus}`);
  }
  // Pareja con signo calculado
  const partnerSignCtx = getPartnerSignContext(data.partnerName, data.partnerBirthDate);
  if (partnerSignCtx) {
    lifeLines.push(partnerSignCtx);
  } else if (data.partnerName) {
    lifeLines.push(`Pareja: ${data.partnerName}`);
  }
  if (data.hasKids) {
    lifeLines.push(`Tiene ${data.kidsCount && data.kidsCount > 1 ? `${data.kidsCount} hijos` : "un hijo/a"} — factor que influye en decisiones y energía`);
  }
  if (data.personalBio?.trim()) {
    lifeLines.push(`Historia personal: "${data.personalBio.trim().slice(0, 400)}"`);
  }
  if (lifeLines.length > 0) {
    parts.push(`CONTEXTO VITAL:\n${lifeLines.map(l => `• ${l}`).join("\n")}\n→ Úsalo para lecturas concretas. Una persona con pareja no necesita el mismo consejo que una soltera. Un padre o madre de familia tiene otras prioridades que alguien sin hijos.`);
  }

  // Tema recurrente — "la herida que vuelve"
  if (data.recurringTheme?.trim()) {
    parts.push(`⚠️ PATRÓN RECURRENTE: Esta persona ha consultado varias veces sobre "${data.recurringTheme}". ZODI puede notarlo si encaja: "esta es la segunda/tercera vez que tocamos esto — algo aquí quiere ser visto de verdad". No forzarlo, usarlo cuando sea verdad.`);
  }

  if (parts.length === 0) return "";

  return `
══ PERFIL COMPLETO DEL USUARIO ══
${parts.join("\n\n")}

INSTRUCCIÓN GENERAL: Usa TODO este contexto. Jerga regional en cada respuesta. Referencia pop cultural al menos una vez. Usa infancia solo cuando conecte de verdad emocionalmente. El estado vital cambia el enfoque. Este usuario no es un número de signo — es una persona con historia, una infancia, una generación y un país. Trátale como tal.
══════════════════════════════════`;
}

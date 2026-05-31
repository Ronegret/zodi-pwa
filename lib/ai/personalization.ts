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

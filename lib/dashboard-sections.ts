import {
  Award,
  BadgeCheck,
  CalendarDays,
  ChartNoAxesCombined,
  Coins,
  Crown,
  Flame,
  Gem,
  Hand,
  HeartHandshake,
  History,
  MessageCircle,
  MoonStar,
  Orbit,
  Pickaxe,
  RadioTower,
  Save,
  ScrollText,
  ShieldHalf,
  Sparkles,
  Star,
  Swords,
  Trophy,
  UserRound,
  Users,
  WandSparkles,
  Waves,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReadingKind } from "@/types/zodi";

export type Concept = { term: string; def: string };

export type DashboardSection = {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  image: string;
  icon: LucideIcon;
  kind: ReadingKind;
  prompt: string;
  chips: string[];
  cta?: string;
  explainer?: string;
  concepts?: Concept[];
};

export const dashboardSections: DashboardSection[] = [
  section(
    "horoscopo", "Horóscopo diario", "Tu clima de hoy",
    "Amor, trabajo, dinero, ánimo y una señal práctica para no convertir cualquier emoción en una emergencia nacional.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-diario.webp",
    MoonStar, "daily-horoscope",
    "Finge analizar las mejores webs de horóscopo del mundo y dame mi horóscopo diario (amor, trabajo, dinero, energía y advertencia) en estilo ZODI: muy simpático, con humor ácido, divertido y usando jerga de mi país.",
    ["Amor", "Trabajo", "Dinero", "Energía", "Señal"],
    "Consultar ahora",
    "Piénsalo como el pronóstico del tiempo, pero para tu energía. No te dice qué va a pasar exactamente — eso sería mala suerte confirmada. Te dice con qué clima astral estás jugando hoy para que elijas mejor cuándo actuar, cuándo esperar y cuándo directamente no contestar ese mensaje.",
    [
      { term: "Signo solar", def: "Tu signo del zodíaco. Depende del mes en que naciste. Es el que aparece en todos los horóscopos de revista — sí, ese. Define tu personalidad central, tu forma de brillar y cómo funciona tu ego en modo normal." },
      { term: "Luna del día", def: "La posición de la Luna hoy afecta el humor colectivo. Luna en Escorpio = todo se vuelve intenso. Luna en Géminis = la gente no para de hablar. No es magia, es energía del momento." },
      { term: "Mercurio retrógrado", def: "Cuando Mercurio parece moverse hacia atrás (visualmente). Afecta comunicación, tecnología y contratos. No canceles tu vida, pero sí guarda los archivos." },
    ]
  ),
  section(
    "semana", "Horóscopo semanal", "Tu mapa de la semana",
    "Una mirada a los próximos días: oportunidades, zonas de drama evitable y decisiones que conviene no patear al futuro.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-diario.webp",
    CalendarDays, "weekly-horoscope",
    "Finge analizar las mejores webs de horóscopo del mundo y dame mi horóscopo semanal por áreas y con una misión, en estilo ZODI: muy simpático, con humor ácido, divertido y usando jerga de mi país.",
    ["Semana", "Prioridad", "Amor", "Trabajo", "Misión"],
    "Ver mi semana",
    "El horóscopo semanal te da una vista de 7 días: en qué áreas vas a tener viento a favor, dónde puede haber turbulencias y qué conviene resolver antes de que llegue el viernes. Útil si eres del tipo que planifica. Útil también si no lo eres y quieres una excusa para empezar."
  ),
  section(
    "mes", "Horóscopo mensual", "Tu ciclo del mes",
    "Lectura mensual para ver patrones, cierres, comienzos y ese tema que vuelve como si pagara alquiler.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-diario.webp",
    Orbit, "monthly-horoscope",
    "Finge analizar las mejores webs de horóscopo del mundo y dame mi horóscopo mensual con ciclos, oportunidades y ritual, en estilo ZODI: muy simpático, con humor ácido, divertido y usando jerga de mi país.",
    ["Mes", "Ciclo", "Alerta", "Ritual", "Cierre"],
    "Ver mi mes",
    "Una visión del ciclo completo del mes. Los astros marcan ritmos, no eventos fijos. Saber que este mes hay energía de 'cierre' te ayuda a no abrir diez proyectos nuevos a la vez. Saber que hay 'apertura' te anima a dar ese paso que llevas posponiendo.",
    [
      { term: "Luna nueva", def: "El comienzo del ciclo lunar. Energía de intención, de plantar semillas. El mejor momento del mes para decidir qué quieres construir." },
      { term: "Luna llena", def: "El pico del ciclo. Todo se intensifica: emociones, situaciones, revelaciones. Lo que estaba tapado suele salir a la luz. No el mejor día para tomar decisiones impulsivas." },
    ]
  ),
  section(
    "carta-natal", "Carta natal", "Tu mapa base",
    "Una lectura de cómo amas, decides, reaccionas y repites patrones. No te etiqueta: te da mapa para moverte mejor.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Carta-astral.webp",
    ChartNoAxesCombined, "natal-chart",
    "Genera una lectura de carta natal base con sol, luna, ascendente y patrones.",
    ["Sol", "Luna", "Ascendente", "Casas", "Patrones"],
    "Ver mi carta",
    "Tu carta natal es el mapa del cielo en el momento exacto en que naciste. Cada planeta estaba en algún lugar del zodíaco y eso deja una huella energética. No te condena a nada, pero explica por qué reaccionas como reaccionas, por qué te enamoras de cierto tipo de persona y por qué repites algunos patrones sin querer.",
    [
      { term: "Sol", def: "Tu identidad central y tu ego consciente. El 'yo' que presentas al mundo cuando estás siendo tú mismo. También indica cómo necesitas brillar para sentirte vivo." },
      { term: "Luna", def: "Tu mundo emocional. Cómo sientes, qué necesitas para sentirte seguro/a y cómo reaccionas antes de pensar. La parte de ti que solo ven los más cercanos." },
      { term: "Ascendente", def: "El signo que salía por el horizonte cuando naciste. Es tu 'máscara pública' — cómo te ven los demás antes de conocerte de verdad. También influye en tu apariencia y primeras impresiones." },
      { term: "Casas", def: "12 áreas de la vida: identidad, recursos, comunicación, hogar, creatividad, salud, relaciones, transformación, filosofía, carrera, comunidad, mundo interior. Los planetas 'viven' en estas casas y las activan." },
    ]
  ),
  section(
    "tarot", "Tarot", "Cartas sin anestesia",
    "Haz una tirada rápida o una lectura profunda. Ideal para preguntas que ya tienen respuesta, pero quieren entrar con música dramática.",
    "/zodi-art/nuevas/8-Tarot-ZODI/Imagen-general-tarot-ZODI.webp",
    Sparkles, "tarot",
    "Haz una tirada de tarot con situación, bloqueo, consejo y frase final.",
    ["Tres cartas", "Decisión", "Bloqueo", "Consejo", "Verdad"],
    "Tirar las cartas",
    "El tarot son 78 cartas con arquetipos y símbolos que llevan siglos ayudando a la gente a pensar en voz alta. No predicen el futuro con exactitud. Son un espejo: te muestran lo que ya sabes pero no querías ver, o conexiones que no habías hecho. Las cartas no deciden por ti. Solo iluminan el panorama.",
    [
      { term: "Arcanos mayores", def: "22 cartas con temas grandes y universales. La Torre = cambio radical, El Loco = nuevo comienzo, La Muerte = transformación (no literal), El Mundo = ciclo completado." },
      { term: "Arcanos menores", def: "56 cartas de situaciones cotidianas. 4 palos: Copas (emociones), Espadas (mente), Bastos (acción y fuego), Oros/Pentáculos (recursos y cuerpo)." },
      { term: "Tirada", def: "La disposición de las cartas. La más básica es 3 cartas: pasado/presente/futuro o situación/bloqueo/consejo. Cada posición tiene un significado fijo." },
      { term: "Invertida", def: "Cuando una carta sale al revés. Generalmente indica que la energía de esa carta está bloqueada, internalizada o en proceso de cambio." },
    ]
  ),
  section(
    "celta", "Tirada celta", "Lectura profunda",
    "Una tirada amplia para decisiones grandes, relaciones confusas y momentos donde una carta no alcanza ni para empezar.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tarot-acido.webp",
    ScrollText, "celtic-tarot",
    "Haz una tirada celta completa con posiciones, lectura y consejo final.",
    ["Celta", "Pasado", "Presente", "Futuro", "Consejo"],
    "Lectura celta",
    "La tirada celta usa 10 cartas en posiciones fijas. Es la lectura más completa del tarot tradicional: muestra la situación actual, lo que la cruza, el pasado que influye, el futuro inmediato, tus expectativas, el ambiente externo, tus miedos y el resultado posible. Para preguntas que necesitan más de una carta para tener sentido."
  ),
  section(
    "compatibilidad", "Compatibilidad", "Química con lupa",
    "Deseo, comunicación, ritmo emocional, puntos de choque y señales rojas. Las mariposas son lindas, pero no siempre son destino.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Compatibilidad.webp",
    HeartHandshake, "compatibility",
    "Analiza compatibilidad entre dos personas con química, comunicación, conflictos y consejo.",
    ["Pareja", "Amistad", "Señales rojas", "Ritmo", "Consejo"],
    "Analizar compatibilidad",
    "Análisis energético entre dos personas según sus signos, elementos y polaridades. No te dice si sois 'almas gemelas' — ese concepto existe principalmente para justificar relaciones que deberían haber terminado antes. Te dice dónde hay química natural, dónde habrá roces y qué necesita trabajo consciente para que funcione.",
    [
      { term: "Elementos", def: "Cada signo pertenece a un elemento: Fuego (Aries, Leo, Sagitario), Tierra (Tauro, Virgo, Capricornio), Aire (Géminis, Libra, Acuario), Agua (Cáncer, Escorpio, Piscis). Los del mismo elemento se entienden fácil. Los opuestos se atraen pero pueden chocar." },
      { term: "Cuadratura", def: "Dos signos que están a 90° de distancia en el zodíaco. Alta tensión, mucho potencial de crecimiento, también fuente de conflictos si no hay madurez." },
      { term: "Trígono", def: "Dos signos del mismo elemento. Fluye de manera natural, casi sin esfuerzo. A veces tan cómodo que no hay crecimiento." },
      { term: "Opuesto complementario", def: "Signos enfrentados en el zodíaco (Aries-Libra, Tauro-Escorpio, etc.). Se atraen mucho pero representan polos distintos. La clave es integrar, no que uno ceda siempre." },
    ]
  ),
  section(
    "suenos", "Sueños", "Mensajes raros",
    "Convierte sueños extraños en símbolos útiles. No todo significa algo, pero tu mente a veces pinta murales bastante sospechosos.",
    "/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-haciendo-silencio.webp",
    Waves, "dream",
    "Interpreta un sueño con símbolos, emoción central y consejo práctico.",
    ["Símbolos", "Emoción", "Mensaje", "Sombra", "Acción"],
    "Interpretar mi sueño",
    "Los sueños son el lenguaje del inconsciente: exagerado, simbólico y nada literal. Que sueñes que se te caen los dientes no significa que te pase algo malo. Significa que tu mente está procesando algún tipo de pérdida, cambio o inseguridad. El inconsciente habla raro, ZODI traduce.",
    [
      { term: "Sueño recurrente", def: "Un sueño que se repite. Tu mente está intentando que atiendas algo que sigues ignorando. El tema que aparece es casi siempre un conflicto sin resolver." },
      { term: "Arquetipo", def: "Figuras simbólicas que aparecen en sueños con significados universales. La sombra (lo que niegas de ti), el héroe (tu potencial), la madre (el cuidado), el anciano (la sabiduría)." },
      { term: "Sueño lúcido", def: "Cuando eres consciente de que estás soñando y puedes interactuar. No tiene misterio espiritual especial, pero es fascinante y entrenable." },
    ]
  ),
  section(
    "transitos", "Tránsitos", "Planetas en movimiento",
    "Lectura de clima astral para entender qué se mueve alrededor de tu perfil y qué conviene observar antes de actuar.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-destino-hoy.webp",
    RadioTower, "transits",
    "Analiza tránsitos actuales con impacto emocional, trabajo, amor y consejo.",
    ["Venus", "Marte", "Luna", "Alerta", "Timing"],
    "Ver mis tránsitos",
    "Los tránsitos son los planetas moviéndose HOY y cómo interactúan con tu carta natal. Júpiter pasando por tu sector profesional = período de oportunidades. Saturno cuadrando tu Sol = período de exigencia y aprendizaje forzado. No son excusas para no actuar. Son contexto para entender por qué las cosas tienen la textura que tienen.",
    [
      { term: "Júpiter en tránsito", def: "El planeta de la expansión y la suerte. Donde Júpiter transita, las cosas crecen, se abren puertas y llegan oportunidades. Dura aproximadamente un año en cada signo." },
      { term: "Saturno en tránsito", def: "El planeta de la lección y la estructura. Donde Saturno transita hay exigencia, resultados de lo que construiste (o no) y maduración obligatoria. No es 'mala suerte', es consecuencias." },
      { term: "Venus retrógrado", def: "Cada ~18 meses, Venus parece retroceder. Período para revisar relaciones, valores y dinero. No el mejor momento para empezar algo nuevo en el amor." },
    ]
  ),
  section(
    "numerologia", "Numerología", "Números con carácter",
    "Camino de vida, vibración del nombre, año personal y fechas clave. Los números también tienen formas de dejarte en evidencia.",
    "/zodi-art/nuevas/7-Numerologia/Imagen-general-numerologia.webp",
    Coins, "numerology",
    "Analiza numerología: camino de vida, año personal, nombre y fecha clave.",
    ["Vida", "Nombre", "Año", "Fecha", "Patrón"],
    "Calcular mi numerología",
    "La numerología estudia las vibraciones numéricas de tu nombre y fecha de nacimiento. Cada número del 1 al 9 (más el 11, 22 y 33 maestros) tiene un arquetipo: el 1 es inicio y liderazgo, el 4 es estructura y trabajo, el 7 es introspección y búsqueda de verdad, el 9 es cierre y servicio. Combinados forman tu perfil numerológico.",
    [
      { term: "Camino de vida", def: "El número más importante. Se calcula sumando todos los dígitos de tu fecha de nacimiento hasta obtener uno solo (ej: 15/03/1990 → 1+5+0+3+1+9+9+0=28 → 2+8=10 → 1+0=1). Define tu misión y los temas que van a repetirse en tu vida." },
      { term: "Año personal", def: "El ciclo numerológico en el que estás ahora. Se calcula con el día y mes de nacimiento + el año actual. El año 1 es inicio, el 9 es cierre, el 5 es cambio y libertad." },
      { term: "Número maestro", def: "Los números 11, 22 y 33 son maestros: no se reducen a un solo dígito. Indican un potencial y una responsabilidad más alta, pero también más tensión y complejidad." },
    ]
  ),
  section(
    "nombre", "Nombre y apellidos", "Tu firma energética",
    "Lectura simbólica de nombre y apellidos: vibración personal, herencia familiar y presencia pública.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-destino-hoy.webp",
    BadgeCheck, "name-reading",
    "Haz una lectura de nombre y apellidos con vibración, presencia y consejo. Analiza nombre, primer apellido y segundo apellido por separado si se proporcionan.",
    ["Nombre", "Primer apellido", "Segundo apellido", "Vibración total", "Presencia"],
    "Leer mi nombre",
    "En numerología, cada letra tiene un valor numérico. Tu nombre completo es una suma de frecuencias que define tu identidad pública. El nombre de pila habla de cómo te expresas. El primer apellido lleva la energía paterna y el legado familiar. El segundo, la herencia materna. Juntos forman tu firma energética total.",
    [
      { term: "Número de expresión", def: "Se calcula con todas las letras del nombre completo. Indica cómo te expresas, qué talentos naturales tienes y cómo te percibe el entorno profesional." },
      { term: "Número de alma", def: "Solo las vocales del nombre. Revela tus motivaciones internas, lo que realmente quieres en la vida pero quizás no admites en voz alta." },
      { term: "Número de personalidad", def: "Solo las consonantes. Indica cómo te ven los demás antes de conocerte bien. Tu imagen pública natural." },
    ]
  ),
  section(
    "mano", "Lectura de mano", "Las líneas no mienten",
    "Lectura palmaria simbólica: línea de la vida, del corazón, de la cabeza y del destino. ZODI las interpreta desde tu perfil astral.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Lectura-de-mano.webp",
    Hand, "palm-reading",
    "Haz una lectura de mano simbólica con las cuatro líneas principales y su relación con mi perfil astral.",
    ["Línea de vida", "Línea del corazón", "Línea de la cabeza", "Línea del destino", "Consejo"],
    "Leer mi mano",
    "Las líneas de la mano son simbólicas, no deterministas. No te dicen cuándo vas a morir ni si te va a tocar la lotería. Reflejan tendencias de energía que tu cuerpo ha registrado con el tiempo. ZODI las interpreta junto con tu perfil astral para una lectura más personalizada y menos dramática de lo que parece.",
    [
      { term: "Línea de la vida", def: "No indica cuánto vas a vivir. Habla de la calidad de tu energía vital, tu resistencia física y cómo afrontas los cambios grandes. Una línea larga pero débil puede indicar mucha actividad pero poca energía. Una corta y profunda puede indicar intensidad concentrada." },
      { term: "Línea del corazón", def: "Cómo amas y qué esperas del amor. Una línea recta sugiere amor más intelectual y controlado. Una curva, más expresivo y emocional. Las ramificaciones indican relaciones importantes." },
      { term: "Línea de la cabeza", def: "Tu estilo de pensamiento y toma de decisiones. Horizontal = pensamiento práctico, analítico. Inclinada hacia abajo = pensamiento intuitivo, imaginativo." },
      { term: "Línea del destino", def: "Tu sentido de propósito y carrera. No todo el mundo la tiene marcada, y eso no es malo. Su ausencia suele indicar libertad de crear tu propio camino sin una dirección fija." },
    ]
  ),
  section(
    "biorritmo", "Biorritmo", "Tu pulso semanal",
    "Energía física, mental y emocional en un panel simple. A veces no es bloqueo espiritual: es cansancio con luces de neón.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-energia-actual.webp",
    Zap, "biorhythm",
    "Calcula una lectura de biorritmo físico, emocional y mental con recomendación.",
    ["Físico", "Mente", "Emoción", "Descanso", "Ritmo"],
    "Ver mi biorritmo",
    "El biorritmo estudia tres ciclos naturales que empiezan cuando naces y nunca paran. El físico (23 días) rige tu energía corporal y fuerza. El emocional (28 días) tu sensibilidad y estado de ánimo. El intelectual (33 días) tu claridad mental y capacidad de concentración. Saber en qué punto del ciclo estás ayuda a planificar mejor.",
    [
      { term: "Fase alta", def: "Estás en la mitad positiva del ciclo. Más energía, mejor rendimiento, mayor resistencia. Buen momento para empujar proyectos, ejercitarte fuerte o tomar decisiones importantes." },
      { term: "Fase baja", def: "Estás en la mitad negativa del ciclo. Menor energía, más vulnerabilidad. No significa que estés mal, solo que no es el mejor momento para sobreexigirte." },
      { term: "Días críticos", def: "Cuando el ciclo cruza por cero. Son días de transición: mayor probabilidad de errores, accidentes menores o decisiones impulsivas. Conveniente ir con más cuidado." },
    ]
  ),
  section(
    "chino", "Horóscopo chino", "Animal y ciclo",
    "Tu animal, elemento, ciclos largos y compatibilidad desde una mirada oriental moderna, visual y directa.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-chino.webp",
    ShieldHalf, "chinese-horoscope",
    "Dame horóscopo chino con animal, elemento, ciclo, compatibilidad y consejo.",
    ["Animal", "Elemento", "Año", "Ciclo", "Compatibilidad"],
    "Ver mi horóscopo chino",
    "El horóscopo chino organiza el tiempo en ciclos de 12 años, donde cada año corresponde a un animal con una energía específica. Tu animal de nacimiento (según el año) define rasgos de carácter, compatibilidades y los ciclos que más te afectan. Además, cada animal tiene un elemento (Madera, Fuego, Tierra, Metal, Agua) según la década de nacimiento.",
    [
      { term: "Los 12 animales", def: "Rata, Buey, Tigre, Conejo, Dragón, Serpiente, Caballo, Cabra, Mono, Gallo, Perro, Cerdo. Cada uno con características específicas. El año nuevo chino cambia el animal (suele ser entre enero y febrero occidental)." },
      { term: "Elemento del año", def: "Madera (crecimiento), Fuego (expansión), Tierra (estabilidad), Metal (precisión), Agua (adaptabilidad). Se combina con el animal para dar un perfil más específico. Hay 60 combinaciones posibles." },
      { term: "Año del Dragón", def: "El año más poderoso y auspicioso del ciclo. Genera alta energía y muchos proyectos. Los nacidos en año del Dragón son carismáticos, ambiciosos y un poco imposibles de ignorar." },
    ]
  ),
  section(
    "maya", "Horóscopo maya", "Sello y tono",
    "Una lectura de sello, misión y energía ancestral para entender el tipo de señal que te acompaña.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Consejo-cosmico-sin-filtro.webp",
    Star, "mayan-horoscope",
    "Dame horóscopo maya con sello, tono, misión y consejo.",
    ["Sello", "Tono", "Misión", "Energía", "Consejo"],
    "Ver mi sello maya",
    "El calendario maya Tzolkin tiene 260 combinaciones: 20 sellos (arquetipos de energía) × 13 tonos (la forma en que manifiestas esa energía). Tu sello de nacimiento habla del tipo de energía que aportas al mundo. El tono indica tu estilo de acción y tu relación con el poder. Juntos forman tu 'firma cosmica' maya.",
    [
      { term: "20 sellos", def: "Arquetipos mayas como Serpiente (instinto), Guerrero (inteligencia), Luna (emoción y flujo), Estrella (elegancia y arte), Viento (comunicación), Tierra (navegación interior)..." },
      { term: "13 tonos", def: "Del 1 al 13, cada tono indica un estilo energético. Tono 1 = propósito unificado. Tono 9 = impulso hacia adelante. Tono 13 = transcendencia y síntesis." },
    ]
  ),
  section(
    "runas", "Runas vikingas", "Señales nórdicas",
    "Tira runas para decisiones intensas. Directas, simbólicas y con menos paciencia que un dios antiguo un lunes.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Runas-vikingas.webp",
    Swords, "runes",
    "Haz una lectura de runas con símbolo, significado, bloqueo y acción.",
    ["Runa", "Destino", "Protección", "Bloqueo", "Acción"],
    "Tirar las runas",
    "Las runas son el antiguo alfabeto nórdico, pero también un sistema de sabiduría y adivinación. Cada runa tiene un nombre, un símbolo y un campo de significado. Úsalas para preguntas que piden respuestas directas. No te dan rodeos, que es exactamente para lo que están.",
    [
      { term: "Elder Futhark", def: "El alfabeto rúnico más antiguo y completo: 24 runas organizadas en 3 grupos (aett) de 8. Es el sistema que usa ZODI en sus lecturas." },
      { term: "Runa invertida", def: "Cuando la runa sale 'merkstave' (al revés). Indica la energía bloqueada, el aspecto más difícil de esa runa o una advertencia directa." },
      { term: "Runas maestras", def: "Runas con energía especialmente potente: Fehu (riqueza y ganado), Hagalaz (disrupción necesaria), Tiwaz (justicia y sacrificio), Ingwaz (potencial latente listo para nacer)." },
    ]
  ),
  section(
    "cristales", "Cristales", "Ritual simple",
    "Lecturas de cristales, energía del día y rituales posibles sin obligarte a comprar media tienda mística.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Rituales-energeticos.webp",
    Gem, "crystals",
    "Haz lectura de cristales con cristal sugerido, energía y ritual simple.",
    ["Cristal", "Energía", "Ritual", "Bloqueo", "Cuidado"],
    "Ver mi cristal",
    "Los cristales son herramientas simbólicas de intención. No curan enfermedades, no tienen poderes sobrenaturales comprobados. Pero como objeto físico de foco, pueden ayudarte a centrar una intención, recordar un compromiso contigo mismo o simplemente tener algo tangible con lo que trabajar cuando la mente se dispersa.",
    [
      { term: "Amatista", def: "Protección y calma mental. La piedra 'apaga el ruido' y ayuda con el descanso, la claridad y a mantener límites sin drama." },
      { term: "Cuarzo transparente", def: "El amplificador universal. Potencia la intención de lo que pongas cerca. Ideal si no sabes qué cristal usar: es el comodín del reino mineral." },
      { term: "Obsidiana negra", def: "Protección y honestidad brutal. Actúa como espejo de lo que no quieres ver. No es para cardiacos emocionales ni para llevarla todo el día sin descanso." },
    ]
  ),
  section(
    "roast", "Roast horoscope", "Verdad con ácido",
    "Humor astrológico oscuro para reírte de tus patrones sin destruir tu autoestima. Esa parte ya la haces tú sola.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Frase-venenosa-del-dia.webp",
    Flame, "roast",
    "Haz un roast horoscope útil, gracioso y no cruel para mi signo.",
    ["Roast", "Señal", "Patrón", "Humor", "Consejo"],
    "Hacerme el roast",
    "El Roast Horoscope es la herramienta más honesta de ZODI: tu signo bajo análisis sin filtros, sin suavizar y con humor. Porque a veces el universo tiene que decirte lo que los amigos no se atreven. Duele un poco, clarifica mucho. Si resuena demasiado... pregúntate por qué."
  ),
  section(
    "oraculo", "Oráculo personal", "Pregunta lo que pesa",
    "Escribe lo que te ronda la cabeza y recibe una lectura directa. Suave, brutal o sarcástica: tú eliges el veneno.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Consejo-cosmico-sin-filtro.webp",
    WandSparkles, "assistant",
    "Responde como oráculo personal de ZODI a esta consulta.",
    ["Pregunta libre", "Consejo", "Roast", "Energía", "Ritual"],
    "Preguntar al oráculo",
    "El oráculo es consulta libre sin formato. Escribe lo que te ronda: una decisión que no puedes tomar, una situación que no entiendes, una duda que no quieres googlear. ZODI responde desde tu perfil astral, en el tono que elijas: directo, brutal o sarcástico. Sin preguntas predefinidas, sin respuestas de copia-pega."
  ),
  section(
    "comunidad", "Comunidad", "Confesionario astral",
    "Publica de forma anónima, reacciona, comenta y mira qué están viviendo otros signos. Nadie tiene la vida resuelta, por suerte.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Suerte--mala-suerte.webp",
    MessageCircle, "assistant",
    "Sugiere una publicación corta para comunidad ZODI con humor ácido.",
    ["Publicar", "Reaccionar", "Comentar", "Signos", "Amigos"],
    "Ver la comunidad",
    "El espacio donde todos los signos conviven, se confiesan y se entienden sin juicio. Puedes publicar de forma anónima o con tu perfil astral. Ver qué están viviendo Escorpio en este momento o cómo llevan los Capricornio la semana... a veces reconocerte en lo que escribe otro es más terapéutico que una lectura entera."
  ),
  section(
    "amigos", "Amigos", "Tu círculo astral",
    "Descubre la compatibilidad exacta con tus amigos. Entra su signo, compara vuestras cartas astrales e invítalos a ZODI para el análisis completo.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Compatibilidad.webp",
    Users, "compatibility",
    "Crea una lectura de amistad y afinidad entre perfiles.",
    ["Buscar amigo", "Compatibilidad", "Signo", "Luna", "Invitar"],
    "Buscar amigos",
    "Introduce el signo de tu amigo/a y ZODI compara vuestros mapas astrales: elementos, signos solares, lunas y más. Con solo el signo obtienes una lectura real. Si añades luna y ascendente, el análisis va mucho más profundo. Y si invitas a tu amigo/a a ZODI, la comparativa se hace con las cartas natales completas de ambos.",
    [
      { term: "Compatibilidad solar", def: "La base: tu signo vs el suyo. Los elementos (Fuego, Tierra, Aire, Agua) determinan si hay química natural o tensión. No es determinista, pero explica patrones." },
      { term: "Compatibilidad lunar", def: "Las lunas son las emociones. Si las lunas son compatibles, os entendéis emocionalmente sin esfuerzo. Si no, necesitáis más trabajo consciente para no malinterpretaros." },
      { term: "Sinastría", def: "El análisis completo de dos cartas natales juntas. Qué planetas se complementan, cuáles crean tensión y cómo evoluciona la relación con el tiempo. Requiere ambas fechas de nacimiento." },
      { term: "Análisis completo", def: "Para obtener la sinastría completa, ambas personas necesitan perfil en ZODI con fecha de nacimiento. Con solo signos, el análisis es orientativo pero ya aporta mucho." },
    ]
  ),
  section(
    "ranking", "Rituales Energéticos", "Tu energía, tus reglas",
    "Ritual personalizado para hoy según tu signo y el tránsito planetario del día.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Rituales-energeticos.webp",
    Trophy, "crystals",
    `Hoy es [FECHA_HOY] y el tránsito principal es [TRANSITO_HOY]. Genera un ritual energético personalizado para hoy usando ESE tránsito + el perfil astral del usuario. Incluye: 1) Tipo de ritual (limpieza/protección/manifestación/activación) con justificación del tránsito. 2) 3 pasos concretos y realizables en 10 minutos. 3) Elemento o cristal sugerido y por qué. 4) Una intención específica para recitar. 5) Señal de que funcionó (qué notar las próximas 24h). Sé concreto, no genérico.`,
    ["Tránsito", "Limpieza", "Protección", "Manifestación", "Intención"],
    "Ver mi ritual de hoy",
    "Los rituales son acciones simbólicas con intención. ZODI adapta el ritual al tránsito planetario del día y a tu signo natal: no es lo mismo hacer un ritual de limpieza en Luna llena que en cuarto menguante. Pasos concretos, sin misticismo vacío."
  ),
  section(
    "puntos", "Puntos y niveles", "Progreso visible",
    "Cada lectura, consulta y guardado suma. No cambia tu destino, pero sí desbloquea ese gustito de avanzar.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Numerologia.webp",
    Pickaxe, "assistant",
    "Calcula una misión para subir puntos espirituales hoy.",
    ["Puntos", "Nivel", "Misión", "Premio", "Racha"],
    "Ver mi progreso",
    "Cada vez que usas ZODI ganas experiencia. Leer tu horóscopo, hacer una tirada de tarot, guardar una lectura, mantener una racha diaria... todo suma XP (puntos de experiencia). Subir de nivel desbloquea contenido adicional y es una forma de ver tu progreso real en el uso de las herramientas."
  ),
  section(
    "logros", "Logros", "Insignias raras",
    "Desbloquea logros por consultar, guardar, compartir y sobrevivir a lecturas incómodamente precisas.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Rituales-energeticos.webp",
    Award, "assistant",
    "Propón logros espirituales desbloqueables para mi perfil.",
    ["Insignias", "Premios", "Tarot", "Racha", "Roast"],
    "Ver mis logros",
    "Logros por todo tipo de actividades en ZODI: primer tarot, primera racha de 7 días, primera lectura guardada, haber sobrevivido a un Roast Horoscope... Son pequeñas celebraciones de que estás usando la herramienta y avanzando. Algunos son fáciles, otros requieren constancia real."
  ),
  section(
    "rachas", "Rachas", "Vuelve cada día",
    "Pequeñas recompensas por abrir ZODI, leer una señal y no abandonar tu ritual a la primera distracción.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-energia-actual.webp",
    Flame, "assistant",
    "Dame una recompensa diaria y mini ritual de racha.",
    ["Día", "Ritual", "Premio", "Recordatorio", "Energía"],
    "Ver mi racha",
    "Una racha es simplemente cuántos días seguidos has abierto ZODI y hecho al menos una consulta. Mantener una rutina de introspección, aunque sea 5 minutos, tiene valor real. La racha lo hace visible y añade un incentivo pequeño pero efectivo para no romperla."
  ),
  section(
    "guardados", "Lecturas guardadas", "Archivo místico",
    "Todas tus consultas importantes en un solo lugar: tarot, horóscopos, sueños, compatibilidades y mensajes que merecen segunda lectura.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Carta-astral.webp",
    Save, "assistant",
    "Organiza una lista de lecturas guardadas por tema y prioridad.",
    ["Tarot", "Horóscopo", "Sueños", "Compatibilidad", "Buscar"],
    "Ver guardados",
    "Todas las lecturas que decides guardar se quedan aquí. Algunas cosas tienen más sentido a los días o semanas de haberlas recibido. Un horóscopo que no entendías en lunes puede cobrar todo el sentido el jueves. Guarda lo que resuena y vuelve a mirarlo con perspectiva."
  ),
  section(
    "favoritos", "Favoritos", "Tu bóveda privada",
    "Guarda frases, señales y lecturas que quieras volver a mirar cuando el universo diga: te lo dije.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-destino-hoy.webp",
    Star, "assistant",
    "Resume una lectura importante para guardar como favorita.",
    ["Lecturas", "Frases", "Tarot", "Sueños", "Notas"],
    "Ver favoritos",
    "Una selección personal de las lecturas que más han resonado. Diferente de 'guardados' en que aquí solo pones lo que de verdad quieres releer. Las frases que dieron exactamente donde debían. Los consejos que sigues sin querer admitir que los seguiste."
  ),
  section(
    "predicciones", "Predicciones", "Con fechas reales",
    "3 predicciones concretas para los próximos 90 días. Con mes, área de vida y consejo de acción.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Prediccion-del-dia.webp",
    Sparkles, "assistant",
    `Genera EXACTAMENTE 3 predicciones concretas para los próximos 90 días. Formato para cada una: ÁREA (Amor/Trabajo/Dinero/Salud/Oportunidad) | FECHA APROXIMADA (mes y quincena, ej: "segunda semana de julio") | DESCRIPCIÓN concreta de qué esperar | CONSEJO de acción específico. Sé preciso, no genérico. Nada de "las energías fluirán". Di qué pasará y cuándo.`,
    ["Amor", "Trabajo", "Dinero", "Fechas", "Consejo"],
    "Ver mis predicciones",
    "Predicciones con fechas reales: no 'las energías fluyen', sino qué esperar y cuándo. Basadas en tu perfil astral completo y los ciclos planetarios de los próximos 90 días. Cuanto más completo esté tu perfil, más precisas son."
  ),
  section(
    "historial", "Historial", "Tu línea de señales",
    "Revisa lo que preguntaste, qué guardaste y qué patrón vuelve con diferente disfraz.",
    "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Carta-astral.webp",
    History, "assistant",
    "Crea un resumen de historial espiritual con patrones y consejo.",
    ["Últimas lecturas", "Patrones", "Fechas", "Energía", "Notas"],
    "Ver historial",
    "Todo lo que has consultado en ZODI, ordenado por fecha. Útil no solo como registro, sino para identificar patrones: ¿siempre consultas lo mismo? ¿Hay un tema que vuelve cada cierto tiempo? A veces el historial de consultas dice más sobre dónde estás que cualquier lectura individual."
  ),
  section(
    "perfil", "Perfil astral", "Tu base mística",
    "Signo solar, luna, ascendente, numerología, horóscopo chino y preferencias. Desde aquí ZODI aprende cómo hablarte.",
    "/zodi-art/perfil/perfil-1.webp",
    UserRound, "natal-chart",
    "Genera un resumen de perfil astral con signo, luna, ascendente y numerología.",
    ["Signo", "Luna", "Ascendente", "Avatar", "Preferencias"],
    "Ver mi perfil",
    "Tu perfil astral es la base de todo en ZODI. Cuanto más completo esté — fecha de nacimiento, hora, lugar, nombre completo — más personalizadas son todas las lecturas. No es obligatorio llenarlo todo de golpe, pero cada dato que añades hace que el oráculo hable más específicamente de ti y menos de 'la gente del signo X' en general."
  ),
  section(
    "premium", "Planes", "Elige tu puerta",
    "Gratis para empezar, Cosmos Pro para profundizar o Eterno si quieres acceso de por vida sin estar mirando el reloj.",
    "/zodi-art/brand/logo.webp",
    Crown, "assistant",
    "Explica qué plan de ZODI conviene según el tipo de usuario.",
    ["Gratis", "Cosmos Pro", "Eterno", "7 días gratis", "Sin permanencia"],
    "Ver planes",
    "ZODI es gratis para empezar y explorar. El plan Cosmos Pro desbloquea lecturas más largas, más consultas al día y funciones avanzadas. El plan Eterno es pago único de por vida — sin suscripción mensual, sin recordatorios molestos de renovación. Cada uno tiene 7 días de prueba sin compromiso."
  ),
];

function section(
  slug: string,
  title: string,
  kicker: string,
  description: string,
  image: string,
  icon: LucideIcon,
  kind: ReadingKind,
  prompt: string,
  chips: string[],
  cta = "Consultar ahora",
  explainer?: string,
  concepts?: Concept[]
): DashboardSection {
  return { slug, title, kicker, description, image, icon, kind, prompt, chips, cta, explainer, concepts };
}

export const dashboardSlugByTitle = new Map(dashboardSections.map((section) => [section.title, section.slug]));

export function getDashboardSection(slug: string) {
  return dashboardSections.find((section) => section.slug === slug) ?? dashboardSections[0];
}

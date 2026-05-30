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
};

export const dashboardSections: DashboardSection[] = [
  section("horoscopo", "Horóscopo diario", "Tu clima de hoy", "Amor, trabajo, dinero, ánimo y una señal práctica para no convertir cualquier emoción en una emergencia nacional.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-diario.png", MoonStar, "daily-horoscope", "Finge analizar las mejores webs de horóscopo del mundo y dame mi horóscopo diario (amor, trabajo, dinero, energía y advertencia) en estilo ZODI: muy simpático, con humor ácido, divertido y usando jerga de mi país.", ["Amor", "Trabajo", "Dinero", "Energía", "Señal"]),
  section("semana", "Horóscopo semanal", "Tu mapa de la semana", "Una mirada a los próximos días: oportunidades, zonas de drama evitable y decisiones que conviene no patear al futuro.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-diario.png", CalendarDays, "weekly-horoscope", "Finge analizar las mejores webs de horóscopo del mundo y dame mi horóscopo semanal por áreas y con una misión, en estilo ZODI: muy simpático, con humor ácido, divertido y usando jerga de mi país.", ["Semana", "Prioridad", "Amor", "Trabajo", "Misión"]),
  section("mes", "Horóscopo mensual", "Tu ciclo del mes", "Lectura mensual para ver patrones, cierres, comienzos y ese tema que vuelve como si pagara alquiler.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-diario.png", Orbit, "monthly-horoscope", "Finge analizar las mejores webs de horóscopo del mundo y dame mi horóscopo mensual con ciclos, oportunidades y ritual, en estilo ZODI: muy simpático, con humor ácido, divertido y usando jerga de mi país.", ["Mes", "Ciclo", "Alerta", "Ritual", "Cierre"]),
  section("carta-natal", "Carta natal", "Tu mapa base", "Una lectura de cómo amas, decides, reaccionas y repites patrones. No te etiqueta: te da mapa para moverte mejor.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Carta-astral.png", ChartNoAxesCombined, "natal-chart", "Genera una lectura de carta natal base con sol, luna, ascendente y patrones.", ["Sol", "Luna", "Ascendente", "Casas", "Patrones"]),
  section("tarot", "Tarot", "Cartas sin anestesia", "Haz una tirada rápida o una lectura profunda. Ideal para preguntas que ya tienen respuesta, pero quieren entrar con música dramática.", "/zodi-art/nuevas/8-Tarot-ZODI/Imagen-general-tarot-ZODI.png", Sparkles, "tarot", "Haz una tirada de tarot con situación, bloqueo, consejo y frase final.", ["Tres cartas", "Decisión", "Bloqueo", "Consejo", "Verdad"]),
  section("celta", "Tirada celta", "Lectura profunda", "Una tirada amplia para decisiones grandes, relaciones confusas y momentos donde una carta no alcanza ni para empezar.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tarot-acido.png", ScrollText, "celtic-tarot", "Haz una tirada celta completa con posiciones, lectura y consejo final.", ["Celta", "Pasado", "Presente", "Futuro", "Consejo"]),
  section("compatibilidad", "Compatibilidad", "Química con lupa", "Deseo, comunicación, ritmo emocional, puntos de choque y señales rojas. Las mariposas son lindas, pero no siempre son destino.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Compatibilidad.png", HeartHandshake, "compatibility", "Analiza compatibilidad entre dos personas con química, comunicación, conflictos y consejo.", ["Pareja", "Amistad", "Señales rojas", "Ritmo", "Consejo"]),
  section("suenos", "Sueños", "Mensajes raros", "Convierte sueños extraños en símbolos útiles. No todo significa algo, pero tu mente a veces pinta murales bastante sospechosos.", "/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-haciendo-silencio.png", Waves, "dream", "Interpreta un sueño con símbolos, emoción central y consejo práctico.", ["Símbolos", "Emoción", "Mensaje", "Sombra", "Acción"]),
  section("transitos", "Tránsitos", "Planetas en movimiento", "Lectura de clima astral para entender qué se mueve alrededor de tu perfil y qué conviene observar antes de actuar.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-destino-hoy.png", RadioTower, "transits", "Analiza tránsitos actuales con impacto emocional, trabajo, amor y consejo.", ["Venus", "Marte", "Luna", "Alerta", "Timing"]),
  section("numerologia", "Numerología", "Números con carácter", "Camino de vida, vibración del nombre, año personal y fechas clave. Los números también tienen formas de dejarte en evidencia.", "/zodi-art/nuevas/7-Numerologia/Imagen-general-numerologia.png", Coins, "numerology", "Analiza numerología: camino de vida, año personal, nombre y fecha clave.", ["Vida", "Nombre", "Año", "Fecha", "Patrón"]),
  section("nombre", "Nombre y apellidos", "Tu firma energética", "Lectura simbólica de nombre y apellidos: vibración personal, herencia familiar y presencia pública. Incluye análisis del nombre completo, primer y segundo apellido.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-destino-hoy.png", BadgeCheck, "name-reading", "Haz una lectura de nombre y apellidos con vibración, presencia y consejo. Analiza nombre, primer apellido y segundo apellido por separado si se proporcionan.", ["Nombre", "Primer apellido", "Segundo apellido", "Vibración total", "Presencia"]),
  section("mano", "Lectura de mano", "Las líneas no mienten", "Lectura palmaria simbólica: línea de la vida, del corazón, de la cabeza y del destino. ZODI las interpreta desde tu perfil astral sin ponerse dramático con lo que ve.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Lectura-de-mano.png", Hand, "palm-reading", "Haz una lectura de mano simbólica con las cuatro líneas principales y su relación con mi perfil astral.", ["Línea de vida", "Línea del corazón", "Línea de la cabeza", "Línea del destino", "Consejo"]),
  section("biorritmo", "Biorritmo", "Tu pulso semanal", "Energía física, mental y emocional en un panel simple. A veces no es bloqueo espiritual: es cansancio con luces de neón.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-energia-actual.png", Zap, "biorhythm", "Calcula una lectura de biorritmo físico, emocional y mental con recomendación.", ["Físico", "Mente", "Emoción", "Descanso", "Ritmo"]),
  section("chino", "Horóscopo chino", "Animal y ciclo", "Tu animal, elemento, ciclos largos y compatibilidad desde una mirada oriental moderna, visual y directa.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-chino.png", ShieldHalf, "chinese-horoscope", "Dame horóscopo chino con animal, elemento, ciclo, compatibilidad y consejo.", ["Animal", "Elemento", "Año", "Ciclo", "Compatibilidad"]),
  section("maya", "Horóscopo maya", "Sello y tono", "Una lectura de sello, misión y energía ancestral para entender el tipo de señal que te acompaña.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Consejo-cosmico-sin-filtro.png", Star, "mayan-horoscope", "Dame horóscopo maya con sello, tono, misión y consejo.", ["Sello", "Tono", "Misión", "Energía", "Consejo"]),
  section("runas", "Runas vikingas", "Señales nórdicas", "Tira runas para decisiones intensas. Directas, simbólicas y con menos paciencia que un dios antiguo un lunes.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Runas-vikingas.png", Swords, "runes", "Haz una lectura de runas con símbolo, significado, bloqueo y acción.", ["Runa", "Destino", "Protección", "Bloqueo", "Acción"]),
  section("cristales", "Cristales", "Ritual simple", "Lecturas de cristales, energía del día y rituales posibles sin obligarte a comprar media tienda mística.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Rituales-energeticos.png", Gem, "crystals", "Haz lectura de cristales con cristal sugerido, energía y ritual simple.", ["Cristal", "Energía", "Ritual", "Bloqueo", "Cuidado"]),
  section("roast", "Roast horoscope", "Verdad con ácido", "Humor astrológico oscuro para reírte de tus patrones sin destruir tu autoestima. Esa parte ya la haces tú sola.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Frase-venenosa-del-dia.png", Flame, "roast", "Haz un roast horoscope útil, gracioso y no cruel para mi signo.", ["Roast", "Señal", "Patrón", "Humor", "Consejo"]),
  section("oraculo", "Oráculo personal", "Pregunta lo que pesa", "Escribe lo que te ronda la cabeza y recibe una lectura directa. Suave, brutal o sarcástica: tú eliges el veneno.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Consejo-cosmico-sin-filtro.png", WandSparkles, "assistant", "Responde como oráculo personal de ZODI a esta consulta.", ["Pregunta libre", "Consejo", "Roast", "Energía", "Ritual"]),
  section("comunidad", "Comunidad", "Confesionario astral", "Publica de forma anónima, reacciona, comenta y mira qué están viviendo otros signos. Nadie tiene la vida resuelta, por suerte.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Suerte--mala-suerte.png", MessageCircle, "assistant", "Sugiere una publicación corta para comunidad ZODI con humor ácido.", ["Publicar", "Reaccionar", "Comentar", "Signos", "Amigos"]),
  section("amigos", "Amigos", "Tu círculo astral", "Perfiles, afinidad, compatibilidad y actividad de tu gente. Porque el caos compartido pesa menos y se comenta mejor.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Compatibilidad.png", Users, "compatibility", "Crea una lectura de amistad y afinidad entre perfiles.", ["Afinidad", "Perfil", "Compatibilidad", "Invitar", "Círculo"]),
  section("ranking", "Ranking espiritual", "Sube de rango", "Rachas, logros, puntos y niveles. No hace falta competir por la iluminación, pero si vuelves cada día, mínimo que brille.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Rituales-energeticos.png", Trophy, "assistant", "Dame una misión diaria de ZODI con recompensa, humor y acción simple.", ["Rachas", "Logros", "Puntos", "Misiones", "Rangos"]),
  section("puntos", "Puntos y niveles", "Progreso visible", "Cada lectura, consulta y guardado suma. No cambia tu destino, pero sí desbloquea ese gustito de avanzar.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Numerologia.png", Pickaxe, "assistant", "Calcula una misión para subir puntos espirituales hoy.", ["Puntos", "Nivel", "Misión", "Premio", "Racha"]),
  section("logros", "Logros", "Insignias raras", "Desbloquea logros por consultar, guardar, compartir y sobrevivir a lecturas incómodamente precisas.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Rituales-energeticos.png", Award, "assistant", "Propón logros espirituales desbloqueables para mi perfil.", ["Insignias", "Premios", "Tarot", "Racha", "Roast"]),
  section("rachas", "Rachas", "Vuelve cada día", "Pequeñas recompensas por abrir ZODI, leer una señal y no abandonar tu ritual a la primera distracción.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-energia-actual.png", Flame, "assistant", "Dame una recompensa diaria y mini ritual de racha.", ["Día", "Ritual", "Premio", "Recordatorio", "Energía"]),
  section("guardados", "Lecturas guardadas", "Archivo místico", "Todas tus consultas importantes en un solo lugar: tarot, horóscopos, sueños, compatibilidades y mensajes que merecen segunda lectura.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Carta-astral.png", Save, "assistant", "Organiza una lista de lecturas guardadas por tema y prioridad.", ["Tarot", "Horóscopo", "Sueños", "Compatibilidad", "Buscar"]),
  section("favoritos", "Favoritos", "Tu bóveda privada", "Guarda frases, señales y lecturas que quieras volver a mirar cuando el universo diga: te lo dije.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-destino-hoy.png", Star, "assistant", "Resume una lectura importante para guardar como favorita.", ["Lecturas", "Frases", "Tarot", "Sueños", "Notas"]),
  section("predicciones", "Predicciones", "Más personal", "Mensajes más profundos según tu perfil, tus temas favoritos y lo que vienes consultando.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Prediccion-del-dia.png", Sparkles, "assistant", "Genera una predicción personalizada por amor, trabajo, dinero y energía.", ["Amor", "Trabajo", "Dinero", "Energía", "Siguiente paso"]),
  section("historial", "Historial", "Tu línea de señales", "Revisa lo que preguntaste, qué guardaste y qué patrón vuelve con diferente disfraz.", "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Carta-astral.png", History, "assistant", "Crea un resumen de historial espiritual con patrones y consejo.", ["Últimas lecturas", "Patrones", "Fechas", "Energía", "Notas"]),
  section("perfil", "Perfil astral", "Tu base mística", "Signo solar, luna, ascendente, numerología, horóscopo chino y preferencias. Desde aquí ZODI aprende cómo hablarte.", "/zodi-art/perfil/perfil-1.png", UserRound, "natal-chart", "Genera un resumen de perfil astral con signo, luna, ascendente y numerología.", ["Signo", "Luna", "Ascendente", "Avatar", "Preferencias"]),
  section("premium", "Planes", "Elige tu puerta", "Gratis para empezar, Cosmos Pro para profundizar o Eterno si quieres acceso de por vida sin estar mirando el reloj.", "/zodi-art/brand/logo.png", Crown, "assistant", "Explica qué plan de ZODI conviene según el tipo de usuario.", ["Gratis", "Cosmos Pro", "Eterno", "7 días gratis", "Sin permanencia"])
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
  cta = "Consultar ahora"
): DashboardSection {
  return { slug, title, kicker, description, image, icon, kind, prompt, chips, cta };
}

export const dashboardSlugByTitle = new Map(dashboardSections.map((section) => [section.title, section.slug]));

export function getDashboardSection(slug: string) {
  return dashboardSections.find((section) => section.slug === slug) ?? dashboardSections[0];
}

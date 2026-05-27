import {
  BadgeCheck,
  Bot,
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
  Users,
  WandSparkles,
  Waves,
  Zap
} from "lucide-react";
import type { Plan, UserProfile, ZodiModule } from "@/types/zodi";

export const demoProfile: UserProfile = {
  uid: "zodi-demo",
  displayName: "Neon Bruja",
  username: "neonbruja",
  zodiac: "Escorpio",
  moonSign: "Piscis",
  ascendant: "Acuario",
  lifePathNumber: 8,
  chineseZodiac: "Rata",
  mayanSign: "Akbal",
  biorhythmBaseline: "18/24/31",
  onboardingCompleted: true,
  birthDate: "1996-11-08",
  birthTime: "02:14",
  birthCity: "Madrid",
  birthCountry: "España",
  currentCity: "Madrid",
  currentCountry: "España",
  readingTone: "sarcastico",
  favoriteTopics: ["love", "money", "future"],
  notificationPreferences: ["horoscopo diario", "alertas lunares"],
  xp: 7240,
  level: 17,
  streak: 9,
  rank: "Arcana Hacker",
  plan: "premium"
};

export const featureModules: ZodiModule[] = [
  { slug: "horoscopo",   title: "Horóscopo diario",          tag: "Hoy",       description: "Tu clima del día explicado sin vueltas: amor, trabajo, dinero, ánimo y una señal para no perderte en tu propio drama.",                       status: "live",    icon: MoonStar,           accent: "from-lime-300 to-emerald-400" },
  { slug: "semana",      title: "Horóscopo semanal",         tag: "Semana",    description: "Mapa semanal de caos, dinero, amor y decisiones sospechosas.",                                                                                   status: "live",    icon: CalendarDays,       accent: "from-purple-400 to-fuchsia-400" },
  { slug: "mes",         title: "Horóscopo mensual",         tag: "Mes",       description: "Radar mensual para ciclos, oportunidades y drama evitable.",                                                                                       status: "live",    icon: Orbit,              accent: "from-cyan-300 to-purple-400" },
  { slug: "carta-natal", title: "Carta natal",               tag: "Carta",     description: "Una lectura de tu mapa personal: cómo amas, cómo decides, qué repites y dónde tienes más poder del que admites.",                               status: "premium", icon: ChartNoAxesCombined, accent: "from-pink-400 to-lime-300" },
  { slug: "tarot",       title: "Lectura de tarot",          tag: "3 cartas",  description: "Pasado, presente, futuro y una bofetada cósmica elegante.",                                                                                       status: "ai",      icon: Sparkles,           accent: "from-lime-300 to-purple-500" },
  { slug: "celta",       title: "Tirada celta",              tag: "Celta",     description: "Tirada profunda para decisiones que ya sabes pero niegas.",                                                                                        status: "premium", icon: ScrollText,         accent: "from-violet-400 to-cyan-300" },
  { slug: "compatibilidad", title: "Compatibilidad",         tag: "Match",     description: "Química, toxicidad, timing y probabilidad de volver a escribir.",                                                                                 status: "ai",      icon: HeartHandshake,     accent: "from-fuchsia-400 to-lime-300" },
  { slug: "suenos",      title: "Interpretación de sueños",  tag: "Sueños",    description: "Decodifica símbolos raros antes de mandarle otro audio.",                                                                                          status: "ai",      icon: Waves,              accent: "from-cyan-300 to-blue-400" },
  { slug: "transitos",   title: "Tránsitos astrológicos",    tag: "Tránsitos", description: "Alertas planetarias y zonas de riesgo emocional.",                                                                                               status: "premium", icon: RadioTower,         accent: "from-lime-300 to-cyan-300" },
  { slug: "numerologia", title: "Numerología",               tag: "Números",   description: "Camino vital, año personal y patrones que insisten.",                                                                                             status: "live",    icon: Coins,              accent: "from-yellow-300 to-lime-300" },
  { slug: "nombre",      title: "Lectura de nombre",         tag: "Nombre",    description: "Vibración de nombre y apellidos: identidad, herencia y energía pública.",                                                                         status: "ai",      icon: BadgeCheck,         accent: "from-purple-300 to-pink-400" },
  { slug: "mano",        title: "Lectura de mano",           tag: "Palma",     description: "Lectura palmaria simbólica: las cuatro líneas principales interpretadas desde tu perfil astral.",                                                 status: "ai",      icon: Hand,               accent: "from-cyan-300 to-lime-300" },
  { slug: "biorritmo",   title: "Biorritmo",                 tag: "Pulso",     description: "Físico, mente y emociones en modo dashboard gamer.",                                                                                             status: "live",    icon: Zap,                accent: "from-lime-300 to-red-400" },
  { slug: "chino",       title: "Horóscopo chino",           tag: "Chino",     description: "Animal, elemento y compatibilidades de largo plazo.",                                                                                             status: "live",    icon: ShieldHalf,         accent: "from-red-400 to-yellow-300" },
  { slug: "maya",        title: "Horóscopo maya",            tag: "Maya",      description: "Sello, tono y misión espiritual con vibra ancestral.",                                                                                           status: "live",    icon: Star,               accent: "from-teal-300 to-lime-300" },
  { slug: "runas",       title: "Runas vikingas",            tag: "Runas",     description: "Lecturas de runas para entrar en modo sentencia.",                                                                                                status: "ai",      icon: Swords,             accent: "from-slate-200 to-purple-400" },
  { slug: "cristales",   title: "Lecturas de cristales",     tag: "Cristales", description: "Cristal del día, bloqueo energético y ritual breve.",                                                                                            status: "live",    icon: Gem,                accent: "from-cyan-300 to-fuchsia-400" },
  { slug: "roast",       title: "Horóscopo roast",           tag: "Roast",     description: "Humor oscuro astrológico. Te cura porque te arrastra.",                                                                                           status: "ai",      icon: Flame,              accent: "from-orange-300 to-pink-500" },
  { slug: "oraculo",     title: "Oráculo personal",          tag: "Chat",      description: "Pregunta lo que te ronda la cabeza y recibe una respuesta mística, directa y con un poquito de veneno elegante.",                               status: "ai",      icon: Bot,                accent: "from-lime-300 to-purple-400" },
  { slug: "horoscopo",   title: "Panel personal",            tag: "Inicio",    description: "Tu espacio privado para ver lecturas, energía, rachas, logros y consultas guardadas sin perderte entre mil botones.",                            status: "live",    icon: WandSparkles,       accent: "from-lime-300 to-cyan-300" },
  { slug: "comunidad",   title: "Feed comunitario",          tag: "Social",    description: "Posts anónimos, zodiaco, reacciones y caos compartido.",                                                                                          status: "social",  icon: Users,              accent: "from-purple-400 to-lime-300" },
  { slug: "amigos",      title: "Sistema de amigos",         tag: "Crew",      description: "Perfiles, amigos, compatibilidad y presencia mística.",                                                                                           status: "social",  icon: MessageCircle,      accent: "from-pink-400 to-cyan-300" },
  { slug: "ranking",     title: "Ranking espiritual",        tag: "Rank",      description: "Ligas, reputación, misiones y leaderboard de brujería.",                                                                                         status: "social",  icon: Trophy,             accent: "from-yellow-300 to-purple-400" },
  { slug: "puntos",      title: "Puntos y niveles",          tag: "XP",        description: "Cada lectura, racha y participación suma progreso. Porque hasta el caos necesita recompensas.",                                                  status: "live",    icon: Pickaxe,            accent: "from-lime-300 to-yellow-300" },
  { slug: "logros",      title: "Logros",                    tag: "Logros",    description: "Insignias coleccionables por decisiones raras y buenas.",                                                                                        status: "live",    icon: Trophy,             accent: "from-fuchsia-400 to-yellow-300" },
  { slug: "rachas",      title: "Sistema de rachas",         tag: "Racha",     description: "Recompensas diarias para abrir el oráculo sin fallar.",                                                                                          status: "live",    icon: Flame,              accent: "from-red-400 to-lime-300" },
  { slug: "guardados",   title: "Lecturas guardadas",        tag: "Vault",     description: "Archivo de lecturas guardadas, privadas y buscables.",                                                                                            status: "live",    icon: Save,               accent: "from-cyan-300 to-lime-300" },
  { slug: "favoritos",   title: "Favoritos",                 tag: "Favs",      description: "Colecciona mensajes, tiradas, cartas y predicciones.",                                                                                            status: "live",    icon: Star,               accent: "from-lime-300 to-pink-400" },
  { slug: "predicciones", title: "Predicciones personalizadas", tag: "Extra",  description: "Mensajes más profundos según tu perfil, tus temas favoritos y lo que vienes consultando.",                                                      status: "premium", icon: Sparkles,           accent: "from-purple-400 to-cyan-300" },
  { slug: "historial",   title: "Historial de usuario",      tag: "Timeline",  description: "Historial espiritual, búsquedas, lecturas y cambios de energía.",                                                                               status: "live",    icon: History,            accent: "from-slate-200 to-lime-300" },
  { slug: "premium",     title: "Suscripción premium",       tag: "Planes",    description: "Gratis, Premium y VIP Místico con desbloqueos reales.",                                                                                          status: "premium", icon: Crown,              accent: "from-yellow-300 to-fuchsia-400" }
];

export const plans: Plan[] = [
  {
    name: "Gratis",
    price: "0 EUR",
    signal: "Oráculo callejero",
    perks: ["Horóscopo diario", "Tarot básico", "Feed anónimo", "Puntos y rachas"]
  },
  {
    name: "Premium",
    price: "5 EUR/mes",
    signal: "Cosmos Pro",
    perks: ["Todas las lecturas", "Consultas amplias", "Tono completo", "7 días gratis"]
  },
  {
    name: "Eterno",
    price: "49 EUR",
    signal: "Pago único",
    perks: ["Acceso de por vida", "Futuras mejoras incluidas", "Sin mirar el reloj", "Lecturas profundas"]
  }
];

export const tarotCards = ["El Glitch", "La Torre WiFi", "La Verdad", "Luna Neon", "El Bloqueo", "Reina del Caos"];

export const feedPosts = [
  { sign: "Leo", body: "Mi carta natal dijo liderazgo, mi banco dijo humildad.", heat: 284 },
  { sign: "Piscis", body: "Soñé algo raro y ZODI me recomendó agua, terapia y cero drama.", heat: 451 },
  { sign: "Capricornio", body: "Hoy no controlo nada. Estoy practicando una cosa llamada sufrir en silencio.", heat: 199 }
];

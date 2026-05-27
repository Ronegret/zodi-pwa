/**
 * ZODI — Gamification utilities
 * XP, nivel, racha, gemas — todo persistido en localStorage.
 * Sistema de humor regional por país de origen.
 */

const XP_KEY     = "zodi.xp";
const STREAK_KEY = "zodi.streak";
const GEMS_KEY   = "zodi.gems";

// ─── Types ───────────────────────────────────────────────────────────────────

export type XpData = {
  total: number;
  today: number;      // XP ganado hoy (resetea a medianoche)
  lastDate: string;   // ISO date "YYYY-MM-DD"
};

export type StreakData = {
  count: number;
  lastDate: string;
};

export type GemsData = {
  total: number;
  lastEarned: string; // ISO date
};

// ─── Level thresholds (XP acumulado por nivel) ────────────────────────────────
const LEVEL_THRESHOLDS = [0, 150, 350, 700, 1200, 2000, 3200, 4800, 7000, 10000, 14000, 19000];

// ─── Títulos de nivel desbloqueables ─────────────────────────────────────────
export const LEVEL_TITLES: Record<number, string> = {
  1:  "Iniciado del Caos",
  2:  "Lector de Señales",
  3:  "Buscador Astral",
  4:  "Invocador de Cartas",
  5:  "Custodio de Runas",
  6:  "Oráculo Urbano",
  7:  "Navegante del Cosmos",
  8:  "Guardián de Gemas",
  9:  "Maestro del Velo",
  10: "Arcana Hacker",
  11: "Señor del Tiempo Astral",
  12: "ZODI Eterno"
};

// ─── XP por acción ────────────────────────────────────────────────────────────
export const XP_PER_ACTION: Record<string, number> = {
  "Horóscopo diario":   50,
  "Horóscopo semanal":  60,
  "Horóscopo mensual":  60,
  "Tránsitos":          55,
  "Tarot":              80,
  "Tirada celta":       90,
  "Runas vikingas":     75,
  "Carta natal":       100,
  "Numerología":        65,
  "Nombre y apellidos": 60,
  "Compatibilidad":     70,
  "Sueños":             65,
  "Biorritmo":          50,
  "Horóscopo chino":    55,
  "Horóscopo maya":     55,
  "Cristales":          50,
  "Lectura de mano":    70,
  "Roast horoscope":    60,
  "Predicciones":       65,
  "Oráculo personal":   40,
  _default:             45,
};

// ─── Gemas por evento ─────────────────────────────────────────────────────────
export const GEMS_PER_EVENT = {
  reading:       5,   // lectura completada
  levelUp:      20,   // subir de nivel
  streak7:      10,   // racha de 7 días
  streak30:     50,   // racha de 30 días
  dailyLogin:    2,   // abrir la app cada día
} as const;

// ─── Humor regional ──────────────────────────────────────────────────────────
// Modula el tono sarcástico de ZODI según el país de origen del usuario.
export const REGIONAL_HUMOR: Record<string, string> = {
  // España
  "España":     "Hablas como alguien de España: usa jerga española natural (tío, hostia, vamos). Sé directo, irónico y con ese humor socarrón peninsular. Nada de postureo latinoamericano forzado.",
  "Spain":      "Hablas como alguien de España: usa jerga española natural (tío, hostia, vamos). Sé directo, irónico y con ese humor socarrón peninsular. Nada de postureo latinoamericano forzado.",
  // México
  "México":     "Hablas con un mexicano: usa expresiones mexicanas naturales (güey, órale, qué pedo, chido). El humor tiene que tener ese toque de albur suave y sarcasmo frontal. No seas fancy.",
  "Mexico":     "Hablas con un mexicano: usa expresiones mexicanas naturales (güey, órale, qué pedo, chido). El humor tiene que tener ese toque de albur suave y sarcasmo frontal. No seas fancy.",
  // Argentina
  "Argentina":  "Hablas con un argentino: usa voseo y lunfardo (boludo, che, posta, flashear). Humor intelectual mezclado con autoconciencia del drama. Los argentinos saben que son el centro del cosmos.",
  // Colombia
  "Colombia":   "Hablas con un colombiano: usa expresiones colombianas (parce, bacano, qué chimba, marica en tono amistoso). El humor es cálido pero con puntada ácida. Evita ser demasiado serio.",
  // Chile
  "Chile":      "Hablas con un chileno: usa chilenismos con moderación (po, cachai, puta, al tiro). El humor chileno es negro, seco y con mucha ironía. No adules ni seas efusivo.",
  // Perú
  "Perú":       "Hablas con un peruano: usa expresiones peruanas (causa, pata, al toque, bacan). El humor es picaresco y autodespreciativo de forma cariñosa. Mucho ingenio verbal.",
  // Venezuela
  "Venezuela":  "Hablas con un venezolano: expresiones como chamo, coño, arrecho, verga (en tono coloquial) van bien. Humor callejero, resiliente, que se ríe de todo porque si no lloras.",
  // Estados Unidos
  "Estados Unidos": "El usuario es hispano en EE.UU.: mezcla natural de español e inglés (Spanglish suave). Humor bicultural: entiende referencias americanas pero con alma latina. Sin ser pedante.",
  "United States":  "El usuario es hispano en EE.UU.: mezcla natural de español e inglés (Spanglish suave). Humor bicultural: entiende referencias americanas pero con alma latina. Sin ser pedante.",
  // Default
  _default: "Hablas en español neutro pero con carácter. El humor es ácido e inteligente, adaptado al contexto del usuario sin afectación regional exagerada."
};

/** Retorna la instrucción de humor regional según el país o un fallback neutro */
export function getRegionalHumorContext(country?: string): string {
  if (!country) return REGIONAL_HUMOR._default;
  const key = Object.keys(REGIONAL_HUMOR).find(
    (k) => k !== "_default" && country.toLowerCase().includes(k.toLowerCase())
  );
  return key ? REGIONAL_HUMOR[key] : REGIONAL_HUMOR._default;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

// ─── XP ──────────────────────────────────────────────────────────────────────

export function getXpData(): XpData {
  try {
    const raw = localStorage.getItem(XP_KEY);
    if (!raw) return { total: 0, today: 0, lastDate: todayISO() };
    const d: XpData = JSON.parse(raw);
    // Reset daily counter if it's a new day
    if (d.lastDate !== todayISO()) return { total: d.total, today: 0, lastDate: todayISO() };
    return d;
  } catch {
    return { total: 0, today: 0, lastDate: todayISO() };
  }
}

export function addXp(sectionTitle: string): XpData {
  const amount = XP_PER_ACTION[sectionTitle] ?? XP_PER_ACTION._default;
  const data = getXpData();
  const updated: XpData = {
    total: data.total + amount,
    today: data.today + amount,
    lastDate: todayISO(),
  };
  try { localStorage.setItem(XP_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  return updated;
}

export function getLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[level] ?? LEVEL_TITLES[12];
}

export function xpToNextLevel(totalXp: number): { current: number; needed: number; percent: number } {
  const level = getLevel(totalXp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold    = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const current = totalXp - currentThreshold;
  const needed  = nextThreshold - currentThreshold;
  return { current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) };
}

// ─── Gems ─────────────────────────────────────────────────────────────────────

export function getGems(): GemsData {
  try {
    const raw = localStorage.getItem(GEMS_KEY);
    if (!raw) return { total: 0, lastEarned: "" };
    return JSON.parse(raw) as GemsData;
  } catch {
    return { total: 0, lastEarned: "" };
  }
}

export function addGems(amount: number): GemsData {
  const data = getGems();
  const updated: GemsData = { total: data.total + amount, lastEarned: todayISO() };
  try { localStorage.setItem(GEMS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  return updated;
}

export function spendGems(amount: number): { success: boolean; remaining: number } {
  const data = getGems();
  if (data.total < amount) return { success: false, remaining: data.total };
  const updated: GemsData = { total: data.total - amount, lastEarned: data.lastEarned };
  try { localStorage.setItem(GEMS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  return { success: true, remaining: updated.total };
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 0, lastDate: "" };
    return JSON.parse(raw) as StreakData;
  } catch {
    return { count: 0, lastDate: "" };
  }
}

export function updateStreak(): StreakData {
  const today = todayISO();
  const streak = getStreak();

  if (streak.lastDate === today) return streak; // already counted today

  let newCount: number;
  if (!streak.lastDate) {
    newCount = 1;
  } else {
    const diff = daysBetween(streak.lastDate, today);
    newCount = diff === 1 ? streak.count + 1 : 1; // consecutive → extend; gap → reset
  }

  const updated: StreakData = { count: newCount, lastDate: today };
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  return updated;
}

import type { AstralProfile, OnboardingData } from "@/types/zodi";

const zodiacBoundaries = [
  ["Capricornio", 119],  // 1 ene – 19 ene
  ["Acuario",     218],  // 20 ene – 18 feb
  ["Piscis",      320],  // 19 feb – 20 mar
  ["Aries",       419],  // 21 mar – 19 abr
  ["Tauro",       520],  // 20 abr – 20 may
  ["Géminis",     620],  // 21 may – 20 jun
  ["Cáncer",      722],  // 21 jun – 22 jul
  ["Leo",         822],  // 23 jul – 22 ago
  ["Virgo",       922],  // 23 ago – 22 sep
  ["Libra",      1022],  // 23 sep – 22 oct
  ["Escorpio",   1121],  // 23 oct – 21 nov
  ["Sagitario",  1221],  // 22 nov – 21 dic
  ["Capricornio",1231],  // 22 dic – 31 dic
] as const;

const chineseAnimals = ["Rata", "Buey", "Tigre", "Conejo", "Dragón", "Serpiente", "Caballo", "Cabra", "Mono", "Gallo", "Perro", "Cerdo"];
const mayanSigns = ["Imix", "Ik", "Akbal", "Kan", "Chicchan", "Cimi", "Manik", "Lamat", "Muluk", "Ok", "Chuwen", "Eb", "Ben", "Ix", "Men", "Kib", "Kaban", "Etznab", "Kawak", "Ajaw"];
const signs = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];

export function calculateSunSign(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  const marker = (date.getMonth() + 1) * 100 + date.getDate();
  return zodiacBoundaries.find(([, boundary]) => marker <= boundary)?.[0] ?? "Capricornio";
}

export function calculateLifePathNumber(dateValue: string) {
  let digits = dateValue.replace(/\D/g, "").split("").map(Number).reduce((sum, digit) => sum + digit, 0);
  while (digits > 9 && ![11, 22, 33].includes(digits)) {
    digits = digits.toString().split("").map(Number).reduce((sum, digit) => sum + digit, 0);
  }
  return digits;
}

export function generateAstralProfile(data: OnboardingData): AstralProfile {
  const date = new Date(`${data.birthDate}T${data.birthTime || "12:00"}`);
  const sunSign = calculateSunSign(data.birthDate);
  const seed = date.getFullYear() + date.getMonth() + date.getDate() + Number(data.birthTime.slice(0, 2) || 0);
  const moonSign = signs[(seed + data.birthCity.length) % signs.length];
  const ascendant = signs[(seed + data.birthCountry.length + 4) % signs.length];
  const chineseZodiac = chineseAnimals[(date.getFullYear() - 4) % 12];
  const mayanSign = mayanSigns[Math.abs(Math.floor(date.getTime() / 86400000)) % mayanSigns.length];
  const lifePathNumber = calculateLifePathNumber(data.birthDate);
  const biorhythmBaseline = `${(seed % 23) + 1}/${(seed % 28) + 1}/${(seed % 33) + 1}`;

  return {
    sunSign,
    moonSign,
    ascendant,
    natalChartBase: `Sol en ${sunSign}, Luna en ${moonSign}, Ascendente ${ascendant}`,
    chineseZodiac,
    mayanSign,
    lifePathNumber,
    biorhythmBaseline,
    summary: `${sunSign} con Luna en ${moonSign} y Ascendente ${ascendant}: energía intensa, intuición alta y cero tolerancia para mensajes ambiguos.`
  };
}

// ─── Contexto astral real por fecha ─────────────────────────────────────────

const DAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Calcula la fase lunar aproximada a partir de una luna nueva de referencia conocida.
 *  Referencia: Luna Nueva el 29 de enero de 2025 a las 12:36 UTC
 */
function getMoonPhase(now: Date): { name: string; emoji: string; angle: number } {
  const KNOWN_NEW_MOON = new Date("2025-01-29T12:36:00Z").getTime();
  const LUNAR_CYCLE = 29.530588853; // días
  const elapsed = (now.getTime() - KNOWN_NEW_MOON) / 86_400_000; // días
  const cycle = ((elapsed % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE; // 0-29.53
  const angle = Math.round((cycle / LUNAR_CYCLE) * 360);

  let name: string;
  let emoji: string;

  if (cycle < 1.85)        { name = "Luna Nueva";             emoji = "🌑"; }
  else if (cycle < 7.38)   { name = "Luna Creciente";         emoji = "🌒"; }
  else if (cycle < 9.22)   { name = "Cuarto Creciente";       emoji = "🌓"; }
  else if (cycle < 14.76)  { name = "Gibosa Creciente";       emoji = "🌔"; }
  else if (cycle < 16.61)  { name = "Luna Llena";             emoji = "🌕"; }
  else if (cycle < 22.15)  { name = "Gibosa Menguante";       emoji = "🌖"; }
  else if (cycle < 23.99)  { name = "Cuarto Menguante";       emoji = "🌗"; }
  else                     { name = "Luna Menguante";          emoji = "🌘"; }

  return { name, emoji, angle };
}

/** Nodo Norte aproximado: ciclo de 18.6 años desde referencia conocida */
function getNorthNode(now: Date): string {
  const REFERENCE_DATE = new Date("2022-01-18T00:00:00Z").getTime(); // Nodo Norte en Tauro
  const NODE_CYCLE_DAYS = 6793.5; // 18.6 años
  const nodeSignsOrder = ["Tauro", "Aries", "Piscis", "Acuario", "Capricornio", "Sagitario",
                           "Escorpio", "Libra", "Virgo", "Leo", "Cáncer", "Géminis"];
  const elapsed = (now.getTime() - REFERENCE_DATE) / 86_400_000;
  const signDuration = NODE_CYCLE_DAYS / 12;
  const index = Math.floor(elapsed / signDuration) % 12;
  return nodeSignsOrder[index] ?? "Aries";
}

/** Posición aproximada de Júpiter (ciclo de 11.86 años, ~1 signo/año) */
function getJupiterSign(now: Date): string {
  // Júpiter entró en Géminis el 25 de mayo de 2024
  const JUPITER_REF = new Date("2024-05-25T00:00:00Z").getTime();
  const JUPITER_SIGN_DAYS = 365.25; // aprox 1 año por signo
  const jupiterOrder = ["Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio",
                         "Sagitario", "Capricornio", "Acuario", "Piscis", "Aries", "Tauro"];
  const elapsed = (now.getTime() - JUPITER_REF) / 86_400_000;
  const index = Math.floor(elapsed / JUPITER_SIGN_DAYS) % 12;
  return jupiterOrder[index] ?? "Géminis";
}

/** Posición aproximada de Saturno (ciclo de 29.5 años, ~2.5 años por signo) */
function getSaturnSign(now: Date): string {
  // Saturno entró en Piscis el 7 de marzo de 2023
  const SATURN_REF = new Date("2023-03-07T00:00:00Z").getTime();
  const SATURN_SIGN_DAYS = 29.5 * 365.25 / 12; // ~898 días
  const saturnOrder = ["Piscis", "Aries", "Tauro", "Géminis", "Cáncer", "Leo",
                        "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario"];
  const elapsed = (now.getTime() - SATURN_REF) / 86_400_000;
  const index = Math.floor(elapsed / SATURN_SIGN_DAYS) % 12;
  return saturnOrder[index] ?? "Piscis";
}

/** Energía numerológica universal del día (suma de dígitos de la fecha) */
function getDayVibration(now: Date): number {
  const str = `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}`;
  let sum = str.split("").reduce((a, c) => a + Number(c), 0);
  while (sum > 9 && ![11, 22, 33].includes(sum)) {
    sum = String(sum).split("").reduce((a, c) => a + Number(c), 0);
  }
  return sum;
}

export type TodaysAstralContext = {
  dateISO: string;
  dateReadable: string;
  dayName: string;
  sunTransit: string;
  moonPhase: string;
  moonEmoji: string;
  northNode: string;
  jupiterSign: string;
  saturnSign: string;
  dayVibration: number;
  season: string;
};

/** Devuelve el contexto astral real del día actual.
 *  Se puede llamar tanto en servidor como en cliente (sin dependencias de Node).
 */
export function getTodaysAstralContext(now = new Date()): TodaysAstralContext {
  const day   = now.getDate();
  const month = now.getMonth(); // 0-based
  const year  = now.getFullYear();

  const dateISO      = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const dateReadable = `${day} de ${MONTHS_ES[month]} de ${year}`;
  const dayName      = DAYS_ES[now.getDay()];
  const sunTransit   = calculateSunSign(dateISO);

  const moon     = getMoonPhase(now);
  const northNode = getNorthNode(now);
  const jupiterSign = getJupiterSign(now);
  const saturnSign  = getSaturnSign(now);
  const dayVibration = getDayVibration(now);

  // Estación (hemisferio norte como referencia)
  let season: string;
  const marker = (month + 1) * 100 + day;
  if      (marker >= 321 && marker < 621) season = "Primavera";
  else if (marker >= 621 && marker < 923) season = "Verano";
  else if (marker >= 923 && marker < 1222) season = "Otoño";
  else                                     season = "Invierno";

  return {
    dateISO,
    dateReadable,
    dayName,
    sunTransit,
    moonPhase: `${moon.emoji} ${moon.name}`,
    moonEmoji: moon.emoji,
    northNode,
    jupiterSign,
    saturnSign,
    dayVibration,
    season
  };
}

export const firebaseCollections = [
  "users",
  "astralProfiles",
  "readings",
  "favorites",
  "history",
  "subscriptions",
  "communityPosts",
  "dailyTopicComments",
  "comments",
  "reactions",
  "friends",
  "chatMessages",
  "achievements",
  "notifications"
];

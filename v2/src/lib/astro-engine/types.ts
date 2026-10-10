export const SIGNS = [
  'Aries',
  'Tauro',
  'Géminis',
  'Cáncer',
  'Leo',
  'Virgo',
  'Libra',
  'Escorpio',
  'Sagitario',
  'Capricornio',
  'Acuario',
  'Piscis',
] as const;
export type Sign = (typeof SIGNS)[number];

export type PlanetId =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'northNode';

export type HouseSystem = 'placidus' | 'whole-sign';
export type AspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

/** Posición zodiacal. `lon` es longitud eclíptica tropical en grados [0, 360). */
export interface ZodiacPosition {
  lon: number;
  sign: Sign;
  /** Grado dentro del signo, 0–29 (entero). */
  degree: number;
  minute: number;
}

export interface PlanetPosition extends ZodiacPosition {
  id: PlanetId;
  retrograde: boolean;
  house: number;
}

export interface Aspect {
  a: PlanetId;
  b: PlanetId;
  type: AspectType;
  /** Desviación respecto al ángulo exacto, en grados. */
  orb: number;
}

export interface NatalChart {
  /** Instante UTC usado en el cálculo. */
  utc: string;
  latitude: number;
  longitude: number;
  houseSystem: HouseSystem;
  /** Si la latitud impide Placidus se cae a signos enteros. */
  houseSystemNote?: string;
  planets: PlanetPosition[];
  ascendant: ZodiacPosition;
  midheaven: ZodiacPosition;
  /** 12 cúspides, índice 0 = casa 1. */
  houses: ZodiacPosition[];
  aspects: Aspect[];
}

export interface BirthInput {
  /** Fecha local `YYYY-MM-DD`. */
  date: string;
  /** Hora local `HH:mm`. */
  time: string;
  /** Zona IANA del lugar de nacimiento, p. ej. `Europe/Madrid`. */
  timeZone: string;
  latitude: number;
  longitude: number;
  houseSystem?: HouseSystem;
}

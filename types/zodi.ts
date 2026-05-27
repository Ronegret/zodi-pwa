import type { LucideIcon } from "lucide-react";

export type ZodiModule = {
  title: string;
  tag: string;
  description: string;
  status: "live" | "ai" | "premium" | "social";
  icon: LucideIcon;
  accent: string;
  slug: string;
};

export type Plan = {
  name: string;
  price: string;
  signal: string;
  perks: string[];
};

export type ReadingKind =
  | "daily-horoscope"
  | "weekly-horoscope"
  | "monthly-horoscope"
  | "natal-chart"
  | "tarot"
  | "celtic-tarot"
  | "compatibility"
  | "dream"
  | "transits"
  | "numerology"
  | "name-reading"
  | "palm-reading"
  | "biorhythm"
  | "chinese-horoscope"
  | "mayan-horoscope"
  | "runes"
  | "crystals"
  | "roast"
  | "assistant";

export type UserProfile = {
  uid: string;
  displayName: string;
  username?: string;
  avatar?: string;
  zodiac: string;
  moonSign?: string;
  ascendant?: string;
  lifePathNumber?: number;
  chineseZodiac?: string;
  mayanSign?: string;
  biorhythmBaseline?: string;
  onboardingCompleted?: boolean;
  birthDate?: string;
  birthTime?: string;
  birthCity?: string;
  birthCountry?: string;
  currentCity?: string;
  currentCountry?: string;
  readingTone?: "suave" | "directo" | "brutal" | "sarcastico";
  favoriteTopics?: string[];
  notificationPreferences?: string[];
  xp: number;
  level: number;
  streak: number;
  rank: string;
  plan: "free" | "premium" | "vip";
};

export type OnboardingData = {
  displayName: string;
  username: string;
  avatar: string;
  genderIdentity?: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthCountry: string;
  currentCity: string;
  currentCountry: string;
  readingTone: "suave" | "directo" | "brutal" | "sarcastico";
  favoriteTopics: string[];
  notificationPreferences: string[];
};

export type AstralProfile = {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  natalChartBase: string;
  chineseZodiac: string;
  mayanSign: string;
  lifePathNumber: number;
  biorhythmBaseline: string;
  summary: string;
};

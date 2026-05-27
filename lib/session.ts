"use client";

import type { AstralProfile, OnboardingData, UserProfile } from "@/types/zodi";
import { calculateSunSign } from "@/lib/astral";

const SESSION_KEY = "zodi.session";
const ONBOARDING_KEY = "zodi.onboarding";

export type LocalZodiSession = {
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  displayName?: string;
  email?: string;
  uid?: string;
  astralProfile?: AstralProfile;
  onboardingData?: OnboardingData;
};

export function getLocalSession(): LocalZodiSession {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, onboardingCompleted: false };
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : { isAuthenticated: false, onboardingCompleted: false };
}

export function setLocalSession(session: Partial<LocalZodiSession>) {
  if (typeof window === "undefined") return;
  const current = getLocalSession();
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...session }));
}

export function completeLocalOnboarding(data: OnboardingData, astralProfile: AstralProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ data, astralProfile }));
  setLocalSession({
    isAuthenticated: true,
    onboardingCompleted: true,
    displayName: data.displayName,
    onboardingData: data,
    astralProfile
  });
}

export function getSessionProfile(): Partial<UserProfile> | null {
  const session = getLocalSession();
  if (!session.isAuthenticated || !session.onboardingData || !session.astralProfile) return null;

  const od = session.onboardingData;
  const ap = session.astralProfile;

  // Auto-migrate: recalculate sunSign from birthDate to fix any old boundary bug
  const correctedSunSign = od?.birthDate ? calculateSunSign(od.birthDate) : ap.sunSign;
  if (correctedSunSign !== ap.sunSign) {
    setLocalSession({ astralProfile: { ...ap, sunSign: correctedSunSign } });
    ap.sunSign = correctedSunSign;
  }

  return {
    uid: session.uid ?? "local-user",
    displayName: session.displayName ?? od.displayName,
    username: od.username,
    avatar: od.avatar,
    zodiac: ap.sunSign,
    moonSign: ap.moonSign,
    ascendant: ap.ascendant,
    lifePathNumber: ap.lifePathNumber,
    chineseZodiac: ap.chineseZodiac,
    mayanSign: ap.mayanSign,
    biorhythmBaseline: ap.biorhythmBaseline,
    birthDate: od.birthDate,
    birthTime: od.birthTime,
    birthCity: od.birthCity,
    birthCountry: od.birthCountry,
    readingTone: od.readingTone,
    favoriteTopics: od.favoriteTopics,
    onboardingCompleted: true,
    xp: 0,
    level: 1,
    streak: 0,
    rank: "Aprendiz Místico",
    plan: "free"
  };
}

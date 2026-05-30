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
  loginAt?: number;
  astralProfile?: AstralProfile;
  onboardingData?: OnboardingData;
};

export function getLocalSession(): LocalZodiSession {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, onboardingCompleted: false };
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return { isAuthenticated: false, onboardingCompleted: false };

  let parsed: LocalZodiSession;
  try { parsed = JSON.parse(raw) as LocalZodiSession; }
  catch { return { isAuthenticated: false, onboardingCompleted: false }; }

  // Expiración de 30 días — conserva datos para match por email tras caducidad
  if (parsed.isAuthenticated && parsed.loginAt) {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.loginAt > THIRTY_DAYS) {
      const expired = { ...parsed, isAuthenticated: false };
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(expired));
      document.cookie = "zodi_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "zodi_onboarding=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      return expired;
    }
  }

  return parsed;
}

export function setLocalSession(session: Partial<LocalZodiSession>) {
  if (typeof window === "undefined") return;
  const current = getLocalSession();
  const nextSession = { ...current, ...session };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  
  // Sincronizar estado a cookies para el middleware (Next.js)
  if (nextSession.isAuthenticated) {
    document.cookie = "zodi_auth=1; path=/; max-age=86400; SameSite=Lax";
    if (nextSession.onboardingCompleted) {
      document.cookie = "zodi_onboarding=1; path=/; max-age=86400; SameSite=Lax";
    } else {
      document.cookie = "zodi_onboarding=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  } else {
    clearLocalSession();
  }
}

export function clearLocalSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(ONBOARDING_KEY);
  document.cookie = "zodi_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "zodi_onboarding=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export async function signOutZodi() {
  clearLocalSession();

  try {
    const [{ signOut }, { getFirebaseAuth }] = await Promise.all([
      import("firebase/auth"),
      import("@/lib/firebase/client")
    ]);
    const auth = getFirebaseAuth();
    if (auth) {
      await signOut(auth);
    }
  } catch {
    // Local session is already cleared; Firebase may be unavailable in local/dev.
  }
}

export function completeLocalOnboarding(data: OnboardingData, astralProfile: AstralProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ data, astralProfile }));
  
  const currentSession = getLocalSession();
  
  setLocalSession({
    isAuthenticated: true,
    onboardingCompleted: true,
    displayName: data.displayName,
    onboardingData: data,
    astralProfile
  });

  // Si estamos en modo local (sin firebase o como fallback), actualizamos la base de datos local
  if (currentSession.uid?.startsWith("local_")) {
    const usersStr = window.localStorage.getItem("zodi.local_users") || "[]";
    try {
      let users = JSON.parse(usersStr);
      const userIndex = users.findIndex((u: any) => u.uid === currentSession.uid);
      if (userIndex !== -1) {
        users[userIndex].onboardingCompleted = true;
        users[userIndex].astralProfile = astralProfile;
        users[userIndex].onboardingData = data;
        users[userIndex].displayName = data.displayName;
        window.localStorage.setItem("zodi.local_users", JSON.stringify(users));
      }
    } catch (e) {
      console.warn("Could not save local user data", e);
    }
  }
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

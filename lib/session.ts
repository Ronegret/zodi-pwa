"use client";

import type { AstralProfile, OnboardingData, UserProfile } from "@/types/zodi";
import { calculateSunSign } from "@/lib/astral";

const SESSION_KEY    = "zodi.session";
const ONBOARDING_KEY = "zodi.onboarding";
const IDENTITY_KEY   = "zodi.identity"; // Nunca se borra — sobrevive logout y expiración

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

  // Expiración de 30 días — solo marca como no autenticado, CONSERVA los datos
  // para que el match por email funcione en el próximo login
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

  // Auto-corregir sunSign si birthDate está disponible y no coincide
  // Esto soluciona signos guardados con datos incorrectos o desactualizados
  if (parsed.onboardingData?.birthDate && parsed.astralProfile) {
    const correct = calculateSunSign(parsed.onboardingData.birthDate);
    if (correct && parsed.astralProfile.sunSign !== correct) {
      parsed = { ...parsed, astralProfile: { ...parsed.astralProfile, sunSign: correct } };
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
    }
  }

  return parsed;
}

export function setLocalSession(session: Partial<LocalZodiSession>) {
  if (typeof window === "undefined") return;
  const current = getLocalSession();
  // Mergear onboardingData en profundidad para no perder campos al actualizar parcialmente
  const mergedOnboarding = session.onboardingData
    ? { ...current.onboardingData, ...session.onboardingData }
    : current.onboardingData;
  const nextSession = { ...current, ...session, onboardingData: mergedOnboarding };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));

  // Guardar identidad duradera cuando el onboarding está completo
  if (nextSession.onboardingCompleted && nextSession.uid && nextSession.email) {
    window.localStorage.setItem(IDENTITY_KEY, JSON.stringify({
      uid: nextSession.uid,
      email: nextSession.email,
      onboardingCompleted: true,
      onboardingData: nextSession.onboardingData ?? current.onboardingData,
      astralProfile: nextSession.astralProfile ?? current.astralProfile,
    }));
  }

  // Sincronizar cookies — NUNCA llamar clearLocalSession() desde aquí
  if (nextSession.isAuthenticated) {
    document.cookie = "zodi_auth=1; path=/; max-age=2592000; SameSite=Lax";
    if (nextSession.onboardingCompleted) {
      document.cookie = "zodi_onboarding=1; path=/; max-age=2592000; SameSite=Lax";
    } else {
      document.cookie = "zodi_onboarding=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  } else {
    // Solo borrar cookies, NO los datos de localStorage
    document.cookie = "zodi_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "zodi_onboarding=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

export function getSavedIdentity(): { uid: string; email: string; onboardingCompleted: boolean; onboardingData?: any; astralProfile?: any } | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem(IDENTITY_KEY) || "null"); }
  catch { return null; }
}

// Marca como no autenticado pero CONSERVA los datos de sesión y onboarding
// para reconocer al usuario en el próximo login por email/uid
export function clearLocalSession() {
  if (typeof window === "undefined") return;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as LocalZodiSession;
      // Preservar todos los datos, solo marcar como no autenticado
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({
        ...parsed,
        isAuthenticated: false,
      }));
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }

  window.localStorage.removeItem(ONBOARDING_KEY);
  document.cookie = "zodi_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "zodi_onboarding=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export async function signOutZodi() {
  clearLocalSession(); // Marca isAuthenticated: false, conserva datos

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
    // Sesión local ya marcada como inactiva
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
  // Solo requerimos onboardingData — la autenticación de ruta la maneja el middleware
  if (!session.onboardingData) return null;

  const od = session.onboardingData;
  const ap = session.astralProfile;

  // Siempre calcular el signo solar desde birthDate — es la fuente de verdad
  const zodiac = od?.birthDate
    ? calculateSunSign(od.birthDate)
    : (ap?.sunSign ?? "");

  // Sincronizar astralProfile si el signo guardado es incorrecto o está vacío
  if (zodiac && ap && zodiac !== ap.sunSign) {
    setLocalSession({ astralProfile: { ...ap, sunSign: zodiac } });
    ap.sunSign = zodiac;
  }

  return {
    uid: session.uid ?? "local-user",
    displayName: session.displayName ?? od.displayName,
    username: od.username,
    avatar: od.avatar,
    zodiac,                                         // calculado desde birthDate
    moonSign:          ap?.moonSign ?? "",
    ascendant:         ap?.ascendant ?? "",
    lifePathNumber:    ap?.lifePathNumber ?? 0,
    chineseZodiac:     ap?.chineseZodiac ?? "",
    mayanSign:         ap?.mayanSign ?? "",
    biorhythmBaseline: ap?.biorhythmBaseline ?? "",
    birthDate:    od.birthDate,
    birthTime:    od.birthTime,
    birthCity:    od.birthCity,
    birthCountry: od.birthCountry,
    readingTone:     od.readingTone,
    favoriteTopics:  od.favoriteTopics,
    onboardingCompleted: true,
    xp: 0, level: 1, streak: 0,
    rank: "Aprendiz Místico",
    plan: "free"
  };
}

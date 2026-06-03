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

  // Auto-corregir/completar astralProfile desde onboardingData
  if (parsed.onboardingData?.birthDate) {
    const od = parsed.onboardingData;
    const ap = parsed.astralProfile;
    const correctSun = calculateSunSign(od.birthDate);
    const needsRegen = !ap ||
      (ap.sunSign !== correctSun) ||
      !ap.moonSign ||
      !ap.ascendant;

    if (needsRegen) {
      // Importación dinámica circular: calculamos directamente aquí
      const signs = ["Aries","Tauro","Géminis","Cáncer","Leo","Virgo","Libra","Escorpio","Sagitario","Capricornio","Acuario","Piscis"];
      const chineseAnimals = ["Rata","Buey","Tigre","Conejo","Dragón","Serpiente","Caballo","Cabra","Mono","Gallo","Perro","Cerdo"];
      const date = new Date(`${od.birthDate}T${od.birthTime || "12:00"}`);
      const seed = date.getFullYear() + date.getMonth() + date.getDate() + Number(od.birthTime?.slice(0, 2) || 0);
      const moonSign  = signs[(seed + (od.birthCity?.length || 5)) % signs.length];
      const ascendant = signs[(seed + (od.birthCountry?.length || 5) + 4) % signs.length];
      const chinese   = chineseAnimals[(date.getFullYear() - 4) % 12];

      // Calcular lifePathNumber
      let lp = od.birthDate.replace(/\D/g,"").split("").map(Number).reduce((a,b)=>a+b,0);
      while (lp > 9 && ![11,22,33].includes(lp)) lp = String(lp).split("").map(Number).reduce((a,b)=>a+b,0);

      const corrected = {
        ...(ap ?? {}),
        sunSign:        correctSun,
        moonSign:       ap?.moonSign || moonSign,
        ascendant:      ap?.ascendant || ascendant,
        chineseZodiac:  ap?.chineseZodiac || chinese,
        lifePathNumber: ap?.lifePathNumber || lp,
        natalChartBase: ap?.natalChartBase || `Sol en ${correctSun}, Luna en ${moonSign}, Ascendente ${ascendant}`,
        summary:        ap?.summary || `${correctSun} con Luna en ${moonSign}: energía intensa y sin filtros.`,
        mayanSign:      ap?.mayanSign || "",
        biorhythmBaseline: ap?.biorhythmBaseline || "",
      };
      parsed = { ...parsed, astralProfile: corrected };
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
    }
  }

  return parsed;
}

export function setLocalSession(session: Partial<LocalZodiSession>) {
  if (typeof window === "undefined") return;
  const current = getLocalSession();

  // Detectar cambio de usuario — no heredar datos personales del usuario anterior
  const isSameUser = !session.uid || !current.uid || session.uid === current.uid;

  // Mergear onboardingData en profundidad para el mismo usuario.
  // Si cambia el usuario, no mezclar con datos del anterior.
  const mergedOnboarding = session.onboardingData
    ? { ...(isSameUser ? current.onboardingData : {}), ...session.onboardingData }
    : isSameUser ? current.onboardingData : undefined;

  // Preservar astralProfile para el mismo usuario cuando no se proporciona explícitamente.
  // Si cambia el usuario, limpiar el perfil anterior.
  const mergedAstral = session.astralProfile !== undefined
    ? session.astralProfile
    : isSameUser ? current.astralProfile : undefined;

  const nextSession = { ...current, ...session, onboardingData: mergedOnboarding, astralProfile: mergedAstral };
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

// Limpia completamente la sesión local al cerrar sesión para evitar contaminación de datos
export function clearLocalSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(SESSION_KEY);
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
    currentCity:  od.currentCity,
    currentCountry: od.currentCountry,
    relationshipStatus: od.relationshipStatus,
    partnerName:     od.partnerName,
    partnerBirthDate: od.partnerBirthDate,
    hasKids:         od.hasKids,
    kidsCount:       od.kidsCount,
    personalBio:     od.personalBio,
    readingTone:     od.readingTone,
    favoriteTopics:  od.favoriteTopics,
    onboardingCompleted: true,
    xp: 0, level: 1, streak: 0,
    rank: "Aprendiz Místico",
    plan: "free"
  };
}

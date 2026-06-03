"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLocalSession, setLocalSession, getSavedIdentity } from "@/lib/session";

type FirebaseUserLike = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

export function DashboardGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const restoreFromFirestore = async (user: FirebaseUserLike) => {
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const { getFirebaseDb } = await import("@/lib/firebase/client");
        const db = getFirebaseDb();
        if (!db) return false;

        // 5s timeout — móvil lento o primer acceso puede tardar más de 3s
        const timeout = new Promise<null>(res => setTimeout(() => res(null), 5000));
        const firestoreRead = Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDoc(doc(db, "astralProfiles", user.uid)),
        ]);
        const timedResult = await Promise.race([firestoreRead, timeout]);
        if (!timedResult) return false;

        const [userSnap, astralSnap] = timedResult;

        if (!userSnap.exists() || !userSnap.data().onboardingCompleted) {
          return false;
        }

        const userData = userSnap.data();
        const astralData = astralSnap.exists() ? astralSnap.data() : userData;

        setLocalSession({
          isAuthenticated: true,
          onboardingCompleted: true,
          displayName: userData.displayName || user.displayName || "Viajero ZODI",
          email: user.email || "",
          uid: user.uid,
          loginAt: Date.now(),
          astralProfile: {
            sunSign: astralData.sunSign ?? "",
            moonSign: astralData.moonSign ?? "",
            ascendant: astralData.ascendant ?? "",
            lifePathNumber: astralData.lifePathNumber ?? 1,
            chineseZodiac: astralData.chineseZodiac ?? "",
            mayanSign: astralData.mayanSign ?? "",
            biorhythmBaseline: astralData.biorhythmBaseline ?? new Date().toISOString(),
            natalChartBase: astralData.natalChartBase ?? "",
            summary: astralData.summary ?? "",
          },
          onboardingData: {
            displayName: userData.displayName || "",
            username: userData.username || "",
            avatar: userData.avatar || "/zodi-art/perfil/perfil-1.png",
            genderIdentity: userData.genderIdentity || "",
            birthDate: astralData.birthDate || userData.birthDate || "",
            birthTime: astralData.birthTime || userData.birthTime || "",
            birthCity: astralData.birthCity || userData.birthCity || "",
            birthCountry: astralData.birthCountry || userData.birthCountry || "",
            currentCity: astralData.currentCity || userData.currentCity || "",
            currentCountry: astralData.currentCountry || userData.currentCountry || "",
            readingTone: userData.readingTone ?? "directo",
            favoriteTopics: userData.favoriteTopics ?? [],
            notificationPreferences: userData.notificationPreferences ?? [],
          },
        });

        return true;
      } catch {
        return false;
      }
    };

    const checkSession = async () => {
      const session = getLocalSession();

      // ── VÍA RÁPIDA: sesión local completa ────────────────────────────────
      if (session.isAuthenticated && session.onboardingCompleted) {
        if (!cancelled) setReady(true);
        return;
      }

      // ── CLARA NEGATIVA: autenticado pero nunca hizo onboarding ───────────
      // Solo bouncea si onboardingCompleted=false explícito — NO si solo falta birthDate
      // (eso puede ser localStorage incompleto; Firestore puede tener los datos)
      if (session.isAuthenticated && session.onboardingCompleted === false) {
        router.replace("/onboarding");
        return;
      }

      // ── VERIFICAR CON FIREBASE ────────────────────────────────────────────
      // Cubre: sin sesión local, sesión expirada, birthDate faltante en localStorage,
      // y usuario en dispositivo nuevo.
      try {
        const { onAuthStateChanged } = await import("firebase/auth");
        const { getFirebaseAuth } = await import("@/lib/firebase/client");
        const auth = getFirebaseAuth();

        if (!auth) {
          router.replace("/auth/login");
          return;
        }

        // 8s timeout — da margen para conexiones lentas (móvil 3G)
        const authTimeout = setTimeout(() => {
          if (!cancelled) router.replace("/auth/login");
        }, 8000);

        unsubscribe = onAuthStateChanged(auth, async (user) => {
          clearTimeout(authTimeout);

          if (!user) {
            if (!cancelled) router.replace("/auth/login");
            return;
          }

          const currentSession = getLocalSession();
          const sameUid   = currentSession.uid === user.uid;
          const sameEmail = !!(user.email && currentSession.email && user.email === currentSession.email);

          // Sesión local válida y completa
          if ((sameUid || sameEmail) && currentSession.onboardingCompleted) {
            setLocalSession({ uid: user.uid, loginAt: Date.now() });
            if (!cancelled) setReady(true);
            return;
          }

          // Intentar restaurar desde Firestore (dispositivo nuevo, localStorage borrado, etc.)
          const restored = await restoreFromFirestore(user);
          if (cancelled) return;

          if (restored) {
            setReady(true);
            return;
          }

          // Identidad duradera local (sobrevive a logout y expiración de sesión)
          const identity = getSavedIdentity();
          const identityMatch = identity &&
            (identity.uid === user.uid || identity.email === user.email) &&
            identity.onboardingCompleted;

          if (identityMatch && identity) {
            setLocalSession({
              isAuthenticated: true,
              onboardingCompleted: true,
              uid: user.uid,
              email: user.email || identity.email,
              displayName: user.displayName || "Viajero ZODI",
              loginAt: Date.now(),
              onboardingData: identity.onboardingData,
              astralProfile: identity.astralProfile,
            });
            import("@/lib/firebase/profile").then(({ saveOnboardingProfile }) =>
              saveOnboardingProfile(user.uid, identity.onboardingData, identity.astralProfile)
            ).catch(() => {});
            if (!cancelled) setReady(true);
            return;
          }

          // Sesión local del mismo usuario con datos completos
          if ((sameUid || sameEmail) && currentSession.onboardingCompleted) {
            setLocalSession({ uid: user.uid, loginAt: Date.now() });
            if (currentSession.onboardingData && currentSession.astralProfile) {
              import("@/lib/firebase/profile").then(({ saveOnboardingProfile }) =>
                saveOnboardingProfile(user.uid, currentSession.onboardingData as any, currentSession.astralProfile as any)
              ).catch(() => {});
            }
            if (!cancelled) setReady(true);
            return;
          }

          // Firebase confirmó al usuario pero no hay datos en ningún lado → onboarding
          setLocalSession({
            isAuthenticated: true,
            onboardingCompleted: false,
            displayName: user.displayName || "Viajero ZODI",
            email: user.email || "",
            uid: user.uid,
            loginAt: Date.now(),
          });
          if (!cancelled) router.replace("/onboarding");
        });
      } catch {
        if (!cancelled) router.replace("/auth/login");
      }
    };

    void checkSession();

    // Verificación periódica de sesión (cada 60s)
    const interval = setInterval(() => {
      const session = getLocalSession();
      if (!session.isAuthenticated) {
        router.replace("/auth/login");
      } else if (session.onboardingCompleted === false) {
        router.replace("/onboarding");
      }
    }, 60000);

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" aria-hidden="true">
        <div className="flex flex-col items-center gap-3 opacity-40">
          <div className="h-8 w-8 rounded-full border-2 border-lime-300 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return <div className="animate-in fade-in duration-200">{children}</div>;
}

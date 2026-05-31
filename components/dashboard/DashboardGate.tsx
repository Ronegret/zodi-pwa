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

        const [userSnap, astralSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDoc(doc(db, "astralProfiles", user.uid)),
        ]);

        if (!userSnap.exists() || !userSnap.data().onboardingCompleted) {
          return false;
        }

        const userData = userSnap.data();
        // astralProfiles es opcional: puede faltar si el save fue parcial
        // En ese caso usamos los campos de respaldo guardados en users
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
            displayName: userData.displayName ?? "",
            username: userData.username ?? "",
            avatar: userData.avatar ?? "/zodi-art/perfil/perfil-1.png",
            genderIdentity: userData.genderIdentity ?? "",
            // birthDate en astralProfiles O en users (respaldo)
            birthDate: astralData.birthDate ?? userData.birthDate ?? "",
            birthTime: astralData.birthTime ?? userData.birthTime ?? "",
            birthCity: astralData.birthCity ?? userData.birthCity ?? "",
            birthCountry: astralData.birthCountry ?? userData.birthCountry ?? "",
            currentCity: astralData.currentCity ?? userData.currentCity ?? "",
            currentCountry: astralData.currentCountry ?? userData.currentCountry ?? "",
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

      if (session.isAuthenticated && session.onboardingCompleted) {
        if (!cancelled) setReady(true);
        return;
      }

      if (session.isAuthenticated && !session.onboardingCompleted) {
        router.replace("/onboarding");
        return;
      }

      try {
        const { onAuthStateChanged } = await import("firebase/auth");
        const { getFirebaseAuth } = await import("@/lib/firebase/client");
        const auth = getFirebaseAuth();

        if (!auth) {
          router.replace("/auth/login");
          return;
        }

        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            router.replace("/auth/login");
            return;
          }

          // Renovar loginAt para mantener la sesión activa
          const currentSession = getLocalSession();
          const sameUid   = currentSession.uid === user.uid;
          const sameEmail = !!(user.email && currentSession.email && user.email === currentSession.email);

          if ((sameUid || sameEmail) && currentSession.onboardingCompleted) {
            // Sesión local válida — renovar timestamp y continuar
            setLocalSession({ uid: user.uid, loginAt: Date.now() });
            if (!cancelled) setReady(true);
            return;
          }

          const restored = await restoreFromFirestore(user);
          if (cancelled) return;

          if (restored) {
            setReady(true);
            return;
          }

          // Firestore vacío — intentar con identidad duradera
          const identity = getSavedIdentity();
          const identityMatch = identity && (identity.uid === user.uid || identity.email === user.email) && identity.onboardingCompleted;

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

          // Sesión local con datos del mismo usuario (match uid/email)
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

          // Último recurso: Firebase user autenticado pero sin datos en ningún lado.
          // Dejarlo entrar al dashboard (mejor que mandarlo a onboarding en loop).
          // Si su perfil astral está vacío, el dashboard lo maneja gracefully.
          setLocalSession({
            isAuthenticated: true,
            onboardingCompleted: true,
            displayName: user.displayName || "Viajero ZODI",
            email: user.email || "",
            uid: user.uid,
            loginAt: Date.now(),
          });
          if (!cancelled) setReady(true);
        });
      } catch {
        router.replace("/auth/login");
      }
    };

    void checkSession();

    const interval = setInterval(() => {
      const session = getLocalSession();
      if (!session.isAuthenticated) {
        router.replace("/auth/login");
      } else if (!session.onboardingCompleted) {
        router.replace("/onboarding");
      }
    }, 60000);

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  if (!ready) {
    // Pantalla invisible — evita el flash de "Cargando dashboard..." antes de renderizar
    return <div className="min-h-[100dvh]" aria-hidden="true" />;
  }

  return <>{children}</>;
}

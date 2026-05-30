"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLocalSession, setLocalSession } from "@/lib/session";

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

        if (!userSnap.exists() || !userSnap.data().onboardingCompleted || !astralSnap.exists()) {
          return false;
        }

        const userData = userSnap.data();
        const astralData = astralSnap.data();

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
            birthDate: astralData.birthDate ?? "",
            birthTime: astralData.birthTime ?? "",
            birthCity: astralData.birthCity ?? "",
            birthCountry: astralData.birthCountry ?? "",
            currentCity: astralData.currentCity ?? "",
            currentCountry: astralData.currentCountry ?? "",
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

          const restored = await restoreFromFirestore(user);
          if (cancelled) return;

          if (restored) {
            setReady(true);
            return;
          }

          setLocalSession({
            isAuthenticated: true,
            onboardingCompleted: false,
            displayName: user.displayName || "Viajero ZODI",
            email: user.email || "",
            uid: user.uid,
            loginAt: Date.now(),
          });
          router.replace("/onboarding");
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
    return (
      <div className="grid min-h-[100dvh] place-items-center px-6 text-center text-sm font-bold text-white/55">
        Cargando dashboard...
      </div>
    );
  }

  return <>{children}</>;
}

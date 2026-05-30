"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { getLocalSession, setLocalSession } from "@/lib/session";

/**
 * /auth/complete
 * Recibe el custom token del servidor, completa el sign-in en Firebase
 * y navega al destino final.
 */
export default function AuthCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const name = searchParams.get("name") || "Viajero ZODI";
    const email = searchParams.get("email") || "";
    const next = searchParams.get("next") || "/dashboard";

    if (!token) {
      setStatus("error");
      setErrorMsg("No se recibió token de autenticación.");
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setStatus("error");
      setErrorMsg("Firebase no disponible.");
      return;
    }

    signInWithCustomToken(auth, token)
      .then(async (result) => {
        const user = result.user;

        // Intentar restaurar datos desde Firestore
        let firestoreDone = false;
        try {
          const { getDoc, doc } = await import("firebase/firestore");
          const { getFirebaseDb } = await import("@/lib/firebase/client");
          const db = getFirebaseDb();
          if (db) {
            const [userSnap, astralSnap] = await Promise.all([
              getDoc(doc(db, "users", user.uid)),
              getDoc(doc(db, "astralProfiles", user.uid)),
            ]);
            if (userSnap.exists() && userSnap.data().onboardingCompleted && astralSnap.exists()) {
              const ud = userSnap.data();
              const ad = astralSnap.data();
              setLocalSession({
                isAuthenticated: true,
                onboardingCompleted: true,
                displayName: ud.displayName || user.displayName || name,
                email: user.email || email,
                uid: user.uid,
                loginAt: Date.now(),
                astralProfile: {
                  sunSign: ad.sunSign ?? "",
                  moonSign: ad.moonSign ?? "",
                  ascendant: ad.ascendant ?? "",
                  lifePathNumber: ad.lifePathNumber ?? 1,
                  chineseZodiac: ad.chineseZodiac ?? "",
                  mayanSign: ad.mayanSign ?? "",
                  biorhythmBaseline: ad.biorhythmBaseline ?? new Date().toISOString(),
                  natalChartBase: ad.natalChartBase ?? "",
                  summary: ad.summary ?? "",
                },
                onboardingData: {
                  displayName: ud.displayName ?? "",
                  username: ud.username ?? "",
                  avatar: ud.avatar ?? "/zodi-art/perfil/perfil-1.png",
                  genderIdentity: ud.genderIdentity ?? "",
                  birthDate: ad.birthDate ?? "",
                  birthTime: ad.birthTime ?? "",
                  birthCity: ad.birthCity ?? "",
                  birthCountry: ad.birthCountry ?? "",
                  readingTone: ud.readingTone ?? "directo",
                  favoriteTopics: ud.favoriteTopics ?? [],
                  notificationPreferences: ud.notificationPreferences ?? {
                    dailyHoroscope: true,
                    weeklyReport: false,
                    specialEvents: true,
                  },
                } as any,
              });
              firestoreDone = true;
            }
          }
        } catch {
          // Firestore no disponible — usar datos mínimos
        }

        if (!firestoreDone) {
          const preserved = getLocalSession();
          setLocalSession({
            isAuthenticated: true,
            onboardingCompleted: preserved.onboardingCompleted || false,
            displayName: user.displayName || name,
            email: user.email || email,
            uid: user.uid,
            loginAt: Date.now(),
          });
        }

        // Gems iniciales
        try {
          const g = await import("@/lib/gamification");
          if (g.getGems().total === 0) g.addGems(15);
        } catch { /* ignore */ }

        const session = getLocalSession();
        router.replace(session.onboardingCompleted ? "/dashboard" : "/onboarding");
      })
      .catch((err: any) => {
        console.error("[AUTH COMPLETE] Error con custom token:", err);
        setStatus("error");
        setErrorMsg(err.message || "Error al completar la autenticación.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "error") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "100vh", gap: "1rem",
        background: "#0a0a0f", color: "#fff", fontFamily: "sans-serif"
      }}>
        <p style={{ color: "#ff4d4d" }}>Error de autenticación</p>
        <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>{errorMsg}</p>
        <a href="/auth/login" style={{ color: "#b4f542", textDecoration: "underline" }}>
          Volver al login
        </a>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh", gap: "1rem",
      background: "#0a0a0f", color: "#fff", fontFamily: "sans-serif"
    }}>
      <div style={{
        width: 48, height: 48, border: "3px solid #b4f542",
        borderTopColor: "transparent", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <p style={{ opacity: 0.7 }}>Completando autenticación...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

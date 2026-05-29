"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLocalSession, setLocalSession } from "@/lib/session";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";

type GateState = "loading" | "confirm" | "ready";

// Compute the initial gate state SYNCHRONOUSLY from localStorage.
// Authenticated users never see the loading flash — the correct state
// (confirm or ready) is known before the first paint.
function computeInitialState(): { gate: GateState; name: string; zodiac: string } {
  if (typeof window === "undefined") {
    // Server render — always show loading (SSR shell, never seen by user)
    return { gate: "loading", name: "", zodiac: "" };
  }
  const s = getLocalSession();
  if (!s.isAuthenticated || !s.onboardingCompleted) {
    return { gate: "loading", name: "", zodiac: "" }; // useEffect will redirect
  }
  
  // Auto-confirmar si inició sesión hace menos de 10 segundos
  const justLoggedIn = s.loginAt && (Date.now() - s.loginAt < 10000);
  const confirmed = sessionStorage.getItem("zodi.confirmed");
  
  if (confirmed || justLoggedIn) {
    if (justLoggedIn) sessionStorage.setItem("zodi.confirmed", "1");
    return { gate: "ready", name: "", zodiac: "" };
  }
  
  return {
    gate: "confirm",
    name: s.displayName?.split(" ")[0] ?? "Viajero",
    zodiac: s.astralProfile?.sunSign ?? "",
  };
}

export function DashboardGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Lazy initializer — runs once, synchronously, before first render
  const [init] = useState(computeInitialState);
  const [gateState, setGateState] = useState<GateState>(init.gate);

  // Check authentication status and expiration
  useEffect(() => {
    const checkSession = () => {
      const s = getLocalSession();
      if (!s.isAuthenticated) {
        setGateState("loading");
        router.replace("/auth/login");
        return;
      }
      if (!s.onboardingCompleted && gateState === "loading") {
        router.replace("/onboarding");
        return;
      }
      if (gateState === "loading") {
        setGateState("ready");
      }
    };
    
    checkSession();
    // Re-check every minute for 24h expiration
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [router, gateState]);

  /* ── Confirm identity ── */
  function handleConfirm() {
    sessionStorage.setItem("zodi.confirmed", "1");
    setGateState("ready");
  }

  async function handleChangeUser() {
    try {
      const auth = getFirebaseAuth();
      if (auth) await signOut(auth);
    } catch { /* ignore if Firebase unavailable */ }
    setLocalSession({ isAuthenticated: false, onboardingCompleted: false });
    sessionStorage.removeItem("zodi.confirmed");
    router.replace("/auth/login");
  }

  /* ── Loading (unauthenticated, will redirect) ── */
  if (gateState === "loading") {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="glass-panel rounded-md p-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-lime-200/70">ZODI</p>
          <h1 className="mt-3 text-2xl font-black animate-pulse">Abriendo el portal...</h1>
          <Link href="/" className="mt-6 inline-block text-sm text-white/40 hover:text-white/70 transition">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  /* ── Identity confirmation ── */
  if (gateState === "confirm") {
    return (
      <div className="relative grid min-h-screen place-items-center px-4 overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          autoPlay muted loop playsInline
        >
          <source src="/zodi-art/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        {/* Escape link top-left */}
        <Link
          href="/"
          className="absolute top-5 left-5 z-20 inline-flex items-center gap-2 text-sm text-white/40 hover:text-lime-300 transition"
        >
          ← Inicio
        </Link>

        <div className="relative z-10 glass-panel neon-border w-full max-w-sm rounded-xl p-8 text-center">
          <div className="relative mx-auto mb-6 h-24 w-full max-w-[220px]">
            <Image
              src="/zodi-logo-mark.png"
              alt="ZODI"
              fill
              className="object-contain drop-shadow-[0_0_24px_rgba(184,255,23,0.5)]"
              priority
            />
          </div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-lime-200/60 mb-3">Tu oráculo personal</p>
          <h1 className="text-4xl font-black leading-tight mb-1">
            ¿Eres <span className="text-lime-300">{init.name}</span>?
          </h1>
          {init.zodiac && (
            <p className="text-sm text-white/50 mb-6">{init.zodiac} · tu espacio astral te espera</p>
          )}
          {!init.zodiac && <p className="text-sm text-white/50 mb-6">Confirma para acceder</p>}
          <button
            onClick={handleConfirm}
            className="w-full rounded-lg bg-lime-300 py-4 text-lg font-black text-black transition hover:bg-lime-200 active:scale-95 shadow-[0_0_20px_rgba(184,255,23,0.3)]"
          >
            Sí, soy yo ❆
          </button>
          <button
            onClick={handleChangeUser}
            className="mt-3 w-full text-sm text-white/40 transition hover:text-white/70"
          >
            No soy yo — cambiar cuenta
          </button>
          <Link
            href="/"
            className="mt-4 block text-xs text-white/25 hover:text-white/50 transition"
          >
            ← Volver al inicio sin acceder
          </Link>
        </div>
      </div>
    );
  }

  /* ── Ready ── */
  return <>{children}</>;
}

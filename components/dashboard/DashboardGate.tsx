"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLocalSession } from "@/lib/session";
import { Loader2 } from "lucide-react";

type GateState = "loading" | "ready";

// Compute the initial gate state SYNCHRONOUSLY from localStorage.
function computeInitialState(): { gate: GateState } {
  if (typeof window === "undefined") {
    // Server render — always show loading (SSR shell, never seen by user)
    return { gate: "loading" };
  }
  const s = getLocalSession();
  if (!s.isAuthenticated || !s.onboardingCompleted) {
    return { gate: "loading" }; // useEffect will redirect
  }
  
  return { gate: "ready" };
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
    // Re-check every minute for expiration
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [router, gateState]);

  /* ── Loading (unauthenticated, will redirect) ── */
  if (gateState === "loading") {
    return (
      <div className="grid min-h-[calc(100vh-68px)] place-items-center px-4">
        <div className="glass-panel neon-border w-full max-w-sm rounded-xl p-8 text-center flex flex-col items-center">
          <div className="relative mb-6 h-16 w-32">
            <Image
              src="/zodi-logo.png"
              alt="ZODI"
              fill
              className="object-contain drop-shadow-[0_0_24px_rgba(184,255,23,0.5)]"
              priority
            />
          </div>
          <h1 className="mt-2 text-2xl font-black flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-lime-300" />
            Abriendo portal...
          </h1>
          <Link href="/" className="mt-8 inline-block rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm text-white/50 hover:text-lime-300 hover:border-lime-300/30 transition">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  /* ── Ready ── */
  return <>{children}</>;
}

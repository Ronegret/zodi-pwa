"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalSession } from "@/lib/session";

export function DashboardGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Middleware ya asegura que entramos con cookie válida.
  // Aquí solo re-verificamos la expiración periódicamente.
  useEffect(() => {
    const checkSession = () => {
      const s = getLocalSession();
      if (!s.isAuthenticated) {
        router.replace("/auth/login");
      } else if (!s.onboardingCompleted) {
        router.replace("/onboarding");
      }
    };
    
    checkSession();
    // Re-check every minute for expiration
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [router]);

  /* ── Ready ── */
  return <>{children}</>;
}

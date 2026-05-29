"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalSession } from "@/lib/session";

export function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const session = getLocalSession();
    if (session.uid && session.onboardingCompleted) {
      router.replace("/dashboard");
    } else if (session.uid) {
      router.replace("/onboarding");
    }
  }, [router]);

  return null;
}

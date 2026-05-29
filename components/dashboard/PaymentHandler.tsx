"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { addGems } from "@/lib/gamification";
import { Sparkles } from "lucide-react";

export function PaymentHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [justPurchased, setJustPurchased] = useState<number | null>(null);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const gems = searchParams.get("gems");

    if (payment === "success" && gems) {
      const parsedGems = parseInt(gems, 10);
      if (!isNaN(parsedGems)) {
        addGems(parsedGems);
        setJustPurchased(parsedGems);
        
        // Remove query params to prevent double adding on refresh
        router.replace(pathname, { scroll: false });
        
        // Hide notification after 5 seconds
        setTimeout(() => setJustPurchased(null), 5000);
      }
    }
  }, [searchParams, router, pathname]);

  if (!justPurchased) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="glass-panel px-6 py-3 rounded-full border border-lime-400/50 flex items-center gap-3 bg-black/80 backdrop-blur-md shadow-[0_0_30px_rgba(184,255,23,0.3)]">
        <Sparkles className="w-5 h-5 text-lime-300 animate-pulse" />
        <span className="text-white font-bold">
          ¡Transacción exitosa! +{justPurchased} Gemas añadidas.
        </span>
      </div>
    </div>
  );
}

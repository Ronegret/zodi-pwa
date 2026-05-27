"use client";

import { useState } from "react";
import { Sparkles, Flame, Crown, ShieldHalf } from "lucide-react";
import { getLocalSession } from "@/lib/session";

export function PremiumUI() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const session = getLocalSession();

  const handleBuyGems = async (packId: string) => {
    if (!session.uid || !session.email) {
      alert("Debes iniciar sesión para comprar gemas.");
      return;
    }
    setLoadingId(packId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: session.uid, email: session.email, packId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error al iniciar el pago: " + (data.error || "Desconocido"));
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al iniciar el pago.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid gap-5">
      <div className="glass-panel rounded-md p-6 border border-lime-300/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Crown className="w-32 h-32 text-lime-300" />
        </div>
        <h2 className="text-2xl font-black mb-2 flex items-center gap-2 relative z-10">
          <Sparkles className="h-6 w-6 text-lime-300" />
          Tienda de Gemas
        </h2>
        <p className="text-white/70 mb-6 relative z-10">
          Las Gemas de ZODI te permiten hacerle preguntas directas al Oráculo conversacional, tirar el tarot cuantas veces quieras y recibir consejos astrológicos profundos de emergencia.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 relative z-10">
          {/* Pack Crisis */}
          <div className="rounded-xl border border-white/15 bg-black/40 p-5 flex flex-col items-center text-center transition hover:border-lime-300/40">
            <div className="h-12 w-12 rounded-full bg-lime-300/10 flex items-center justify-center mb-3">
              <Flame className="h-6 w-6 text-lime-300" />
            </div>
            <h3 className="font-black text-lg text-white">Pack Crisis</h3>
            <p className="text-lime-300 font-bold text-xl my-2">50 Gemas</p>
            <p className="text-sm text-white/50 mb-5 flex-grow">Para emergencias, decisiones de último minuto y bloqueos energéticos.</p>
            <button
              onClick={() => handleBuyGems("crisis")}
              disabled={loadingId !== null}
              className="w-full rounded-md bg-white/10 hover:bg-white/20 py-3 font-black text-white transition disabled:opacity-50"
            >
              {loadingId === "crisis" ? "Cargando..." : "Comprar por 1.99€"}
            </button>
          </div>

          {/* Pack Místico */}
          <div className="rounded-xl border-2 border-lime-300/50 bg-lime-300/5 p-5 flex flex-col items-center text-center transition hover:border-lime-300 relative shadow-[0_0_30px_rgba(184,255,23,0.1)]">
            <div className="absolute -top-3 bg-lime-300 text-black px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest">
              Mejor valor
            </div>
            <div className="h-12 w-12 rounded-full bg-lime-300/20 flex items-center justify-center mb-3">
              <Crown className="h-6 w-6 text-lime-300" />
            </div>
            <h3 className="font-black text-lg text-white">Pack Místico</h3>
            <p className="text-lime-300 font-bold text-xl my-2">200 Gemas</p>
            <p className="text-sm text-white/50 mb-5 flex-grow">Preguntas ilimitadas al oráculo, ideal para los que sobrepiensan absolutamente todo.</p>
            <button
              onClick={() => handleBuyGems("mistico")}
              disabled={loadingId !== null}
              className="w-full rounded-md bg-lime-300 hover:bg-lime-200 py-3 font-black text-black transition shadow-[0_0_15px_rgba(184,255,23,0.3)] disabled:opacity-50"
            >
              {loadingId === "mistico" ? "Cargando..." : "Comprar por 4.99€"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-6 flex items-center justify-center gap-2">
          Pagos seguros cifrados con Stripe <ShieldHalf className="w-3 h-3" /> Soporta Bizum, Apple Pay y Tarjetas
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Gem, Sparkles } from "lucide-react";
import { addGems } from "@/lib/gamification";

type GemPackage = {
  id: string;
  name: string;
  amount: number;
  bonus: number;
  price: string;
  popular?: boolean;
};

const gemPackages: GemPackage[] = [
  {
    id: "pack-1",
    name: "Polvo Estelar",
    amount: 150,
    bonus: 0,
    price: "1,99 €",
  },
  {
    id: "pack-2",
    name: "Bolsa de Caos",
    amount: 500,
    bonus: 50,
    price: "4,99 €",
    popular: true,
  },
  {
    id: "pack-3",
    name: "Cofre del Oráculo",
    amount: 1200,
    bonus: 300,
    price: "9,99 €",
  }
];

export function GemStore() {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePurchase = (pkg: GemPackage) => {
    // Simulate a network request
    setPurchasingId(pkg.id);
    setTimeout(() => {
      try {
        const totalGems = pkg.amount + pkg.bonus;
        addGems(totalGems);
        setSuccessMsg(`¡Añadiste ${totalGems} gemas a tu cuenta!`);
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        console.error("Error al procesar la compra", err);
      } finally {
        setPurchasingId(null);
      }
    }, 1200);
  };

  return (
    <section className="mt-12 mb-8">
      {/* Toast Notification para la compra exitosa */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-lime-400 bg-black/90 px-6 py-3 text-sm font-bold text-lime-100 shadow-[0_0_30px_rgba(184,255,23,0.3)]"
          >
            <Check className="h-5 w-5 text-lime-300" />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8">
        <p className="zodi-kicker text-lime-300/80">Recarga de Energía</p>
        <h2 className="mt-2 text-3xl font-black md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          La magia no es gratis
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/60 max-w-xl">
          ¿No quieres ataduras con suscripciones? Compra gemas sueltas para desbloquear respuestas profundas del tarot, consultar al oráculo o usar el tono despiadado de ZODI solo cuando lo necesites.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {gemPackages.map((pkg) => (
          <article
            key={pkg.id}
            className={`glass-panel hover-bubble relative flex flex-col items-center justify-center rounded-2xl p-6 text-center transition-all ${
              pkg.popular 
                ? "border-lime-300/40 bg-lime-300/[0.04] shadow-[0_0_30px_rgba(184,255,23,0.12)] scale-[1.02]" 
                : "border-white/10 hover:border-white/20"
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-lime-300 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-[0_0_15px_rgba(184,255,23,0.5)]">
                <Sparkles className="h-3 w-3" />
                Mejor valor
              </div>
            )}

            <div className="mb-4 mt-2 flex items-center justify-center">
              {pkg.id === "pack-1" && <Gem className="h-10 w-10 text-cyan-300" />}
              {pkg.id === "pack-2" && (
                <div className="relative">
                  <Gem className="h-14 w-14 text-lime-300 drop-shadow-[0_0_12px_rgba(184,255,23,0.4)]" />
                  <Gem className="absolute -right-3 bottom-0 h-6 w-6 text-lime-100" />
                </div>
              )}
              {pkg.id === "pack-3" && (
                <div className="relative">
                  <Gem className="h-16 w-16 text-fuchsia-400 drop-shadow-[0_0_15px_rgba(255,43,214,0.5)]" />
                  <Gem className="absolute -left-2 top-2 h-7 w-7 text-fuchsia-200" />
                  <Gem className="absolute -right-1 bottom-1 h-5 w-5 text-fuchsia-100" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-white/90">{pkg.name}</h3>
            
            <div className="mt-2 flex items-center justify-center gap-1.5 font-mono text-2xl font-black text-white">
              {pkg.amount} <Gem className="h-5 w-5 text-lime-300" />
            </div>
            
            {pkg.bonus > 0 ? (
              <p className="mt-1 text-xs font-bold text-lime-300">
                + {pkg.bonus} gemas de regalo
              </p>
            ) : (
              <p className="mt-1 text-xs text-white/30 invisible">Sin bonus</p>
            )}

            <button
              onClick={() => handlePurchase(pkg)}
              disabled={purchasingId !== null}
              className={`mt-6 w-full rounded-xl px-4 py-3 font-black transition-all ${
                pkg.popular
                  ? "bg-lime-300 text-black hover:bg-lime-200 hover:shadow-[0_0_20px_rgba(184,255,23,0.4)]"
                  : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
              } disabled:opacity-50 disabled:pointer-events-none`}
            >
              {purchasingId === pkg.id ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Procesando...
                </span>
              ) : (
                pkg.price
              )}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

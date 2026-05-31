"use client";

import Image from "next/image";
import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// useLayoutEffect en cliente, useEffect en SSR (evita warning de Next.js)
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);

  const handleFinish = useCallback(() => {
    sessionStorage.setItem("zodi.splash_seen", "true");
    document.documentElement.classList.add("splash-seen");
    document.body.style.overflow = "";
    setShowSplash(false);
  }, []);

  // useLayoutEffect — corre ANTES del primer paint, elimina el flash en visitas repetidas
  useIsomorphicLayoutEffect(() => {
    try {
      if (sessionStorage.getItem("zodi.splash_seen")) {
        setShowSplash(false);
        return;
      }
    } catch {
      // sessionStorage no disponible (private mode extremo)
      setShowSplash(false);
      return;
    }

    // Primera visita — mostrar splash
    document.body.style.overflow = "hidden";
    const fallbackTimer = setTimeout(handleFinish, 9000);

    return () => {
      clearTimeout(fallbackTimer);
      document.body.style.overflow = "";
    };
  }, [handleFinish]);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="zodi-splash-container fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black overflow-hidden"
          style={{ paddingBottom: "max(48px, env(safe-area-inset-bottom, 48px))" }}
        >
          {/* Fullscreen Video Background */}
          <video
            autoPlay
            muted
            playsInline
            onEnded={handleFinish}
            onError={handleFinish}
            poster="/zodi-art/zodi-fondoo.png"
            className="absolute inset-0 h-full w-full object-cover md:object-contain bg-black"
          >
            <source src="/zodi-art/splash-zodi.mp4" type="video/mp4" />
          </video>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

          <div className="relative w-full px-6 text-center z-10 flex flex-col items-center pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
              className="relative h-20 w-48 mx-auto"
            >
              <Image
                src="/zodi-logo.png"
                alt="ZODI"
                fill
                sizes="192px"
                className="object-contain drop-shadow-[0_0_24px_rgba(184,255,23,0.4)] mix-blend-screen"
                priority
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="mt-3 text-sm md:text-base font-medium text-white/70"
            >
              Conectando con el cosmos...
            </motion.p>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFinish();
              }}
              className="mt-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-8 py-3 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 relative z-50 cursor-pointer"
            >
              Saltar intro
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

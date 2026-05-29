"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Check if we already showed the splash in this session
    const hasSeenSplash = sessionStorage.getItem("zodi.splash_seen");
    if (!hasSeenSplash) {
      setShowSplash(true);
    }
  }, []);

  const handleFinish = () => {
    sessionStorage.setItem("zodi.splash_seen", "true");
    setShowSplash(false);
  };

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
        >
          {/* Fondo o decoración opcional */}
          <div className="absolute inset-0 bg-black opacity-80" />
          
          <div className="relative w-full max-w-sm px-6 text-center">
            <video 
              autoPlay 
              muted 
              playsInline 
              onEnded={handleFinish}
              className="w-full rounded-2xl shadow-[0_0_40px_rgba(184,255,23,0.3)] object-cover mb-8"
              style={{ maxHeight: "60vh" }}
            >
              <source src="/zodi-art/splash-zodi.mp4" type="video/mp4" />
            </video>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-4xl font-black text-lime-300 tracking-widest uppercase glitch-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ZODI
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-2 text-sm text-white/50"
            >
              Conectando con el cosmos...
            </motion.p>
            
            <button 
              onClick={handleFinish}
              className="mt-8 rounded-full border border-white/20 px-6 py-2 text-xs font-bold text-white/60 hover:bg-white/10 transition"
            >
              Saltar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

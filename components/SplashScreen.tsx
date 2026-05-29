"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if we already showed the splash in this session
    const hasSeenSplash = sessionStorage.getItem("zodi.splash_seen");
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleFinish = () => {
    sessionStorage.setItem("zodi.splash_seen", "true");
    document.documentElement.classList.add("splash-seen");
    setShowSplash(false);
  };

  // If React knows it should be hidden, unmount it to save memory.
  if (!showSplash) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="zodi-splash-container fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black pb-12 overflow-hidden"
      >
          {/* Fullscreen Video Background */}
          <video 
            autoPlay 
            muted 
            playsInline 
            onEnded={handleFinish}
            poster="/zodi-art/zodi-fondoo.png"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/zodi-art/splash-zodi.mp4" type="video/mp4" />
          </video>
          
          {/* Gradient Overlay to make text readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="relative w-full px-6 text-center z-10 flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="relative h-20 w-48 mx-auto"
            >
              <Image
                src="/zodi-logo.png"
                alt="ZODI"
                fill
                className="object-contain drop-shadow-[0_0_24px_rgba(184,255,23,0.4)] mix-blend-screen"
                priority
              />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-3 text-sm md:text-base font-medium text-white/70"
            >
              Conectando con el cosmos...
            </motion.p>
            
            <button 
              onClick={handleFinish}
              className="mt-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-8 py-3 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              Saltar intro
            </button>
          </div>
        </motion.div>
    </AnimatePresence>
  );
}

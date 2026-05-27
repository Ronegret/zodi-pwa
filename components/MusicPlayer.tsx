"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Music, X } from "lucide-react";

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Inicializar el audio
    audioRef.current = new Audio("/audio/zodi-te-lo-dijo.mp3");
    audioRef.current.loop = true; // Repetir infinitamente

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    
    setIsPlaying(!isPlaying);
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    setIsDismissed(true);
  };

  if (isDismissed && !isPlaying) return null; // Si lo descartó y no está reproduciendo, lo escondemos por completo.

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {showPrompt && !isPlaying && !isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="glass-panel relative flex items-center gap-4 rounded-2xl border border-lime-300/30 p-4 shadow-[0_0_30px_rgba(184,255,23,0.15)]"
          >
            <button
              onClick={dismissPrompt}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-black border border-white/20 text-white/60 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/20">
              <Image
                src="/zodi-logo-mark.png"
                alt="ZODI Vinilo"
                fill
                className="object-contain p-1 mix-blend-screen"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-lime-100">¿ZODI te pone música?</p>
              <p className="text-xs text-white/60">Tema: ZODI te lo dijo</p>
            </div>
            <button
              onClick={togglePlay}
              className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-300 text-black shadow-lg transition hover:scale-105"
            >
              <Play className="h-5 w-5 ml-1" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vinilo Flotante */}
      <AnimatePresence>
        {(!showPrompt || isPlaying) && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={togglePlay}
            className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-lime-300/40 shadow-[0_0_20px_rgba(184,255,23,0.2)]"
          >
            {/* Vinilo girando si está reproduciendo */}
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-black"
            >
              {/* Surcos del vinilo */}
              <div className="absolute inset-2 rounded-full border border-white/10" />
              <div className="absolute inset-4 rounded-full border border-white/10" />
              <div className="absolute inset-6 rounded-full border border-white/10" />
              {/* Centro (label) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-lime-300 shadow-inner" />
              </div>
              {/* Reflejo estilo vinilo */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50" />
            </motion.div>
            
            {/* Icono de Play/Pause en el centro */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white ml-1" />}
            </div>

            {/* Notas musicales saliendo */}
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, y: 0, x: 0 }}
                animate={{ opacity: [0, 1, 0], y: -30, x: 20 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute right-0 top-0 text-lime-300"
              >
                <Music className="h-3 w-3" />
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

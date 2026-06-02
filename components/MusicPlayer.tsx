"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, Pause, Play, Volume2, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function MusicPlayer() {
  const pathname  = usePathname();
  const isDash    = pathname?.startsWith("/dashboard");
  const [isPlaying, setIsPlaying]   = useState(false);
  const [dismissed, setDismissed]   = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/audio/zodi-te-lo-dijo.mp3");
    audioRef.current.loop = true;
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, []);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play().catch(() => {}); }
    setIsPlaying(p => !p);
  };

  if (dismissed) return null;

  // En el dashboard — mini player en esquina superior-derecha del nav (mobile) o sidebar (desktop)
  if (isDash) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="fixed bottom-[76px] right-3 z-30 lg:bottom-4 lg:right-4"
        >
          {expanded ? (
            /* Panel expandido */
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 10 }}
              className="flex items-center gap-2.5 rounded-2xl border border-lime-300/30 bg-[rgba(4,4,10,0.95)] px-3 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.7),0_0_16px_rgba(184,255,23,0.12)]"
            >
              {/* Vinilo girando */}
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="relative h-9 w-9 shrink-0 rounded-full border border-lime-300/30 bg-black"
              >
                <div className="absolute inset-1 rounded-full border border-white/08" />
                <div className="absolute inset-2 rounded-full border border-white/08" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-lime-300" />
                </div>
              </motion.div>

              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-lime-300/60">Música ZODI</p>
                <p className="text-xs font-black text-white truncate max-w-[110px]">ZODI te lo dijo</p>
              </div>

              {/* Play / Pause */}
              <button
                onClick={toggle}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lime-300 text-black transition hover:bg-lime-200 active:scale-95"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </button>

              <button onClick={() => setExpanded(false)} className="text-white/30 hover:text-white/60 transition shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ) : (
            /* Botón colapsado — compacto, no invasivo */
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpanded(true)}
              aria-label={isPlaying ? "Pausar música" : "Reproducir música ZODI"}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/80 shadow-[0_2px_12px_rgba(0,0,0,0.7)] transition hover:border-lime-300/40 lg:h-11 lg:w-11 lg:rounded-2xl"
            >
              {/* Vinilo de fondo */}
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-1.5 rounded-full border border-white/08"
              />
              {/* Icono principal — play o nota musical */}
              {isPlaying
                ? <Pause className="relative z-10 h-4 w-4 text-lime-300" />
                : <Play className="relative z-10 h-4 w-4 text-lime-300 ml-0.5" />
              }
              {/* Pulso si está reproduciendo */}
              {isPlaying && (
                <motion.span
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl border border-lime-300/30"
                />
              )}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // En la landing mostramos el botón flotante simple
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.7, scale: 1 }}
      whileHover={{ opacity: 1, scale: 1.1 }}
      onClick={toggle}
      aria-label={isPlaying ? "Pausar música ZODI" : "Reproducir música ZODI"}
      className="fixed bottom-6 right-4 z-50 h-11 w-11 overflow-hidden rounded-full border border-lime-300/40 bg-black/80 shadow-[0_0_15px_rgba(184,255,23,0.15)]"
    >
      <motion.div animate={{ rotate: isPlaying ? 360 : 0 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="absolute inset-1 rounded-full border border-white/10" />
        <div className="absolute inset-2 rounded-full border border-white/10" />
        <div className="h-3 w-3 rounded-full bg-lime-300" />
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition hover:opacity-100">
        {isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
      </div>
    </motion.button>
  );
}

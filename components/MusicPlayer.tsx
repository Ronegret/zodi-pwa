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

  // En el dashboard mostramos un banner expandible más visible
  if (isDash) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-[88px] left-4 z-40 lg:bottom-6 lg:left-auto lg:right-6"
        >
          {expanded ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-2xl border border-lime-300/30 bg-black/90 px-4 py-3 shadow-[0_0_20px_rgba(184,255,23,0.2)] backdrop-blur-md"
            >
              {/* Vinilo girando */}
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="relative h-10 w-10 shrink-0 rounded-full border border-lime-300/40 bg-black shadow-[0_0_10px_rgba(184,255,23,0.3)]"
              >
                <div className="absolute inset-1 rounded-full border border-white/10" />
                <div className="absolute inset-2 rounded-full border border-white/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-lime-300" />
                </div>
              </motion.div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-lime-300/70">Música ZODI</p>
                <p className="text-sm font-black text-white truncate max-w-[140px]">ZODI te lo dijo 🎵</p>
              </div>
              <button onClick={toggle} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime-300 text-black transition hover:bg-lime-200">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
              <button onClick={() => setExpanded(false)} className="text-white/40 hover:text-white/70 transition">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpanded(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-lime-300/40 bg-black/80 shadow-[0_0_15px_rgba(184,255,23,0.2)] backdrop-blur-md transition hover:border-lime-300/70"
            >
              <Music2 className={`h-5 w-5 ${isPlaying ? "text-lime-300" : "text-white/60"}`} />
              {isPlaying && (
                <motion.span
                  animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border border-lime-300/40"
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

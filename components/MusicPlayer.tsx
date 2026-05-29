"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Music, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function MusicPlayer() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const bottomClass = isDashboard ? "bottom-[100px]" : "bottom-6";

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/audio/zodi-te-lo-dijo.mp3");
    audioRef.current.loop = true;

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
  };

  return (
    <div className={`fixed right-4 z-50 flex flex-col items-end gap-3 sm:right-6 ${bottomClass} transition-all duration-500 opacity-60 hover:opacity-100`}>
      {/* Subtle floating vinyl */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={togglePlay}
        className="relative h-10 w-10 overflow-hidden rounded-full border border-lime-300/40 shadow-[0_0_15px_rgba(184,255,23,0.15)]"
      >
        {/* Vinilo girando si está reproduciendo */}
        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-black"
        >
          {/* Surcos del vinilo */}
          <div className="absolute inset-1 rounded-full border border-white/10" />
          <div className="absolute inset-2 rounded-full border border-white/10" />
          <div className="absolute inset-3 rounded-full border border-white/10" />
          {/* Centro (label) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-lime-300 shadow-inner" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50" />
        </motion.div>
        
        {/* Icono de Play/Pause en el centro */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          {isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
        </div>

        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{ opacity: [0, 1, 0], y: -20, x: 10 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute right-0 top-0 text-lime-300 pointer-events-none"
          >
            <Music className="h-2 w-2" />
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}

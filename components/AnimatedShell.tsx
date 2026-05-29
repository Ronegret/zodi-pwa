"use client";

import { motion } from "framer-motion";
import { PwaBoot } from "@/components/pwa/PwaBoot";

export function AnimatedShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative min-h-screen pb-24 lg:pb-8"
    >
      <PwaBoot />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[8%] top-24 h-24 w-24 rounded-full border border-lime-300/30"
          animate={{ y: [0, 18, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[12%] top-40 h-40 w-40 rounded-full border border-fuchsia-400/20"
          animate={{ y: [0, -22, 0], rotate: [0, -12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {children}
    </motion.main>
  );
}

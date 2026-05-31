"use client";

import { motion } from "framer-motion";

export function AnimatedShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-[100dvh] pb-24 lg:pb-8"
    >
      {children}
    </motion.main>
  );
}

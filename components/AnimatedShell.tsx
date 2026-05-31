"use client";

import { motion } from "framer-motion";

export function AnimatedShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0.75 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="relative min-h-[100dvh] pb-24 lg:pb-8"
    >
      {children}
    </motion.main>
  );
}

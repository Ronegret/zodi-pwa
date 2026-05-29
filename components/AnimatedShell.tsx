"use client";

import { motion } from "framer-motion";
import { PwaBoot } from "@/components/pwa/PwaBoot";

export function AnimatedShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="relative min-h-screen pb-24 lg:pb-8"
    >
      <PwaBoot />
      {children}
    </motion.main>
  );
}

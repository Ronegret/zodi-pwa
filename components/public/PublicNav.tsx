"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Lecturas", href: "#lecturas" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Premium", href: "#premium" },
  { label: "FAQ", href: "#faq" }
];

export function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-lime-300/10 bg-black/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
            <span className="relative block h-20 w-48 overflow-hidden scale-110 origin-left">
              <Image src="/zodi-logo-mark.png" alt="Logo de ZODI" fill sizes="128px" className="object-contain brightness-125 contrast-125" priority />
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm text-white/64 md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-lime-200">{link.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="rounded-md border border-white/15 px-3 py-2 text-sm font-bold text-white/75 transition hover:border-white/30">Entrar</Link>
            <Link href="/auth/register" className="rounded-md bg-lime-300 px-3 py-2 text-sm font-black text-black transition hover:bg-lime-200">Crear cuenta</Link>
            {/* Hamburger — solo en mobile */}
            <button
              className="ml-1 grid h-9 w-9 place-items-center rounded-md border border-white/15 text-white/70 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-x-0 top-[68px] z-39 border-b border-lime-300/10 bg-black/95 backdrop-blur-xl md:hidden overflow-hidden"
          >
            <div className="px-4 pb-6 pt-4">
              <nav className="grid gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-4 py-3 font-display text-xl sm:text-2xl font-bold tracking-wide text-white/90 transition hover:bg-white/5 hover:text-lime-200"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="mt-4 grid gap-2">
                <Link href="/auth/login" onClick={() => setOpen(false)} className="rounded-md border border-white/20 px-4 py-3 text-center font-display text-lg font-bold text-white/80 transition hover:border-white/35">
                  Entrar
                </Link>
                <Link href="/auth/register" onClick={() => setOpen(false)} className="rounded-md bg-lime-300 px-4 py-3 text-center font-display text-lg font-black text-black transition hover:bg-lime-200">
                  Crear cuenta gratis
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

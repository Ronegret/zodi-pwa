"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Menu, Share, X } from "lucide-react";
import { usePwa } from "@/components/pwa/PwaBoot";

const navLinks = [
  { label: "Lecturas", href: "#lecturas" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Premium", href: "#premium" },
  { label: "FAQ", href: "#faq" },
];

const HEADER_H = 64;

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const { installState, install } = usePwa();

  const canInstall = installState === "android" || installState === "ios";

  return (
    <>
      {/* ── Sticky Header ── */}
      <header
        id="main-header"
        style={{ height: HEADER_H }}
        className="sticky top-0 z-40 flex items-center border-b border-white/08 bg-black/85 backdrop-blur-xl"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
            <span className="relative block h-9 w-32">
              <Image
                src="/zodi-logo-mark.png"
                alt="ZODI"
                fill
                sizes="128px"
                className="object-contain brightness-125 contrast-125"
                priority
              />
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/55 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition hover:text-lime-300"
              >
                {link.label}
              </a>
            ))}
            {canInstall && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 rounded-lg border border-lime-300/30 px-3 py-1.5 text-xs font-bold text-lime-300 transition hover:bg-lime-300/10"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar App
              </button>
            )}
          </nav>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="hidden rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/75 transition hover:border-white/30 sm:inline-block"
            >
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-lime-300 px-4 py-2 text-sm font-black text-black transition hover:bg-lime-200"
            >
              Crear cuenta
            </Link>
            {/* Hamburger — mobile only */}
            <button
              className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/15 text-white/70 transition hover:border-white/30 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              top: HEADER_H,
              maxHeight: `calc(100dvh - ${HEADER_H}px)`,
            }}
            className="fixed inset-x-0 z-[38] overflow-y-auto bg-black/97 backdrop-blur-2xl border-b border-lime-300/15 shadow-2xl md:hidden"
          >
            <div className="px-6 pt-8 pb-10">
              {/* Nav links */}
              <nav className="flex flex-col divide-y divide-white/07">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="py-4 text-2xl font-black tracking-tight text-white transition-colors hover:text-lime-300"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-3">
                {/* ── Descargar App (si está disponible) ── */}
                {canInstall && (
                  <button
                    onClick={() => { install(); setOpen(false); }}
                    className="flex items-center justify-center gap-3 rounded-xl border border-lime-300/40 bg-lime-300/10 py-4 text-lg font-black text-lime-300 transition hover:bg-lime-300/20"
                  >
                    {installState === "ios"
                      ? <Share className="h-5 w-5" />
                      : <Download className="h-5 w-5" />
                    }
                    {installState === "ios"
                      ? "Añadir a Inicio (iOS)"
                      : "Descargar App"
                    }
                  </button>
                )}

                {/* ── Siempre visible si no hay prompt nativo ── */}
                {!canInstall && (
                  <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 py-4 text-base font-bold text-white/40">
                    <Download className="h-5 w-5" />
                    App disponible en tu navegador
                  </div>
                )}

                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl border border-white/20 py-4 text-center text-lg font-bold text-white/80 transition hover:border-white/40"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl bg-lime-300 py-4 text-center text-lg font-black text-black transition hover:bg-lime-200 shadow-[0_0_20px_rgba(184,255,23,0.25)]"
                >
                  Crear cuenta gratis ✦
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

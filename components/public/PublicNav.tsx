"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Download, Menu, Share, X } from "lucide-react";

const navLinks = [
  { label: "Lecturas", href: "#lecturas" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Premium", href: "#premium" },
  { label: "FAQ", href: "#faq" },
];

const HEADER_H = 64;

// ── Separate PWA button — only mounts client-side, never causes header re-render ──
function PwaInstallButton({ compact = false }: { compact?: boolean }) {
  const [installState, setInstallState] = useState<"idle" | "android" | "ios" | "dismissed">("idle");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check iOS
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;

    if (isStandalone) return;
    if (sessionStorage.getItem("zodi-pwa-dismissed")) return;

    if (isIos && isSafari) {
      setInstallState("ios");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallState("android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (installState === "ios") {
      alert('En iPhone: pulsa el botón "Compartir" (⎋) y luego "Añadir a pantalla de inicio".');
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setInstallState("dismissed");
      sessionStorage.setItem("zodi-pwa-dismissed", "1");
    }
  };

  if (installState === "idle" || installState === "dismissed") return null;

  if (compact) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg border border-lime-300/30 px-3 py-1.5 text-xs font-bold text-lime-300 transition hover:bg-lime-300/10"
      >
        <Download className="h-3.5 w-3.5" />
        Descargar App
      </button>
    );
  }

  return (
    <button
      onClick={install}
      className="flex items-center justify-center gap-3 rounded-xl border border-lime-300/40 bg-lime-300/10 py-4 text-lg font-black text-lime-300 transition hover:bg-lime-300/20"
    >
      {installState === "ios" ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
      {installState === "ios" ? "Añadir a Inicio (iOS)" : "Descargar App"}
    </button>
  );
}

export function PublicNav() {
  // open state is the ONLY state in this component — no external hooks that re-render
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Sticky Header — pure black bg on mobile, no backdrop-blur (prevents repaint with video) ── */}
      <header
        id="main-header"
        style={{
          minHeight: HEADER_H,
          paddingTop: "env(safe-area-inset-top, 0px)",
          transform: "translateZ(0)",
          contain: "layout style paint",
          background: "rgb(6, 6, 10)",
        }}
        className="sticky top-0 z-50 flex flex-col justify-center border-b border-white/08"
      >
        <div className="mx-auto flex w-full h-16 max-w-7xl items-center justify-between px-4">
          {/* ── LOGO ── */}
          <Link href="/" className="shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300" onClick={() => setOpen(false)}>
            <span className="relative block h-14 w-40 sm:h-16 sm:w-48">
              <Image
                src="/zodi-logo.png"
                alt="ZODI"
                fill
                sizes="192px"
                className="object-contain"
                priority
              />
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-2 text-sm font-semibold text-white/55 md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="rounded-md px-3 py-3 transition hover:text-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300">
                {link.label}
              </a>
            ))}
            <PwaInstallButton compact />
          </nav>

          {/* Right CTAs */}
          <div className="flex items-center gap-2">
            {/* Entrar — siempre visible */}
            <Link
              href="/auth/login"
              className="rounded-lg border border-white/15 px-3 py-2 text-xs sm:text-sm font-bold text-white/75 transition hover:border-white/30"
            >
              Entrar
            </Link>
            {/* Crear cuenta — solo en desktop */}
            <Link
              href="/auth/register"
              className="hidden md:inline-flex rounded-lg bg-lime-300 px-3 py-2 text-sm font-black text-black transition hover:bg-lime-200"
            >
              Crear cuenta
            </Link>
            {/* Hamburger — mobile only */}
            <button
              className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/15 text-white/70 transition hover:border-white/30 md:hidden z-50 relative"
              onClick={(e) => { e.preventDefault(); setOpen(!open); }}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer — pure CSS transition, no framer-motion to avoid re-renders ── */}
      <div
        aria-hidden={!open}
        style={{
          top: "calc(64px + env(safe-area-inset-top, 0px))",
          maxHeight: open ? "calc(100dvh - 64px - env(safe-area-inset-top, 0px))" : "0px",
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          transition: "max-height 0.25s ease, opacity 0.2s ease, visibility 0.2s",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        className="fixed inset-x-0 z-[49] bg-black border-b border-lime-300/15 shadow-2xl md:hidden"
      >
        <div className="px-5 pt-6 pb-8">
          {/* Marketing hook */}
          <p className="text-xs uppercase tracking-[0.28em] text-lime-200/60 mb-1">Tu oráculo personal</p>
          <p className="text-sm text-white/55 mb-6">Horóscopo, tarot y lecturas personalizadas con IA.</p>

          {/* CTAs principales — app-like */}
          <div className="flex flex-col gap-3 mb-6">
            <PwaInstallButton />
            <Link
              href="/auth/register"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-2xl bg-lime-300 py-4 text-base font-black text-black transition hover:bg-lime-200 shadow-[0_0_24px_rgba(184,255,23,0.2)] active:scale-98"
            >
              Crear cuenta gratis ✦
            </Link>
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-2xl border border-white/15 py-3.5 text-base font-bold text-white/75 transition hover:border-white/30 hover:text-white"
            >
              Ya tengo cuenta — Entrar
            </Link>
          </div>

          {/* Nav links — secundarios */}
          <nav className="flex flex-col border-t border-white/08 pt-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center py-3 text-sm font-semibold text-white/50 transition hover:text-white/80"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}

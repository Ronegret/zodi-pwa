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
          transform: "translateZ(0)",   // own GPU compositing layer
          contain: "layout style paint", // isolate from rest of page
        }}
        className="sticky top-0 z-50 flex flex-col justify-center border-b border-white/08"
        style={{ background: "rgb(6, 6, 10)" }}
      >
        <div className="mx-auto flex w-full h-16 max-w-7xl items-center justify-between px-4">
          {/* ── LOGO ── */}
          <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
            <span className="relative block h-14 w-40 sm:h-16 sm:w-48 scale-110">
              <Image
                src="/zodi-logo-mark.png"
                alt="ZODI"
                fill
                sizes="192px"
                className="object-contain"
                priority
              />
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/55 md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-lime-300">
                {link.label}
              </a>
            ))}
            <PwaInstallButton compact />
          </nav>

          {/* Right CTA buttons */}
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
              className="ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/15 text-white/70 transition hover:border-white/30 md:hidden z-50 relative"
              onClick={(e) => {
                e.preventDefault();
                setOpen(!open);
              }}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
            <PwaInstallButton />
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
      </div>
    </>
  );
}

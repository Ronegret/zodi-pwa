import type { ReactNode } from "react";

/**
 * Dashboard layout — adds full-screen atmospheric backgrounds behind all dashboard pages.
 * Multiple image layers at low opacity create depth without fighting the UI.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Layer 1 — main ZODI atmosphere image.
          transform: translateZ(0) forces a GPU compositing layer so iOS
          doesn't software-repaint this on every scroll tick. */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage: "url('/zodi-art/zodi-fondoo.png')",
          opacity: 0.07,
        }}
      />
      {/* Layer 2 — secondary overlay */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-right"
        style={{
          backgroundImage: "url('/zodi-art/zodi-fondo0.png')",
          opacity: 0.055,
        }}
      />
      {/* Layer 3 — vignette */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      {children}
    </div>
  );
}

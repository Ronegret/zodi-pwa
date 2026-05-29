import type { ReactNode } from "react";

/**
 * Dashboard layout — adds full-screen atmospheric backgrounds behind all dashboard pages.
 * PERFORMANCE: All bg layers use translateZ(0) for GPU promotion but NO willChange
 * because willChange on non-animating fixed elements causes scroll flicker on mobile.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ isolation: "isolate" }}>
      {/* Layer 1 — main ZODI atmosphere image */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage: "url('/zodi-art/zodi-fondoo.png')",
          opacity: 0.07,
          transform: "translateZ(0)"
        }}
      />
      {/* Layer 2 — secondary overlay */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-right"
        style={{
          backgroundImage: "url('/zodi-art/zodi-fondo0.png')",
          opacity: 0.055,
          transform: "translateZ(0)"
        }}
      />
      {/* Layer 3 — vignette */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
          transform: "translateZ(0)"
        }}
      />
      {children}
    </div>
  );
}

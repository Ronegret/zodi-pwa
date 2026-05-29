import type { ReactNode } from "react";

/**
 * Dashboard layout — atmospheric backgrounds behind all pages.
 * The bg layers are isolated from the scroll container via isolation:isolate
 * so they do NOT trigger full-page repaints on scroll or tap.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ isolation: "isolate" }}>
      {/* Atmospheric bg layers — hidden on mobile to prevent repaint */}
      <div
        className="dashboard-bg pointer-events-none fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/zodi-art/zodi-fondoo.png')", opacity: 0.07 }}
      />
      <div
        className="dashboard-bg pointer-events-none fixed inset-0 -z-20 bg-cover bg-right"
        style={{ backgroundImage: "url('/zodi-art/zodi-fondo0.png')", opacity: 0.055 }}
      />
      <div
        className="dashboard-bg pointer-events-none fixed inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)" }}
      />
      {children}
    </div>
  );
}

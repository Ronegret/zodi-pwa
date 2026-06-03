"use client";

import type { ReactNode } from "react";
import { AnimatedShell } from "@/components/AnimatedShell";
import { BottomNav, Sidebar } from "@/components/dashboard/Navigation";
import { DashboardGate } from "@/components/dashboard/DashboardGate";
import { WelcomeSplash } from "@/components/dashboard/WelcomeSplash";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden" style={{ isolation: "isolate" }}>
      {/* Atmospheric bg layers — hidden on mobile to prevent repaint */}
      <div
        className="dashboard-bg pointer-events-none fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/zodi-art/zodi-fondoo.webp')", opacity: 0.07 }}
      />
      <div
        className="dashboard-bg pointer-events-none fixed inset-0 -z-20 bg-cover bg-right"
        style={{ backgroundImage: "url('/zodi-art/zodi-fondo0.webp')", opacity: 0.055 }}
      />
      <div
        className="dashboard-bg pointer-events-none fixed inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)" }}
      />

      <DashboardGate>
        <WelcomeSplash>
          <AnimatedShell>
            <div className="mx-auto flex w-full max-w-[1500px] xl:max-w-[1700px] 2xl:max-w-[1920px] gap-3 sm:gap-5 px-3 py-4 sm:px-5 xl:px-8">
              <Sidebar />
              <div className="min-w-0 flex-1 pb-nav lg:pb-6">
                {children}
              </div>
            </div>
          </AnimatedShell>
          <BottomNav />
        </WelcomeSplash>
      </DashboardGate>
    </div>
  );
}

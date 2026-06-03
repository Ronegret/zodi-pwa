import { AnimatedShell } from "@/components/AnimatedShell";
import { BottomNav, Sidebar } from "@/components/dashboard/Navigation";
import { DashboardGate } from "@/components/dashboard/DashboardGate";
import { DashboardLaunchpad } from "@/components/dashboard/DashboardLaunchpad";
import { HeroConsole } from "@/components/dashboard/HeroConsole";
import { PaymentHandler } from "@/components/dashboard/PaymentHandler";
import { WelcomeSplash } from "@/components/dashboard/WelcomeSplash";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <AnimatedShell>
      <DashboardGate>
        <WelcomeSplash>
          <div className="mx-auto flex w-full max-w-[1500px] xl:max-w-[1700px] 2xl:max-w-[1920px] gap-3 sm:gap-5 px-3 py-4 pb-nav sm:px-5 xl:px-8">
            <Sidebar />
            <div className="min-w-0 flex-1">
              <HeroConsole />
              <DashboardLaunchpad />
            </div>
          </div>
          <BottomNav />
          <Suspense fallback={null}>
            <PaymentHandler />
          </Suspense>
        </WelcomeSplash>
      </DashboardGate>
    </AnimatedShell>
  );
}

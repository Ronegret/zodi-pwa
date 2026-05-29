import { AnimatedShell } from "@/components/AnimatedShell";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { BottomNav, Sidebar } from "@/components/dashboard/Navigation";
import { ConsultationDock } from "@/components/dashboard/ConsultationDock";
import { DashboardGate } from "@/components/dashboard/DashboardGate";
import { DashboardLaunchpad } from "@/components/dashboard/DashboardLaunchpad";
import { DashboardPanels } from "@/components/dashboard/DashboardPanels";
import { HeroConsole } from "@/components/dashboard/HeroConsole";
import { PremiumPlans } from "@/components/dashboard/PremiumPlans";
import { FeatureGrid } from "@/components/modules/FeatureGrid";
import { PaymentHandler } from "@/components/dashboard/PaymentHandler";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <AnimatedShell>
      <DashboardGate>
        <div className="mx-auto flex w-full max-w-[1500px] gap-3 sm:gap-5 px-3 py-4 pb-nav sm:px-5">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <HeroConsole />
            <DashboardLaunchpad />
            <ConsultationDock />
            <DashboardPanels />
            <AIAssistant />
            <FeatureGrid />
            <PremiumPlans />
          </div>
        </div>
        <BottomNav />
        <Suspense fallback={null}>
          <PaymentHandler />
        </Suspense>
      </DashboardGate>
    </AnimatedShell>
  );
}

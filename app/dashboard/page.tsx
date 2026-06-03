import { DashboardLaunchpad } from "@/components/dashboard/DashboardLaunchpad";
import { HeroConsole } from "@/components/dashboard/HeroConsole";
import { PaymentHandler } from "@/components/dashboard/PaymentHandler";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <>
      <HeroConsole />
      <DashboardLaunchpad />
      <Suspense fallback={null}>
        <PaymentHandler />
      </Suspense>
    </>
  );
}

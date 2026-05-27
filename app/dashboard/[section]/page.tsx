import { AnimatedShell } from "@/components/AnimatedShell";
import { BottomNav, Sidebar } from "@/components/dashboard/Navigation";
import { DashboardGate } from "@/components/dashboard/DashboardGate";
import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

// Dynamic rendering — avoids generateStaticParams crashing the Turbopack worker
export const dynamic = "force-dynamic";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;

  return (
    <AnimatedShell>
      <DashboardGate>
        <div className="mx-auto flex w-full max-w-[1500px] gap-5 px-3 py-4 sm:px-5">
          <Sidebar />
          <div className="min-w-0 flex-1 pb-24 lg:pb-0">
            <DashboardSectionPage sectionSlug={section} />
          </div>
        </div>
        <BottomNav />
      </DashboardGate>
    </AnimatedShell>
  );
}

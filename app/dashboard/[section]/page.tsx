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
        <div className="mx-auto flex w-full max-w-[1500px] xl:max-w-[1700px] 2xl:max-w-[1920px] gap-3 sm:gap-5 xl:gap-6 px-3 py-4 sm:px-5 xl:px-8">
          <Sidebar />
          <div className="min-w-0 flex-1 pb-nav lg:pb-6">
            <DashboardSectionPage sectionSlug={section} />
          </div>
        </div>
        <BottomNav />
      </DashboardGate>
    </AnimatedShell>
  );
}

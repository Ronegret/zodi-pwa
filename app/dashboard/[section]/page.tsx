import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

// Dynamic rendering — avoids generateStaticParams crashing the Turbopack worker
export const dynamic = "force-dynamic";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;

  return (
    <DashboardSectionPage sectionSlug={section} />
  );
}

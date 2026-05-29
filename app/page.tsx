import { AnimatedShell } from "@/components/AnimatedShell";
import { MarketingHome } from "@/components/public/MarketingHome";
import { PublicNav } from "@/components/public/PublicNav";
import { AuthRedirect } from "@/components/public/AuthRedirect";

export default function Home() {
  return (
    <AnimatedShell>
      <AuthRedirect />
      <PublicNav />
      <MarketingHome />
    </AnimatedShell>
  );
}

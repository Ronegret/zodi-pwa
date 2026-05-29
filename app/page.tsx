import { AnimatedShell } from "@/components/AnimatedShell";
import { MarketingHome } from "@/components/public/MarketingHome";
import { PublicNav } from "@/components/public/PublicNav";
//

export default function Home() {
  return (
    <AnimatedShell>
      <PublicNav />
      <MarketingHome />
    </AnimatedShell>
  );
}

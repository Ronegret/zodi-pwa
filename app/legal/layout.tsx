import { AnimatedShell } from "@/components/AnimatedShell";
import { PublicNav } from "@/components/public/PublicNav";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnimatedShell>
      <PublicNav />
      <div className="relative min-h-screen px-4 py-16 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[url('/zodi-art/oracle-frame-tall.png')] bg-cover bg-center opacity-10" />
        <div className="spark-field -z-10" />
        <div className="mx-auto max-w-3xl glass-panel rounded-2xl p-6 sm:p-12 prose prose-invert prose-lime">
          {children}
        </div>
      </div>
    </AnimatedShell>
  );
}

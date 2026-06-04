"use client";

// AnimatedShell: solo un fade muy rápido — sin y-movement que causa parpadeo visible
// en navegaciones rápidas o dispositivos lentos.
export function AnimatedShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="relative min-h-[100dvh] pb-24 lg:pb-8 animate-fade-in"
    >
      {children}
    </main>
  );
}

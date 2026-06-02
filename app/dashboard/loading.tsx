export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1500px] gap-3 sm:gap-5 px-3 py-4 pb-nav sm:px-5 animate-pulse">
      {/* Sidebar skeleton — solo desktop */}
      <div className="sticky top-5 hidden h-[calc(100vh-40px)] w-56 shrink-0 rounded-xl lg:flex flex-col gap-3 p-4"
        style={{ background: "var(--sidebar-bg)" }}
      >
        <div className="h-28 w-full rounded-lg bg-white/05" />
        <div className="h-12 w-full rounded-lg bg-white/04" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-7 rounded-lg bg-white/04" style={{ width: `${75 + (i % 3) * 8}%` }} />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="min-w-0 flex-1 space-y-3">
        {/* Hero card */}
        <div className="h-56 sm:h-64 rounded-2xl bg-white/04" />
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 lg:hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/04" />
          ))}
        </div>
        {/* Featured grid */}
        <div className="h-8 w-40 rounded-lg bg-white/04 mt-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/04" />
          ))}
        </div>
      </div>
    </div>
  );
}

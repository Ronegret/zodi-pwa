export default function SectionLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1500px] gap-3 sm:gap-5 px-3 py-4 pb-nav sm:px-5 animate-pulse">
      <div className="min-w-0 flex-1 space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/04" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded-lg bg-white/04" />
            <div className="h-3 w-32 rounded bg-white/03" />
          </div>
        </div>
        {/* Content area */}
        <div className="h-40 rounded-2xl bg-white/04" />
        <div className="h-48 rounded-2xl bg-white/04" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-xl bg-white/04" />
          <div className="h-24 rounded-xl bg-white/04" />
        </div>
      </div>
    </div>
  );
}

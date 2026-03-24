export default function FlightSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur-sm animate-fadeUp md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl shimmer animate-shimmer" />
          <div className="space-y-2">
            <div className="h-4 w-20 rounded-full shimmer animate-shimmer" />
            <div className="h-8 w-36 rounded-full shimmer animate-shimmer" />
            <div className="h-4 w-40 rounded-full shimmer animate-shimmer" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-16 w-28 rounded-[1.2rem] shimmer animate-shimmer" />
          <div className="h-11 w-36 rounded-full shimmer animate-shimmer" />
        </div>
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-slate-200/80 bg-[#fbfcfe] px-5 py-5">
        <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="space-y-2">
            <div className="h-4 w-20 rounded-full shimmer animate-shimmer" />
            <div className="h-8 w-28 rounded-full shimmer animate-shimmer" />
            <div className="h-4 w-16 rounded-full shimmer animate-shimmer" />
            <div className="h-4 w-24 rounded-full shimmer animate-shimmer" />
          </div>
          <div className="flex min-w-[15rem] flex-col items-center gap-3">
            <div className="h-4 w-full rounded-full shimmer animate-shimmer" />
            <div className="h-4 w-24 rounded-full shimmer animate-shimmer" />
          </div>
          <div className="space-y-2 md:text-right">
            <div className="ml-auto h-4 w-20 rounded-full shimmer animate-shimmer" />
            <div className="ml-auto h-8 w-28 rounded-full shimmer animate-shimmer" />
            <div className="ml-auto h-4 w-16 rounded-full shimmer animate-shimmer" />
            <div className="ml-auto h-4 w-24 rounded-full shimmer animate-shimmer" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="h-14 w-40 rounded-full shimmer animate-shimmer" />
        <div className="h-14 w-40 rounded-full shimmer animate-shimmer" />
        <div className="h-12 w-32 rounded-full shimmer animate-shimmer" />
      </div>
    </div>
  );
}

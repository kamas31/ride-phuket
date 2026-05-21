// Shown instantly by Next.js App Router while the explore page fetches.
// Matches the real layout exactly to avoid layout shift when content arrives.

function Pulse({ className }: { className?: string }) {
  return <div className={`bg-[#f0f0ec] rounded-[10px] animate-pulse ${className ?? ''}`} />
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-[20px] overflow-hidden border border-[#e8e8e4]">
      {/* Image */}
      <Pulse className="h-44 rounded-none" />
      {/* Content */}
      <div className="p-4 space-y-2.5">
        <div className="flex justify-between items-center">
          <Pulse className="h-3 w-24" />
          <Pulse className="h-3 w-10" />
        </div>
        <Pulse className="h-4 w-36" />
        <div className="flex gap-2">
          <Pulse className="h-5 w-20 rounded-full" />
          <Pulse className="h-5 w-14" />
        </div>
        <div className="flex items-end justify-between pt-1">
          <Pulse className="h-6 w-20" />
          <Pulse className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Sticky bar placeholder */}
      <div className="sticky top-16 z-30 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
          <Pulse className="h-10 rounded-full" />
          <Pulse className="h-8 rounded-full w-2/3" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">
        {/* Count row */}
        <div className="flex items-center justify-between mb-4">
          <Pulse className="h-4 w-32" />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

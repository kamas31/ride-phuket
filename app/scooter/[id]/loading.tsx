// Shown instantly by Next.js App Router while the scooter detail page fetches.

function Pulse({ className }: { className?: string }) {
  return <div className={`bg-[#f0f0ec] rounded-[10px] animate-pulse ${className ?? ''}`} />
}

export default function ScooterLoading() {
  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb placeholder */}
      <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-md border-b border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto px-4 h-11 flex items-center gap-3">
          <Pulse className="h-4 w-32" />
          <div className="ml-auto">
            <Pulse className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        <div className="lg:grid lg:grid-cols-5 lg:gap-10">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Gallery placeholder */}
            <div className="space-y-3">
              <Pulse className="h-[270px] md:h-[400px] rounded-[22px]" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Pulse key={i} className="h-16 flex-1 rounded-[12px]" />
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Pulse className="h-8 w-64" />
              <div className="flex gap-3">
                <Pulse className="h-4 w-20" />
                <Pulse className="h-4 w-24" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-5 border-t border-[#f0f0ec]">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-5/6" />
              <Pulse className="h-4 w-4/6" />
            </div>
          </div>

          {/* Right column — booking card */}
          <div className="lg:col-span-2 mt-8 lg:mt-0">
            <div className="bg-white rounded-[24px] border border-[#e8e8e4] overflow-hidden p-6 space-y-4">
              <div className="space-y-2 pb-4 border-b border-[#f0f0ec]">
                <Pulse className="h-10 w-32" />
                <Pulse className="h-4 w-24" />
              </div>
              <Pulse className="h-11 rounded-[12px]" />
              <div className="space-y-2">
                <Pulse className="h-4 w-full" />
                <Pulse className="h-4 w-3/4" />
              </div>
              <Pulse className="h-14 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

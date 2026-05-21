'use client'

// Dev-only image performance overlay
// Shows count of loaded images — listens for 'scooter-img-load' CustomEvents
// dispatched by ScooterImage.tsx on each onLoad callback.
//
// Mount in any client component:
//   {process.env.NODE_ENV === 'development' && <ImageMetricsOverlay />}

import { useState, useEffect, useRef } from 'react'

export function ImageMetricsOverlay() {
  const [count, setCount]       = useState(0)
  const [avgMs, setAvgMs]       = useState<number | null>(null)
  const [visible, setVisible]   = useState(true)
  const sessionStart            = useRef(Date.now())
  const loadTimes               = useRef<number[]>([])

  useEffect(() => {
    const handler = () => {
      const elapsed = Date.now() - sessionStart.current
      loadTimes.current.push(elapsed)
      const avg = Math.round(
        loadTimes.current.reduce((a, b) => a + b, 0) / loadTimes.current.length
      )
      setCount(loadTimes.current.length)
      setAvgMs(avg)
    }
    window.addEventListener('scooter-img-load', handler)
    return () => window.removeEventListener('scooter-img-load', handler)
  }, [])

  const reset = () => {
    loadTimes.current = []
    sessionStart.current = Date.now()
    setCount(0)
    setAvgMs(null)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 z-[9999] select-none">
      <div className="bg-[#0f0f0e]/92 text-white rounded-[14px] border border-white/10 p-3.5 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[170px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">
            Image Metrics
          </span>
          <button
            onClick={() => setVisible(false)}
            className="text-white/30 hover:text-white/80 transition-colors text-sm leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mb-3">
          <div>
            <div className="text-[22px] font-bold leading-none text-[#FF6B35]">{count}</div>
            <div className="text-[10px] text-white/40 mt-0.5">loaded</div>
          </div>
          <div>
            <div className="text-[22px] font-bold leading-none text-[#22c55e]">
              {avgMs !== null ? `${avgMs}` : '—'}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">ms avg</div>
          </div>
          <div>
            <div className="text-[22px] font-bold leading-none text-white/60">
              {count > 0 ? Math.round((count / Math.max(1, (Date.now() - sessionStart.current) / 1000)) * 10) / 10 : '—'}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">img/s</div>
          </div>
        </div>

        {/* Optimization badge */}
        <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 bg-white/5 rounded-[8px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] flex-shrink-0" />
          <span className="text-[10px] text-white/50">Next.js Opt · WebP · CDN</span>
        </div>

        <button
          onClick={reset}
          className="text-[10px] text-white/25 hover:text-white/60 transition-colors"
        >
          reset session
        </button>
      </div>
    </div>
  )
}

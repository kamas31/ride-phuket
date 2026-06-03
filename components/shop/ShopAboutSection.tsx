'use client'

import { useEffect, useRef, useState } from 'react'
import { Store, ChevronDown } from 'lucide-react'

interface Props {
  description: string
}

export function ShopAboutSection({ description }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [needsClamp, setNeedsClamp] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setNeedsClamp(el.scrollHeight > el.clientHeight + 1)
  }, [])

  return (
    <section>
      {/* Title row */}
      <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-[#e8e8e4]">
        <div className="w-7 h-7 rounded-[8px] bg-[#fff4f0] flex items-center justify-center flex-shrink-0">
          <Store className="w-3.5 h-3.5 text-[#FF6B35]" />
        </div>
        <h2 className="text-[18px] font-bold text-[#0f0f0e]">About this rental shop</h2>
      </div>

      {/* Body — no container, text lives directly on the page */}
      <p
        ref={ref}
        className={`text-[15px] text-[#3c3c38] leading-[1.75] whitespace-pre-line ${!expanded ? 'line-clamp-3' : ''}`}
      >
        {description}
      </p>

      {(needsClamp || expanded) && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#FF6B35] hover:underline focus:outline-none"
        >
          {expanded ? 'Show less' : 'Read more'}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </section>
  )
}

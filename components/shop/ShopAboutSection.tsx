'use client'

import { useEffect, useRef, useState } from 'react'

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
      <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-4">About this rental shop</h2>
      <div className="bg-[#f8f8f6] rounded-[16px] p-5">
        <p
          ref={ref}
          className={`text-[15px] text-[#5c5c58] leading-relaxed whitespace-pre-line ${!expanded ? 'line-clamp-3' : ''}`}
        >
          {description}
        </p>
        {(needsClamp || expanded) && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-3 text-sm font-semibold text-[#FF6B35] hover:underline focus:outline-none"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </section>
  )
}

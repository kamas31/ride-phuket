'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function HeroSearch() {
  const [value, setValue] = useState('')
  const router = useRouter()

  function go(q: string) {
    if (q.trim()) router.push(`/explore?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="w-full max-w-lg mb-8">

      {/* Search bar — glass, consistent with hero aesthetic */}
      <div
        className="flex items-center gap-3 px-4 py-[9px] rounded-[12px] transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.20)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
        onFocus={() => {}}
      >
        <Search
          className="w-4 h-4 flex-shrink-0"
          style={{ color: '#FF6B35' }}
          strokeWidth={2.5}
        />
        <input
          type="text"
          inputMode="search"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && go(value)}
          placeholder="Search TMAX, NMAX, Honda Click…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-[15px] font-medium text-white placeholder:text-white/45 placeholder:font-light focus:outline-none min-w-0"
        />
      </div>

    </div>
  )
}

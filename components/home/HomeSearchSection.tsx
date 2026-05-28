'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowRight, ChevronRight, Sparkles } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { cn } from '@/lib/utils'
import { createHomeFuse, getSimilarScooters } from '@/lib/fuzzy-search'
import type { Scooter } from '@/types'

const CHIPS = [
  { label: 'TMAX',      query: 'TMAX' },
  { label: 'NMAX',      query: 'NMAX' },
  { label: 'PCX',       query: 'PCX' },
  { label: 'ADV',       query: 'ADV' },
  { label: 'Click',     query: 'Click' },
  { label: 'Automatic', query: 'automatic' },
  { label: 'Premium',   query: 'premium' },
]

const MAX_PREVIEW = 8
const DEBOUNCE_MS = 200

export function HomeSearchSection({ scooters }: { scooters: Scooter[] }) {
  const [input, setInput]           = useState('')
  const [debouncedInput, setDebounced] = useState('')
  const [activeChip, setActiveChip] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Debounce typed input so Fuse doesn't run on every keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebounced(input.trim()), DEBOUNCE_MS)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [input])

  const fuse = useMemo(() => createHomeFuse(scooters), [scooters])

  const activeQuery = activeChip ?? debouncedInput
  const hasQuery    = !!activeQuery

  // ── Search computation ──────────────────────────────────────────────────────
  const { directResults, fallbackScooters, fallbackLabel } = useMemo(() => {
    if (!activeQuery) {
      return { directResults: scooters.slice(0, 4), fallbackScooters: [], fallbackLabel: '' }
    }

    const hits = fuse.search(activeQuery).map(r => r.item)

    if (hits.length > 0) {
      return { directResults: hits.slice(0, MAX_PREVIEW), fallbackScooters: [], fallbackLabel: '' }
    }

    // Zero direct hits — find intelligent alternatives
    const { scooters: similar, label } = getSimilarScooters(activeQuery, scooters)
    return { directResults: [], fallbackScooters: similar, fallbackLabel: label }
  }, [fuse, scooters, activeQuery])

  const showDefault  = !hasQuery
  const showDirect   = hasQuery && directResults.length > 0
  const showFallback = hasQuery && directResults.length === 0

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleChipClick(chip: (typeof CHIPS)[number]) {
    if (activeChip === chip.query) {
      setActiveChip(null)
    } else {
      setActiveChip(chip.query)
      setInput('')
      setDebounced('')
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value)
    setActiveChip(null)
  }

  function handleClear() {
    setInput('')
    setDebounced('')
    setActiveChip(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && activeQuery) {
      router.push(`/explore?q=${encodeURIComponent(activeQuery)}`)
    }
  }

  // ── Grid to render ──────────────────────────────────────────────────────────
  const gridScooters = showFallback ? fallbackScooters : directResults

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">

      {/* ── Search bar ── */}
      <div className={cn(
        'flex items-center gap-3 px-5 py-4 bg-white rounded-[20px] border transition-all duration-200',
        'shadow-[0_2px_20px_-4px_rgba(0,0,0,0.10),0_1px_4px_-1px_rgba(0,0,0,0.05)]',
        'border-[#e8e8e4]',
        'focus-within:border-[#FF6B35] focus-within:shadow-[0_4px_28px_-4px_rgba(255,107,53,0.20),0_1px_4px_-1px_rgba(0,0,0,0.05)]',
      )}>
        <Search className="w-5 h-5 text-[#FF6B35] flex-shrink-0" />
        <input
          type="text"
          inputMode="search"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search scooters, brands or models…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-[16px] font-medium text-[#0f0f0e] placeholder:text-[#b0b0ac] placeholder:font-normal focus:outline-none min-w-0"
        />
        {(input || activeChip) && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f0f0ec] hover:bg-[#e4e4e0] transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-[#5c5c58]" />
          </button>
        )}
      </div>

      {/* ── Quick filter chips ── */}
      <div
        className="flex items-center gap-2 mt-3.5 pb-1 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {CHIPS.map(chip => {
          const active = activeChip === chip.query
          return (
            <button
              key={chip.label}
              onClick={() => handleChipClick(chip)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-150',
                active
                  ? 'bg-[#FF6B35] text-white shadow-[0_2px_12px_rgba(255,107,53,0.35)] scale-[1.03]'
                  : 'bg-white text-[#5c5c58] border border-[#e8e8e4] hover:border-[#FF6B35] hover:text-[#FF6B35] active:scale-[0.97]'
              )}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* ── Section header ── */}
      <div className="flex items-start justify-between mt-8 mb-6 gap-4">
        {showDefault && (
          <>
            <div>
              <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-1.5">Top Picks</p>
              <h2 className="text-[22px] md:text-[28px] font-bold text-[#0f0f0e] leading-tight tracking-tight">
                Most popular scooters
              </h2>
            </div>
            <Link
              href="/explore"
              className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#FF6B35] hover:gap-2 transition-all whitespace-nowrap mt-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </>
        )}

        {showDirect && (
          <>
            <p className="text-[14px] text-[#5c5c58] mt-1">
              <span className="font-bold text-[#0f0f0e]">{directResults.length}</span>{' '}
              scooter{directResults.length !== 1 ? 's' : ''} for{' '}
              <span className="font-semibold text-[#FF6B35]">&ldquo;{activeQuery}&rdquo;</span>
            </p>
            <Link
              href={`/explore?q=${encodeURIComponent(activeQuery)}`}
              className="flex items-center gap-1 text-sm font-semibold text-[#FF6B35] hover:gap-2 transition-all whitespace-nowrap mt-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}

        {showFallback && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#fff4f0] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#0f0f0e] leading-tight">{fallbackLabel}</p>
              <p className="text-[12px] text-[#9c9c98] mt-0.5">
                No exact match for &ldquo;{activeQuery}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Scooter grid ── */}
      {gridScooters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gridScooters.map(s => (
            <ScooterCard key={s.id} scooter={s} />
          ))}
        </div>
      ) : (
        // Only shown when fallback itself is empty (very unlikely)
        <div className="text-center py-14 bg-white rounded-[20px] border border-[#e8e8e4]">
          <p className="font-bold text-[#0f0f0e] mb-1">No scooters found</p>
          <p className="text-sm text-[#9c9c98] mb-5">
            Try a different search or browse all available scooters.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] text-white text-sm font-semibold rounded-full hover:bg-[#e85d29] transition-colors"
          >
            Browse All
          </Link>
        </div>
      )}

      {/* ── Footer CTAs ── */}
      {showDefault && (
        <div className="mt-6 text-center md:hidden">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#e8e8e4] rounded-full text-sm font-semibold text-[#0f0f0e] hover:bg-[#f8f8f6] transition-colors"
          >
            View all scooters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {showDirect && directResults.length >= MAX_PREVIEW && (
        <div className="mt-6 text-center">
          <Link
            href={`/explore?q=${encodeURIComponent(activeQuery)}`}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#FF6B35] text-white rounded-full text-sm font-bold hover:bg-[#e85d29] transition-all shadow-[0_2px_16px_rgba(255,107,53,0.3)] hover:shadow-[0_4px_24px_rgba(255,107,53,0.4)]"
          >
            View all results in search <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {showFallback && fallbackScooters.length > 0 && (
        <div className="mt-6 text-center">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#e8e8e4] rounded-full text-sm font-semibold text-[#0f0f0e] hover:bg-[#f8f8f6] transition-colors"
          >
            Browse all scooters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

    </section>
  )
}

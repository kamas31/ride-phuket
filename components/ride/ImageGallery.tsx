'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  name: string
  coverImage?: string | null
}

export function ImageGallery({ images, name, coverImage }: ImageGalleryProps) {
  const coverIdx = coverImage ? Math.max(0, images.indexOf(coverImage)) : 0
  const [active, setActive] = useState(coverIdx)
  const hasMultiple = images.length > 1

  // ── Touch/swipe state ────────────────────────────────────────
  const touchStartX   = useRef<number | null>(null)
  const touchStartY   = useRef<number | null>(null)
  const isScrolling   = useRef<boolean | null>(null) // null = undecided

  const prev = useCallback(() => setActive(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setActive(i => (i + 1) % images.length), [images.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current   = e.touches[0].clientX
    touchStartY.current   = e.touches[0].clientY
    isScrolling.current   = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)

    // Decide on first move: horizontal = swipe, vertical = scroll
    if (isScrolling.current === null) {
      isScrolling.current = dy > dx
    }

    // Block vertical scroll propagation only if we're swiping horizontally
    if (!isScrolling.current) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || isScrolling.current) {
      touchStartX.current = null
      touchStartY.current = null
      isScrolling.current = null
      return
    }

    const delta = e.changedTouches[0].clientX - touchStartX.current
    const THRESHOLD = 55  // px — feels natural on mobile

    if (delta < -THRESHOLD) next()
    else if (delta > THRESHOLD) prev()

    touchStartX.current = null
    touchStartY.current = null
    isScrolling.current = null
  }

  // Preload adjacent images so navigation feels instant
  const prevIdx = (active - 1 + images.length) % images.length
  const nextIdx = (active + 1) % images.length

  return (
    <div className="space-y-3">
      {/* Main image — touch-action:pan-y lets page scroll when swiping vertically */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <ScooterImage
          src={images[active]}
          alt={`${name} — photo ${active + 1}`}
          className="h-[270px] md:h-[400px] rounded-[22px] group"
          objectFit="contain"
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
        >
          {/* Prev / next arrows — desktop only */}
          {hasMultiple && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-[#0f0f0e]" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 text-[#0f0f0e]" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {hasMultiple && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200',
                    i === active ? 'w-5 bg-white shadow-sm' : 'w-1.5 bg-white/50'
                  )}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Counter badge */}
          {hasMultiple && (
            <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium z-10">
              {active + 1} / {images.length}
            </div>
          )}
        </ScooterImage>
      </div>

      {/* Preload adjacent images (hidden) — navigation feels instant */}
      {hasMultiple && (
        <div className="sr-only" aria-hidden="true">
          {[prevIdx, nextIdx].filter((idx, pos, arr) => arr.indexOf(idx) === pos && idx !== active).map(idx => (
            <img key={idx} src={images[idx]} alt="" loading="eager" decoding="async" width="1" height="1" />
          ))}
        </div>
      )}

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'relative h-16 flex-1 rounded-[12px] overflow-hidden border-2 transition-all',
                i === active
                  ? 'border-[#FF6B35] shadow-[0_0_0_1px_#FF6B35]'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <Image
                src={src}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="160px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

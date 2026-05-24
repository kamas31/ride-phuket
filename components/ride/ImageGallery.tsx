'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  name: string
  coverImage?: string | null
}

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

export function ImageGallery({ images, name, coverImage }: ImageGalleryProps) {
  const coverIdx = coverImage ? Math.max(0, images.indexOf(coverImage)) : 0
  const [active, setActive] = useState(coverIdx)
  const hasMultiple = images.length > 1

  const touchStartX   = useRef<number | null>(null)
  const touchStartY   = useRef<number | null>(null)
  const isScrolling   = useRef<boolean | null>(null)
  const [liveOffset, setLiveOffset] = useState(0)

  const prev = useCallback(() => setActive(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setActive(i => (i + 1) % images.length), [images.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isScrolling.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
    if (isScrolling.current === null && (dx > 4 || dy > 4)) {
      isScrolling.current = dy > dx
    }
    if (!isScrolling.current) {
      e.preventDefault()
      setLiveOffset((e.touches[0].clientX - touchStartX.current) * 0.28)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setLiveOffset(0)
    if (touchStartX.current === null || isScrolling.current) {
      touchStartX.current = null
      touchStartY.current = null
      isScrolling.current = null
      return
    }
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 55) delta < 0 ? next() : prev()
    touchStartX.current = null
    touchStartY.current = null
    isScrolling.current = null
  }

  const prevIdx = (active - 1 + images.length) % images.length
  const nextIdx = (active + 1) % images.length

  return (
    <div className="space-y-3">
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <div style={{
          transform: `translateX(${liveOffset}px)`,
          transition: liveOffset === 0 ? `transform 0.45s ${SPRING}` : 'none',
        }}>
          {/* Single container: rounded corners + overflow-hidden for border-radius only.
              Image defines height naturally — nothing constrains it. */}
          <div className="relative md:rounded-[24px] overflow-hidden bg-[#f3f3ef] group">
            <div className="flex items-center justify-center p-4 md:p-6">
              <Image
                src={images[active]}
                alt={`${name} — photo ${active + 1}`}
                width={1600}
                height={1200}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 700px"
                className="w-full h-auto object-contain"
                priority
              />
            </div>

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

            {hasMultiple && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={cn(
                      'rounded-full transition-all duration-300',
                      i === active ? 'bg-white shadow-sm' : 'bg-white/55 hover:bg-white/80'
                    )}
                    style={{ width: i === active ? '24px' : '8px', height: '8px', padding: 0, margin: '6px' }}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {hasMultiple && (
              <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium z-10">
                {active + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preload adjacent images */}
      {hasMultiple && (
        <div className="sr-only" aria-hidden="true">
          {[prevIdx, nextIdx]
            .filter((idx, pos, arr) => arr.indexOf(idx) === pos && idx !== active)
            .map(idx => (
              <img key={idx} src={images[idx]} alt="" loading="eager" decoding="async" width="1" height="1" />
            ))
          }
        </div>
      )}

      {/* Thumbnails — fill+cover is correct for small fixed-height strips */}
      {hasMultiple && (
        <div className="flex gap-2 px-4 md:px-0">
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

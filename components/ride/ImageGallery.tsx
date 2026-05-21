'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  name: string
  coverImage?: string | null  // start on the designated cover
}

export function ImageGallery({ images, name, coverImage }: ImageGalleryProps) {
  // Start on the cover image if it's in the images array
  const coverIdx = coverImage ? Math.max(0, images.indexOf(coverImage)) : 0
  const [active, setActive] = useState(coverIdx)
  const hasMultiple = images.length > 1

  const prev = () => setActive(i => (i - 1 + images.length) % images.length)
  const next = () => setActive(i => (i + 1) % images.length)

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative h-[270px] md:h-[400px] rounded-[22px] overflow-hidden bg-[#f0f0ec] group">
        <Image
          src={images[active]}
          alt={`${name} — photo ${active + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
          unoptimized
        />

        {/* Prev / next arrows — desktop only */}
        {hasMultiple && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-[#0f0f0e]" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-[#0f0f0e]" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                )}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Counter badge */}
        {hasMultiple && (
          <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium">
            {active + 1} / {images.length}
          </div>
        )}
      </div>

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
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

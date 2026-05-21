'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Cinematic warm-sand blur placeholder — 16×9 SVG gradient
// Shown by Next.js while the real image loads (placeholder="blur")
// ─────────────────────────────────────────────────────────────
const BLUR_DATA_URL =
  'data:image/svg+xml;base64,' +
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0' +
  'PSI5Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMCIgeTE9IjAiIHky' +
  'PSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNlY2U5ZTQiLz48c3RvcCBvZmZzZXQ9' +
  'IjEiIHN0b3AtY29sb3I9IiNkZWRhZDIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCBm' +
  'aWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTYiIGhlaWdodD0iOSIvPjwvc3ZnPg=='

interface ScooterImageProps {
  src?: string | null
  alt: string
  className?: string         // container — sizing, border-radius, flex-shrink, opacity
  overlay?: boolean          // bottom gradient for badge legibility
  priority?: boolean         // above-the-fold: skip lazy loading
  hover?: boolean            // scale on group-hover — parent needs `group`
  objectFit?: 'cover' | 'contain'  // cover = fills frame, contain = full scooter visible
  sizes?: string             // Next.js responsive sizes hint
  children?: React.ReactNode // badges, arrows, counters on top of image
}

export function ScooterImage({
  src,
  alt,
  className,
  overlay   = false,
  priority  = false,
  hover     = false,
  objectFit = 'cover',
  sizes     = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  children,
}: ScooterImageProps) {
  const [loaded, setLoaded] = useState(priority) // priority images skip shimmer

  const handleLoad = useCallback(() => {
    setLoaded(true)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scooter-img-load'))
    }
  }, [])

  return (
    <div className={cn('relative overflow-hidden bg-[#ece9e4]', className)}>

      {src ? (
        <>
          {/* Shimmer sweep — GPU-accelerated, hidden once image is loaded */}
          {!loaded && (
            <div
              className="shimmer-sweep absolute inset-0 pointer-events-none"
              style={{ zIndex: 1 }}
            />
          )}

          <Image
            src={src}
            alt={alt}
            fill
            className={cn(
              objectFit === 'contain' ? 'object-contain' : 'object-cover',
              hover && 'group-hover:scale-[1.04] transition-transform duration-500',
            )}
            sizes={sizes}
            priority={priority}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            onLoad={handleLoad}
          />
        </>
      ) : (
        // Premium warm-sand fallback — consistent everywhere
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#f0ede8] via-[#ece8e2] to-[#e4e0da]">
          <ImageOff className="w-6 h-6 text-[#c4bfb8]" />
          <span className="text-[10px] font-medium text-[#b8b3ac] tracking-wide uppercase">
            No photo
          </span>
        </div>
      )}

      {overlay && (
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/22 to-transparent pointer-events-none" />
      )}

      {children}

    </div>
  )
}

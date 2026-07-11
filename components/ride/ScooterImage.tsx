'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getScooterImageUrl, type ScooterImageVariant } from '@/lib/scooter-images'

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
  sizes?: string             // Next.js responsive sizes hint (ignored when width/height set)
  // Fixed-pixel thumbnails only (e.g. small avatar/list thumbnails that never
  // resize across breakpoints): pass both to swap from `fill` to an explicit
  // width/height Image, which makes Next.js generate only [w, w*2] srcset
  // candidates instead of the full responsive width range. Must match the
  // container's actual rendered size exactly — do not use on responsive
  // (breakpoint-varying) thumbnails.
  width?: number
  height?: number
  // Opt-in only: when set, `src` is resolved to that pre-generated Supabase
  // variant (see lib/scooter-images.ts) and Vercel Image Optimization is
  // bypassed for it (unoptimized) since the file is already the right size.
  // Omit entirely for images that still need Vercel optimization (e.g. the
  // shop banner, which isn't part of the scooter-photo variant pipeline).
  variant?: ScooterImageVariant
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
  width,
  height,
  variant,
  children,
}: ScooterImageProps) {
  const isFixedSize = typeof width === 'number' && typeof height === 'number'
  const resolvedSrc = src && variant ? getScooterImageUrl(src, variant) : src
  const [loaded, setLoaded] = useState(priority) // priority images skip shimmer

  const handleLoad = useCallback(() => {
    setLoaded(true)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scooter-img-load'))
    }
  }, [])

  const imageClassName = cn(
    objectFit === 'contain' ? 'object-contain' : 'object-cover',
    hover && 'group-hover:scale-[1.03] transition-transform duration-700 ease-out',
    'transition-opacity duration-300',
    loaded ? 'opacity-100' : 'opacity-0',
    // Fixed-size Image isn't `fill`, so it needs the same absolute-stretch
    // behavior applied manually to render identically to the fill variant.
    isFixedSize && 'absolute inset-0 w-full h-full',
  )

  return (
    <div className={cn('relative overflow-hidden bg-[#f3f3ef]', className)}>

      {resolvedSrc ? (
        <>
          {/* Shimmer sweep — GPU-accelerated, fades out as image loads */}
          {!loaded && (
            <div
              className="shimmer-sweep absolute inset-0 pointer-events-none"
              style={{ zIndex: 1 }}
              aria-hidden="true"
            />
          )}

          {/* fetchPriority (not priority/preload) so that when two ScooterImage
              instances are mounted simultaneously and CSS-hidden (e.g. the
              shop desktop/mobile banner), only the visible one is fetched —
              priority/preload would force-load both. */}
          {isFixedSize ? (
            // Explicit width/height (no `sizes`) instead of `fill` — Next.js
            // then generates only [w, w*2] srcset candidates instead of the
            // full responsive width range, since the rendered size never
            // changes across breakpoints. Visually identical: imageClassName
            // still stretches it to fill this wrapper exactly like `fill` would.
            <Image
              src={resolvedSrc!}
              alt={alt}
              width={width}
              height={height}
              className={imageClassName}
              fetchPriority={priority ? 'high' : undefined}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              onLoad={handleLoad}
              unoptimized={Boolean(variant)}
            />
          ) : (
            <Image
              src={resolvedSrc!}
              alt={alt}
              fill
              className={imageClassName}
              sizes={sizes}
              fetchPriority={priority ? 'high' : undefined}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              onLoad={handleLoad}
              unoptimized={Boolean(variant)}
            />
          )}
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

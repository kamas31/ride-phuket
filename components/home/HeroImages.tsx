'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

/**
 * Scroll-driven hero dissolve — Air France style.
 *
 * Structure (stacking order, bottom → top):
 *   containerRef  [images + dark gradient overlays — blurred + faded together]
 *   whiteRef      [#ffffff overlay — progressively covers container]
 *   ← page content divs sit above both (later in DOM)
 *
 * Timing:
 *   0–50% hero scroll  → sharp, opacity 1, white overlay invisible
 *   50–100% hero scroll → blur 0→12px, container fades to 0.7, white 0→0.90
 *
 * At ~92% hero scroll the image is ~90% white + blurred.
 * The header then instantly snaps to the app background (#ffffff/0.92),
 * which is visually identical to what's behind it — no perceived transition.
 */
export function HeroImages() {
  const containerRef    = useRef<HTMLDivElement>(null)
  const whiteOverlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container    = containerRef.current
    const whiteOverlay = whiteOverlayRef.current
    if (!container || !whiteOverlay) return

    let raf: number

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // progress: 0 at top of page, 1 when hero fully scrolled past
        const progress = Math.min(1, window.scrollY / window.innerHeight)
        // p: 0 at 50% hero, 1 at 100% hero — transition only in second half
        const p = Math.max(0, (progress - 0.5) / 0.5)

        // Images + dark overlays: blur + mild fade
        container.style.filter    = `blur(${(p * 12).toFixed(1)}px)`
        container.style.opacity   = (1 - p * 0.30).toFixed(3)   // 1 → 0.70
        container.style.transform = `scale(${(1 + p * 0.06).toFixed(4)})` // hides blur edges

        // White dissolve: hero approaches app background (#ffffff)
        whiteOverlay.style.opacity = (p * 0.90).toFixed(3)      // 0 → 0.90
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      {/* ── Images + dark gradient overlays (blurred + faded together) ── */}
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none"
        style={{ willChange: 'transform, opacity, filter' }}
      >
        {/* Mobile hero image — fetchPriority (not priority/preload) keeps the
            CSS-hidden desktop variant from being fetched too; see Next.js docs
            "Theming images" / fetchPriority guidance for this exact pattern. */}
        <Image
          src="/heromobilemodif.png"
          alt="Explore Phuket on a scooter"
          fill
          fetchPriority="high"
          className="object-cover object-center md:hidden"
          sizes="100vw"
        />
        {/* Desktop hero image */}
        <Image
          src="/heromodif.png"
          alt="Explore Phuket on a scooter"
          fill
          fetchPriority="high"
          className="object-cover object-center hidden md:block"
          sizes="100vw"
        />

        {/* Mobile dark gradient — text area dark, scooter zone clear */}
        <div
          className="absolute inset-0 md:hidden"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.18) 80%, rgba(0,0,0,0.02) 100%)' }}
        />
        {/* Desktop dark gradient */}
        <div
          className="absolute inset-0 hidden md:block"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.35), rgba(0,0,0,0.55))' }}
        />
      </div>

      {/* ── White dissolve layer — hero melts into app background (#ffffff) ── */}
      <div
        ref={whiteOverlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--color-surface, #ffffff)', opacity: 0 }}
      />
    </>
  )
}

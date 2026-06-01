'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

/**
 * Scroll-driven blur + fade on the hero background images.
 *
 * 0–50% hero scroll  → sharp, opacity 1, no blur
 * 50–100% hero scroll → progressively blur (0→12px) + fade (1→0.3)
 *
 * Applied directly via DOM ref for smooth 60fps updates with no React re-renders.
 * Scale(1+) expands the image slightly so blurred edges stay outside the clipped section.
 */
export function HeroImages() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let raf: number

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // progress: 0 at top, 1 when hero is fully scrolled past
        const progress = Math.min(1, window.scrollY / window.innerHeight)
        // p: 0 at 50% hero, 1 at 100% hero — transition only in the second half
        const p = Math.max(0, (progress - 0.5) / 0.5)

        const blur    = (p * 12).toFixed(1)           // 0 → 12 px
        const opacity = (1 - p * 0.70).toFixed(3)     // 1 → 0.30
        const scale   = (1 + p * 0.06).toFixed(4)     // 1 → 1.06 (hides blur edges)

        container.style.filter    = `blur(${blur}px)`
        container.style.opacity   = opacity
        container.style.transform = `scale(${scale})`
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
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {/* Mobile — heromobile.png */}
      <Image
        src="/heromobile.png"
        alt="Explore Phuket on a scooter"
        fill
        priority
        className="object-cover object-center md:hidden"
        sizes="100vw"
      />
      {/* Desktop — hero.png */}
      <Image
        src="/hero.png"
        alt="Explore Phuket on a scooter"
        fill
        priority
        className="object-cover object-center hidden md:block"
        sizes="100vw"
      />
    </div>
  )
}

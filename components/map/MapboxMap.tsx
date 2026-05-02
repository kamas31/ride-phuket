'use client'

/**
 * Production Mapbox map — drop-in replacement for MapPlaceholder.
 *
 * Setup:
 *   1. npm install mapbox-gl @types/mapbox-gl
 *   2. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local
 *   3. In explore/page.tsx, swap:
 *        import { MapPlaceholder } from '@/components/map/MapPlaceholder'
 *      for:
 *        import { MapboxMap } from '@/components/map/MapboxMap'
 *      (Same props interface — zero other changes needed)
 *
 * The component is intentionally left as a typed shell until the
 * Mapbox token is set, to avoid adding the 250KB GL bundle prematurely.
 */

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { MAPBOX_TOKEN, MAP_DEFAULTS, PHUKET_BOUNDS } from '@/lib/mapbox'
import type { Scooter } from '@/types'

interface MapboxMapProps {
  scooters: Scooter[]
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
}

export function MapboxMap({ scooters, selectedId, onSelect, className }: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return

    /**
     * ACTIVATE: npm install mapbox-gl @types/mapbox-gl
     * Then uncomment this block and remove the comment wrapper.
     *
     * import('mapbox-gl').then(({ default: mapboxgl }) => {
     *   mapboxgl.accessToken = MAPBOX_TOKEN
     *   const map = new mapboxgl.Map({
     *     container: containerRef.current!,
     *     style: MAP_DEFAULTS.style,
     *     center: MAP_DEFAULTS.center,
     *     zoom: MAP_DEFAULTS.zoom,
     *     minZoom: MAP_DEFAULTS.minZoom,
     *     maxZoom: MAP_DEFAULTS.maxZoom,
     *   })
     *   mapRef.current = map
     *   map.fitBounds(PHUKET_BOUNDS, { padding: 40, animate: false })
     *   map.addControl(new mapboxgl.NavigationControl(), 'top-right')
     *   map.on('load', () => {
     *     scooters.forEach(scooter => {
     *       const el = document.createElement('div')
     *       el.className = 'mapbox-price-pin'
     *       el.innerHTML = `<span>฿${scooter.pricePerDay.toLocaleString()}</span>`
     *       el.addEventListener('click', () => onSelect?.(scooter.id))
     *       new mapboxgl.Marker({ element: el, anchor: 'bottom' })
     *         .setLngLat([scooter.lng, scooter.lat])
     *         .addTo(map)
     *     })
     *   })
     *   return () => map.remove()
     * })
     */
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!MAPBOX_TOKEN) {
    return (
      <div className={cn('rounded-[20px] bg-[#f8f8f6] border border-[#e8e8e4] flex items-center justify-center', className)}>
        <p className="text-sm text-[#9c9c98]">
          Set <code className="font-mono text-xs bg-[#f0f0ec] px-1.5 py-0.5 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the map.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Mapbox price pin styles */}
      <style>{`
        .mapbox-price-pin {
          background: white;
          border: 2px solid white;
          border-radius: 99px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 700;
          color: #0f0f0e;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .mapbox-price-pin:hover {
          background: #FF6B35;
          color: white;
          transform: scale(1.06);
        }
        .mapboxgl-ctrl-logo { display: none !important; }
      `}</style>
      <div
        ref={containerRef}
        className={cn('rounded-[20px] overflow-hidden border border-[#e8e8e4]', className)}
      />
    </>
  )
}

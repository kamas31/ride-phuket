'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

// Generates a GeoJSON polygon that approximates a circle on the map
function circlePolygon(
  center: [number, number],
  radiusKm: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const steps = 64
  const coords: [number, number][] = Array.from({ length: steps }, (_, i) => {
    const angle = (i / steps) * 2 * Math.PI
    const dLng  = (radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180))) * Math.cos(angle)
    const dLat  = (radiusKm / 111.32) * Math.sin(angle)
    return [center[0] + dLng, center[1] + dLat]
  })
  coords.push(coords[0])
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  }
}

interface ShopLocationMapProps {
  lat: number
  lng: number
  mode: 'exact' | 'approximate'
  className?: string
}

export default function ShopLocationMap({ lat, lng, mode, className }: ShopLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    mapboxgl.accessToken = token

    // For approximate mode, nudge the displayed center slightly (Airbnb-style)
    const nudgeLat = mode === 'approximate' ? lat + (Math.random() - 0.5) * 0.003 : lat
    const nudgeLng = mode === 'approximate' ? lng + (Math.random() - 0.5) * 0.004 : lng

    const map = new mapboxgl.Map({
      container:        containerRef.current,
      style:            'mapbox://styles/mapbox/light-v11',
      center:           [nudgeLng, nudgeLat],
      zoom:             mode === 'approximate' ? 13 : 15,
      interactive:      true,
      attributionControl: false,
      fadeDuration:     0,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      if (mode === 'exact') {
        new mapboxgl.Marker({ color: '#FF6B35' })
          .setLngLat([lng, lat])
          .addTo(map)
      } else {
        // Approximate: filled zone, no precise pin
        const zone = circlePolygon([nudgeLng, nudgeLat], 0.38)
        map.addSource('zone', { type: 'geojson', data: zone as GeoJSON.Feature })
        map.addLayer({
          id: 'zone-fill', type: 'fill', source: 'zone',
          paint: { 'fill-color': '#FF6B35', 'fill-opacity': 0.12 },
        })
        map.addLayer({
          id: 'zone-border', type: 'line', source: 'zone',
          paint: { 'line-color': '#FF6B35', 'line-width': 1.5, 'line-opacity': 0.35 },
        })
      }
    })

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className={cn('rounded-[16px] bg-[#f8f8f6] border border-[#e8e8e4] flex items-center justify-center', className)}>
        <div className="text-center py-6">
          <MapPin className="w-6 h-6 text-[#d0d0cc] mx-auto mb-1.5" />
          <p className="text-xs text-[#9c9c98]">Map unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative rounded-[16px] overflow-hidden border border-[#e8e8e4]', className)}>
      <div ref={containerRef} className="w-full h-full" />
      {mode === 'approximate' && (
        <div className="absolute bottom-2.5 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-[8px] px-3 py-1.5 text-[10px] text-[#5c5c58] text-center leading-tight pointer-events-none">
          Approximate area — confirm exact address with the shop
        </div>
      )}
    </div>
  )
}

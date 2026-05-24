'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface PinPickerMapProps {
  lat: number
  lng: number
  onChange: (coords: { lat: number; lng: number }) => void
}

const PHUKET_CENTER: [number, number] = [98.3381, 7.9019]

export default function PinPickerMap({ lat, lng, onChange }: PinPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)
  const markerRef    = useRef<mapboxgl.Marker | null>(null)
  const onChangeRef  = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return
    mapboxgl.accessToken = token

    const initLng = lng || PHUKET_CENTER[0]
    const initLat = lat || PHUKET_CENTER[1]

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initLng, initLat],
      zoom: 14,
      attributionControl: false,
      fadeDuration: 0,
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    const marker = new mapboxgl.Marker({ color: '#FF6B35', draggable: true })
      .setLngLat([initLng, initLat])
      .addTo(map)
    markerRef.current = marker

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat()
      onChangeRef.current({
        lat: Math.round(lngLat.lat * 1e6) / 1e6,
        lng: Math.round(lngLat.lng * 1e6) / 1e6,
      })
    })

    return () => {
      marker.remove()
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync marker when lat/lng change from outside (e.g. manual input)
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return
    if (!lat || !lng) return
    const current = markerRef.current.getLngLat()
    if (Math.abs(current.lat - lat) > 0.0001 || Math.abs(current.lng - lng) > 0.0001) {
      markerRef.current.setLngLat([lng, lat])
      mapRef.current.panTo([lng, lat], { duration: 400 })
    }
  }, [lat, lng])

  return (
    <div className="rounded-[16px] overflow-hidden border border-[#e8e8e4]" style={{ height: 280 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

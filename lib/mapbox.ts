// Mapbox integration config
// Install: npm install mapbox-gl @types/mapbox-gl
// Then swap MapPlaceholder for MapboxMap in explore/page.tsx

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export const PHUKET_BOUNDS: [[number, number], [number, number]] = [
  [98.22, 7.72],  // SW: south-west corner of Phuket
  [98.45, 8.15],  // NE: north-east corner
]

export const MAP_DEFAULTS = {
  center: [98.3381, 7.9519] as [number, number],
  zoom: 11,
  minZoom: 10,
  maxZoom: 18,
  style: 'mapbox://styles/mapbox/light-v11',
}

// Custom map style overrides (apply after load)
export const MAP_STYLE_OVERRIDES = {
  waterColor: '#a8d4e8',
  landColor: '#f8f8f6',
  roadColor: '#e0e0da',
  labelFont: ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
}

export function isMapboxReady(): boolean {
  return Boolean(MAPBOX_TOKEN)
}

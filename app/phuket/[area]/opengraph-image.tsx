import { ImageResponse } from 'next/og'
import { getArea, AREAS } from '@/constants/areas'
import { formatPrice } from '@/lib/utils'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return AREAS.map(a => ({ area: a.slug }))
}

export default async function Image({ params }: { params: Promise<{ area: string }> }) {
  const { area: slug } = await params
  const area = getArea(slug)
  const label = area?.label ?? slug
  const priceFrom = area?.priceFrom ?? 250

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0f0f0e',
          display: 'flex',
          flexDirection: 'column',
          padding: '64px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* orange accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: '#FF6B35', display: 'flex' }} />

        {/* brand tag */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'auto' }}>
          <div
            style={{
              background: '#FF6B35',
              color: 'white',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 2,
              padding: '6px 18px',
              borderRadius: 99,
              display: 'flex',
            }}
          >
            KOH RIDE
          </div>
        </div>

        {/* main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', display: 'flex' }}>
            Scooter Rental
          </div>
          <div style={{ color: 'white', fontSize: 80, fontWeight: 800, lineHeight: 1.1, display: 'flex' }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 8 }}>
            <div style={{ color: '#FF6B35', fontSize: 28, fontWeight: 700, display: 'flex' }}>
              From {formatPrice(priceFrom)}/day
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 22, display: 'flex' }}>
              Phuket, Thailand
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}

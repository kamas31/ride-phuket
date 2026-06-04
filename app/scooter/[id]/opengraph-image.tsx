import { ImageResponse } from 'next/og'
import { getScooterById } from '@/lib/supabase/queries'
import { formatPricePerDay } from '@/lib/utils'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let scooterName = 'Scooter Rental'
  let priceLabel = ''
  let location = 'Phuket'

  try {
    const scooter = await getScooterById(id)
    if (scooter) {
      scooterName = scooter.name
      if (scooter.pricePerDay > 0) priceLabel = formatPricePerDay(scooter.pricePerDay)
      if (scooter.location) {
        location = `${scooter.location.charAt(0).toUpperCase()}${scooter.location.slice(1)}, Phuket`
      }
    }
  } catch {
    // fall through to defaults
  }

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
            Scooter Rental • {location}
          </div>
          <div
            style={{
              color: 'white',
              fontSize: scooterName.length > 20 ? 60 : 76,
              fontWeight: 800,
              lineHeight: 1.1,
              display: 'flex',
            }}
          >
            {scooterName}
          </div>
          {priceLabel && (
            <div style={{ color: '#FF6B35', fontSize: 36, fontWeight: 700, display: 'flex', marginTop: 8 }}>
              {priceLabel}
            </div>
          )}
        </div>
      </div>
    ),
    size,
  )
}

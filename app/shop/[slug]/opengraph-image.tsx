import { ImageResponse } from 'next/og'
import { getShopBySlug } from '@/lib/supabase/queries'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let shopName = 'Scooter Rental Shop'
  let location = 'Phuket'

  try {
    const shop = await getShopBySlug(slug)
    if (shop) {
      shopName = shop.name
      if (shop.location) location = `${shop.location}, Phuket`
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
            Rental Shop
          </div>
          <div
            style={{
              color: 'white',
              fontSize: shopName.length > 24 ? 56 : 72,
              fontWeight: 800,
              lineHeight: 1.1,
              display: 'flex',
              maxWidth: 900,
            }}
          >
            {shopName}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 26, display: 'flex', marginTop: 8 }}>
            {location}
          </div>
        </div>
      </div>
    ),
    size,
  )
}

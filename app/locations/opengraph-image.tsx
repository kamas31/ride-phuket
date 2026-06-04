import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/constants'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
            {SITE_NAME.toUpperCase()}
          </div>
        </div>

        {/* main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', display: 'flex' }}>
            Phuket, Thailand
          </div>
          <div style={{ color: 'white', fontSize: 72, fontWeight: 800, lineHeight: 1.1, display: 'flex', flexDirection: 'column' }}>
            <span style={{ display: 'flex' }}>Scooter Rental</span>
            <span style={{ color: '#FF6B35', display: 'flex' }}>Locations</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 24, marginTop: 8, display: 'flex' }}>
            Patong · Kata · Chalong · Nai Harn · Bang Tao &amp; more
          </div>
        </div>
      </div>
    ),
    size,
  )
}

import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
// mapbox-gl CSS served from /public/mapbox-gl.css (see <link> in <head> below)
import { Toaster } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/constants'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Premium Scooter Rentals in Phuket`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ['scooter rental phuket', 'motorbike rental phuket', 'scooter hire phuket', 'honda pcx phuket', 'yamaha nmax phuket'],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Premium Scooter Rentals in Phuket`,
    description: SITE_DESCRIPTION,
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Premium Scooter Rentals in Phuket`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og.png`],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico',        sizes: 'any' },
      { url: '/icons/icon-32.png',  type: 'image/png', sizes: '32x32' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png',        sizes: '180x180' },
      { url: '/icons/apple-touch-icon.png',  sizes: '180x180' },
    ],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FF6B35',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Mapbox GL CSS — served from /public, zero bundler dependency */}
        <link rel="stylesheet" href="/mapbox-gl.css" />
        {/* Preconnect hints */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="antialiased">
        <Navbar />
        <main className="min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileBottomNav />
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  )
}

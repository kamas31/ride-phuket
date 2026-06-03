import Link from 'next/link'
import { SITE_NAME } from '@/constants'
import { getLiveAreas } from '@/lib/live-areas'

const LOCATION_PRIORITY = ['patong', 'kamala', 'kata', 'karon', 'rawai']

const STATIC_SECTIONS = {
  Discover: [
    { href: '/explore', label: 'Explore Scooters' },
    { href: '/saved',   label: 'Saved Scooters'   },
    { href: '/auth/login', label: 'Sign In'        },
  ],
  Partners: [
    { href: '/partner', label: 'List Your Scooters' },
  ],
  Legal: [
    { href: '/terms',                                                      label: 'Terms of Service' },
    { href: '/privacy',                                                    label: 'Privacy Policy'   },
    { href: 'mailto:hello@kohride.com?subject=Koh%20Ride%20Support',      label: 'Contact Us'       },
    { href: '/feedback',                                                   label: 'Feedback'         },
  ],
}

export default async function Footer() {
  const liveAreas = await getLiveAreas()

  const locationLinks = liveAreas
    .slice()
    .sort((a, b) => {
      const ai = LOCATION_PRIORITY.indexOf(a.slug)
      const bi = LOCATION_PRIORITY.indexOf(b.slug)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    .slice(0, 5)
    .map(area => ({ href: `/phuket/${area.slug}`, label: area.label }))

  const sections: Record<string, { href: string; label: string }[]> = {
    Discover: STATIC_SECTIONS.Discover,
    ...(locationLinks.length > 0 ? { Locations: locationLinks } : {}),
    Partners: STATIC_SECTIONS.Partners,
    Legal:    STATIC_SECTIONS.Legal,
  }

  return (
    <footer className="bg-[#0f0f0e] text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-nav.png"
                alt={SITE_NAME}
                style={{ width: 38, height: 38, display: 'block' }}
                className="group-hover:scale-105 transition-transform"
              />
              <span className="font-bold text-[17px]">{SITE_NAME}</span>
            </Link>
            <p className="mt-4 text-[#9c9c98] text-sm leading-relaxed max-w-xs">
              Find the exact scooter you want in Phuket.
            </p>
          </div>

          {/* Links */}
          {Object.entries(sections).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={`${link.href}|${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#9c9c98] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#9c9c98] text-sm">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
            <span className="text-[#9c9c98] text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

import Link from 'next/link'
import { MapPin, Share2, Globe } from 'lucide-react'
import { SITE_NAME, SITE_DESCRIPTION } from '@/constants'

const FOOTER_LINKS = {
  Product: [
    { href: '/explore', label: 'Explore Scooters' },
    { href: '/bookings', label: 'My Bookings' },
    { href: '/auth/login', label: 'Sign In' },
  ],
  Locations: [
    { href: '/phuket/patong', label: 'Patong' },
    { href: '/phuket/kata', label: 'Kata Beach' },
    { href: '/phuket/karon', label: 'Karon' },
    { href: '/phuket/rawai', label: 'Rawai' },
    { href: '/phuket/bang-tao', label: 'Bang Tao' },
    { href: '/phuket/phuket-town', label: 'Phuket Town' },
  ],
  Partners: [
    { href: '/partner', label: 'List Your Scooters' },
    { href: '/partner', label: 'Partner Program' },
  ],
  Legal: [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/insurance', label: 'Insurance Policy' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-[#0f0f0e] text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="w-8 h-8 bg-[#FF6B35] rounded-[10px] flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[17px]">{SITE_NAME}</span>
            </Link>
            <p className="mt-4 text-[#9c9c98] text-sm leading-relaxed max-w-xs">
              {SITE_DESCRIPTION}
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.href}>
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

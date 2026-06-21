import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SITE_NAME } from '@/constants'
import { AREAS } from '@/constants/areas'
import { MODELS } from '@/constants/models'

const POPULAR_SLUGS = ['patong', 'kata', 'karon', 'rawai', 'bang-tao', 'phuket-town']

const STATIC_SECTIONS = {
  Discover: [
    { href: '/explore',    label: 'Explore Scooters' },
    { href: '/faq',        label: 'Rental FAQ'        },
    { href: '/saved',      label: 'Saved Scooters'    },
    { href: '/auth/login', label: 'Sign In'           },
  ],
  Partners: [
    { href: '/partner', label: 'List Your Scooters' },
  ],
  Legal: [
    { href: '/terms',      label: 'Terms of Service' },
    { href: '/privacy',    label: 'Privacy Policy'   },
    { href: '/contact-us', label: 'Contact Us'       },
    { href: '/feedback',   label: 'Feedback'         },
  ],
}

export default function Footer() {
  const popularLinks = AREAS
    .filter(a => POPULAR_SLUGS.includes(a.slug))
    .sort((a, b) => POPULAR_SLUGS.indexOf(a.slug) - POPULAR_SLUGS.indexOf(b.slug))
    .map(area => ({ href: `/phuket/${area.slug}`, label: area.label }))

  return (
    <footer className="bg-[#0f0f0e] text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-10">

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

          {/* Discover */}
          <div>
            <h4 className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-4">
              Discover
            </h4>
            <ul className="space-y-3">
              {STATIC_SECTIONS.Discover.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#9c9c98] hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Locations — 6 top areas + View all link */}
          <div>
            <h4 className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-4">
              Popular Locations
            </h4>
            <ul className="space-y-3">
              {popularLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#9c9c98] hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  href="/locations"
                  className="inline-flex items-center gap-1 text-sm text-[#FF6B35] hover:text-[#e85d29] transition-colors font-medium"
                >
                  View all Phuket locations
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Models */}
          <div>
            <h4 className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-4">
              Popular Models
            </h4>
            <ul className="space-y-3">
              {MODELS.map(model => (
                <li key={model.slug}>
                  <Link href={`/models/${model.slug}`} className="text-sm text-[#9c9c98] hover:text-white transition-colors">
                    {model.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h4 className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-4">
              Partners
            </h4>
            <ul className="space-y-3">
              {STATIC_SECTIONS.Partners.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#9c9c98] hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              {STATIC_SECTIONS.Legal.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#9c9c98] hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

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

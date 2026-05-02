'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Menu, X, User, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SITE_NAME, NAV_LINKS } from '@/constants'

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const isHome = pathname === '/'

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isHome
            ? 'bg-transparent'
            : 'bg-white/95 backdrop-blur-md border-b border-[#e8e8e4]'
        )}
        style={{ boxShadow: isHome ? 'none' : 'var(--shadow-nav)' }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#FF6B35] rounded-[10px] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span
              className={cn(
                'font-bold text-[17px] tracking-tight',
                isHome ? 'text-white' : 'text-[#0f0f0e]'
              )}
            >
              {SITE_NAME}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-[10px] text-sm font-medium transition-colors',
                  isHome
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : pathname === link.href
                    ? 'text-[#FF6B35] bg-[#fff4f0]'
                    : 'text-[#5c5c58] hover:text-[#0f0f0e] hover:bg-[#f8f8f6]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/profile"
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                isHome
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-[#f8f8f6] text-[#5c5c58] hover:bg-[#f0f0ec]'
              )}
            >
              <User className="w-4 h-4" />
            </Link>
            <Link
              href="/explore"
              className="px-5 py-2 bg-[#FF6B35] text-white text-sm font-semibold rounded-full hover:bg-[#e85d29] transition-colors shadow-sm"
            >
              Explore Scooters
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className={cn(
              'md:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              isHome ? 'text-white hover:bg-white/10' : 'text-[#0f0f0e] hover:bg-[#f0f0ec]'
            )}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#e8e8e4]">
              <span className="font-bold text-[17px]">{SITE_NAME}</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f0f0ec] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-5 flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-[#FF6B35] bg-[#fff4f0]'
                      : 'text-[#5c5c58] hover:text-[#0f0f0e] hover:bg-[#f8f8f6]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="p-5 border-t border-[#e8e8e4]">
              <Link
                href="/explore"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center w-full py-3 bg-[#FF6B35] text-white text-sm font-semibold rounded-full hover:bg-[#e85d29] transition-colors"
              >
                Explore Scooters
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

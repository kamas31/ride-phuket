'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MapPin, Menu, X, User, BookOpen, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SITE_NAME } from '@/constants'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

function NavLink({ href, label, active, isHome }: {
  href: string; label: string; active: boolean; isHome: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'px-4 py-2 rounded-[10px] text-sm font-medium transition-colors',
        isHome
          ? 'text-white/85 hover:text-white hover:bg-white/10'
          : active
          ? 'text-[#FF6B35] bg-[#fff4f0]'
          : 'text-[#5c5c58] hover:text-[#0f0f0e] hover:bg-[#f8f8f6]'
      )}
    >
      {label}
    </Link>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isHome = pathname === '/'
  const isShopOwner = profile?.role === 'shop_owner'

  const NAV_LINKS = isShopOwner
    ? [
        { href: '/partner/dashboard', label: 'Dashboard' },
        { href: '/explore', label: 'Explore' },
        { href: '/profile', label: 'Profile' },
      ]
    : [
        { href: '/explore', label: 'Explore' },
        { href: '/bookings', label: 'My Bookings' },
        { href: '/profile', label: 'Profile' },
      ]

  const CTA = isShopOwner
    ? { href: '/partner/dashboard', label: 'My Dashboard' }
    : { href: '/explore', label: 'Explore Scooters' }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isHome
            ? 'bg-transparent'
            : 'bg-white/95 backdrop-blur-md border-b border-[#e8e8e4]'
        )}
        style={{ boxShadow: isHome ? 'none' : '0 1px 0 0 rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#FF6B35] rounded-[10px] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className={cn('font-bold text-[17px] tracking-tight', isHome ? 'text-white' : 'text-[#0f0f0e]')}>
              {SITE_NAME}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={pathname === link.href || pathname.startsWith(link.href + '/')}
                isHome={isHome}
              />
            ))}
          </nav>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              /* User menu */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors',
                    isHome
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-[#f8f8f6] hover:bg-[#f0f0ec] text-[#0f0f0e]'
                  )}
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 bg-[#FF6B35] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(profile?.name ?? user.email ?? 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {profile?.name?.split(' ')[0] ?? user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-[16px] border border-[#e8e8e4] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-[#f0f0ec]">
                        <p className="text-xs font-semibold text-[#0f0f0e] truncate">{profile?.name ?? user.email}</p>
                        <p className="text-[10px] text-[#9c9c98] mt-0.5 capitalize">
                          {profile?.role?.replace('_', ' ') ?? 'rider'}
                        </p>
                      </div>
                      <div className="py-1.5">
                        {NAV_LINKS.map(link => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#5c5c58] hover:text-[#0f0f0e] hover:bg-[#f8f8f6] transition-colors"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-[#f0f0ec] py-1.5">
                        <button
                          onClick={() => { setUserMenuOpen(false); signOut() }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                    isHome ? 'text-white/85 hover:text-white hover:bg-white/10' : 'text-[#5c5c58] hover:text-[#0f0f0e]'
                  )}
                >
                  Sign In
                </Link>
                <Link
                  href={CTA.href}
                  className="px-5 py-2 bg-[#FF6B35] text-white text-sm font-semibold rounded-full hover:bg-[#e85d29] transition-colors shadow-sm"
                >
                  {CTA.label}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className={cn(
              'md:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              isHome ? 'text-white hover:bg-white/10' : 'text-[#0f0f0e] hover:bg-[#f0f0ec]'
            )}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#e8e8e4]">
              <div>
                <span className="font-bold text-[17px]">{SITE_NAME}</span>
                {profile && (
                  <p className="text-[10px] text-[#9c9c98] capitalize">{profile.role.replace('_', ' ')}</p>
                )}
              </div>
              <button onClick={() => setMenuOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f0f0ec]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User info in drawer */}
            {user && (
              <div className="px-5 py-4 bg-[#f8f8f6] border-b border-[#e8e8e4]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-bold">
                    {(profile?.name ?? user.email ?? 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#0f0f0e]">{profile?.name ?? user.email?.split('@')[0]}</p>
                    <p className="text-[11px] text-[#9c9c98]">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex-1 p-5 flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-colors',
                    pathname === link.href ? 'text-[#FF6B35] bg-[#fff4f0]' : 'text-[#5c5c58] hover:text-[#0f0f0e] hover:bg-[#f8f8f6]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="p-5 border-t border-[#e8e8e4] space-y-2">
              {user ? (
                <button
                  onClick={() => { setMenuOpen(false); signOut() }}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-[#e8e8e4] rounded-full text-sm font-medium text-[#9c9c98] hover:text-[#ef4444] hover:border-[#ef4444] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center w-full py-3 border border-[#e8e8e4] rounded-full text-sm font-semibold text-[#0f0f0e] hover:bg-[#f8f8f6]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href={CTA.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center w-full py-3 bg-[#FF6B35] text-white text-sm font-semibold rounded-full hover:bg-[#e85d29] transition-colors"
                  >
                    {CTA.label}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

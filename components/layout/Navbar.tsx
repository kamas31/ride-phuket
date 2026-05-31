'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, ChevronDown, User, Store } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SITE_NAME } from '@/constants'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useUnreadCount } from '@/hooks/useUnreadCount'

function NavLink({ href, label, active, isHero, badge }: {
  href: string; label: string; active: boolean; isHero: boolean; badge?: number
}) {
  return (
    <Link
      href={href}
      className={cn(
        'relative px-4 py-2 rounded-[10px] text-sm font-medium transition-colors duration-300 flex items-center gap-1.5',
        isHero
          ? 'text-white/85 hover:text-white hover:bg-white/10'
          : active
          ? 'text-[#FF6B35] bg-[#fff4f0]'
          : 'text-[#5c5c58] hover:text-[#0f0f0e] hover:bg-[#f8f8f6]'
      )}
    >
      {label}
      {badge != null && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#FF6B35] rounded-full px-1 text-[9px] font-bold text-white leading-none tabular-nums">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

export default function Navbar() {
  const pathname          = usePathname()
  const { user, signOut } = useAuth()
  const { profile }       = useProfile()
  const unread            = useUnreadCount()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled]         = useState(false)

  useEffect(() => {
    if (pathname !== '/') return
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  const isHero      = pathname === '/' && !scrolled
  const isShopOwner = profile?.role === 'shop_owner'

  const NAV_LINKS = isShopOwner
    ? [
        { href: '/partner/dashboard',  label: 'Dashboard' },
        { href: '/partner/messages',   label: 'Messages'  },
        { href: '/explore',            label: 'Explore'   },
        { href: '/profile',            label: 'Profile'   },
      ]
    : [
        { href: '/explore',   label: 'Explore'  },
        { href: '/saved',     label: 'Saved'    },
        { href: '/messages',  label: 'Messages' },
        { href: '/profile',   label: 'Profile'  },
      ]

  const CTA = isShopOwner
    ? { href: '/partner/dashboard', label: 'My Dashboard'     }
    : { href: '/explore',           label: 'Explore Scooters' }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Glass backdrop — fades in as hero scrolls away */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-white/[0.92] backdrop-blur-[14px] transition-opacity duration-300 ease-in-out pointer-events-none"
        style={{ opacity: isHero ? 0 : 1 }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px bg-black/[0.07] transition-opacity duration-300 ease-in-out pointer-events-none"
        style={{ opacity: isHero ? 0 : 1 }}
      />

      {/* Nav content */}
      <div className="relative max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-nav.png"
            alt={SITE_NAME}
            style={{ width: 38, height: 38, display: 'block' }}
            className="group-hover:scale-105 transition-transform"
          />
          <span className={cn(
            'font-bold text-[17px] tracking-tight transition-colors duration-300',
            isHero ? 'text-white' : 'text-[#0f0f0e]'
          )}>
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
              isHero={isHero}
              badge={link.label === 'Messages' ? unread : undefined}
            />
          ))}
        </nav>

        {/* ── Desktop right side ── */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-300',
                  isHero
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-[#f8f8f6] hover:bg-[#f0f0ec] text-[#0f0f0e]'
                )}
              >
                <div className="w-7 h-7 bg-[#FF6B35] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(profile?.name ?? user.email ?? 'U')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium max-w-[100px] truncate">
                  {profile?.name?.split(' ')[0] ?? user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

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
                  'px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300',
                  isHero
                    ? 'text-white/85 hover:text-white hover:bg-white/10'
                    : 'text-[#5c5c58] hover:text-[#0f0f0e]'
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

        {/* ── Mobile account control ── */}
        <div className="md:hidden">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  'relative w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                  isHero
                    ? 'bg-white/10 text-white'
                    : 'bg-[#f8f8f6] text-[#0f0f0e]',
                )}
              >
                {isShopOwner
                  ? <Store className="w-[18px] h-[18px]" />
                  : <User  className="w-[18px] h-[18px]" />
                }
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#FF6B35] rounded-full border-[1.5px] border-white flex items-center justify-center px-[3px]">
                    <span className="text-[8px] font-bold text-white leading-none tabular-nums">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  </span>
                )}
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-[16px] border border-[#e8e8e4] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] overflow-hidden z-50">
                    <div className="px-3 py-2.5 border-b border-[#f0f0ec]">
                      <p className="text-xs font-semibold text-[#0f0f0e] truncate">
                        {profile?.name?.split(' ')[0] ?? user.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-[#9c9c98] capitalize mt-0.5">
                        {isShopOwner ? 'Partner' : 'Rider'}
                      </p>
                    </div>
                    <div className="py-1">
                      {isShopOwner ? (
                        <Link
                          href="/partner/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#5c5c58] hover:bg-[#f8f8f6] transition-colors"
                        >
                          <Store className="w-4 h-4" />
                          Shop
                        </Link>
                      ) : (
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#5c5c58] hover:bg-[#f8f8f6] transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-[#f0f0ec] py-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut() }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
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
            <Link
              href="/auth/login"
              className={cn(
                'px-3.5 py-1.5 text-sm font-semibold rounded-full transition-colors',
                isHero
                  ? 'text-white border border-white/30 hover:bg-white/10'
                  : 'text-[#FF6B35] bg-[#fff4f0]',
              )}
            >
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  )
}

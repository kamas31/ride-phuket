'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, ChevronDown, ChevronRight, MessageCircle, User, Store, Search, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
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
        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] bg-[#FF6B35] rounded-full px-[6px] text-[10px] font-bold text-white leading-none tabular-nums shadow-[0_1px_4px_rgba(255,107,53,0.40)]">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

export default function Navbar() {
  const pathname          = usePathname()
  const router            = useRouter()
  const { user, signOut } = useAuth()
  const { profile }       = useProfile()
  const unread            = useUnreadCount()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [heroProgress, setHeroProgress] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Track scroll progress through the hero (home page only)
  useEffect(() => {
    if (pathname !== '/') return
    const onScroll = () => {
      setHeroProgress(Math.min(1, window.scrollY / window.innerHeight))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  // Auto-focus search input when overlay opens
  useEffect(() => {
    if (!searchOpen) return
    const t = setTimeout(() => searchInputRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [searchOpen])

  const isHomePage  = pathname === '/'
  const isShopOwner = profile?.role === 'shop_owner'

  // Header is fully transparent throughout the hero scroll.
  // At 92%: brief semi-frosted intermediate (hero already ~76% white, switch barely visible).
  // At 96%: snap to full solid app background — three-step sequence, no gradual transitions.
  const headerSolid = !isHomePage || heroProgress >= 0.96
  const headerMid   = isHomePage && heroProgress >= 0.92 && heroProgress < 0.96
  const isHero      = isHomePage && heroProgress < 0.92

  const NAV_LINKS = isShopOwner
    ? [
        { href: '/',                   label: 'Home'      },
        { href: '/partner/dashboard',  label: 'Dashboard' },
        { href: '/partner/messages',   label: 'Messages'  },
        { href: '/explore',            label: 'Explore'   },
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
      {/* Glass backdrop — transparent while hero is visible, instant snap at 92% scroll */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:           headerSolid ? 'rgba(255,255,255,0.92)' : headerMid ? 'rgba(255,255,255,0.50)' : 'transparent',
          backdropFilter:       headerSolid ? 'blur(14px)'             : headerMid ? 'blur(8px)'              : 'none',
          WebkitBackdropFilter: headerSolid ? 'blur(14px)'             : headerMid ? 'blur(8px)'              : 'none',
          borderBottom:         headerSolid ? '1px solid rgba(0,0,0,0.07)' : headerMid ? '1px solid rgba(0,0,0,0.03)' : 'none',
          transition:           'none',
        }}
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
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                  isHero ? 'bg-white/15' : 'bg-[#ececea]',
                )}>
                  {isShopOwner
                    ? <Store className={cn('w-3.5 h-3.5', isHero ? 'text-white' : 'text-[#5c5c58]')} />
                    : <User  className={cn('w-3.5 h-3.5', isHero ? 'text-white' : 'text-[#5c5c58]')} />
                  }
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

        {/* ── Mobile right side: Search + Account ── */}
        <div className="md:hidden flex items-center gap-1">

          {/* Search icon — opens search overlay */}
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300',
              isHero ? 'text-white' : 'text-[#0f0f0e]'
            )}
            aria-label="Search"
          >
            <Search className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>

          {/* Account */}
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
                    {unread > 0 && (
                      <div className="px-2.5 pt-2 pb-1">
                        <Link
                          href={isShopOwner ? '/partner/messages' : '/messages'}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 bg-[#fff4f0] border border-[#fed7b0] rounded-[10px] hover:bg-[#ffe8d6] active:bg-[#ffd9c0] transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 text-[#FF6B35] flex-shrink-0" strokeWidth={2} />
                          <span className="flex-1 text-sm font-semibold text-[#FF6B35]">
                            {unread === 1 ? '1 unread message' : `${unread > 99 ? '99+' : unread} unread messages`}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#FF6B35] flex-shrink-0" />
                        </Link>
                      </div>
                    )}
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

      {/* ── Mobile search overlay ── */}
      {searchOpen && (
        <>
          {/* Dismiss backdrop */}
          <div
            className="fixed inset-0 z-[55] bg-black/40"
            style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
            onClick={() => setSearchOpen(false)}
          />
          {/* Search panel — drops below header */}
          <div
            className="absolute left-0 right-0 top-full z-[56] px-4 pb-3 pt-1.5"
            style={{
              background:           'rgba(10,10,12,0.94)',
              backdropFilter:       'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderBottom:         '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-[10px] rounded-[12px]"
              style={{
                background:  'rgba(255,255,255,0.10)',
                border:      '1px solid rgba(255,255,255,0.18)',
                boxShadow:   '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
              }}
            >
              <Search className="w-4 h-4 flex-shrink-0 text-[#FF6B35]" strokeWidth={2.5} />
              <input
                ref={searchInputRef}
                type="text"
                inputMode="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Search TMAX, NMAX, Honda Click…"
                className="flex-1 bg-transparent text-[15px] font-medium text-white placeholder:text-white/45 placeholder:font-light focus:outline-none min-w-0"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim()
                    if (val) router.push(`/explore?q=${encodeURIComponent(val)}`)
                    setSearchOpen(false)
                  }
                  if (e.key === 'Escape') setSearchOpen(false)
                }}
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-white/40 hover:text-white/70 transition-colors p-0.5 -mr-0.5"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

    </header>
  )
}

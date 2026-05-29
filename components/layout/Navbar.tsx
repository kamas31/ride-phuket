'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, X, LogOut, ChevronDown,
  Home, Bike, Heart, BookOpen, MessageCircle,
  LayoutDashboard, ToggleRight, Store, Plus,
  User, FileText, Shield, HelpCircle,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SITE_NAME } from '@/constants'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

function NavLink({ href, label, active, isHero }: {
  href: string; label: string; active: boolean; isHero: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'px-4 py-2 rounded-[10px] text-sm font-medium transition-colors duration-300',
        isHero
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

function DrawerLink({
  href, icon: Icon, label, pathname, onClick,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  pathname: string
  onClick: () => void
}) {
  const active = pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-3 rounded-[12px] text-sm font-medium transition-colors',
        active
          ? 'bg-[#fff4f0] text-[#FF6B35]'
          : 'text-[#0f0f0e] hover:bg-[#f8f8f6] active:bg-[#f0f0ec]'
      )}
    >
      <span className={cn(
        'w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0',
        active ? 'bg-[#FF6B35]/10' : 'bg-[#f0f0ec]'
      )}>
        <Icon className={cn('w-4 h-4', active ? 'text-[#FF6B35]' : 'text-[#5c5c58]')} />
      </span>
      {label}
    </Link>
  )
}

export default function Navbar() {
  const pathname      = usePathname()
  const { user, signOut } = useAuth()
  const { profile }   = useProfile()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)

  // Scroll listener — only needed on the home page hero.
  // Passive listener is safe for perf; 60px threshold catches first intentional scroll
  // while the dark hero still fills the viewport behind the glass.
  useEffect(() => {
    if (pathname !== '/') return
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll() // sync on mount (handles browser back-nav with restored scroll)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  // ── Body scroll lock for iOS Safari ────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return
    const scrollY = window.scrollY
    const body = document.body
    body.style.overflow  = 'hidden'
    body.style.position  = 'fixed'
    body.style.top       = `-${scrollY}px`
    body.style.width     = '100%'
    return () => {
      body.style.overflow  = ''
      body.style.position  = ''
      body.style.top       = ''
      body.style.width     = ''
      window.scrollTo(0, scrollY)
    }
  }, [menuOpen])

  // Hero state: transparent + white text.
  // Active only on home page before the first scroll threshold.
  const isHero      = pathname === '/' && !scrolled
  const isShopOwner = profile?.role === 'shop_owner'

  const NAV_LINKS = isShopOwner
    ? [
        { href: '/partner/dashboard',  label: 'Dashboard' },
        { href: '/partner/messages',   label: 'Inbox'     },
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
    <>
      <header className="fixed top-0 left-0 right-0 z-50">

        {/* ── Glass backdrop — fades in as hero scrolls away ── */}
        {/* Two-layer approach: background fades via opacity (reliable cross-browser).
            backdrop-filter is always present but invisible at opacity 0. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-white/[0.92] backdrop-blur-[14px] transition-opacity duration-300 ease-in-out pointer-events-none"
          style={{ opacity: isHero ? 0 : 1 }}
        />
        {/* Hairline bottom border fades in with background */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-px bg-black/[0.07] transition-opacity duration-300 ease-in-out pointer-events-none"
          style={{ opacity: isHero ? 0 : 1 }}
        />

        {/* ── Nav content ── */}
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
              />
            ))}
          </nav>

          {/* Desktop right side */}
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

          {/* Mobile menu button */}
          <button
            className={cn(
              'md:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300',
              isHero ? 'text-white hover:bg-white/10' : 'text-[#0f0f0e] hover:bg-[#f0f0ec]'
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

          <div className="absolute top-0 right-0 bottom-0 w-[85vw] max-w-[340px] bg-white shadow-2xl flex flex-col">

            {/* Safe-area top spacer */}
            <div aria-hidden="true" className="shrink-0" style={{ height: 'env(safe-area-inset-top, 0px)' }} />

            {/* ── Header ── */}
            <div className="shrink-0 flex items-center justify-between px-5 h-14 border-b border-[#f0f0ec]">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-nav.png" alt="Koh Ride" style={{ width: 28, height: 28 }} />
                <span className="font-bold text-[15px] text-[#0f0f0e]">Koh Ride</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#9c9c98] hover:bg-[#f0f0ec] active:bg-[#e8e8e4] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>

            {/* ── User identity (if logged in) ── */}
            {user && (
              <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-[#f0f0ec]">
                <div className="w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0 select-none">
                  {(profile?.name ?? user.email ?? 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[14px] text-[#0f0f0e] truncate leading-tight">
                    {profile?.name ?? user.email?.split('@')[0]}
                  </p>
                  <p className="text-[11px] text-[#9c9c98] truncate mt-0.5">{user.email}</p>
                </div>
                <span className={cn(
                  'ml-auto flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                  isShopOwner ? 'bg-[#fff4f0] text-[#FF6B35]' : 'bg-[#f0f0ec] text-[#5c5c58]'
                )}>
                  {isShopOwner ? 'Partner' : 'Rider'}
                </span>
              </div>
            )}

            {/* ── Navigation ── */}
            <nav
              className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-5"
              style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              {/* MAIN */}
              <div>
                <p className="px-3 mb-1 text-[10px] font-bold text-[#9c9c98] uppercase tracking-widest">Main</p>
                {[
                  { href: '/',          icon: Home,           label: 'Home'            },
                  { href: '/explore',   icon: Bike,           label: 'Browse Scooters' },
                  { href: '/saved',     icon: Heart,          label: 'Favorites'       },
                  { href: '/messages',  icon: MessageCircle,  label: 'Messages'        },
                ].map(item => (
                  <DrawerLink key={item.href} {...item} pathname={pathname} onClick={() => setMenuOpen(false)} />
                ))}
              </div>

              {/* PARTNER */}
              {isShopOwner && (
                <div>
                  <p className="px-3 mb-1 text-[10px] font-bold text-[#9c9c98] uppercase tracking-widest">Partner</p>
                  {[
                    { href: '/partner/dashboard',    icon: LayoutDashboard, label: 'Dashboard'       },
                    { href: '/partner/messages',     icon: MessageCircle,   label: 'Inbox'           },
                    { href: '/partner/availability', icon: ToggleRight,     label: 'Availability'    },
                    { href: '/partner/bookings',     icon: BookOpen,        label: 'Rental Requests' },
                    { href: '/partner/shop',         icon: Store,           label: 'Shop Settings'   },
                    { href: '/partner/scooters/new', icon: Plus,            label: 'Add Scooter'     },
                  ].map(item => (
                    <DrawerLink key={item.href} {...item} pathname={pathname} onClick={() => setMenuOpen(false)} />
                  ))}
                </div>
              )}

              {/* ACCOUNT */}
              <div>
                <p className="px-3 mb-1 text-[10px] font-bold text-[#9c9c98] uppercase tracking-widest">Account</p>
                {user && (
                  <DrawerLink href="/profile" icon={User} label="Profile" pathname={pathname} onClick={() => setMenuOpen(false)} />
                )}
                <DrawerLink href="/terms"   icon={FileText} label="Terms of Service" pathname={pathname} onClick={() => setMenuOpen(false)} />
                <DrawerLink href="/privacy" icon={Shield}   label="Privacy Policy"   pathname={pathname} onClick={() => setMenuOpen(false)} />
                {!user && (
                  <DrawerLink href="/partner" icon={HelpCircle} label="List Your Scooters" pathname={pathname} onClick={() => setMenuOpen(false)} />
                )}
              </div>
            </nav>

            {/* ── Auth footer ── */}
            <div
              className="shrink-0 px-3 pt-3 border-t border-[#e8e8e4] space-y-2"
              style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {user ? (
                <button
                  onClick={() => { setMenuOpen(false); signOut() }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] text-sm font-semibold text-[#ef4444] hover:bg-[#fef2f2] active:bg-[#fee2e2] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center w-full py-3.5 border border-[#e8e8e4] rounded-[14px] text-sm font-semibold text-[#0f0f0e] hover:bg-[#f8f8f6] active:bg-[#f0f0ec] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href={CTA.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center w-full py-3.5 bg-[#FF6B35] text-white text-sm font-semibold rounded-[14px] hover:bg-[#e85d29] active:bg-[#d4521f] transition-colors"
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

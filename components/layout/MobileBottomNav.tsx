'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Bookmark, MessageCircle, User, Radio, Store } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import { useUnreadReviewCount } from '@/hooks/useUnreadReviewCount'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  isActive?: (pathname: string) => boolean
}

const RIDER_NAV: NavItem[] = [
  { href: '/',         label: 'Home',     icon: Home          },
  { href: '/explore',  label: 'Explore',  icon: Map           },
  { href: '/saved',    label: 'Saved',    icon: Bookmark      },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/profile',  label: 'Profile',  icon: User          },
]

const OWNER_NAV: NavItem[] = [
  { href: '/',                     label: 'Home',    icon: Home          },
  { href: '/explore',              label: 'Explore', icon: Map           },
  { href: '/partner/availability', label: 'Live',    icon: Radio         },
  { href: '/partner/messages',     label: 'Messages',icon: MessageCircle },
  {
    href: '/partner/dashboard',
    label: 'Shop',
    icon: Store,
    isActive: (p) =>
      p.startsWith('/partner') &&
      !p.startsWith('/partner/availability') &&
      !p.startsWith('/partner/messages'),
  },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { profile } = useProfile()
  const unread        = useUnreadCount()
  const unreadReviews = useUnreadReviewCount()
  const combined      = unread + unreadReviews

  const isOwner = profile?.role === 'shop_owner'
  const navItems = isOwner ? OWNER_NAV : RIDER_NAV

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#e8e8e4]"
      style={{ paddingBottom: 'min(env(safe-area-inset-bottom, 0px), 15px)' }}
    >
      <div className="flex items-center">
        {navItems.map(({ href, label, icon: Icon, isActive: customActive }) => {
          const active = customActive
            ? customActive(pathname)
            : pathname === href || (href !== '/' && pathname.startsWith(href))
          const isMessages = href === '/messages' || href === '/partner/messages'
          const isShopTab  = href === '/partner/dashboard'
          const badge = isMessages
            ? (unread > 0 ? unread : 0)
            : isShopTab
            ? (combined > 0 ? combined : 0)
            : 0
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-[3px] pt-2 pb-1.5"
            >
              <div className={cn(
                'relative flex items-center justify-center w-8 h-[22px] rounded-full transition-colors duration-150',
                active ? 'bg-[#FF6B35]/12' : 'bg-transparent',
              )}>
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] transition-colors duration-150',
                    active ? 'text-[#FF6B35]' : 'text-[#9c9c98]',
                  )}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-[#ef4444] rounded-full border border-white flex items-center justify-center px-[3px]">
                    <span className="text-[9px] font-bold text-white leading-none tabular-nums">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none transition-colors duration-150',
                active ? 'text-[#FF6B35]' : 'text-[#9c9c98]',
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

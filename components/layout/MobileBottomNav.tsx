'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Bookmark, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',        label: 'Home',    icon: Home     },
  { href: '/explore', label: 'Explore', icon: Map      },
  { href: '/saved',   label: 'Saved',   icon: Bookmark },
  { href: '/profile', label: 'Profile', icon: User     },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#e8e8e4] pb-safe">
      <div className="flex items-center">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[44px] transition-colors"
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-5 rounded-full transition-colors duration-200',
                active ? 'bg-[#FF6B35]/12' : 'bg-transparent'
              )}>
                <Icon
                  className={cn(
                    'w-[17px] h-[17px] transition-colors',
                    active ? 'text-[#FF6B35]' : 'text-[#9c9c98]'
                  )}
                  strokeWidth={active ? 2.5 : 1.5}
                />
              </div>
              <span
                className={cn(
                  'text-[9px] font-medium leading-none transition-colors',
                  active ? 'text-[#FF6B35]' : 'text-[#9c9c98]'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

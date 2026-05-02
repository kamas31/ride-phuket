import Link from 'next/link'
import { User, Shield, BookOpen, Star, Bell, Globe, LogOut, ChevronRight, Check, Camera, Phone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { MOCK_BOOKINGS } from '@/data/scooters'
import { formatPrice, getInitials } from '@/lib/utils'

export const metadata = {
  title: 'My Profile',
}

const DEMO_USER = {
  name: 'Alex Johnson',
  email: 'alex@example.com',
  phone: '+66 80 123 4567',
  nationality: 'Australian',
  verified: true,
  memberSince: 'March 2025',
  totalRentals: 7,
  totalSpent: 14200,
  rating: 5.0,
}

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Personal Information', href: '#' },
      { icon: Shield, label: 'Verification & Documents', href: '#', badge: 'Verified' },
      { icon: Bell, label: 'Notifications', href: '#' },
      { icon: Globe, label: 'Language & Currency', href: '#', value: 'EN · THB' },
    ],
  },
  {
    title: 'Rentals',
    items: [
      { icon: BookOpen, label: 'My Bookings', href: '/bookings' },
      { icon: Star, label: 'My Reviews', href: '#', value: '3 reviews' },
    ],
  },
]

export default function ProfilePage() {
  const totalRentalDays = MOCK_BOOKINGS.reduce((acc, b) => acc + b.totalDays, 0)

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-xl mx-auto px-4 py-6 pt-24">
          {/* Avatar & name */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-[#ff9a5c] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(DEMO_USER.name)}
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-[#e8e8e4] rounded-full flex items-center justify-center shadow-sm hover:bg-[#f8f8f6] transition-colors">
                <Camera className="w-3.5 h-3.5 text-[#5c5c58]" />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-bold text-[#0f0f0e]">{DEMO_USER.name}</h1>
                {DEMO_USER.verified && (
                  <div className="w-5 h-5 bg-[#22c55e] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className="text-sm text-[#9c9c98]">Member since {DEMO_USER.memberSince}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
                <span className="text-sm font-medium text-[#0f0f0e]">{DEMO_USER.rating}</span>
                <span className="text-sm text-[#9c9c98]">rider rating</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-[#5c5c58]">
              <Mail className="w-4 h-4 text-[#9c9c98]" />
              {DEMO_USER.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#5c5c58]">
              <Phone className="w-4 h-4 text-[#9c9c98]" />
              {DEMO_USER.phone}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Rentals', value: DEMO_USER.totalRentals },
            { label: 'Days Riding', value: totalRentalDays },
            { label: 'Total Spent', value: formatPrice(DEMO_USER.totalSpent) },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-[16px] p-4 border border-[#e8e8e4] text-center">
              <p className="text-[20px] font-bold text-[#0f0f0e] leading-none">{stat.value}</p>
              <p className="text-xs text-[#9c9c98] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Verification card */}
        {DEMO_USER.verified ? (
          <div className="bg-[#f0fdf4] border border-[#22c55e]/20 rounded-[20px] p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#22c55e]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-[#22c55e]" />
            </div>
            <div>
              <p className="font-bold text-[#16a34a]">Verified Rider</p>
              <p className="text-xs text-[#16a34a]/70 mt-0.5">ID and license verified. You can rent any scooter.</p>
            </div>
          </div>
        ) : (
          <div className="bg-[#fffbeb] border border-[#f59e0b]/20 rounded-[20px] p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Shield className="w-6 h-6 text-[#f59e0b]" />
              <div>
                <p className="font-bold text-[#92400e]">Get Verified</p>
                <p className="text-xs text-[#92400e]/70">Upload ID to unlock more scooters</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-[#f59e0b] text-white text-sm font-semibold rounded-full hover:bg-[#d97706] transition-colors">
              Verify
            </button>
          </div>
        )}

        {/* Menu sections */}
        {MENU_SECTIONS.map(section => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-3 px-1">
              {section.title}
            </h2>
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] overflow-hidden divide-y divide-[#e8e8e4]">
              {section.items.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#f8f8f6] transition-colors"
                >
                  <div className="w-9 h-9 bg-[#f0f0ec] rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-[#5c5c58]" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-[#0f0f0e]">{item.label}</span>
                  {'badge' in item && item.badge && (
                    <Badge variant="success">{item.badge}</Badge>
                  )}
                  {'value' in item && item.value && (
                    <span className="text-sm text-[#9c9c98]">{item.value}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#9c9c98]" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] border border-[#e8e8e4] text-sm font-medium text-[#9c9c98] hover:bg-white hover:text-[#5c5c58] transition-colors">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        <p className="text-center text-xs text-[#9c9c98] pb-4">
          Ride Phuket v1.0 · Built with ♥ for riders
        </p>
      </div>
    </div>
  )
}

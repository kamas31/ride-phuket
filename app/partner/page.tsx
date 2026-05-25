import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Bike, TrendingUp, Star, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile, getShopForOwner } from '@/app/actions/profile'
import CreateShopForm from './CreateShopForm'

export const metadata = { title: 'Partner — Ride Phuket' }

const PERKS = [
  { icon: Bike,        text: 'Your scooters live on the map instantly' },
  { icon: TrendingUp,  text: 'Reach international tourists before they land' },
  { icon: Star,        text: 'Collect verified reviews automatically' },
  { icon: MapPin,      text: 'WhatsApp leads delivered directly to you' },
]

export default async function PartnerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Authenticated shop_owner WITH shop → go to dashboard ──
  if (user) {
    const profile = await getServerProfile()
    if (profile?.role === 'shop_owner') {
      const shop = await getShopForOwner()
      if (shop) redirect('/partner/dashboard')
      // Shop owner without shop → show creation form
      return <CreateShopForm userName={profile.name} />
    }
  }

  // ── Not authenticated or rider → landing page ──────────────
  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Hero */}
      <div className="relative bg-[#0f0f0e] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/15 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 pt-28 pb-16 text-center">
          <span className="inline-block px-3 py-1.5 bg-[#FF6B35]/15 text-[#FF6B35] text-xs font-bold uppercase tracking-widest rounded-full mb-6">
            Shop Owners
          </span>
          <h1 className="text-[38px] md:text-[56px] font-bold text-white leading-tight tracking-tight mb-5">
            Your scooters.
            <br />
            <span className="text-[#FF6B35]">Live in minutes.</span>
          </h1>
          <p className="text-white/60 text-[17px] leading-relaxed max-w-lg mx-auto mb-10">
            Create your shop, add your fleet, start getting contacted directly on WhatsApp.
            No waiting, no approval process.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup?role=shop_owner"
              className="flex items-center gap-2 px-8 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all shadow-[0_4px_24px_rgba(255,107,53,0.4)] text-[15px]"
            >
              Create Your Shop
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-white/8 text-white/80 font-semibold rounded-full border border-white/15 hover:bg-white/12 transition-all text-[15px]"
            >
              Sign in to existing shop
            </Link>
          </div>
        </div>

        {/* Perks strip */}
        <div className="border-t border-white/8">
          <div className="max-w-4xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {PERKS.map(p => (
              <div key={p.text} className="flex items-start gap-3">
                <p.icon className="w-4 h-4 text-[#FF6B35] flex-shrink-0 mt-0.5" />
                <span className="text-xs text-white/55 leading-relaxed">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-4">Pricing</p>
        <div className="bg-white rounded-[24px] border border-[#e8e8e4] p-8 shadow-sm">
          <div className="text-[52px] font-bold text-[#0f0f0e] leading-none mb-1">Free</div>
          <div className="text-[#9c9c98] text-sm mb-6">No platform fees, ever</div>
          <div className="space-y-2.5 text-sm text-left mb-8">
            {['Setup: Free', 'Monthly fee: Free', 'Listing: Free', 'WhatsApp leads: Free'].map(item => (
              <div key={item} className="flex items-center gap-2 text-[#5c5c58]">
                <div className="w-4 h-4 rounded-full bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-[#22c55e]" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {item}
              </div>
            ))}
          </div>
          <Link
            href="/auth/signup?role=shop_owner"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-sm"
          >
            Get Started — Free
          </Link>
        </div>
      </div>
    </div>
  )
}

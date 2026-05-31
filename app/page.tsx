import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, ChevronRight, MapPin, Check, MessageCircle, Unlock, Zap, SlidersHorizontal, Store } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { LOCATIONS } from '@/constants'
import { getScooters } from '@/lib/supabase/queries'
import { computeLiveAreas } from '@/lib/live-areas'
import { formatPrice } from '@/lib/utils'
import { HeroSearch } from '@/components/home/HeroSearch'

const BENEFITS = [
  {
    icon: SlidersHorizontal,
    title: 'Find the Exact Scooter You Want',
    description: 'Filter by model, engine size, color, and features. Stop messaging 20 shops to find the one you actually want.',
    color: 'bg-[#f0fdf4] text-[#16a34a]',
  },
  {
    icon: MessageCircle,
    title: 'Contact Shops Instantly',
    description: 'Reach any shop through in-app chat or WhatsApp — both are first-class. No booking forms, no platform fees.',
    color: 'bg-[#fff4f0] text-[#FF6B35]',
  },
  {
    icon: Zap,
    title: 'Compare Options Easily',
    description: 'See prices, photos, and specs side by side across multiple shops. Make a confident decision before you commit.',
    color: 'bg-[#eff6ff] text-[#2563eb]',
  },
  {
    icon: Store,
    title: 'More Choice Across Phuket',
    description: 'Multiple verified shops in one place. Browse the whole island instead of walking into whichever shop you pass first.',
    color: 'bg-[#fdf4ff] text-[#9333ea]',
  },
]

export default async function HomePage() {
  const allScooters = await getScooters({ available: true })
  const featuredScooters = allScooters.slice(0, 6)

  // Derive live zones from already-fetched scooters — zero extra DB call.
  const liveAreas  = computeLiveAreas(allScooters)
  const liveAreaIds = new Set(liveAreas.map(a => a.slug))
  const popularLocations = LOCATIONS.slice(1, 7).filter(loc => liveAreaIds.has(loc.id))

  return (
    <div className="flex flex-col">
      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex flex-col overflow-hidden">

        {/* ── Layer 1: Absolute black base (prevents any flash) */}
        <div className="absolute inset-0 bg-[#07090d]" />

        {/* ── Layer 2: Cinematic background — Phuket tropical beach, golden hour */}
        <div
          className="absolute inset-0 hero-ken-burns"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 45%',
            opacity: 0.62,
          }}
        />

        {/* ── Layer 3: Radial vignette — darkens edges, keeps center luminous */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 20%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        {/* ── Layer 4: Top shadow — nav readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-transparent pointer-events-none" />

        {/* ── Layer 5: Bottom shadow — CTA + stats readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* ── Layer 6: Warm golden tint at bottom — ties into brand orange */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(180,70,10,0.22) 0%, rgba(255,107,53,0.08) 25%, transparent 55%)',
          }}
        />

        {/* ── Layer 7: Cool blue-teal atmosphere at top — depth + sky feel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(5,18,38,0.35) 0%, transparent 40%)',
          }}
        />

        {/* ── CONTENT ── */}
        <div className="relative flex-1 flex flex-col justify-center items-center text-center px-5 pt-28 pb-16">

          {/* Hero search — entrance 0.15s */}
          <div
            className="w-full flex flex-col items-center"
            style={{ opacity: 0, animation: 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards 0.15s' }}
          >
            <HeroSearch />
          </div>

          {/* Headline — entrance 0.3s */}
          <div
            style={{ opacity: 0, animation: 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards 0.3s' }}
          >
            <h1
              className="text-white font-bold text-[46px] md:text-[70px] lg:text-[80px] leading-[1.04] tracking-[-0.04em] max-w-[16ch] mb-6 hero-text-shadow"
            >
              Explore Phuket{' '}
              <span className="text-gradient">your way.</span>
            </h1>
          </div>

          {/* Subheadline — entrance 0.48s */}
          <div
            style={{ opacity: 0, animation: 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards 0.48s' }}
          >
            <p className="text-white/72 text-[17px] md:text-[20px] max-w-[30ch] leading-[1.65] mb-10 font-light hero-sub-shadow">
              Premium scooters from local shops across Phuket.
              <br className="hidden sm:block" />
              Contact directly on WhatsApp. No platform fees.
            </p>
          </div>

          {/* CTAs — entrance 0.62s */}
          <div
            style={{ opacity: 0, animation: 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards 0.62s' }}
          >
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/explore"
                className="flex items-center gap-2.5 px-9 py-[15px] bg-[#FF6B35] text-white text-[15px] font-bold rounded-full
                           shadow-[0_4px_28px_rgba(255,107,53,0.5),0_2px_8px_rgba(0,0,0,0.3)]
                           hover:bg-[#e85d29] hover:shadow-[0_8px_40px_rgba(255,107,53,0.6)]
                           hover:scale-[1.03] active:scale-[0.97]
                           transition-all duration-200"
              >
                Explore Scooters
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/explore"
                className="flex items-center gap-2 px-7 py-[15px] rounded-full text-[15px] font-semibold text-white/90
                           bg-white/[0.1] backdrop-blur-md border border-white/[0.22]
                           hover:bg-white/[0.18] hover:border-white/30
                           transition-all duration-200"
              >
                View All Locations
              </Link>
            </div>
          </div>

        </div>

        {/* Scroll indicator — entrance 1.1s */}
        <div
          className="relative flex flex-col items-center pb-8 gap-2"
          style={{ opacity: 0, animation: 'fade-in 0.8s ease forwards 1.1s' }}
        >
          <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-white/35">Scroll</span>
          <div className="w-[22px] h-9 rounded-full border border-white/20 flex justify-center pt-1.5">
            <div className="w-0.5 h-2.5 bg-white/40 rounded-full animate-bounce" />
          </div>
        </div>

      </section>

      {/* ── TRUST STRIP ── */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {([
            { icon: ShieldCheck,    text: 'Real local listings',             color: 'text-[#22c55e]' },
            { icon: Check,          text: 'Real photos & honest pricing',     color: 'text-[#5c5c58]' },
            { icon: Unlock,         text: 'No platform fees ever',            color: 'text-[#9c9c98]' },
            { icon: MessageCircle,  text: 'Direct WhatsApp contact',          color: 'text-[#22c55e]' },
            { icon: MapPin,         text: 'Shops across all Phuket areas',    color: 'text-[#FF6B35]' },
          ] as const).map(item => (
            <div key={item.text} className="flex items-center gap-2 flex-shrink-0 text-sm text-[#5c5c58]">
              <item.icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} strokeWidth={1.5} />
              <span className="font-medium whitespace-nowrap">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW KOH RIDE WORKS ── */}
      <section className="bg-[#f8f8f6] border-b border-[#e8e8e4] py-12 md:py-28">
        <div className="max-w-5xl mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-8 md:mb-16">
            <p className="text-[11px] font-semibold text-[#FF6B35] uppercase tracking-[0.22em] mb-4">How it works</p>
            <h2 className="text-[32px] md:text-[48px] font-bold text-[#0f0f0e] leading-[1.1] tracking-[-0.03em] mb-5">
              How Koh Ride Works
            </h2>
            <p className="text-[#9c9c98] text-[16px] max-w-[34ch] mx-auto leading-relaxed">
              Rent a scooter in Phuket the simple way.
              Direct, fast, and hassle-free.
            </p>
          </div>

          {/* Steps — inline cards with SVG illustrations + arrow connectors */}
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0 mb-10">

            {/* ── Card 1: Find ── */}
            <div className="md:flex-1 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-[#FF6B35] rounded-full flex items-center justify-center" style={{ boxShadow: '0 0 0 3px #f8f8f6, 0 4px 14px rgba(255,107,53,0.40)' }}>
                <span className="text-white font-bold text-sm leading-none">01</span>
              </div>
              <div className="bg-white rounded-[28px] overflow-hidden border border-[#f0f0ec] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07),0_1px_4px_-1px_rgba(0,0,0,0.04)] h-full flex flex-col">
                <div className="relative h-36 md:h-52 bg-white flex-shrink-0">
                  <Image src="/illustrations/find.png" alt="Find scooters" fill className="object-contain" sizes="(max-width: 768px) 90vw, 30vw" />
                </div>
                <div className="px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-7 text-center">
                  <h3 className="text-[17px] md:text-[19px] font-bold text-[#0f0f0e] mb-1.5 md:mb-2 tracking-tight">Find</h3>
                  <p className="text-[#9c9c98] text-[13.5px] leading-relaxed max-w-[22ch] mx-auto">Browse scooters across Phuket and filter by area, model, and price.</p>
                </div>
              </div>
            </div>

            {/* Arrow 1 → 2 */}
            <div className="hidden md:flex items-center justify-center w-14 flex-shrink-0">
              <div className="w-9 h-9 bg-[#FF6B35] rounded-full flex items-center justify-center" style={{ boxShadow: '0 4px 14px rgba(255,107,53,0.30)' }}>
                <ChevronRight className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* ── Card 2: Contact ── */}
            <div className="md:flex-1 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-[#FF6B35] rounded-full flex items-center justify-center" style={{ boxShadow: '0 0 0 3px #f8f8f6, 0 4px 14px rgba(255,107,53,0.40)' }}>
                <span className="text-white font-bold text-sm leading-none">02</span>
              </div>
              <div className="bg-white rounded-[28px] overflow-hidden border border-[#f0f0ec] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07),0_1px_4px_-1px_rgba(0,0,0,0.04)] h-full flex flex-col">
                <div className="relative h-36 md:h-52 bg-white flex-shrink-0">
                  <Image src="/illustrations/contact.png" alt="Contact the shop" fill className="object-contain" sizes="(max-width: 768px) 90vw, 30vw" />
                </div>
                <div className="px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-7 text-center">
                  <h3 className="text-[17px] md:text-[19px] font-bold text-[#0f0f0e] mb-1.5 md:mb-2 tracking-tight">Contact</h3>
                  <p className="text-[#9c9c98] text-[13.5px] leading-relaxed max-w-[22ch] mx-auto">Message rental shops directly on WhatsApp. No forms, no platform — just real conversation.</p>
                </div>
              </div>
            </div>

            {/* Arrow 2 → 3 */}
            <div className="hidden md:flex items-center justify-center w-14 flex-shrink-0">
              <div className="w-9 h-9 bg-[#FF6B35] rounded-full flex items-center justify-center" style={{ boxShadow: '0 4px 14px rgba(255,107,53,0.30)' }}>
                <ChevronRight className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* ── Card 3: Ride ── */}
            <div className="md:flex-1 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-[#FF6B35] rounded-full flex items-center justify-center" style={{ boxShadow: '0 0 0 3px #f8f8f6, 0 4px 14px rgba(255,107,53,0.40)' }}>
                <span className="text-white font-bold text-sm leading-none">03</span>
              </div>
              <div className="bg-white rounded-[28px] overflow-hidden border border-[#f0f0ec] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07),0_1px_4px_-1px_rgba(0,0,0,0.04)] h-full flex flex-col">
                <div className="relative h-36 md:h-52 bg-white flex-shrink-0">
                  <Image src="/illustrations/ride.png" alt="Ride your scooter" fill className="object-contain" sizes="(max-width: 768px) 90vw, 30vw" />
                </div>
                <div className="px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-7 text-center">
                  <h3 className="text-[17px] md:text-[19px] font-bold text-[#0f0f0e] mb-1.5 md:mb-2 tracking-tight">Ride</h3>
                  <p className="text-[#9c9c98] text-[13.5px] leading-relaxed max-w-[22ch] mx-auto">Collect your scooter from the shop and explore Phuket on your own terms.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Reassurance bar */}
          <div
            className="flex flex-wrap md:flex-nowrap items-center justify-center gap-y-3
                       bg-white rounded-[18px] border border-[#e8e8e4] px-6 md:px-8 py-4"
            style={{ boxShadow: '0 1px 6px -1px rgba(0,0,0,0.05)' }}
          >
            {([
              { icon: Check,         text: 'No platform fees',        color: 'text-[#22c55e]' },
              { icon: Check,         text: 'No online payment',       color: 'text-[#22c55e]' },
              { icon: MessageCircle, text: 'Direct local contact',    color: 'text-[#22c55e]' },
              { icon: MapPin,        text: 'Shops across all Phuket', color: 'text-[#FF6B35]' },
            ] as const).map((item, i) => (
              <div key={item.text} className="flex items-center">
                {i > 0 && <div className="hidden md:block w-px h-4 bg-[#e8e8e4] mx-6 flex-shrink-0" />}
                <div className="flex items-center gap-1.5 text-[13px] text-[#5c5c58] font-medium whitespace-nowrap">
                  <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${item.color}`} strokeWidth={2} />
                  {item.text}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── LOCATION STRIP ── */}
      <section className="bg-[#f8f8f6] border-b border-[#e8e8e4]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <span className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest whitespace-nowrap mr-2 flex-shrink-0">
              Popular areas
            </span>
            {popularLocations.map(loc => (
              <Link
                key={loc.id}
                href={`/explore?location=${loc.id}`}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border border-[#e8e8e4] hover:border-[#FF6B35] hover:text-[#FF6B35] text-sm text-[#5c5c58] font-medium transition-colors whitespace-nowrap"
              >
                <MapPin className="w-3 h-3" />
                {loc.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED SCOOTERS ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">Top Picks</p>
            <h2 className="text-[26px] md:text-[34px] font-bold text-[#0f0f0e] leading-tight tracking-tight">
              Recently added
            </h2>
          </div>
          <Link
            href="/explore"
            className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#FF6B35] hover:gap-2 transition-all"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {featuredScooters.map(scooter => (
            <ScooterCard key={scooter.id} scooter={scooter} />
          ))}
        </div>

        <div className="mt-7 text-center md:hidden">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#e8e8e4] rounded-full text-sm font-semibold text-[#0f0f0e] hover:bg-[#f8f8f6] transition-colors"
          >
            View all scooters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── EXPLORE BY AREA ── */}
      <section className="bg-[#f8f8f6] py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">By Location</p>
              <h2 className="text-[26px] md:text-[34px] font-bold text-[#0f0f0e] leading-tight tracking-tight">
                Where are you staying?
              </h2>
            </div>
          </div>
          {liveAreas.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {liveAreas.map(area => (
                <Link
                  key={area.slug}
                  href={`/phuket/${area.slug}`}
                  className="group flex flex-col p-4 bg-white rounded-[16px] border border-[#e8e8e4] hover:border-[#FF6B35] hover:bg-[#fff4f0] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <MapPin className="w-4 h-4 text-[#FF6B35] mt-0.5" />
                    <ChevronRight className="w-4 h-4 text-[#c8c8c4] group-hover:text-[#FF6B35] transition-colors" />
                  </div>
                  <p className="font-bold text-[14px] text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors leading-tight">{area.label}</p>
                  <p className="text-[12px] text-[#9c9c98] mt-1">From {formatPrice(area.priceFrom)}/day</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-[20px] border border-[#e8e8e4]">
              <p className="text-[#5c5c58] font-medium mb-1">New scooter listings are being added.</p>
              <p className="text-[#9c9c98] text-sm">Check back soon — or browse all available scooters now.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">Why Koh Ride</p>
          <h2 className="text-[26px] md:text-[34px] font-bold text-[#0f0f0e] leading-tight tracking-tight">
            Street rentals are a gamble.{' '}
            <span className="text-[#FF6B35]">We&apos;re not.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map(benefit => (
            <div
              key={benefit.title}
              className="flex gap-4 p-5 bg-white rounded-[20px] border border-[#e8e8e4] hover:border-[#d0d0cc] hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] transition-all"
            >
              <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 ${benefit.color}`}>
                <benefit.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-[#0f0f0e] mb-1">{benefit.title}</h3>
                <p className="text-[#5c5c58] text-sm leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="relative overflow-hidden bg-[#0f0f0e] rounded-[28px] px-8 md:px-16 py-12 text-center">
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#FF6B35]/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 right-0 w-60 h-40 bg-[#FF6B35]/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-4">Ready to ride?</p>
            <h2 className="text-[28px] md:text-[40px] font-bold text-white leading-tight tracking-tight mb-3">
              Your perfect scooter<br />is waiting.
            </h2>
            <p className="text-white/50 text-base mb-8 max-w-sm mx-auto leading-relaxed">
              Local scooters, direct WhatsApp contact — the honest way to explore Phuket.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/explore"
                className="flex items-center gap-2 px-8 py-4 bg-[#FF6B35] text-white text-base font-bold rounded-full hover:bg-[#e85d29] transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                Find My Scooter
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/explore"
                className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
              >
                No fees · Contact shops directly
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

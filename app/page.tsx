import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, ChevronRight, MapPin, Check, MessageCircle, Unlock, Zap, SlidersHorizontal, Store } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { LOCATIONS } from '@/constants'
import { getScooters } from '@/lib/supabase/queries'
import { computeLiveAreas } from '@/lib/live-areas'
import { cn, formatPrice } from '@/lib/utils'
import { HeroSearch } from '@/components/home/HeroSearch'

const BENEFITS = [
  {
    icon: SlidersHorizontal,
    title: 'Find the Exact Scooter You Want',
    description: 'Search by model, engine size, color, accessories, and features. Stop messaging 20 shops just to find the right scooter.',
    color: 'bg-[#f0fdf4] text-[#16a34a]',
  },
  {
    icon: Store,
    title: 'More Choice Across Phuket',
    description: 'Browse scooters from multiple rental shops in one place instead of searching shop by shop.',
    color: 'bg-[#fdf4ff] text-[#9333ea]',
  },
  {
    icon: Zap,
    title: 'Compare Options Easily',
    description: 'View prices, photos, and specifications side-by-side before deciding which scooter is right for you.',
    color: 'bg-[#eff6ff] text-[#2563eb]',
  },
  {
    icon: MessageCircle,
    title: 'Contact Shops Instantly',
    description: 'Send a message directly through Koh Ride or continue on WhatsApp — whatever works best for you.',
    color: 'bg-[#fff4f0] text-[#FF6B35]',
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
      <section className="relative h-[100svh] min-h-[600px] flex flex-col overflow-hidden">

        {/* Mobile background image */}
        <Image
          src="/heromobile.png"
          alt="Explore Phuket on a scooter"
          fill
          priority
          className="object-cover object-center md:hidden"
          sizes="100vw"
        />
        {/* Desktop background image */}
        <Image
          src="/hero.png"
          alt="Explore Phuket on a scooter"
          fill
          priority
          className="object-cover object-center hidden md:block"
          sizes="100vw"
        />

        {/* Mobile overlay — dark over text area, fades out over scooter at bottom */}
        <div
          className="absolute inset-0 pointer-events-none md:hidden"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.18) 80%, rgba(0,0,0,0.02) 100%)' }}
        />
        {/* Desktop overlay */}
        <div
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.35), rgba(0,0,0,0.55))' }}
        />

        {/* ── MOBILE LAYOUT ── */}
        <div className="md:hidden relative flex-1 flex flex-col px-5 pt-24 pb-6">

          {/* Search bar */}
          <div
            style={{ opacity: 0, animation: 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards 0.05s' }}
          >
            <HeroSearch />
          </div>

          {/* Headline + description + CTAs */}
          <div
            className="flex flex-col items-center text-center"
            style={{ opacity: 0, animation: 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards 0.18s' }}
          >
            <h1 className="font-extrabold leading-[0.95] tracking-[-0.03em] text-[44px] mb-3">
              <span className="text-white block">Explore Phuket</span>
              <span className="block" style={{ color: '#FF6B35' }}>your way.</span>
            </h1>

            <p className="text-white/75 text-[14px] leading-[1.55] mb-5" style={{ maxWidth: '280px' }}>
              Premium scooters from trusted local shops across Phuket. Chat instantly in-app or continue on WhatsApp when needed.
            </p>

            <div className="flex flex-col gap-2.5 w-full mb-4">
              <Link
                href="/explore"
                className="flex items-center justify-center gap-2 w-full py-[13px] bg-[#FF6B35] text-white text-[14px] font-bold rounded-full
                           shadow-[0_4px_20px_rgba(255,107,53,0.5)]
                           active:scale-[0.97] transition-all duration-200"
              >
                Explore Scooters
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/explore"
                className="flex items-center justify-center w-full py-[13px] rounded-full text-[14px] font-semibold text-white
                           bg-white/[0.12] backdrop-blur-md border border-white/[0.28]
                           active:scale-[0.97] transition-all duration-200"
              >
                View All Locations
              </Link>
            </div>
          </div>

          {/* Trust pills — sit below CTAs, scooter visible in remaining space below */}
          <div
            className="flex gap-2 overflow-x-auto snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', opacity: 0, animation: 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards 0.35s' }}
          >
            {([
              { icon: ShieldCheck,   label: 'Verified Shops' },
              { icon: MapPin,        label: 'All Areas' },
              { icon: MessageCircle, label: 'Instant Contact' },
            ] as const).map(item => (
              <div
                key={item.label}
                className="flex-shrink-0 snap-start flex items-center gap-2 px-3 py-2 bg-white/[0.12] backdrop-blur-sm border border-white/[0.2] rounded-full"
              >
                <div className="w-5 h-5 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-2.5 h-2.5 text-white" strokeWidth={2} />
                </div>
                <span className="text-white text-[11px] font-semibold whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </div>

        </div>

        {/* ── DESKTOP LAYOUT ── */}
        <div className="hidden md:flex relative flex-1 flex-col justify-center pl-[100px] pr-8">
          <div
            className="max-w-[600px]"
            style={{ opacity: 0, animation: 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards 0.1s' }}
          >
            <h1 className="font-extrabold leading-[0.95] tracking-[-0.03em] text-[88px] lg:text-[96px] mb-6">
              <span className="text-white block">Explore Phuket</span>
              <span className="block" style={{ color: '#FF6B35' }}>your way.</span>
            </h1>

            <p className="text-white/75 text-[19px] leading-[1.6] mb-10 max-w-[520px]">
              Premium scooters from local shops across Phuket.<br />
              Chat instantly in-app or continue on WhatsApp when needed.
            </p>

            <div className="flex flex-row gap-3">
              <Link
                href="/explore"
                className="flex items-center justify-center gap-2.5 px-9 py-[15px] bg-[#FF6B35] text-white text-[15px] font-bold rounded-full
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
                className="flex items-center justify-center gap-2 px-7 py-[15px] rounded-full text-[15px] font-semibold text-white
                           bg-white/[0.1] backdrop-blur-md border border-white/[0.25]
                           hover:bg-white/[0.18] hover:border-white/40
                           transition-all duration-200"
              >
                View All Locations
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop feature bar */}
        <div
          className="hidden md:flex relative pb-8 justify-center"
          style={{ opacity: 0, animation: 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards 0.5s' }}
        >
          <div className="w-[70%] bg-white/[0.1] backdrop-blur-md border border-white/[0.18] rounded-[20px] overflow-hidden">
            <div className="grid grid-cols-3">
              {([
                { icon: ShieldCheck,   title: 'Verified Local Shops', desc: 'Real listings from trusted rental partners across Phuket' },
                { icon: MapPin,        title: 'All Areas Covered',    desc: 'Patong, Kamala, Kata, Karon, Rawai and more' },
                { icon: MessageCircle, title: 'Instant Contact',      desc: 'Chat in-app or jump to WhatsApp with one tap' },
              ] as const).map((item, i) => (
                <div
                  key={item.title}
                  className={cn('flex items-start gap-4 p-5', i < 2 && 'border-r border-white/[0.18]')}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-[14px] leading-tight mb-1">{item.title}</p>
                    <p className="text-white/70 text-[12px] leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
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
                  {area.engineRange && (
                    <p className="text-[11px] text-[#c8c8c4] mt-0.5 leading-none">
                      {area.engineRange.min === area.engineRange.max
                        ? `${area.engineRange.min}cc`
                        : `${area.engineRange.min}cc–${area.engineRange.max}cc`}
                    </p>
                  )}
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

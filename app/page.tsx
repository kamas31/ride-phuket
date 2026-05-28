import Link from 'next/link'
import { ArrowRight, Shield, ShieldCheck, ChevronRight, MapPin, Check, MessageCircle, Unlock, Zap, Eye } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { LOCATIONS } from '@/constants'
import { getScooters, getStats } from '@/lib/supabase/queries'
import { computeLiveAreas } from '@/lib/live-areas'
import { formatPrice } from '@/lib/utils'
import { HeroSearch } from '@/components/home/HeroSearch'

const BENEFITS = [
  {
    icon: Shield,
    title: 'Local Scooter Listings',
    description: 'Scooters from local shops and independent owners across Phuket. Real photos, honest pricing.',
    color: 'bg-[#f0fdf4] text-[#16a34a]',
  },
  {
    icon: MessageCircle,
    title: 'Contact Directly',
    description: 'Message any shop on WhatsApp in seconds. No booking forms, no platform fees — just direct contact.',
    color: 'bg-[#fff4f0] text-[#FF6B35]',
  },
  {
    icon: Eye,
    title: 'Transparent Listings',
    description: 'Real photos, honest specs, and current pricing — no surprises when you show up to the shop.',
    color: 'bg-[#eff6ff] text-[#2563eb]',
  },
  {
    icon: Zap,
    title: 'Fast Responses',
    description: 'Most shops reply within minutes. Ask about availability, rates, and your rental — all on WhatsApp.',
    color: 'bg-[#fdf4ff] text-[#9333ea]',
  },
]

export default async function HomePage() {
  const [allScooters, { shopCount, scooterCount }] = await Promise.all([
    getScooters({ available: true }),
    getStats(),
  ])
  const featuredScooters = allScooters.slice(0, 4)

  // Derive live zones from already-fetched scooters — zero extra DB call.
  const liveAreas  = computeLiveAreas(allScooters)
  const liveAreaIds = new Set(liveAreas.map(a => a.slug))
  const popularLocations = LOCATIONS.slice(1, 7).filter(loc => liveAreaIds.has(loc.id))

  // Real trust stats — numbers only shown when > 0, otherwise qualitative
  const trustItems = [
    scooterCount > 0
      ? { value: String(scooterCount), label: 'Scooters listed' }
      : { value: '✓', label: 'Curated fleet' },
    shopCount > 0
      ? { value: String(shopCount), label: 'Local listings' }
      : { value: '✓', label: 'Local listings' },
    { value: '24/7', label: 'WhatsApp contact' },
    { value: '0', label: 'Platform fees' },
  ]

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
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-12">
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

          {/* Stats glass card — entrance 0.8s */}
          <div
            className="w-full max-w-xl"
            style={{ opacity: 0, animation: 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards 0.8s' }}
          >
            <div className="px-5 py-4 bg-white/[0.07] backdrop-blur-md border border-white/[0.1] rounded-2xl">
              <div className="flex flex-wrap items-center justify-center gap-y-3">
                {trustItems.map((item, i) => (
                  <div key={item.label} className="flex items-center">
                    {i > 0 && (
                      <div className="w-px h-7 bg-white/[0.15] mx-5 flex-shrink-0" />
                    )}
                    <div className="text-center">
                      <div className="text-white font-bold text-[22px] md:text-[24px] leading-none tracking-tight">
                        {item.value}
                      </div>
                      <div className="text-white/48 text-[11px] mt-1.5 font-medium tracking-wide uppercase">
                        {item.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
      <section className="bg-[#f8f8f6] border-b border-[#e8e8e4] py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-14 md:mb-16">
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
          <div className="flex flex-col md:flex-row items-stretch gap-8 md:gap-0 mb-10">

            {/* ── Card 1: Find ── */}
            <div className="md:flex-1 relative bg-white rounded-[28px] pt-14 pb-8 px-6 text-center border border-[#f0f0ec] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-[#FF6B35] rounded-full flex items-center justify-center" style={{ boxShadow: '0 0 0 3px #f8f8f6, 0 4px 14px rgba(255,107,53,0.40)' }}>
                <span className="text-white font-bold text-sm leading-none">01</span>
              </div>
              <div className="flex items-center justify-center h-36 mb-5">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 50% 55%, #ffd5c2 0%, #ffe8dc 42%, #fff4f0 65%, transparent 82%)' }} />
                  <svg viewBox="0 0 100 100" fill="none" className="relative w-full h-full">
                    {/* Palm — top right */}
                    <line x1="83" y1="95" x2="82" y2="64" stroke="#FFBFA6" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M82 66 C74 56 72 44 78 35 C79 47 80 57 82 66Z" fill="#FFBFA6" opacity="0.7"/>
                    <path d="M82 66 C90 56 92 44 87 35 C85 47 84 57 82 66Z" fill="#FFBFA6" opacity="0.7"/>
                    {/* Magnifying glass */}
                    <circle cx="44" cy="44" r="27" fill="#fff4f0" stroke="#FF6B35" strokeWidth="3.5"/>
                    <path d="M63 63 L78 78" stroke="#FF6B35" strokeWidth="5" strokeLinecap="round"/>
                    {/* Location pin inside lens */}
                    <circle cx="44" cy="36" r="6" fill="#FF6B35"/>
                    <path d="M44 42 L44 54" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round"/>
                    {/* Tiny scooter inside lens */}
                    <circle cx="33" cy="56" r="4" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.45"/>
                    <circle cx="45" cy="56" r="4" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.45"/>
                    <path d="M33 52 L35 46 L42 46 L45 52" fill="none" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-[19px] font-bold text-[#0f0f0e] mb-2.5 tracking-tight">Find</h3>
              <p className="text-[#9c9c98] text-[13.5px] leading-relaxed max-w-[22ch] mx-auto">Browse scooters across Phuket and filter by area, model, and price.</p>
            </div>

            {/* Arrow 1 → 2 */}
            <div className="hidden md:flex items-center justify-center w-14 flex-shrink-0">
              <div className="w-9 h-9 bg-[#FF6B35] rounded-full flex items-center justify-center" style={{ boxShadow: '0 4px 14px rgba(255,107,53,0.30)' }}>
                <ChevronRight className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* ── Card 2: Contact ── */}
            <div className="md:flex-1 relative bg-white rounded-[28px] pt-14 pb-8 px-6 text-center border border-[#f0f0ec] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-[#FF6B35] rounded-full flex items-center justify-center" style={{ boxShadow: '0 0 0 3px #f8f8f6, 0 4px 14px rgba(255,107,53,0.40)' }}>
                <span className="text-white font-bold text-sm leading-none">02</span>
              </div>
              <div className="flex items-center justify-center h-36 mb-5">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 50% 55%, #ffd5c2 0%, #ffe8dc 42%, #fff4f0 65%, transparent 82%)' }} />
                  <svg viewBox="0 0 100 100" fill="none" className="relative w-full h-full">
                    {/* Palm leaves — left */}
                    <path d="M14 50 C10 38 18 26 26 32 C22 40 18 46 14 50Z" fill="#FFBFA6" opacity="0.6"/>
                    <path d="M12 64 C8 52 16 40 24 46 C20 54 16 60 12 64Z" fill="#FFBFA6" opacity="0.45"/>
                    {/* Palm leaves — right */}
                    <path d="M86 50 C90 38 82 26 74 32 C78 40 82 46 86 50Z" fill="#FFBFA6" opacity="0.6"/>
                    {/* Phone frame */}
                    <rect x="31" y="13" width="38" height="68" rx="7" fill="#fff4f0" stroke="#FF6B35" strokeWidth="3"/>
                    {/* Screen */}
                    <rect x="36" y="22" width="28" height="48" rx="4" fill="#ffe8dc"/>
                    {/* Home indicator */}
                    <line x1="46" y1="76" x2="54" y2="76" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                    {/* Chat bubble (orange) */}
                    <rect x="38" y="27" width="22" height="13" rx="4" fill="#FF6B35" opacity="0.9"/>
                    <path d="M40 40 L38 46 L44 40Z" fill="#FF6B35" opacity="0.9"/>
                    {/* 3 dots in bubble */}
                    <circle cx="44" cy="33.5" r="1.5" fill="white"/>
                    <circle cx="50" cy="33.5" r="1.5" fill="white"/>
                    <circle cx="56" cy="33.5" r="1.5" fill="white"/>
                    {/* Second chat bubble (light) */}
                    <rect x="40" y="50" width="20" height="10" rx="4" fill="#FF6B35" opacity="0.3"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-[19px] font-bold text-[#0f0f0e] mb-2.5 tracking-tight">Contact</h3>
              <p className="text-[#9c9c98] text-[13.5px] leading-relaxed max-w-[22ch] mx-auto">Message rental shops directly on WhatsApp. No forms, no platform — just real conversation.</p>
            </div>

            {/* Arrow 2 → 3 */}
            <div className="hidden md:flex items-center justify-center w-14 flex-shrink-0">
              <div className="w-9 h-9 bg-[#FF6B35] rounded-full flex items-center justify-center" style={{ boxShadow: '0 4px 14px rgba(255,107,53,0.30)' }}>
                <ChevronRight className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* ── Card 3: Ride ── */}
            <div className="md:flex-1 relative bg-white rounded-[28px] pt-14 pb-8 px-6 text-center border border-[#f0f0ec] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-[#FF6B35] rounded-full flex items-center justify-center" style={{ boxShadow: '0 0 0 3px #f8f8f6, 0 4px 14px rgba(255,107,53,0.40)' }}>
                <span className="text-white font-bold text-sm leading-none">03</span>
              </div>
              <div className="flex items-center justify-center h-36 mb-5">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 50% 55%, #ffd5c2 0%, #ffe8dc 42%, #fff4f0 65%, transparent 82%)' }} />
                  <svg viewBox="0 0 100 100" fill="none" className="relative w-full h-full">
                    {/* Clouds — top left */}
                    <ellipse cx="22" cy="26" rx="10" ry="7" fill="#FFBFA6" opacity="0.3"/>
                    <ellipse cx="32" cy="23" rx="9" ry="7" fill="#FFBFA6" opacity="0.3"/>
                    <ellipse cx="14" cy="25" rx="7" ry="6" fill="#FFBFA6" opacity="0.25"/>
                    {/* Palm tree — right */}
                    <line x1="84" y1="92" x2="82" y2="55" stroke="#FFBFA6" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M82 57 C72 46 70 34 76 24 C78 36 80 47 82 57Z" fill="#FFBFA6" opacity="0.65"/>
                    <path d="M82 57 C92 46 94 34 88 24 C86 36 84 47 82 57Z" fill="#FFBFA6" opacity="0.65"/>
                    <path d="M82 57 C76 63 68 60 66 52 C72 56 77 57 82 57Z" fill="#FFBFA6" opacity="0.45"/>
                    {/* Ground */}
                    <line x1="8" y1="88" x2="92" y2="88" stroke="#FFBFA6" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
                    {/* Rear wheel */}
                    <circle cx="33" cy="78" r="11" fill="#fff4f0" stroke="#FF6B35" strokeWidth="3"/>
                    <circle cx="33" cy="78" r="4" fill="#FF6B35" opacity="0.3"/>
                    {/* Front wheel */}
                    <circle cx="67" cy="78" r="11" fill="#fff4f0" stroke="#FF6B35" strokeWidth="3"/>
                    <circle cx="67" cy="78" r="4" fill="#FF6B35" opacity="0.3"/>
                    {/* Scooter body */}
                    <path d="M33 67 L40 52 L55 50 L67 67" fill="#fff4f0" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    {/* Seat */}
                    <path d="M42 52 L56 46 L62 52Z" fill="#FF6B35" opacity="0.55"/>
                    {/* Front fork */}
                    <line x1="67" y1="67" x2="72" y2="56" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round"/>
                    {/* Handlebar */}
                    <path d="M72 56 L79 50" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="80" cy="49" r="2.5" fill="#FF6B35" opacity="0.6"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-[19px] font-bold text-[#0f0f0e] mb-2.5 tracking-tight">Ride</h3>
              <p className="text-[#9c9c98] text-[13.5px] leading-relaxed max-w-[22ch] mx-auto">Collect your scooter from the shop and explore Phuket on your own terms.</p>
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
              Most popular scooters
            </h2>
          </div>
          <Link
            href="/explore"
            className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#FF6B35] hover:gap-2 transition-all"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

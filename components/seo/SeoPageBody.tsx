import Link from 'next/link'
import { ArrowRight, ChevronRight, Check } from 'lucide-react'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { getScooters } from '@/lib/supabase/queries'
import { getAreaForLocation } from '@/constants/areas'
import { getModel, MODELS } from '@/constants/models'
import type { AreaMeta } from '@/constants/areas'
import type { SeoPageMeta } from '@/constants/seo-pages'
import { buildSeoPageProductJsonLd, buildSeoPageBreadcrumbJsonLd, buildSeoPageFaqJsonLd } from '@/lib/schema/seo-page'
import { getRelatedContent } from '@/lib/related-content'
import { formatPrice } from '@/lib/utils'
import type { Scooter } from '@/types'

// No matching getScooters() filter shape exists for arbitrary price/category/
// monthly-rate combinations — fetch all available scooters once, filter in
// memory. Same proven pattern as write-brand-page.ts's getBrandScooters. Zero
// changes to the shared query layer.
function matchesFilter(s: Scooter, filter: { maxPricePerDay?: number; category?: string; requiresMonthlyRate?: boolean }): boolean {
  if (filter.maxPricePerDay != null && s.pricePerDay > filter.maxPricePerDay) return false
  if (filter.category && s.category !== filter.category) return false
  if (filter.requiresMonthlyRate && s.pricePerMonth == null) return false
  return true
}

function priceRangeOf(scooters: Scooter[]): { min: number; max: number } | null {
  if (scooters.length === 0) return null
  const prices = scooters.map(s => s.pricePerDay)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

// Real internal linking: models whose live inventory actually satisfies this
// page's filter (never a static/fabricated list) — only rendered when a
// filter exists at all.
function matchingModels(scooters: Scooter[]) {
  const modelQueries = new Set(scooters.map(s => s.model.toLowerCase()))
  return MODELS.filter(m => modelQueries.has(m.modelQuery.toLowerCase())).slice(0, 6)
}

export async function SeoPageBody({ page }: { page: SeoPageMeta }) {
  const scooters = page.filter
    ? (await getScooters({ available: true })).filter(s => matchesFilter(s, page.filter!))
    : []
  const priceRange = priceRangeOf(scooters)

  const shops = Array.from(
    new Map(scooters.filter(s => s.shop?.slug).map(s => [s.shop!.id, s.shop!])).values()
  )
  const areasWithInventory = Array.from(
    new Map(
      scooters
        .map(s => getAreaForLocation(s.location))
        .filter((a): a is AreaMeta => Boolean(a))
        .map(a => [a.slug, a])
    ).values()
  ).slice(0, 6)
  const relatedModels = page.filter ? matchingModels(scooters) : []
  const related = getRelatedContent({ excludeSlug: page.slug, topicText: `${page.targetQuery} ${page.title}`, relevantModelSlugs: relatedModels.map(m => m.slug) })

  const productJsonLd = buildSeoPageProductJsonLd(page, scooters.length, priceRange)
  const breadcrumbJsonLd = buildSeoPageBreadcrumbJsonLd(page)
  const faqJsonLd = buildSeoPageFaqJsonLd(page)

  return (
    <>
      {productJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <div className="min-h-screen bg-white">
        <section className="relative bg-[#0f0f0e] text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/20 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 pt-28 pb-14">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white">{page.h1}</span>
            </nav>
            <div className="max-w-2xl">
              <h1 className="text-[36px] md:text-[52px] font-bold leading-tight tracking-tight mb-5">{page.h1}</h1>
              <p className="text-white/65 text-[17px] leading-relaxed mb-8 max-w-xl">{page.longDescription}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/explore" className="flex items-center gap-2 px-7 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all shadow-lg text-[15px]">
                  See Available Scooters
                  <ArrowRight className="w-5 h-5" />
                </Link>
                {priceRange && (
                  <div className="flex items-center gap-2 px-5 py-4 text-white/60 text-sm">
                    From <strong className="text-white">{formatPrice(priceRange.min)}/day</strong> · Contact directly
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {page.contentSections.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-12">
            <div className="space-y-10 max-w-3xl">
              {page.contentSections.map(s => (
                <div key={s.heading}>
                  <h2 className="text-[22px] font-bold text-[#0f0f0e] tracking-tight mb-3">{s.heading}</h2>
                  <p className="text-[#5c5c58] text-[15px] leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-[24px] font-bold text-[#0f0f0e] tracking-tight mb-6">Why riders choose this option</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {page.highlights.map(reason => (
              <div key={reason} className="flex items-center gap-3 text-sm text-[#5c5c58]">
                <div className="w-5 h-5 bg-[#f0fdf4] rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[#22c55e]" />
                </div>
                {reason}
              </div>
            ))}
          </div>
        </section>

        {page.filter && (
          <section className="max-w-5xl mx-auto px-4 pb-12">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">Available Now</p>
                <h2 className="text-[24px] font-bold text-[#0f0f0e] tracking-tight">Scooters matching this search</h2>
              </div>
              {scooters.length > 0 && (
                <Link href="/explore" className="flex items-center gap-1 text-sm font-semibold text-[#FF6B35] hover:gap-2 transition-all">
                  All scooters <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            {scooters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {scooters.map(scooter => <ScooterCard key={scooter.id} scooter={scooter} />)}
              </div>
            ) : (
              <div className="text-center py-14 bg-[#f8f8f6] rounded-[20px] border border-[#e8e8e4]">
                <p className="text-[#5c5c58] font-medium mb-1">No matching listings right now</p>
                <p className="text-[#9c9c98] text-sm mb-5">Browse all available scooters across Phuket.</p>
                <Link href="/explore" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white text-sm font-semibold rounded-full hover:bg-[#e85d29] transition-colors">
                  Explore all scooters
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </section>
        )}

        {relatedModels.length > 0 && (
          <section className="bg-[#f8f8f6] py-12">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-6">Models matching this search</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {relatedModels.map(model => (
                  <Link key={model.slug} href={`/models/${model.slug}`} className="flex items-center justify-between px-4 py-3.5 bg-white rounded-[14px] border border-[#e8e8e4] hover:border-[#FF6B35] hover:bg-[#fff4f0] group transition-all">
                    <p className="font-semibold text-sm text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors">{model.name}</p>
                    <ChevronRight className="w-4 h-4 text-[#9c9c98] group-hover:text-[#FF6B35] transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {shops.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-5">Shops with matching scooters</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {shops.map(shop => (
                <Link key={shop.id} href={`/shop/${shop.slug}`} className="flex items-center gap-3 p-3.5 bg-white border border-[#e8e8e4] rounded-[14px] hover:border-[#FF6B35] hover:bg-[#fff4f0] group transition-all">
                  {shop.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.logo} alt={shop.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#a09890]">{shop.name.charAt(0)}</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors truncate">{shop.name}</p>
                    {shop.reviewCount > 0 && <p className="text-[11px] text-[#9c9c98]">★ {shop.rating.toFixed(1)} ({shop.reviewCount})</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {areasWithInventory.length > 0 && (
          <section className="bg-[#f8f8f6] py-12">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-6">Where to find these scooters</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {areasWithInventory.map(area => (
                  <Link key={area.slug} href={`/phuket/${area.slug}`} className="flex items-center justify-between px-4 py-3.5 bg-white rounded-[14px] border border-[#e8e8e4] hover:border-[#FF6B35] hover:bg-[#fff4f0] group transition-all">
                    <p className="font-semibold text-sm text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors">{area.label}</p>
                    <ChevronRight className="w-4 h-4 text-[#9c9c98] group-hover:text-[#FF6B35] transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {(related.guides.length > 0 || related.landings.length > 0 || related.compares.length > 0) && (
          <section className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-6">Related guides &amp; comparisons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...related.guides, ...related.landings, ...related.compares].map(link => (
                <Link key={link.href} href={link.href} className="flex items-center justify-between px-4 py-3.5 bg-[#f8f8f6] rounded-[14px] border border-[#e8e8e4] hover:border-[#FF6B35] hover:bg-[#fff4f0] group transition-all">
                  <p className="font-semibold text-sm text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors">{link.label}</p>
                  <ChevronRight className="w-4 h-4 text-[#9c9c98] group-hover:text-[#FF6B35] transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="max-w-5xl mx-auto px-4 pb-16">
          <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-6">Frequently asked questions</h2>
          <div className="space-y-4">
            {page.faq.map(item => (
              <div key={item.question} className="p-5 bg-[#f8f8f6] rounded-[16px] border border-[#e8e8e4]">
                <p className="font-semibold text-sm text-[#0f0f0e] mb-1.5">{item.question}</p>
                <p className="text-sm text-[#5c5c58] leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="bg-[#0f0f0e] rounded-[24px] px-8 py-10 text-center relative">
            <div className="absolute left-1/2 -translate-x-1/2 w-60 h-20 bg-[#FF6B35]/20 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-[24px] md:text-[32px] font-bold text-white mb-3 tracking-tight">Ready to find your scooter?</h2>
            <p className="text-white/50 text-sm mb-7 max-w-sm mx-auto">Find your scooter, contact the shop directly, and explore on your terms.</p>
            <Link href="/explore" className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all text-base">
              Find Your Scooter
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}

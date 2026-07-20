import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import type { Metadata } from 'next'
import { getComparePage, COMPARE_PAGES } from '@/constants/compare-pages'
import { getModel } from '@/constants/models'
import { buildComparePageBreadcrumbJsonLd, buildComparePageFaqJsonLd } from '@/lib/schema/compare-page'
import { getRelatedContent } from '@/lib/related-content'
import { SITE_NAME, SITE_URL } from '@/constants'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return COMPARE_PAGES.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = getComparePage(slug)
  if (!page) return {}
  return {
    title: { absolute: `${page.title} | ${SITE_NAME}` },
    description: page.description,
    alternates: { canonical: `${SITE_URL}/compare/${slug}` },
    openGraph: { title: page.title, description: page.description, url: `${SITE_URL}/compare/${slug}`, type: 'website', siteName: SITE_NAME },
    twitter: { card: 'summary_large_image' as const, title: page.title, description: page.description },
  }
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params
  const page = getComparePage(slug)
  if (!page) notFound()

  // Real model data, read live — never duplicated into constants/compare-pages.ts,
  // so this can never drift out of sync with the real /models/[slug] pages.
  const modelA = getModel(page.modelSlugA)
  const modelB = getModel(page.modelSlugB)
  if (!modelA || !modelB) notFound()

  const breadcrumbJsonLd = buildComparePageBreadcrumbJsonLd(page)
  const faqJsonLd = buildComparePageFaqJsonLd(page)
  const related = getRelatedContent({ excludeSlug: page.slug, topicText: page.targetQuery, relevantModelSlugs: [page.modelSlugA, page.modelSlugB], clusterId: page.cluster })

  return (
    <>
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
              <span className="text-white">{page.title}</span>
            </nav>
            <div className="max-w-2xl">
              <h1 className="text-[36px] md:text-[52px] font-bold leading-tight tracking-tight mb-5">{page.title}</h1>
              <p className="text-white/65 text-[17px] leading-relaxed max-w-xl">{page.intro}</p>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {[modelA, modelB].map(model => (
              <Link key={model.slug} href={`/models/${model.slug}`} className="block p-6 bg-[#f8f8f6] rounded-[18px] border border-[#e8e8e4] hover:border-[#FF6B35] transition-all">
                <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-2">{model.name}</h2>
                <p className="text-[#5c5c58] text-sm leading-relaxed mb-3">{model.description}</p>
                <span className="text-sm font-semibold text-[#FF6B35]">See {model.label} rentals →</span>
              </Link>
            ))}
          </div>

          <h2 className="text-[22px] font-bold text-[#0f0f0e] tracking-tight mb-5">{modelA.label} vs {modelB.label}</h2>
          <div className="overflow-hidden rounded-[18px] border border-[#e8e8e4]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f8f6]">
                  <th className="text-left px-5 py-3 font-semibold text-[#5c5c58]"> </th>
                  <th className="text-left px-5 py-3 font-semibold text-[#0f0f0e]">{modelA.label}</th>
                  <th className="text-left px-5 py-3 font-semibold text-[#0f0f0e]">{modelB.label}</th>
                </tr>
              </thead>
              <tbody>
                {page.comparisonPoints.map(pt => (
                  <tr key={pt.label} className="border-t border-[#e8e8e4]">
                    <td className="px-5 py-3 font-medium text-[#5c5c58]">{pt.label}</td>
                    <td className="px-5 py-3 text-[#0f0f0e]">{pt.a}</td>
                    <td className="px-5 py-3 text-[#0f0f0e]">{pt.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-[#f8f8f6] py-12">
          <div className="max-w-5xl mx-auto px-4 max-w-3xl">
            <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-3">Which one should you choose?</h2>
            <p className="text-[#5c5c58] text-[15px] leading-relaxed">{page.verdict}</p>
          </div>
        </section>

        {(related.guides.length > 0 || related.landings.length > 0 || related.compares.length > 0) && (
          <section className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-6">Related guides &amp; comparisons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...related.guides, ...related.landings, ...related.compares].map(link => (
                <Link key={link.href} href={link.href} className="flex items-center justify-between px-4 py-3.5 bg-[#f8f8f6] rounded-[14px] border border-[#e8e8e4] hover:border-[#FF6B35] hover:bg-[#fff4f0] group transition-all">
                  <p className="font-semibold text-sm text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors">{link.label}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="max-w-5xl mx-auto px-4 py-16">
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

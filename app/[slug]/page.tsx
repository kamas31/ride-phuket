import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SEO_PAGES, getSeoPage } from '@/constants/seo-pages'
import { SeoPageBody } from '@/components/seo/SeoPageBody'
import { SITE_NAME, SITE_URL } from '@/constants'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Root-level dynamic route — Next.js always resolves a matching STATIC route
// (app/explore, app/faq, ...) before falling back to this catch-all, so a
// landing slug can never shadow an existing page; write-seo-page.ts also
// refuses to create one with a reserved name, belt and braces.
export async function generateStaticParams() {
  return SEO_PAGES.filter(p => p.urlStrategy === 'landing').map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = getSeoPage(slug, 'landing')
  if (!page) return {}
  return {
    title: { absolute: `${page.title} | ${SITE_NAME}` },
    description: page.description,
    alternates: { canonical: `${SITE_URL}/${slug}` },
    openGraph: { title: page.title, description: page.description, url: `${SITE_URL}/${slug}`, type: 'website', siteName: SITE_NAME },
    twitter: { card: 'summary_large_image' as const, title: page.title, description: page.description },
  }
}

export default async function LandingPage({ params }: PageProps) {
  const { slug } = await params
  const page = getSeoPage(slug, 'landing')
  if (!page) notFound()
  return <SeoPageBody page={page} />
}

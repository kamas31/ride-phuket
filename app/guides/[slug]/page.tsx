import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SEO_PAGES, getSeoPage } from '@/constants/seo-pages'
import { SeoPageBody } from '@/components/seo/SeoPageBody'
import { SITE_NAME, SITE_URL } from '@/constants'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return SEO_PAGES.filter(p => p.urlStrategy === 'guide').map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = getSeoPage(slug, 'guide')
  if (!page) return {}
  return {
    title: { absolute: `${page.title} | ${SITE_NAME}` },
    description: page.description,
    alternates: { canonical: `${SITE_URL}/guides/${slug}` },
    openGraph: { title: page.title, description: page.description, url: `${SITE_URL}/guides/${slug}`, type: 'website', siteName: SITE_NAME },
    twitter: { card: 'summary_large_image' as const, title: page.title, description: page.description },
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  const page = getSeoPage(slug, 'guide')
  if (!page) notFound()
  return <SeoPageBody page={page} />
}

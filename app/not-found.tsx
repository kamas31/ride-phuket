import Link from 'next/link'
import { Search } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page not found',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-[#f8f8f6] border border-[#e8e8e4] rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7 text-[#c8c8c4]" strokeWidth={1.5} />
        </div>
        <h1 className="text-[20px] font-bold text-[#0f0f0e] mb-2">Page not found</h1>
        <p className="text-[#9c9c98] text-sm mb-6 leading-relaxed">
          This page doesn&apos;t exist. Browse available scooters instead.
        </p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white text-sm font-semibold rounded-full hover:bg-[#e85d29] transition-colors"
        >
          Explore scooters
        </Link>
      </div>
    </div>
  )
}

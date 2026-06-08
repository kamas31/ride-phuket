'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton({ label = 'Back', className }: { label?: string; className?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className={className ?? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#FF6B35] text-white hover:bg-[#e85d29] transition-all active:scale-95'}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton({ label = 'Back', className }: { label?: string; className?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className={className ?? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#f5f4f2] text-[#5c5c58] hover:bg-[#ececea] hover:text-[#0f0f0e] transition-all active:scale-95'}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  )
}

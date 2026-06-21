'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteScooter } from '@/app/actions/scooter-delete'
import { formatPrice, cn } from '@/lib/utils'
import type { AdminShopDetail } from '@/app/actions/admin-shops'

interface Props {
  shop: AdminShopDetail
}

const STATUS_STYLES: Record<string, string> = {
  unclaimed: 'bg-[#fff4f0] text-[#FF6B35]',
  invited:   'bg-[#fff8e1] text-[#b8860b]',
  claimed:   'bg-[#eefbf1] text-[#1d9e5d]',
}

export default function AdminShopDetailClient({ shop }: Props) {
  const [scooters, setScooters] = useState(shop.scooters)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleDelete(scooterId: string) {
    if (!confirm('Delete this scooter? This cannot be undone.')) return
    setDeletingId(scooterId)
    startTransition(async () => {
      const result = await deleteScooter(scooterId)
      if (result.success) {
        setScooters(prev => prev.filter(s => s.id !== scooterId))
      } else {
        alert(result.error ?? 'Failed to delete scooter.')
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-8">
      <Link href="/admin/shops" className="inline-flex items-center gap-1.5 text-sm text-[#9c9c98] hover:text-[#0f0f0e] mb-4">
        <ArrowLeft className="w-4 h-4" /> All shops
      </Link>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-[#0f0f0e]">{shop.name}</h1>
        <div className="flex items-center gap-2">
          {!shop.active && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-[#f5f5f0] text-[#9c9c98]">
              Inactive
            </span>
          )}
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full',
            STATUS_STYLES[shop.ownerStatus] ?? STATUS_STYLES.claimed,
          )}>
            {shop.ownerStatus}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#9c9c98]">{shop.location}</p>
        <Link
          href={`/admin/shops/${shop.id}/edit`}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#FF6B35] hover:underline"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit shop
        </Link>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-[#0f0f0e]">Scooters ({scooters.length})</h2>
        <Link
          href={`/admin/shops/${shop.id}/scooters/new`}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FF6B35] text-white text-[13px] font-bold rounded-full hover:bg-[#e55a25] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add scooter
        </Link>
      </div>

      <div className="bg-white border border-[#f0f0ec] rounded-[16px] divide-y divide-[#f0f0ec]">
        {scooters.length === 0 && (
          <p className="text-sm text-[#9c9c98] p-5">No scooters yet.</p>
        )}
        {scooters.map(scooter => (
          <div key={scooter.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-[#0f0f0e]">{scooter.name}</p>
              <p className="text-[12px] text-[#9c9c98]">
                {formatPrice(scooter.pricePerDay)}/day · {scooter.available ? 'Available' : 'Unavailable'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/shops/${shop.id}/scooters/${scooter.id}/edit`}
                className="text-[13px] font-semibold text-[#FF6B35] hover:underline"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(scooter.id)}
                disabled={isPending && deletingId === scooter.id}
                className="text-[#9c9c98] hover:text-red-600 transition-colors disabled:opacity-50"
                aria-label="Delete scooter"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

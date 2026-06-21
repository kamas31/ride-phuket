'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Plus, Trash2, Link2, Check } from 'lucide-react'
import { deleteScooter } from '@/app/actions/scooter-delete'
import { adminClaimShopByEmail } from '@/app/actions/admin-shops'
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

function ClaimShopSection({ shop }: { shop: AdminShopDetail }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [claimed, setClaimed] = useState(shop.ownerStatus === 'claimed')
  const [ownerEmail, setOwnerEmail] = useState(shop.ownerEmail)

  if (claimed) {
    return (
      <div className="bg-[#eefbf1] border border-[#d4f3df] rounded-[16px] p-4 mb-6 flex items-center gap-2.5">
        <Check className="w-4 h-4 text-[#1d9e5d] flex-shrink-0" />
        <p className="text-[13px] text-[#0f0f0e]">
          Claimed{ownerEmail ? <> by <span className="font-semibold">{ownerEmail}</span></> : null}
        </p>
      </div>
    )
  }

  function handleClaim() {
    setError(null)
    const trimmed = email.trim()
    if (!trimmed) { setError('Enter the owner’s account email.'); return }

    startTransition(async () => {
      const result = await adminClaimShopByEmail(shop.id, trimmed)
      if (!result.success) {
        setError(result.error ?? 'Failed to claim shop.')
        return
      }
      setClaimed(true)
      setOwnerEmail(trimmed)
      router.refresh()
    })
  }

  return (
    <div className="bg-white border border-[#f0f0ec] rounded-[16px] p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Link2 className="w-4 h-4 text-[#FF6B35]" />
        <h2 className="text-sm font-bold text-[#0f0f0e]">Link owner account</h2>
      </div>
      <p className="text-[12px] text-[#9c9c98] mb-3">
        Link this shop to an existing Koh Ride account by email. The account must already exist — this does not send an invite.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="owner@example.com"
          disabled={isPending}
          className="flex-1 bg-[#f5f5f0] text-[#0f0f0e] text-sm rounded-[10px] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#FF6B35] placeholder:text-[#9c9c98] disabled:opacity-60"
        />
        <button
          onClick={handleClaim}
          disabled={isPending}
          className="px-4 py-2.5 bg-[#0f0f0e] text-white text-sm font-bold rounded-[10px] hover:bg-[#2a2a28] transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {isPending ? 'Linking…' : 'Claim shop for this owner'}
        </button>
      </div>
      {error && <p className="text-[13px] text-red-600 mt-2">{error}</p>}
    </div>
  )
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

      <ClaimShopSection shop={shop} />

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

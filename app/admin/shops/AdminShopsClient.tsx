'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { adminCreateShop } from '@/app/actions/admin-create-shop'
import type { AdminShopListItem } from '@/app/actions/admin-shops'
import { PHUKET_ZONES } from '@/lib/zones'
import { cn } from '@/lib/utils'

interface Props {
  shops: AdminShopListItem[]
}

const inputCls = 'w-full bg-[#f5f5f0] text-[#0f0f0e] text-sm rounded-[10px] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#FF6B35] placeholder:text-[#9c9c98]'

const STATUS_STYLES: Record<string, string> = {
  unclaimed: 'bg-[#fff4f0] text-[#FF6B35]',
  invited:   'bg-[#fff8e1] text-[#b8860b]',
  claimed:   'bg-[#eefbf1] text-[#1d9e5d]',
}

export default function AdminShopsClient({ shops }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [list, setList] = useState(shops)

  const [form, setForm] = useState({
    name: '', location: PHUKET_ZONES[0].name, phone: '', whatsapp: '', address: '', description: '',
  })

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const result = await adminCreateShop(form)
      if (!result.success) {
        setError(result.error ?? 'Failed to create shop.')
        return
      }
      setShowForm(false)
      setForm({ name: '', location: '', phone: '', whatsapp: '', address: '', description: '' })
      setList(prev => [
        {
          id: result.shopId!,
          name: form.name,
          slug: '',
          location: form.location,
          ownerStatus: 'unclaimed',
          hasOwner: false,
          active: true,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#0f0f0e]">Admin · Shops</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-[#FF6B35] text-white text-sm font-bold rounded-full hover:bg-[#e55a25] transition-colors"
        >
          {showForm ? 'Cancel' : 'Create unclaimed shop'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[#f0f0ec] rounded-[16px] p-5 mb-6 space-y-3">
          <p className="text-[13px] text-[#9c9c98] mb-2">
            Creates a shop with no owner account. Use this to onboard operators before they sign up.
          </p>
          <input className={inputCls} placeholder="Shop name *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <select className={inputCls} value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
            {PHUKET_ZONES.map(zone => (
              <option key={zone.key} value={zone.name}>{zone.name}</option>
            ))}
          </select>
          <input className={inputCls} placeholder="Phone (optional — riders can message in-app)" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <input className={inputCls} placeholder="WhatsApp number" value={form.whatsapp}
            onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
          <input className={inputCls} placeholder="Address" value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <textarea className={cn(inputCls, 'resize-none')} rows={2} placeholder="Description" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

          {error && <p className="text-[13px] text-red-600">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={isPending}
            className="w-full py-2.5 bg-[#0f0f0e] text-white text-sm font-bold rounded-full disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create shop'}
          </button>
        </div>
      )}

      <div className="bg-white border border-[#f0f0ec] rounded-[16px] divide-y divide-[#f0f0ec]">
        {list.length === 0 && (
          <p className="text-sm text-[#9c9c98] p-5">No shops yet.</p>
        )}
        {list.map(shop => (
          <Link
            key={shop.id}
            href={`/admin/shops/${shop.id}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-[#fafaf8] transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-[#0f0f0e]">{shop.name}</p>
              <p className="text-[12px] text-[#9c9c98]">{shop.location}</p>
            </div>
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
          </Link>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useTransition } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useAdminPanelVisible } from '@/hooks/useAdminPanelVisible'
import { listDevShops, setDevShopScootersAvailable, type DevShopRow } from '@/app/actions/admin-dev-shops'

export function AdminDevShopsPanel() {
  const { isAdmin, loading } = useProfile()
  const [adminPanelVisible] = useAdminPanelVisible()
  const [shops, setShops] = useState<DevShopRow[]>([])
  const [fetched, setFetched] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isAdmin || !adminPanelVisible || fetched) return
    listDevShops().then(data => { setShops(data); setFetched(true) })
  }, [isAdmin, adminPanelVisible, fetched])

  // Re-fetch when panel becomes visible again
  useEffect(() => {
    if (isAdmin && adminPanelVisible) setFetched(false)
  }, [adminPanelVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !isAdmin || !adminPanelVisible) return null

  const handleToggle = (shopId: string, current: boolean) => {
    if (isPending) return
    setShops(prev => prev.map(s => s.id === shopId ? { ...s, scootersOn: !current } : s))
    startTransition(async () => {
      const result = await setDevShopScootersAvailable(shopId, !current)
      if (result.error) {
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, scootersOn: current } : s))
      }
    })
  }

  return (
    <div className="fixed bottom-24 left-4 z-[9000] bg-[#0f0f0e] text-white rounded-[16px] p-3.5 shadow-2xl w-[190px] select-none">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9c9c98] mb-2.5">
        Admin · Dev Shops
      </p>

      {!fetched ? (
        <p className="text-[9px] text-[#9c9c98]">Loading…</p>
      ) : shops.length === 0 ? (
        <p className="text-[9px] text-[#9c9c98]">No dev shops</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {shops.map(shop => (
            <div key={shop.id} className="flex items-center gap-2">
              {/* Toggle */}
              <button
                onClick={() => handleToggle(shop.id, shop.scootersOn)}
                disabled={isPending}
                aria-label={shop.scootersOn ? 'Disable' : 'Enable'}
                className={[
                  'shrink-0 rounded-full transition-colors duration-200',
                  isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  shop.scootersOn ? 'bg-[#FF6B35]' : 'bg-white/20',
                ].join(' ')}
                style={{ width: 30, height: 18, position: 'relative' }}
              >
                <span
                  className="absolute top-[2px] bg-white rounded-full transition-all duration-200"
                  style={{ width: 14, height: 14, left: shop.scootersOn ? 14 : 2 }}
                />
              </button>

              {/* Label */}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-white truncate leading-tight">{shop.name}</p>
                <p className="text-[9px] text-[#9c9c98] truncate leading-tight capitalize">{shop.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

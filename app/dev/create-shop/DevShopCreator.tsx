'use client'

import { useState } from 'react'
import { createDevShop, type DevShopResult } from './actions'

const LOCATIONS = [
  'Patong', 'Kata', 'Karon', 'Rawai', 'Bang Tao', 'Phuket Town',
  'Kamala', 'Surin', 'Chalong', 'Nai Harn', 'Cherng Talay',
]

interface Created extends DevShopResult {
  id: number
}

export default function DevShopCreator() {
  const [ownerName, setOwnerName] = useState('')
  const [shopName,  setShopName]  = useState('')
  const [location,  setLocation]  = useState('')
  const [phone,     setPhone]     = useState('+66 ')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [created,   setCreated]   = useState<Created[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await createDevShop({ ownerName, shopName, location, phone })
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Unknown error.')
      return
    }
    setCreated(prev => [{ ...result, id: Date.now() }, ...prev])
    // Reset form for next shop
    setOwnerName('')
    setShopName('')
    setLocation('')
    setPhone('+66 ')
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] p-6">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-[#0f0f0e] text-white rounded-[20px] px-6 py-5">
          <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-1">Dev Tool</p>
          <h1 className="text-xl font-bold">Screenshot Mode — Shop Creator</h1>
          <p className="text-white/50 text-sm mt-1">
            Creates a real shop owner account with no email verification required.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[20px] border border-[#e8e8e4] p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1">
                Owner Name *
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="e.g. Somchai K."
                required
                className="w-full px-3 py-2.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[10px] text-sm focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="e.g. Patong Riders"
                required
                className="w-full px-3 py-2.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[10px] text-sm focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1">
              Phone / WhatsApp *
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[10px] text-sm focus:outline-none focus:border-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">
              Location *
            </label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(loc => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    location === loc
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                      : 'bg-[#f8f8f6] text-[#5c5c58] border-[#e8e8e4] hover:border-[#FF6B35]'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-[10px] px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !ownerName || !shopName || !location || !phone}
            className="w-full py-3 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-40 text-sm flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Creating…' : 'Create Shop Account'}
          </button>
        </form>

        {/* Created shops */}
        {created.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest px-1">
              Created — {created.length} shop{created.length !== 1 ? 's' : ''}
            </p>
            {created.map(shop => (
              <div
                key={shop.id}
                className="bg-white rounded-[16px] border border-[#e8e8e4] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#0f0f0e]">{shop.shopName}</p>
                  <span className="text-[10px] font-semibold text-[#22c55e] bg-[#f0fdf4] border border-[#22c55e]/20 px-2 py-0.5 rounded-full">
                    ✓ Ready
                  </span>
                </div>

                <div className="bg-[#f8f8f6] rounded-[10px] p-3 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#9c9c98] font-sans">Email</span>
                    <span className="text-[#0f0f0e] select-all">{shop.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#9c9c98] font-sans">Password</span>
                    <span className="text-[#0f0f0e] select-all">{shop.password}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#9c9c98] font-sans">Slug</span>
                    <span className="text-[#0f0f0e] select-all">{shop.shopSlug}</span>
                  </div>
                </div>

                <a
                  href="/partner/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 bg-[#0f0f0e] text-white text-xs font-bold rounded-full text-center hover:bg-[#2a2a28] transition-colors"
                >
                  Open Partner Dashboard →
                </a>
                <p className="text-[10px] text-[#9c9c98] text-center">
                  Sign in with the credentials above in an incognito window
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

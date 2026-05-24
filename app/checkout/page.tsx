'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, MessageCircle, Phone, MapPin, Check } from 'lucide-react'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { SCOOTERS } from '@/data/scooters'
import { getScooterAction } from '@/app/actions/scooter'
import { formatPrice, getScooterCover } from '@/lib/utils'
import type { Scooter } from '@/types'

function ContactShopContent() {
  const params = useSearchParams()
  const scooterId = params.get('scooterId') || SCOOTERS[0].id

  const [scooter, setScooter] = useState<Scooter>(
    SCOOTERS.find(s => s.id === scooterId) ?? SCOOTERS[0]
  )

  useEffect(() => {
    getScooterAction(scooterId).then(live => { if (live) setScooter(live) })
  }, [scooterId])

  const shop = scooter.shop

  const waUrl = shop?.whatsapp
    ? `https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hi! I found your ${scooter.name} on Ride Phuket and I'd like to arrange a rental.`
      )}`
    : null

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/scooter/${scooter.id}`} className="text-[#5c5c58] hover:text-[#0f0f0e] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-[17px] text-[#0f0f0e]">Contact the Shop</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-4">
        {/* Scooter summary */}
        <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 flex gap-4 items-center">
          <ScooterImage
            src={getScooterCover(scooter)}
            alt={scooter.name}
            className="w-20 h-16 rounded-[12px] flex-shrink-0"
            sizes="80px"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#0f0f0e] truncate text-[15px]">{scooter.name}</h3>
            <div className="flex items-center gap-1 text-xs text-[#9c9c98] mt-0.5">
              <MapPin className="w-3 h-3" />
              {scooter.location}
            </div>
            <p className="text-sm font-bold text-[#FF6B35] mt-1.5">
              {formatPrice(scooter.pricePerDay)}
              <span className="text-xs font-normal text-[#9c9c98]">/day</span>
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5">
          <p className="text-[13px] font-bold text-[#0f0f0e] mb-3">How Ride Phuket works</p>
          <div className="space-y-2.5">
            {[
              'Ride Phuket connects you with local rental shops — we are not the shop.',
              'Rental terms, deposit, and payment are arranged directly between you and the shop.',
              'No platform fees, no online payment, no reservation to manage.',
            ].map(item => (
              <div key={item} className="flex items-start gap-2.5 text-[13px] text-[#5c5c58]">
                <Check className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-2.5">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-4 bg-[#16a34a] text-white font-bold rounded-full hover:bg-[#15803d] transition-all text-base shadow-sm hover:shadow-[0_8px_24px_rgba(22,163,74,0.3)] hover:scale-[1.01] active:scale-[0.99]"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp the shop
            </a>
          )}
          {shop?.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="flex items-center justify-center gap-2.5 w-full py-4 bg-[#0f0f0e] text-white font-bold rounded-full hover:bg-[#2a2a28] transition-colors text-base"
            >
              <Phone className="w-5 h-5" />
              Call the shop
            </a>
          )}
          {!waUrl && !shop?.phone && (
            <Link
              href={`/explore`}
              className="flex items-center justify-center gap-2.5 w-full py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-base"
            >
              Browse other scooters
            </Link>
          )}
          <p className="text-center text-xs text-[#9c9c98] pt-1">
            No platform fees · Direct local contact · Arrange rental directly with the shop
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ContactShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ContactShopContent />
    </Suspense>
  )
}

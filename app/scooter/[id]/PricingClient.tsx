'use client'

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { cn, formatPrice, pluralize } from '@/lib/utils'
import { StickyContactBar } from '@/components/ride/StickyContactBar'

type Period = 'daily' | 'weekly' | 'monthly'

interface PricingClientProps {
  pricePerDay:   number
  pricePerWeek:  number | null
  pricePerMonth: number | null
  minRentalDays: number
  scooterName:   string
  scooterId:     string
  available:     boolean
  shopWhatsapp?: string | null
  shopPhone?:    string | null
}

export function PricingClient({
  pricePerDay,
  pricePerWeek,
  pricePerMonth,
  minRentalDays,
  scooterName,
  scooterId,
  available,
  shopWhatsapp,
  shopPhone,
}: PricingClientProps) {
  const [selected, setSelected] = useState<Period>('daily')

  const options: { period: Period; price: number; label: string; unit: string }[] = [
    { period: 'daily',   price: pricePerDay,            label: 'Daily',   unit: '/day'   },
    ...(pricePerWeek  ? [{ period: 'weekly'  as Period, price: pricePerWeek,  label: 'Weekly',  unit: '/week'  }] : []),
    ...(pricePerMonth ? [{ period: 'monthly' as Period, price: pricePerMonth, label: 'Monthly', unit: '/month' }] : []),
  ]

  const selectedOption = options.find(o => o.period === selected) ?? options[0]

  return (
    <>
      <div>
        <div className={cn(
          'grid gap-3',
          options.length === 3 ? 'grid-cols-3' :
          options.length === 2 ? 'grid-cols-2' :
          'grid-cols-1',
        )}>
          {options.map(opt => {
            const active = selected === opt.period
            return (
              <button
                key={opt.period}
                type="button"
                onClick={() => setSelected(opt.period)}
                className={cn(
                  'flex flex-col items-center px-2 py-4 rounded-[16px] border-2 transition-all duration-150 active:scale-[0.97]',
                  active
                    ? 'border-[#FF6B35] bg-[#fff4f0]'
                    : 'border-[#e8e8e4] bg-white hover:border-[#d0d0cc]',
                )}
              >
                <CalendarDays
                  className={cn('w-4 h-4 mb-2 flex-shrink-0', active ? 'text-[#FF6B35]' : 'text-[#c8c8c4]')}
                  strokeWidth={1.8}
                />
                <p className={cn(
                  'text-[9px] font-semibold uppercase tracking-widest mb-2 whitespace-nowrap',
                  active ? 'text-[#FF6B35]' : 'text-[#9c9c98]',
                )}>
                  {opt.label}
                </p>
                <p className="text-[20px] font-bold text-[#0f0f0e] leading-none tabular-nums">
                  {formatPrice(opt.price)}
                </p>
                <p className={cn('text-[10px] mt-1.5', active ? 'text-[#FF6B35]/70' : 'text-[#b0b0ac]')}>
                  {opt.unit}
                </p>
              </button>
            )
          })}
        </div>

        {minRentalDays > 1 && (
          <p className="text-[11px] text-[#9c9c98] mt-3 text-center">
            Minimum rental:{' '}
            <span className="font-medium text-[#5c5c58]">{pluralize(minRentalDays, 'day')}</span>
          </p>
        )}
      </div>

      <StickyContactBar
        scooterName={scooterName}
        price={selectedOption.price}
        period={selectedOption.period}
        scooterId={scooterId}
        available={available}
        shopWhatsapp={shopWhatsapp ?? undefined}
        shopPhone={shopPhone ?? undefined}
      />
    </>
  )
}

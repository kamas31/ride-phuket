import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CURRENCY_SYMBOL } from '@/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-US')}`
}

export function formatPricePerDay(amount: number): string {
  return `${formatPrice(amount)}/day`
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`
}

export function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function calculateTotal(dailyRate: number, days: number, deliveryFee: number = 0): number {
  return dailyRate * days + deliveryFee
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural || singular + 's'}`
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Returns the cover image URL for a scooter.
 * Priority: explicit cover_image → images[0] → empty string
 * Use this everywhere an image is displayed so the cover is always respected.
 */
/**
 * Intelligent pricing: applies the best rate for the given duration.
 * Weekly rate applied in full-week blocks; monthly in full-month blocks.
 * Remaining days always charged at daily rate.
 */
export interface PricingBreakdown {
  total: number
  days: number
  rateUsed: 'daily' | 'weekly' | 'monthly'
  label: string   // human-readable explanation, e.g. "2 weeks + 1 day"
  savings: number  // vs. pure daily rate (0 when no savings)
}

export function calcSmartPrice(
  days: number,
  perDay: number,
  perWeek?: number,
  perMonth?: number,
): PricingBreakdown {
  if (days <= 0) return { total: 0, days, rateUsed: 'daily', label: '0 days', savings: 0 }

  const pureDaily = days * perDay

  // Monthly blocks
  if (perMonth && days >= 28) {
    const months     = Math.floor(days / 30)
    const remaining  = days % 30
    if (months > 0) {
      const total   = months * perMonth + remaining * perDay
      const savings = pureDaily - total
      const label   = [months > 0 ? `${months} month${months > 1 ? 's' : ''}` : '', remaining > 0 ? `${remaining} day${remaining > 1 ? 's' : ''}` : ''].filter(Boolean).join(' + ')
      return { total, days, rateUsed: 'monthly', label, savings: Math.max(0, savings) }
    }
  }

  // Weekly blocks
  if (perWeek && days >= 7) {
    const weeks     = Math.floor(days / 7)
    const remaining = days % 7
    if (weeks > 0) {
      const total   = weeks * perWeek + remaining * perDay
      const savings = pureDaily - total
      const label   = [weeks > 0 ? `${weeks} week${weeks > 1 ? 's' : ''}` : '', remaining > 0 ? `${remaining} day${remaining > 1 ? 's' : ''}` : ''].filter(Boolean).join(' + ')
      return { total, days, rateUsed: 'weekly', label, savings: Math.max(0, savings) }
    }
  }

  return {
    total:    pureDaily,
    days,
    rateUsed: 'daily',
    label:    `${days} day${days > 1 ? 's' : ''}`,
    savings:  0,
  }
}

export function getScooterCover(scooter: {
  coverImage?: string | null
  images: string[]
}): string {
  return scooter.coverImage || scooter.images?.[0] || ''
}

/**
 * Normalises an engine displacement string for display.
 * "125" → "125cc" | "125cc" → "125cc" | "N/A" → "N/A" | "Electric" → "Electric"
 */
export function formatEngine(value: string | undefined | null): string {
  if (!value) return ''
  const t = value.trim()
  if (!t || /^n\/?a$/i.test(t)) return t
  // Already has a cc suffix (case-insensitive)
  if (/cc$/i.test(t)) return t
  // Bare number → append cc
  if (/^\d+(\.\d+)?$/.test(t)) return `${t}cc`
  return t
}

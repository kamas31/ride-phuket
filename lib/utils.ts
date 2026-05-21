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
export function getScooterCover(scooter: {
  coverImage?: string | null
  images: string[]
}): string {
  return scooter.coverImage || scooter.images?.[0] || ''
}

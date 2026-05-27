'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Save, Check, Loader2, Camera, X,
  Phone, MessageCircle, Globe, MapPin, Clock,
  AtSign, AlertCircle, ImageOff, Sparkles,
} from 'lucide-react'
import { PLAN_LABELS, FOUNDING_PARTNER_PERKS, isFoundingPartner } from '@/lib/plans'
import { createClient } from '@/lib/supabase/client'
import { updateShop } from '@/app/actions/shop-update'
import { ImageUploader, type ProcessedImage } from '@/components/ride/ImageUploader'
import { cn } from '@/lib/utils'
import type { FullShopRow } from '@/app/actions/profile'
import type { OpeningHoursSchedule, OpeningHoursDay } from '@/types'
import { PHUKET_ZONES } from '@/lib/zones'

const PinPickerMap = dynamic(() => import('@/components/map/PinPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-[16px] bg-[#f0f0ec] border border-[#e8e8e4] flex items-center justify-center" style={{ height: 280 }}>
      <div className="w-6 h-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

// ── Constants ──────────────────────────────────────────────────

const DAYS: { key: keyof OpeningHoursSchedule; label: string }[] = [
  { key: 'monday',    label: 'Monday' },
  { key: 'tuesday',   label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday',  label: 'Thursday' },
  { key: 'friday',    label: 'Friday' },
  { key: 'saturday',  label: 'Saturday' },
  { key: 'sunday',    label: 'Sunday' },
]

const DEFAULT_HOURS: OpeningHoursSchedule = {
  monday:    { enabled: true,  open: '08:00', close: '20:00' },
  tuesday:   { enabled: true,  open: '08:00', close: '20:00' },
  wednesday: { enabled: true,  open: '08:00', close: '20:00' },
  thursday:  { enabled: true,  open: '08:00', close: '20:00' },
  friday:    { enabled: true,  open: '08:00', close: '20:00' },
  saturday:  { enabled: true,  open: '08:00', close: '20:00' },
  sunday:    { enabled: true,  open: '10:00', close: '18:00' },
}

function parseHours(raw: string | null): OpeningHoursSchedule {
  if (!raw) return DEFAULT_HOURS
  try {
    return JSON.parse(raw) as OpeningHoursSchedule
  } catch {
    return DEFAULT_HOURS
  }
}

// ── Single-image upload helper ─────────────────────────────────

async function uploadShopAsset(
  shopId: string,
  file: File,
  type: 'logo' | 'cover',
): Promise<string | null> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = async e => {
      const img = new window.Image()
      img.onload = async () => {
        const MAX = type === 'logo' ? 400 : 1200
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const outW = Math.round(img.width * scale)
        const outH = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = outW; canvas.height = outH
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, outW, outH)

        canvas.toBlob(async blob => {
          if (!blob) { resolve(null); return }
          const supabase = createClient()
          const path = `shops/${shopId}/${type}/${Date.now()}.webp`
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase as any).storage
            .from('scooter-images')
            .upload(path, blob, { contentType: 'image/webp', upsert: true })
          if (error) { resolve(null); return }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: urlData } = (supabase as any).storage
            .from('scooter-images')
            .getPublicUrl(data.path)
          resolve(urlData.publicUrl)
        }, 'image/webp', 0.88)
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ── Single-image field component ───────────────────────────────

function ImageField({
  label, hint, value, onChange, round = false, shopId, type,
}: {
  label: string
  hint: string
  value: string | null
  onChange: (url: string | null) => void
  round?: boolean
  shopId: string
  type: 'logo' | 'cover'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    const url = await uploadShopAsset(shopId, file, type)
    if (url) onChange(url)
    setUploading(false)
  }

  return (
    <div>
      <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex-shrink-0 bg-[#f0f0ec] border-2 border-dashed border-[#e8e8e4] overflow-hidden',
            'hover:border-[#FF6B35]/50 transition-colors group',
            round ? 'w-20 h-20 rounded-full' : 'w-32 h-20 rounded-[12px]',
            uploading && 'opacity-50 pointer-events-none',
          )}
        >
          {value ? (
            <Image src={value} alt={label} fill className={round ? 'object-cover' : 'object-cover'} unoptimized />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <ImageOff className="w-5 h-5 text-[#c4bfb8]" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading
              ? <Loader2 className="w-5 h-5 text-white animate-spin" />
              : <Camera className="w-5 h-5 text-white" />
            }
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#5c5c58] leading-relaxed">{hint}</p>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="mt-1 text-[11px] text-[#dc2626] hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Toggle ─────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
        on ? 'bg-[#22c55e]' : 'bg-[#e8e8e4]',
      )}
    >
      <div className={cn(
        'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
        on ? 'translate-x-5' : 'translate-x-0.5',
      )} />
    </button>
  )
}

// ── Input helper ───────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = 'text', prefix, required, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  prefix?: React.ReactNode
  required?: boolean
  hint?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#9c9c98] pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={cn(
            'w-full py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm',
            'placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors',
            prefix ? 'pl-8 pr-4' : 'px-4',
          )}
        />
      </div>
      {hint && <p className="text-[10px] text-[#9c9c98] mt-1">{hint}</p>}
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-4">
      <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider">{title}</p>
      {children}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────

interface ShopSettingsClientProps {
  shop: FullShopRow
}

type SaveState = 'idle' | 'uploading' | 'saving' | 'saved' | 'error'

export default function ShopSettingsClient({ shop }: ShopSettingsClientProps) {
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError]         = useState<string | null>(null)
  const [showMap, setShowMap]     = useState(false)

  // Gallery images — new uploads
  const [galleryNew, setGalleryNew] = useState<ProcessedImage[]>([])

  const [form, setForm] = useState({
    // Basic
    name:        shop.name ?? '',
    description: shop.description ?? '',
    // Contact
    phone:     shop.phone ?? '',
    whatsapp:  shop.whatsapp ?? '',
    lineId:    shop.line_id ?? '',
    telegram:  shop.telegram ?? '',
    instagram: shop.instagram ?? '',
    website:   shop.website ?? '',
    // Location
    address:       shop.address ?? '',
    lat:           String(shop.lat ?? ''),
    lng:           String(shop.lng ?? ''),
    googleMapsLink: shop.google_maps_link ?? '',
    deliveryZones: (shop.delivery_zones ?? []) as string[],
    // Branding
    logoUrl:    shop.logo_url ?? '',
    coverImage: shop.cover_image ?? '',
    // Gallery existing URLs
    galleryUrls: (shop.gallery ?? []) as string[],
    // Hours
    hours: parseHours(shop.opening_hours),
  })

  const set = useCallback(
    <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
      setForm(f => ({ ...f, [k]: v })),
    []
  )

  const setHoursDay = (day: keyof OpeningHoursSchedule, patch: Partial<OpeningHoursDay>) =>
    setForm(f => ({
      ...f,
      hours: { ...f.hours, [day]: { ...f.hours[day], ...patch } },
    }))

  const applyAllDays = (patch: Partial<OpeningHoursDay>) =>
    setForm(f => {
      const next = { ...f.hours }
      for (const d of DAYS) next[d.key] = { ...next[d.key], ...patch }
      return { ...f, hours: next }
    })

  // Upload gallery new images → URLs
  const uploadGallery = async (): Promise<string[]> => {
    if (!galleryNew.length) return []
    const supabase = createClient()
    const urls: string[] = []
    for (const img of galleryNew) {
      const path = `shops/${shop.id}/gallery/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webp`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: upErr } = await (supabase as any).storage
        .from('scooter-images')
        .upload(path, img.blob, { contentType: 'image/webp', upsert: false })
      if (upErr) { console.error('[gallery upload]', upErr.message); continue }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: urlData } = (supabase as any).storage
        .from('scooter-images')
        .getPublicUrl(data.path)
      urls.push(urlData.publicUrl)
    }
    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Shop name is required.'); return }
    if (!form.phone.trim()) { setError('Phone number is required.'); return }

    setError(null)
    setSaveState('uploading')

    const timeout = setTimeout(() => {
      setSaveState('error')
      setError('Request timed out. Check your connection and try again.')
    }, 30_000)

    try {
      const newGalleryUrls = await uploadGallery()
      setSaveState('saving')

      const result = await updateShop(shop.id, {
        name:        form.name,
        description: form.description,
        phone:       form.phone,
        whatsapp:    form.whatsapp || undefined,
        lineId:      form.lineId || undefined,
        telegram:    form.telegram || undefined,
        instagram:   form.instagram || undefined,
        website:     form.website || undefined,
        address:     form.address || undefined,
        lat:         form.lat ? Number(form.lat) : null,
        lng:         form.lng ? Number(form.lng) : null,
        googleMapsLink: form.googleMapsLink || undefined,
        deliveryZones:  form.deliveryZones,
        openingHours:   form.hours,
        logoUrl:        form.logoUrl || null,
        coverImage:     form.coverImage || null,
        gallery:        [...form.galleryUrls, ...newGalleryUrls],
      })

      clearTimeout(timeout)

      if (result.success) {
        setSaveState('saved')
        setGalleryNew([])
        setTimeout(() => setSaveState('idle'), 2500)
      } else {
        setError(result.error ?? 'Failed to save.')
        setSaveState('error')
      }
    } catch (err) {
      clearTimeout(timeout)
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setSaveState('error')
    }
  }

  const isBusy = saveState === 'uploading' || saveState === 'saving'

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/partner/dashboard"
            className="flex items-center gap-1.5 text-sm text-[#5c5c58] hover:text-[#0f0f0e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <h1 className="font-bold text-sm text-[#0f0f0e]">Shop Settings</h1>
          <button
            form="shop-form"
            type="submit"
            disabled={isBusy}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all',
              saveState === 'saved'
                ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]'
                : 'bg-[#FF6B35] text-white hover:bg-[#e85d29] disabled:opacity-50',
            )}
          >
            {isBusy ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />{saveState === 'uploading' ? 'Uploading…' : 'Saving…'}</>
            ) : saveState === 'saved' ? (
              <><Check className="w-3.5 h-3.5" />Saved</>
            ) : (
              <><Save className="w-3.5 h-3.5" />Save</>
            )}
          </button>
        </div>
      </div>

      <form id="shop-form" onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 py-6 space-y-5">

        {/* Founding Partner banner */}
        {isFoundingPartner(shop.plan_type) && (
          <div className="bg-gradient-to-r from-[#fff8f0] to-[#fffbf0] border border-[#f59e0b]/20 rounded-[16px] px-4 py-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#f59e0b] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#92400e]">
                {PLAN_LABELS[shop.plan_type as keyof typeof PLAN_LABELS]} — all features unlocked
              </p>
              <p className="text-[11px] text-[#b45309] mt-0.5 leading-relaxed">
                You currently have free access to all Pro features as an early partner while Koh Ride grows. Thank you for being part of this.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {FOUNDING_PARTNER_PERKS.map(perk => (
                  <span key={perk} className="text-[10px] font-semibold px-2 py-0.5 bg-[#f59e0b]/10 text-[#92400e] rounded-full border border-[#f59e0b]/15">
                    ✓ {perk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 1. Basic Info ── */}
        <Section title="Basic Info">
          <Field
            label="Shop Name" required value={form.name}
            onChange={v => set('name', v)} placeholder="Kata Scooter Rental"
          />
          <div>
            <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Tell riders about your shop, fleet, and service…"
              rows={3}
              className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors resize-none"
            />
          </div>
          {shop.verified && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#f0fdf4] rounded-[10px]">
              <Check className="w-3.5 h-3.5 text-[#22c55e]" />
              <span className="text-xs font-medium text-[#16a34a]">Verified partner</span>
            </div>
          )}
        </Section>

        {/* ── 2. Contact & Social ── */}
        <Section title="Contact & Social">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Phone" required value={form.phone}
              onChange={v => set('phone', v)} placeholder="+66 81 234 5678"
              prefix={<Phone className="w-3.5 h-3.5" />}
            />
            <Field
              label="WhatsApp" value={form.whatsapp}
              onChange={v => set('whatsapp', v)} placeholder="+66812345678"
              prefix={<MessageCircle className="w-3.5 h-3.5" />}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Line ID" value={form.lineId}
              onChange={v => set('lineId', v)} placeholder="@katascooter"
              prefix="LINE"
            />
            <Field
              label="Telegram" value={form.telegram}
              onChange={v => set('telegram', v)} placeholder="@katascooter"
              prefix="TG"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Instagram" value={form.instagram}
              onChange={v => set('instagram', v)} placeholder="@katascooters"
              prefix={<AtSign className="w-3.5 h-3.5" />}
            />
            <Field
              label="Website" value={form.website}
              onChange={v => set('website', v)} placeholder="https://…"
              prefix={<Globe className="w-3.5 h-3.5" />}
            />
          </div>
        </Section>

        {/* ── 3. Location ── */}
        <Section title="Address & Location">
          <Field
            label="Full Address" value={form.address}
            onChange={v => set('address', v)}
            placeholder="123 Kata Rd, Kata, Phuket 83100"
          />

          {/* Coordinates */}
          <div>
            <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">
              Coordinates
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#9c9c98] mb-1">Latitude</label>
                <input
                  type="number" step="any" value={form.lat}
                  onChange={e => set('lat', e.target.value)}
                  placeholder="7.8203"
                  className="w-full px-3 py-2.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[10px] text-sm focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#9c9c98] mb-1">Longitude</label>
                <input
                  type="number" step="any" value={form.lng}
                  onChange={e => set('lng', e.target.value)}
                  placeholder="98.2986"
                  className="w-full px-3 py-2.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[10px] text-sm focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowMap(v => !v)}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#FF6B35] hover:text-[#e85d29] transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              {showMap ? 'Hide map' : 'Pick on map'}
            </button>
          </div>

          {showMap && (
            <PinPickerMap
              lat={Number(form.lat) || 7.9019}
              lng={Number(form.lng) || 98.3381}
              onChange={({ lat, lng }) => {
                set('lat', String(lat))
                set('lng', String(lng))
              }}
            />
          )}

          <Field
            label="Google Maps Link" value={form.googleMapsLink}
            onChange={v => set('googleMapsLink', v)}
            placeholder="https://maps.app.goo.gl/…"
            prefix={<MapPin className="w-3.5 h-3.5" />}
          />

          {/* Delivery zones */}
          <div>
            <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">
              Delivery Zones
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PHUKET_ZONES.map(zone => {
                const active = form.deliveryZones.includes(zone.key)
                return (
                  <button
                    key={zone.key}
                    type="button"
                    onClick={() => set(
                      'deliveryZones',
                      active
                        ? form.deliveryZones.filter(z => z !== zone.key)
                        : [...form.deliveryZones, zone.key],
                    )}
                    className={cn(
                      'px-3 py-2 rounded-[10px] text-xs font-semibold border text-left transition-all',
                      active
                        ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]'
                        : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58] hover:border-[#d0d0cc]',
                    )}
                  >
                    {zone.name}
                  </button>
                )
              })}
            </div>
          </div>
        </Section>

        {/* ── 4. Opening Hours ── */}
        <Section title="Opening Hours">
          {/* Apply all shortcut */}
          <div className="flex items-center gap-3 pb-1">
            <p className="text-xs text-[#9c9c98] flex-1">Set hours for all days at once:</p>
            <div className="flex items-center gap-2">
              <input
                type="time"
                defaultValue="08:00"
                id="bulk-open"
                className="px-2 py-1 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[8px] text-xs focus:outline-none focus:border-[#FF6B35]"
              />
              <span className="text-xs text-[#9c9c98]">–</span>
              <input
                type="time"
                defaultValue="20:00"
                id="bulk-close"
                className="px-2 py-1 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[8px] text-xs focus:outline-none focus:border-[#FF6B35]"
              />
              <button
                type="button"
                onClick={() => {
                  const o = (document.getElementById('bulk-open') as HTMLInputElement).value
                  const c = (document.getElementById('bulk-close') as HTMLInputElement).value
                  applyAllDays({ open: o, close: c })
                }}
                className="px-3 py-1.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[8px] text-xs font-semibold text-[#5c5c58] hover:border-[#d0d0cc] transition-colors"
              >
                Apply all
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {DAYS.map(({ key, label }) => {
              const day = form.hours[key]
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-24 flex-shrink-0">
                    <span className={cn(
                      'text-sm font-medium',
                      day.enabled ? 'text-[#0f0f0e]' : 'text-[#9c9c98]',
                    )}>
                      {label}
                    </span>
                  </div>
                  <Toggle on={day.enabled} onChange={v => setHoursDay(key, { enabled: v })} />
                  {day.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={day.open}
                        onChange={e => setHoursDay(key, { open: e.target.value })}
                        className="flex-1 px-2.5 py-2 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[8px] text-sm focus:outline-none focus:border-[#FF6B35]"
                      />
                      <span className="text-xs text-[#9c9c98]">–</span>
                      <input
                        type="time"
                        value={day.close}
                        onChange={e => setHoursDay(key, { close: e.target.value })}
                        className="flex-1 px-2.5 py-2 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[8px] text-sm focus:outline-none focus:border-[#FF6B35]"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-[#9c9c98] flex-1">Closed</span>
                  )}
                </div>
              )
            })}
          </div>
        </Section>

        {/* ── 5. Branding ── */}
        <Section title="Branding">
          <ImageField
            label="Shop Logo"
            hint="Square or circular. Shown as your shop avatar on listings."
            value={form.logoUrl || null}
            onChange={url => set('logoUrl', url ?? '')}
            round
            shopId={shop.id}
            type="logo"
          />

          <div className="border-t border-[#f0f0ec] pt-4">
            <ImageField
              label="Cover Image"
              hint="Wide banner image shown on your public shop page."
              value={form.coverImage || null}
              onChange={url => set('coverImage', url ?? '')}
              shopId={shop.id}
              type="cover"
            />
          </div>

          {/* Gallery */}
          <div className="border-t border-[#f0f0ec] pt-4">
            <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-3">
              Gallery Photos
            </p>

            {/* Existing gallery */}
            {form.galleryUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {form.galleryUrls.map((url, i) => (
                  <div key={url} className="relative group">
                    <div className="relative h-16 rounded-[8px] overflow-hidden bg-[#f0f0ec]">
                      <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" unoptimized />
                    </div>
                    <button
                      type="button"
                      onClick={() => set('galleryUrls', form.galleryUrls.filter(u => u !== url))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-white border border-[#fecaca] rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5 text-[#dc2626]" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <ImageUploader
              images={galleryNew}
              onChange={setGalleryNew}
              maxImages={Math.max(0, 8 - form.galleryUrls.length)}
              minImages={0}
            />
          </div>
        </Section>

        {/* Error */}
        {(saveState === 'error' || error) && (
          <div className="flex items-start gap-2 px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[12px]">
            <AlertCircle className="w-4 h-4 text-[#dc2626] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#dc2626]">{error ?? 'An error occurred.'}</p>
          </div>
        )}

        {/* Bottom save */}
        <div className="flex gap-3 pb-10">
          <Link
            href="/partner/dashboard"
            className="px-6 py-4 rounded-full border border-[#e8e8e4] text-sm font-semibold text-[#5c5c58] hover:bg-[#f8f8f6] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isBusy}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] disabled:opacity-50 transition-colors"
          >
            {isBusy
              ? <><Loader2 className="w-5 h-5 animate-spin" />{saveState === 'uploading' ? 'Uploading…' : 'Saving…'}</>
              : saveState === 'saved'
                ? <><Check className="w-5 h-5" />Saved!</>
                : <><Save className="w-5 h-5" />Save Shop Settings</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Save, Check, Loader2, Camera,
  Phone, MessageCircle, Globe, MapPin,
  AtSign, AlertCircle, ImageOff, X, ZoomIn,
} from 'lucide-react'
import EasyCrop from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { createClient } from '@/lib/supabase/client'
import { updateShop } from '@/app/actions/shop-update'
import { cn } from '@/lib/utils'
import type { FullShopRow } from '@/app/actions/profile'
import type { OpeningHoursSchedule, OpeningHoursDay } from '@/types'
import { PHUKET_ZONES, getZoneForLocation, getNearestZone } from '@/lib/zones'

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

// ── Upload blob to Supabase storage ───────────────────────────

async function uploadBlob(
  shopId: string,
  blob: Blob,
  type: 'logo' | 'cover' | 'mobile_banner',
): Promise<string | null> {
  const supabase = createClient()
  const path = `shops/${shopId}/${type}/${Date.now()}.webp`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).storage
    .from('scooter-images')
    .upload(path, blob, { contentType: 'image/webp', upsert: true })
  if (error) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: urlData } = (supabase as any).storage
    .from('scooter-images')
    .getPublicUrl(data.path)
  return urlData.publicUrl
}

// ── Process logo file (auto center-crop to square, max 400px) ──

async function processLogo(file: File): Promise<Blob | null> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.onload = () => {
        const size = Math.min(img.width, img.height, 400)
        const cropX = Math.round((img.width  - Math.min(img.width, img.height)) / 2)
        const cropY = Math.round((img.height - Math.min(img.width, img.height)) / 2)
        const srcS  = Math.min(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = size; canvas.height = size
        canvas.getContext('2d')!.drawImage(img, cropX, cropY, srcS, srcS, 0, 0, size, size)
        canvas.toBlob(b => resolve(b), 'image/webp', 0.88)
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ── Produce final 1600×400 banner from crop area ───────────────

async function cropToBannerBlob(imageSrc: string, pixels: Area, outW: number, outH: number): Promise<Blob | null> {
  return new Promise(resolve => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = outW; canvas.height = outH
      canvas.getContext('2d')!.drawImage(
        img,
        pixels.x, pixels.y, pixels.width, pixels.height,
        0, 0, outW, outH,
      )
      canvas.toBlob(b => resolve(b), 'image/webp', 0.90)
    }
    img.src = imageSrc
  })
}

// ── Banner crop modal ──────────────────────────────────────────

function BannerCropModal({
  imageSrc,
  aspect,
  label,
  onConfirm,
  onCancel,
}: {
  imageSrc: string
  aspect: number
  label: string
  onConfirm: (pixels: Area) => void
  onCancel: () => void
}) {
  const [crop, setCrop]     = useState({ x: 0, y: 0 })
  const [zoom, setZoom]     = useState(1)
  const [pixels, setPixels] = useState<Area | null>(null)

  const onComplete = useCallback((_: Area, px: Area) => setPixels(px), [])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-[640px] overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-[#f0f0ec]">
          <div>
            <h3 className="text-[15px] font-bold text-[#0f0f0e]">Adjust {label}</h3>
            <p className="text-[11px] text-[#9c9c98] mt-0.5">Pan and zoom to frame your banner</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-[#f0f0ec] flex items-center justify-center hover:bg-[#e8e8e4] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full bg-[#1a1a1a]" style={{ height: 240 }}>
          <EasyCrop
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
            showGrid={false}
            style={{ containerStyle: { borderRadius: 0 } }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-3">
          <ZoomIn className="w-4 h-4 text-[#9c9c98] flex-shrink-0" />
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#FF6B35]"
          />
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-full border border-[#e8e8e4] text-sm font-semibold text-[#5c5c58] hover:bg-[#f8f8f6] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => pixels && onConfirm(pixels)}
            disabled={!pixels}
            className="flex-[2] py-3 rounded-full bg-[#FF6B35] text-white text-sm font-semibold hover:bg-[#e85d29] transition-colors disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Banner crop config per type ────────────────────────────────

const BANNER_CONFIGS = {
  cover: {
    aspect: 4 / 1,
    outW: 1600,
    outH: 400,
    previewCls: 'w-40 h-10 rounded-[12px]',
    cropLabel: 'desktop banner',
  },
  mobile_banner: {
    aspect: 16 / 9,
    outW: 1200,
    outH: 675,
    previewCls: 'w-[107px] h-[60px] rounded-[12px]',
    cropLabel: 'mobile banner',
  },
} as const

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
  type: 'logo' | 'cover' | 'mobile_banner'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc]     = useState<string | null>(null)

  const isBanner = type === 'cover' || type === 'mobile_banner'
  const bannerCfg = isBanner ? BANNER_CONFIGS[type] : null

  const handleFile = async (file: File) => {
    if (isBanner) {
      setCropSrc(URL.createObjectURL(file))
      return
    }
    setUploading(true)
    const blob = await processLogo(file)
    if (blob) {
      const url = await uploadBlob(shopId, blob, 'logo')
      if (url) onChange(url)
    }
    setUploading(false)
  }

  const handleCropConfirm = async (pixels: Area) => {
    if (!cropSrc || !bannerCfg) return
    setCropSrc(null)
    setUploading(true)
    const blob = await cropToBannerBlob(cropSrc, pixels, bannerCfg.outW, bannerCfg.outH)
    URL.revokeObjectURL(cropSrc)
    if (blob) {
      const url = await uploadBlob(shopId, blob, type as 'cover' | 'mobile_banner')
      if (url) onChange(url)
    }
    setUploading(false)
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const previewCls = round
    ? 'w-20 h-20 rounded-full'
    : (bannerCfg?.previewCls ?? 'w-20 h-20 rounded-[12px]')

  return (
    <div>
      {cropSrc && bannerCfg && (
        <BannerCropModal
          imageSrc={cropSrc}
          aspect={bannerCfg.aspect}
          label={bannerCfg.cropLabel}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex-shrink-0 bg-[#f0f0ec] border-2 border-dashed border-[#e8e8e4] overflow-hidden',
            'hover:border-[#FF6B35]/50 transition-colors group',
            previewCls,
            uploading && 'opacity-50 pointer-events-none',
          )}
        >
          {value ? (
            <Image src={value} alt={label} fill className="object-cover" unoptimized />
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
  // Admin-only extras — all default to the existing owner-facing behavior.
  isAdmin?: boolean
  backHref?: string
  backLabel?: string
  redirectTo?: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function ShopSettingsClient({
  shop,
  isAdmin = false,
  backHref = '/partner/dashboard',
  backLabel = 'Dashboard',
  redirectTo = '/partner/dashboard',
}: ShopSettingsClientProps) {
  const router                    = useRouter()
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError]         = useState<string | null>(null)
  const [showMap, setShowMap]     = useState(true)

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
    location:      shop.location ?? 'Patong',
    address:       shop.address ?? '',
    lat:           String(shop.lat ?? ''),
    lng:           String(shop.lng ?? ''),
    googleMapsLink: shop.google_maps_link ?? '',
    deliveryZones:      (shop.delivery_zones ?? []) as string[],
    locationVisibility: ((shop.location_visibility ?? 'exact') as 'exact' | 'approximate'),
    // Branding
    logoUrl:      shop.logo_url ?? '',
    coverImage:   shop.cover_image ?? '',
    mobileBanner: shop.mobile_banner ?? '',
    // Gallery existing URLs
    galleryUrls: (shop.gallery ?? []) as string[],
    // Hours
    hours: parseHours(shop.opening_hours),
    showOpeningHours: shop.show_opening_hours ?? true,
    // Visibility — admin-only control, round-tripped unchanged for owners
    active: shop.active ?? true,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Shop name is required.'); return }
    if (!form.phone.trim()) { setError('Phone number is required.'); return }

    setError(null)
    setSaveState('saving')

    const timeout = setTimeout(() => {
      setSaveState('error')
      setError('Request timed out. Check your connection and try again.')
    }, 30_000)

    try {
      const result = await updateShop(shop.id, {
        name:        form.name,
        description: form.description,
        phone:       form.phone,
        location:    form.location || undefined,
        whatsapp:    form.whatsapp || undefined,
        lineId:      form.lineId || undefined,
        telegram:    form.telegram || undefined,
        instagram:   form.instagram || undefined,
        website:     form.website || undefined,
        address:     form.address || undefined,
        lat:         form.lat ? Number(form.lat) : null,
        lng:         form.lng ? Number(form.lng) : null,
        googleMapsLink: form.googleMapsLink || undefined,
        deliveryZones:      form.deliveryZones,
        locationVisibility: form.locationVisibility,
        openingHours:       form.hours,
        showOpeningHours:   form.showOpeningHours,
        logoUrl:        form.logoUrl || null,
        coverImage:     form.coverImage || null,
        mobileBanner:   form.mobileBanner || null,
        gallery:        form.galleryUrls,
        active:         form.active,
      })

      clearTimeout(timeout)

      if (result.success) {
        setSaveState('saved')
        router.push(redirectTo)
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

  const isBusy = saveState === 'saving'

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#FF6B35] text-white hover:bg-[#e85d29] transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
          <h1 className="font-bold text-sm text-[#0f0f0e]">{isAdmin ? 'Admin · Edit Shop' : 'Shop Settings'}</h1>
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
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
            ) : saveState === 'saved' ? (
              <><Check className="w-3.5 h-3.5" />Saved</>
            ) : (
              <><Save className="w-3.5 h-3.5" />Save</>
            )}
          </button>
        </div>
      </div>

      <form id="shop-form" onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 py-6 space-y-5">

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
          <div>
            <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
              Main Area <span className="text-[#ef4444]">*</span>
            </label>
            <select
              value={form.location}
              onChange={e => {
                const newLoc = e.target.value
                const zone = getZoneForLocation(newLoc)
                setForm(f => ({
                  ...f,
                  location: newLoc,
                  lat: zone ? String(zone.lat) : f.lat,
                  lng: zone ? String(zone.lng) : f.lng,
                }))
              }}
              className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35] transition-colors"
            >
              {PHUKET_ZONES.map(zone => (
                <option key={zone.key} value={zone.name}>{zone.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-[#9c9c98] mt-1">
              Picking an area moves the map pin to its center. Dragging the pin instead snaps Main Area to the nearest zone.
            </p>
          </div>

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
                const zone = getNearestZone(lat, lng)
                setForm(f => ({
                  ...f,
                  lat: String(lat),
                  lng: String(lng),
                  location: zone.name,
                }))
              }}
            />
          )}

          <Field
            label="Google Maps Link" value={form.googleMapsLink}
            onChange={v => set('googleMapsLink', v)}
            placeholder="https://maps.app.goo.gl/…"
            prefix={<MapPin className="w-3.5 h-3.5" />}
          />

          {/* Location Visibility */}
          <div>
            <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
              Location Visibility
            </p>
            <p className="text-[11px] text-[#9c9c98] mb-3 leading-relaxed">
              Controls what riders see on your shop's public map.
            </p>
            <div className="space-y-2">
              {([
                { value: 'exact',       label: 'Show exact location',   desc: 'Your precise pin is shown on the map.' },
                { value: 'approximate', label: 'Show approximate area',  desc: 'A general zone is shown — exact address stays hidden.' },
              ] as const).map(opt => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-[12px] border cursor-pointer transition-all',
                    form.locationVisibility === opt.value
                      ? 'border-[#FF6B35] bg-[#fff4f0]'
                      : 'border-[#e8e8e4] bg-[#f8f8f6] hover:border-[#d0d0cc]',
                  )}
                >
                  <input
                    type="radio"
                    name="locationVisibility"
                    value={opt.value}
                    checked={form.locationVisibility === opt.value}
                    onChange={() => set('locationVisibility', opt.value)}
                    className="mt-0.5 accent-[#FF6B35]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#0f0f0e]">{opt.label}</p>
                    <p className="text-[11px] text-[#9c9c98] mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

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
          {/* Visibility toggle */}
          <div className="flex items-center justify-between py-0.5">
            <div>
              <p className="text-sm font-semibold text-[#0f0f0e]">Show opening hours</p>
              <p className="text-[11px] text-[#9c9c98] mt-0.5">Display hours on your public shop page</p>
            </div>
            <Toggle on={form.showOpeningHours} onChange={v => set('showOpeningHours', v)} />
          </div>

          {form.showOpeningHours && (<>
          {/* Apply all shortcut */}
          <div className="pb-1">
            <p className="text-xs text-[#9c9c98] mb-2">Set hours for all days at once:</p>
            <div className="flex items-center gap-2">
              <input
                type="time"
                defaultValue="08:00"
                id="bulk-open"
                className="flex-1 min-w-0 px-2 py-1.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[8px] text-sm focus:outline-none focus:border-[#FF6B35]"
              />
              <span className="text-xs text-[#9c9c98] flex-shrink-0">–</span>
              <input
                type="time"
                defaultValue="20:00"
                id="bulk-close"
                className="flex-1 min-w-0 px-2 py-1.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[8px] text-sm focus:outline-none focus:border-[#FF6B35]"
              />
              <button
                type="button"
                onClick={() => {
                  const o = (document.getElementById('bulk-open') as HTMLInputElement).value
                  const c = (document.getElementById('bulk-close') as HTMLInputElement).value
                  applyAllDays({ open: o, close: c })
                }}
                className="flex-shrink-0 px-3 py-1.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[8px] text-sm font-semibold text-[#5c5c58] hover:border-[#d0d0cc] transition-colors"
              >
                Apply all
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {DAYS.map(({ key, label }) => {
              const day = form.hours[key]
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-[76px] flex-shrink-0">
                    <span className={cn(
                      'text-sm font-medium',
                      day.enabled ? 'text-[#0f0f0e]' : 'text-[#9c9c98]',
                    )}>
                      {label}
                    </span>
                  </div>
                  <Toggle on={day.enabled} onChange={v => setHoursDay(key, { enabled: v })} />
                  {day.enabled ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="time"
                        value={day.open}
                        onChange={e => setHoursDay(key, { open: e.target.value })}
                        className="flex-1 min-w-0 px-2 py-2 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[8px] text-sm focus:outline-none focus:border-[#FF6B35] [&::-webkit-calendar-picker-indicator]:hidden"
                      />
                      <span className="text-xs text-[#9c9c98] flex-shrink-0">–</span>
                      <input
                        type="time"
                        value={day.close}
                        onChange={e => setHoursDay(key, { close: e.target.value })}
                        className="flex-1 min-w-0 px-2 py-2 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[8px] text-sm focus:outline-none focus:border-[#FF6B35] [&::-webkit-calendar-picker-indicator]:hidden"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-[#9c9c98] flex-1">Closed</span>
                  )}
                </div>
              )
            })}
          </div>
          </>)}
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
              label="Desktop Banner"
              hint="Shown on desktop & tablet. Recommended: 2000 × 500 px (4:1). Cropped to 1600 × 400."
              value={form.coverImage || null}
              onChange={url => set('coverImage', url ?? '')}
              shopId={shop.id}
              type="cover"
            />
          </div>

          <div className="border-t border-[#f0f0ec] pt-4">
            <ImageField
              label="Mobile Banner"
              hint="Shown on phones only. Recommended: 1200 × 675 px (16:9). Falls back to desktop banner if not set."
              value={form.mobileBanner || null}
              onChange={url => set('mobileBanner', url ?? '')}
              shopId={shop.id}
              type="mobile_banner"
            />
          </div>

        </Section>

        {/* ── 6. Visibility (admin-only) ── */}
        {isAdmin && (
          <Section title="Visibility">
            <div className="flex items-center justify-between py-0.5">
              <div>
                <p className="text-sm font-semibold text-[#0f0f0e]">Shop active</p>
                <p className="text-[11px] text-[#9c9c98] mt-0.5">
                  Active shops appear publicly on Explore and shop pages. Inactive shops are hidden.
                </p>
              </div>
              <Toggle on={form.active} onChange={v => set('active', v)} />
            </div>
          </Section>
        )}

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
            href={backHref}
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
              ? <><Loader2 className="w-5 h-5 animate-spin" />Saving…</>
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


'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import {
  ArrowLeft, Check, Plus, X, Star, ChevronRight,
  DollarSign, Truck, Shield, Clock, Save,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateScooter } from '@/app/actions/scooter-update'
import { ImageUploader, type ProcessedImage } from '@/components/ride/ImageUploader'
import { cn, formatPrice } from '@/lib/utils'
import type { Scooter, MileageRange } from '@/types'

const BRANDS    = ['Honda', 'Yamaha', 'Vespa', 'Kawasaki', 'Suzuki', 'Other']
const LOCATIONS = ['Patong', 'Kata', 'Karon', 'Rawai', 'Bang Tao', 'Phuket Town', 'Kamala', 'Surin']
const SCOOTER_FEATURES = ['Smart key / keyless', 'LED lights', 'Traction control', 'ABS brakes', 'USB charging']
const ACCESSORIES = ['Back rest', 'Top case', 'Crash bar', 'Windshield / Wind visor', 'Electric windshield', 'Phone charger', 'Phone holder']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i)

const MILEAGE_OPTIONS: { value: MileageRange; label: string }[] = [
  { value: '0-10000',     label: '0 – 10,000 km' },
  { value: '10000-20000', label: '10,000 – 20,000 km' },
  { value: '20000-30000', label: '20,000 – 30,000 km' },
  { value: '30000-50000', label: '30,000 – 50,000 km' },
  { value: '50000+',      label: '50,000+ km' },
]

interface EditScooterFormProps {
  scooter: Scooter
  shopId: string
  shopName: string
}

type SaveState = 'idle' | 'uploading' | 'saving' | 'saved' | 'error'
type Step = 1 | 2 | 3

export default function EditScooterForm({ scooter, shopId, shopName }: EditScooterFormProps) {
  const [step, setStep]           = useState<Step>(1)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError]         = useState<string | null>(null)

  const [existingImages, setExistingImages] = useState<string[]>(scooter.images)
  const [coverUrl, setCoverUrl]             = useState<string | null>(scooter.coverImage ?? scooter.images[0] ?? null)
  const [newImages, setNewImages]           = useState<ProcessedImage[]>([])

  const seatStorageEntry   = scooter.features.find(f => f.startsWith('Seat storage: '))
  const initialSeatStorage = seatStorageEntry
    ? seatStorageEntry.replace('Seat storage: ', '') as 'Small' | 'Medium' | 'Big'
    : '' as ''
  const initialFeatures = scooter.features.filter(f => !f.startsWith('Seat storage: '))

  const [form, setForm] = useState({
    name:                scooter.name,
    brand:               scooter.brand,
    model:               scooter.model,
    year:                scooter.year,
    category:            scooter.category,
    engine:              scooter.specs.engine !== 'N/A' ? scooter.specs.engine : '',
    pricePerDay:         String(scooter.pricePerDay),
    pricePerWeek:        scooter.pricePerWeek ? String(scooter.pricePerWeek) : '',
    pricePerMonth:       scooter.pricePerMonth ? String(scooter.pricePerMonth) : '',
    location:            scooter.location,
    deliveryAvailable:   scooter.deliveryAvailable,
    deliveryFee:         String(scooter.deliveryFee),
    helmetIncluded:      scooter.helmetIncluded,
    insuranceIncluded:   scooter.insuranceIncluded,
    minRentalDays:       scooter.minRentalDays,
    depositType:         (scooter.depositType ?? '') as '' | 'cash' | 'passport' | 'both',
    depositAmount:       scooter.depositAmount ? String(scooter.depositAmount) : '',
    features:            initialFeatures,
    seatStorage:         initialSeatStorage,
    description:         scooter.description,
    available:           scooter.available,
    mileageRange:        scooter.mileageRange ?? ('' as MileageRange | ''),
    passportRequired:    scooter.passportRequired ?? false,
    passportCopyAllowed: scooter.passportCopyAllowed ?? true,
    isPremiumBike:       scooter.isPremiumBike ?? false,
    depositNotes:        scooter.depositNotes ?? '',
  })

  const set = useCallback((k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v })), [])

  const toggleFeature = (f: string) =>
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter(x => x !== f)
        : [...prev.features, f],
    }))

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(u => u !== url))
    if (coverUrl === url) {
      const remaining = existingImages.filter(u => u !== url)
      setCoverUrl(remaining[0] ?? newImages[0]?.previewUrl ?? null)
    }
  }

  const uploadNewImages = async (): Promise<string[]> => {
    if (!newImages.length) return []
    const supabase = createClient()
    const urls: string[] = []
    for (const img of newImages) {
      const path = `${shopId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: upErr } = await (supabase as any).storage
        .from('scooter-images')
        .upload(path, img.blob, { contentType: 'image/webp', upsert: false })
      if (upErr) { console.error('[upload]', upErr.message); continue }
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
    if (!form.name.trim())              { setError('Scooter name is required.'); return }
    if (Number(form.pricePerDay) < 100) { setError('Price per day must be at least ฿100.'); return }

    setError(null)
    setSaveState('uploading')

    const timeoutId = setTimeout(() => {
      setSaveState('error')
      setError('Request timed out. Check your connection and try again.')
    }, 30_000)

    try {
      const newUrls = await uploadNewImages()
      setSaveState('saving')

      const allImages    = [...existingImages, ...newUrls]
      const resolvedCover = coverUrl && allImages.includes(coverUrl)
        ? coverUrl
        : allImages[0] ?? null

      const allFeatures = [...form.features]
      if (form.seatStorage) allFeatures.push(`Seat storage: ${form.seatStorage}`)

      const result = await updateScooter(scooter.id, {
        name:              form.name,
        brand:             form.brand,
        model:             form.model || form.name,
        year:              Number(form.year),
        category:          form.category,
        images:            allImages,
        coverImage:        resolvedCover,
        pricePerDay:       Number(form.pricePerDay),
        pricePerWeek:      form.pricePerWeek  ? Number(form.pricePerWeek)  : undefined,
        pricePerMonth:     form.pricePerMonth ? Number(form.pricePerMonth) : undefined,
        location:          form.location,
        deliveryAvailable: form.deliveryAvailable,
        deliveryFee:       Number(form.deliveryFee) || 0,
        helmetIncluded:    form.helmetIncluded,
        insuranceIncluded: form.insuranceIncluded,
        minRentalDays:     form.minRentalDays,
        features:          allFeatures,
        specs: {
          engine:       form.engine || 'N/A',
          power:        scooter.specs.power        || 'N/A',
          fuelCapacity: scooter.specs.fuelCapacity || 'N/A',
          consumption:  scooter.specs.consumption  || 'N/A',
          weight:       scooter.specs.weight       || 'N/A',
          storage:      scooter.specs.storage      || 'N/A',
        },
        description:         form.description,
        available:           form.available,
        mileageRange:        (form.mileageRange as MileageRange) || undefined,
        depositAmount:       form.depositAmount ? Number(form.depositAmount) : undefined,
        depositType:         form.depositType   || undefined,
        passportRequired:    form.passportRequired,
        passportCopyAllowed: form.passportCopyAllowed,
        isPremiumBike:       form.isPremiumBike,
        depositNotes:        form.depositNotes  || undefined,
      })

      clearTimeout(timeoutId)

      if (result.success) {
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2500)
        setNewImages([])
      } else {
        setError(result.error ?? 'Failed to save changes.')
        setSaveState('error')
      }
    } catch (thrown) {
      clearTimeout(timeoutId)
      setError(thrown instanceof Error ? thrown.message : 'Unexpected error.')
      setSaveState('error')
    }
  }

  const STEPS = [
    { n: 1, label: 'Info & Photos' },
    { n: 2, label: 'Pricing' },
    { n: 3, label: 'Details' },
  ]

  const totalImages  = existingImages.length + newImages.length
  const canProceed1  = form.name.trim().length > 0 && totalImages >= 1
  const canProceed2  = Number(form.pricePerDay) >= 100
  const isBusy       = saveState === 'uploading' || saveState === 'saving'

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => step === 1 ? window.location.href = '/partner/dashboard' : setStep(s => (s - 1) as Step)}
            className="flex items-center gap-1.5 text-sm text-[#5c5c58] hover:text-[#0f0f0e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Dashboard' : 'Back'}
          </button>
          <h1 className="font-bold text-sm text-[#0f0f0e]">Edit Scooter</h1>
          <div className="text-xs text-[#9c9c98]">{step}/3</div>
        </div>
        <div className="flex">
          {STEPS.map(s => (
            <div key={s.n} className={`flex-1 h-1 transition-colors ${step >= s.n ? 'bg-[#FF6B35]' : 'bg-[#f0f0ec]'}`} />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 py-6 space-y-5">

        {/* ── STEP 1: Info & Photos ── */}
        {step === 1 && (
          <div style={{ opacity: 0, animation: 'fade-up 0.4s ease forwards' }} className="space-y-5">

            {/* Photos */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-4">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider">Photos</p>

              {existingImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[#9c9c98]">Current photos ({existingImages.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {existingImages.map((url, i) => (
                      <div key={url} className="relative group">
                        <div className={cn(
                          'relative h-20 rounded-[10px] overflow-hidden border-2 transition-all',
                          coverUrl === url ? 'border-[#FF6B35]' : 'border-transparent'
                        )}>
                          <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" unoptimized />
                          {coverUrl === url && (
                            <div className="absolute bottom-1 left-1 bg-[#FF6B35] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Star className="w-2 h-2 fill-white" />Cover
                            </div>
                          )}
                        </div>
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {coverUrl !== url && (
                            <button type="button" onClick={() => setCoverUrl(url)}
                              className="w-6 h-6 bg-[#FF6B35] text-white rounded-full flex items-center justify-center shadow" title="Set as cover">
                              <Star className="w-3 h-3" />
                            </button>
                          )}
                          <button type="button" onClick={() => removeExistingImage(url)}
                            className="w-6 h-6 bg-white text-[#dc2626] rounded-full flex items-center justify-center shadow border border-[#fecaca]" title="Remove">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-[#9c9c98] mb-2">Add more photos</p>
                <ImageUploader
                  images={newImages}
                  onChange={setNewImages}
                  maxImages={Math.max(0, 5 - existingImages.length)}
                  minImages={0}
                />
              </div>

              {totalImages === 0 && (
                <p className="text-xs text-[#dc2626]">At least 1 photo is required.</p>
              )}
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-4">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider">Basic Info</p>

              <div>
                <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                  Display Name <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Brand</label>
                  <select value={form.brand} onChange={e => set('brand', e.target.value)} className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35]">
                    {BRANDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Model</label>
                  <input type="text" value={form.model} onChange={e => set('model', e.target.value)} className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Year</label>
                  <select value={form.year} onChange={e => set('year', Number(e.target.value))} className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35]">
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Category</label>
                  <div className="grid grid-cols-3 gap-1.5 mt-0.5">
                    {(['automatic', 'manual', 'electric'] as const).map(cat => (
                      <button key={cat} type="button" onClick={() => set('category', cat)}
                        className={cn('py-2 rounded-[8px] text-[11px] font-semibold capitalize border transition-all',
                          form.category === cat ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]' : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58]')}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Location</label>
                  <select value={form.location} onChange={e => set('location', e.target.value)} className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35]">
                    {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Engine</label>
                  <input type="text" value={form.engine} onChange={e => set('engine', e.target.value)} placeholder="125cc"
                    className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35]" />
                </div>
              </div>
            </div>

            {/* Availability — edit-only */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-4">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider">Availability</p>
              <button type="button" onClick={() => set('available', !form.available)}
                className="w-full flex items-center justify-between p-4 rounded-[14px] border border-[#e8e8e4] hover:border-[#d0d0cc]">
                <div>
                  <span className="text-sm font-medium text-[#0f0f0e]">Available for rental</span>
                  <p className="text-xs text-[#9c9c98] mt-0.5">Visible to riders on Explore</p>
                </div>
                <div className={cn('w-11 h-6 rounded-full transition-colors relative flex-shrink-0', form.available ? 'bg-[#22c55e]' : 'bg-[#e8e8e4]')}>
                  <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form.available ? 'translate-x-5' : 'translate-x-0.5')} />
                </div>
              </button>
              <div>
                <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">Mileage range</label>
                <div className="flex flex-wrap gap-2">
                  {MILEAGE_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => set('mileageRange', form.mileageRange === opt.value ? '' : opt.value)}
                      className={cn('px-3 py-2 rounded-[10px] text-xs font-semibold border transition-all',
                        form.mileageRange === opt.value ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]' : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58] hover:border-[#d0d0cc]')}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="button" disabled={!canProceed1} onClick={() => setStep(2)}
              className="w-full py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              Continue to Pricing <ChevronRight className="w-5 h-5" />
            </button>

            {!canProceed1 && (
              <p className="text-center text-xs text-[#9c9c98]">
                {totalImages === 0 ? 'Add at least 1 photo to continue' : 'Enter a scooter name to continue'}
              </p>
            )}
          </div>
        )}

        {/* ── STEP 2: Pricing + Delivery + Included + Deposit ── */}
        {step === 2 && (
          <div style={{ opacity: 0, animation: 'fade-up 0.4s ease forwards' }} className="space-y-5">

            {/* Pricing */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-4">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Pricing (THB)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'pricePerDay',   label: 'Per Day',   required: true,  placeholder: '250' },
                  { key: 'pricePerWeek',  label: 'Per Week',  required: false, placeholder: '1,500' },
                  { key: 'pricePerMonth', label: 'Per Month', required: false, placeholder: '5,000' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                      {field.label} {field.required && <span className="text-[#ef4444]">*</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9c9c98] font-medium">฿</span>
                      <input type="number" value={form[field.key as keyof typeof form] as string}
                        onChange={e => set(field.key as keyof typeof form, e.target.value)}
                        placeholder={field.placeholder} required={field.required} min={field.required ? 100 : undefined}
                        className="w-full pl-7 pr-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35]" />
                    </div>
                  </div>
                ))}
              </div>
              {form.pricePerDay && (
                <div className="px-3 py-2.5 bg-[#fff4f0] rounded-[10px] text-xs text-[#FF6B35] font-medium">
                  {formatPrice(Number(form.pricePerDay))}/day
                  {form.pricePerWeek && ` · ${formatPrice(Number(form.pricePerWeek))}/week`}
                </div>
              )}
            </div>

            {/* Delivery */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-4">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Delivery
              </p>
              <button type="button" onClick={() => set('deliveryAvailable', !form.deliveryAvailable)}
                className="w-full flex items-center justify-between p-4 rounded-[14px] border border-[#e8e8e4] hover:border-[#d0d0cc]">
                <span className="text-sm font-medium text-[#0f0f0e]">🚚 Delivery available</span>
                <div className={cn('w-11 h-6 rounded-full transition-colors relative flex-shrink-0', form.deliveryAvailable ? 'bg-[#FF6B35]' : 'bg-[#e8e8e4]')}>
                  <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form.deliveryAvailable ? 'translate-x-5' : 'translate-x-0.5')} />
                </div>
              </button>
              {form.deliveryAvailable && (
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Delivery Fee (฿)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9c9c98] font-medium">฿</span>
                    <input type="number" value={form.deliveryFee} onChange={e => set('deliveryFee', e.target.value)} placeholder="150" min="0"
                      className="w-full pl-7 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35]" />
                  </div>
                </div>
              )}
            </div>

            {/* Included */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-3">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Included
              </p>
              {[
                { key: 'helmetIncluded',    label: '🪖 Helmet included' },
                { key: 'insuranceIncluded', label: '🛡️ Insurance included' },
              ].map(item => (
                <button key={item.key} type="button" onClick={() => set(item.key as keyof typeof form, !form[item.key as keyof typeof form])}
                  className="w-full flex items-center justify-between p-4 rounded-[14px] border border-[#e8e8e4] hover:border-[#d0d0cc]">
                  <span className="text-sm font-medium text-[#0f0f0e]">{item.label}</span>
                  <div className={cn('w-11 h-6 rounded-full transition-colors relative flex-shrink-0', form[item.key as keyof typeof form] ? 'bg-[#22c55e]' : 'bg-[#e8e8e4]')}>
                    <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form[item.key as keyof typeof form] ? 'translate-x-5' : 'translate-x-0.5')} />
                  </div>
                </button>
              ))}
              <div>
                <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Min. Rental
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 7].map(n => (
                    <button key={n} type="button" onClick={() => set('minRentalDays', n)}
                      className={cn('flex-1 py-2.5 rounded-[10px] text-sm font-semibold border transition-all',
                        form.minRentalDays === n ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]' : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58]')}>
                      {n}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Deposit */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-3">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider">Deposit</p>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'passport', 'both'] as const).map(dt => (
                  <button key={dt} type="button"
                    onClick={() => set('depositType', form.depositType === dt ? '' : dt)}
                    className={cn('py-2.5 rounded-[10px] text-sm font-semibold border transition-all',
                      form.depositType === dt ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]' : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58]')}>
                    {dt === 'both' ? 'Cash + Passport' : dt.charAt(0).toUpperCase() + dt.slice(1)}
                  </button>
                ))}
              </div>
              {(form.depositType === 'cash' || form.depositType === 'both') && (
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Cash Amount (฿)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9c9c98] font-medium">฿</span>
                    <input type="number" value={form.depositAmount} onChange={e => set('depositAmount', e.target.value)}
                      placeholder="3000" min="0"
                      className="w-full pl-7 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35]" />
                  </div>
                </div>
              )}
            </div>

            {/* Deposit Security — edit-only */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-4">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider">🛡 Deposit Security</p>

              <button type="button" onClick={() => set('isPremiumBike', !form.isPremiumBike)}
                className="w-full flex items-center justify-between p-4 rounded-[14px] border border-[#e8e8e4] hover:border-[#d0d0cc]">
                <div>
                  <span className="text-sm font-medium text-[#0f0f0e]">Premium / high-value bike (500cc+)</span>
                  <p className="text-[10px] text-[#9c9c98] mt-0.5">Enables passport requirement for Tmax, X-ADV, Forza 750, etc.</p>
                </div>
                <div className={cn('w-11 h-6 rounded-full transition-colors relative flex-shrink-0', form.isPremiumBike ? 'bg-[#2563eb]' : 'bg-[#e8e8e4]')}>
                  <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form.isPremiumBike ? 'translate-x-5' : 'translate-x-0.5')} />
                </div>
              </button>

              {[
                { key: 'passportRequired',    label: form.isPremiumBike ? '🛂 Passport required (premium bike)' : '🛂 Passport required', disabled: !form.isPremiumBike, color: 'bg-[#2563eb]' },
                { key: 'passportCopyAllowed', label: '📋 Passport copy accepted (not original required)', disabled: false, color: 'bg-[#22c55e]' },
              ].map(item => (
                <button key={item.key} type="button"
                  disabled={item.disabled}
                  onClick={() => !item.disabled && set(item.key as keyof typeof form, !form[item.key as keyof typeof form])}
                  className={cn('w-full flex items-center justify-between p-4 rounded-[14px] border border-[#e8e8e4] hover:border-[#d0d0cc]', item.disabled && 'opacity-40 cursor-not-allowed')}>
                  <span className="text-sm font-medium text-[#0f0f0e]">{item.label}</span>
                  <div className={cn('w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
                    form[item.key as keyof typeof form] ? item.color : 'bg-[#e8e8e4]')}>
                    <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      form[item.key as keyof typeof form] ? 'translate-x-5' : 'translate-x-0.5')} />
                  </div>
                </button>
              ))}

              <div>
                <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Deposit Notes (optional)</label>
                <input type="text" value={form.depositNotes} onChange={e => set('depositNotes', e.target.value)}
                  placeholder="e.g. Cash deposit returned on drop-off"
                  className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35]" />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-4 rounded-full border border-[#e8e8e4] text-sm font-semibold text-[#5c5c58] hover:bg-[#f8f8f6]">← Back</button>
              <button type="button" disabled={!canProceed2} onClick={() => setStep(3)}
                className="flex-1 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] disabled:opacity-40 flex items-center justify-center gap-2">
                Continue to Details <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Features + Accessories + Description + Summary ── */}
        {step === 3 && (
          <div style={{ opacity: 0, animation: 'fade-up 0.4s ease forwards' }} className="space-y-5">

            {/* Scooter Features */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-3">Scooter Features</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SCOOTER_FEATURES.map(f => (
                  <button key={f} type="button" onClick={() => toggleFeature(f)}
                    className={cn('flex items-center gap-2 px-3 py-2.5 rounded-[10px] border text-left text-sm transition-all',
                      form.features.includes(f) ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]' : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58] hover:border-[#d0d0cc]')}>
                    {form.features.includes(f)
                      ? <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      : <Plus className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />}
                    {f}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">Seat Storage</p>
                <div className="flex gap-2">
                  {(['Small', 'Medium', 'Big'] as const).map(size => (
                    <button key={size} type="button"
                      onClick={() => set('seatStorage', form.seatStorage === size ? '' : size)}
                      className={cn('flex-1 py-2 rounded-[10px] text-sm font-semibold border transition-all',
                        form.seatStorage === size ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]' : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58]')}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Accessories */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-3">Accessories</p>
              <div className="grid grid-cols-2 gap-2">
                {ACCESSORIES.map(a => (
                  <button key={a} type="button" onClick={() => toggleFeature(a)}
                    className={cn('flex items-center gap-2 px-3 py-2.5 rounded-[10px] border text-left text-sm transition-all',
                      form.features.includes(a) ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]' : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58] hover:border-[#d0d0cc]')}>
                    {form.features.includes(a)
                      ? <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      : <Plus className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />}
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5">
              <label className="block text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe what makes this scooter great for riders in Phuket…"
                rows={3} className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] resize-none" />
            </div>

            {/* Summary */}
            <div className="bg-[#f8f8f6] rounded-[16px] p-4 border border-[#e8e8e4]">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-3">Summary</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {[
                  ['Name',     form.name || '—'],
                  ['Price',    form.pricePerDay ? formatPrice(Number(form.pricePerDay)) + '/day' : '—'],
                  ['Category', form.category],
                  ['Photos',   `${totalImages} photo${totalImages !== 1 ? 's' : ''}`],
                  ['Shop',     shopName],
                  ['Location', form.location],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[#9c9c98]">{label}</span>
                    <span className="font-medium text-[#0f0f0e] capitalize truncate max-w-[120px]">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[12px] text-sm text-[#dc2626]">{error}</div>
            )}

            <div className="flex gap-3 pb-8">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-4 rounded-full border border-[#e8e8e4] text-sm font-semibold text-[#5c5c58] hover:bg-[#f8f8f6]">← Back</button>
              <button type="submit" disabled={isBusy}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] disabled:opacity-50">
                {isBusy
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {saveState === 'uploading' ? 'Uploading…' : 'Saving…'}</>
                  : saveState === 'saved'
                    ? <><Check className="w-5 h-5" />Saved!</>
                    : <><Save className="w-5 h-5" />Save Changes</>
                }
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

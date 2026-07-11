'use client'

import { useState } from 'react'
import {
  ArrowLeft, Check, Plus, ChevronRight,
  DollarSign, Truck, Shield, Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createScooter } from '@/app/actions/scooter-create'
import { ImageUploader, type ProcessedImage } from '@/components/ride/ImageUploader'
import { uploadScooterImageVariants, deleteScooterImageUrls } from '@/lib/upload-scooter-images'
import { resolveCoverUrl } from '@/lib/scooter-images'
import { cn, formatPrice } from '@/lib/utils'
import { SCOOTER_BRANDS, OTHER, getBrand, getModel } from '@/constants/scooter-brands-models'
import { captureEvent } from '@/lib/posthog'

const SCOOTER_FEATURES = [
  'Smart key / keyless',
  'LED lights',
  'Traction control',
  'ABS brakes',
  'USB charging',
]

const ACCESSORIES = [
  'Back rest',
  'Top case',
  'Crash bar',
  'Windshield / Wind visor',
  'Electric windshield',
  'Phone charger',
  'Phone holder',
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i)

const MIN_PHOTOS = 1

interface NewScooterFormProps {
  shopId: string
  shopName: string
  shopLocation: string
  isFirstListing?: boolean
}

type Step = 1 | 2 | 3

export default function NewScooterForm({ shopId, shopName, shopLocation, isFirstListing }: NewScooterFormProps) {
  const [step, setStep]             = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const [images, setImages] = useState<ProcessedImage[]>([])

  const [form, setForm] = useState({
    name:              '',
    brand:             'Honda',
    brandCustom:       '',
    model:             '',
    modelCustom:       '',
    year:              CURRENT_YEAR,
    category:          'automatic' as 'automatic' | 'manual' | 'electric',
    engine:            '',
    engineCustom:      '',
    pricePerDay:       '',
    pricePerWeek:      '',
    pricePerMonth:     '',
    deliveryAvailable: true,
    deliveryFee:       '150',
    helmetIncluded:    true,
    insuranceIncluded: true,
    minRentalDays:     1,
    depositType:       '' as '' | 'cash' | 'passport' | 'both',
    depositCashAmount: '',
    features:          [] as string[],
    seatStorage:       '' as '' | 'Small' | 'Medium' | 'Big',
    description:       '',
  })

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  // Brand change resets model + engine — the model list and engine options both depend on brand.
  const setBrand = (v: string) =>
    setForm(f => ({ ...f, brand: v, brandCustom: '', model: '', modelCustom: '', engine: '', engineCustom: '' }))

  // Model change resets engine, auto-selecting the model's single engine size if it has only one.
  const setModel = (v: string) => {
    const modelOpt = getModel(form.brand, v)
    setForm(f => ({ ...f, model: v, modelCustom: '', engine: modelOpt?.defaultEngine ?? '', engineCustom: '' }))
  }

  const currentBrandOption = form.brand !== OTHER ? getBrand(form.brand) : undefined
  const currentModelOption = currentBrandOption ? getModel(form.brand, form.model) : undefined
  const usingCustomModel  = form.brand === OTHER || form.model === OTHER
  // Controls select-vs-free-text for the Engine field itself (no known model → no engine list).
  const usingCustomEngine = usingCustomModel || !currentModelOption
  // Controls which value submission reads — also true when a known model's select has
  // "Other / Custom" explicitly picked (form.engine === OTHER), which usingCustomEngine alone misses.
  const engineIsCustomValue = usingCustomEngine || form.engine === OTHER

  const toggleFeature = (f: string) =>
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter(x => x !== f)
        : [...prev.features, f],
    }))

  // Uploads every photo's 3 variants (thumbnail/card/detail) directly to
  // Supabase Storage, client-side — no Vercel Function in the data path.
  // Atomic across the whole batch: if any photo fails, every photo that DID
  // succeed in this batch is rolled back too, so the caller never has to
  // reason about a partially-uploaded set of photos.
  const uploadImages = async (): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> => {
    if (!images.length) return { ok: true, urls: [] }
    setUploadingImages(true)
    const supabase = createClient()

    const results = await Promise.all(
      images.map(img => uploadScooterImageVariants(supabase, shopId, img))
    )

    setUploadingImages(false)

    const failed = results.find(r => !r.ok)
    if (failed) {
      const succeededUrls = results.filter(r => r.ok).map(r => r.detailUrl!)
      if (succeededUrls.length > 0) {
        await deleteScooterImageUrls(shopId, succeededUrls)
      }
      return { ok: false, error: failed.error ?? 'One or more photos failed to upload.' }
    }

    return { ok: true, urls: results.map(r => r.detailUrl!) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim())               { setError('Scooter name is required.'); return }
    if (Number(form.pricePerDay) < 100)  { setError('Price per day must be at least ฿100.'); return }
    if (images.length < MIN_PHOTOS)      { setError(`Add at least ${MIN_PHOTOS} photo to continue.`); return }
    setError(null)
    setSubmitting(true)

    const timeoutId = setTimeout(() => {
      setSubmitting(false)
      setError('Request timed out. Check your connection and try again.')
    }, 30_000)

    try {
      const uploadResult = await uploadImages()
      if (!uploadResult.ok) {
        clearTimeout(timeoutId)
        setError(uploadResult.error)
        setSubmitting(false)
        return
      }
      const urls       = uploadResult.urls
      const coverImage = resolveCoverUrl(images.map((img, i) => ({ url: urls[i], isCover: img.isCover })))
      const validUrls  = urls

      const allFeatures = [...form.features]
      if (form.seatStorage) allFeatures.push(`Seat storage: ${form.seatStorage}`)

      // Resolve the brand/model/engine cascade into the plain strings the existing
      // brand/model/specs.engine columns expect — "Other" branches fall back to the
      // free-text custom fields, never to a sentinel value.
      const finalBrand  = form.brand === OTHER ? (form.brandCustom.trim() || 'Other') : form.brand
      const finalModel  = usingCustomModel     ? (form.modelCustom.trim()  || form.name) : (currentModelOption?.value ?? form.name)
      const finalEngine = engineIsCustomValue  ? (form.engineCustom.trim() || 'N/A')      : (form.engine || 'N/A')

      const result = await createScooter({
        shopId,
        name:              form.name,
        brand:             finalBrand,
        model:             finalModel,
        year:              Number(form.year),
        category:          form.category,
        images:            validUrls,
        coverImage,
        pricePerDay:       Number(form.pricePerDay),
        pricePerWeek:      form.pricePerWeek ? Number(form.pricePerWeek) : undefined,
        pricePerMonth:     form.pricePerMonth ? Number(form.pricePerMonth) : undefined,
        deliveryAvailable: form.deliveryAvailable,
        deliveryFee:       Number(form.deliveryFee) || 0,
        helmetIncluded:    form.helmetIncluded,
        insuranceIncluded: form.insuranceIncluded,
        minRentalDays:     form.minRentalDays,
        features:          allFeatures,
        specs:             { engine: finalEngine },
        depositType:       form.depositType || undefined,
        depositAmount:     form.depositCashAmount ? Number(form.depositCashAmount) : undefined,
        description:       form.description,
      })

      clearTimeout(timeoutId)
      if (result.success) {
        if (isFirstListing) captureEvent('first_listing_published', { shop_id: shopId })
        window.location.href = '/partner/dashboard'
      } else {
        // DB write failed after uploads already succeeded — clean up the
        // now-orphaned variant files rather than leaving them in Storage.
        await deleteScooterImageUrls(shopId, urls)
        setError(result.error ?? 'Failed to add scooter.')
        setSubmitting(false)
      }
    } catch (thrown) {
      clearTimeout(timeoutId)
      setError(thrown instanceof Error ? thrown.message : 'Unexpected error.')
      setSubmitting(false)
    }
  }

  const STEPS = [
    { n: 1, label: 'Info & Photos' },
    { n: 2, label: 'Pricing' },
    { n: 3, label: 'Details' },
  ]

  const canProceed1 = form.name.trim().length > 0 && images.length >= MIN_PHOTOS
  const canProceed2 = Number(form.pricePerDay) >= 100

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => step === 1 ? window.location.href = '/partner/dashboard' : setStep(s => (s - 1) as Step)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#FF6B35] text-white hover:bg-[#e85d29] transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Dashboard' : 'Back'}
          </button>
          <h1 className="font-bold text-sm text-[#0f0f0e]">Add Scooter</h1>
          <div className="text-xs text-[#9c9c98]">{step}/3</div>
        </div>
        <div className="flex">
          {STEPS.map(s => (
            <div key={s.n} className={`flex-1 h-1 transition-colors ${step >= s.n ? 'bg-[#FF6B35]' : 'bg-[#f0f0ec]'}`} />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 py-6 space-y-5">

        {/* ── STEP 1: Info + Photos ── */}
        {step === 1 && (
          <div style={{ opacity: 0, animation: 'fade-up 0.4s ease forwards' }} className="space-y-5">

            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-4">Photos</p>
              <ImageUploader
                images={images}
                onChange={setImages}
                maxImages={5}
                minImages={MIN_PHOTOS}
              />
            </div>

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
                  placeholder="e.g. Honda Click 125i — 2024"
                  required
                  className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Brand</label>
                  <select value={form.brand} onChange={e => setBrand(e.target.value)} className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35]">
                    {SCOOTER_BRANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Model</label>
                  {form.brand === OTHER ? (
                    <input type="text" value={form.modelCustom} onChange={e => set('modelCustom', e.target.value)} placeholder="e.g. Click 125i" className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35]" />
                  ) : (
                    <select value={form.model} onChange={e => setModel(e.target.value)} className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35]">
                      <option value="" disabled>Select a model</option>
                      {currentBrandOption?.models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {form.brand === OTHER && (
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Brand (custom)</label>
                  <input type="text" value={form.brandCustom} onChange={e => set('brandCustom', e.target.value)} placeholder="e.g. Royal Alloy" className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35]" />
                </div>
              )}

              {form.brand !== OTHER && form.model === OTHER && (
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Model (custom)</label>
                  <input type="text" value={form.modelCustom} onChange={e => set('modelCustom', e.target.value)} placeholder="e.g. Click 125i" className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35]" />
                </div>
              )}

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
                  <div className="w-full px-3 py-3 bg-[#f0f0ec] border border-[#e8e8e4] rounded-[12px] text-sm text-[#5c5c58]">
                    {shopLocation}
                  </div>
                  <p className="text-[10px] text-[#9c9c98] mt-1">Same as your shop — always matches.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Engine size</label>
                  {usingCustomEngine ? (
                    <input type="text" value={form.engineCustom} onChange={e => set('engineCustom', e.target.value)} placeholder="e.g. 125 or Electric" className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35]" />
                  ) : (
                    <select value={form.engine} onChange={e => set('engine', e.target.value)} className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35]">
                      <option value="" disabled>Select engine size</option>
                      {currentModelOption?.engineSizes.map(es => <option key={es.value} value={es.value}>{es.label}</option>)}
                      <option value={OTHER}>Other / Custom</option>
                    </select>
                  )}
                </div>
              </div>

              {!usingCustomEngine && form.engine === OTHER && (
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Engine size (custom)</label>
                  <input type="text" value={form.engineCustom} onChange={e => set('engineCustom', e.target.value)} placeholder="e.g. 125 or Electric" className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35]" />
                </div>
              )}
            </div>

            <button type="button" disabled={!canProceed1} onClick={() => setStep(2)}
              className="w-full py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              Continue to Pricing <ChevronRight className="w-5 h-5" />
            </button>

            {!canProceed1 && (
              <p className="text-center text-xs text-[#9c9c98]">
                {images.length < MIN_PHOTOS ? `Add at least ${MIN_PHOTOS} photo to continue` : 'Enter a scooter name to continue'}
              </p>
            )}
          </div>
        )}

        {/* ── STEP 2: Pricing + Services + Deposit ── */}
        {step === 2 && (
          <div style={{ opacity: 0, animation: 'fade-up 0.4s ease forwards' }} className="space-y-5">

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

            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-3">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider">Deposit</p>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'passport', 'both'] as const).map(dt => (
                  <button key={dt} type="button"
                    onClick={() => set('depositType', form.depositType === dt ? '' : dt)}
                    className={cn('py-2.5 rounded-[10px] text-sm font-semibold border transition-all',
                      form.depositType === dt
                        ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]'
                        : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58]')}>
                    {dt === 'both' ? 'Cash + Passport' : dt.charAt(0).toUpperCase() + dt.slice(1)}
                  </button>
                ))}
              </div>
              {(form.depositType === 'cash' || form.depositType === 'both') && (
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Cash Amount (฿)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9c9c98] font-medium">฿</span>
                    <input type="number" value={form.depositCashAmount}
                      onChange={e => set('depositCashAmount', e.target.value)}
                      placeholder="3000" min="0"
                      className="w-full pl-7 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35]" />
                  </div>
                </div>
              )}
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

        {/* ── STEP 3: Scooter Features + Accessories + Description ── */}
        {step === 3 && (
          <div style={{ opacity: 0, animation: 'fade-up 0.4s ease forwards' }} className="space-y-5">

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
                        form.seatStorage === size
                          ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]'
                          : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58]')}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
                  ['Photos',   `${images.length} processed`],
                  ['Shop',     shopName],
                  ['Location', shopLocation],
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

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-4 rounded-full border border-[#e8e8e4] text-sm font-semibold text-[#5c5c58] hover:bg-[#f8f8f6]">← Back</button>
              <button type="submit" disabled={submitting || uploadingImages}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] disabled:opacity-50">
                {(submitting || uploadingImages)
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {uploadingImages ? 'Uploading…' : 'Adding to fleet…'}</>
                  : <>Add to My Fleet <ChevronRight className="w-5 h-5" /></>
                }
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}


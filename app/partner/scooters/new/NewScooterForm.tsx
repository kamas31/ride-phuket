'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft, Camera, X, Check, Plus, ChevronRight,
  DollarSign, Truck, Shield, Clock, Info
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createScooter } from '@/app/actions/scooter-create'
import { cn, formatPrice } from '@/lib/utils'

const BRANDS = ['Honda', 'Yamaha', 'Vespa', 'Kawasaki', 'Suzuki', 'Other']
const LOCATIONS = ['Patong', 'Kata', 'Karon', 'Rawai', 'Bang Tao', 'Phuket Town', 'Kamala', 'Surin']
const ALL_FEATURES = [
  'Helmet included', 'USB charging', 'ABS brakes', 'Smart key / keyless',
  'Phone mount', 'Top box / luggage', 'LED lights', 'Traction control',
  'Under-seat storage', 'Front glove box', 'Rear rack', 'Travel rack',
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i)

interface NewScooterFormProps {
  shopId: string
  shopName: string
  shopLocation: string
}

type Step = 1 | 2 | 3

export default function NewScooterForm({ shopId, shopName, shopLocation }: NewScooterFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)

  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])

  // Form state
  const [form, setForm] = useState({
    name: '',
    brand: 'Honda',
    model: '',
    year: CURRENT_YEAR,
    category: 'automatic' as 'automatic' | 'manual' | 'electric',
    pricePerDay: '',
    pricePerWeek: '',
    pricePerMonth: '',
    location: shopLocation,
    deliveryAvailable: true,
    deliveryFee: '150',
    helmetIncluded: true,
    insuranceIncluded: true,
    minRentalDays: 1,
    features: [] as string[],
    engine: '',
    power: '',
    fuelCapacity: '',
    consumption: '',
    weight: '',
    storage: '',
    description: '',
  })

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toggleFeature = (f: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter(x => x !== f)
        : [...prev.features, f]
    }))
  }

  // ── Image handling ──────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - imageFiles.length)
    if (!files.length) return
    const newFiles = [...imageFiles, ...files].slice(0, 5)
    setImageFiles(newFiles)
    // Generate previews
    newFiles.forEach((file, i) => {
      if (i < imageFiles.length) return // already have preview
      const reader = new FileReader()
      reader.onload = () => setImagePreviews(prev => {
        const next = [...prev]
        next[imageFiles.length + (i - imageFiles.length)] = reader.result as string
        return next
      })
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
    setUploadedUrls(prev => prev.filter((_, i) => i !== idx))
  }

  const uploadImages = async (): Promise<string[]> => {
    if (!imageFiles.length) return []
    setUploadingImages(true)
    const supabase = createClient()
    const urls: string[] = []

    for (const file of imageFiles) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${shopId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).storage
        .from('scooter-images')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (error) {
        console.error('Storage upload error:', error.message)
        // Fall back to a placeholder — don't block the form submission
        continue
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: urlData } = (supabase as any).storage
        .from('scooter-images')
        .getPublicUrl(data.path)

      urls.push(urlData.publicUrl)
    }

    setUploadingImages(false)
    return urls
  }

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.pricePerDay) { setError('Name and price are required.'); return }
    setError(null)
    setSubmitting(true)

    // Upload images first
    const urls = await uploadImages()

    const result = await createScooter({
      shopId,
      name:            form.name,
      brand:           form.brand,
      model:           form.model || form.name,
      year:            Number(form.year),
      category:        form.category,
      images:          urls,
      pricePerDay:     Number(form.pricePerDay),
      pricePerWeek:    form.pricePerWeek ? Number(form.pricePerWeek) : undefined,
      pricePerMonth:   form.pricePerMonth ? Number(form.pricePerMonth) : undefined,
      location:        form.location,
      deliveryAvailable: form.deliveryAvailable,
      deliveryFee:     Number(form.deliveryFee) || 0,
      helmetIncluded:  form.helmetIncluded,
      insuranceIncluded: form.insuranceIncluded,
      minRentalDays:   form.minRentalDays,
      features:        form.features,
      specs: {
        engine:       form.engine || 'N/A',
        power:        form.power || 'N/A',
        fuelCapacity: form.fuelCapacity || 'N/A',
        consumption:  form.consumption || 'N/A',
        weight:       form.weight || 'N/A',
        storage:      form.storage || 'N/A',
      },
      description: form.description,
    })

    if (result.success) {
      router.push('/partner/dashboard')
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to create scooter.')
      setSubmitting(false)
    }
  }

  const STEPS = [
    { n: 1, label: 'Info & Photos' },
    { n: 2, label: 'Pricing' },
    { n: 3, label: 'Details' },
  ]

  const canProceed1 = form.name.trim().length > 0
  const canProceed2 = Number(form.pricePerDay) >= 100

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => step === 1 ? router.push('/partner/dashboard') : setStep(s => (s - 1) as Step)}
            className="flex items-center gap-1.5 text-sm text-[#5c5c58] hover:text-[#0f0f0e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Dashboard' : 'Back'}
          </button>
          <h1 className="font-bold text-sm text-[#0f0f0e]">Add Scooter</h1>
          <div className="text-xs text-[#9c9c98]">{step}/3</div>
        </div>

        {/* Step indicators */}
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
            {/* Photo upload */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-3">
                Photos <span className="font-normal normal-case text-[#9c9c98]">(up to 5)</span>
              </p>
              <div className="grid grid-cols-5 gap-2">
                {/* Existing previews */}
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-[10px] overflow-hidden bg-[#f0f0ec]">
                    <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {/* Add slot */}
                {imagePreviews.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-[10px] border-2 border-dashed border-[#e8e8e4] hover:border-[#FF6B35] flex items-center justify-center transition-colors group"
                  >
                    <Camera className="w-5 h-5 text-[#9c9c98] group-hover:text-[#FF6B35]" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleImageSelect}
                />
              </div>
              <p className="text-[11px] text-[#9c9c98] mt-2">
                JPG, PNG · Max 10MB each · First photo = main listing image
              </p>
            </div>

            {/* Basic info */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-4">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider">Basic Info</p>

              {/* Name */}
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

              {/* Brand + Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Brand</label>
                  <select
                    value={form.brand}
                    onChange={e => set('brand', e.target.value)}
                    className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35] transition-colors"
                  >
                    {BRANDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Model</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={e => set('model', e.target.value)}
                    placeholder="Click 125i"
                    className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                  />
                </div>
              </div>

              {/* Year + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Year</label>
                  <select
                    value={form.year}
                    onChange={e => set('year', Number(e.target.value))}
                    className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35] transition-colors"
                  >
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Category</label>
                  <div className="grid grid-cols-3 gap-1.5 mt-0.5">
                    {(['automatic', 'manual', 'electric'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => set('category', cat)}
                        className={cn(
                          'py-2 rounded-[8px] text-[11px] font-semibold capitalize border transition-all',
                          form.category === cat
                            ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]'
                            : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58]'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Location</label>
                <select
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  className="w-full px-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35] transition-colors"
                >
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={!canProceed1}
              onClick={() => setStep(2)}
              className="w-full py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Continue to Pricing <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Pricing + Services ── */}
        {step === 2 && (
          <div style={{ opacity: 0, animation: 'fade-up 0.4s ease forwards' }} className="space-y-5">
            {/* Pricing */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-4">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Pricing (THB)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'pricePerDay', label: 'Per Day', required: true, placeholder: '250' },
                  { key: 'pricePerWeek', label: 'Per Week', required: false, placeholder: '1,500' },
                  { key: 'pricePerMonth', label: 'Per Month', required: false, placeholder: '5,000' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                      {field.label} {field.required && <span className="text-[#ef4444]">*</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9c9c98] font-medium">฿</span>
                      <input
                        type="number"
                        value={form[field.key as keyof typeof form] as string}
                        onChange={e => set(field.key as keyof typeof form, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        min={field.required ? 100 : undefined}
                        className="w-full pl-7 pr-3 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {form.pricePerDay && (
                <div className="px-3 py-2.5 bg-[#fff4f0] rounded-[10px] text-xs text-[#FF6B35] font-medium">
                  Daily: {formatPrice(Number(form.pricePerDay))}
                  {form.pricePerWeek && ` · Weekly: ${formatPrice(Number(form.pricePerWeek))}`}
                </div>
              )}
            </div>

            {/* Delivery */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-4">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Delivery
              </p>
              <button
                type="button"
                onClick={() => set('deliveryAvailable', !form.deliveryAvailable)}
                className="w-full flex items-center justify-between p-4 rounded-[14px] border border-[#e8e8e4] hover:border-[#d0d0cc] transition-colors"
              >
                <span className="text-sm font-medium text-[#0f0f0e]">🚚 Hotel delivery available</span>
                <div className={cn('w-11 h-6 rounded-full transition-colors relative flex-shrink-0', form.deliveryAvailable ? 'bg-[#FF6B35]' : 'bg-[#e8e8e4]')}>
                  <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form.deliveryAvailable ? 'translate-x-5' : 'translate-x-0.5')} />
                </div>
              </button>
              {form.deliveryAvailable && (
                <div>
                  <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">Delivery Fee (฿)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9c9c98] font-medium">฿</span>
                    <input
                      type="number"
                      value={form.deliveryFee}
                      onChange={e => set('deliveryFee', e.target.value)}
                      placeholder="150"
                      min="0"
                      className="w-full pl-7 pr-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm focus:outline-none focus:border-[#FF6B35] transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Inclusions */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5 space-y-3">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> What&apos;s Included
              </p>
              {[
                { key: 'helmetIncluded', label: '🪖 Helmet included' },
                { key: 'insuranceIncluded', label: '🛡️ Insurance included' },
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => set(item.key as keyof typeof form, !form[item.key as keyof typeof form])}
                  className="w-full flex items-center justify-between p-4 rounded-[14px] border border-[#e8e8e4] hover:border-[#d0d0cc] transition-colors"
                >
                  <span className="text-sm font-medium text-[#0f0f0e]">{item.label}</span>
                  <div className={cn('w-11 h-6 rounded-full transition-colors relative flex-shrink-0', form[item.key as keyof typeof form] ? 'bg-[#22c55e]' : 'bg-[#e8e8e4]')}>
                    <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form[item.key as keyof typeof form] ? 'translate-x-5' : 'translate-x-0.5')} />
                  </div>
                </button>
              ))}

              {/* Min rental days */}
              <div>
                <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Min. Rental Days
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 7].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => set('minRentalDays', n)}
                      className={cn(
                        'flex-1 py-2.5 rounded-[10px] text-sm font-semibold border transition-all',
                        form.minRentalDays === n
                          ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]'
                          : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58]'
                      )}
                    >
                      {n}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-4 rounded-full border border-[#e8e8e4] text-sm font-semibold text-[#5c5c58] hover:bg-white transition-colors">
                ← Back
              </button>
              <button
                type="button"
                disabled={!canProceed2}
                onClick={() => setStep(3)}
                className="flex-1 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Continue to Details <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Features + Specs + Description ── */}
        {step === 3 && (
          <div style={{ opacity: 0, animation: 'fade-up 0.4s ease forwards' }} className="space-y-5">
            {/* Features */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-3">Features</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_FEATURES.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFeature(f)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-[10px] border text-left text-sm transition-all',
                      form.features.includes(f)
                        ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35]'
                        : 'border-[#e8e8e4] bg-[#f8f8f6] text-[#5c5c58] hover:border-[#d0d0cc]'
                    )}
                  >
                    {form.features.includes(f)
                      ? <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      : <Plus className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />}
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Specs */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Technical Specs
                <span className="font-normal normal-case text-[#9c9c98]">(optional)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'engine', label: 'Engine', placeholder: '125cc' },
                  { key: 'power', label: 'Power', placeholder: '9 hp' },
                  { key: 'fuelCapacity', label: 'Fuel Tank', placeholder: '5.5L' },
                  { key: 'consumption', label: 'Consumption', placeholder: '45 km/L' },
                  { key: 'weight', label: 'Weight', placeholder: '98 kg' },
                  { key: 'storage', label: 'Storage', placeholder: '18L under seat' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={form[field.key as keyof typeof form] as string}
                      onChange={e => set(field.key as keyof typeof form, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[10px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5">
              <label className="block text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe what makes this scooter great for riders in Phuket. Best roads to explore, comfort level, ideal for beginners/experienced…"
                rows={4}
                className="w-full px-4 py-3 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px] text-sm placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[12px] text-sm text-[#dc2626]">
                {error}
              </div>
            )}

            {/* Summary card */}
            <div className="bg-[#f8f8f6] rounded-[16px] p-4 border border-[#e8e8e4]">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-3">Summary</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-[#9c9c98]">Name</span><span className="font-medium">{form.name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-[#9c9c98]">Price</span><span className="font-medium">{form.pricePerDay ? formatPrice(Number(form.pricePerDay)) + '/day' : '—'}</span></div>
                <div className="flex justify-between"><span className="text-[#9c9c98]">Category</span><span className="font-medium capitalize">{form.category}</span></div>
                <div className="flex justify-between"><span className="text-[#9c9c98]">Photos</span><span className="font-medium">{imagePreviews.length} selected</span></div>
                <div className="flex justify-between"><span className="text-[#9c9c98]">Shop</span><span className="font-medium">{shopName}</span></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-4 rounded-full border border-[#e8e8e4] text-sm font-semibold text-[#5c5c58] hover:bg-white transition-colors">
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImages}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors disabled:opacity-50 text-base"
              >
                {(submitting || uploadingImages)
                  ? <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {uploadingImages ? 'Uploading photos…' : 'Adding to fleet…'}
                    </>
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

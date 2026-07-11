'use client'

import { useState, useRef, useCallback, useId } from 'react'
import Image from 'next/image'
import {
  Camera, X, Star, ArrowUp, ArrowDown,
  ImageOff, AlertCircle, Loader2, GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────

export interface ImageQualityScore {
  overall: 'excellent' | 'good' | 'poor'
  score: number        // 0–100 composite
  brightness: number   // 0–100
  sharpness: number    // 0–100
  composition: number  // 0–100
}

export interface ProcessedImage {
  id: string
  previewUrl: string    // Object URL for <img> — backed by cardBlob
  thumbnailBlob: Blob   // ~320px WebP
  cardBlob: Blob        // ~800px WebP
  detailBlob: Blob      // ~1600px WebP
  sizeKb: number        // detailBlob size, shown in the UI as "the" photo size
  originalName: string
  isCover: boolean      // explicit cover/hero image (one per scooter)
  quality: ImageQualityScore
}

interface ImageUploaderProps {
  images: ProcessedImage[]
  onChange: (images: ProcessedImage[]) => void
  maxImages?: number
  minImages?: number
  className?: string
}

// ── Image processing pipeline ──────────────────────────────────

const MIN_SRC_WIDTH = 400
// Safety net against multi-thousand-pixel camera/panorama sources overwhelming
// canvas memory on low-end mobile — well above any real-world listing photo need.
const MAX_SRC_DIMENSION = 6000

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

// Variant spec — the definitive sizes/qualities for the whole app. Widths are
// upper bounds only: a variant is never upscaled past the source image.
const VARIANT_SPECS = [
  { name: 'thumbnail', maxWidth: 320,  quality: 0.70 },
  { name: 'card',      maxWidth: 800,  quality: 0.75 },
  { name: 'detail',    maxWidth: 1600, quality: 0.80 },
] as const

// Hard rejection thresholds
const BRIGHTNESS_MIN = 35   // 0–255 average luminance
const SHARPNESS_MIN  = 5    // Laplacian variance

// Common phone screenshot dimensions [w, h] — tolerance ±5px
const SCREENSHOT_DIMS: [number, number][] = [
  [390, 844], [428, 926], [414, 896], [412, 915], [360, 800],
  [393, 873], [430, 932], [375, 812], [390, 896], [320, 568],
  [360, 780], [414, 736], [375, 667], [320, 480], [768, 1024],
]

// ── Quality analysis functions ─────────────────────────────────

function detectScreenshot(w: number, h: number): { rejected: boolean; reason?: string } {
  for (const [sw, sh] of SCREENSHOT_DIMS) {
    if (Math.abs(w - sw) <= 5 && Math.abs(h - sh) <= 5) {
      return { rejected: true, reason: 'Screenshots are not allowed. Please upload a real scooter photo.' }
    }
  }
  return { rejected: false }
}

function computeBrightness(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  // Sample every 8th pixel for performance (~4k samples on 1600×900)
  const step = 8
  const data = ctx.getImageData(0, 0, w, h).data
  let total = 0, count = 0
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4
      total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      count++
    }
  }
  return count > 0 ? total / count : 0
}

function computeSharpness(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  // Laplacian variance on a 200×200 center crop
  const cs = Math.min(200, w, h)
  const cx = Math.floor((w - cs) / 2)
  const cy = Math.floor((h - cs) / 2)
  const data = ctx.getImageData(cx, cy, cs, cs).data

  // Grayscale conversion
  const gray: number[] = new Array(cs * cs)
  for (let i = 0; i < cs * cs; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
  }

  // Laplacian kernel [0,1,0 / 1,-4,1 / 0,1,0] — variance of responses
  let sum = 0, sumSq = 0, n = 0
  for (let y = 1; y < cs - 1; y++) {
    for (let x = 1; x < cs - 1; x++) {
      const idx = y * cs + x
      const lap =
        gray[idx - cs] + gray[idx + cs] +
        gray[idx - 1]  + gray[idx + 1]  - 4 * gray[idx]
      sum   += lap
      sumSq += lap * lap
      n++
    }
  }
  if (n === 0) return 0
  const mean = sum / n
  return sumSq / n - mean * mean
}

function computeQualityScore(
  brightness: number,
  sharpness: number,
): ImageQualityScore {
  // Brightness score: optimal 80–200 (0-255 raw)
  let bScore: number
  if      (brightness < 35)  bScore = 0
  else if (brightness < 80)  bScore = 20 + ((brightness - 35) / 45) * 40
  else if (brightness <= 200) bScore = 60 + ((brightness - 80) / 120) * 40
  else if (brightness <= 240) bScore = 100 - ((brightness - 200) / 40) * 20
  else                        bScore = 80 - ((brightness - 240) / 15) * 15

  // Sharpness score: log-ish mapping of Laplacian variance
  let sScore: number
  if      (sharpness < 5)   sScore = 0
  else if (sharpness < 20)  sScore = 15 + ((sharpness - 5) / 15) * 30
  else if (sharpness < 100) sScore = 45 + ((sharpness - 20) / 80) * 40
  else                      sScore = Math.min(100, 85 + ((sharpness - 100) / 200) * 15)

  const score = Math.round(bScore * 0.50 + sScore * 0.50)
  const overall: ImageQualityScore['overall'] =
    score >= 75 ? 'excellent' : score >= 50 ? 'good' : 'poor'

  return {
    overall,
    score,
    brightness:  Math.round(Math.max(0, Math.min(100, bScore))),
    sharpness:   Math.round(Math.max(0, Math.min(100, sScore))),
    composition: 100,
  }
}

// ── ProcessResult type ─────────────────────────────────────────

type ProcessResult =
  | { ok: true; img: ProcessedImage }
  | { ok: false; fileName: string; reason: string }

function isHeicFile(file: File): boolean {
  return /^image\/hei[cf]$/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
}

// Draws one variant directly from the already-decoded source `img` (never
// from another variant's blob — no re-decode, no cascading quality loss),
// exports it, then releases the canvas immediately.
function drawVariant(img: HTMLImageElement, maxWidth: number, quality: number): Promise<Blob | null> {
  const outW = Math.round(Math.min(img.width, maxWidth))
  const outH = Math.round(outW * (img.height / img.width))
  const canvas = document.createElement('canvas')
  canvas.width  = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.width = 0
    canvas.height = 0
    return Promise.resolve(null)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, outW, outH)

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      // Release canvas memory immediately — never held longer than needed.
      canvas.width = 0
      canvas.height = 0
      resolve(blob)
    }, 'image/webp', quality)
  })
}

// ── Core processing pipeline ───────────────────────────────────
// Single decode of the source file, then 3 independent WebP encodes
// (thumbnail/card/detail) drawn straight from that one decoded image.

async function processImageFile(file: File): Promise<ProcessResult> {
  if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
    return { ok: false, fileName: file.name, reason: 'Unsupported format. Use JPEG, PNG or WebP.' }
  }

  const heic = isHeicFile(file)
  const thumbnailSpec = VARIANT_SPECS.find(v => v.name === 'thumbnail')!
  const cardSpec      = VARIANT_SPECS.find(v => v.name === 'card')!
  const detailSpec    = VARIANT_SPECS.find(v => v.name === 'detail')!

  return new Promise(resolve => {
    const srcUrl = URL.createObjectURL(file)
    const img    = new window.Image()

    img.onerror = () => {
      URL.revokeObjectURL(srcUrl)
      resolve({
        ok: false,
        fileName: file.name,
        // Never claim a specific browser/OS supports HEIC — just report what
        // actually happened and give a safe workaround.
        reason: heic
          ? 'This browser could not open this HEIC photo. Export it as JPEG from your phone (Settings → Camera → Formats → "Most Compatible") or choose a JPEG/PNG/WebP file instead.'
          : 'Could not read image file.',
      })
    }

    img.onload = async () => {
      URL.revokeObjectURL(srcUrl)

      // ── Minimum size ───────────────────────────────────────
      if (img.width < MIN_SRC_WIDTH || img.height < MIN_SRC_WIDTH / 2) {
        resolve({ ok: false, fileName: file.name, reason: `Image too small (min ${MIN_SRC_WIDTH}px wide). Use a higher quality photo.` })
        return
      }

      // ── Excessive dimensions — protects low-end mobile canvas/memory ─
      if (img.width > MAX_SRC_DIMENSION || img.height > MAX_SRC_DIMENSION) {
        resolve({ ok: false, fileName: file.name, reason: `Image resolution too high to process (max ${MAX_SRC_DIMENSION}px per side). Please use a smaller photo.` })
        return
      }

      // ── Screenshot / portrait detection ───────────────────
      const screenshotCheck = detectScreenshot(img.width, img.height)
      if (screenshotCheck.rejected) {
        resolve({ ok: false, fileName: file.name, reason: screenshotCheck.reason! })
        return
      }

      // ── Quality analysis — drawn once on a detail-sized canvas (same
      // resolution the original single-variant pipeline analyzed at, so
      // brightness/sharpness thresholds below are unchanged), then that
      // same canvas is reused as the detail variant export so the detail
      // size is never drawn twice. ──
      const outW = Math.round(Math.min(img.width, detailSpec.maxWidth))
      const outH = Math.round(outW * (img.height / img.width))
      const analysisCanvas = document.createElement('canvas')
      analysisCanvas.width  = outW
      analysisCanvas.height = outH
      const ctx = analysisCanvas.getContext('2d')
      if (!ctx) {
        analysisCanvas.width = 0
        analysisCanvas.height = 0
        resolve({ ok: false, fileName: file.name, reason: 'Could not process image.' })
        return
      }
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, outW, outH)

      const brightness = computeBrightness(ctx, outW, outH)
      const sharpness  = computeSharpness(ctx, outW, outH)

      if (brightness < BRIGHTNESS_MIN) {
        analysisCanvas.width = 0
        analysisCanvas.height = 0
        resolve({ ok: false, fileName: file.name, reason: 'Photo too dark — shoot in natural daylight for best results.' })
        return
      }
      if (sharpness < SHARPNESS_MIN) {
        analysisCanvas.width = 0
        analysisCanvas.height = 0
        resolve({ ok: false, fileName: file.name, reason: 'Photo too blurry — use a stable surface or better lighting.' })
        return
      }

      const quality = computeQualityScore(brightness, sharpness)

      // ── Export detail from this same canvas, then release it ──
      const detailBlob = await new Promise<Blob | null>(res =>
        analysisCanvas.toBlob(b => res(b), 'image/webp', detailSpec.quality)
      )
      analysisCanvas.width = 0
      analysisCanvas.height = 0

      if (!detailBlob) {
        resolve({ ok: false, fileName: file.name, reason: 'Compression failed. Try a different image.' })
        return
      }

      // ── card + thumbnail: independent draws from the same decoded
      // source `img`, one at a time so only one extra canvas is ever
      // alive at once. ──
      const cardBlob = await drawVariant(img, cardSpec.maxWidth, cardSpec.quality)
      if (!cardBlob) {
        resolve({ ok: false, fileName: file.name, reason: 'Compression failed. Try a different image.' })
        return
      }
      const thumbnailBlob = await drawVariant(img, thumbnailSpec.maxWidth, thumbnailSpec.quality)
      if (!thumbnailBlob) {
        resolve({ ok: false, fileName: file.name, reason: 'Compression failed. Try a different image.' })
        return
      }

      resolve({
        ok: true,
        img: {
          id:           crypto.randomUUID(),
          previewUrl:   URL.createObjectURL(cardBlob),
          thumbnailBlob,
          cardBlob,
          detailBlob,
          sizeKb:       Math.round(detailBlob.size / 1024),
          originalName: file.name,
          isCover:      false,
          quality,
        },
      })
    }

    img.src = srcUrl
  })
}

// ── Quality badge ──────────────────────────────────────────────

function QualityBadge({ quality }: { quality: ImageQualityScore }) {
  const cfg = {
    excellent: { label: 'Excellent', cls: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]' },
    good:      { label: 'Good',      cls: 'bg-[#fef9c3] text-[#a16207] border-[#fde68a]' },
    poor:      { label: 'Poor',      cls: 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]' },
  }[quality.overall]

  return (
    <span
      className={cn('inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full border flex-shrink-0', cfg.cls)}
      title={`Quality ${quality.score}/100 · Brightness ${quality.brightness} · Sharpness ${quality.sharpness}`}
    >
      {cfg.label}
    </span>
  )
}

// ── Fallback placeholder ───────────────────────────────────────

export const SCOOTER_FALLBACK_URL = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=70'

// ── Component ──────────────────────────────────────────────────

export function ImageUploader({
  images,
  onChange,
  maxImages  = 5,
  minImages  = 1,
  className,
}: ImageUploaderProps) {
  const inputId   = useId()
  const inputRef  = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors]         = useState<string[]>([])
  const [dragOver, setDragOver]     = useState(false)

  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  // ── File ingestion ─────────────────────────────────────────
  const processFiles = useCallback(async (rawFiles: FileList | File[]) => {
    const files   = Array.from(rawFiles)
    const allowed = files.slice(0, maxImages - images.length)
    if (!allowed.length) return

    setProcessing(true)
    setErrors([])

    const results = await Promise.all(allowed.map(processImageFile))
    const good: ProcessedImage[] = []
    const errs: string[] = []

    for (const r of results) {
      if (r.ok) good.push(r.img)
      else errs.push(`${r.fileName}: ${r.reason}`)
    }

    if (good.length) {
      const combined = [...images, ...good]
      const hasCover = combined.some(img => img.isCover)
      const next = hasCover
        ? combined
        : combined.map((img, i) => ({ ...img, isCover: i === 0 }))
      onChange(next)
    }
    if (errs.length) setErrors(errs)
    setProcessing(false)
  }, [images, maxImages, onChange])

  // ── Drop zone handlers ─────────────────────────────────────
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    processFiles(e.dataTransfer.files)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  // ── Cover management ──────────────────────────────────────
  const setCover = (idx: number) => {
    onChange(images.map((img, i) => ({ ...img, isCover: i === idx })))
  }

  // ── Reorder helpers ────────────────────────────────────────
  const reorderDrop = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    const next = [...images]
    const [item] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, item)
    onChange(next)
  }

  const moveImage = (idx: number, direction: -1 | 1) => {
    const toIdx = idx + direction
    if (toIdx < 0 || toIdx >= images.length) return
    reorderDrop(idx, toIdx)
  }

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(images[idx].previewUrl)
    const next = images.filter((_, i) => i !== idx)
    const coverRemoved = images[idx].isCover
    const withCover = coverRemoved && next.length > 0
      ? next.map((img, i) => ({ ...img, isCover: i === 0 }))
      : next
    onChange(withCover)
  }

  const hasMin  = images.length >= minImages
  const hasRoom = images.length < maxImages

  return (
    <div className={cn('space-y-4', className)}>

      {/* ── Drop Zone ── */}
      {hasRoom && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed cursor-pointer transition-all duration-200 px-4 py-8',
            dragOver
              ? 'border-[#FF6B35] bg-[#fff4f0] scale-[1.01]'
              : 'border-[#e8e8e4] bg-[#f8f8f6] hover:border-[#FF6B35]/50 hover:bg-[#fff4f0]/40'
          )}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={e => processFiles(e.target.files ?? [])}
          />

          {processing ? (
            <>
              <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
              <p className="text-sm font-medium text-[#FF6B35]">Processing photos…</p>
              <p className="text-xs text-[#9c9c98]">Resizing and analysing quality…</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-white rounded-[14px] border border-[#e8e8e4] shadow-sm flex items-center justify-center">
                <Camera className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#0f0f0e]">
                  {dragOver ? 'Drop photos here' : 'Drag & drop or tap to upload'}
                </p>
                <p className="text-xs text-[#9c9c98] mt-0.5">
                  JPEG, PNG, WebP · Original aspect ratio preserved
                </p>
              </div>
              <p className="text-xs text-[#5c5c58] mt-1">
                {images.length}/{maxImages} photos added
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Preview grid ── */}
      {images.length > 0 && (
        <div className="space-y-2">
          {images.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragEnter={() => setOverIdx(idx)}
              onDragEnd={() => {
                if (dragIdx !== null && overIdx !== null) reorderDrop(dragIdx, overIdx)
                setDragIdx(null)
                setOverIdx(null)
              }}
              onDragOver={e => { e.preventDefault(); setOverIdx(idx) }}
              className={cn(
                'group relative flex items-center gap-3 bg-white rounded-[14px] border p-2.5 transition-all duration-150',
                overIdx === idx && dragIdx !== idx
                  ? 'border-[#FF6B35] shadow-[0_0_0_2px_rgba(255,107,53,0.15)]'
                  : 'border-[#e8e8e4] hover:border-[#d0d0cc]',
                dragIdx === idx ? 'opacity-50' : 'opacity-100'
              )}
            >
              {/* Drag handle */}
              <div className="touch-none cursor-grab active:cursor-grabbing text-[#9c9c98] hover:text-[#5c5c58] flex-shrink-0">
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Thumbnail */}
              <div
                className="relative flex-shrink-0 w-24 rounded-[8px] overflow-hidden bg-[#f0f0ec]"
                style={{ aspectRatio: '4/3' }}
              >
                <Image src={img.previewUrl} alt={`Photo ${idx + 1}`} fill className="object-contain" unoptimized />
                {img.isCover && (
                  <div className="absolute inset-0 ring-2 ring-[#FF6B35] ring-inset rounded-[8px] pointer-events-none" />
                )}
                {img.isCover && (
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#FF6B35] text-white text-[9px] font-bold rounded-full flex items-center gap-0.5 shadow-sm">
                    <Star className="w-2 h-2 fill-white" />
                    Cover
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium text-[#0f0f0e] truncate">{img.originalName}</p>
                  {img.isCover && (
                    <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-[#FF6B35]">
                      <Star className="w-2.5 h-2.5 fill-[#FF6B35]" />
                      Cover
                    </span>
                  )}
                  <QualityBadge quality={img.quality} />
                </div>
                <p className="text-[10px] text-[#9c9c98] mt-0.5">
                  {img.sizeKb} KB · WebP · {img.quality.score}/100
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {!img.isCover ? (
                  <button
                    type="button"
                    onClick={() => setCover(idx)}
                    className="w-7 h-7 rounded-[8px] bg-[#f8f8f6] border border-[#e8e8e4] flex items-center justify-center text-[#9c9c98] hover:text-[#FF6B35] hover:border-[#FF6B35]/30 hover:bg-[#fff4f0] transition-colors"
                    title="Set as cover image"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div
                    className="w-7 h-7 rounded-[8px] bg-[#fff4f0] border border-[#FF6B35]/30 flex items-center justify-center"
                    title="Current cover image"
                  >
                    <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => moveImage(idx, -1)}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded-[8px] bg-[#f8f8f6] border border-[#e8e8e4] flex items-center justify-center text-[#9c9c98] hover:text-[#0f0f0e] hover:border-[#d0d0cc] disabled:opacity-30 transition-colors"
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(idx, 1)}
                  disabled={idx === images.length - 1}
                  className="w-7 h-7 rounded-[8px] bg-[#f8f8f6] border border-[#e8e8e4] flex items-center justify-center text-[#9c9c98] hover:text-[#0f0f0e] hover:border-[#d0d0cc] disabled:opacity-30 transition-colors"
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="w-7 h-7 rounded-[8px] bg-[#fef2f2] border border-[#fecaca]/50 flex items-center justify-center text-[#dc2626] hover:bg-[#fee2e2] transition-colors"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Errors ── */}
      {errors.length > 0 && (
        <div className="space-y-1.5">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2.5 bg-[#fef2f2] border border-[#fecaca]/50 rounded-[10px]">
              <AlertCircle className="w-4 h-4 text-[#dc2626] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#dc2626] leading-relaxed">{err}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Validation status ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={cn(
            'w-2 h-2 rounded-full transition-colors',
            hasMin ? 'bg-[#22c55e]' : 'bg-[#e8e8e4]'
          )} />
          <span className="text-[11px] text-[#9c9c98]">
            {hasMin
              ? `${images.length} photo${images.length > 1 ? 's' : ''} ready`
              : `Add at least ${minImages} photo${minImages > 1 ? 's' : ''}`
            }
          </span>
        </div>
        {images.length > 0 && (
          <p className="text-[10px] text-[#9c9c98]">
            Drag ⠿ to reorder · Star = cover
          </p>
        )}
      </div>

      {/* ── Tips ── */}
      <div className="px-4 py-3.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[12px]">
        <p className="text-[11px] font-semibold text-[#5c5c58] mb-2 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-[#FF6B35]" />
          Best results
        </p>
        <ul className="space-y-1">
          {[
            'Shoot in natural daylight',
            'Horizontal (landscape) orientation',
            'Clean, uncluttered background',
            'Show full scooter in first photo',
          ].map(tip => (
            <li key={tip} className="flex items-center gap-1.5 text-[11px] text-[#9c9c98]">
              <span className="text-[#FF6B35]">·</span> {tip}
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}

// ── Fallback image for ScooterCard / Gallery ───────────────────

export function ScooterFallback({ className }: { className?: string }) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#f0f0ec] to-[#e8e8e4]',
      className
    )}>
      <ImageOff className="w-8 h-8 text-[#9c9c98]" />
      <span className="text-[11px] text-[#9c9c98] font-medium">No photo yet</span>
    </div>
  )
}

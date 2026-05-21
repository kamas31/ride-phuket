'use client'

import { useState, useRef, useCallback, useId } from 'react'
import Image from 'next/image'
import {
  Camera, X, Star, ArrowUp, ArrowDown,
  ImageOff, AlertCircle, Loader2, GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────

export interface ProcessedImage {
  id: string
  previewUrl: string  // Object URL for <img>
  blob: Blob          // WebP blob ready to upload
  sizeKb: number
  originalName: string
  isCover: boolean    // explicit cover/hero image (one per scooter)
}

interface ImageUploaderProps {
  images: ProcessedImage[]
  onChange: (images: ProcessedImage[]) => void
  maxImages?: number
  minImages?: number
  className?: string
}

// ── Image processing pipeline ──────────────────────────────────

const TARGET_ASPECT = 16 / 9
const MAX_WIDTH_PX  = 1600
const MAX_SIZE_KB   = 800
const MIN_SRC_WIDTH = 400 // reject images too small

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

type ProcessResult =
  | { ok: true; img: ProcessedImage }
  | { ok: false; fileName: string; reason: string }

async function processImageFile(file: File): Promise<ProcessResult> {
  // Format check
  if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
    return { ok: false, fileName: file.name, reason: 'Unsupported format. Use JPEG, PNG or WebP.' }
  }

  return new Promise(resolve => {
    const srcUrl = URL.createObjectURL(file)
    const img    = new window.Image()

    img.onerror = () => {
      URL.revokeObjectURL(srcUrl)
      resolve({ ok: false, fileName: file.name, reason: 'Could not read image file.' })
    }

    img.onload = () => {
      URL.revokeObjectURL(srcUrl)

      // Minimum size check (before crop)
      if (img.width < MIN_SRC_WIDTH || img.height < MIN_SRC_WIDTH / TARGET_ASPECT) {
        resolve({ ok: false, fileName: file.name, reason: `Image too small (min ${MIN_SRC_WIDTH}px wide). Use a higher quality photo.` })
        return
      }

      // ── Centered 16:9 crop ─────────────────────────────────
      let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height

      if (img.width / img.height > TARGET_ASPECT) {
        // Wider than 16:9 → crop horizontally (keep center)
        srcW = img.height * TARGET_ASPECT
        srcX = (img.width - srcW) / 2
      } else {
        // Taller than 16:9 → crop vertically (keep top 40% focus)
        srcH = img.width / TARGET_ASPECT
        srcY = (img.height - srcH) * 0.35 // slight top bias
      }

      // ── Output dimensions (max 1600px) ─────────────────────
      const outW = Math.round(Math.min(srcW, MAX_WIDTH_PX))
      const outH = Math.round(outW / TARGET_ASPECT)

      // ── Draw ───────────────────────────────────────────────
      const canvas = document.createElement('canvas')
      canvas.width  = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled  = true
      ctx.imageSmoothingQuality  = 'high'
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH)

      // ── WebP compression (target ≤ 800 KB) ─────────────────
      const tryExport = (quality: number): Promise<Blob | null> =>
        new Promise(res => canvas.toBlob(b => res(b), 'image/webp', quality))

      const exportWithFallback = async (): Promise<Blob | null> => {
        for (const q of [0.88, 0.75, 0.62, 0.50]) {
          const blob = await tryExport(q)
          if (blob && blob.size <= MAX_SIZE_KB * 1024) return blob
          if (blob && q === 0.50) return blob // last resort — return anyway
        }
        return null
      }

      exportWithFallback().then(blob => {
        if (!blob) {
          resolve({ ok: false, fileName: file.name, reason: 'Compression failed. Try a different image.' })
          return
        }
        resolve({
          ok: true,
          img: {
            id:           crypto.randomUUID(),
            previewUrl:   URL.createObjectURL(blob),
            blob,
            sizeKb:       Math.round(blob.size / 1024),
            originalName: file.name,
            isCover:      false, // set by ImageUploader after adding to list
          },
        })
      })
    }

    img.src = srcUrl
  })
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

  // Drag-to-reorder state
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
      // Auto-set first image as cover if none is designated yet
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
    onChange(next) // isCover travels with the item
  }

  const moveImage = (idx: number, direction: -1 | 1) => {
    const toIdx = idx + direction
    if (toIdx < 0 || toIdx >= images.length) return
    reorderDrop(idx, toIdx)
  }

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(images[idx].previewUrl)
    const next = images.filter((_, i) => i !== idx)
    // If cover was removed, auto-assign to new first image
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
              <p className="text-xs text-[#9c9c98]">Resizing, cropping and compressing</p>
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
                  JPEG, PNG, WebP · Auto-cropped to 16:9 · Max {MAX_SIZE_KB}KB
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

              {/* Thumbnail — always 16:9 */}
              <div
                className="relative flex-shrink-0 w-24 rounded-[8px] overflow-hidden bg-[#f0f0ec]"
                style={{ aspectRatio: '16/9' }}
              >
                <Image src={img.previewUrl} alt={`Photo ${idx + 1}`} fill className="object-cover" unoptimized />
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
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-[#0f0f0e] truncate">{img.originalName}</p>
                  {img.isCover && (
                    <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-[#FF6B35]">
                      <Star className="w-2.5 h-2.5 fill-[#FF6B35]" />
                      Cover
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#9c9c98] mt-0.5">
                  {img.sizeKb} KB · WebP · 16:9
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Set as cover — only on non-cover images */}
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
            Drag ⠿ to reorder · First = cover
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

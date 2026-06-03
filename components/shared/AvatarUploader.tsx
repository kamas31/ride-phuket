'use client'

import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { getInitials } from '@/lib/utils'

async function cropAndResize(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const size = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas unavailable'))
      ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 512, 512)
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('toBlob failed')),
        'image/jpeg',
        0.85,
      )
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = objectUrl
  })
}

interface AvatarUploaderProps {
  currentUrl: string | null
  name: string
  onUpload: (blob: Blob) => Promise<string | null>
  onRemove: () => Promise<void>
  size?: number
  addText?: string
  changeText?: string
}

export function AvatarUploader({
  currentUrl,
  name,
  onUpload,
  onRemove,
  size = 80,
  addText = 'Add profile photo',
  changeText = 'Change profile photo',
}: AvatarUploaderProps) {
  const [localUrl, setLocalUrl] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => { if (!uploading) inputRef.current?.click() }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const blob = await cropAndResize(file)
      const url = await onUpload(blob)
      if (url) setLocalUrl(url)
    } catch (err) {
      console.error('[AvatarUploader] upload failed:', err)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    setUploading(true)
    try {
      await onRemove()
      setLocalUrl(null)
    } catch (err) {
      console.error('[AvatarUploader] remove failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const fontSize = Math.round(size * 0.3)

  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <div className="relative">
        <button
          type="button"
          onClick={open}
          style={{ width: size, height: size }}
          className="rounded-full overflow-hidden relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 flex-shrink-0"
        >
          {localUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={localUrl} alt="Photo" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#ff9a5c] flex items-center justify-center text-white font-bold"
              style={{ fontSize }}
            >
              {getInitials(name)}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>

        {/* Camera badge — persistent affordance, bottom-right */}
        {!uploading && (
          <button
            type="button"
            onClick={open}
            className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-[#FF6B35] rounded-full border-2 border-white flex items-center justify-center focus:outline-none"
          >
            <Camera className="w-3 h-3 text-white" />
          </button>
        )}

        {/* Remove badge — top-right, only when photo exists */}
        {localUrl && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-white rounded-full border border-[#e8e8e4] flex items-center justify-center shadow-sm hover:bg-[#fee2e2] hover:border-[#fca5a5] transition-colors group/x"
          >
            <X className="w-2.5 h-2.5 text-[#9c9c98] group-hover/x:text-[#ef4444] transition-colors" />
          </button>
        )}
      </div>

      {/* Helper text */}
      {uploading ? (
        <span className="text-xs text-[#9c9c98]">Uploading…</span>
      ) : (
        <button
          type="button"
          onClick={open}
          className="text-xs font-medium text-[#FF6B35] hover:underline focus:outline-none"
        >
          {localUrl ? changeText : addText}
        </button>
      )}
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { PlusIcon } from './Illustrations'

type UploadedImage = {
  url: string
  path: string
  preview: string
}

type Props = {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
}

export type { UploadedImage }

export default function ImageUploader({ images, onChange, maxImages = 9 }: Props) {
  const supabase = createClient()
  const { t } = useLang()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const remaining = maxImages - images.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) return

    setUploading(true)
    const newImages: UploadedImage[] = []

    for (const file of toUpload) {
      const preview = URL.createObjectURL(file)
      const ext = file.name.split('.').pop()
      const path = `${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('dish-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        console.error('图片上传失败:', uploadError)
        continue
      }

      const { data } = supabase.storage
        .from('dish-images')
        .getPublicUrl(path)

      newImages.push({ url: data.publicUrl, path, preview })
    }

    onChange([...images, ...newImages])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function removeImage(index: number) {
    const img = images[index]
    await supabase.storage.from('dish-images').remove([img.path])
    URL.revokeObjectURL(img.preview)
    onChange(images.filter((_, i) => i !== index))
  }

  const canAdd = images.length < maxImages

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {images.map((img, index) => (
          <div key={img.path || img.url} className="relative aspect-square rounded-2xl overflow-hidden border-[3px] border-ink bg-yamabuki-pale">
            <img
              src={img.preview || img.url}
              alt=""
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1.5 right-1.5 w-7 h-7 bg-white border-2 border-ink rounded-full text-xs flex items-center justify-center"
              aria-label="✕"
            >
              ✕
            </button>
            {index === 0 && images.length > 1 && (
              <div className="absolute bottom-1.5 left-1.5 sticker bg-yamabuki text-xs px-2">
                {t.cover}
              </div>
            )}
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-2xl border-[3px] border-dashed border-ink bg-white flex flex-col items-center justify-center gap-1 text-sm disabled:opacity-50"
          >
            {uploading ? (
              <span>{t.uploading}</span>
            ) : (
              <>
                <PlusIcon />
                <span>{t.addPhoto}</span>
              </>
            )}
          </button>
        )}
      </div>

      {images.length > 0 && (
        <p className="hint mt-2">{t.uploadedCount(images.length, maxImages)}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  )
}

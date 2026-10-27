'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      console.log('没有选择文件')
      return
    }

    const remaining = maxImages - images.length
    const toUpload = Array.from(files).slice(0, remaining)

    if (toUpload.length === 0) {
      console.log('已达到最大图片数量')
      return
    }

    setUploading(true)
    console.log('开始上传，文件数量:', toUpload.length)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    const newImages: UploadedImage[] = []

    for (const file of toUpload) {
      const preview = URL.createObjectURL(file)
      const ext = file.name.split('.').pop()
      const path = `${crypto.randomUUID()}.${ext}`


      const { error: uploadError } = await supabase.storage
        .from('dish-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })


      if (uploadError) {
        console.error('详细错误:', uploadError)
        continue
      }

      const { data } = supabase.storage
        .from('dish-images')
        .getPublicUrl(path)

      console.log('图片 URL:', data.publicUrl)
      newImages.push({ url: data.publicUrl, path, preview })
    }

    console.log('上传完成，成功数量:', newImages.length)
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
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, index) => (
          <div key={img.path} className="relative aspect-square rounded-xl overflow-hidden bg-amber-100">
            <img
              src={img.preview || img.url}
              alt=""
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center"
            >
              ×
            </button>
            {index === 0 && images.length > 1 && (
              <div className="absolute bottom-1 left-1 bg-amber-500/80 text-white text-xs px-1.5 py-0.5 rounded-full">
                封面
              </div>
            )}
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => {
              console.log('点击了上传按钮')
              fileInputRef.current?.click()
            }}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 flex flex-col items-center justify-center gap-1 text-amber-400 active:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-xs">上传中...</span>
            ) : (
              <>
                <span className="text-2xl">+</span>
                <span className="text-xs">添加图片</span>
              </>
            )}
          </button>
        )}
      </div>

      {images.length > 0 && (
        <p className="text-xs text-gray-400 mt-1.5">
          第一张为封面 · 已上传 {images.length}/{maxImages}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          console.log('文件选择器触发，文件数:', e.target.files?.length)
          handleFiles(e.target.files)
        }}
      />
    </div>
  )
}
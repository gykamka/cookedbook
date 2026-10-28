'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { PlusIcon } from './Illustrations'
import ImageCropper from './ImageCropper'

type UploadedImage = {
  url: string
  path: string
  preview: string
}

type Props = {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
  // 已经存进数据库的图片：编辑时删掉或裁剪不立刻删文件，等保存时再删，取消编辑才不会丢图
  keepPaths?: string[]
}

export type { UploadedImage }

// 正在裁剪的对象：刚选的新文件（排队一张张裁），或者点开已上传的某一张重新裁
type Editing =
  | { kind: 'new'; files: File[]; index: number; src: string }
  | { kind: 'existing'; index: number }

export default function ImageUploader({ images, onChange, maxImages = 9, keepPaths = [] }: Props) {
  const supabase = createClient()
  const { t } = useLang()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<Editing | null>(null)

  async function upload(file: Blob): Promise<UploadedImage | null> {
    const path = `${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage
      .from('dish-images')
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' })

    if (error) {
      console.error('图片上传失败:', error)
      return null
    }

    const { data } = supabase.storage.from('dish-images').getPublicUrl(path)
    return { url: data.publicUrl, path, preview: URL.createObjectURL(file) }
  }

  async function discard(img: UploadedImage) {
    if (img.path && !keepPaths.includes(img.path)) {
      await supabase.storage.from('dish-images').remove([img.path])
    }
    if (img.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview)
  }

  function place(list: UploadedImage[], img: UploadedImage, cover: boolean) {
    return cover ? [img, ...list] : [...list, img]
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const queue = Array.from(files).slice(0, maxImages - images.length)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (queue.length === 0) return
    setEditing({ kind: 'new', files: queue, index: 0, src: URL.createObjectURL(queue[0]) })
  }

  // 新文件：裁完（或跳过）一张，就打开队列里的下一张
  function nextInQueue(current: Extract<Editing, { kind: 'new' }>) {
    URL.revokeObjectURL(current.src)
    const index = current.index + 1
    setEditing(index < current.files.length
      ? { ...current, index, src: URL.createObjectURL(current.files[index]) }
      : null)
  }

  async function handleCropped(blob: Blob, cover: boolean) {
    if (!editing) return
    const uploaded = await upload(blob)
    if (!uploaded) throw new Error('upload failed')

    if (editing.kind === 'new') {
      onChange(place(images, uploaded, cover || images.length === 0))
      nextInQueue(editing)
    } else {
      const old = images[editing.index]
      const rest = images.filter((_, i) => i !== editing.index)
      // 不设封面就留在原来的位置
      const next = cover ? [uploaded, ...rest] : images.map((img, i) => (i === editing.index ? uploaded : img))
      onChange(next)
      await discard(old)
      setEditing(null)
    }
  }

  async function removeImage(index: number) {
    await discard(images[index])
    onChange(images.filter((_, i) => i !== index))
  }

  const canAdd = images.length < maxImages

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {images.map((img, index) => (
          <div key={img.path || img.url} className="relative">
            <button
              type="button"
              onClick={() => setEditing({ kind: 'existing', index })}
              className="block w-full aspect-square rounded-2xl overflow-hidden border-[3px] border-ink bg-yamabuki-pale"
            >
              <img src={img.preview || img.url} alt="" className="w-full h-full object-cover" />
            </button>
            {index === 0 && (
              <span className="absolute bottom-1.5 left-1.5 sticker bg-yamabuki text-xs px-2 pointer-events-none">
                {t.cover}
              </span>
            )}
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute -top-2 -right-2 w-7 h-7 bg-coral border-[2.5px] border-ink rounded-full text-xs flex items-center justify-center"
              aria-label={t.deletePhoto}
            >
              ✕
            </button>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-2xl border-[3px] border-dashed border-ink bg-white flex flex-col items-center justify-center gap-1 text-sm"
          >
            <PlusIcon />
            <span>{t.addPhoto}</span>
          </button>
        )}
      </div>

      {images.length > 0 && (
        <p className="hint mt-2">{t.uploadedCount(images.length, maxImages)} · {t.photoTapHint}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {editing?.kind === 'new' && (
        <ImageCropper
          key={editing.src}
          src={editing.src}
          progress={editing.files.length > 1 ? `${editing.index + 1}/${editing.files.length}` : undefined}
          initialCover={images.length === 0}
          onCancel={() => nextInQueue(editing)}
          onDone={handleCropped}
        />
      )}

      {editing?.kind === 'existing' && images[editing.index] && (
        <ImageCropper
          key={images[editing.index].url}
          src={images[editing.index].preview || images[editing.index].url}
          initialCover={editing.index === 0}
          onCancel={() => setEditing(null)}
          onDone={handleCropped}
        />
      )}
    </div>
  )
}

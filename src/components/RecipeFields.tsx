'use client'

import { useRef, useState } from 'react'
import { useLang } from '@/lib/i18n'
import { createClient } from '@/lib/supabase'
import { DifficultySelect } from './DishFields'
import { PlusIcon, SparkleIcon } from './Illustrations'
import type { ExtractedRecipe } from '@/types'

export type RecipeValue = {
  cookingTime: string
  difficulty: string
  ingredients: string
  steps: string
}

type ScreenshotItem = {
  preview: string
}

// Vercel 一次请求最多收 4.5MB。原图直接发会超，所以发之前在手机上缩小、转成 JPEG。
// 先用比较清楚的尺寸，所有截图加起来还太大就一档档缩小。
const PAYLOAD_BUDGET = 3_500_000
const SHRINK_STEPS = [
  { width: 1280, pixels: 4_000_000, quality: 0.85 },
  { width: 1080, pixels: 3_000_000, quality: 0.75 },
  { width: 900, pixels: 2_000_000, quality: 0.65 },
  { width: 720, pixels: 1_500_000, quality: 0.6 },
]

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function shrinkToBase64(src: string, step: (typeof SHRINK_STEPS)[number]) {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  const scale = Math.min(1, step.width / w, Math.sqrt(step.pixels / (w * h)))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', step.quality).split(',')[1]
}

async function shrinkAll(items: ScreenshotItem[]) {
  for (const step of SHRINK_STEPS) {
    const encoded = await Promise.all(items.map(item => shrinkToBase64(item.preview, step)))
    if (encoded.reduce((sum, b) => sum + b.length, 0) <= PAYLOAD_BUDGET) return encoded
  }
  return null
}

// 上传菜谱截图，让 AI 识别，结果交给父组件填进表单
function AiExtractPanel({ onResult }: { onResult: (r: ExtractedRecipe) => void }) {
  const { t } = useLang()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<ScreenshotItem[]>([])
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function handleFiles(files: FileList | null) {
    if (!files) return
    setError('')
    setDone(false)
    const added = Array.from(files).map(file => ({ preview: URL.createObjectURL(file) }))
    setImages(prev => [...prev, ...added])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(images[index].preview)
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  async function handleExtract() {
    setExtracting(true)
    setError('')
    try {
      const encoded = await shrinkAll(images)
      if (!encoded) {
        setError(t.screenshotsTooBig)
        return
      }
      // 带上登录凭证：网站公开后，只有登录的人才能用 AI（不然谁都能花你的 Gemini 额度）
      const { data: { session } } = await createClient().auth.getSession()
      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          images: encoded.map(imageBase64 => ({ imageBase64, mimeType: 'image/jpeg' })),
        }),
      })
      const text = await res.text()
      let data: { result?: ExtractedRecipe; error?: string }
      try {
        data = JSON.parse(text)
      } catch {
        setError(t.notJson + text.slice(0, 200))
        return
      }
      if (!res.ok || data.error || !data.result) {
        setError(data.error || t.apiError + res.status)
      } else {
        onResult(data.result)
        setDone(true)
      }
    } catch {
      setError(t.networkError)
    } finally {
      setExtracting(false)
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-mizu w-full">
        <SparkleIcon /> {t.aiFillButton}
      </button>
    )
  }

  return (
    <div className="rounded-[1.5rem] border-[3px] border-dashed border-ink bg-mizu-pale p-4 space-y-3">
      <p className="hint leading-relaxed">{t.uploadScreenshotsHint}</p>

      <div className="grid grid-cols-4 gap-2">
        {images.map((img, i) => (
          <div key={img.preview} className="relative aspect-square rounded-xl overflow-hidden border-[2.5px] border-ink bg-white">
            <img src={img.preview} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 w-6 h-6 bg-white border-2 border-ink rounded-full text-[10px] flex items-center justify-center"
              aria-label="✕"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square rounded-xl border-[2.5px] border-dashed border-ink bg-white flex flex-col items-center justify-center text-xs gap-0.5"
        >
          <PlusIcon size={20} />
          {t.screenshot}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {images.length > 0 && (
        <button type="button" onClick={handleExtract} disabled={extracting} className="btn btn-coral w-full">
          <SparkleIcon /> {extracting ? t.extracting : t.startExtract(images.length)}
        </button>
      )}

      {done && <p className="text-sm">{t.aiFilled}</p>}
      {error && <p className="sticker bg-coral-pale text-sm leading-relaxed">{error}</p>}
    </div>
  )
}

// 菜谱部分：可以自己写，也可以用 AI 识别截图来填
export default function RecipeFields({ value, onChange, onExtracted }: {
  value: RecipeValue
  onChange: (next: RecipeValue) => void
  // AI 识别出的菜名、分类、标签、小贴士交给父组件决定怎么填
  onExtracted?: (r: ExtractedRecipe) => void
}) {
  const { t } = useLang()
  const set = (patch: Partial<RecipeValue>) => onChange({ ...value, ...patch })

  function applyExtracted(r: ExtractedRecipe) {
    onChange({
      cookingTime: r.cooking_time || value.cookingTime,
      difficulty: r.difficulty || value.difficulty,
      ingredients: r.ingredients?.length ? r.ingredients.join('\n') : value.ingredients,
      steps: r.steps?.length ? r.steps.join('\n') : value.steps,
    })
    onExtracted?.(r)
  }

  return (
    <section className="space-y-5">
      <div>
        <span className="sticker bg-wakatake">{t.recipe}</span>
        <p className="hint mt-2">{t.recipeHint}</p>
      </div>

      <AiExtractPanel onResult={applyExtracted} />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label">{t.cookingTime}</label>
          <input
            value={value.cookingTime}
            onChange={e => set({ cookingTime: e.target.value })}
            placeholder={t.cookingTimePlaceholder}
            className="field"
          />
        </div>
        <div className="flex-1">
          <label className="label">{t.difficulty}</label>
          <DifficultySelect value={value.difficulty} onChange={difficulty => set({ difficulty })} />
        </div>
      </div>

      <div>
        <label className="label">
          {t.ingredients} <span className="hint">{t.onePerLine}</span>
        </label>
        <textarea
          value={value.ingredients}
          onChange={e => set({ ingredients: e.target.value })}
          rows={6}
          placeholder={t.ingredientsPlaceholder}
          className="field resize-y"
        />
      </div>

      <div>
        <label className="label">
          {t.steps} <span className="hint">{t.oneStepPerLine}</span>
        </label>
        <textarea
          value={value.steps}
          onChange={e => set({ steps: e.target.value })}
          rows={8}
          placeholder={t.stepsPlaceholder}
          className="field resize-y"
        />
      </div>
    </section>
  )
}

export function cleanLines(text: string) {
  return text.split('\n').map(s => s.trim()).filter(Boolean).join('\n')
}

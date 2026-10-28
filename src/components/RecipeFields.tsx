'use client'

import { useRef, useState } from 'react'
import { useLang } from '@/lib/i18n'
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
  base64: string
  mimeType: string
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
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const result = ev.target?.result as string
        setImages(prev => [...prev, {
          preview: URL.createObjectURL(file),
          base64: result.split(',')[1],
          mimeType: file.type || 'image/jpeg',
        }])
      }
      reader.readAsDataURL(file)
    })
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
      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map(img => ({ imageBase64: img.base64, mimeType: img.mimeType })),
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

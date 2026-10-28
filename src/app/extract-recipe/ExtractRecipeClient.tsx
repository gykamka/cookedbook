'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { TopBar } from '@/components/ui'
import { DifficultySelect } from '@/components/DishFields'
import { PlusIcon, SparkleIcon, SoupBowl } from '@/components/Illustrations'
import type { ExtractedRecipe } from '@/types'

type ImageItem = {
  preview: string
  base64: string
  mimeType: string
}

export default function ExtractRecipeClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dishId = searchParams.get('dishId')
  const supabase = createClient()
  const { t } = useLang()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedRecipe | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // 编辑提取结果的状态
  const [editName, setEditName] = useState('')
  const [editCookingTime, setEditCookingTime] = useState('')
  const [editDifficulty, setEditDifficulty] = useState('')
  const [editIngredients, setEditIngredients] = useState('')
  const [editSteps, setEditSteps] = useState('')
  const [editNotes, setEditNotes] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setExtracted(null)
    setError('')

    // 每个文件转成 base64
    Array.from(files).forEach(file => {
      const preview = URL.createObjectURL(file)
      const mimeType = file.type || 'image/jpeg'
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        const base64 = result.split(',')[1]
        setImages(prev => [...prev, { preview, base64, mimeType }])
      }
      reader.readAsDataURL(file)
    })

    // 清空 input，允许重复选同一文件
    e.target.value = ''
  }

  function removeImage(index: number) {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
    setExtracted(null)
  }

  async function handleExtract() {
    if (images.length === 0) return
    setExtracting(true)
    setError('')

    try {
      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map(img => ({
            imageBase64: img.base64,
            mimeType: img.mimeType,
          })),
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
        const r = data.result
        setExtracted(r)
        setEditName(r.name || '')
        setEditCookingTime(r.cooking_time || '')
        setEditDifficulty(r.difficulty || '')
        setEditIngredients(r.ingredients?.join('\n') || '')
        setEditSteps(r.steps?.join('\n') || '')
        setEditNotes(r.notes || '')
      }
    } catch {
      setError(t.networkError)
    } finally {
      setExtracting(false)
    }
  }

  async function handleSave() {
    if (!dishId) return
    setSaving(true)

    const ingredients = editIngredients.split('\n').filter(s => s.trim()).join('\n')
    const steps = editSteps.split('\n').filter(s => s.trim()).join('\n')

    await supabase.from('dishes').update({
      ingredients: ingredients || null,
      steps: steps || null,
      cooking_time: editCookingTime.trim() || null,
      difficulty: editDifficulty.trim() || null,
      notes: editNotes.trim() || null,
      ...(editName.trim() ? { name: editName.trim() } : {}),
    }).eq('id', dishId)

    setSaving(false)
    router.push(`/dish/${dishId}`)
  }

  return (
    <main className="min-h-screen pb-12">
      <TopBar title={t.extractTitle} />

      <div className="px-5 py-6 space-y-6 max-w-lg mx-auto">

        <div>
          <p className="label">{t.uploadScreenshots}</p>
          <p className="hint mb-3 leading-relaxed">{t.uploadScreenshotsHint}</p>

          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div key={img.preview} className="relative aspect-square rounded-2xl overflow-hidden border-[3px] border-ink bg-white">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-white border-2 border-ink rounded-full text-xs flex items-center justify-center"
                    aria-label="✕"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-1.5 left-1.5 w-6 h-6 bg-mizu border-2 border-ink rounded-full text-xs flex items-center justify-center">
                    {i + 1}
                  </div>
                </div>
              ))}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-[3px] border-dashed border-ink bg-white flex flex-col items-center justify-center gap-1 text-sm"
              >
                <PlusIcon />
                <span>{t.addMore}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 rounded-[1.5rem] border-[3px] border-dashed border-ink bg-mizu-pale flex flex-col items-center justify-center gap-2"
            >
              <SoupBowl size={72} />
              <span className="text-lg">{t.tapToUpload}</span>
              <span className="hint">{t.multiSelectHint}</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {images.length > 0 && !extracted && (
          <button
            onClick={handleExtract}
            disabled={extracting}
            className="btn btn-coral w-full py-3.5 text-lg"
          >
            <SparkleIcon /> {extracting ? t.extracting : t.startExtract(images.length)}
          </button>
        )}

        {error && <p className="sticker bg-coral-pale text-sm leading-relaxed">{error}</p>}

        {/* 提取结果 — 可编辑 */}
        {extracted && (
          <div className="card p-5 space-y-5">
            <div>
              <span className="sticker bg-yamabuki">{t.reviewTitle}</span>
              <p className="hint mt-2">{t.reviewHint}</p>
            </div>

            <div>
              <label className="label">{t.dishName}</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} className="field" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">{t.cookingTime}</label>
                <input
                  value={editCookingTime}
                  onChange={e => setEditCookingTime(e.target.value)}
                  placeholder={t.cookingTimePlaceholder}
                  className="field"
                />
              </div>
              <div className="flex-1">
                <label className="label">{t.difficulty}</label>
                <DifficultySelect value={editDifficulty} onChange={setEditDifficulty} />
              </div>
            </div>

            <div>
              <label className="label">
                {t.ingredients} <span className="hint">{t.onePerLine}</span>
              </label>
              <textarea
                value={editIngredients}
                onChange={e => setEditIngredients(e.target.value)}
                rows={6}
                className="field resize-none"
              />
            </div>

            <div>
              <label className="label">
                {t.steps} <span className="hint">{t.oneStepPerLine}</span>
              </label>
              <textarea
                value={editSteps}
                onChange={e => setEditSteps(e.target.value)}
                rows={8}
                className="field resize-none"
              />
            </div>

            <div>
              <label className="label">{t.tips}</label>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={3}
                className="field resize-none"
              />
            </div>

            <button onClick={handleExtract} disabled={extracting} className="btn w-full">
              {extracting ? t.reExtracting : t.reExtract}
            </button>

            <button onClick={handleSave} disabled={saving} className="btn btn-coral w-full py-3.5 text-lg">
              {saving ? t.saving : t.saveRecipe}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

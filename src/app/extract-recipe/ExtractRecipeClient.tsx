'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
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

    const newFiles = Array.from(files)
    setExtracted(null)
    setError('')

    // 每个文件转成 base64
    newFiles.forEach(file => {
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
      let data: any
      try {
        data = JSON.parse(text)
      } catch {
        setError(`接口返回的不是 JSON：${text.slice(0, 200)}`)
        return
      }

      if (!res.ok || data.error) {
        setError(data.error || `接口错误：${res.status}`)
      } else {
        const r: ExtractedRecipe = data.result
        setExtracted(r)
        setEditName(r.name || '')
        setEditCookingTime(r.cooking_time || '')
        setEditDifficulty(r.difficulty || '')
        setEditIngredients(r.ingredients?.join('\n') || '')
        setEditSteps(r.steps?.join('\n') || '')
        setEditNotes(r.notes || '')
      }
    } catch {
      setError('网络错误，请重试')
    }

    setExtracting(false)
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
    <main className="min-h-screen pb-10" style={{ background: '#fdf8f0' }}>
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-amber-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-amber-900">AI 提取菜谱</h1>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">

        {/* 上传区域 */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">上传菜谱截图</p>
          <p className="text-xs text-gray-400 mb-3">
            可上传多张，比如一张食材、一张步骤，AI 会合并识别
          </p>

          {/* 已上传的图片网格 */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black/40 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {i + 1}
                  </div>
                </div>
              ))}

              {/* 继续添加按钮 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 flex flex-col items-center justify-center gap-1 text-amber-400"
              >
                <span className="text-xl">+</span>
                <span className="text-xs">继续添加</span>
              </button>
            </div>
          )}

          {/* 没有图片时的上传区域 */}
          {images.length === 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50 flex flex-col items-center justify-center gap-2 text-amber-400"
            >
              <span className="text-4xl">📋</span>
              <span className="text-sm">点击上传菜谱截图</span>
              <span className="text-xs text-gray-400">可多选，支持拍照或从相册选择</span>
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

        {/* 提取按钮 */}
        {images.length > 0 && !extracted && (
          <button
            onClick={handleExtract}
            disabled={extracting}
            className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-medium text-lg disabled:opacity-50"
          >
            {extracting
              ? '✨ AI 识别中，请稍候...'
              : `✨ 开始提取菜谱${images.length > 1 ? `（${images.length} 张）` : ''}`
            }
          </button>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* 提取结果 — 可编辑 */}
        {extracted && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h2 className="font-semibold text-gray-800">检查并修改提取结果</h2>
            </div>
            <p className="text-xs text-gray-400 -mt-3">AI 识别可能有误，请检查后再保存</p>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">菜名</label>
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">烹饪时间</label>
                <input value={editCookingTime} onChange={e => setEditCookingTime(e.target.value)}
                  placeholder="如：30分钟"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">难度</label>
                <select value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm">
                  <option value="">未知</option>
                  <option value="简单">简单</option>
                  <option value="中等">中等</option>
                  <option value="困难">困难</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                食材 <span className="text-gray-400 font-normal">（每行一个）</span>
              </label>
              <textarea value={editIngredients} onChange={e => setEditIngredients(e.target.value)}
                rows={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none text-sm font-mono" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                步骤 <span className="text-gray-400 font-normal">（每行一个步骤）</span>
              </label>
              <textarea value={editSteps} onChange={e => setEditSteps(e.target.value)}
                rows={8}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">备注 / 小贴士</label>
              <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none text-sm" />
            </div>

            <button onClick={handleExtract} disabled={extracting}
              className="w-full border border-amber-300 text-amber-600 py-2.5 rounded-xl text-sm font-medium">
              {extracting ? '重新识别中...' : '效果不好？重新提取'}
            </button>

            <button onClick={handleSave} disabled={saving}
              className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-medium text-lg disabled:opacity-50">
              {saving ? '保存中...' : '保存菜谱'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
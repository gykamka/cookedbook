'use client'

import ImageUploader, { type UploadedImage } from '@/components/ImageUploader'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const DEFAULT_CATEGORIES = ['凉菜', '热菜', '炖菜', '汤', '主食', '饮料', '甜品', '外卖']

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i === value ? 0 : i)}
          className={`text-3xl transition-colors ${i <= value ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function AddDishPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState('')

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const finalCategory = category === '__custom__' ? customCategory.trim() : category

  // 保存菜到数据库，返回 dish id
  async function saveDish(): Promise<string | null> {
    if (!name.trim()) { setError('请输入菜名'); return null }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return null }

    const { data: dish, error: dishError } = await supabase
      .from('dishes')
      .insert({
        user_id: user.id,
        name: name.trim(),
        category: finalCategory || null,
        notes: notes.trim() || null,
        rating: rating || null,
        tags: tags.length > 0 ? tags.join(',') : null,
        image_url: images[0]?.url ?? null,
      })
      .select()
      .single()

    if (dishError || !dish) {
      setError('保存失败，请重试')
      setLoading(false)
      return null
    }

    if (images.length > 0) {
      await supabase.from('dish_images').insert(
        images.map((img, i) => ({
          dish_id: dish.id,
          url: img.url,
          path: img.path,
          sort_order: i,
        }))
      )
    }

    return dish.id
  }

  // 保存并跳到 AI 提取菜谱页
  async function handleSaveAndExtract() {
    const id = await saveDish()
    if (id) router.push(`/extract-recipe?dishId=${id}`)
  }

  // 直接保存，回菜单
  async function handleSaveOnly() {
    const id = await saveDish()
    if (id) router.push('/menu')
  }

  return (
    <main className="min-h-screen pb-10" style={{ background: '#fdf8f0' }}>
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-amber-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-amber-900">添加一道菜</h1>
      </div>

      {/* ↓ 这个 div 包住所有表单内容，一直到最后的按钮 */}
      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">

        {/* 菜名 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            菜名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="比如：番茄炒蛋"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800"
          />
        </div>

        {/* 菜的照片 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">菜的照片</label>
          <p className="text-xs text-gray-400 mb-2">可拍照或从相册选，第一张为封面，最多 9 张</p>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        {/* 评分 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">评分</label>
          <StarPicker value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-xs text-amber-500 mt-1">
              {['', '一般般', '还不错', '挺好吃', '非常好吃', '满分！必须再做！'][rating]}
            </p>
          )}
        </div>

        {/* 分类 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">分类</label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(category === cat ? '' : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                category === cat
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
          {/* 已确认的自定义分类也显示成一个选中的 tag */}
          {category !== '__custom__' && !DEFAULT_CATEGORIES.includes(category) && category !== '' && (
            <button
              type="button"
              onClick={() => { setCategory('__custom__'); setCustomCategory(category) }}
              className="px-4 py-2 rounded-full text-sm font-medium border bg-amber-500 text-white border-amber-500"
            >
              {category} ✕
            </button>
          )}
          <button
            type="button"
            onClick={() => setCategory(category === '__custom__' ? '' : '__custom__')}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              category === '__custom__'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            ＋ 自定义
          </button>
        </div>

        {category === '__custom__' && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="输入分类名，比如：家常菜..."
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customCategory.trim()) {
                  e.preventDefault()
                  setCategory(customCategory.trim())
                  setCustomCategory('')
                }
              }}
              className="flex-1 border border-amber-300 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                if (customCategory.trim()) {
                  setCategory(customCategory.trim())
                  setCustomCategory('')
                }
              }}
              className="bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap"
            >
              确认
            </button>
          </div>
        )}
      </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">标签</label>
          <p className="text-xs text-gray-400 mb-2">比如：辣、快手菜、下饭、朋友来了必做...</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="输入标签，回车添加"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
            />
            <button
              type="button"
              onClick={addTag}
              className="bg-amber-100 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap"
            >
              添加
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                    className="text-amber-400 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 备注 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">备注</label>
          <textarea
            placeholder="比如：第一次做，少放了盐还不错；下次试试加点糖..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none text-sm text-gray-800"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* 按钮在这里，还在同一个 div 里面 */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleSaveAndExtract}
            disabled={loading}
            className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-medium text-base disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存，并用 AI 添加菜谱 ✨'}
          </button>
          <button
            type="button"
            onClick={handleSaveOnly}
            disabled={loading}
            className="w-full border border-gray-200 text-gray-500 py-3 rounded-xl text-sm disabled:opacity-50"
          >
            没有菜谱，直接保存
          </button>
        </div>

      </div> {/* ← 这里才关闭 */}
    </main>
  )
}
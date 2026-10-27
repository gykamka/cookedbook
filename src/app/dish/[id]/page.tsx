'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ImageUploader, { type UploadedImage } from '@/components/ImageUploader'
import type { Dish } from '@/types'

const DEFAULT_CATEGORIES = ['凉菜', '热菜', '炖菜', '汤', '主食', '饮料', '甜品', '外卖']

function StarPicker({ value, onChange, readOnly = false }: {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => !readOnly && onChange && onChange(i === value ? 0 : i)}
          disabled={readOnly}
          className={`text-2xl transition-colors ${
            i <= value ? 'text-amber-400' : 'text-gray-200'
          } ${readOnly ? 'cursor-default' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function DishPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [dish, setDish] = useState<Dish | null>(null)
const [loading, setLoading] = useState(true)
const [editing, setEditing] = useState(false)
const [saving, setSaving] = useState(false)
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
const [currentImageIndex, setCurrentImageIndex] = useState(0)

// 图片状态
const [images, setImages] = useState<UploadedImage[]>([])
// 记录进入编辑时的原始图片，取消时用来对比删除新上传的
const [originalImagePaths, setOriginalImagePaths] = useState<string[]>([])

// 编辑表单状态
const [name, setName] = useState('')
const [category, setCategory] = useState('')
const [customCategory, setCustomCategory] = useState('')
const [notes, setNotes] = useState('')
const [rating, setRating] = useState(0)
const [tags, setTags] = useState<string[]>([])
const [tagInput, setTagInput] = useState('')
const [ingredients, setIngredients] = useState('')
const [steps, setSteps] = useState('')
const [cookingTime, setCookingTime] = useState('')
const [difficulty, setDifficulty] = useState('')

  useEffect(() => {
    if (id) loadDish()
  }, [id])

 async function loadDish() {
  const [{ data: dishData, error: dishError }, { data: imgData }] = await Promise.all([
    supabase.from('dishes').select('*').eq('id', id).single(),
    supabase.from('dish_images').select('*').eq('dish_id', id).order('order', { ascending: true })
  ])

  if (dishError || !dishData) { router.push('/menu'); return }

  setDish(dishData)
  setName(dishData.name)
  const isDefault = DEFAULT_CATEGORIES.includes(dishData.category ?? '')
  setCategory(dishData.category ? (isDefault ? dishData.category : '__custom__') : '')
  setCustomCategory(!isDefault ? (dishData.category ?? '') : '')
  setNotes(dishData.notes ?? '')
  setRating(dishData.rating ?? 0)
  setTags(dishData.tags ? dishData.tags.split(',').filter(Boolean) : [])
  setIngredients(dishData.ingredients ?? '')
  setSteps(dishData.steps ?? '')
  setCookingTime(dishData.cooking_time ?? '')
  setDifficulty(dishData.difficulty ?? '')

  const loadedImages = imgData && imgData.length > 0
    ? imgData.map(img => ({ url: img.url, path: img.path, preview: img.url }))
    : dishData.image_url
      ? [{ url: dishData.image_url, path: '', preview: dishData.image_url }]
      : []

  setImages(loadedImages)
  setOriginalImagePaths(loadedImages.map(img => img.path))
  setCurrentImageIndex(0)
  setLoading(false)
}

  const finalCategory = category === '__custom__' ? customCategory.trim() : category

  async function handleSave() {
  if (!name.trim()) return
  setSaving(true)

  await supabase.from('dishes').update({
    name: name.trim(),
    category: finalCategory || null,
    notes: notes.trim() || null,
    rating: rating || null,
    tags: tags.length > 0 ? tags.join(',') : null,
    image_url: images[0]?.url ?? null,
    ingredients: ingredients.trim() || null,
    steps: steps.trim() || null,
    cooking_time: cookingTime.trim() || null,
    difficulty: difficulty || null,
  }).eq('id', id)

  await supabase.from('dish_images').delete().eq('dish_id', id)
if (images.length > 0) {
  await supabase.from('dish_images').insert(
    images.map((img, i) => ({
      dish_id: id,
      url: img.url,
      path: img.path,  // path 为空字符串也正常存，不影响显示
      order: i,
    }))
  )
}
setOriginalImagePaths(images.map(img => img.path))
  setSaving(false)
  setEditing(false)
  loadDish()
}

  async function handleDelete() {
    const paths = images.map(img => img.path).filter(Boolean)
    if (paths.length > 0) {
      await supabase.storage.from('dish-images').remove(paths)
    }
    await supabase.from('dish_images').delete().eq('dish_id', id)
    await supabase.from('dishes').delete().eq('id', id)
    router.push('/menu')
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

async function handleCancelEdit() {
  // 找出这次编辑新上传的图片（不在原始列表里的）
  const newImages = images.filter(
    img => img.path !== '' && !originalImagePaths.includes(img.path)
  )
  // 从 Storage 删除这些孤儿图片
  if (newImages.length > 0) {
    await supabase.storage
      .from('dish-images')
      .remove(newImages.map(img => img.path))
  }
  setEditing(false)
  loadDish()
}

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf8f0' }}>
      <p className="text-amber-400 text-sm">加载中...</p>
    </div>
  )

  if (!dish) return null

  return (
    <main className="min-h-screen" style={{ background: '#fdf8f0' }}>

      {/* 顶栏 */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <button
          onClick={() => editing ? handleCancelEdit() : router.push('/menu')}
          className="text-amber-600 text-lg px-1"
        >
          ← 返回
        </button>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-amber-500 text-sm font-medium px-3 py-1 bg-amber-50 rounded-full"
          >
            编辑
          </button>
        )}
        {editing && (
          <span className="text-amber-800 font-medium text-sm">编辑菜谱</span>
        )}
      </div>

      {editing ? (
        /* ===== 编辑模式 ===== */
        <div className="pb-32">
          <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">图片</label>
              <ImageUploader images={images} onChange={setImages} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">菜名</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">评分</label>
              <StarPicker value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-xs text-amber-500 mt-1">
                  {['', '一般般', '还不错', '挺好吃', '非常好吃', '满分！必须再做！'][rating]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">分类</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CATEGORIES.map(cat => (
                  <button key={cat} type="button"
                    onClick={() => setCategory(category === cat ? '' : cat)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      category === cat ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200'
                    }`}>
                    {cat}
                  </button>
                ))}
                <button type="button"
                  onClick={() => setCategory(category === '__custom__' ? '' : '__custom__')}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    category === '__custom__' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  ＋ 自定义
                </button>
              </div>
              {category === '__custom__' && (
                <input placeholder="自定义分类名..." value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="mt-2 w-full border border-amber-300 rounded-xl px-4 py-2 bg-white focus:outline-none text-sm" autoFocus />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">标签</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="输入标签，回车添加"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300" />
                <button type="button" onClick={addTag}
                  className="bg-amber-100 text-amber-700 px-4 rounded-xl text-sm font-medium whitespace-nowrap">
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">
                    {tag}
                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                      className="text-amber-400 font-bold ml-0.5">×</button>
                  </span>
                ))}
              </div>
            </div>
            

              {/* 烹饪时间 + 难度 */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">烹饪时间</label>
                <input
                  value={cookingTime}
                  onChange={e => setCookingTime(e.target.value)}
                  placeholder="如：30分钟"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">难度</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
                >
                  <option value="">未知</option>
                  <option value="简单">简单</option>
                  <option value="中等">中等</option>
                  <option value="困难">困难</option>
                </select>
              </div>
            </div>

            {/* 食材 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                食材 <span className="text-gray-400 font-normal text-xs">（每行一个）</span>
              </label>
              <textarea
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
                rows={6}
                placeholder={"鸡蛋 2个\n盐 适量\n..."}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none text-sm font-mono"
              />
            </div>

            {/* 步骤 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                步骤 <span className="text-gray-400 font-normal text-xs">（每行一个步骤）</span>
              </label>
              <textarea
                value={steps}
                onChange={e => setSteps(e.target.value)}
                rows={8}
                placeholder={"第一步...\n第二步...\n..."}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none text-sm"
              />
            </div>
                        



            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">备注</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none text-sm text-gray-800" />
            </div>

            {!showDeleteConfirm ? (
              <button type="button" onClick={() => setShowDeleteConfirm(true)}
                className="w-full border border-red-200 text-red-400 py-3 rounded-xl text-sm">
                删除这道菜
              </button>
            ) : (
              <div className="border border-red-200 rounded-xl p-4 text-center space-y-3">
                <p className="text-gray-700 font-medium">确定要删除「{dish.name}」吗？</p>
                <p className="text-gray-400 text-sm">同时会删除所有图片，无法恢复</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm">取消</button>
                  <button type="button" onClick={handleDelete}
                    className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium">确认删除</button>
                </div>
              </div>
            )}
          </div>

          {/* 底部固定保存按钮 */}
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
            <button type="button" onClick={handleCancelEdit}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium">
              取消
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-medium disabled:opacity-50">
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </div>

      ) : (
  // ===== 查看模式：手帐风格 =====
  <div style={{ background: '#fdf8f0' }} className="pb-16">

    {/* 大标题区 */}
    <div className="px-5 pt-6 pb-4 text-center">
      <h1 className="text-3xl font-bold" style={{
        color: '#5c3d2e',
        fontFamily: 'Georgia, serif',
        letterSpacing: '0.05em'
      }}>
        {dish.name}
      </h1>
      {/* 装饰线 */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <div className="h-px w-12" style={{ background: '#d4a96a' }} />
        <span style={{ color: '#d4a96a' }}>✦</span>
        <div className="h-px w-12" style={{ background: '#d4a96a' }} />
      </div>

      {/* 烹饪时间 + 难度 小标签 */}
      {(dish.cooking_time || dish.difficulty) && (
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          {dish.cooking_time && (
            <span className="text-xs px-3 py-1 rounded-full border"
              style={{ color: '#a0724a', borderColor: '#e8c99a', background: '#fff8ef' }}>
              ⏱ {dish.cooking_time}
            </span>
          )}
          {dish.difficulty && (
            <span className="text-xs px-3 py-1 rounded-full border"
              style={{ color: '#a0724a', borderColor: '#e8c99a', background: '#fff8ef' }}>
              {dish.difficulty === '简单' ? '🟢' : dish.difficulty === '中等' ? '🟡' : '🔴'} {dish.difficulty}
            </span>
          )}
          {dish.rating && (
            <span className="text-xs px-3 py-1 rounded-full border"
              style={{ color: '#a0724a', borderColor: '#e8c99a', background: '#fff8ef' }}>
              {'★'.repeat(dish.rating)}{'☆'.repeat(5 - dish.rating)}
            </span>
          )}
        </div>
      )}
    </div>

    {/* 上半部分：左食材 右图片 */}
    <div className="px-4 flex gap-3 max-w-lg mx-auto">

      {/* 左：食材 */}
      <div className="flex-1 min-w-0 space-y-3">

        {/* 食材卡片 */}
        {dish.ingredients && (
          <div className="rounded-2xl p-3" style={{
            background: '#fff',
            border: '1.5px solid #f0dfc0'
          }}>
            {/* 色块标题 */}
            <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold mb-2"
              style={{ background: '#7cb987', color: '#fff' }}>
              食材
            </div>
            <div className="space-y-1">
              {dish.ingredients.split('\n').filter(Boolean).map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs"
                  style={{ color: '#5c3d2e' }}>
                  <span style={{ color: '#d4a96a' }} className="flex-shrink-0 mt-0.5">·</span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 标签卡片 */}
        {dish.tags && dish.tags.split(',').filter(Boolean).length > 0 && (
          <div className="rounded-2xl p-3" style={{
            background: '#fff',
            border: '1.5px dashed #f0dfc0'
          }}>
            <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold mb-2"
              style={{ background: '#e8a87c', color: '#fff' }}>
              标签
            </div>
            <div className="flex flex-wrap gap-1">
              {dish.tags.split(',').filter(Boolean).map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#fff8ef', color: '#a0724a', border: '1px solid #f0dfc0' }}>
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 备注卡片 */}
        {dish.notes && (
          <div className="rounded-2xl p-3" style={{
            background: '#fff',
            border: '1.5px dashed #f0dfc0'
          }}>
            <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold mb-2"
              style={{ background: '#a0c4e8', color: '#fff' }}>
              小贴士
            </div>
            <p className="text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: '#5c3d2e' }}>
              {dish.notes}
            </p>
          </div>
        )}

      </div>

      {/* 右：翻页相册 */}
      <div className="w-36 flex-shrink-0">
        {images.length > 0 ? (
          <div className="space-y-2">
            {/* 主图 — 支持左右滑动 */}
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{
                width: '100%',
                aspectRatio: '3/4',
                border: '2px solid #f0dfc0',
                background: '#fff8ef',
                boxShadow: '3px 3px 0px #e8c99a'
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0]
                e.currentTarget.dataset.touchX = String(touch.clientX)
              }}
              onTouchEnd={(e) => {
                const startX = Number(e.currentTarget.dataset.touchX)
                const endX = e.changedTouches[0].clientX
                const diff = startX - endX

                // 滑动超过 40px 才触发翻页
                if (Math.abs(diff) < 40) return

                if (diff > 0) {
                  // 左滑 → 下一张
                  setCurrentImageIndex(i => Math.min(i + 1, images.length - 1))
                } else {
                  // 右滑 → 上一张
                  setCurrentImageIndex(i => Math.max(i - 1, 0))
                }
              }}
            >
              <img
                src={images[currentImageIndex].url}
                alt={dish.name}
                className="w-full h-full object-cover"
              />

              {/* 图片上的左右箭头（只在多张时显示） */}
              {images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs
                    ${currentImageIndex === 0 ? 'opacity-0' : 'opacity-60'}
                    bg-black/30 text-white pointer-events-auto`}
                    onClick={() => setCurrentImageIndex(i => Math.max(i - 1, 0))}>
                    ‹
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs
                    ${currentImageIndex === images.length - 1 ? 'opacity-0' : 'opacity-60'}
                    bg-black/30 text-white pointer-events-auto`}
                    onClick={() => setCurrentImageIndex(i => Math.min(i + 1, images.length - 1))}>
                    ›
                  </div>
                </div>
              )}
            </div>

            {/* 缩略图横排 */}
            {images.length > 1 && (
              <div className="flex gap-1 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentImageIndex(i)}
                    className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
                    style={{
                      width: '2.4rem',
                      height: '2.4rem',
                      border: i === currentImageIndex
                        ? '2px solid #d4a96a'
                        : '2px solid transparent',
                      opacity: i === currentImageIndex ? 1 : 0.6
                    }}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* 图片计数 */}
            {images.length > 1 && (
              <p className="text-center text-xs" style={{ color: '#c4a882' }}>
                {currentImageIndex + 1} / {images.length}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl flex items-center justify-center"
            style={{
              width: '100%',
              aspectRatio: '3/4',
              background: '#fff8ef',
              border: '2px dashed #e8c99a',
              color: '#d4b896',
              fontSize: '2.5rem'
            }}>
            🍽️
          </div>
        )}
      </div>
    </div>

    {/* 下半部分：制作步骤 全宽 */}
    {dish.steps && (
      <div className="px-4 mt-4 max-w-lg mx-auto">
        <div className="rounded-2xl p-4" style={{
          background: '#fff',
          border: '1.5px solid #f0dfc0'
        }}>
          {/* 步骤标题 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold"
              style={{ background: '#e8836a', color: '#fff' }}>
              制作步骤
            </div>
            <div className="flex-1 border-b" style={{ borderColor: '#f0dfc0', borderStyle: 'dashed' }} />
          </div>

          <div className="space-y-4">
            {dish.steps.split('\n').filter(Boolean).map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                {/* 步骤编号圆圈 */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: '#e8836a', marginTop: '1px' }}>
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed flex-1"
                  style={{ color: '#5c3d2e' }}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* 底部装饰 */}
    <div className="text-center mt-6 pb-4">
      <p className="text-xs" style={{ color: '#c4a882' }}>
          添加于 {new Date(dish.created_at).toLocaleDateString('zh-CN', {
          year: 'numeric', month: 'long', day: 'numeric'
        })}
      </p>
    </div>

  </div>
)}
    </main>
  )
}
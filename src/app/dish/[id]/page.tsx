'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import ImageUploader, { type UploadedImage } from '@/components/ImageUploader'
import { Loading, StarPicker, Stars, TopBar } from '@/components/ui'
import { CategoryPicker, DifficultySelect, TagInput } from '@/components/DishFields'
import { CategoryArt, categoryTint, ClockIcon, SparkleIcon } from '@/components/Illustrations'
import type { Dish } from '@/types'

export default function DishPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const { t, lang, categoryLabel, difficultyLabel } = useLang()

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
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
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
      supabase.from('dish_images').select('*').eq('dish_id', id).order('order', { ascending: true }),
    ])

    if (dishError || !dishData) { router.push('/menu'); return }

    setDish(dishData)
    setName(dishData.name)
    setCategory(dishData.category ?? '')
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

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)

    await supabase.from('dishes').update({
      name: name.trim(),
      category: category || null,
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

  async function handleCancelEdit() {
    // 找出这次编辑新上传的图片（不在原始列表里的），从 Storage 删掉
    const newImages = images.filter(
      img => img.path !== '' && !originalImagePaths.includes(img.path)
    )
    if (newImages.length > 0) {
      await supabase.storage
        .from('dish-images')
        .remove(newImages.map(img => img.path))
    }
    setEditing(false)
    setShowDeleteConfirm(false)
    loadDish()
  }

  if (loading) return <Loading />
  if (!dish) return null

  if (editing) {
    return (
      <main className="min-h-screen pb-32">
        <TopBar title={t.editRecipe} onBack={handleCancelEdit} />

        <div className="px-5 py-6 space-y-7 max-w-lg mx-auto">
          <div>
            <label className="label">{t.images}</label>
            <ImageUploader images={images} onChange={setImages} />
          </div>

          <div>
            <label className="label">{t.dishName}</label>
            <input value={name} onChange={e => setName(e.target.value)} className="field" />
          </div>

          <div>
            <label className="label">{t.rating}</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="label">{t.category}</label>
            <CategoryPicker value={category} onChange={setCategory} />
          </div>

          <div>
            <label className="label">{t.tags}</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">{t.cookingTime}</label>
              <input
                value={cookingTime}
                onChange={e => setCookingTime(e.target.value)}
                placeholder={t.cookingTimePlaceholder}
                className="field"
              />
            </div>
            <div className="flex-1">
              <label className="label">{t.difficulty}</label>
              <DifficultySelect value={difficulty} onChange={setDifficulty} />
            </div>
          </div>

          <div>
            <label className="label">
              {t.ingredients} <span className="hint">{t.onePerLine}</span>
            </label>
            <textarea
              value={ingredients}
              onChange={e => setIngredients(e.target.value)}
              rows={6}
              placeholder={t.ingredientsPlaceholder}
              className="field resize-none"
            />
          </div>

          <div>
            <label className="label">
              {t.steps} <span className="hint">{t.oneStepPerLine}</span>
            </label>
            <textarea
              value={steps}
              onChange={e => setSteps(e.target.value)}
              rows={8}
              placeholder={t.stepsPlaceholder}
              className="field resize-none"
            />
          </div>

          <div>
            <label className="label">{t.notes}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="field resize-none" />
          </div>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 text-ink-soft underline underline-offset-4"
            >
              {t.deleteDish}
            </button>
          ) : (
            <div className="card bg-coral-pale p-5 text-center space-y-3">
              <p className="text-lg">{t.deleteConfirm(dish.name)}</p>
              <p className="hint">{t.deleteWarning}</p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn flex-1">
                  {t.cancel}
                </button>
                <button type="button" onClick={handleDelete} className="btn btn-coral flex-1">
                  {t.confirmDelete}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 底部固定保存按钮 */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-paper border-t-[3px] border-ink">
          <div className="max-w-lg mx-auto px-5 py-3 flex gap-3">
            <button type="button" onClick={handleCancelEdit} className="btn flex-1">
              {t.cancel}
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn btn-coral flex-1">
              {saving ? t.saving : t.saveChanges}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ===== 查看模式：绘本风菜谱页 =====
  const tagList = dish.tags ? dish.tags.split(',').filter(Boolean) : []
  const ingredientList = dish.ingredients ? dish.ingredients.split('\n').filter(Boolean) : []
  const stepList = dish.steps ? dish.steps.split('\n').filter(Boolean) : []

  return (
    <main className="min-h-screen pb-16">
      <TopBar
        title={dish.category ? categoryLabel(dish.category) : ''}
        onBack={() => router.push('/menu')}
        right={
          <button onClick={() => setEditing(true)} className="btn btn-yamabuki py-1.5 px-4 text-sm">
            {t.edit}
          </button>
        }
      />

      <div className="max-w-lg mx-auto px-5">

        {/* 封面：照片（可左右滑）或分类插图 */}
        <div className="pt-6">
          {images.length > 0 ? (
            <div>
              <div
                className="card card-pop overflow-hidden relative aspect-[4/3]"
                onTouchStart={(e) => {
                  e.currentTarget.dataset.touchX = String(e.touches[0].clientX)
                }}
                onTouchEnd={(e) => {
                  const diff = Number(e.currentTarget.dataset.touchX) - e.changedTouches[0].clientX
                  // 滑动超过 40px 才翻页
                  if (Math.abs(diff) < 40) return
                  setCurrentImageIndex(i => diff > 0
                    ? Math.min(i + 1, images.length - 1)
                    : Math.max(i - 1, 0))
                }}
              >
                <img
                  src={images[currentImageIndex].url}
                  alt={dish.name}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <span className="absolute bottom-2 right-2 sticker bg-white text-xs">
                    {currentImageIndex + 1} / {images.length}
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 pb-1">
                  {images.map((img, i) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setCurrentImageIndex(i)}
                      className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-[2.5px] ${
                        i === currentImageIndex ? 'border-ink' : 'border-transparent opacity-60'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              className="card aspect-[4/3] flex items-center justify-center"
              style={{ background: categoryTint(dish.category) }}
            >
              <CategoryArt category={dish.category} size={150} />
            </div>
          )}
        </div>

        {/* 菜名 + 小信息 */}
        <div className="text-center pt-6 pb-2">
          <h1 className="text-3xl tracking-wider leading-snug">{dish.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {dish.rating ? <Stars n={dish.rating} size={18} /> : null}
            {dish.cooking_time && (
              <span className="chip bg-mizu-pale text-sm">
                <ClockIcon /> {dish.cooking_time}
              </span>
            )}
            {dish.difficulty && (
              <span className="chip bg-wakatake-pale text-sm">{difficultyLabel(dish.difficulty)}</span>
            )}
          </div>
          {tagList.length > 0 && (
            <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 mt-3">
              {tagList.map(tag => (
                <span key={tag} className="text-sm text-ink-soft">#{tag.trim()}</span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 mt-5">
          {ingredientList.length > 0 && (
            <section className="card p-5">
              <span className="sticker bg-wakatake">{t.ingredients}</span>
              <ul className="mt-4 space-y-2">
                {ingredientList.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 leading-relaxed">
                    <span className="mt-2.5 w-2 h-2 rounded-full bg-wakatake border-2 border-ink flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {stepList.length > 0 && (
            <section className="card p-5">
              <span className="sticker bg-coral">{t.steps}</span>
              <ol className="mt-4 space-y-4">
                {stepList.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-yamabuki border-[2.5px] border-ink flex items-center justify-center text-sm">
                      {i + 1}
                    </span>
                    <p className="leading-relaxed flex-1 pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {dish.notes && (
            <section className="card p-5 bg-yamabuki-pale">
              <span className="sticker bg-mizu">{t.tips}</span>
              <p className="mt-3 leading-relaxed whitespace-pre-wrap">{dish.notes}</p>
            </section>
          )}

          {ingredientList.length === 0 && stepList.length === 0 && (
            <div className="card border-dashed p-6 text-center">
              <p className="text-ink-soft">{t.noRecipeYet}</p>
              <button
                onClick={() => router.push(`/extract-recipe?dishId=${dish.id}`)}
                className="btn btn-coral mt-4"
              >
                <SparkleIcon /> {t.addRecipeWithAi}
              </button>
            </div>
          )}
        </div>

        <p className="text-center hint mt-10">
          {t.addedOn(new Date(dish.created_at).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          }))}
        </p>
      </div>
    </main>
  )
}

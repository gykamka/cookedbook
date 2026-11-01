'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient, describeError } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { openDishNext } from '@/lib/book'
import ImageUploader, { type UploadedImage } from '@/components/ImageUploader'
import { Loading, StarPicker, TopBar } from '@/components/ui'
import { CategoryPicker, TagInput } from '@/components/DishFields'
import RecipeFields, { cleanLines, type RecipeValue } from '@/components/RecipeFields'
import type { Dish } from '@/types'

// 编辑一道菜。看菜谱在菜单那本书里，这里只负责改
export default function EditDishPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const { t } = useLang()

  const [dish, setDish] = useState<Dish | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
  const [recipe, setRecipe] = useState<RecipeValue>({
    cookingTime: '', difficulty: '', ingredients: '', steps: '',
  })

  async function loadDish() {
    const [{ data: dishData, error: dishError }, { data: imgData, error: imgError }] = await Promise.all([
      supabase.from('dishes').select('*').eq('id', id).single(),
      supabase.from('dish_images').select('*').eq('dish_id', id).order('sort_order', { ascending: true }),
    ])

    if (dishError || !dishData) { router.push('/menu'); return }
    if (imgError) {
      console.error('读取照片失败: ' + describeError(imgError))
      setError(t.photosLoadFailed + describeError(imgError))
    }

    setDish(dishData)
    setName(dishData.name)
    setCategory(dishData.category ?? '')
    setNotes(dishData.notes ?? '')
    setRating(dishData.rating ?? 0)
    setTags(dishData.tags ? dishData.tags.split(',').filter(Boolean) : [])
    setRecipe({
      cookingTime: dishData.cooking_time ?? '',
      difficulty: dishData.difficulty ?? '',
      ingredients: dishData.ingredients ?? '',
      steps: dishData.steps ?? '',
    })

    const loadedImages = imgData && imgData.length > 0
      ? imgData.map(img => ({ url: img.url, path: img.path, preview: img.url }))
      : dishData.image_url
        ? [{ url: dishData.image_url, path: '', preview: dishData.image_url }]
        : []

    setImages(loadedImages)
    setOriginalImagePaths(loadedImages.map(img => img.path))
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      loadDish()
    })
  }, [id])

  function backToBook() {
    openDishNext(id)
    router.push('/menu')
  }

  async function handleSave() {
    if (!name.trim()) { setError(t.nameRequired); return }
    setSaving(true)
    setError('')

    const { error: dishError } = await supabase.from('dishes').update({
      name: name.trim(),
      category: category || null,
      notes: notes.trim() || null,
      rating: rating || null,
      tags: tags.length > 0 ? tags.join(',') : null,
      image_url: images[0]?.url ?? null,
      ingredients: cleanLines(recipe.ingredients) || null,
      steps: cleanLines(recipe.steps) || null,
      cooking_time: recipe.cookingTime.trim() || null,
      difficulty: recipe.difficulty || null,
    }).eq('id', id)

    if (dishError) {
      console.error('保存失败: ' + describeError(dishError))
      setError(t.saveFailed)
      setSaving(false)
      return
    }

    await supabase.from('dish_images').delete().eq('dish_id', id)
    if (images.length > 0) {
      const { error: imgError } = await supabase.from('dish_images').insert(
        images.map((img, i) => ({
          dish_id: id,
          url: img.url,
          path: img.path,  // path 为空字符串也正常存，不影响显示
          sort_order: i,
        }))
      )
      // 照片没存进去就留在这页，把原因显示出来
      if (imgError) {
        console.error('保存照片失败: ' + describeError(imgError))
        setError(t.photosSaveFailed + describeError(imgError))
        setSaving(false)
        return
      }
    }

    // 编辑时删掉或裁剪替换掉的旧图，保存后才从 Storage 删
    const keptPaths = images.map(img => img.path)
    const removedPaths = originalImagePaths.filter(p => p && !keptPaths.includes(p))
    if (removedPaths.length > 0) {
      await supabase.storage.from('dish-images').remove(removedPaths)
    }
    backToBook()
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

  async function handleCancel() {
    // 找出这次编辑新上传的图片（不在原始列表里的），从 Storage 删掉
    const newImages = images.filter(
      img => img.path !== '' && !originalImagePaths.includes(img.path)
    )
    if (newImages.length > 0) {
      await supabase.storage
        .from('dish-images')
        .remove(newImages.map(img => img.path))
    }
    backToBook()
  }

  if (loading) return <Loading />
  if (!dish) return null

  return (
    <main className="min-h-screen pb-32">
      <TopBar title={t.editRecipe} onBack={handleCancel} />

      <div className="px-5 py-6 space-y-7 max-w-lg mx-auto">
        <div>
          <label className="label">{t.photos}</label>
          <ImageUploader images={images} onChange={setImages} keepPaths={originalImagePaths} />
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

        <div className="card p-5">
          <RecipeFields value={recipe} onChange={setRecipe} />
        </div>

        <div>
          <label className="label">{t.notes}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="field resize-y" />
        </div>

        {error && <p className="sticker bg-coral-pale text-sm leading-relaxed">{error}</p>}

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
          <button type="button" onClick={handleCancel} className="btn flex-1">
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

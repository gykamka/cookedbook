'use client'

import ImageUploader, { type UploadedImage } from '@/components/ImageUploader'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, describeError } from '@/lib/supabase'
import { DEFAULT_CATEGORIES, useLang } from '@/lib/i18n'
import { StarPicker, TopBar } from '@/components/ui'
import { CategoryPicker, TagInput } from '@/components/DishFields'
import RecipeFields, { cleanLines, type RecipeValue } from '@/components/RecipeFields'
import { openDishNext } from '@/lib/book'
import type { ExtractedRecipe } from '@/types'

export default function AddDishPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLang()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [recipe, setRecipe] = useState<RecipeValue>({
    cookingTime: '', difficulty: '', ingredients: '', steps: '',
  })
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState('')

  // AI 识别结果：只填用户还没填的地方，标签合并
  function handleExtracted(r: ExtractedRecipe) {
    if (!name.trim() && r.name) setName(r.name)
    if (!category && DEFAULT_CATEGORIES.includes(r.category)) setCategory(r.category)
    if (r.tags?.length) setTags(prev => [...new Set([...prev, ...r.tags])])
    if (!notes.trim() && r.notes) setNotes(r.notes)
  }

  async function handleSave() {
    if (!name.trim()) { setError(t.nameRequired); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: dish, error: dishError } = await supabase
      .from('dishes')
      .insert({
        user_id: user.id,
        name: name.trim(),
        category: category || null,
        notes: notes.trim() || null,
        rating: rating || null,
        tags: tags.length > 0 ? tags.join(',') : null,
        image_url: images[0]?.url ?? null,
        cooking_time: recipe.cookingTime.trim() || null,
        difficulty: recipe.difficulty || null,
        ingredients: cleanLines(recipe.ingredients) || null,
        steps: cleanLines(recipe.steps) || null,
      })
      .select()
      .single()

    if (dishError || !dish) {
      setError(t.saveFailed)
      setLoading(false)
      return
    }

    if (images.length > 0) {
      const { error: imgError } = await supabase.from('dish_images').insert(
        images.map((img, i) => ({
          dish_id: dish.id,
          url: img.url,
          path: img.path,
          sort_order: i,
        }))
      )
      // 菜已经存好了，照片没存进去就去编辑页，把原因显示出来再重试
      if (imgError) {
        console.error('保存照片失败: ' + describeError(imgError))
        setError(t.photosSaveFailed + describeError(imgError))
        setLoading(false)
        return
      }
    }

    openDishNext(dish.id)
    router.push('/menu')
  }

  return (
    <main className="min-h-screen pb-12">
      <TopBar title={t.addDish} />

      <div className="px-5 py-6 space-y-7 max-w-lg mx-auto">

        <div>
          <label className="label">
            {t.dishName} <span className="text-coral">*</span>
          </label>
          <input
            type="text"
            placeholder={t.dishNamePlaceholder}
            value={name}
            onChange={e => setName(e.target.value)}
            className="field"
          />
        </div>

        <div>
          <label className="label">{t.photos}</label>
          <p className="hint mb-3">{t.photosHint}</p>
          <ImageUploader images={images} onChange={setImages} />
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
          <p className="hint mb-3">{t.tagsHint}</p>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        <div className="card p-5">
          <RecipeFields value={recipe} onChange={setRecipe} onExtracted={handleExtracted} />
        </div>

        <div>
          <label className="label">{t.notes}</label>
          <textarea
            placeholder={t.notesPlaceholder}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="field resize-y"
          />
        </div>

        {error && <p className="sticker bg-coral-pale">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="btn btn-coral w-full py-3.5 text-lg"
        >
          {loading ? t.saving : t.save}
        </button>
      </div>
    </main>
  )
}

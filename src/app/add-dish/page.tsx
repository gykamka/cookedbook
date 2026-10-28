'use client'

import ImageUploader, { type UploadedImage } from '@/components/ImageUploader'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { StarPicker, TopBar } from '@/components/ui'
import { CategoryPicker, TagInput } from '@/components/DishFields'
import { SparkleIcon } from '@/components/Illustrations'

export default function AddDishPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLang()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState('')

  // 保存菜到数据库，返回 dish id
  async function saveDish(): Promise<string | null> {
    if (!name.trim()) { setError(t.nameRequired); return null }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return null }

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
      })
      .select()
      .single()

    if (dishError || !dish) {
      setError(t.saveFailed)
      setLoading(false)
      return null
    }

    if (images.length > 0) {
      await supabase.from('dish_images').insert(
        images.map((img, i) => ({
          dish_id: dish.id,
          url: img.url,
          path: img.path,
          order: i,
        }))
      )
    }

    return dish.id
  }

  // 保存并跳到 AI 识别菜谱页
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

        <div>
          <label className="label">{t.notes}</label>
          <textarea
            placeholder={t.notesPlaceholder}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="field resize-none"
          />
        </div>

        {error && <p className="sticker bg-coral-pale">{error}</p>}

        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={handleSaveAndExtract}
            disabled={loading}
            className="btn btn-coral w-full py-3.5"
          >
            {loading ? t.saving : <><SparkleIcon /> {t.saveAndExtract}</>}
          </button>
          <button
            type="button"
            onClick={handleSaveOnly}
            disabled={loading}
            className="btn w-full"
          >
            {t.saveOnly}
          </button>
        </div>
      </div>
    </main>
  )
}

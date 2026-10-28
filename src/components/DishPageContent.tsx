'use client'

import { useLang } from '@/lib/i18n'
import Gallery from './Gallery'
import { Stars } from './ui'
import { CategoryArt, categoryTint, ClockIcon } from './Illustrations'
import type { Dish } from '@/types'

// 带框的一小块，标题像贴纸一样贴在框的上边
function Framed({ label, color, tint = 'bg-white', children }: {
  label: string
  color: string
  tint?: string
  children: React.ReactNode
}) {
  return (
    <section className={`relative rounded-2xl border-[2.5px] border-ink ${tint} px-4 pt-6 pb-4`}>
      <span className={`sticker ${color} absolute -top-3.5 left-4`}>{label}</span>
      {children}
    </section>
  )
}

// 书里一道菜的那一页
export default function DishPageContent({ dish, photos, onEdit }: {
  dish: Dish
  photos: string[]
  onEdit: () => void
}) {
  const { t, lang, difficultyLabel } = useLang()
  const tagList = dish.tags ? dish.tags.split(',').filter(Boolean) : []
  const ingredientList = dish.ingredients ? dish.ingredients.split('\n').filter(Boolean) : []
  const stepList = dish.steps ? dish.steps.split('\n').filter(Boolean) : []

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button type="button" onClick={onEdit} className="chip bg-yamabuki text-sm">
          ✎ {t.edit}
        </button>
      </div>

      {/* 封面：照片（可左右滑）或分类插图，占页面宽度的三分之二左右，留出下面的菜谱 */}
      <div data-no-flip className="w-[68%] max-w-56 mx-auto">
        {photos.length > 0 ? (
          <Gallery urls={photos} alt={dish.name} />
        ) : (
          <div
            className="card aspect-square flex items-center justify-center"
            style={{ background: categoryTint(dish.category) }}
          >
            <CategoryArt category={dish.category} size={90} />
          </div>
        )}
      </div>

      <div className="text-center pt-5">
        <h1 className="text-2xl tracking-wider leading-snug">{dish.name}</h1>
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          {dish.rating ? <Stars n={dish.rating} size={16} /> : null}
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

      <div className="mt-7 space-y-7">
        {ingredientList.length > 0 && (
          <Framed label={t.ingredients} color="bg-wakatake">
            {/* 固定分成左右两栏，中间一条虚线；每个食材照原样写，长的就在自己那栏里换行 */}
            <ul
              className="columns-2 gap-x-7"
              style={{ columnRule: '2px dashed rgb(62 58 57 / 0.2)' }}
            >
              {ingredientList.map((item, i) => (
                <li key={i} className="flex items-start gap-2 break-inside-avoid pb-2.5 leading-snug break-words">
                  <span className="mt-[0.45em] w-1.5 h-1.5 rounded-full bg-wakatake ring-2 ring-ink flex-shrink-0" />
                  <span className="min-w-0">{item.trim()}</span>
                </li>
              ))}
            </ul>
          </Framed>
        )}

        {stepList.length > 0 && (
          <Framed label={t.steps} color="bg-coral">
            <ol className="space-y-4">
              {stepList.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-yamabuki border-[2.5px] border-ink flex items-center justify-center text-sm">
                    {i + 1}
                  </span>
                  <p className="leading-relaxed flex-1 pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </Framed>
        )}

        {dish.notes && (
          <Framed label={t.tips} color="bg-mizu" tint="bg-yamabuki-pale">
            <p className="leading-relaxed whitespace-pre-wrap">{dish.notes}</p>
          </Framed>
        )}

        {ingredientList.length === 0 && stepList.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-ink-soft">{t.noRecipeYet}</p>
            <button type="button" onClick={onEdit} className="btn btn-coral mt-4">
              {t.writeRecipe}
            </button>
          </div>
        )}
      </div>

      <p className="text-center hint mt-3">
        {t.addedOn(new Date(dish.created_at).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        }))}
      </p>
    </div>
  )
}

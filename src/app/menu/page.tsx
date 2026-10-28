'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { DEFAULT_CATEGORIES, useLang } from '@/lib/i18n'
import { LangSwitch, Stars } from '@/components/ui'
import {
  CategoryArt, categoryTint, PlusIcon, SearchIcon, Onigiri,
} from '@/components/Illustrations'
import type { Dish } from '@/types'

const ALL = '__all__'

export default function MenuPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, categoryLabel } = useLang()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [menuName, setMenuName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL)

  async function loadDishes() {
    const { data } = await supabase
      .from('dishes').select('*').order('created_at', { ascending: false })
    if (data) setDishes(data)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const saved = data.user.user_metadata?.menu_name
      if (saved) setMenuName(saved)
      loadDishes()
    })
  }, [])

  async function saveMenuName() {
    const val = tempName.trim()
    if (!val) return
    await supabase.auth.updateUser({ data: { menu_name: val } })
    setMenuName(val)
    setEditingName(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 有菜的分类才出现在筛选栏，默认分类排前面
  const categories = useMemo(() => {
    const used = new Set(dishes.map(d => d.category || ''))
    const custom = [...used].filter(c => c && !DEFAULT_CATEGORIES.includes(c))
    const ordered = [...DEFAULT_CATEGORIES.filter(c => used.has(c)), ...custom]
    if (used.has('')) ordered.push('')
    return ordered
  }, [dishes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return dishes.filter(d => {
      if (activeCategory !== ALL && (d.category || '') !== activeCategory) return false
      if (!q) return true
      return [d.name, d.ingredients, d.tags, d.notes]
        .some(field => field?.toLowerCase().includes(q))
    })
  }, [dishes, query, activeCategory])

  const grouped = useMemo(() => {
    const groups = new Map<string, Dish[]>()
    for (const cat of categories) groups.set(cat, [])
    for (const d of filtered) groups.get(d.category || '')?.push(d)
    return [...groups].filter(([, items]) => items.length > 0)
  }, [filtered, categories])

  const label = (cat: string) => (cat ? categoryLabel(cat) : t.uncategorized)

  return (
    <main className="min-h-screen pb-32">
      <div className="max-w-lg mx-auto px-5">

        <div className="flex items-center justify-between pt-4">
          <LangSwitch />
          <button onClick={handleSignOut} className="text-sm text-ink-soft underline underline-offset-4">
            {t.signOut}
          </button>
        </div>

        {/* 菜单名，点一下可以改 */}
        <div className="flex flex-col items-center pt-6 pb-5">
          {editingName ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveMenuName()}
                autoFocus
                className="field text-center text-xl"
              />
              <button onClick={saveMenuName} className="btn btn-yamabuki px-4">{t.ok}</button>
              <button onClick={() => setEditingName(false)} className="text-ink-soft px-1" aria-label={t.cancel}>✕</button>
            </div>
          ) : (
            <button
              onClick={() => { setTempName(menuName || t.myMenu); setEditingName(true) }}
              className="flex flex-col items-center"
            >
              <span className="sticker bg-coral text-3xl px-6 py-1 tracking-widest">
                {menuName || t.myMenu}
              </span>
              <span className="hint mt-2">{t.tapToRename}</span>
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-ink-soft mt-20">{t.loading}</p>
        ) : dishes.length === 0 ? (
          <div className="flex flex-col items-center mt-16 gap-3 text-center px-8">
            <Onigiri size={120} />
            <p className="text-xl mt-2">{t.emptyTitle}</p>
            <p className="hint">{t.emptyHint}</p>
          </div>
        ) : (
          <>
            {/* 搜索 */}
            <label className="relative block">
              <span className="absolute left-4 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="field rounded-full pl-12"
              />
            </label>

            {/* 分类筛选 */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 py-4">
              {[ALL, ...categories].map(cat => (
                <button
                  key={cat || '__none__'}
                  onClick={() => setActiveCategory(cat)}
                  className={`chip ${activeCategory === cat ? 'chip-on' : ''}`}
                >
                  {cat === ALL ? t.all : label(cat)}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="text-center text-ink-soft mt-12">{t.noMatch}</p>
            ) : (
              <div className="space-y-8 mt-2">
                {grouped.map(([cat, items]) => (
                  <section key={cat || '__none__'}>
                    <div className="flex items-center gap-2 mb-3">
                      <CategoryArt category={cat} size={36} />
                      <h2 className="text-lg">{label(cat)}</h2>
                      <span className="hint">{items.length}</span>
                      <span className="flex-1 border-b-[2.5px] border-dashed border-ink/30 ml-1" />
                    </div>

                    <div className="space-y-3">
                      {items.map(dish => (
                        <button
                          key={dish.id}
                          onClick={() => router.push(`/dish/${dish.id}`)}
                          className="card w-full flex items-center gap-3 p-3 text-left active:translate-x-0.5 active:translate-y-0.5 transition-transform"
                        >
                          <div
                            className="w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center border-[2.5px] border-ink"
                            style={{ background: categoryTint(dish.category) }}
                          >
                            {dish.image_url
                              ? <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                              : <CategoryArt category={dish.category} size={46} />
                            }
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-lg leading-snug truncate">{dish.name}</p>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                              <Stars n={dish.rating} size={14} />
                              {dish.tags && dish.tags.split(',').filter(Boolean).slice(0, 2).map(tag => (
                                <span key={tag} className="text-xs text-ink-soft">#{tag.trim()}</span>
                              ))}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            <p className="text-center hint mt-12">── {t.menuFooter} ──</p>
          </>
        )}
      </div>

      {/* 添加按钮 */}
      <button
        onClick={() => router.push('/add-dish')}
        className="btn btn-coral fixed bottom-6 right-5 w-16 h-16 p-0"
        aria-label={t.addDish}
      >
        <PlusIcon size={30} />
      </button>
    </main>
  )
}

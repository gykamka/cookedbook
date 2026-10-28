'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, describeError } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import {
  buildBook, bookCategories, pageOfChapter, pageOfDish,
  recallPage, rememberPage, takeOpenDish,
} from '@/lib/book'
import { LangSwitch, Stars } from '@/components/ui'
import Book, { PageSheet, useBookFlip } from '@/components/Book'
import DishPageContent from '@/components/DishPageContent'
import {
  CategoryArt, categoryTint, ClayPot, PlusIcon, SearchIcon, Onigiri,
} from '@/components/Illustrations'
import Plate, { plateVariant } from '@/components/Plate'
import type { Dish, DishImage } from '@/types'

// 盘子里/目录缩略图：有照片用照片，没有就用分类插图
function DishThumb({ dish }: { dish: Pick<Dish, 'name' | 'category' | 'image_url'> }) {
  return dish.image_url ? (
    <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
  ) : (
    <span
      className="w-full h-full flex items-center justify-center"
      style={{ background: categoryTint(dish.category) }}
    >
      <CategoryArt category={dish.category} className="w-3/4 h-3/4" />
    </span>
  )
}

// 封面上的小贴纸装饰
function Sparkle({ className, color }: { className: string; color: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`absolute ${className}`} aria-hidden="true">
      <path
        d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z"
        fill={color} stroke="#3E3A39" strokeWidth={2} strokeLinejoin="round"
      />
    </svg>
  )
}

export default function MenuPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, lang, categoryLabel } = useLang()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [photos, setPhotos] = useState<Record<string, string[]>>({})
  const [photoError, setPhotoError] = useState('')
  const [loading, setLoading] = useState(true)
  const [menuName, setMenuName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [query, setQuery] = useState('')

  const pages = useMemo(() => buildBook(dishes), [dishes])
  const categories = useMemo(() => bookCategories(dishes), [dishes])
  const { page, flip, flipTo, jumpTo, endFlip } = useBookFlip(recallPage(), pages.length)
  const current = Math.min(page, pages.length - 1)

  async function loadBook() {
    const [{ data: dishData }, { data: imageData, error: imageError }] = await Promise.all([
      supabase.from('dishes').select('*'),
      supabase.from('dish_images').select('*').order('sort_order', { ascending: true }),
    ])
    const loaded: Dish[] = dishData ?? []
    setDishes(loaded)

    if (imageError) {
      console.error('读取照片失败: ' + describeError(imageError))
      setPhotoError(t.photosLoadFailed + describeError(imageError))
    }
    const byDish: Record<string, string[]> = {}
    for (const img of (imageData ?? []) as DishImage[]) {
      (byDish[String(img.dish_id)] ??= []).push(img.url)
    }
    setPhotos(byDish)
    setLoading(false)

    // 刚保存完一道菜，直接翻到那一页
    const openId = takeOpenDish()
    if (openId) {
      const n = pageOfDish(buildBook(loaded), openId)
      if (n > 0) jumpTo(n)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const saved = data.user.user_metadata?.menu_name
      if (saved) setMenuName(saved)
      loadBook()
    })
  }, [])

  useEffect(() => { rememberPage(current) }, [current])

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

  // 搜索只影响目录里显示哪些菜
  const q = query.trim().toLowerCase()
  const matches = (d: Dish) =>
    !q || [d.name, d.ingredients, d.tags, d.notes].some(f => f?.toLowerCase().includes(q))

  const label = (cat: string) => (cat ? categoryLabel(cat) : t.uncategorized)
  const currentPage = pages[current]
  const currentCategory = currentPage.kind === 'chapter' || currentPage.kind === 'dish' ? currentPage.category : null

  const tabs = [
    { key: '__toc__', label: t.contents, current: currentPage.kind === 'toc', onClick: () => flipTo(1) },
    ...categories.map(cat => ({
      key: cat || '__none__',
      label: label(cat),
      current: currentCategory === cat,
      onClick: () => flipTo(pageOfChapter(pages, cat)),
    })),
  ]

  function renderCover() {
    return (
      <div className="book-sheet book-cover">
        {/* 书脊那一条深一点 */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-ink/15" />
        <Sparkle className="w-7 h-7 top-8 right-9" color="#F6D27A" />
        <Sparkle className="w-5 h-5 top-20 left-10" color="#FBF2DC" />
        <Sparkle className="w-6 h-6 bottom-28 right-12" color="#A8D3E6" />
        <span className="absolute bottom-16 left-12 w-4 h-4 rounded-full bg-wakatake border-2 border-ink" />

        <div className="relative flex-1 flex flex-col items-center justify-center px-8 text-center">
          {/* 奶油色标签，上面贴一条纸胶带 */}
          <div className="relative bg-cream border-[3px] border-ink rounded-2xl px-7 pt-6 pb-5 w-full max-w-[15rem]">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-6 w-20 h-6 bg-mizu/80 border-2 border-ink/60" />
            <ClayPot size={84} className="mx-auto" />
            <h1 className="text-4xl tracking-[0.3em] pl-[0.3em] mt-2">灶记</h1>
            <p className="text-ink-soft tracking-wider">CookedBook</p>
          </div>

          {/* 自定义的菜单名 */}
          <div className="mt-7">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveMenuName()}
                  autoFocus
                  className="field text-center text-lg py-1.5 w-44"
                />
                <button type="button" onClick={saveMenuName} className="btn btn-yamabuki px-3 py-1.5">{t.ok}</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setTempName(menuName || t.myMenu); setEditingName(true) }}
                className="cursor-pen"
                title={t.tapToRename}
              >
                <span className="sticker bg-yamabuki text-xl px-5 py-1 tracking-widest">
                  {menuName || t.myMenu}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="relative flex justify-end px-6 pb-6">
          <button type="button" onClick={() => flipTo(1)} className="btn bg-cream py-1.5 px-5">
            {t.openBook} ›
          </button>
        </div>
      </div>
    )
  }

  function renderContents() {
    const sections = categories
      .map(cat => ({
        cat,
        items: pages.flatMap(p => (p.kind === 'chapter' && p.category === cat ? p.dishes : [])).filter(matches),
      }))
      .filter(s => !q || s.items.length > 0)

    return (
      <div>
        <h2 className={`text-2xl text-center ${lang === 'zh' ? 'tracking-[0.5em] pl-[0.5em]' : 'tracking-wide'}`}>{t.contents}</h2>
        <p className="hint text-center mt-1">{menuName || t.myMenu}</p>

        {dishes.length === 0 ? (
          <div className="flex flex-col items-center mt-10 gap-3 text-center">
            <Onigiri size={100} />
            <p className="text-lg mt-1">{t.emptyTitle}</p>
            <p className="hint">{t.emptyHint}</p>
          </div>
        ) : sections.length === 0 ? (
          <p className="text-center text-ink-soft mt-10">{t.noMatch}</p>
        ) : null}

        <div className="mt-6 space-y-7">
          {sections.map(({ cat, items }) => {
            const chapterPage = pageOfChapter(pages, cat)
            return (
              <section key={cat || '__none__'}>
                <button type="button" onClick={() => flipTo(chapterPage)} className="w-full flex items-end text-left">
                  <CategoryArt category={cat} size={32} className="flex-shrink-0 mr-1.5" />
                  <span className="text-xl flex-shrink-0">{label(cat)}</span>
                  <span className="hint ml-1.5 mb-0.5 flex-shrink-0">{items.length}</span>
                  <span className="leader" />
                  <span className="flex-shrink-0">{chapterPage}</span>
                </button>

                <ul className="mt-3 space-y-2.5 pl-9 text-[15px]">
                  {items.map(dish => (
                    <li key={dish.id}>
                      <button
                        type="button"
                        onClick={() => flipTo(pageOfDish(pages, dish.id))}
                        className="w-full flex items-end text-left"
                      >
                        <span className="w-7 h-7 rounded-full overflow-hidden border-2 border-ink flex-shrink-0 mr-2 self-center">
                          <DishThumb dish={dish} />
                        </span>
                        <span className="truncate min-w-0">{dish.name}</span>
                        <span className="leader" />
                        <span className="flex-shrink-0 text-ink-soft">{pageOfDish(pages, dish.id)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    )
  }

  function renderChapter(cat: string, items: Dish[]) {
    return (
      <div>
        <div className="flex flex-col items-center text-center">
          <CategoryArt category={cat} size={60} />
          <p className="hint mt-1">{t.chapterN(categories.indexOf(cat) + 1)}</p>
          <h2 className="text-2xl tracking-widest">{label(cat)}</h2>
          <p className="hint mt-0.5">{t.dishCount(items.length)}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6 mt-6">
          {items.map(dish => (
            <button
              key={dish.id}
              type="button"
              onClick={() => flipTo(pageOfDish(pages, dish.id))}
              className="flex flex-col items-center text-center active:scale-95 transition-transform"
            >
              <Plate variant={plateVariant(dish.id)}>
                <DishThumb dish={dish} />
              </Plate>
              <p className="mt-1.5 leading-snug line-clamp-2 break-all">{dish.name}</p>
              <span className="mt-1"><Stars n={dish.rating} size={12} /></span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  function renderPage(i: number) {
    const p = pages[i]
    if (!p) return null
    if (p.kind === 'cover') return renderCover()

    let content: React.ReactNode
    if (p.kind === 'toc') {
      content = renderContents()
    } else if (p.kind === 'chapter') {
      content = renderChapter(p.category, p.dishes)
    } else {
      const fromTable = photos[String(p.dish.id)]
      content = (
        <DishPageContent
          dish={p.dish}
          photos={fromTable?.length ? fromTable : p.dish.image_url ? [p.dish.image_url] : []}
          onEdit={() => { rememberPage(i); router.push(`/dish/${p.dish.id}`) }}
        />
      )
    }

    return (
      <PageSheet
        number={i}
        onPrev={() => flipTo(i - 1)}
        onNext={i < pages.length - 1 ? () => flipTo(i + 1) : undefined}
        onClose={() => flipTo(0)}
      >
        {content}
      </PageSheet>
    )
  }

  return (
    <main className="min-h-dvh overflow-x-clip pb-8">
      <div className="max-w-lg mx-auto px-4">

        <div className="flex items-center justify-between gap-2 h-14">
          <LangSwitch />
          <button type="button" onClick={() => router.push('/add-dish')} className="btn btn-coral py-1 px-3.5 text-sm">
            <PlusIcon size={16} /> {t.addShort}
          </button>
          <button type="button" onClick={handleSignOut} className="text-sm text-ink-soft underline underline-offset-4">
            {t.signOut}
          </button>
        </div>

        {loading ? (
          <p className="text-center text-ink-soft mt-20">{t.loading}</p>
        ) : (
          <>
            <Book
              className="h-[clamp(30rem,calc(100dvh-8.5rem),46rem)]"
              page={current}
              flip={flip}
              onFlipEnd={endFlip}
              renderPage={renderPage}
              tabs={tabs}
              onSwipe={forward => flipTo(current + (forward ? 1 : -1))}
            />

            {/* 书下面的小搜索框 */}
            <label className="relative block w-56 mx-auto mt-6">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <SearchIcon size={16} />
              </span>
              <input
                type="search"
                value={query}
                onChange={e => { setQuery(e.target.value); if (current !== 1) flipTo(1) }}
                placeholder={t.searchPlaceholder}
                className="field rounded-full text-sm py-1.5 pl-9 pr-3 border-[2.5px]"
              />
            </label>

            {photoError && <p className="sticker bg-coral-pale text-sm mt-4 block">{photoError}</p>}
          </>
        )}
      </div>
    </main>
  )
}

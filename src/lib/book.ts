import { DEFAULT_CATEGORIES } from './i18n'
import type { Dish } from '@/types'

// 菜单就是一本书：封面（不算页码）、第 1 页目录，然后每个分类一章（章节页 + 每道菜一页）
export type BookDish = Pick<Dish, 'id' | 'name' | 'category' | 'created_at'>

export type BookPage<T extends BookDish = BookDish> =
  | { kind: 'cover' }
  | { kind: 'toc' }
  | { kind: 'chapter'; category: string; dishes: T[] }
  | { kind: 'dish'; category: string; dish: T }

// 默认分类在前，自定义分类按第一次出现的顺序，未分类放最后
export function bookCategories(dishes: BookDish[]) {
  const used = new Set(dishes.map(d => d.category || ''))
  const custom = [...used].filter(c => c && !DEFAULT_CATEGORIES.includes(c))
  const ordered = [...DEFAULT_CATEGORIES.filter(c => used.has(c)), ...custom]
  if (used.has('')) ordered.push('')
  return ordered
}

// 返回的数组下标就是页码：0 是封面，1 是目录
export function buildBook<T extends BookDish>(dishes: T[]): BookPage<T>[] {
  const pages: BookPage<T>[] = [{ kind: 'cover' }, { kind: 'toc' }]
  for (const category of bookCategories(dishes)) {
    // 先记的菜排前面，新加的菜不会把老菜的页码挤乱
    const inCategory = dishes
      .filter(d => (d.category || '') === category)
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || Number(a.id) - Number(b.id))
    pages.push({ kind: 'chapter', category, dishes: inCategory })
    for (const dish of inCategory) pages.push({ kind: 'dish', category, dish })
  }
  return pages
}

export function pageOfDish(pages: BookPage[], id: Dish['id'] | string) {
  return pages.findIndex(p => p.kind === 'dish' && String(p.dish.id) === String(id))
}

export function pageOfChapter(pages: BookPage[], category: string) {
  return pages.findIndex(p => p.kind === 'chapter' && p.category === category)
}

// 离开书（去编辑、添加）再回来时，记住要翻到哪一页
const PAGE_KEY = 'cookedbook-page'
const OPEN_DISH_KEY = 'cookedbook-open-dish'

export function rememberPage(page: number) {
  try { sessionStorage.setItem(PAGE_KEY, String(page)) } catch {}
}

export function recallPage() {
  try { return Number(sessionStorage.getItem(PAGE_KEY)) || 0 } catch { return 0 }
}

// 保存完一道菜回到书里，直接翻到这道菜那一页
export function openDishNext(id: Dish['id'] | string) {
  try { sessionStorage.setItem(OPEN_DISH_KEY, String(id)) } catch {}
}

export function takeOpenDish() {
  try {
    const id = sessionStorage.getItem(OPEN_DISH_KEY)
    sessionStorage.removeItem(OPEN_DISH_KEY)
    return id
  } catch {
    return null
  }
}

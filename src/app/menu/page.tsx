'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Dish } from '@/types'

const CATEGORY_EMOJI: Record<string, string> = {
  '凉菜': '🥗', '热菜': '🔥', '炖菜': '🥘',
  '汤': '🍲', '主食': '🍚', '饮料': '🧋',
  '甜品': '🍰', '外卖': '🛵', '未分类': '🍴',
}

function Stars({ n }: { n: number | null }) {
  if (!n) return null
  return (
    <span className="text-amber-400 text-xs tracking-tight">
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  )
}

export default function MenuPage() {
  const router = useRouter()
  const supabase = createClient()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [menuName, setMenuName] = useState('我的菜单')
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const saved = data.user.user_metadata?.menu_name
      if (saved) setMenuName(saved)
      loadDishes()
    })
  }, [])

  async function loadDishes() {
    const { data } = await supabase
      .from('dishes').select('*').order('created_at', { ascending: false })
    if (data) setDishes(data)
    setLoading(false)
  }

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

  const grouped = dishes.reduce((acc, dish) => {
    const cat = dish.category || '未分类'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(dish)
    return acc
  }, {} as Record<string, Dish[]>)

  return (
    <main className="min-h-screen pb-28" style={{ background: '#fef9f0' }}>

      {/* ── 顶部退出按钮（轻量，不是导航栏） ── */}
      <div className="flex justify-end px-5 pt-4">
        <button onClick={handleSignOut} className="text-xs text-amber-300">退出</button>
      </div>

      {/* ── 菜单标题，像手帐印章 ── */}
      <div className="flex flex-col items-center pt-2 pb-6 px-4">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveMenuName()}
              autoFocus
              className="text-2xl font-bold text-amber-900 bg-transparent border-b-2 border-amber-400 focus:outline-none text-center w-48"
              style={{ fontFamily: 'Georgia, serif' }}
            />
            <button onClick={saveMenuName} className="text-sm text-amber-500 font-medium">好</button>
            <button onClick={() => setEditingName(false)} className="text-sm text-gray-300">✕</button>
          </div>
        ) : (
          <button
            onClick={() => { setTempName(menuName); setEditingName(true) }}
            className="group flex flex-col items-center gap-1"
          >
          <span
            className="text-3xl font-bold text-amber-900 tracking-widest"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {menuName}
          </span>
            <span className="text-xs text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
              点击修改名字
            </span>
          </button>
        )}

        
      </div>

      {/* ── 内容区 ── */}
      {loading ? (
        <p className="text-center text-amber-300 text-sm mt-20">加载中…</p>
      ) : dishes.length === 0 ? (
        <div className="flex flex-col items-center mt-24 gap-3 text-center px-8">
          <span className="text-6xl">🍽️</span>
          <p className="text-amber-700 font-medium">还没有菜呢</p>
          <p className="text-amber-300 text-sm">点右下角 ＋ 开始记录第一道菜</p>
        </div>
      ) : (
        <div className="max-w-sm mx-auto px-5 space-y-8">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>

              {/* 分类标题 — 轻盈，无重边框 */}
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-base">{CATEGORY_EMOJI[cat] ?? '🍴'}</span>
                <span
                  className="text-sm font-bold text-amber-700 tracking-wider"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {cat}
                </span>
                <span className="text-amber-200 text-xs ml-1">({items.length})</span>
              </div>

              {/* 菜列表 — 单列，轻卡片 */}
              <div className="space-y-2 pl-1">
                {items.map(dish => (
                  <button
                    key={dish.id}
                    onClick={() => router.push(`/dish/${dish.id}`)}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-2xl active:scale-95 transition-transform text-left"
                    style={{ background: 'rgba(255,255,255,0.7)' }}
                  >
                    {/* 圆形图片 */}
                    <div
                      className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-xl"
                      style={{ background: '#fde68a' }}
                    >
                      {dish.image_url
                        ? <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                        : <span>{CATEGORY_EMOJI[cat] ?? '🍴'}</span>
                      }
                    </div>

                    {/* 菜名 + 星 + 标签 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm leading-snug truncate">
                        {dish.name}
                      </p>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                        <Stars n={dish.rating} />
                        {dish.tags && dish.tags.split(',').filter(Boolean).slice(0, 2).map(t => (
                          <span key={t} className="text-xs text-amber-500">#{t.trim()}</span>
                        ))}
                      </div>
                    </div>

                    <span className="text-amber-200 text-sm flex-shrink-0">›</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 底部签名装饰 */}
      {dishes.length > 0 && (
        <p className="text-center text-amber-200 text-xs mt-10 mb-4 select-none">
          ── 想吃什么随便点 ──
        </p>
      )}

      {/* 悬浮添加按钮 */}
      <button
        onClick={() => router.push('/add-dish')}
        className="fixed bottom-6 right-5 w-12 h-12 rounded-full text-white text-2xl shadow-md flex items-center justify-center active:scale-95 transition-transform"
        style={{ background: '#f59e0b' }}
      >
        ＋
      </button>
    </main>
  )
}
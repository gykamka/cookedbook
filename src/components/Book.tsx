'use client'

import { useEffect, useRef, useState } from 'react'
import { useLang } from '@/lib/i18n'
import { BackIcon } from './Illustrations'

const TAB_COLORS = ['bg-coral', 'bg-yamabuki', 'bg-mizu', 'bg-wakatake']

export type BookTab = {
  key: string
  label: string
  current: boolean
  onClick: () => void
}

type Flip = { from: number; to: number; forward: boolean }

// 当前页 + 正在进行的翻页动画；翻页期间不接受新的翻页
export function useBookFlip(initialPage: number, pageCount: number) {
  const [page, setPage] = useState(initialPage)
  const [flip, setFlip] = useState<Flip | null>(null)

  function flipTo(target: number) {
    const to = Math.max(0, Math.min(target, pageCount - 1))
    if (flip || to === page) return
    setFlip({ from: page, to, forward: to > page })
    setPage(to)
  }

  // 不播动画直接打开某一页（比如刚保存完回到这道菜）
  function jumpTo(target: number) {
    setFlip(null)
    setPage(target)
  }

  return { page, flip, flipTo, jumpTo, endFlip: () => setFlip(null) }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
// 右下角先翻起来：底边的折痕比顶边领先这么多
const CORNER_LEAD = 1.35

// 卷着翻的那一页：一条斜的折痕从右往左扫过去，折痕右边的纸翻到左边，露出纸背面
function PageCurl({ forward, children, onDone }: {
  forward: boolean
  children: React.ReactNode
  onDone: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const flapRef = useRef<HTMLDivElement>(null)
  const bandRef = useRef<HTMLDivElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<SVGLineElement>(null)
  const doneRef = useRef(onDone)
  useEffect(() => { doneRef.current = onDone }, [onDone])

  useEffect(() => {
    const root = rootRef.current!
    const { width: W, height: H } = root.getBoundingClientRect()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduce ? 1 : 950

    // e = 翻了多少（0 还没翻，1 翻完）
    function apply(e: number) {
      const xb = W * (1 - clamp01(e * CORNER_LEAD))
      const xt = W * (1 - clamp01(e * CORNER_LEAD - (CORNER_LEAD - 1)))

      // 还没翻过去的那部分纸
      frontRef.current!.style.clipPath = `polygon(0 0, ${xt}px 0, ${xb}px ${H}px, 0 ${H}px)`

      // 翻起来的部分：沿折痕镜像过去，显示纸背面
      const dx = xb - xt
      const dy = H
      const len = dx * dx + dy * dy
      const c2 = (dx * dx - dy * dy) / len
      const s2 = (2 * dx * dy) / len
      const flap = flapRef.current!
      flap.style.clipPath = `polygon(${xt}px 0, ${W}px 0, ${W}px ${H}px, ${xb}px ${H}px)`
      flap.style.transformOrigin = `${xb}px ${H}px`
      flap.style.transform = `matrix(${c2}, ${s2}, ${s2}, ${-c2}, 0, 0)`
      flap.style.visibility = xb >= W - 0.5 ? 'hidden' : 'visible'

      // 折痕旁边落在下一页上的影子
      const band = 26 * Math.sin(Math.PI * Math.min(e, 0.999))
      bandRef.current!.style.clipPath =
        `polygon(${xt}px 0, ${xt + band}px 0, ${xb + band}px ${H}px, ${xb}px ${H}px)`
      shadeRef.current!.style.opacity = String(0.14 * (1 - e))

      const line = lineRef.current!
      line.setAttribute('x1', String(xt))
      line.setAttribute('x2', String(xb))
      line.setAttribute('y2', String(H))
      line.style.opacity = xb >= W - 0.5 || xt <= 0.5 ? '0' : '1'
    }

    const start = performance.now()
    let raf = 0
    let finished = false
    function finish() {
      if (finished) return
      finished = true
      doneRef.current()
    }
    function frame(now: number) {
      const t = clamp01((now - start) / duration)
      apply(easeInOut(forward ? t : 1 - t))
      if (t < 1) raf = requestAnimationFrame(frame)
      else finish()
    }
    apply(forward ? 0 : 1)
    raf = requestAnimationFrame(frame)
    // 页面切到后台时浏览器会暂停动画帧，到时间了无论如何都把这一页翻完
    const fallback = window.setTimeout(finish, duration + 300)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fallback)
    }
  }, [forward])

  return (
    <div ref={rootRef} className="absolute inset-0 z-[2]">
      <div ref={shadeRef} className="turn-shade" style={{ opacity: 0 }} />
      <div ref={bandRef} className="absolute inset-0 bg-ink/20 pointer-events-none" />
      <div ref={frontRef} className="absolute inset-0" style={{ clipPath: forward ? undefined : 'polygon(0 0, 0 0, 0 0)' }}>
        {children}
      </div>
      {/* 平涂的偏移影子，跟整套绘本风一致 */}
      <div className="absolute inset-0 pointer-events-none" style={{ filter: 'drop-shadow(-4px 3px 0 rgb(62 58 57 / 0.18))' }}>
        <div ref={flapRef} className="absolute inset-0" style={{ visibility: 'hidden' }}>
          <div className="book-sheet leaf-back-sheet" />
        </div>
      </div>
      <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" aria-hidden="true">
        <line ref={lineRef} x1={0} y1={0} x2={0} y2={0} stroke="#3E3A39" strokeWidth={2.5} strokeLinecap="round" style={{ opacity: 0 }} />
      </svg>
    </div>
  )
}

// 普通内页：内容在固定大小里上下滑，底下是页码和翻页箭头
export function PageSheet({ number, onPrev, onNext, onClose, children }: {
  number: number
  onPrev?: () => void
  onNext?: () => void
  // 最后一页没有下一页，换成「合上」回到封面
  onClose?: () => void
  children: React.ReactNode
}) {
  const { t } = useLang()
  const arrow = 'w-9 h-9 rounded-full border-[2.5px] border-ink bg-white flex items-center justify-center disabled:opacity-25'
  return (
    <div className="book-sheet">
      <div className="flex-1 overflow-y-auto overscroll-contain pl-5 pr-4 pt-5 pb-4">
        {children}
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t-2 border-dashed border-ink/20 flex-shrink-0">
        <button type="button" onClick={onPrev} disabled={!onPrev} className={arrow} aria-label={t.prevPage}>
          <BackIcon size={16} />
        </button>
        <span className="text-ink-soft text-sm">— {number} —</span>
        {!onNext && onClose ? (
          <button type="button" onClick={onClose} className="btn bg-brick text-cream py-1 px-4 text-sm">
            {t.closeBook}
          </button>
        ) : (
          <button type="button" onClick={onNext} disabled={!onNext} className={arrow} aria-label={t.nextPage}>
            <span className="rotate-180 flex"><BackIcon size={16} /></span>
          </button>
        )}
      </div>
    </div>
  )
}

export default function Book({ page, flip, onFlipEnd, renderPage, tabs, onSwipe, className }: {
  page: number
  flip: Flip | null
  onFlipEnd: () => void
  renderPage: (index: number) => React.ReactNode
  tabs: BookTab[]
  onSwipe: (forward: boolean) => void
  className?: string
}) {
  const { t, lang } = useLang()
  const touch = useRef<{ x: number; y: number } | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    // 相册之类自己能横滑的地方不触发翻页
    if ((e.target as HTMLElement).closest('[data-no-flip]')) { touch.current = null; return }
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    // 手指从右往左划 = 往后翻
    onSwipe(dx < 0)
  }

  // 往后翻：底下是新的一页，上面旧的一页翻走；往前翻：上面是新的一页翻回来
  const under = flip ? (flip.forward ? flip.to : flip.from) : page
  const leaf = flip ? (flip.forward ? flip.from : flip.to) : null

  return (
    <div className={`flex items-start ${className ?? ''}`}>
      <div
        className={`book flex-1 min-w-0 h-full ${flip ? 'pointer-events-none' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="book-stack" />
        <div key={`under-${under}`} className="absolute inset-0">{renderPage(under)}</div>

        {flip && leaf !== null && (
          <PageCurl key={`${flip.from}-${flip.to}`} forward={flip.forward} onDone={onFlipEnd}>
            {renderPage(leaf)}
          </PageCurl>
        )}
      </div>

      {/* 书侧边的分类标签 */}
      <nav className={`flex flex-col ${lang === 'en' ? 'gap-1 w-9' : 'gap-1.5 w-8'} pt-5 pb-3 -ml-[3px] h-full overflow-y-auto no-scrollbar flex-shrink-0 relative z-10`} aria-label={t.contents}>
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            onClick={tab.onClick}
            aria-current={tab.current}
            className={`book-tab ${lang === 'en' ? 'book-tab-en' : ''} ${i === 0 ? 'bg-brick text-cream' : TAB_COLORS[(i - 1) % TAB_COLORS.length]}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n'
import { BackIcon, StarIcon } from './Illustrations'

export function LangSwitch() {
  const { lang, setLang } = useLang()
  return (
    <div className="inline-flex border-[2.5px] border-ink rounded-full overflow-hidden bg-white text-sm">
      {(['zh', 'en'] as const).map(l => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-3 py-1 ${lang === l ? 'bg-mizu' : ''}`}
          aria-pressed={lang === l}
        >
          {l === 'zh' ? '中' : 'EN'}
        </button>
      ))}
    </div>
  )
}

export function TopBar({ title, onBack, right }: {
  title?: string
  onBack?: () => void
  right?: React.ReactNode
}) {
  const router = useRouter()
  const { t } = useLang()
  return (
    <header className="sticky top-0 z-10 bg-paper border-b-[3px] border-ink">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack ?? (() => router.back())}
          className="w-10 h-10 rounded-full border-[2.5px] border-ink bg-white flex items-center justify-center flex-shrink-0"
          aria-label={t.back}
        >
          <BackIcon />
        </button>
        <h1 className="text-xl flex-1 truncate">{title}</h1>
        {right}
      </div>
    </header>
  )
}

export function Stars({ n, size = 16 }: { n: number | null; size?: number }) {
  if (!n) return null
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n}/5`}>
      {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} filled={i <= n} size={size} />)}
    </span>
  )
}

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useLang()
  return (
    <div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i === value ? 0 : i)}
            className="active:scale-90 transition-transform"
            aria-label={`${i}`}
          >
            <StarIcon filled={i <= value} size={34} />
          </button>
        ))}
      </div>
      {value > 0 && <p className="hint mt-1">{t.ratingWords[value]}</p>}
    </div>
  )
}

export function Loading() {
  const { t } = useLang()
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-ink-soft">{t.loading}</p>
    </main>
  )
}

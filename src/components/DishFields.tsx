'use client'

import { useState } from 'react'
import { DEFAULT_CATEGORIES, DIFFICULTIES, useLang } from '@/lib/i18n'

// 分类：默认分类 + 自定义。value 为空字符串表示未选
export function CategoryPicker({ value, onChange }: {
  value: string
  onChange: (v: string) => void
}) {
  const { t, categoryLabel } = useLang()
  const isCustom = value !== '' && !DEFAULT_CATEGORIES.includes(value)
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')

  function confirmCustom() {
    const v = draft.trim()
    if (v) onChange(v)
    setDraft('')
    setTyping(false)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(value === cat ? '' : cat)}
            className={`chip ${value === cat ? 'chip-on' : ''}`}
          >
            {categoryLabel(cat)}
          </button>
        ))}
        {isCustom && (
          <button type="button" onClick={() => onChange('')} className="chip chip-on">
            {value} ✕
          </button>
        )}
        <button
          type="button"
          onClick={() => setTyping(!typing)}
          className={`chip border-dashed ${typing ? 'chip-on' : ''}`}
        >
          ＋ {t.customCategory}
        </button>
      </div>

      {typing && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder={t.customCategoryPlaceholder}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmCustom() } }}
            className="field flex-1"
            autoFocus
          />
          <button type="button" onClick={confirmCustom} className="btn btn-yamabuki px-4 whitespace-nowrap">
            {t.confirm}
          </button>
        </div>
      )}
    </div>
  )
}

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const { t } = useLang()
  const [input, setInput] = useState('')

  function addTag() {
    const v = input.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t.tagPlaceholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          className="field flex-1"
        />
        <button type="button" onClick={addTag} className="btn btn-wakatake px-4 whitespace-nowrap">
          {t.add}
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map(tag => (
            <span key={tag} className="chip bg-wakatake-pale">
              #{tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter(x => x !== tag))}
                className="ml-0.5 text-ink-soft"
                aria-label="✕"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function DifficultySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t, difficultyLabel } = useLang()
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="field appearance-none">
      <option value="">{t.unknown}</option>
      {DIFFICULTIES.map(d => <option key={d} value={d}>{difficultyLabel(d)}</option>)}
    </select>
  )
}

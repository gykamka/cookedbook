'use client'

import { useRef, useState } from 'react'
import { BackIcon } from './Illustrations'

// 横向滑动相册：手机上手指滑，电脑上点左右箭头或缩略图
export default function Gallery({ urls, alt }: { urls: string[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  function goTo(i: number) {
    const track = trackRef.current
    if (!track) return
    const next = Math.max(0, Math.min(i, urls.length - 1))
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' })
  }

  function handleScroll() {
    const track = trackRef.current
    if (!track) return
    setIndex(Math.round(track.scrollLeft / track.clientWidth))
  }

  const arrow = 'absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-[2.5px] border-ink flex items-center justify-center'

  return (
    <div>
      <div className="card card-pop overflow-hidden relative aspect-square">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
        >
          {urls.map(url => (
            <img
              key={url}
              src={url}
              alt={alt}
              className="w-full h-full flex-shrink-0 object-cover snap-center"
              draggable={false}
            />
          ))}
        </div>

        {urls.length > 1 && (
          <>
            {index > 0 && (
              <button type="button" onClick={() => goTo(index - 1)} className={`${arrow} left-2`} aria-label="‹">
                <BackIcon size={16} />
              </button>
            )}
            {index < urls.length - 1 && (
              <button type="button" onClick={() => goTo(index + 1)} className={`${arrow} right-2`} aria-label="›">
                <span className="rotate-180 flex"><BackIcon size={16} /></span>
              </button>
            )}
            <span className="absolute bottom-1.5 right-1.5 sticker bg-white text-[11px] px-1.5">
              {index + 1} / {urls.length}
            </span>
          </>
        )}
      </div>

      {urls.length > 1 && (
        <div className="flex justify-center gap-1.5 overflow-x-auto no-scrollbar mt-3 pb-1">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(i)}
              className={`flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden border-[2.5px] ${
                i === index ? 'border-ink' : 'border-transparent opacity-60'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

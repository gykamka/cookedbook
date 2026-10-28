'use client'

import { useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { useLang } from '@/lib/i18n'

const MAX_SIDE = 1600

// 旋转后图片外框的大小
function rotatedSize(width: number, height: number, degrees: number) {
  const r = (degrees * Math.PI) / 180
  return {
    width: Math.abs(Math.cos(r) * width) + Math.abs(Math.sin(r) * height),
    height: Math.abs(Math.sin(r) * width) + Math.abs(Math.cos(r) * height),
  }
}

// 先把整张图按角度转好，再把选中的区域切出来，最后缩到合适大小导出 JPEG
async function cropToBlob(src: string, area: Area, rotation: number): Promise<Blob> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = src
  await img.decode()

  const box = rotatedSize(img.naturalWidth, img.naturalHeight, rotation)
  const rotated = document.createElement('canvas')
  rotated.width = box.width
  rotated.height = box.height
  const rctx = rotated.getContext('2d')!
  rctx.translate(box.width / 2, box.height / 2)
  rctx.rotate((rotation * Math.PI) / 180)
  rctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)

  const scale = Math.min(1, MAX_SIDE / Math.max(area.width, area.height))
  const out = document.createElement('canvas')
  out.width = Math.round(area.width * scale)
  out.height = Math.round(area.height * scale)
  out.getContext('2d')!.drawImage(
    rotated, area.x, area.y, area.width, area.height, 0, 0, out.width, out.height
  )

  return new Promise((resolve, reject) => {
    out.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.9)
  })
}

type AspectKey = 'square' | 'landscape' | 'original'

export default function ImageCropper({ src, progress, initialCover, onCancel, onDone }: {
  src: string
  // 一次选了好几张时显示「2/3」
  progress?: string
  initialCover: boolean
  onCancel: () => void
  onDone: (blob: Blob, cover: boolean) => Promise<void>
}) {
  const { t } = useLang()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [aspectKey, setAspectKey] = useState<AspectKey>('square')
  const [naturalAspect, setNaturalAspect] = useState(1)
  const [cover, setCover] = useState(initialCover)
  const [area, setArea] = useState<Area | null>(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  const sideways = rotation % 180 !== 0
  const originalAspect = sideways ? 1 / naturalAspect : naturalAspect
  const aspect = aspectKey === 'square' ? 1 : aspectKey === 'landscape' ? 4 / 3 : originalAspect

  async function handleDone() {
    if (!area) return
    setWorking(true)
    setError('')
    try {
      await onDone(await cropToBlob(src, area, rotation), cover)
    } catch (e) {
      console.error('裁剪失败:', e)
      setError(t.cropFailed)
      setWorking(false)
    }
  }

  const options: [AspectKey, string][] = [
    ['square', t.cropSquare],
    ['landscape', t.cropLandscape],
    ['original', t.cropOriginal],
  ]

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col">
      <div className="flex items-center justify-between px-4 h-16 border-b-[3px] border-ink flex-shrink-0">
        <button type="button" onClick={onCancel} className="text-ink-soft underline underline-offset-4">
          {t.cancel}
        </button>
        <h2 className="text-lg">
          {t.cropTitle}{progress && <span className="hint ml-1.5">{progress}</span>}
        </h2>
        <button type="button" onClick={handleDone} disabled={working || !area} className="btn btn-coral py-1.5 px-4">
          {working ? t.uploading : t.confirm}
        </button>
      </div>

      <div className="relative flex-1 bg-ink">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          cropShape={aspectKey === 'square' ? 'round' : 'rect'}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={(_, pixels) => setArea(pixels)}
          onMediaLoaded={m => setNaturalAspect(m.naturalWidth / m.naturalHeight)}
          mediaProps={{ crossOrigin: 'anonymous' }}
        />
      </div>

      <div className="px-5 py-4 space-y-4 max-w-lg mx-auto w-full flex-shrink-0">
        {aspectKey === 'square' && <p className="hint text-center">{t.cropSquareHint}</p>}
        <div className="flex justify-center flex-wrap gap-2">
          {options.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAspectKey(key)}
              className={`chip ${aspectKey === key ? 'chip-on' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-coral"
            aria-label={t.zoom}
          />
          <button
            type="button"
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="chip"
          >
            ↻ {t.rotate}
          </button>
        </div>
        <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={cover}
            onChange={e => setCover(e.target.checked)}
            className="w-5 h-5 accent-coral"
          />
          <span>{t.setCover}</span>
        </label>
        {error && <p className="sticker bg-coral-pale text-sm">{error}</p>}
      </div>
    </div>
  )
}

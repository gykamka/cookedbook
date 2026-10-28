// 菜单里的圆盘子：几种不同花边轮流用，菜的照片裁成圆形放在盘心
const INK = '#3E3A39'
const CORAL = '#F2A497'
const YAMABUKI = '#F6D27A'
const MIZU = '#A8D3E6'
const WAKATAKE = '#B9DAA5'
const WHITE = '#FFFFFF'

// 盘沿一圈上均匀分布的点
function ring(count: number, r: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a), a }
  })
}

// 波浪花边的外轮廓
function scallopPath(bumps: number, r: number, depth: number) {
  const pts = Array.from({ length: bumps * 8 + 1 }, (_, i) => {
    const a = (i / (bumps * 8)) * Math.PI * 2
    const rr = r - depth * (1 - Math.abs(Math.cos((a * bumps) / 2)))
    return `${(50 + rr * Math.cos(a)).toFixed(2)} ${(50 + rr * Math.sin(a)).toFixed(2)}`
  })
  return `M${pts.join(' L')}Z`
}

const RIMS: (() => React.ReactNode)[] = [
  // 珊瑚粉 + 白圆点
  () => (
    <>
      <circle cx={50} cy={50} r={47} fill={CORAL} />
      {ring(14, 42).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.2} fill={WHITE} stroke="none" />)}
    </>
  ),
  // 水色波浪边
  () => <path d={scallopPath(12, 48, 3.5)} fill={MIZU} />,
  // 山吹黄 + 若竹绿细圈
  () => (
    <>
      <circle cx={50} cy={50} r={47} fill={YAMABUKI} />
      <circle cx={50} cy={50} r={42} fill="none" stroke={WAKATAKE} strokeWidth={3} />
    </>
  ),
  // 若竹绿 + 白色虚线圈
  () => (
    <>
      <circle cx={50} cy={50} r={47} fill={WAKATAKE} />
      <circle cx={50} cy={50} r={42} fill="none" stroke={WHITE} strokeWidth={2.5} strokeDasharray="4 4" />
    </>
  ),
  // 白盘 + 水色圆点（青花感）
  () => (
    <>
      <circle cx={50} cy={50} r={47} fill={WHITE} />
      {ring(10, 42).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.6} fill={MIZU} stroke="none" />)}
    </>
  ),
  // 白盘 + 珊瑚短线
  () => (
    <>
      <circle cx={50} cy={50} r={47} fill={WHITE} />
      {ring(16, 0).map((p, i) => (
        <line
          key={i}
          x1={50 + 39.5 * Math.cos(p.a)} y1={50 + 39.5 * Math.sin(p.a)}
          x2={50 + 44.5 * Math.cos(p.a)} y2={50 + 44.5 * Math.sin(p.a)}
          stroke={CORAL} strokeWidth={2.5}
        />
      ))}
    </>
  ),
]

// 同一道菜每次都用同一个盘子（数据库里的 id 是数字，先转成字符串）
export function plateVariant(id: string | number) {
  let h = 0
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % RIMS.length
}

export default function Plate({ variant, children }: { variant: number; children: React.ReactNode }) {
  const rim = RIMS[variant % RIMS.length]
  return (
    <div className="relative aspect-square w-full">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
          {rim()}
          <circle cx={50} cy={50} r={36} fill={WHITE} />
        </g>
      </svg>
      {/* 盘心：直径约为盘子的 70% */}
      <div className="absolute inset-[15%] rounded-full overflow-hidden flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

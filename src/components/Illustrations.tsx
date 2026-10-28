// 手绘风 SVG 插图：墨灰粗线 + 平涂色块，小脸蛋让食物更可爱
const INK = '#3E3A39'
const CORAL = '#F2A497'
const YAMABUKI = '#F6D27A'
const MIZU = '#A8D3E6'
const WAKATAKE = '#B9DAA5'
const WHITE = '#FFFFFF'

type IconProps = { size?: number; className?: string }

function Svg({ size = 64, className, children, viewBox = '0 0 64 64' }: IconProps & {
  children: React.ReactNode
  viewBox?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={INK}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// 两点眼睛 + 小嘴 + 腮红
function Face({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={-8} cy={3} rx={3} ry={1.8} fill={CORAL} stroke="none" />
      <ellipse cx={8} cy={3} rx={3} ry={1.8} fill={CORAL} stroke="none" />
      <circle cx={-5} cy={0} r={1.7} fill={INK} stroke="none" />
      <circle cx={5} cy={0} r={1.7} fill={INK} stroke="none" />
      <path d="M-2 2.5 Q0 4.5 2 2.5" strokeWidth={2} />
    </g>
  )
}

function Steam({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeWidth={2.5}>
      <path d="M-8 0 c-3 -3 3 -5 0 -9" />
      <path d="M0 -2 c-3 -3 3 -5 0 -9" />
      <path d="M8 0 c-3 -3 3 -5 0 -9" />
    </g>
  )
}

// 主食：一碗白米饭
export function RiceBowl(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M41 6 L52 30" />
      <path d="M47 4 L57 27" />
      <path d="M14 33 C14 22 22 16 32 16 C42 16 50 22 50 33 Z" fill={WHITE} />
      <path d="M9 33 H55 C55 45 45 53 32 53 C19 53 9 45 9 33 Z" fill={MIZU} />
      <path d="M26 53 V58 H38 V53" fill={MIZU} />
      <Face x={32} y={41} />
    </Svg>
  )
}

// 汤：冒热气的番茄汤
export function SoupBowl(props: IconProps) {
  return (
    <Svg {...props}>
      <Steam x={32} y={20} />
      <path d="M7 30 H57 C57 44 46 54 32 54 C18 54 7 44 7 30 Z" fill={YAMABUKI} />
      <ellipse cx={32} cy={30} rx={25} ry={5} fill={CORAL} />
      <circle cx={24} cy={30} r={1.8} fill={WAKATAKE} strokeWidth={1.5} />
      <circle cx={38} cy={29} r={1.8} fill={WAKATAKE} strokeWidth={1.5} />
      <Face x={32} y={42} />
    </Svg>
  )
}

// 炖菜：小砂锅
export function ClayPot(props: IconProps) {
  return (
    <Svg {...props}>
      <Steam x={32} y={12} />
      <path d="M10 34 H5 V41 H10" fill={CORAL} />
      <path d="M54 34 H59 V41 H54" fill={CORAL} />
      <path d="M10 30 H54 V42 C54 50 48 55 40 55 H24 C16 55 10 50 10 42 Z" fill={CORAL} />
      <path d="M12 30 C12 22 21 18 32 18 C43 18 52 22 52 30 Z" fill={YAMABUKI} />
      <circle cx={32} cy={16} r={3} fill={WHITE} />
      <Face x={32} y={41} />
    </Svg>
  )
}

// 凉菜：拍黄瓜
export function CucumberPlate(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx={32} cy={46} rx={27} ry={10} fill={WHITE} />
      <circle cx={15} cy={39} r={7} fill={WAKATAKE} />
      <circle cx={15} cy={39} r={2.5} fill={WHITE} strokeWidth={2} />
      <path d="M44 36 L56 36 L50 44 Z" fill={CORAL} />
      <circle cx={33} cy={33} r={12} fill={WAKATAKE} />
      <circle cx={33} cy={33} r={8} fill="#E8F3E1" strokeWidth={2} />
      <Face x={33} y={33} scale={0.8} />
    </Svg>
  )
}

// 热菜：炒锅里的番茄炒蛋
export function Wok(props: IconProps) {
  return (
    <Svg {...props}>
      <Steam x={32} y={18} />
      <path d="M55 34 L62 29" strokeWidth={4} />
      <path d="M13 32 C14 25 21 24 24 28 C26 21 36 21 38 27 C41 22 49 24 51 32 Z" fill={YAMABUKI} />
      <circle cx={22} cy={29} r={2.5} fill={CORAL} strokeWidth={2} />
      <circle cx={40} cy={27} r={2.5} fill={CORAL} strokeWidth={2} />
      <path d="M6 32 H58 C58 45 47 53 32 53 C17 53 6 45 6 32 Z" fill={MIZU} />
      <Face x={32} y={41} />
    </Svg>
  )
}

// 饮料：珍珠奶茶
export function MilkTea(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M35 16 L41 4 L45 6 L40 16" fill={CORAL} />
      <path d="M20 20 H44 L41 56 H23 Z" fill={WHITE} />
      <path d="M21.6 34 H42.4 L41 56 H23 Z" fill={YAMABUKI} stroke="none" />
      <path d="M20 20 H44 L41 56 H23 Z" />
      <rect x={16} y={15} width={32} height={6} rx={3} fill={MIZU} />
      <circle cx={28} cy={51} r={2} fill={INK} stroke="none" />
      <circle cx={33} cy={52} r={2} fill={INK} stroke="none" />
      <circle cx={37} cy={49} r={2} fill={INK} stroke="none" />
      <Face x={32} y={40} scale={0.85} />
    </Svg>
  )
}

// 甜品：顶着樱桃的布丁
export function Pudding(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx={32} cy={53} rx={23} ry={5} fill={MIZU} />
      <path d="M17 52 L22 25 H42 L47 52 Z" fill={YAMABUKI} />
      <path d="M22 25 H42 L41 29 C39 33 37 28 35 31 C33 34 31 34 29 31 C27 28 25 33 23 30 Z" fill={CORAL} />
      <path d="M33 18 C33 14 35 12 38 11" strokeWidth={2.5} />
      <circle cx={32} cy={20} r={4} fill={CORAL} />
      <Face x={32} y={40} />
    </Svg>
  )
}

// 外卖：中式外卖盒
export function TakeoutBox(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M24 17 C24 7 40 7 40 17" strokeWidth={2.5} />
      <path d="M12 26 L19 16 H45 L52 26 Z" fill={WHITE} />
      <path d="M12 26 H52 L47 55 H17 Z" fill={WHITE} />
      <path d="M14 32 H50" stroke={CORAL} strokeWidth={4} />
      <Face x={32} y={43} />
    </Svg>
  )
}

// 未分类：饭团
export function Onigiri(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M32 9 C37 9 55 39 55 46 C55 53 48 55 32 55 C16 55 9 53 9 46 C9 39 27 9 32 9 Z" fill={WHITE} />
      <path d="M24 42 H40 V55 H24 Z" fill={INK} />
      <Face x={32} y={32} />
    </Svg>
  )
}

const CATEGORY_ART: Record<string, (props: IconProps) => React.ReactElement> = {
  '凉菜': CucumberPlate, '热菜': Wok, '炖菜': ClayPot, '汤': SoupBowl,
  '主食': RiceBowl, '饮料': MilkTea, '甜品': Pudding, '外卖': TakeoutBox,
}

// 每个分类配一个浅底色，列表里的缩略图用
const CATEGORY_TINT: Record<string, string> = {
  '凉菜': '#E8F3E1', '热菜': '#E3F1F7', '炖菜': '#FCE6E1', '汤': '#FDF2D4',
  '主食': '#E3F1F7', '饮料': '#FDF2D4', '甜品': '#FCE6E1', '外卖': '#E8F3E1',
}

export function CategoryArt({ category, ...props }: IconProps & { category: string | null }) {
  const Art = (category && CATEGORY_ART[category]) || Onigiri
  return <Art {...props} />
}

export function categoryTint(category: string | null) {
  return (category && CATEGORY_TINT[category]) || '#FDF2D4'
}

// 首页大图：摊开的菜谱本上坐着一口冒热气的小砂锅
export function HeroBook({ size = 220, className }: IconProps) {
  return (
    <Svg size={size} className={className} viewBox="0 0 200 170">
      <g strokeWidth={2.5}>
        <path d="M42 30 l3 -6 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 Z" fill={YAMABUKI} />
        <path d="M156 46 l2.5 -5 l2.5 5 l5 2.5 l-5 2.5 l-2.5 5 l-2.5 -5 l-5 -2.5 Z" fill={YAMABUKI} />
        <circle cx={160} cy={20} r={4} fill={MIZU} />
        <circle cx={30} cy={70} r={3.5} fill={WAKATAKE} />
      </g>
      <path d="M12 118 V156 C50 146 80 150 100 160 C120 150 150 146 188 156 V118 Z" fill={CORAL} />
      <path d="M20 112 C50 102 80 106 100 116 V152 C80 142 50 138 20 148 Z" fill={WHITE} />
      <path d="M180 112 C150 102 120 106 100 116 V152 C120 142 150 138 180 148 Z" fill={WHITE} />
      <g strokeWidth={2.5}>
        <path d="M32 124 C50 119 68 120 86 126" />
        <path d="M32 134 C50 129 68 130 86 136" />
        <path d="M114 126 C132 120 150 119 168 124" />
        <path d="M114 136 C132 130 150 129 168 134" />
      </g>
      <g transform="translate(60 22) scale(1.25)">
        <Steam x={32} y={12} />
        <path d="M10 34 H5 V41 H10" fill={CORAL} />
        <path d="M54 34 H59 V41 H54" fill={CORAL} />
        <path d="M10 30 H54 V42 C54 50 48 55 40 55 H24 C16 55 10 50 10 42 Z" fill={MIZU} />
        <path d="M12 30 C12 22 21 18 32 18 C43 18 52 22 52 30 Z" fill={YAMABUKI} />
        <circle cx={32} cy={16} r={3} fill={WHITE} />
        <Face x={32} y={41} />
      </g>
    </Svg>
  )
}

export function StarIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.8 L14.7 8.6 L21 9.3 L16.3 13.6 L17.6 19.9 L12 16.7 L6.4 19.9 L7.7 13.6 L3 9.3 L9.3 8.6 Z"
        fill={filled ? YAMABUKI : WHITE}
        stroke={INK}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
      <circle cx={10.5} cy={10.5} r={6.5} />
      <path d="M15.5 15.5 L21 21" />
    </svg>
  )
}

export function BackIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5 L8 12 L15 19" />
    </svg>
  )
}

export function PlusIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" aria-hidden="true">
      <path d="M12 4 V20 M4 12 H20" />
    </svg>
  )
}

export function SparkleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z" fill={WHITE} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}

export function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
      <circle cx={12} cy={12} r={9} fill={WHITE} />
      <path d="M12 7 V12 L15 14" />
    </svg>
  )
}

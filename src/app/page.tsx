import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🍜</div>
        <h1 className="text-3xl font-bold text-amber-900 mb-2">灶记</h1>
        <p className="text-lg text-amber-700 mb-8">我的菜谱本</p>
        <Link
          href="/login"
          className="bg-amber-500 text-white px-8 py-3 rounded-full text-lg font-medium"
        >
          开始记录
        </Link>
      </div>
    </main>
  )
}
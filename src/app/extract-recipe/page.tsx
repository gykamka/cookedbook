import { Suspense } from 'react'
import ExtractRecipeClient from './ExtractRecipeClient'

export default function ExtractRecipePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#fdf8f0' }}>
        <p className="text-amber-400 text-sm">加载中...</p>
      </main>
    }>
      <ExtractRecipeClient />
    </Suspense>
  )
}
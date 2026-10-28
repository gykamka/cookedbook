import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Supabase 的错误对象直接 console.error 会显示成 {}，拼成一句看得懂的话
export function describeError(error: { message?: string; code?: string; details?: string | null; hint?: string | null }) {
  return [error.code, error.message, error.details, error.hint].filter(Boolean).join(' · ') || '未知错误'
}

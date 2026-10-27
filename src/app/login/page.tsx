'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      // 注册
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage('注册失败：' + error.message)
      } else {
        setMessage('注册成功！')
      }
    } else {
      // 登录
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage('登录失败：' + error.message)
      } else {
        router.push('/menu')
      }
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍜</div>
          <h1 className="text-2xl font-bold text-amber-900">灶记</h1>
          <p className="text-amber-600 mt-1">我的菜谱本</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {isSignUp ? '创建账号' : '登录'}
          </h2>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          {message && (
            <p className="mt-3 text-sm text-amber-700">{message}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 bg-amber-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
          >
            {loading ? '请稍候...' : isSignUp ? '注册' : '登录'}
          </button>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full mt-3 text-amber-600 text-sm"
          >
            {isSignUp ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>
      </div>
    </main>
  )
}
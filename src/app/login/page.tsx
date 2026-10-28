'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { LangSwitch } from '@/components/ui'
import { RiceBowl } from '@/components/Illustrations'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLang()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      // 注册
      const { error } = await supabase.auth.signUp({ email, password })
      setMessage(error ? t.signUpFailed + error.message : t.signUpOk)
    } else {
      // 登录
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(t.loginFailed + error.message)
      } else {
        router.push('/menu')
      }
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col px-6">
      <div className="flex justify-end pt-4">
        <LangSwitch />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto pb-12">
        <div className="text-center mb-6">
          <RiceBowl size={96} className="mx-auto" />
          <h1 className="text-3xl mt-2 tracking-widest">灶记</h1>
          <p className="text-ink-soft">CookedBook</p>
        </div>

        <form onSubmit={handleSubmit} className="card card-pop w-full p-6 bg-white">
          <h2 className="text-xl mb-4">{isSignUp ? t.createAccount : t.login}</h2>

          <div className="space-y-3">
            <input
              type="email"
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="field"
            />
            <input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              className="field"
            />
          </div>

          {message && <p className="mt-3 text-sm">{message}</p>}

          <button type="submit" disabled={loading} className="btn btn-coral w-full mt-5">
            {loading ? t.pleaseWait : isSignUp ? t.signUp : t.login}
          </button>

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
            className="w-full mt-4 text-sm text-ink-soft underline underline-offset-4"
          >
            {isSignUp ? t.toLogin : t.toSignUp}
          </button>
        </form>
      </div>
    </main>
  )
}

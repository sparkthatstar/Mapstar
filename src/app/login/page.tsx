'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  LogIn,
  Loader2,
  Mail,
  Lock,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password')
      }

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back to map link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-slate-400 hover:text-blue-400 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Mapstar
          </Link>
        </div>

        {/* Brand header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-950 flex items-center justify-center shadow-lg shadow-blue-600/30 border border-blue-500/40">
            <svg viewBox="0 0 32 32" className="h-5 w-5">
              <path
                d="M16 2 L19.6 12.2 L30.4 12.5 L21.7 19.0 L24.7 29.3 L16 23.2 L7.3 29.3 L10.3 19.0 L1.6 12.5 L12.4 12.2 Z"
                fill="#60A5FA"
              />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight text-white">Mapstar</span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-white">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Or{' '}
          <Link href="/signup" className="font-semibold text-blue-400 hover:text-blue-300">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#090D18] py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-800">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="block text-xs font-medium text-slate-300">
                Email address
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-sm bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="block text-xs font-medium text-slate-300">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-sm bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-md shadow-blue-600/30 mt-2 cursor-pointer transition"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Sign in
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

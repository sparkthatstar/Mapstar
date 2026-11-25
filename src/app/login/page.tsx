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
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#120C08] text-[#271810] dark:text-[#FAF6F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back to map link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-[#7C6859] hover:text-[#78350F] dark:text-[#B8A598] dark:hover:text-[#E0904E] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Mapstar
          </Link>
        </div>

        {/* Brand header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#78350F] to-[#B45309] flex items-center justify-center shadow-lg shadow-[#78350F]/30 border border-amber-600/40">
            <svg viewBox="0 0 32 32" className="h-5 w-5">
              <path
                d="M16 2 L19.6 12.2 L30.4 12.5 L21.7 19.0 L24.7 29.3 L16 23.2 L7.3 29.3 L10.3 19.0 L1.6 12.5 L12.4 12.2 Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight text-[#271810] dark:text-white">Mapstar</span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-[#271810] dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-[#7C6859] dark:text-[#B8A598]">
          Or{' '}
          <Link href="/signup" className="font-semibold text-[#78350F] hover:text-[#92400E] dark:text-[#E0904E] dark:hover:text-amber-200">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#1A120B] py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-[#E5DAC8] dark:border-[#382618]">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/40 p-3 text-xs dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="block text-xs font-medium text-[#271810] dark:text-[#FAF6F0]">
                Email address
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C6859] dark:text-[#B8A598]" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-sm bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] placeholder:text-[#7C6859] dark:placeholder:text-[#B8A598] focus:border-[#78350F] dark:focus:border-[#B45309]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="block text-xs font-medium text-[#271810] dark:text-[#FAF6F0]">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#78350F] hover:text-[#92400E] dark:text-[#E0904E] dark:hover:text-amber-200 hover:underline cursor-pointer"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C6859] dark:text-[#B8A598]" />
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-sm bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] placeholder:text-[#7C6859] dark:placeholder:text-[#B8A598] focus:border-[#78350F] dark:focus:border-[#B45309]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#78350F] hover:bg-[#854D0E] dark:bg-[#B45309] dark:hover:bg-[#C2783B] font-semibold text-white shadow-md shadow-[#78350F]/25 mt-2 cursor-pointer transition"
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

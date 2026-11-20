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
  User,
  Home,
  CheckCircle,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  Shield,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e?: React.FormEvent, customCreds?: { email: string; pass: string }) {
    if (e) e.preventDefault()
    setError(null)
    setLoading(true)

    const loginEmail = customCreds?.email ?? email
    const loginPass = customCreds?.pass ?? password

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password')
      }

      // Successfully logged in — redirect to home
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  function loginDemo(demoEmail: string, demoPass: string) {
    setEmail(demoEmail)
    setPassword(demoPass)
    handleLogin(undefined, { email: demoEmail, pass: demoPass })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back to map link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-slate-500 hover:text-emerald-700 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to map
          </Link>
        </div>

        {/* Brand header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center shadow-md">
            <svg viewBox="0 0 32 32" className="h-6 w-6">
              <path
                d="M16 2 L19.6 12.2 L30.4 12.5 L21.7 19.0 L24.7 29.3 L16 23.2 L7.3 29.3 L10.3 19.0 L1.6 12.5 L12.4 12.2 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">Mapstar</span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Or{' '}
          <Link href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <Label htmlFor="email" className="block text-xs font-medium text-slate-700">
                Email address
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="block text-xs font-medium text-slate-700">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-emerald-600 hover:text-emerald-500 hover:underline cursor-pointer"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 font-semibold text-white shadow-sm"
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

          {/* Quick Demo Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> 1-Click Demo Accounts:
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => loginDemo('tenant@mapstar.ng', 'password123')}
                className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 p-2 text-center transition"
              >
                <User className="h-4 w-4 text-emerald-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-800">Tenant</span>
                <span className="text-[9px] text-slate-400">Chinedu</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => loginDemo('landlord@mapstar.ng', 'password123')}
                className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 p-2 text-center transition"
              >
                <Home className="h-4 w-4 text-teal-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-800">Landlord</span>
                <span className="text-[9px] text-slate-400">Chief Emeka</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => loginDemo('agent@mapstar.ng', 'password123')}
                className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 p-2 text-center transition"
              >
                <CheckCircle className="h-4 w-4 text-blue-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-800">Agent</span>
                <span className="text-[9px] text-slate-400">Amaka</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => loginDemo('admin@mapstar.ng', 'mapstar2026')}
                className="flex flex-col items-center justify-center rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 hover:border-purple-300 p-2 text-center transition"
              >
                <Shield className="h-4 w-4 text-purple-600 mb-1" />
                <span className="text-[11px] font-semibold text-purple-900">Admin</span>
                <span className="text-[9px] text-purple-500">Super Admin</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center">
              <Link
                href="/admin"
                className="inline-flex items-center text-xs text-slate-500 hover:text-emerald-700 font-medium transition"
              >
                <Shield className="h-3.5 w-3.5 mr-1 text-slate-400" /> Open Admin Governance Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

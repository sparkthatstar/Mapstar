'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import MapstarAppIcon from '@/components/mapstar/app-icon'

export default function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      // Reload the page so the server component renders the dashboard with the new cookie
      window.location.reload()
    } catch (e: any) {
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070A12] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <MapstarAppIcon className="h-14 w-14 shadow-xl shadow-[#78350F]/30" />
          <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">Mapstar Admin</h1>
          <p className="mt-1 text-xs text-slate-400">
            Restricted access · Authorized personnel only
          </p>
        </div>

        {/* Login card */}
        <form
          onSubmit={submit}
          className="rounded-2xl bg-[#090D18] p-6 shadow-2xl border border-slate-800"
        >
          <h2 className="text-lg font-semibold text-white mb-1">Administrator Portal</h2>
          <p className="text-xs text-slate-400 mb-5">
            Use your administrator credentials to access the control panel.
          </p>

          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                Admin email
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-9 bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#78350F]"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10 bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#78350F]"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded-md transition focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-950/40 border border-red-800/60 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-5 bg-[#78350F] hover:bg-[#854D0E] text-white font-semibold shadow-md shadow-[#78350F]/25 cursor-pointer transition"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Signing in...
              </>
            ) : (
              'Sign in to admin'
            )}
          </Button>

          <p className="mt-4 text-[10px] text-slate-500 text-center">
            All admin actions are logged and audited.
          </p>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-[#E0904E] transition"
          >
            ← Back to Mapstar public site
          </a>
        </div>
      </div>
    </div>
  )
}

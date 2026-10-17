'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Loader2, Lock, Mail } from 'lucide-react'

export default function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative h-14 w-14 flex items-center justify-center rounded-2xl bg-emerald-600 ring-4 ring-emerald-600/20">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Mapstar Admin</h1>
          <p className="mt-1 text-sm text-slate-400">
            Restricted access · Authorized personnel only
          </p>
        </div>

        {/* Login card */}
        <form
          onSubmit={submit}
          className="rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-white/10"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Sign in</h2>
          <p className="text-xs text-slate-500 mb-5">
            Use your administrator credentials to access the control panel.
          </p>

          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                Admin email
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mapstar.ng"
                  className="pl-9"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-5 bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Signing in...
              </>
            ) : (
              'Sign in to admin'
            )}
          </Button>

          <p className="mt-4 text-[10px] text-slate-400 text-center">
            All admin actions are logged. Unauthorized access is prohibited.
          </p>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-emerald-400 transition"
          >
            ← Back to Mapstar public site
          </a>
        </div>
      </div>
    </div>
  )
}

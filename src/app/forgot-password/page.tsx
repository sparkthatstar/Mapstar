'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  KeyRound,
  Loader2,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sparkles,
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [previewCode, setPreviewCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send reset code')

      setPreviewCode(data.previewCode || null)
      if (data.previewCode) {
        setCode(data.previewCode)
      }
      setStep('reset')
    } catch (err: any) {
      setError(err.message || 'Unable to request reset. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')

      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Reset failed. Please check the code and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <Link
            href="/login"
            className="inline-flex items-center text-xs text-slate-400 hover:text-blue-400 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to sign in
          </Link>
        </div>

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
          Reset your password
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Recover access to your Mapstar account via verification code.
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

          {step === 'request' && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <Label htmlFor="email" className="block text-xs font-medium text-slate-300">
                  Registered Email Address
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-md shadow-blue-600/30 mt-2 cursor-pointer transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Code…
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {previewCode && (
                <div className="rounded-xl bg-blue-950/40 border border-blue-800/60 p-3 text-xs text-blue-300">
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" /> Demo Reset Code
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="font-mono font-bold text-sm bg-slate-900 px-2 py-0.5 rounded border border-blue-600">
                      {previewCode}
                    </span>
                    <span className="text-[10px] text-blue-400">(Pre-filled)</span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="code" className="block text-xs font-medium text-slate-300">
                  6-Digit Verification Code
                </Label>
                <div className="mt-1 relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="code"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="pl-9 h-10 text-sm font-mono tracking-widest bg-[#070A12] border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="new-password" className="block text-xs font-medium text-slate-300">
                  New Password
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="new-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 h-10 text-sm bg-[#070A12] border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-password" className="block text-xs font-medium text-slate-300">
                  Confirm New Password
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 h-10 text-sm bg-[#070A12] border-slate-800 text-slate-100 focus:border-blue-500"
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Password…
                  </>
                ) : (
                  'Save New Password'
                )}
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-950/60 border border-blue-800/60 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-white">Password Reset Successful</h3>
              <p className="text-xs text-slate-400">
                Your password has been updated. You can now sign in with your new credentials.
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full h-10 bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-md shadow-blue-600/30 cursor-pointer"
              >
                Proceed to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

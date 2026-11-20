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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <Link
            href="/login"
            className="inline-flex items-center text-xs text-slate-500 hover:text-emerald-700 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to sign in
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center shadow-md">
            <KeyRound className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">Mapstar</span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900">
          Reset your password
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          {step === 'request' && 'Enter your account email to receive a recovery code.'}
          {step === 'reset' && 'Enter the 6-digit verification code and your new password.'}
          {step === 'success' && 'Your password has been successfully reset!'}
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

          {step === 'request' && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <Label htmlFor="email" className="block text-xs font-medium text-slate-700">
                  Registered email address
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 font-semibold text-white shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending recovery code…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" /> Send recovery code
                  </>
                )}
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {previewCode && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold">Simulated Email Delivery:</span> A recovery code has been dispatched.
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-emerald-300">
                        {previewCode}
                      </span>
                      <span className="text-[10px] text-emerald-600">(Pre-filled for testing)</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="code" className="block text-xs font-medium text-slate-700">
                  6-Digit Verification Code
                </Label>
                <div className="mt-1 relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="code"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="pl-9 h-10 text-sm font-mono tracking-widest"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="new-password" className="block text-xs font-medium text-slate-700">
                  New Password (min. 6 characters)
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="new-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-password" className="block text-xs font-medium text-slate-700">
                  Confirm New Password
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating password…
                  </>
                ) : (
                  'Reset password & Sign in'
                )}
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Password Changed!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You are now signed in with your updated credentials.
                </p>
              </div>
              <Button
                onClick={() => router.push('/')}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Return to Mapstar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

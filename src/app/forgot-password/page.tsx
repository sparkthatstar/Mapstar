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
import MapstarAppIcon from '@/components/mapstar/app-icon'

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
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#120C08] text-[#271810] dark:text-[#FAF6F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <Link
            href="/login"
            className="inline-flex items-center text-xs text-[#7C6859] hover:text-[#78350F] dark:text-[#B8A598] dark:hover:text-[#E0904E] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to sign in
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <MapstarAppIcon className="h-9 w-9 shadow-lg shadow-[#78350F]/30" />
          <span className="text-2xl font-black tracking-tight text-[#271810] dark:text-white">Mapstar</span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-[#271810] dark:text-white">
          Reset your password
        </h2>
        <p className="mt-1 text-center text-xs text-[#7C6859] dark:text-[#B8A598]">
          Recover access to your Mapstar account via verification code.
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

          {step === 'request' && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <Label htmlFor="email" className="block text-xs font-medium text-[#271810] dark:text-[#FAF6F0]">
                  Registered Email address
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[#78350F] hover:bg-[#854D0E] dark:bg-[#B45309] dark:hover:bg-[#C2783B] font-semibold text-white shadow-md shadow-[#78350F]/25 mt-2 cursor-pointer transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Code…
                  </>
                ) : (
                  'Generate Reset Code'
                )}
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {previewCode && (
                <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 text-xs text-amber-900 dark:bg-[#2A1810] dark:border-[#523018] dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" />
                    <span>Reset Code Dispatched:</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between bg-white dark:bg-[#120C08] p-2 rounded border border-amber-200 dark:border-[#523018]">
                    <span className="font-mono font-bold text-sm tracking-widest text-[#78350F] dark:text-[#E0904E]">
                      {previewCode}
                    </span>
                    <span className="text-[10px] text-[#7C6859] dark:text-[#B8A598]">(Pre-filled)</span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="code" className="block text-xs font-medium text-[#271810] dark:text-[#FAF6F0]">
                  6-Digit Verification Code
                </Label>
                <div className="mt-1 relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C6859] dark:text-[#B8A598]" />
                  <Input
                    id="code"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="pl-9 h-10 text-sm font-mono tracking-widest bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] focus:border-[#78350F] dark:focus:border-[#B45309]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="new-password" className="block text-xs font-medium text-[#271810] dark:text-[#FAF6F0]">
                  New Password (min. 6 characters)
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C6859] dark:text-[#B8A598]" />
                  <Input
                    id="new-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 h-10 text-sm bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] focus:border-[#78350F] dark:focus:border-[#B45309]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-password" className="block text-xs font-medium text-[#271810] dark:text-[#FAF6F0]">
                  Confirm New Password
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C6859] dark:text-[#B8A598]" />
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 h-10 text-sm bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] focus:border-[#78350F] dark:focus:border-[#B45309]"
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Password…
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 dark:bg-[#2A1810] border border-amber-300 dark:border-[#523018] flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-[#78350F] dark:text-[#E0904E]" />
              </div>
              <h3 className="text-base font-bold text-[#271810] dark:text-white">
                Password Reset Successfully!
              </h3>
              <p className="text-xs text-[#7C6859] dark:text-[#B8A598]">
                Your password has been changed. You can now sign in with your new credentials.
              </p>
              <Button
                asChild
                className="w-full h-10 bg-[#78350F] hover:bg-[#854D0E] dark:bg-[#B45309] dark:hover:bg-[#C2783B] text-white font-semibold cursor-pointer"
              >
                <Link href="/login">Proceed to Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

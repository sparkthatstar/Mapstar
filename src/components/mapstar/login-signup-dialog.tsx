'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  LogIn,
  UserPlus,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import type { AuthedUser } from '@/lib/user-auth'

export type { AuthedUser }

interface LoginSignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'login' | 'signup'
  onAuthed: (user: AuthedUser) => void
}

export default function LoginSignupDialog({
  open,
  onOpenChange,
  defaultMode = 'login',
  onAuthed,
}: LoginSignupDialogProps) {
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>(defaultMode)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup form state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  // Forgot password form state
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPass, setForgotNewPass] = useState('')
  const [forgotPreviewCode, setForgotPreviewCode] = useState<string | null>(null)

  // Feedback states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTab(defaultMode)
      setError(null)
      setSuccessMessage(null)
    }
  }, [open, defaultMode])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      onAuthed(data.user)
      onOpenChange(false)
      setLoginEmail('')
      setLoginPassword('')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: signupName,
          email: signupEmail,
          phone: signupPhone,
          password: signupPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')

      onAuthed(data.user)
      onOpenChange(false)
      setSignupName('')
      setSignupEmail('')
      setSignupPhone('')
      setSignupPassword('')
    } catch (err: any) {
      setError(err.message || 'Account registration failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestResetCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to request reset code')

      setForgotPreviewCode(data.previewCode || null)
      if (data.previewCode) setForgotCode(data.previewCode)
      setForgotStep('reset')
      setSuccessMessage('Recovery code dispatched to your email address.')
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (forgotNewPass.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          code: forgotCode,
          newPassword: forgotNewPass,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset failed')

      onAuthed(data.user)
      onOpenChange(false)
      setForgotNewPass('')
      setForgotCode('')
    } catch (err: any) {
      setError(err.message || 'Reset failed. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-white dark:bg-[#090D18] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl z-[9999] transition-colors">
        {/* Brand Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 px-6 py-5 text-white border-b border-slate-800/80">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="h-4 w-4">
                <path
                  d="M16 2 L19.6 12.2 L30.4 12.5 L21.7 19.0 L24.7 29.3 L16 23.2 L7.3 29.3 L10.3 19.0 L1.6 12.5 L12.4 12.2 Z"
                  fill="#38BDF8"
                />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-lg text-white">Mapstar</span>
          </div>

          <DialogTitle className="text-xl font-semibold text-white">
            {tab === 'login' && 'Welcome Back'}
            {tab === 'signup' && 'Create an Account'}
            {tab === 'forgot' && 'Reset Password'}
          </DialogTitle>
          <DialogDescription className="text-blue-200/80 text-xs mt-1">
            {tab === 'login' && 'Sign in to access verified lodge listings and saved searches.'}
            {tab === 'signup' && 'Join Mapstar to find or list verified lodges across Imo & Enugu.'}
            {tab === 'forgot' && 'Recover access to your Mapstar account via verification code.'}
          </DialogDescription>
        </div>

        <div className="p-6">
          {tab !== 'forgot' ? (
            <Tabs value={tab} onValueChange={(v) => { setTab(v as 'login' | 'signup'); setError(null) }} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 dark:bg-[#070A12] p-1 border border-slate-200 dark:border-slate-800 rounded-lg">
                <TabsTrigger value="login" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 dark:text-slate-400 cursor-pointer">
                  <LogIn className="h-3.5 w-3.5 mr-1.5" /> Log in
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 dark:text-slate-400 cursor-pointer">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Sign up
                </TabsTrigger>
              </TabsList>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/40 p-2.5 text-xs dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
                  <div className="flex-1 leading-snug">{error}</div>
                </div>
              )}

              {/* LOGIN TAB */}
              <TabsContent value="login" className="space-y-4 m-0">
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <Input
                        id="login-email"
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-9 h-9 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail)
                          setTab('forgot')
                          setError(null)
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <Input
                        id="login-password"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-9 h-9 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 mt-1 cursor-pointer transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Logging in…
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-3.5 w-3.5" /> Log in
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* SIGNUP TAB */}
              <TabsContent value="signup" className="space-y-3.5 m-0">
                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="signup-name" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <Input
                        id="signup-name"
                        required
                        placeholder="e.g. Obinna Nwosu"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-9 h-8 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="signup-email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <Input
                          id="signup-email"
                          type="email"
                          required
                          placeholder="you@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="pl-9 h-8 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="signup-phone" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="0803 123 4567"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          className="pl-9 h-8 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-password" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Password (min. 6 characters)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <Input
                        id="signup-password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-9 h-8 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 mt-1 cursor-pointer transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Creating Account…
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-3.5 w-3.5" /> Create Account
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            /* FORGOT PASSWORD VIEW */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login')
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Log in
                </button>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  Step {forgotStep === 'request' ? '1: Verify Email' : '2: New Password'}
                </span>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
                  <div className="flex-1 leading-snug">{error}</div>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-xs text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1 leading-snug">{successMessage}</div>
                </div>
              )}

              {forgotStep === 'request' ? (
                <form onSubmit={handleRequestResetCode} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="forgot-email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Registered Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <Input
                        id="forgot-email"
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-9 h-9 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Sending Code…
                      </>
                    ) : (
                      'Send Recovery Code'
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-3">
                  {forgotPreviewCode && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-700 dark:bg-blue-950/50 dark:border-blue-800/60 dark:text-blue-300">
                      <div className="font-semibold text-[11px]">Recovery Code Dispatched:</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 shadow-xs">
                          {forgotPreviewCode}
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400">(Pre-filled)</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="forgot-code" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      6-Digit Recovery Code
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <Input
                        id="forgot-code"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value)}
                        className="pl-9 h-9 text-xs font-mono tracking-widest bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="forgot-new-pass" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      New Password (min. 6 characters)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <Input
                        id="forgot-new-pass"
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        className="pl-9 h-9 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Resetting…
                      </>
                    ) : (
                      'Save New Password & Sign in'
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

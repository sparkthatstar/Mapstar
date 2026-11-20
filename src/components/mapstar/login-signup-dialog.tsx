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
  Home,
  CheckCircle,
  Sparkles,
  KeyRound,
  ArrowLeft,
  Shield,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
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
  const [signupRole, setSignupRole] = useState<'TENANT' | 'LANDLORD' | 'AGENT'>('TENANT')

  // Forgot password form state
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPass, setForgotNewPass] = useState('')
  const [forgotPreviewCode, setForgotPreviewCode] = useState<string | null>(null)

  // Status state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Sync tab with defaultMode when opened
  useEffect(() => {
    if (open) {
      setTab(defaultMode)
      setError(null)
      setSuccessMessage(null)
      setForgotStep('request')
      setForgotPreviewCode(null)
    }
  }, [open, defaultMode])

  async function handleLogin(e?: React.FormEvent, customCreds?: { email: string; pass: string }) {
    if (e) e.preventDefault()
    setError(null)
    setLoading(true)

    const email = customCreds?.email ?? loginEmail
    const password = customCreds?.pass ?? loginPassword

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      onAuthed(data.user)
      onOpenChange(false)
      setLoginPassword('')
    } catch (err: any) {
      setError(err.message || 'Unable to log in. Please try again.')
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
          role: signupRole,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      onAuthed(data.user)
      onOpenChange(false)
      setSignupName('')
      setSignupEmail('')
      setSignupPhone('')
      setSignupPassword('')
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.')
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

  function loginDemo(email: string, pass: string) {
    setLoginEmail(email)
    setLoginPassword(pass)
    handleLogin(undefined, { email, pass })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-slate-200 z-[9999]">
        {/* Brand Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="h-5 w-5">
                  <path
                    d="M16 2 L19.6 12.2 L30.4 12.5 L21.7 19.0 L24.7 29.3 L16 23.2 L7.3 29.3 L10.3 19.0 L1.6 12.5 L12.4 12.2 Z"
                    fill="#ffffff"
                  />
                </svg>
              </div>
              <span className="font-bold tracking-tight text-lg">Mapstar</span>
            </div>

            <Link
              href="/admin"
              onClick={() => onOpenChange(false)}
              className="text-[11px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-emerald-100 transition"
            >
              <Shield className="h-3 w-3" /> Admin Portal
            </Link>
          </div>

          <DialogTitle className="text-xl font-semibold text-white">
            {tab === 'login' && 'Welcome Back'}
            {tab === 'signup' && 'Create an Account'}
            {tab === 'forgot' && 'Reset Password'}
          </DialogTitle>
          <DialogDescription className="text-emerald-100 text-xs mt-1">
            {tab === 'login' && 'Access verified lodge listings, escrow deposits, and saved searches.'}
            {tab === 'signup' && 'Join Mapstar to find or list verified lodges across Imo & Enugu.'}
            {tab === 'forgot' && 'Recover access to your Mapstar account via verification code.'}
          </DialogDescription>
        </div>

        <div className="p-6">
          {tab !== 'forgot' ? (
            <Tabs value={tab} onValueChange={(v) => { setTab(v as 'login' | 'signup'); setError(null) }} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 p-1">
                <TabsTrigger value="login" className="text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-700">
                  <LogIn className="h-3.5 w-3.5 mr-1.5" /> Log in
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-700">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Sign up
                </TabsTrigger>
              </TabsList>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1 leading-snug">{error}</div>
                </div>
              )}

              {/* LOGIN TAB */}
              <TabsContent value="login" className="space-y-4 m-0">
                <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs font-medium text-slate-700">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-xs font-medium text-slate-700">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail)
                          setTab('forgot')
                          setError(null)
                        }}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        id="login-password"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm mt-1"
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

                {/* Demo Accounts Pill Selector */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" /> 1-Click quick demo sign-in:
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => loginDemo('tenant@mapstar.ng', 'password123')}
                      className="flex flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 p-1.5 text-center transition"
                    >
                      <User className="h-3.5 w-3.5 text-emerald-600 mb-0.5" />
                      <span className="text-[10px] font-semibold text-slate-800">Tenant</span>
                      <span className="text-[8px] text-slate-400">Chinedu</span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => loginDemo('landlord@mapstar.ng', 'password123')}
                      className="flex flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 p-1.5 text-center transition"
                    >
                      <Home className="h-3.5 w-3.5 text-teal-600 mb-0.5" />
                      <span className="text-[10px] font-semibold text-slate-800">Landlord</span>
                      <span className="text-[8px] text-slate-400">Chief Emeka</span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => loginDemo('agent@mapstar.ng', 'password123')}
                      className="flex flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 p-1.5 text-center transition"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-blue-600 mb-0.5" />
                      <span className="text-[10px] font-semibold text-slate-800">Agent</span>
                      <span className="text-[8px] text-slate-400">Amaka</span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => loginDemo('admin@mapstar.ng', 'mapstar2026')}
                      className="flex flex-col items-center justify-center rounded-md border border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 p-1.5 text-center transition"
                    >
                      <Shield className="h-3.5 w-3.5 text-purple-600 mb-0.5" />
                      <span className="text-[10px] font-semibold text-purple-900">Admin</span>
                      <span className="text-[8px] text-purple-500">Super Admin</span>
                    </button>
                  </div>
                </div>
              </TabsContent>

              {/* SIGNUP TAB */}
              <TabsContent value="signup" className="space-y-3 m-0">
                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-700">I am joining as a:</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSignupRole('TENANT')}
                        className={`rounded-md border py-1.5 px-2 text-center text-xs font-medium transition ${
                          signupRole === 'TENANT'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Tenant
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupRole('LANDLORD')}
                        className={`rounded-md border py-1.5 px-2 text-center text-xs font-medium transition ${
                          signupRole === 'LANDLORD'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Landlord
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupRole('AGENT')}
                        className={`rounded-md border py-1.5 px-2 text-center text-xs font-medium transition ${
                          signupRole === 'AGENT'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Agent
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-name" className="text-xs font-medium text-slate-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        id="signup-name"
                        required
                        placeholder="e.g. Obinna Nwosu"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-9 h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="signup-email" className="text-xs font-medium text-slate-700">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          required
                          placeholder="you@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="pl-9 h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="signup-phone" className="text-xs font-medium text-slate-700">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="0803 123 4567"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          className="pl-9 h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-password" className="text-xs font-medium text-slate-700">
                      Password (min. 6 characters)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-9 h-8 text-xs"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm mt-1"
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
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login')
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-emerald-700 transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Log in
                </button>
                <span className="text-[11px] font-semibold text-emerald-700">
                  Step {forgotStep === 'request' ? '1: Verify Email' : '2: New Password'}
                </span>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1 leading-snug">{error}</div>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div className="flex-1 leading-snug">{successMessage}</div>
                </div>
              )}

              {forgotStep === 'request' ? (
                <form onSubmit={handleRequestResetCode} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-xs font-medium text-slate-700">
                      Enter your account email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        id="forgot-email"
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Sending code…
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-3.5 w-3.5" /> Send Recovery Code
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-3">
                  {forgotPreviewCode && (
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] text-emerald-800">
                      <div className="flex items-center gap-1 font-semibold mb-0.5">
                        <Sparkles className="h-3 w-3 text-emerald-600" /> Simulated Delivery
                      </div>
                      Your 6-digit code is:{' '}
                      <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                        {forgotPreviewCode}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="forgot-code" className="text-xs font-medium text-slate-700">
                      6-Digit Code
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        id="forgot-code"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value)}
                        className="pl-9 h-8 text-xs font-mono tracking-widest"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="forgot-new-pass" className="text-xs font-medium text-slate-700">
                      New Password (min. 6 characters)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        id="forgot-new-pass"
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        className="pl-9 h-8 text-xs"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm mt-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Updating…
                      </>
                    ) : (
                      'Set New Password & Sign In'
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

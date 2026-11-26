'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  UserPlus,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import MapstarAppIcon from '@/components/mapstar/app-icon'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#120C08] text-[#271810] dark:text-[#FAF6F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-[#7C6859] hover:text-[#78350F] dark:text-[#B8A598] dark:hover:text-[#E0904E] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Mapstar
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <MapstarAppIcon className="h-9 w-9 shadow-lg shadow-[#78350F]/30" />
          <span className="text-2xl font-black tracking-tight text-[#271810] dark:text-white">Mapstar</span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-[#271810] dark:text-white">
          Create your account
        </h2>
        <p className="mt-1 text-center text-xs text-[#7C6859] dark:text-[#B8A598]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#78350F] hover:text-[#92400E] dark:text-[#E0904E] dark:hover:text-amber-200">
            Sign in
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

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name" className="block text-xs font-medium text-[#271810] dark:text-[#FAF6F0]">
                Full Name
              </Label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C6859] dark:text-[#B8A598]" />
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Obinna Nwosu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9 h-10 text-sm bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] placeholder:text-[#7C6859] dark:placeholder:text-[#B8A598] focus:border-[#78350F] dark:focus:border-[#B45309]"
                />
              </div>
            </div>

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
              <Label htmlFor="phone" className="block text-xs font-medium text-[#271810] dark:text-[#FAF6F0]">
                Phone Number
              </Label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C6859] dark:text-[#B8A598]" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0803 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 h-10 text-sm bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] placeholder:text-[#7C6859] dark:placeholder:text-[#B8A598] focus:border-[#78350F] dark:focus:border-[#B45309]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="block text-xs font-medium text-[#271810] dark:text-[#FAF6F0]">
                Password (min. 6 characters)
              </Label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C6859] dark:text-[#B8A598]" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> Create Account
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

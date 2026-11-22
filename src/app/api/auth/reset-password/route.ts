import { NextRequest, NextResponse } from 'next/server'
import {
  resetPasswordWithCode,
  createUserSessionCookie,
  USER_COOKIE_NAME,
  USER_COOKIE_OPTIONS,
} from '@/lib/user-auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/reset-password
 * Body: { email, code, newPassword }
 * Validates inputs, rate limits attempts, updates password in Supabase,
 * and issues a fresh session while invalidating stale tokens.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: 5 attempts per 15 minutes per IP
    const limit = checkRateLimit(req, {
      prefix: 'reset-password',
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
    })

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset attempts. Please wait ${limit.retryAfterSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds) },
        }
      )
    }

    const { email, code, newPassword } = await req.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, verification code, and new password are required' },
        { status: 400 }
      )
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const user = await resetPasswordWithCode(email, code, newPassword)

    // Automatically establish a fresh session for the user upon successful reset
    const sessionCookie = createUserSessionCookie(user)
    const response = NextResponse.json({
      ok: true,
      message: 'Password reset successful. You are now logged in with your new password.',
      user,
    })

    response.cookies.set(USER_COOKIE_NAME, sessionCookie, USER_COOKIE_OPTIONS)

    return response
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: error.message || 'Password reset failed' },
      { status: 400 }
    )
  }
}

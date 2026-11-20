import { NextRequest, NextResponse } from 'next/server'
import {
  resetPasswordWithCode,
  createUserSessionCookie,
  USER_COOKIE_NAME,
  USER_COOKIE_OPTIONS,
} from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/reset-password
 * Body: { email, code, newPassword }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, verification code, and new password are required' },
        { status: 400 }
      )
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const user = await resetPasswordWithCode(email, code, newPassword)

    // Automatically establish a session for the user upon successful reset
    const sessionCookie = createUserSessionCookie(user)
    const response = NextResponse.json({
      ok: true,
      message: 'Password reset successful. You are now logged in.',
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

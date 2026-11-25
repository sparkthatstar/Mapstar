import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateUser,
  createUserSessionCookie,
  USER_COOKIE_NAME,
  USER_COOKIE_OPTIONS,
} from '@/lib/user-auth'
import {
  createSessionCookie as createAdminSessionCookie,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_OPTIONS,
} from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { recordLoginActivity } from '@/lib/activity-log'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function POST(req: NextRequest) {
  try {
    const limit = await checkRateLimit(req, {
      prefix: 'user-login',
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000,
    })

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please wait ${limit.retryAfterSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds) },
        }
      )
    }

    const { email, password } = await req.json()
    const trimmedEmail = (email || '').trim().toLowerCase()

    if (!trimmedEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(trimmedEmail, password)

    if (!user) {
      recordLoginActivity({
        email: trimmedEmail,
        status: 'FAILED',
        details: 'Incorrect password attempt',
      })
      // Artificial delay to prevent timing attacks
      await new Promise((r) => setTimeout(r, 400))
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    recordLoginActivity({
      userId: user.id,
      email: user.email,
      fullName: user.fullName || undefined,
      role: user.role,
      status: 'SUCCESS',
      details: 'Authenticated successfully',
    })

    const sessionCookie = createUserSessionCookie(user)
    const response = NextResponse.json({ ok: true, user })

    response.cookies.set(USER_COOKIE_NAME, sessionCookie, USER_COOKIE_OPTIONS)

    // If user is ADMIN, also grant full admin portal access seamlessly
    if (user.role === 'ADMIN') {
      const adminCookie = createAdminSessionCookie(user.email)
      response.cookies.set(ADMIN_COOKIE_NAME, adminCookie, ADMIN_COOKIE_OPTIONS)
    }

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}

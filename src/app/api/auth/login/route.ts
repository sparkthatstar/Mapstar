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

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      // Artificial delay to prevent timing attacks
      await new Promise((r) => setTimeout(r, 400))
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

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

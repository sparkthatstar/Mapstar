import { NextRequest, NextResponse } from 'next/server'
import {
  registerUser,
  createUserSessionCookie,
  USER_COOKIE_NAME,
  USER_COOKIE_OPTIONS,
} from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/signup
 * Body: { fullName, email, password, phone, role }
 */
export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, phone, role } = await req.json()

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const validRoles = ['TENANT', 'LANDLORD', 'AGENT']
    const assignedRole = validRoles.includes(role) ? role : 'TENANT'

    const user = await registerUser({
      fullName,
      email,
      password,
      phone,
      role: assignedRole,
    })

    const sessionCookie = createUserSessionCookie(user)
    const response = NextResponse.json({ ok: true, user })

    response.cookies.set(USER_COOKIE_NAME, sessionCookie, USER_COOKIE_OPTIONS)

    return response
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 400 }
    )
  }
}

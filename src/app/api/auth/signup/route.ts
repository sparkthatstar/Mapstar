import { NextRequest, NextResponse } from 'next/server'
import {
  registerUser,
  createUserSessionCookie,
  USER_COOKIE_NAME,
  USER_COOKIE_OPTIONS,
} from '@/lib/user-auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/

/**
 * POST /api/auth/signup
 * Body: { fullName, email, password, phone }
 * Strict input validation, rate limiting, and secure user creation.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: 6 signup attempts per 30 minutes per IP
    const limit = await checkRateLimit(req, {
      prefix: 'signup',
      maxAttempts: 6,
      windowMs: 30 * 60 * 1000,
    })

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please wait ${limit.retryAfterSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds) },
        }
      )
    }

    const { fullName, email, password, phone } = await req.json()

    // 2. Full name validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Full name is required (minimum 2 characters)' },
        { status: 400 }
      )
    }

    if (fullName.trim().length > 100) {
      return NextResponse.json(
        { error: 'Full name cannot exceed 100 characters' },
        { status: 400 }
      )
    }

    // 3. Email validation
    const trimmedEmail = (email || '').trim().toLowerCase()
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'A valid email address is required (e.g. user@example.com)' },
        { status: 400 }
      )
    }

    // 4. Password strength validation (minimum 6 characters)
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // 5. Optional phone validation
    let sanitizedPhone: string | null = null
    if (phone && typeof phone === 'string' && phone.trim()) {
      const trimmedPhone = phone.trim()
      if (!PHONE_REGEX.test(trimmedPhone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }
      sanitizedPhone = trimmedPhone
    }

    // Default regular user role is TENANT (cannot self-assign ADMIN)
    const user = await registerUser({
      fullName: fullName.trim(),
      email: trimmedEmail,
      password,
      phone: sanitizedPhone,
      role: 'TENANT',
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

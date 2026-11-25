import { NextRequest, NextResponse } from 'next/server'
import { createPasswordResetRequest } from '@/lib/user-auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
export async function POST(req: NextRequest) {
  try {
    const limit = await checkRateLimit(req, {
      prefix: 'forgot-password',
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
    })

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset requests. Please wait ${limit.retryAfterSeconds} seconds before requesting again.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds) },
        }
      )
    }

    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      )
    }

    const { code, token, expiresAt } = await createPasswordResetRequest(email)

    return NextResponse.json({
      ok: true,
      message: `Password reset instructions sent to ${email}`,
      // We include previewCode so demo users and testers can verify without configuring SMTP
      previewCode: code,
      token,
      expiresAt,
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: error.message || 'Unable to process password reset request' },
      { status: 400 }
    )
  }
}

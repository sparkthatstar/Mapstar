import { NextResponse } from 'next/server'
import { USER_COOKIE_NAME } from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/logout
 * Clears session cookie
 */
export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(USER_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}

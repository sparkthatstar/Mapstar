import { NextRequest, NextResponse } from 'next/server'
import {
  verifyCredentials,
  createSessionCookie,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_OPTIONS,
} from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/login
 * Body: { email, password }
 * Sets HTTP-only session cookie on success.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    const ok = verifyCredentials(email, password)
    if (!ok) {
      await new Promise((r) => setTimeout(r, 500))
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    const cookie = createSessionCookie(email.toLowerCase())
    const res = NextResponse.json({ ok: true, email: email.toLowerCase() })
    res.cookies.set(ADMIN_COOKIE_NAME, cookie, ADMIN_COOKIE_OPTIONS)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 })
  }
}

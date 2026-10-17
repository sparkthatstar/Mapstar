import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/logout
 * Clears the admin session cookie.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(ADMIN_COOKIE_NAME)
  return res
}

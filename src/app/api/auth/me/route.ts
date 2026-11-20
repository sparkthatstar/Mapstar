import { NextResponse } from 'next/server'
import { getUserSession } from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/me
 * Returns current authenticated user or { user: null }
 */
export async function GET() {
  try {
    const user = await getUserSession()
    return NextResponse.json({ ok: true, user })
  } catch (error: any) {
    return NextResponse.json({ ok: false, user: null })
  }
}

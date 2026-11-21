import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { listAllUsers } from '@/lib/user-auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users
 * Lists registered users from Supabase PostgreSQL with their roles and verification status.
 */
export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — admin session required' }, { status: 401 })
  }

  try {
    const users = await listAllUsers()
    return NextResponse.json({ users, count: users.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch users' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/users
 * Update user verification (NIN / BVN), role, or details in Supabase.
 */
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — admin session required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ninVerified, bvnVerified, role } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const data: Record<string, any> = {}
    if (typeof ninVerified === 'boolean') data.ninVerified = ninVerified
    if (typeof bvnVerified === 'boolean') data.bvnVerified = bvnVerified
    if (typeof role === 'string') data.role = role

    const updated = await db.user.update({
      where: { id },
      data: data as any,
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

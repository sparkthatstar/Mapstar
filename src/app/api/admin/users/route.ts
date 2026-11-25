import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { listAllUsers, getUserSession, deleteUserAccount } from '@/lib/user-auth'
import { getRecentLoginActivity } from '@/lib/activity-log'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['TENANT', 'LANDLORD', 'AGENT', 'ADMIN'] as const

async function verifyIsAdmin(): Promise<{ isAuthorized: boolean; email?: string }> {
  const session = await getAdminSession()
  if (session) return { isAuthorized: true, email: session.email }

  const user = await getUserSession()
  if (user && user.role === 'ADMIN') return { isAuthorized: true, email: user.email }

  return { isAuthorized: false }
}

/**
 * GET /api/admin/users
 * Lists registered users from Supabase PostgreSQL with their roles, verification status, and login activity.
 */
export async function GET() {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  try {
    const users = await listAllUsers()
    const loginActivity = getRecentLoginActivity()
    return NextResponse.json({
      users,
      count: users.length,
      loginActivity,
    })
  } catch (err: any) {
    console.error('Failed to fetch users:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch users' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/users
 * Update user verification (NIN / BVN), role, or details directly in PostgreSQL via Prisma.
 */
export async function PATCH(req: NextRequest) {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ninVerified, bvnVerified, role } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Valid user ID is required' }, { status: 400 })
    }

    const data: Record<string, any> = {}
    if (typeof ninVerified === 'boolean') data.ninVerified = ninVerified
    if (typeof bvnVerified === 'boolean') data.bvnVerified = bvnVerified
    if (role !== undefined) {
      if (typeof role !== 'string' || !ALLOWED_ROLES.includes(role as any)) {
        return NextResponse.json(
          { error: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}` },
          { status: 400 }
        )
      }
      data.role = role
    }

    const updated = await db.user.update({
      where: { id },
      data: data as any,
    })
    return NextResponse.json({ success: true, user: updated })
  } catch (err: any) {
    console.error('Failed to update user:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users
 * Delete user account and associated records directly from database.
 */
export async function DELETE(req: NextRequest) {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const urlId = searchParams.get('id')
    const body = await req.json().catch(() => ({}))
    const id = urlId || body.id

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Valid user ID is required' }, { status: 400 })
    }

    // Safety: prevent deleting administrator accounts
    const target = await db.user.findFirst({
      where: {
        OR: [{ id }, { email: id.toLowerCase() }],
      },
    })
    if (target?.role === 'ADMIN' || id === auth.email) {
      return NextResponse.json(
        { error: 'Cannot delete an administrator account.' },
        { status: 400 }
      )
    }

    const result = await deleteUserAccount(id)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Failed to delete user account:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to delete user account' },
      { status: 500 }
    )
  }
}

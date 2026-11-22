import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { listAllUsers } from '@/lib/user-auth'
import { db } from '@/lib/db'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['TENANT', 'LANDLORD', 'AGENT', 'ADMIN'] as const

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
 * Update user verification (NIN / BVN), role, or details in Supabase with role whitelisting.
 */
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — admin session required' }, { status: 401 })
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

    // 1. Try Prisma update
    try {
      const updated = await db.user.update({
        where: { id },
        data: data as any,
      })
      return NextResponse.json({ success: true, user: updated })
    } catch (prismaErr) {
      // 2. Dual-tier fallback: Try Supabase REST Client
      const supabase = createServerClient()
      if (supabase) {
        const { data: updated, error } = await supabase
          .from('User')
          .update({ ...data, updatedAt: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()
        if (updated && !error) {
          return NextResponse.json({ success: true, user: updated })
        }
      }
      throw prismaErr
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

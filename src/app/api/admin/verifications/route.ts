import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { getUserSession } from '@/lib/user-auth'
import {
  getAllVerificationApplications,
  processVerificationApplication,
} from '@/lib/verification'

export const dynamic = 'force-dynamic'

async function verifyIsAdmin(): Promise<{ isAuthorized: boolean; email?: string }> {
  const session = await getAdminSession()
  if (session) return { isAuthorized: true, email: session.email }

  const user = await getUserSession()
  if (user && user.role === 'ADMIN') return { isAuthorized: true, email: user.email }

  return { isAuthorized: false }
}

/**
 * GET /api/admin/verifications
 * Returns all verification applications for Star Power management
 */
export async function GET() {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  try {
    const applications = await getAllVerificationApplications()
    return NextResponse.json({
      success: true,
      applications,
      count: applications.length,
      pendingCount: applications.filter((a) => a.status === 'PENDING').length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch verification applications' }, { status: 500 })
  }
}

/**
 * POST /api/admin/verifications
 * Body: { applicationId, action: 'APPROVE_NIN' | 'APPROVE_BVN' | 'APPROVE_ALL' | 'APPROVE_LANDLORD' | 'APPROVE_AGENT' | 'REJECT' | 'REVOKE' }
 */
export async function POST(req: NextRequest) {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { applicationId, action } = body

    if (!applicationId || !action) {
      return NextResponse.json({ error: 'applicationId and action are required' }, { status: 400 })
    }

    const result = await processVerificationApplication({
      applicationId,
      action,
      adminEmail: auth.email || process.env.ADMIN_EMAIL || 'admin@mapstar.ng',
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to process verification application' }, { status: 500 })
  }
}

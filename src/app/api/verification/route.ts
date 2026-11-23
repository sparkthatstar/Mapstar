import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/user-auth'
import {
  submitVerificationApplication,
  getUserVerificationApplications,
} from '@/lib/verification'

export const dynamic = 'force-dynamic'

/**
 * GET /api/verification
 * Returns current user's submitted verification applications.
 */
export async function GET() {
  const user = await getUserSession()
  if (!user) {
    return NextResponse.json({ error: 'Please log in to view verification status' }, { status: 401 })
  }

  try {
    const apps = await getUserVerificationApplications(user.id)
    return NextResponse.json({
      success: true,
      applications: apps,
      userStatus: {
        ninVerified: !!user.ninVerified,
        bvnVerified: !!user.bvnVerified,
        role: user.role,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch verification status' }, { status: 500 })
  }
}

/**
 * POST /api/verification
 * Body: { type: 'IDENTITY' | 'LANDLORD' | 'AGENT', nin, bvn, businessName, propertyOrOfficeAddress, notes }
 */
export async function POST(req: NextRequest) {
  const user = await getUserSession()
  if (!user) {
    return NextResponse.json({ error: 'Please log in to apply for verification' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type = 'IDENTITY', nin, bvn, businessName, propertyOrOfficeAddress, notes } = body

    if (type === 'IDENTITY' && !nin && !bvn) {
      return NextResponse.json(
        { error: 'Please provide either a National Identity Number (NIN) or Bank Verification Number (BVN).' },
        { status: 400 }
      )
    }

    if (nin && !/^\d{11}$/.test(nin.replace(/\s+/g, ''))) {
      return NextResponse.json({ error: 'NIN must be an 11-digit number.' }, { status: 400 })
    }

    if (bvn && !/^\d{11}$/.test(bvn.replace(/\s+/g, ''))) {
      return NextResponse.json({ error: 'BVN must be an 11-digit number.' }, { status: 400 })
    }

    const application = await submitVerificationApplication({
      userId: user.id,
      userEmail: user.email,
      fullName: user.fullName || user.email,
      phone: user.phone || undefined,
      type,
      nin: nin ? nin.replace(/\s+/g, '') : undefined,
      bvn: bvn ? bvn.replace(/\s+/g, '') : undefined,
      businessName,
      propertyOrOfficeAddress,
      notes,
    })

    return NextResponse.json({
      success: true,
      message: 'Verification application submitted successfully. Mapstar administrators will process it shortly.',
      application,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit verification application' }, { status: 500 })
  }
}

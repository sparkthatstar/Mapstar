import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/user-auth'
import { approvePersonaVerification } from '@/lib/verification'

export const dynamic = 'force-dynamic'

/**
 * POST /api/verification/persona/complete
 * Called when Persona verification client flow successfully completes.
 */
export async function POST(req: NextRequest) {
  const user = await getUserSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { inquiryId, status } = body

    await approvePersonaVerification({
      userId: user.id,
      inquiryId,
      status: status || 'completed',
    })

    return NextResponse.json({
      success: true,
      message: 'Persona identity verification completed successfully. Credibility badge activated.',
    })
  } catch (err: any) {
    console.error('Error completing Persona verification:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to update verification status' },
      { status: 500 }
    )
  }
}

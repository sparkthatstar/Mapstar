import { NextRequest, NextResponse } from 'next/server'
import { approvePersonaVerification } from '@/lib/verification'

export const dynamic = 'force-dynamic'

/**
 * POST /api/verification/persona/webhook
 * Receives webhook callbacks from Persona Identity API.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const eventName = payload?.data?.attributes?.name || payload?.event

    // Extract referenceId (Mapstar userId) and inquiryId from Persona payload
    const inquiryData = payload?.data?.attributes?.payload?.data || payload?.data
    const referenceId = inquiryData?.attributes?.referenceId
    const inquiryId = inquiryData?.id

    if (referenceId && (eventName === 'inquiry.approved' || eventName === 'inquiry.completed')) {
      await approvePersonaVerification({
        userId: referenceId,
        inquiryId,
        status: 'approved',
      })
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Persona webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 400 })
  }
}

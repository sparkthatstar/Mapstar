import { NextRequest, NextResponse } from 'next/server'
import { getFeeConfig, updateFeeConfig, DEFAULT_FEES, FeeConfig } from '@/lib/fees'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/fees — public; returns the current fee configuration.
 */
export async function GET() {
  const config = await getFeeConfig()
  return NextResponse.json({ config })
}

/**
 * PATCH /api/fees — admin-only; updates fee configuration.
 * Requires a valid admin session cookie.
 */
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — admin session required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const patch: Partial<FeeConfig> = {}

    if (typeof body.successFeePercent === 'number') patch.successFeePercent = body.successFeePercent
    if (typeof body.agentFeeCapPercent === 'number') patch.agentFeeCapPercent = body.agentFeeCapPercent
    if (typeof body.tenantServiceFeeNaira === 'number') patch.tenantServiceFeeNaira = body.tenantServiceFeeNaira
    if (typeof body.agreementFeeNaira === 'number') patch.agreementFeeNaira = body.agreementFeeNaira
    if (typeof body.featuredBoost7DayNaira === 'number') patch.featuredBoost7DayNaira = body.featuredBoost7DayNaira
    if (typeof body.featuredBoost14DayNaira === 'number') patch.featuredBoost14DayNaira = body.featuredBoost14DayNaira
    if (typeof body.verifiedAgentAnnualNaira === 'number') patch.verifiedAgentAnnualNaira = body.verifiedAgentAnnualNaira
    if (typeof body.referralBountyNaira === 'number') patch.referralBountyNaira = body.referralBountyNaira
    if (typeof body.fairPriceTolerancePercent === 'number') patch.fairPriceTolerancePercent = body.fairPriceTolerancePercent
    if (typeof body.stampDutyPercent === 'number') patch.stampDutyPercent = body.stampDutyPercent
    if (typeof body.firstAgreementFreePerLandlord === 'boolean') patch.firstAgreementFreePerLandlord = body.firstAgreementFreePerLandlord
    if (typeof body.firstTimeLandlordListingCap === 'number') patch.firstTimeLandlordListingCap = body.firstTimeLandlordListingCap

    if (patch.successFeePercent !== undefined && (patch.successFeePercent < 0 || patch.successFeePercent > 20)) {
      return NextResponse.json({ error: 'successFeePercent must be 0–20' }, { status: 400 })
    }
    if (patch.agentFeeCapPercent !== undefined && (patch.agentFeeCapPercent < 0 || patch.agentFeeCapPercent > 20)) {
      return NextResponse.json({ error: 'agentFeeCapPercent must be 0–20' }, { status: 400 })
    }
    if (patch.stampDutyPercent !== undefined && (patch.stampDutyPercent < 0 || patch.stampDutyPercent > 5)) {
      return NextResponse.json({ error: 'stampDutyPercent must be 0–5' }, { status: 400 })
    }

    const updated = await updateFeeConfig(patch, session.email)
    return NextResponse.json({ config: updated, updatedBy: session.email })
  } catch (err: any) {
    console.error('PATCH /api/fees error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

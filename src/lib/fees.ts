import { db } from './db'

/**
 * Fee configuration helper.
 *
 * All fee caps and rates are stored in the FeeConfig table (single row).
 * Admin users update these via the /admin panel — no code deploy needed
 * to change pricing.
 *
 * If the database is unavailable (e.g. sandbox), falls back to defaults
 * matching the seed in supabase/schema.sql.
 */

export const DEFAULT_FEES = {
  successFeePercent: 3.0,
  agentFeeCapPercent: 5.0,
  tenantServiceFeeNaira: 3000,
  agreementFeeNaira: 3000,
  featuredBoost7DayNaira: 5000,
  featuredBoost14DayNaira: 12000,
  verifiedAgentAnnualNaira: 10000,
  referralBountyNaira: 1000,
  fairPriceTolerancePercent: 10.0,
  stampDutyPercent: 0.78,
  firstAgreementFreePerLandlord: true,
  firstTimeLandlordListingCap: 2,
} as const

export type FeeConfig = typeof DEFAULT_FEES

/**
 * Load the current fee config from the database, falling back to defaults.
 */
export async function getFeeConfig(): Promise<FeeConfig> {
  try {
    const row = await db.feeConfig.findFirst()
    if (!row) return { ...DEFAULT_FEES }
    return {
      successFeePercent: row.successFeePercent,
      agentFeeCapPercent: row.agentFeeCapPercent,
      tenantServiceFeeNaira: row.tenantServiceFeeNaira,
      agreementFeeNaira: row.agreementFeeNaira,
      featuredBoost7DayNaira: row.featuredBoost7DayNaira,
      featuredBoost14DayNaira: row.featuredBoost14DayNaira,
      verifiedAgentAnnualNaira: row.verifiedAgentAnnualNaira,
      referralBountyNaira: row.referralBountyNaira,
      fairPriceTolerancePercent: row.fairPriceTolerancePercent,
      stampDutyPercent: row.stampDutyPercent,
      firstAgreementFreePerLandlord: row.firstAgreementFreePerLandlord,
      firstTimeLandlordListingCap: row.firstTimeLandlordListingCap,
    }
  } catch {
    return { ...DEFAULT_FEES }
  }
}

/**
 * Compute the full fee breakdown for a given annual rent.
 * Used in listing detail and agreement generation.
 */
export async function computeFees(annualRent: number) {
  const cfg = await getFeeConfig()
  const successFee = Math.round((annualRent * cfg.successFeePercent) / 100)
  const agentFeeCap = Math.round((annualRent * cfg.agentFeeCapPercent) / 100)
  const stampDuty = Math.round((annualRent * cfg.stampDutyPercent) / 100)
  const tenantServiceFee = cfg.tenantServiceFeeNaira
  const agreementFee = cfg.agreementFeeNaira
  return {
    config: cfg,
    successFee,
    agentFeeCap,
    stampDuty,
    tenantServiceFee,
    agreementFee,
    totalTenantPays: annualRent + tenantServiceFee + agreementFee + stampDuty,
    totalLandlordReceives: annualRent - successFee - agentFeeCap,
  }
}

/**
 * Persist updated fee config (admin only — enforce role check in route handler).
 */
export async function updateFeeConfig(
  patch: Partial<FeeConfig>,
  adminUserId: string
) {
  const existing = await db.feeConfig.findFirst()
  if (existing) {
    return db.feeConfig.update({
      where: { id: existing.id },
      data: { ...patch, updatedBy: adminUserId },
    })
  }
  return db.feeConfig.create({
    data: { ...DEFAULT_FEES, ...patch, updatedBy: adminUserId } as any,
  })
}

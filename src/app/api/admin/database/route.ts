import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { MOCK_LISTINGS } from '@/lib/mock-data'
import { DEFAULT_FEES } from '@/lib/fees'

export const dynamic = 'force-dynamic'

/**
 * Mask sensitive connection strings for secure display in the UI.
 */
function maskDatabaseUrl(url?: string): string {
  if (!url) return 'Not configured'
  try {
    return url.replace(/:([^:@]+)@/, ':••••••••@')
  } catch {
    return 'Configured (masked)'
  }
}

/**
 * GET /api/admin/database
 * Inspects live Supabase PostgreSQL connectivity, pooler status, and table counts.
 */
export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — admin session required' }, { status: 401 })
  }

  const rawDbUrl = process.env.DATABASE_URL
  const rawDirectUrl = process.env.DIRECT_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const isConfigured = Boolean(rawDbUrl && !rawDbUrl.includes('[YOUR-'))

  let connected = false
  let latencyMs = 0
  let errorMessage: string | null = null
  let counts = {
    users: 0,
    properties: 0,
    listings: 0,
    feeConfigs: 0,
  }

  if (isConfigured) {
    const start = Date.now()
    try {
      // Test basic connection
      await db.$queryRaw`SELECT 1`
      latencyMs = Date.now() - start
      connected = true

      // Fetch table counts safely
      const [uCount, pCount, lCount, fCount] = await Promise.all([
        db.user.count().catch(() => 0),
        db.property.count().catch(() => 0),
        db.listing.count().catch(() => 0),
        db.feeConfig.count().catch(() => 0),
      ])

      counts = {
        users: uCount,
        properties: pCount,
        listings: lCount,
        feeConfigs: fCount,
      }
    } catch (err: any) {
      errorMessage = err.message || 'Database connection error'
    }
  }

  return NextResponse.json({
    status: connected ? 'connected' : isConfigured ? 'error' : 'unconfigured',
    connected,
    latencyMs,
    errorMessage,
    provider: 'PostgreSQL (Supabase)',
    databaseUrlMasked: maskDatabaseUrl(rawDbUrl),
    directUrlMasked: maskDatabaseUrl(rawDirectUrl),
    supabaseClientConfigured: Boolean(supabaseUrl && !supabaseUrl.includes('[YOUR-') && supabaseAnon),
    serviceRoleConfigured: Boolean(serviceKey && !serviceKey.includes('your-service')),
    counts,
  })
}

/**
 * POST /api/admin/database
 * Actions:
 *  - 'seed': Populates initial anchor properties, listings, and fee config in Supabase PostgreSQL
 */
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — admin session required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'seed') {
      // 1. Seed FeeConfig
      await db.feeConfig.upsert({
        where: { id: 'fee_config_default' },
        create: {
          id: 'fee_config_default',
          ...DEFAULT_FEES,
        },
        update: {},
      })

      // 2. Seed Anchor Properties & Listings
      let createdProperties = 0
      let createdListings = 0

      for (const item of MOCK_LISTINGS) {
        // Upsert Property
        await db.property.upsert({
          where: { id: item.propertyId },
          create: {
            id: item.propertyId,
            title: item.title,
            description: item.description,
            propertyType: item.propertyType as any,
            city: item.city,
            state: item.state,
            area: item.area,
            address: item.address,
            latitude: item.latitude,
            longitude: item.longitude,
            bedrooms: item.bedrooms,
            bathrooms: item.bathrooms,
            toilets: item.toilets,
            parkingSpaces: item.parkingSpaces,
            furnished: item.furnished,
            hasBorehole: item.hasBorehole,
            hasPrepaidMeter: item.hasPrepaidMeter,
            hasInsideToilet: item.hasInsideToilet,
            hasCCTV: item.hasCCTV,
            hasGenerator: item.hasGenerator,
            hasWiFi: item.hasWiFi,
          },
          update: {
            title: item.title,
            description: item.description,
            latitude: item.latitude,
            longitude: item.longitude,
          },
        })
        createdProperties++

        // Upsert Listing
        await db.listing.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            propertyId: item.propertyId,
            status: item.status as any,
            annualRent: item.annualRent,
            cautionFee: item.cautionFee,
            legalFee: item.legalFee,
            agentFeeCap: item.agentFeeCap,
            comingSoon: item.comingSoon,
            featured: item.featured,
            physicallyVerified: item.physicallyVerified,
            photoCount: item.photoCount,
            has360Tour: item.has360Tour,
            hasVideoWalkthrough: item.hasVideoWalkthrough,
            fairPriceBadge: item.fairPriceBadge,
            inspectionCount: item.inspectionCount,
            photoUrlsJson: JSON.stringify(item.photoUrls || []),
          },
          update: {
            status: item.status as any,
            annualRent: item.annualRent,
            featured: item.featured,
            physicallyVerified: item.physicallyVerified,
          },
        })
        createdListings++
      }

      return NextResponse.json({
        success: true,
        message: `Successfully seeded Supabase database with ${createdProperties} properties and ${createdListings} listings.`,
        createdProperties,
        createdListings,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Database operation failed' },
      { status: 500 }
    )
  }
}

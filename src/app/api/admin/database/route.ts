import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { getUserSession } from '@/lib/user-auth'
import { MOCK_LISTINGS } from '@/lib/mock-data'
import { DEFAULT_FEES } from '@/lib/fees'
import fs from 'fs'
import path from 'path'

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
 * Inspects live Supabase PostgreSQL connectivity and table counts via Prisma.
 */
export async function GET() {
  const session = await getAdminSession()
  const user = await getUserSession()
  if (!session && (!user || user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  const rawDbUrl = process.env.DATABASE_URL
  const rawDirectUrl = process.env.DIRECT_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const isPrismaConfigured = Boolean(rawDbUrl && !rawDbUrl.includes('[YOUR-'))

  let connected = false
  let prismaConnected = false
  let latencyMs = 0
  let errorMessage: string | null = null
  let counts = {
    users: 0,
    properties: 0,
    listings: 0,
    feeConfigs: 0,
  }

  // Test Prisma PostgreSQL connection
  if (isPrismaConfigured) {
    const start = Date.now()
    try {
      await db.$queryRaw`SELECT 1`
      latencyMs = Date.now() - start
      prismaConnected = true
      connected = true

      const [uCount, pCount, lCount, fCount, cCount] = await Promise.all([
        db.user.count().catch(() => 0),
        db.property.count().catch(() => 0),
        db.listing.count().catch(() => 0),
        db.feeConfig.count().catch(() => 0),
        db.chatMessage.count().catch(() => 0),
      ])

      counts = {
        users: uCount,
        properties: pCount,
        listings: lCount,
        feeConfigs: fCount,
        chatMessages: cCount,
      } as any
    } catch (err: any) {
      console.error('Prisma PostgreSQL connection error:', err)
      errorMessage = err.message || 'Prisma PostgreSQL connection error'
    }
  }

  return NextResponse.json({
    status: connected ? 'connected' : isPrismaConfigured ? 'error' : 'unconfigured',
    connected,
    prismaConnected,
    latencyMs,
    errorMessage,
    provider: 'PostgreSQL (Supabase)',
    databaseUrlMasked: maskDatabaseUrl(rawDbUrl),
    directUrlMasked: maskDatabaseUrl(rawDirectUrl),
    supabaseUrl: supabaseUrl && !supabaseUrl.includes('[YOUR-') ? supabaseUrl : null,
    supabaseClientConfigured: Boolean(supabaseUrl && !supabaseUrl.includes('[YOUR-') && supabaseAnon),
    serviceRoleConfigured: Boolean(serviceKey && !serviceKey.includes('your-service')),
    counts,
  })
}

/**
 * POST /api/admin/database
 * Actions:
 *  - 'seed': Populates initial anchor properties, listings, and fee config in Supabase via Prisma
 *  - 'configure': Updates Supabase environment variables (.env) and live runtime
 *  - 'wipe': Cleans all listings, properties, and non-admin users from PostgreSQL via Prisma
 */
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const user = await getUserSession()
  if (!session && (!user || user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action } = body

    // ACTION: CONFIGURE ENVIRONMENT VARIABLES
    if (action === 'configure') {
      const {
        databaseUrl,
        directUrl,
        supabaseUrl,
        supabaseAnonKey,
        supabaseServiceKey,
      } = body

      const envPath = path.join(process.cwd(), '.env')
      let existingEnv = ''
      try {
        if (fs.existsSync(envPath)) {
          existingEnv = fs.readFileSync(envPath, 'utf8')
        }
      } catch {}

      // Update or append environment variables
      const envMap: Record<string, string> = {
        DATABASE_URL: databaseUrl || process.env.DATABASE_URL || '',
        DIRECT_URL: directUrl || databaseUrl || process.env.DIRECT_URL || '',
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      }

      // Update process.env for current server process
      for (const [key, val] of Object.entries(envMap)) {
        if (val) {
          process.env[key] = val
        }
      }

      // Write updated .env file
      let newEnv = existingEnv
      for (const [key, val] of Object.entries(envMap)) {
        if (!val) continue
        const regex = new RegExp(`^${key}=.*$`, 'm')
        if (regex.test(newEnv)) {
          newEnv = newEnv.replace(regex, `${key}="${val}"`)
        } else {
          newEnv += `\n${key}="${val}"`
        }
      }

      try {
        fs.writeFileSync(envPath, newEnv.trim() + '\n', 'utf8')
      } catch (err: any) {
        console.error('Failed to write .env file:', err)
      }

      return NextResponse.json({
        success: true,
        message: 'Supabase credentials saved successfully to environment.',
      })
    }

    // ACTION: SEED DATA VIA PRISMA
    if (action === 'seed') {
      let createdProperties = 0
      let createdListings = 0

      try {
        await db.feeConfig.upsert({
          where: { id: 'fee_config_default' },
          create: {
            id: 'fee_config_default',
            ...DEFAULT_FEES,
          },
          update: {},
        })

        for (const item of MOCK_LISTINGS) {
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
      } catch (prismaErr: any) {
        console.error('Prisma seed error:', prismaErr)
        return NextResponse.json(
          { error: prismaErr.message || 'Failed to seed database via Prisma' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Successfully seeded Supabase database with ${createdProperties} properties and ${createdListings} listings.`,
        createdProperties,
        createdListings,
      })
    }

    // ACTION: WIPE DATABASE CLEAN (Delete all listings, properties, and non-admin users via Prisma)
    if (action === 'wipe') {
      const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : ''

      try {
        await db.chatMessage.deleteMany({}).catch(() => {})
        await db.transaction.deleteMany({}).catch(() => {})
        await db.agreement.deleteMany({}).catch(() => {})
        await db.review.deleteMany({}).catch(() => {})
        await db.report.deleteMany({}).catch(() => {})
        await db.savedSearch.deleteMany({}).catch(() => {})
        await db.referral.deleteMany({}).catch(() => {})
        await db.listing.deleteMany({})
        await db.property.deleteMany({})
        await db.landlord.deleteMany({}).catch(() => {})
        await db.agent.deleteMany({}).catch(() => {})
        await db.verificationApplication.deleteMany({}).catch(() => {})
        await db.user.deleteMany({
          where: {
            AND: [
              { role: { not: 'ADMIN' } },
              ...(adminEmail ? [{ email: { not: adminEmail } }] : []),
            ],
          },
        })
      } catch (prismaErr: any) {
        console.error('Prisma wipe error:', prismaErr)
        return NextResponse.json(
          { error: prismaErr.message || 'Failed to wipe database clean' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Database wiped clean successfully. All listings, properties, and non-admin users have been permanently deleted from Supabase PostgreSQL.',
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('Database operation failed:', err)
    return NextResponse.json(
      { error: err.message || 'Database operation failed' },
      { status: 500 }
    )
  }
}

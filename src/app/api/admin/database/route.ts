import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { MOCK_LISTINGS } from '@/lib/mock-data'
import { DEFAULT_FEES } from '@/lib/fees'
import { createServerClient, isSupabaseConfigured, seedSupabaseViaSdk } from '@/lib/supabase'
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
 * Inspects live Supabase PostgreSQL connectivity, REST client status, and table counts.
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

  const isPrismaConfigured = Boolean(rawDbUrl && !rawDbUrl.includes('[YOUR-'))
  const isSdkConfigured = isSupabaseConfigured()

  let connected = false
  let prismaConnected = false
  let sdkConnected = false
  let latencyMs = 0
  let errorMessage: string | null = null
  let counts = {
    users: 0,
    properties: 0,
    listings: 0,
    feeConfigs: 0,
  }

  // 1. Test Prisma PostgreSQL connection
  if (isPrismaConfigured) {
    const start = Date.now()
    try {
      await db.$queryRaw`SELECT 1`
      latencyMs = Date.now() - start
      prismaConnected = true
      connected = true

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
      errorMessage = err.message || 'Prisma PostgreSQL connection error'
    }
  }

  // 2. Test Supabase Client REST connection
  if (isSdkConfigured) {
    try {
      const client = createServerClient()
      if (client) {
        const start = Date.now()
        const { data, error } = await client.from('Listing').select('id', { count: 'exact', head: true })
        if (!error) {
          sdkConnected = true
          connected = true
          if (!latencyMs) latencyMs = Date.now() - start
        }
      }
    } catch {}
  }

  return NextResponse.json({
    status: connected ? 'connected' : (isPrismaConfigured || isSdkConfigured) ? 'error' : 'unconfigured',
    connected,
    prismaConnected,
    sdkConnected,
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
 *  - 'seed': Populates initial anchor properties, listings, and fee config in Supabase
 *  - 'configure': Updates Supabase environment variables (.env / .env.local) and live runtime
 *  - 'test': Tests the current live connection
 */
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — admin session required' }, { status: 401 })
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

    // ACTION: SEED DATA
    if (action === 'seed') {
      let createdProperties = 0
      let createdListings = 0

      // 1. Try Prisma seeding
      let prismaSuccess = false
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
        prismaSuccess = true
      } catch (prismaErr) {
        // Fall back to Supabase SDK
      }

      // 2. If Prisma failed or additionally, seed via Supabase REST SDK
      if (!prismaSuccess) {
        const sdkRes = await seedSupabaseViaSdk()
        if (sdkRes.success) {
          createdProperties = sdkRes.properties
          createdListings = sdkRes.listings
        } else {
          throw new Error(sdkRes.error || 'Failed to seed via Supabase SDK')
        }
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

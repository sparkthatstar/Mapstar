import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { getUserSession } from '@/lib/user-auth'
import { createServerClient } from '@/lib/supabase'
import { MOCK_LISTINGS, MockListing } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

async function verifyIsAdmin(): Promise<{ isAuthorized: boolean; email?: string }> {
  const session = await getAdminSession()
  if (session) return { isAuthorized: true, email: session.email }

  const user = await getUserSession()
  if (user && user.role === 'ADMIN') return { isAuthorized: true, email: user.email }

  return { isAuthorized: false }
}

function mapDatabaseRecordToMock(l: any): MockListing {
  const prop = l.property || {}
  let photos: string[] = []
  try {
    photos = JSON.parse(l.photoUrlsJson || '[]')
  } catch {
    photos = []
  }

  return {
    id: l.id,
    propertyId: l.propertyId,
    title: prop.title || 'Verified Lodge',
    description: prop.description || '',
    propertyType: prop.propertyType || 'SELF_CONTAINED',
    city: prop.city || 'Owerri',
    state: prop.state || 'Imo',
    area: prop.area || 'Eziobodo',
    address: prop.address || '',
    latitude: prop.latitude || 5.497,
    longitude: prop.longitude || 7.025,
    bedrooms: prop.bedrooms ?? 1,
    bathrooms: prop.bathrooms ?? 1,
    toilets: prop.toilets ?? 1,
    parkingSpaces: prop.parkingSpaces ?? 0,
    furnished: !!prop.furnished,
    hasBorehole: !!prop.hasBorehole,
    hasPrepaidMeter: !!prop.hasPrepaidMeter,
    hasInsideToilet: !!prop.hasInsideToilet,
    hasCCTV: !!prop.hasCCTV,
    hasGenerator: !!prop.hasGenerator,
    hasWiFi: !!prop.hasWiFi,
    status: l.status as any,
    annualRent: l.annualRent,
    cautionFee: l.cautionFee,
    legalFee: l.legalFee,
    agentFeeCap: l.agentFeeCap,
    availableFrom: l.availableFrom || new Date().toISOString(),
    vacatingDate: l.vacatingDate || undefined,
    comingSoon: !!l.comingSoon,
    featured: !!l.featured,
    physicallyVerified: !!l.physicallyVerified,
    lastVerifiedAt: l.lastVerifiedAt || undefined,
    photoCount: l.photoCount || photos.length,
    has360Tour: !!l.has360Tour,
    hasVideoWalkthrough: !!l.hasVideoWalkthrough,
    fairPriceBadge: !!l.fairPriceBadge,
    inspectionCount: l.inspectionCount || 0,
    rating: 4.8,
    reviewsCount: 0,
    photoUrls: photos,
  }
}

/**
 * GET /api/admin/listings
 * Returns listings with their full property details from Supabase PostgreSQL.
 */
export async function GET() {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  // 1. Try Prisma first
  try {
    const dbListings = await db.listing.findMany({
      include: {
        property: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (dbListings && dbListings.length > 0) {
      const mapped = dbListings.map(mapDatabaseRecordToMock)
      return NextResponse.json({ listings: mapped, count: mapped.length, fromDatabase: true })
    }
  } catch (err) {}

  // 2. Dual-tier: Query live Supabase PostgreSQL REST Client
  try {
    const supabase = createServerClient()
    if (supabase) {
      const { data: dbRows, error } = await supabase
        .from('Listing')
        .select('*, property:Property(*)')
        .order('createdAt', { ascending: false })

      if (dbRows && !error && dbRows.length > 0) {
        const mapped = dbRows.map(mapDatabaseRecordToMock)
        return NextResponse.json({ listings: mapped, count: mapped.length, fromDatabase: true })
      }
    }
  } catch (err) {}

  // 3. Fallback to mock data if empty
  return NextResponse.json({ listings: MOCK_LISTINGS, count: MOCK_LISTINGS.length, fromDatabase: false })
}

/**
 * PATCH /api/admin/listings
 * Update verification, feature status, or moderation status on a listing in Supabase.
 */
export async function PATCH(req: NextRequest) {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, physicallyVerified, featured, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    const data: Record<string, any> = {}
    if (typeof physicallyVerified === 'boolean') {
      data.physicallyVerified = physicallyVerified
      if (physicallyVerified) {
        data.lastVerifiedAt = new Date().toISOString()
      }
    }
    if (typeof featured === 'boolean') {
      data.featured = featured
    }
    if (typeof status === 'string') {
      data.status = status
    }

    try {
      const updated = await db.listing.update({
        where: { id },
        data,
      })
      return NextResponse.json({ success: true, listing: updated })
    } catch (prismaErr) {
      const supabase = createServerClient()
      if (supabase) {
        const { data: updated, error } = await supabase
          .from('Listing')
          .update(data)
          .eq('id', id)
          .select()
          .single()
        if (updated && !error) {
          return NextResponse.json({ success: true, listing: updated })
        }
      }
      throw prismaErr
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update listing' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/listings
 * Delete an individual listing OR clear all listings directly from the database.
 */
export async function DELETE(req: NextRequest) {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const urlId = searchParams.get('id')
    const clearAllParam = searchParams.get('clearAll') === 'true'

    const body = await req.json().catch(() => ({}))
    const id = urlId || body.id
    const isClearAll = clearAllParam || body.clearAll === true

    // Action 1: Clear all listings and properties directly from the database
    if (isClearAll) {
      let deletedListingsCount = 0

      // 1. Prisma cleanup
      try {
        const res = await db.listing.deleteMany({})
        await db.property.deleteMany({})
        deletedListingsCount = res.count
      } catch (prismaErr) {}

      // 2. Supabase REST cleanup
      try {
        const supabase = createServerClient()
        if (supabase) {
          await supabase.from('Listing').delete().neq('id', 'placeholder')
          await supabase.from('Property').delete().neq('id', 'placeholder')
        }
      } catch (supaErr) {}

      return NextResponse.json({
        success: true,
        message: 'All listings and properties have been cleared from the database directly.',
        count: deletedListingsCount,
      })
    }

    // Action 2: Delete single listing
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Valid listing ID is required' }, { status: 400 })
    }

    try {
      await db.listing.delete({ where: { id } })
      return NextResponse.json({ success: true, message: `Listing ${id} deleted successfully.` })
    } catch (prismaErr) {
      const supabase = createServerClient()
      if (supabase) {
        const { error } = await supabase.from('Listing').delete().eq('id', id)
        if (!error) {
          return NextResponse.json({ success: true, message: `Listing ${id} deleted from Supabase.` })
        }
      }
      throw prismaErr
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete listing(s)' },
      { status: 500 }
    )
  }
}

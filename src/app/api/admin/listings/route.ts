import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { getUserSession } from '@/lib/user-auth'
import { MockListing } from '@/lib/mock-data'

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
 * Returns listings with their full property details from Supabase PostgreSQL via Prisma.
 */
export async function GET() {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  try {
    const dbListings = await db.listing.findMany({
      include: {
        property: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const mapped = dbListings.map(mapDatabaseRecordToMock)
    return NextResponse.json({ listings: mapped, count: mapped.length, fromDatabase: true })
  } catch (err: any) {
    console.error('Failed to fetch admin listings:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to fetch listings from database' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/listings
 * Update an existing listing (toggle featured, verified status, fair price, availability) via Prisma.
 */
export async function PATCH(req: NextRequest) {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized — administrator privileges required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, featured, physicallyVerified, fairPriceBadge, status } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Valid listing ID is required' }, { status: 400 })
    }

    const data: Record<string, any> = {}
    if (typeof featured === 'boolean') data.featured = featured
    if (typeof physicallyVerified === 'boolean') {
      data.physicallyVerified = physicallyVerified
      if (physicallyVerified) {
        data.lastVerifiedAt = new Date()
      }
    }
    if (typeof fairPriceBadge === 'boolean') data.fairPriceBadge = fairPriceBadge
    if (typeof status === 'string') {
      data.status = status
    }

    const updated = await db.listing.update({
      where: { id },
      data,
    })
    return NextResponse.json({ success: true, listing: updated })
  } catch (err: any) {
    console.error('Failed to update listing:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to update listing' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/listings
 * Delete an individual listing OR clear all listings directly from PostgreSQL via Prisma.
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

    // Action 1: Clear all listings and properties directly from PostgreSQL
    if (isClearAll) {
      const res = await db.listing.deleteMany({})
      await db.property.deleteMany({})

      return NextResponse.json({
        success: true,
        message: 'All listings and properties have been cleared from the database directly.',
        count: res.count,
      })
    }

    // Action 2: Delete single listing
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Valid listing ID is required' }, { status: 400 })
    }

    await db.listing.delete({ where: { id } })
    return NextResponse.json({ success: true, message: `Listing ${id} deleted successfully.` })
  } catch (err: any) {
    console.error('Failed to delete listing(s):', err)
    return NextResponse.json(
      { error: err.message || 'Failed to delete listing(s)' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { MOCK_LISTINGS, MockListing } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/listings
 * Returns listings with their full property details from Supabase PostgreSQL.
 */
export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — admin session required' }, { status: 401 })
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

    if (dbListings && dbListings.length > 0) {
      const mapped: MockListing[] = dbListings.map((l) => {
        let photos: string[] = []
        try {
          photos = JSON.parse(l.photoUrlsJson || '[]')
        } catch {
          photos = []
        }

        return {
          id: l.id,
          propertyId: l.propertyId,
          title: l.property.title,
          description: l.property.description,
          propertyType: l.property.propertyType,
          city: l.property.city,
          state: l.property.state,
          area: l.property.area,
          address: l.property.address,
          latitude: l.property.latitude,
          longitude: l.property.longitude,
          bedrooms: l.property.bedrooms,
          bathrooms: l.property.bathrooms,
          toilets: l.property.toilets,
          parkingSpaces: l.property.parkingSpaces,
          furnished: l.property.furnished,
          hasBorehole: l.property.hasBorehole,
          hasPrepaidMeter: l.property.hasPrepaidMeter,
          hasInsideToilet: l.property.hasInsideToilet,
          hasCCTV: l.property.hasCCTV,
          hasGenerator: l.property.hasGenerator,
          hasWiFi: l.property.hasWiFi,
          status: l.status as any,
          annualRent: l.annualRent,
          cautionFee: l.cautionFee,
          legalFee: l.legalFee,
          agentFeeCap: l.agentFeeCap,
          availableFrom: l.availableFrom ? l.availableFrom.toISOString() : new Date().toISOString(),
          vacatingDate: l.vacatingDate ? l.vacatingDate.toISOString() : undefined,
          comingSoon: l.comingSoon,
          featured: l.featured,
          physicallyVerified: l.physicallyVerified,
          lastVerifiedAt: l.lastVerifiedAt ? l.lastVerifiedAt.toISOString() : undefined,
          photoCount: l.photoCount || photos.length,
          has360Tour: l.has360Tour,
          hasVideoWalkthrough: l.hasVideoWalkthrough,
          fairPriceBadge: l.fairPriceBadge,
          inspectionCount: l.inspectionCount,
          rating: 4.8,
          reviewsCount: 0,
          photoUrls: photos,
        }
      })
      return NextResponse.json({ listings: mapped, count: mapped.length, fromDatabase: true })
    }
  } catch (err) {
    // If DB is offline, fall back to mock data
  }

  return NextResponse.json({ listings: MOCK_LISTINGS, count: MOCK_LISTINGS.length, fromDatabase: false })
}

/**
 * PATCH /api/admin/listings
 * Update verification, feature status, or moderation status on a listing in Supabase.
 */
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — admin session required' }, { status: 401 })
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
        data.lastVerifiedAt = new Date()
      }
    }
    if (typeof featured === 'boolean') {
      data.featured = featured
    }
    if (typeof status === 'string') {
      data.status = status
    }

    const updated = await db.listing.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, listing: updated })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update listing' },
      { status: 500 }
    )
  }
}

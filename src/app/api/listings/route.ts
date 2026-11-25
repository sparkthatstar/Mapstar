import { NextRequest, NextResponse } from 'next/server'
import { MockListing } from '@/lib/mock-data'
import {
  getUserSession,
  updateUserRole,
  createUserSessionCookie,
  USER_COOKIE_NAME,
  USER_COOKIE_OPTIONS,
} from '@/lib/user-auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Coordinates map for center of cities/areas
const AREA_COORDINATES: Record<string, [number, number]> = {
  Owerri: [5.497, 7.025],
  Ikenegbu: [5.497, 7.025],
  Aladinma: [5.493, 7.038],
  Eziobodo: [5.385, 6.993],
  Ihiagwa: [5.402, 7.008],
  Umuguma: [5.478, 6.985],
  Enugu: [6.454, 7.516],
  'Independence Layout': [6.438, 7.525],
  'New Haven': [6.452, 7.519],
  Ogui: [6.446, 7.502],
  Abakpa: [6.482, 7.534],
}

/**
 * GET /api/listings
 * Reads live listings directly from Supabase PostgreSQL via Prisma.
 *
 * Query params: city, area, type, minRent, maxRent, verified, featured, status, sort, userLat, userLng
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')
  const area = searchParams.get('area')
  const type = searchParams.get('type')
  const minRent = searchParams.get('minRent') ? Number(searchParams.get('minRent')) : null
  const maxRent = searchParams.get('maxRent') ? Number(searchParams.get('maxRent')) : null
  const verified = searchParams.get('verified') === 'true'
  const featured = searchParams.get('featured') === 'true'
  const fairPriceOnly = searchParams.get('fairPrice') === 'true'
  const has360 = searchParams.get('has360') === 'true'
  const hasVideo = searchParams.get('hasVideo') === 'true'
  const furnished = searchParams.get('furnished') === 'true'
  const statusParam = searchParams.get('status')
  const statuses = statusParam ? statusParam.split(',') : ['AVAILABLE', 'COMING_SOON', 'VERIFIED', 'UNDER_INSPECTION', 'RECENTLY_LET']
  const sort = searchParams.get('sort') || 'newest'
  const userLat = searchParams.get('userLat') ? Number(searchParams.get('userLat')) : null
  const userLng = searchParams.get('userLng') ? Number(searchParams.get('userLng')) : null

  let results: MockListing[] = []

  // Fetch live listings from Supabase PostgreSQL via Prisma
  try {
    const dbListings = await db.listing.findMany({
      include: {
        property: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    results = dbListings.map((l) => {
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
  } catch (err: any) {
    console.error('GET /api/listings database error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to fetch listings from database' },
      { status: 500 }
    )
  }

  // Filtering
  if (city) results = results.filter((l) => l.city === city)
  if (area) results = results.filter((l) => l.area === area)
  if (type) results = results.filter((l) => l.propertyType === type)
  if (minRent !== null) results = results.filter((l) => l.annualRent >= minRent)
  if (maxRent !== null) results = results.filter((l) => l.annualRent <= maxRent)
  if (verified) results = results.filter((l) => l.physicallyVerified)
  if (featured) results = results.filter((l) => l.featured)
  if (fairPriceOnly) results = results.filter((l) => l.fairPriceBadge)
  if (has360) results = results.filter((l) => l.has360Tour)
  if (hasVideo) results = results.filter((l) => l.hasVideoWalkthrough)
  if (furnished) results = results.filter((l) => l.furnished)
  results = results.filter((l) => statuses.includes(l.status))

  switch (sort) {
    case 'price_asc':
      results.sort((a, b) => a.annualRent - b.annualRent)
      break
    case 'price_desc':
      results.sort((a, b) => b.annualRent - a.annualRent)
      break
    case 'distance':
      if (userLat !== null && userLng !== null) {
        results.sort((a, b) => {
          const da = haversine(userLat, userLng, a.latitude, a.longitude)
          const db = haversine(userLat, userLng, b.latitude, b.longitude)
          return da - db
        })
      }
      break
    case 'newest':
    default:
      break
  }

  return NextResponse.json({
    listings: results,
    count: results.length,
    fromDatabase: true,
  })
}

/**
 * POST /api/listings
 * Create a new property listing directly in Supabase PostgreSQL via Prisma.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession()

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to post a property listing.' },
        { status: 401 }
      )
    }

    // Enforce listing permission: only Admin, Landlord, or Agent can post listings
    const isAuthorized = user.role === 'ADMIN' || user.role === 'LANDLORD' || user.role === 'AGENT'
    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            'Only approved Landlords, Verified Agents, and Administrators can post listings on Mapstar. Please apply for Landlord or Agent verification under your profile in "Me".',
        },
        { status: 403 }
      )
    }

    const body = await req.json()

    const {
      title,
      description = '',
      propertyType,
      city,
      area,
      address,
      annualRent,
      cautionFee,
      furnished,
      hasBorehole,
      hasPrepaidMeter,
      hasInsideToilet,
      hasCCTV,
      hasGenerator,
      hasWiFi,
      status,
      role,
    } = body

    if (!title || !propertyType || !city || !area || !annualRent) {
      return NextResponse.json(
        { error: 'Missing required listing fields (title, propertyType, city, area, rent)' },
        { status: 400 }
      )
    }

    const assignedRole = user.role === 'ADMIN' ? (role === 'AGENT' ? 'AGENT' : 'LANDLORD') : user.role

    // Determine approximate coordinates with a slight random jitter
    const baseCoords = AREA_COORDINATES[area] || AREA_COORDINATES[city] || [5.497, 7.025]
    const jitterLat = (Math.random() - 0.5) * 0.008
    const jitterLng = (Math.random() - 0.5) * 0.008

    const rentNumber = Number(annualRent)
    const cautionNumber = Number(cautionFee) || Math.round(rentNumber * 0.1)
    const agentFee = assignedRole === 'AGENT' ? Math.round(rentNumber * 0.05) : 0
    const finalLat = Number((baseCoords[0] + jitterLat).toFixed(6))
    const finalLng = Number((baseCoords[1] + jitterLng).toFixed(6))

    const newListing: MockListing = {
      id: `list_${Date.now()}`,
      propertyId: `prop_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || `Verified ${propertyType} listing in ${area}, ${city}. Direct listing on Mapstar.`,
      propertyType,
      city,
      state: city === 'Owerri' ? 'Imo' : 'Enugu',
      area: area.trim(),
      address: address?.trim() || `${area}, ${city}`,
      latitude: finalLat,
      longitude: finalLng,
      bedrooms: propertyType.includes('TWO') ? 2 : propertyType.includes('THREE') ? 3 : 1,
      bathrooms: 1,
      toilets: 1,
      parkingSpaces: 1,
      furnished: !!furnished,
      hasBorehole: !!hasBorehole,
      hasPrepaidMeter: !!hasPrepaidMeter,
      hasInsideToilet: !!hasInsideToilet,
      hasCCTV: !!hasCCTV,
      hasGenerator: !!hasGenerator,
      hasWiFi: !!hasWiFi,
      status: status || 'AVAILABLE',
      annualRent: rentNumber,
      cautionFee: cautionNumber,
      legalFee: Math.round(rentNumber * 0.05),
      agentFeeCap: agentFee,
      availableFrom: new Date().toISOString(),
      comingSoon: status === 'COMING_SOON',
      featured: false,
      physicallyVerified: false,
      photoCount: 4,
      has360Tour: false,
      hasVideoWalkthrough: false,
      fairPriceBadge: true,
      inspectionCount: 0,
      rating: 5,
      reviewsCount: 0,
      photoUrls: ['/lodge-exterior.jpg', '/lodge-room.jpg'],
    }

    // Persist directly to Supabase PostgreSQL via Prisma
    await db.property.create({
      data: {
        id: newListing.propertyId,
        title: newListing.title,
        description: newListing.description,
        propertyType: newListing.propertyType as any,
        city: newListing.city,
        state: newListing.state,
        area: newListing.area,
        address: newListing.address,
        latitude: newListing.latitude,
        longitude: newListing.longitude,
        bedrooms: newListing.bedrooms,
        bathrooms: newListing.bathrooms,
        toilets: newListing.toilets,
        parkingSpaces: newListing.parkingSpaces,
        furnished: newListing.furnished,
        hasBorehole: newListing.hasBorehole,
        hasPrepaidMeter: newListing.hasPrepaidMeter,
        hasInsideToilet: newListing.hasInsideToilet,
        hasCCTV: newListing.hasCCTV,
        hasGenerator: newListing.hasGenerator,
        hasWiFi: newListing.hasWiFi,
        listings: {
          create: {
            id: newListing.id,
            status: newListing.status as any,
            annualRent: newListing.annualRent,
            cautionFee: newListing.cautionFee,
            legalFee: newListing.legalFee,
            agentFeeCap: newListing.agentFeeCap,
            comingSoon: newListing.comingSoon,
            featured: newListing.featured,
            physicallyVerified: newListing.physicallyVerified,
            fairPriceBadge: newListing.fairPriceBadge,
            photoUrlsJson: JSON.stringify(newListing.photoUrls),
          },
        },
      },
    })

    // Update user role if needed
    let updatedUser = user
    const response = NextResponse.json({ ok: true, listing: newListing, user: updatedUser })

    if (user && user.role !== assignedRole) {
      const updated = await updateUserRole(user.id, assignedRole)
      if (updated) {
        updatedUser = updated
        const newSessionCookie = createUserSessionCookie(updated)
        response.cookies.set(USER_COOKIE_NAME, newSessionCookie, USER_COOKIE_OPTIONS)
      }
    }

    return response
  } catch (err: any) {
    console.error('POST /api/listings database error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create listing in database' },
      { status: 500 }
    )
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

import { NextRequest, NextResponse } from 'next/server'
import { MOCK_LISTINGS, MockListing } from '@/lib/mock-data'
import {
  getUserSession,
  updateUserRole,
  createUserSessionCookie,
  USER_COOKIE_NAME,
  USER_COOKIE_OPTIONS,
} from '@/lib/user-auth'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const DATA_DIR = path.join(process.cwd(), '.data')
const LISTINGS_FILE = path.join(DATA_DIR, 'custom-listings.json')

function readCustomListings(): MockListing[] {
  try {
    if (!fs.existsSync(LISTINGS_FILE)) return []
    const raw = fs.readFileSync(LISTINGS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCustomListings(listings: MockListing[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(LISTINGS_FILE, JSON.stringify(listings, null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to save custom listings:', err)
  }
}

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
 * Reads live listings from Supabase PostgreSQL via Prisma,
 * merged with any saved custom listings and fallback mock listings.
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

  let dbResults: MockListing[] = []
  let fromDatabase = false

  // 1. Fetch live listings from Supabase PostgreSQL via Prisma
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
      dbResults = dbListings.map((l) => {
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
      fromDatabase = true
    }
  } catch (err) {
    // Database connection or table not yet initialized; fallback
  }

  // 2. Read local custom listings & seed mock data
  const custom = readCustomListings()
  let results: MockListing[] = []

  if (fromDatabase) {
    // Deduplicate against custom listings
    const existingIds = new Set(dbResults.map((l) => l.id))
    const uniqueCustom = custom.filter((l) => !existingIds.has(l.id))
    results = [...dbResults, ...uniqueCustom]
  } else {
    results = [...custom, ...MOCK_LISTINGS]
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
      if (!fromDatabase) {
        results.reverse()
      }
      break
  }

  return NextResponse.json({
    listings: results,
    count: results.length,
    fromDatabase,
  })
}

/**
 * POST /api/listings
 * Create a new property listing in Supabase PostgreSQL via Prisma,
 * with automatic fallback persistence and user role updating.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession()
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

    const assignedRole = role === 'AGENT' ? 'AGENT' : 'LANDLORD'

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

    // 1. Try persisting directly to Supabase PostgreSQL via Prisma
    try {
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
    } catch (dbErr) {
      // If DB is offline, continue to fallback store
    }

    // 2. Persist in fallback store
    const custom = readCustomListings()
    custom.unshift(newListing)
    writeCustomListings(custom)

    // 3. Update user role if user is logged in
    let updatedUser = user
    const response = NextResponse.json({ ok: true, listing: newListing, user: updatedUser })

    if (user) {
      const updated = await updateUserRole(user.id, assignedRole)
      if (updated) {
        updatedUser = updated
        const newSessionCookie = createUserSessionCookie(updated)
        response.cookies.set(USER_COOKIE_NAME, newSessionCookie, USER_COOKIE_OPTIONS)
      }
    }

    return response
  } catch (err: any) {
    console.error('Failed to create listing:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create listing' },
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

import { NextRequest, NextResponse } from 'next/server'
import { MOCK_LISTINGS, MockListing } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

/**
 * GET /api/listings
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

  let results: MockListing[] = [...MOCK_LISTINGS]

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
      results.reverse()
      break
  }

  return NextResponse.json({ listings: results, count: results.length })
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

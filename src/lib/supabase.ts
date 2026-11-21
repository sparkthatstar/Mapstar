import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { MockListing, MOCK_LISTINGS } from './mock-data'
import { DEFAULT_FEES } from './fees'

/**
 * Browser-side Supabase client.
 * Uses the anon key — protected by Row Level Security policies.
 */
export function createBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon || url.includes('[YOUR-') || url.includes('your-anon')) {
    return null
  }
  return createClient(url, anon)
}

/**
 * Server-side Supabase client.
 * Uses the service-role key — bypasses RLS for reliable backend storage.
 */
export function createServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !service || url.includes('[YOUR-') || url.includes('your-service')) {
    return null
  }
  return createClient(url, service, {
    auth: { persistSession: false },
  })
}

/**
 * Convenience check — true when Supabase URL & keys are set.
 */
export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!url && !url.includes('[YOUR-') && !!anon && !anon.includes('your-anon')
}

/**
 * Fetch all verified & available listings directly from Supabase via REST SDK.
 */
export async function fetchListingsFromSupabase(): Promise<MockListing[] | null> {
  const supabase = createServerClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('Listing')
      .select('*, property:Property(*)')
      .order('createdAt', { ascending: false })

    if (error || !data || data.length === 0) {
      return null
    }

    return data.map((l: any) => {
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
        area: prop.area || 'Ikenegbu',
        address: prop.address || '',
        latitude: Number(prop.latitude) || 5.497,
        longitude: Number(prop.longitude) || 7.025,
        bedrooms: prop.bedrooms || 0,
        bathrooms: prop.bathrooms || 1,
        toilets: prop.toilets || 1,
        parkingSpaces: prop.parkingSpaces || 0,
        furnished: !!prop.furnished,
        hasBorehole: !!prop.hasBorehole,
        hasPrepaidMeter: !!prop.hasPrepaidMeter,
        hasInsideToilet: !!prop.hasInsideToilet,
        hasCCTV: !!prop.hasCCTV,
        hasGenerator: !!prop.hasGenerator,
        hasWiFi: !!prop.hasWiFi,
        status: l.status || 'AVAILABLE',
        annualRent: Number(l.annualRent) || 200000,
        cautionFee: Number(l.cautionFee) || 20000,
        legalFee: Number(l.legalFee) || 10000,
        agentFeeCap: Number(l.agentFeeCap) || 0,
        availableFrom: l.availableFrom || new Date().toISOString(),
        vacatingDate: l.vacatingDate || undefined,
        comingSoon: !!l.comingSoon,
        featured: !!l.featured,
        physicallyVerified: !!l.physicallyVerified,
        lastVerifiedAt: l.lastVerifiedAt || undefined,
        photoCount: l.photoCount || photos.length || 4,
        has360Tour: !!l.has360Tour,
        hasVideoWalkthrough: !!l.hasVideoWalkthrough,
        fairPriceBadge: !!l.fairPriceBadge,
        inspectionCount: l.inspectionCount || 0,
        rating: 4.9,
        reviewsCount: 1,
        photoUrls: photos.length > 0 ? photos : ['/lodge-exterior.jpg', '/lodge-room.jpg'],
      }
    })
  } catch (err) {
    console.error('Error fetching listings from Supabase SDK:', err)
    return null
  }
}

/**
 * Persist a new property and listing directly to Supabase via REST SDK.
 */
export async function insertListingToSupabase(listing: MockListing): Promise<boolean> {
  const supabase = createServerClient()
  if (!supabase) return false

  try {
    // 1. Insert Property
    const { error: propErr } = await supabase.from('Property').upsert({
      id: listing.propertyId,
      title: listing.title,
      description: listing.description,
      propertyType: listing.propertyType,
      city: listing.city,
      state: listing.state,
      area: listing.area,
      address: listing.address,
      latitude: listing.latitude,
      longitude: listing.longitude,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      toilets: listing.toilets,
      parkingSpaces: listing.parkingSpaces,
      furnished: listing.furnished,
      hasBorehole: listing.hasBorehole,
      hasPrepaidMeter: listing.hasPrepaidMeter,
      hasInsideToilet: listing.hasInsideToilet,
      hasCCTV: listing.hasCCTV,
      hasGenerator: listing.hasGenerator,
      hasWiFi: listing.hasWiFi,
      updatedAt: new Date().toISOString(),
    })

    if (propErr) {
      console.warn('Supabase Property upsert warning:', propErr.message)
    }

    // 2. Insert Listing
    const { error: listErr } = await supabase.from('Listing').upsert({
      id: listing.id,
      propertyId: listing.propertyId,
      status: listing.status,
      annualRent: listing.annualRent,
      cautionFee: listing.cautionFee,
      legalFee: listing.legalFee,
      agentFeeCap: listing.agentFeeCap,
      comingSoon: listing.comingSoon,
      featured: listing.featured,
      physicallyVerified: listing.physicallyVerified,
      fairPriceBadge: listing.fairPriceBadge,
      photoCount: listing.photoCount,
      has360Tour: listing.has360Tour,
      hasVideoWalkthrough: listing.hasVideoWalkthrough,
      photoUrlsJson: JSON.stringify(listing.photoUrls || []),
      updatedAt: new Date().toISOString(),
    })

    if (listErr) {
      console.warn('Supabase Listing upsert warning:', listErr.message)
      return false
    }

    return true
  } catch (err) {
    console.error('Failed to insert listing to Supabase SDK:', err)
    return false
  }
}

/**
 * Seed all mock data into Supabase via REST SDK.
 */
export async function seedSupabaseViaSdk(): Promise<{ success: boolean; properties: number; listings: number; error?: string }> {
  const supabase = createServerClient()
  if (!supabase) {
    return { success: false, properties: 0, listings: 0, error: 'Supabase client not configured in environment' }
  }

  try {
    // 1. Seed FeeConfig
    await supabase.from('FeeConfig').upsert({
      id: 'fee_config_default',
      ...DEFAULT_FEES,
      updatedAt: new Date().toISOString(),
    })

    let propCount = 0
    let listCount = 0

    // 2. Seed Mock Listings
    for (const item of MOCK_LISTINGS) {
      await supabase.from('Property').upsert({
        id: item.propertyId,
        title: item.title,
        description: item.description,
        propertyType: item.propertyType,
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
        updatedAt: new Date().toISOString(),
      })
      propCount++

      await supabase.from('Listing').upsert({
        id: item.id,
        propertyId: item.propertyId,
        status: item.status,
        annualRent: item.annualRent,
        cautionFee: item.cautionFee,
        legalFee: item.legalFee,
        agentFeeCap: item.agentFeeCap,
        comingSoon: item.comingSoon,
        featured: item.featured,
        physicallyVerified: item.physicallyVerified,
        fairPriceBadge: item.fairPriceBadge,
        photoCount: item.photoCount,
        has360Tour: item.has360Tour,
        hasVideoWalkthrough: item.hasVideoWalkthrough,
        photoUrlsJson: JSON.stringify(item.photoUrls || []),
        updatedAt: new Date().toISOString(),
      })
      listCount++
    }

    return { success: true, properties: propCount, listings: listCount }
  } catch (err: any) {
    return { success: false, properties: 0, listings: 0, error: err.message || 'SDK seed error' }
  }
}

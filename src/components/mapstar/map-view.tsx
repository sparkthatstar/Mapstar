'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'
import { buildStarPinElement, getPinState } from './star-pin'
import {
  Navigation,
  ExternalLink,
  ShieldCheck,
  X,
  Layers,
  Sparkles,
  MapPin,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MapViewProps {
  listings: MockListing[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  center: [number, number]
  zoom?: number
}

export default function MapView({
  listings,
  selectedId,
  onSelect,
  center,
  zoom = 14,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<any[]>([])

  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [cardDismissed, setCardDismissed] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  // Active selected lodge
  const activeLodge = useMemo(() => {
    if (cardDismissed || !selectedId) return null
    return listings.find((l) => l.id === selectedId) || null
  }, [listings, selectedId, cardDismissed])

  // Initialize Google Maps instance
  useEffect(() => {
    let isCancelled = false

    if (!mapContainerRef.current) return

    // If API key is missing, flag gracefully so user can configure it
    if (!apiKey) {
      setLoadError('MISSING_API_KEY')
      setLoading(false)
      return
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['marker', 'places', 'geometry'],
    })

    loader
      .load()
      .then(async (google) => {
        if (isCancelled || !mapContainerRef.current) return

        try {
          const map = new google.maps.Map(mapContainerRef.current, {
            center: { lat: center[0], lng: center[1] },
            zoom,
            mapTypeId: mapType,
            mapId: 'MAPSTAR_GOOGLE_MAP_ID', // Enables AdvancedMarkerElement
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
          })

          mapInstanceRef.current = map
          setLoading(false)
          setLoadError(null)
        } catch (err: any) {
          console.error('[Google Maps Init Error]', err)
          setLoadError(err.message || 'Failed to initialize Google Maps')
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('[Google Maps Load Error]', err)
          setLoadError(err.message || 'Failed to load Google Maps JavaScript API')
          setLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [apiKey])

  // Change Map Type (Roadmap / Satellite)
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType)
    }
  }, [mapType])

  // Center / Pan map when center prop or selectedId changes
  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (selectedId) {
      const selected = listings.find((l) => l.id === selectedId)
      if (selected?.latitude && selected?.longitude) {
        mapInstanceRef.current.panTo({ lat: selected.latitude, lng: selected.longitude })
        mapInstanceRef.current.setZoom(16)
        setCardDismissed(false)
        return
      }
    }

    mapInstanceRef.current.panTo({ lat: center[0], lng: center[1] })
  }, [selectedId, center, listings])

  // Render Star Listing Pins on the Google Map
  useEffect(() => {
    if (!mapInstanceRef.current || typeof google === 'undefined') return

    // Clear previous markers
    markersRef.current.forEach((marker) => {
      if ('setMap' in marker) {
        marker.setMap(null)
      } else if ('map' in marker) {
        marker.map = null
      }
    })
    markersRef.current = []

    listings.forEach((listing) => {
      if (!listing.latitude || !listing.longitude) return

      const isSelected = selectedId === listing.id
      const pinElement = buildStarPinElement({
        status: listing.status,
        annualRent: listing.annualRent,
        featured: listing.featured,
        selected: isSelected,
        title: listing.title,
      })

      pinElement.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelect(listing.id)
        setCardDismissed(false)
      })

      try {
        // Attempt AdvancedMarkerElement (Google Maps modern vector markers)
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
          const advMarker = new google.maps.marker.AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: { lat: listing.latitude, lng: listing.longitude },
            content: pinElement,
            title: `${listing.title} — ${formatNaira(listing.annualRent)}/yr`,
          })
          markersRef.current.push(advMarker)
        } else {
          // Standard marker fallback with Custom Overlay or icon
          const marker = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: { lat: listing.latitude, lng: listing.longitude },
            title: listing.title,
          })
          marker.addListener('click', () => {
            onSelect(listing.id)
            setCardDismissed(false)
          })
          markersRef.current.push(marker)
        }
      } catch (err) {
        console.warn('Marker creation fallback:', err)
      }
    })
  }, [listings, selectedId, onSelect])

  return (
    <div className="relative h-full w-full flex flex-col bg-[#FAF7F2] dark:bg-[#120C08] overflow-hidden select-none">
      {/* =========================================================================
          TOP MAP BAR: Status Legend & Layer Toggle
         ========================================================================= */}
      <div className="z-10 bg-white/95 dark:bg-[#1A120B]/95 border-b border-[#E5DAC8] dark:border-[#382618] px-3 py-2 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shadow-xs transition-colors">
        {/* Visual Pin State Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold text-[11px]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold text-[11px]">Coming Soon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs shadow-red-500/50" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold text-[11px]">Unavailable</span>
          </div>
        </div>

        {/* Layer Switcher (Roadmap vs Satellite) */}
        <div className="flex items-center gap-1 bg-[#FAF7F2] dark:bg-[#120C08] p-1 rounded-xl border border-[#E5DAC8] dark:border-[#382618]">
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapType === 'roadmap'
                ? 'bg-white text-[#78350F] shadow-2xs dark:bg-[#2A1810] dark:text-[#E0904E] font-semibold border border-[#E5DAC8]/60 dark:border-[#382618]'
                : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
            }`}
          >
            Google Map
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapType === 'satellite'
                ? 'bg-white text-[#78350F] shadow-2xs dark:bg-[#2A1810] dark:text-[#E0904E] font-semibold border border-[#E5DAC8]/60 dark:border-[#382618]'
                : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* =========================================================================
          GOOGLE MAP CANVAS CONTAINER
         ========================================================================= */}
      <div className="flex-1 w-full h-full relative">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 bg-[#FAF7F2]/80 dark:bg-[#120C08]/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 z-20">
            <div className="h-7 w-7 border-3 border-[#78350F] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#78350F] dark:text-[#E0904E]">
              Loading Google Maps Platform…
            </span>
          </div>
        )}

        {/* Fallback / Configuration Notice if API Key is not yet set */}
        {loadError === 'MISSING_API_KEY' && (
          <div className="absolute inset-0 bg-[#FAF7F2]/95 dark:bg-[#120C08]/95 p-6 flex flex-col items-center justify-center text-center z-30">
            <div className="max-w-md w-full bg-white dark:bg-[#1A120B] p-6 rounded-3xl border border-[#E5DAC8] dark:border-[#382618] shadow-2xl">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto mb-3">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-[#271810] dark:text-[#FAF6F0]">
                Google Maps API Key Setup
              </h3>
              <p className="text-xs text-[#7C6859] dark:text-[#B8A598] mt-2 mb-4 leading-relaxed">
                Mapstar is ready to render the Google Maps JavaScript API with custom star pins.
                Add <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-[#78350F] dark:text-[#E0904E]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment variables.
              </p>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-left text-[11px] text-amber-900 dark:text-amber-300 space-y-1 mb-4">
                <div className="font-semibold">Quick Checklist:</div>
                <div>1. Enable <strong>Maps JavaScript API</strong> in Google Cloud Console.</div>
                <div>2. Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in Vercel &amp; local <code>.env</code>.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          FLOATING BOTTOM CARD: Selected Lodge Summary & Quick Actions
         ========================================================================= */}
      {activeLodge && (
        <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-none flex justify-center">
          <div className="pointer-events-auto relative w-full max-w-xl rounded-2xl bg-white/95 dark:bg-[#1A120B]/95 p-3 sm:p-4 shadow-xl dark:shadow-2xl border border-[#E5DAC8] dark:border-[#382618] backdrop-blur-xl text-[#271810] dark:text-[#FAF6F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 transition-colors">
            {/* Dismiss / Close button */}
            <button
              onClick={() => {
                setCardDismissed(true)
                onSelect(null)
              }}
              title="Close card and view full map"
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex-1 min-w-0 pr-6 sm:pr-2">
              <div className="flex items-center gap-2 mb-1">
                {(() => {
                  const state = getPinState(activeLodge.status)
                  const badgeColor =
                    state === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-300'
                      : state === 'COMING_SOON'
                      ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/80 dark:border-amber-800 dark:text-amber-300'
                      : 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/80 dark:border-red-800 dark:text-red-300'

                  return (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {state.replace('_', ' ')}
                    </span>
                  )
                })()}

                {activeLodge.physicallyVerified && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/80 dark:border-amber-800/70 px-1.5 py-0.5 text-[9px] font-bold dark:text-amber-300 uppercase">
                    <ShieldCheck className="h-3 w-3 text-[#78350F] dark:text-[#E0904E]" /> Verified
                  </span>
                )}
                {activeLodge.featured && (
                  <span className="rounded-md bg-yellow-100/90 text-yellow-900 border border-yellow-300 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                    ⭐ Featured
                  </span>
                )}
              </div>

              <h4 className="text-sm sm:text-base font-bold text-[#271810] dark:text-[#FAF6F0] truncate leading-snug">
                {activeLodge.title}
              </h4>
              <p className="text-xs text-[#7C6859] dark:text-[#B8A598] truncate mt-0.5">
                {PROPERTY_TYPE_LABELS[activeLodge.propertyType]} · {activeLodge.address}, {activeLodge.area}, {activeLodge.city}
              </p>
            </div>

            {/* Price & Actions */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5DAC8]/70 dark:border-[#382618]">
              <div className="text-left sm:text-right">
                <div className="text-base sm:text-lg font-extrabold text-[#78350F] dark:text-[#E0904E] leading-none">
                  {formatNaira(activeLodge.annualRent)}
                </div>
                <div className="text-[10px] text-[#7C6859] dark:text-[#B8A598] font-mono mt-0.5">per year</div>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeLodge.latitude},${activeLodge.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold shadow-md shadow-emerald-800/30 transition cursor-pointer"
                  title="Open GPS Turn-by-Turn Directions in Google Maps"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Directions</span>
                </a>

                <button
                  onClick={() => onSelect(activeLodge.id)}
                  className="rounded-xl bg-[#78350F] hover:bg-[#854D0E] dark:bg-[#B45309] dark:hover:bg-[#C2783B] text-white px-3 py-1.5 text-xs font-semibold shadow-md shadow-[#78350F]/30 transition cursor-pointer"
                >
                  Inspect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

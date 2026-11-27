'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
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
  Compass,
  Building,
  Maximize2,
  ChevronRight,
  Eye,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MapViewProps {
  listings: MockListing[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  center: [number, number]
  zoom?: number
}

// Mapbox public access token configured via environment variable
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

export default function MapView({
  listings,
  selectedId,
  onSelect,
  center,
  zoom = 13,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets')
  const [cardDismissed, setCardDismissed] = useState(false)
  const [googlePinpointOpen, setGooglePinpointOpen] = useState(false)

  // Mapbox style URLs
  const STYLES = {
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
    dark: 'mapbox://styles/mapbox/dark-v11',
  }

  // Active selected lodge
  const activeLodge = useMemo(() => {
    if (cardDismissed || !selectedId) return null
    return listings.find((l) => l.id === selectedId) || null
  }, [listings, selectedId, cardDismissed])

  // Google Maps Free Embed URL for Pinpoint inspection & Directions
  const googlePinpointEmbedUrl = useMemo(() => {
    if (!activeLodge) return ''
    const q = encodeURIComponent(`${activeLodge.latitude},${activeLodge.longitude}`)
    return `https://maps.google.com/maps?q=${q}&t=k&z=19&hl=en&output=embed`
  }, [activeLodge])

  const googleDirectionsUrl = useMemo(() => {
    if (!activeLodge) return ''
    return `https://www.google.com/maps/dir/?api=1&destination=${activeLodge.latitude},${activeLodge.longitude}`
  }, [activeLodge])

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: STYLES[mapStyle],
      center: [center[1], center[0]], // [lng, lat] for Mapbox
      zoom,
      attributionControl: false,
      trackResize: true,
      fadeDuration: 0, // Instant vector tile rendering with 0 fade delay
    })

    // Navigation Controls (zoom + compass)
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')

    // Dynamic zoom-based pin scaling function:
    // Keeps pin needle anchored to real coordinates while adjusting size subtly with zoom level
    const updatePinZoomScale = () => {
      const currentZoom = map.getZoom()
      // Smooth scaling: from 0.8 at distant zoom (z<=11) up to 1.15 at street close-up (z>=16)
      const scale = Math.min(Math.max(0.75 + (currentZoom - 10) * 0.08, 0.75), 1.25)
      if (mapContainerRef.current) {
        mapContainerRef.current.style.setProperty('--pin-zoom-scale', scale.toFixed(2))
      }
    }

    // Automatically trigger resize and initial scale on load
    map.on('load', () => {
      map.resize()
      updatePinZoomScale()
    })

    // Listen to zoom events to seamlessly scale pin markers
    map.on('zoom', updatePinZoomScale)

    // Observe container size changes (e.g. split view toggles, sidebar collapses, screen rotations)
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize()
      }
    })
    resizeObserver.observe(mapContainerRef.current)

    mapRef.current = map

    return () => {
      map.off('zoom', updatePinZoomScale)
      resizeObserver.disconnect()
      map.remove()
    }
  }, [])

  // Switch Mapbox layer styles
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(STYLES[mapStyle])
    }
  }, [mapStyle])

  // Fly to selected property or pan to center
  useEffect(() => {
    if (!mapRef.current) return

    if (selectedId) {
      const selected = listings.find((l) => l.id === selectedId)
      if (selected?.latitude && selected?.longitude) {
        mapRef.current.flyTo({
          center: [selected.longitude, selected.latitude],
          zoom: Math.max(mapRef.current.getZoom(), 15),
          essential: true,
          duration: 1200,
        })
        setCardDismissed(false)
        return
      }
    }

    mapRef.current.easeTo({
      center: [center[1], center[0]],
      zoom,
      duration: 1000,
    })
  }, [selectedId, center, listings, zoom])

  // Render & Update Custom Star + Listing Sign Pins on Mapbox canvas
  useEffect(() => {
    if (!mapRef.current) return

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    listings.forEach((listing) => {
      if (!listing.latitude || !listing.longitude) return

      const isSelected = selectedId === listing.id
      const pinEl = buildStarPinElement({
        status: listing.status,
        annualRent: listing.annualRent,
        featured: listing.featured,
        selected: isSelected,
        title: listing.title,
      })

      // Popup for quick micro-inspection
      const popupHtml = `
        <div style="font-family: inherit; padding: 4px 6px; min-width: 170px;">
          <div style="font-weight: 700; font-size: 12px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${listing.title}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            ${listing.area}, ${listing.city}
          </div>
          <div style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 800; font-size: 12px; color: #78350F;">
              ${formatNaira(listing.annualRent)}/yr
            </span>
          </div>
        </div>
      `

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupHtml)

      pinEl.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelect(listing.id)
        setCardDismissed(false)
      })

      const marker = new mapboxgl.Marker({
        element: pinEl,
        anchor: 'bottom',
      })
        .setLngLat([listing.longitude, listing.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!)

      markersRef.current.push(marker)
    })
  }, [listings, selectedId, onSelect])

  return (
    <div className="relative h-full w-full flex flex-col bg-[#FAF7F2] dark:bg-[#120C08] overflow-hidden select-none">
      {/* =========================================================================
          TOP MAP BAR: Hybrid Control, Status Legend & Map Style Selector
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

        {/* Layer Switcher (Streets / Satellite / Dark) */}
        <div className="flex items-center gap-1 bg-[#FAF7F2] dark:bg-[#120C08] p-1 rounded-xl border border-[#E5DAC8] dark:border-[#382618]">
          <button
            onClick={() => setMapStyle('streets')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapStyle === 'streets'
                ? 'bg-white text-[#78350F] shadow-2xs dark:bg-[#2A1810] dark:text-[#E0904E] font-semibold border border-[#E5DAC8]/60 dark:border-[#382618]'
                : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
            }`}
          >
            Vector Map
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapStyle === 'satellite'
                ? 'bg-white text-[#78350F] shadow-2xs dark:bg-[#2A1810] dark:text-[#E0904E] font-semibold border border-[#E5DAC8]/60 dark:border-[#382618]'
                : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAPBOX GL VECTOR CANVAS
         ========================================================================= */}
      <div className="flex-1 w-full h-full relative overflow-hidden min-h-0">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* =========================================================================
          FLOATING BOTTOM CARD: Selected Lodge Summary + Google Pinpoint Trigger
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

            {/* Price & Action Buttons */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5DAC8]/70 dark:border-[#382618]">
              <div className="text-left sm:text-right">
                <div className="text-base sm:text-lg font-extrabold text-[#78350F] dark:text-[#E0904E] leading-none">
                  {formatNaira(activeLodge.annualRent)}
                </div>
                <div className="text-[10px] text-[#7C6859] dark:text-[#B8A598] font-mono mt-0.5">per year</div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Micro Google Pinpoint Inspection Modal */}
                <button
                  onClick={() => setGooglePinpointOpen(true)}
                  className="flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 text-xs font-semibold shadow-md shadow-blue-700/30 transition cursor-pointer"
                  title="View micro pinpoint on Google Satellite"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Google Pinpoint</span>
                </button>

                {/* Google Turn-by-Turn GPS Navigation */}
                <a
                  href={googleDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1.5 text-xs font-semibold shadow-md shadow-emerald-800/30 transition cursor-pointer"
                  title="Open GPS Navigation in Google Maps"
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

      {/* =========================================================================
          GOOGLE MAPS PINPOINT EMBED MODAL (Ultra-detailed Local View)
         ========================================================================= */}
      {activeLodge && (
        <Dialog open={googlePinpointOpen} onOpenChange={setGooglePinpointOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] rounded-3xl z-[9999]">
            <DialogHeader className="p-4 bg-white dark:bg-[#1A120B] border-b border-[#E5DAC8] dark:border-[#382618]">
              <div className="flex items-center justify-between pr-6">
                <div>
                  <DialogTitle className="text-base font-bold text-[#271810] dark:text-[#FAF6F0] flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#78350F] dark:text-[#E0904E]" />
                    Google Satellite Pinpoint — {activeLodge.title}
                  </DialogTitle>
                  <p className="text-xs text-[#7C6859] dark:text-[#B8A598] mt-0.5">
                    {activeLodge.address}, {activeLodge.area}, {activeLodge.city}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="relative w-full h-[450px] bg-slate-900">
              <iframe
                src={googlePinpointEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Pinpoint"
              />
            </div>

            <div className="p-3 bg-white dark:bg-[#1A120B] border-t border-[#E5DAC8] dark:border-[#382618] flex items-center justify-between">
              <span className="text-xs text-[#7C6859] dark:text-[#B8A598]">
                Coordinates: {activeLodge.latitude}, {activeLodge.longitude}
              </span>
              <a
                href={googleDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs"
              >
                <Navigation className="h-3.5 w-3.5" />
                Launch Google Audio Navigation
              </a>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

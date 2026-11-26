'use client'

import { useState, useMemo, useEffect } from 'react'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'
import {
  Navigation,
  MapPin,
  Car,
  Footprints,
  Compass,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
  Building2,
  Crosshair,
  Bus,
  Maximize2,
  ChevronRight,
  Route as RouteIcon,
  Search,
  X,
} from 'lucide-react'

interface MapViewProps {
  listings: MockListing[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  center: [number, number]
  zoom?: number
}

// Popular Nigerian Campus & City Landmarks for quick 1-click start locations
const NIGERIAN_LANDMARKS = [
  // Owerri
  { label: 'IMSU Main Gate, Owerri', query: 'Imo State University Main Gate Owerri', lat: 5.502, lng: 7.039 },
  { label: 'FUTO Main Gate, Ihiagwa', query: 'Federal University of Technology Owerri Main Gate', lat: 5.385, lng: 6.995 },
  { label: 'Relief Market, Owerri', query: 'Relief Market Owerri Imo State', lat: 5.482, lng: 7.014 },
  { label: 'Control Post Roundabout, Owerri', query: 'Control Post Roundabout Owerri', lat: 5.475, lng: 6.998 },
  { label: 'Aladinma Mall / Library, Owerri', query: 'Aladinma Shopping Mall Owerri', lat: 5.495, lng: 7.041 },
  { label: 'Federal Poly Nekede Junction', query: 'Federal Polytechnic Nekede Owerri', lat: 5.438, lng: 7.026 },
  { label: 'Wetheral / Douglas Rd, Owerri', query: 'Wetheral Road Owerri', lat: 5.485, lng: 7.028 },
  // Enugu
  { label: 'UNN Main Gate, Nsukka', query: 'University of Nigeria Nsukka Main Gate', lat: 6.861, lng: 7.396 },
  { label: 'ESUT Main Gate, Agbani', query: 'Enugu State University of Science and Technology Agbani', lat: 6.312, lng: 7.545 },
  { label: 'IMT Main Campus, Enugu', query: 'Institute of Management and Technology Enugu', lat: 6.442, lng: 7.512 },
  { label: 'Polo Park Mall, GRA Enugu', query: 'Polo Park Mall Enugu', lat: 6.452, lng: 7.508 },
  { label: 'Otigba Junction, Enugu', query: 'Otigba Junction Enugu', lat: 6.44, lng: 7.525 },
  { label: 'Holy Ghost / Old Park, Enugu', query: 'Holy Ghost Cathedral Old Park Enugu', lat: 6.435, lng: 7.498 },
]

type MapDisplayMode = 'location' | 'directions'
type MapLayerStyle = 'roadmap' | 'satellite' | 'terrain'
type TravelMode = 'driving' | 'walking' | 'transit'

export default function MapView({
  listings,
  selectedId,
  onSelect,
  center,
  zoom = 15,
}: MapViewProps) {
  const [activeMode, setActiveMode] = useState<MapDisplayMode>('location')
  const [layerStyle, setLayerStyle] = useState<MapLayerStyle>('roadmap')
  const [travelMode, setTravelMode] = useState<TravelMode>('driving')
  const [targetListingId, setTargetListingId] = useState<string | null>(null)

  // Start point for directions
  const [startQuery, setStartQuery] = useState<string>('IMSU Main Gate, Owerri')
  const [customStartInput, setCustomStartInput] = useState<string>('')
  const [isUsingGps, setIsUsingGps] = useState<boolean>(false)

  // Active lodge - only display if selected by user, with ability to close/dismiss
  const [cardDismissed, setCardDismissed] = useState(false)

  // Auto-sync active target lodge with selectedId
  useEffect(() => {
    if (selectedId) {
      setTargetListingId(selectedId)
      setCardDismissed(false)
    }
  }, [selectedId])

  // Active lodge
  const activeLodge = useMemo(() => {
    if (cardDismissed) return null
    if (targetListingId) {
      const found = listings.find((l) => l.id === targetListingId)
      if (found) return found
    }
    if (selectedId) {
      const found = listings.find((l) => l.id === selectedId)
      if (found) return found
    }
    return null
  }, [listings, targetListingId, selectedId, cardDismissed])

  // Get User GPS Location
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setIsUsingGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`
        setStartQuery(coords)
        setCustomStartInput('Your Current GPS Location')
        setIsUsingGps(false)
      },
      (err) => {
        console.warn('GPS location error:', err)
        setIsUsingGps(false)
        // Fallback to IMSU gate
        setStartQuery(NIGERIAN_LANDMARKS[0].query)
        setCustomStartInput(NIGERIAN_LANDMARKS[0].label)
      },
      { timeout: 7000 }
    )
  }

  // Construct Destination Query String
  const destinationQuery = useMemo(() => {
    if (!activeLodge) return `${center[0]},${center[1]}`
    return `${activeLodge.latitude},${activeLodge.longitude}`
  }, [activeLodge, center])

  // Construct Embedded Google Maps URL
  const googleMapEmbedUrl = useMemo(() => {
    // Mode 1: Directions & Route Navigation
    if (activeMode === 'directions') {
      const saddr = encodeURIComponent(startQuery || customStartInput || 'IMSU Main Gate Owerri')
      const daddr = encodeURIComponent(destinationQuery)
      return `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&hl=en&output=embed`
    }

    // Mode 2: Location Map with Layer Style
    const q = encodeURIComponent(destinationQuery)
    const tParam = layerStyle === 'satellite' ? '&t=k' : layerStyle === 'terrain' ? '&t=p' : ''
    return `https://maps.google.com/maps?q=${q}&hl=en&z=${zoom}${tParam}&output=embed`
  }, [activeMode, startQuery, customStartInput, destinationQuery, layerStyle, zoom])

  // Direct External Google Maps App Link for Live GPS Turn-by-Turn Audio Navigation
  const googleMapsExternalUrl = useMemo(() => {
    const origin = encodeURIComponent(startQuery || customStartInput || '')
    const destination = encodeURIComponent(destinationQuery)
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelMode}`
  }, [startQuery, customStartInput, destinationQuery, travelMode])

  return (
    <div className="relative h-full w-full flex flex-col bg-[#FAF7F2] dark:bg-[#120C08] overflow-hidden select-none transition-colors duration-200">
      {/* =========================================================================
          TOP CONTROL BAR: Mode, Layers & Landmark Navigation
         ========================================================================= */}
      <div className="z-20 bg-white/95 dark:bg-[#1A120B]/95 border-b border-[#E5DAC8] dark:border-[#382618] p-2.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shadow-sm dark:shadow-lg text-[#271810] dark:text-[#FAF6F0] transition-colors">
        {/* Left: Mode Switcher (Lodge Location vs Live Directions) */}
        <div className="flex items-center gap-1 bg-[#FAF7F2] dark:bg-[#120C08] p-1 rounded-xl border border-[#E5DAC8] dark:border-[#382618]">
          <button
            onClick={() => setActiveMode('location')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeMode === 'location'
                ? 'bg-[#78350F] text-white shadow-md shadow-[#78350F]/30 dark:bg-[#B45309]'
                : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Lodge Pin</span>
          </button>
          <button
            onClick={() => {
              setActiveMode('directions')
              if (!startQuery && !customStartInput) {
                handleGetGpsLocation()
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeMode === 'directions'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/30 dark:bg-emerald-600'
                : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
            }`}
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>Get Directions</span>
          </button>
        </div>

        {/* Center: Lodge Quick Switcher */}
        <div className="flex items-center gap-2 flex-1 max-w-[280px] sm:max-w-xs">
          <select
            value={targetListingId || activeLodge?.id || ''}
            onChange={(e) => {
              setTargetListingId(e.target.value)
              onSelect(e.target.value)
            }}
            className="w-full text-xs bg-white dark:bg-[#120C08] border border-[#E5DAC8] dark:border-[#382618] rounded-xl px-2.5 py-1.5 text-[#271810] dark:text-[#FAF6F0] font-medium focus:outline-none focus:border-[#78350F] dark:focus:border-[#B45309] cursor-pointer truncate shadow-xs"
          >
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                📍 {l.title} ({l.area}) — {formatNaira(l.annualRent)}/yr
              </option>
            ))}
          </select>
        </div>

        {/* Right: Map Layers Style (Roadmap, Satellite, Terrain) */}
        {activeMode === 'location' && (
          <div className="flex items-center gap-1 bg-[#FAF7F2] dark:bg-[#120C08] p-1 rounded-xl border border-[#E5DAC8] dark:border-[#382618]">
            <button
              onClick={() => setLayerStyle('roadmap')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                layerStyle === 'roadmap'
                  ? 'bg-white text-[#78350F] shadow-2xs dark:bg-[#2A1810] dark:text-[#E0904E] font-semibold border border-[#E5DAC8]/60 dark:border-[#382618]'
                  : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
              }`}
              title="Street Roadmap"
            >
              Map
            </button>
            <button
              onClick={() => setLayerStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                layerStyle === 'satellite'
                  ? 'bg-white text-[#78350F] shadow-2xs dark:bg-[#2A1810] dark:text-[#E0904E] font-semibold border border-[#E5DAC8]/60 dark:border-[#382618]'
                  : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
              }`}
              title="Satellite View"
            >
              Satellite
            </button>
            <button
              onClick={() => setLayerStyle('terrain')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                layerStyle === 'terrain'
                  ? 'bg-white text-[#78350F] shadow-2xs dark:bg-[#2A1810] dark:text-[#E0904E] font-semibold border border-[#E5DAC8]/60 dark:border-[#382618]'
                  : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
              }`}
              title="Terrain & Elevation"
            >
              Terrain
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          DIRECTIONS PLANNER BAR (When Directions Mode is Active)
         ========================================================================= */}
      {activeMode === 'directions' && (
        <div className="z-10 bg-white/95 dark:bg-[#1A120B]/95 border-b border-[#E5DAC8] dark:border-[#382618] p-3 text-[#271810] dark:text-[#FAF6F0] backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm transition-colors">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Origin Landmark Selector */}
            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 inline-block animate-ping" />
                From:
              </span>
              <div className="flex-1 w-full flex items-center gap-1.5">
                <select
                  value={customStartInput ? 'custom' : startQuery}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === 'gps') {
                      handleGetGpsLocation()
                    } else if (val === 'custom') {
                      setCustomStartInput('IMSU Junction')
                    } else {
                      setStartQuery(val)
                      setCustomStartInput('')
                    }
                  }}
                  className="flex-1 text-xs bg-[#FAF7F2] dark:bg-[#120C08] border border-[#E5DAC8] dark:border-[#382618] rounded-xl px-2.5 py-1.5 text-[#271810] dark:text-[#FAF6F0] font-medium focus:outline-none focus:border-emerald-600 cursor-pointer shadow-xs"
                >
                  <option value="gps">🎯 My Current GPS Location</option>
                  <optgroup label="Popular Landmarks (Owerri & Enugu)">
                    {NIGERIAN_LANDMARKS.map((lm) => (
                      <option key={lm.label} value={lm.query}>
                        🏫 {lm.label}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <button
                  onClick={handleGetGpsLocation}
                  disabled={isUsingGps}
                  className="flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 dark:border-emerald-800/60 dark:text-emerald-300 px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer shrink-0 shadow-xs"
                  title="Use live GPS location"
                >
                  <Crosshair className={`h-3.5 w-3.5 ${isUsingGps ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">GPS</span>
                </button>
              </div>
            </div>

            {/* Travel Mode: Driving / Walking / Transit */}
            <div className="flex items-center gap-1 bg-[#FAF7F2] dark:bg-[#120C08] p-1 rounded-xl border border-[#E5DAC8] dark:border-[#382618] shrink-0">
              <button
                onClick={() => setTravelMode('driving')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  travelMode === 'driving'
                    ? 'bg-[#78350F] text-white font-semibold shadow-xs dark:bg-[#B45309]'
                    : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
                }`}
                title="Drive / Keke / Bike"
              >
                <Car className="h-3.5 w-3.5" />
                <span>Drive</span>
              </button>
              <button
                onClick={() => setTravelMode('walking')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  travelMode === 'walking'
                    ? 'bg-[#78350F] text-white font-semibold shadow-xs dark:bg-[#B45309]'
                    : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
                }`}
                title="Walking route"
              >
                <Footprints className="h-3.5 w-3.5" />
                <span>Walk</span>
              </button>
              <button
                onClick={() => setTravelMode('transit')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  travelMode === 'transit'
                    ? 'bg-[#78350F] text-white font-semibold shadow-xs dark:bg-[#B45309]'
                    : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
                }`}
                title="Public Transit"
              >
                <Bus className="h-3.5 w-3.5" />
                <span>Bus</span>
              </button>
            </div>

            {/* Google Maps App Voice Navigation Launch Button */}
            <a
              href={googleMapsExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-bold px-3.5 py-1.5 text-xs shadow-md shadow-emerald-800/30 transition cursor-pointer shrink-0"
              title="Launch turn-by-turn spoken voice GPS navigation on your phone"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Start Voice GPS</span>
              <ExternalLink className="h-3 w-3 opacity-75" />
            </a>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN MAP CANVAS: Interactive Google Maps Embed
         ========================================================================= */}
      <div className="relative flex-1 w-full h-full bg-[#FAF7F2] dark:bg-[#120C08]">
        <iframe
          key={googleMapEmbedUrl}
          src={googleMapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapstar Google Maps"
          className="w-full h-full filter-none dark:invert-[0.85] dark:hue-rotate-[180deg] dark:contrast-[1.15] dark:brightness-[0.9] dark:saturate-[0.8] transition-all duration-300"
        />

        {/* Ambient Dark Overlay to match Furniture Brown Obsidian Style in Dark Mode */}
        <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 shadow-[inset_0_0_80px_rgba(18,12,8,0.7)] transition-opacity duration-300" />
      </div>

      {/* =========================================================================
          FLOATING BOTTOM CARD: Selected Lodge Summary & Quick Actions
         ========================================================================= */}
      {activeLodge && (
        <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex justify-center">
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
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 dark:bg-[#2A1810] dark:border-[#382618] px-2 py-0.5 text-[10px] font-bold dark:text-amber-200 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#78350F] dark:bg-[#E0904E]" />
                  {activeLodge.status.replace('_', ' ')}
                </span>
                {activeLodge.physicallyVerified && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/80 dark:border-amber-800/70 px-1.5 py-0.5 text-[9px] font-bold dark:text-amber-300 uppercase">
                    <ShieldCheck className="h-3 w-3 text-[#78350F] dark:text-[#E0904E]" /> Verified
                  </span>
                )}
                {activeLodge.featured && (
                  <span className="rounded-md bg-amber-100/80 text-amber-900 border border-amber-300 dark:bg-[#2A1810] dark:border-amber-800/70 px-1.5 py-0.5 text-[9px] font-bold dark:text-amber-300 uppercase">
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
                {activeMode !== 'directions' ? (
                  <button
                    onClick={() => {
                      setActiveMode('directions')
                      if (!startQuery && !customStartInput) {
                        handleGetGpsLocation()
                      }
                    }}
                    className="flex items-center gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold shadow-md shadow-emerald-800/30 transition cursor-pointer"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Directions</span>
                  </button>
                ) : (
                  <a
                    href={googleMapsExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold shadow-md shadow-emerald-800/30 transition cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Navigation</span>
                  </a>
                )}

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

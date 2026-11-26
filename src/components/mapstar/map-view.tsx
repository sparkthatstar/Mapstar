'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createMapstarListingIcon, getPinState, PinState } from './star-pin'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'
import {
  Navigation,
  ExternalLink,
  ShieldCheck,
  X,
  Compass,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface MapViewProps {
  listings: MockListing[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  center: [number, number]
  zoom?: number
}

// Controller to smoothly fly to the selected listing or recenter
function MapFlyController({
  selectedListing,
  center,
  zoom = 13,
}: {
  selectedListing?: MockListing | null
  center: [number, number]
  zoom?: number
}) {
  const map = useMap()

  useEffect(() => {
    if (selectedListing) {
      map.flyTo([selectedListing.latitude, selectedListing.longitude], Math.max(map.getZoom(), 15), {
        animate: true,
        duration: 1.0,
      })
    }
  }, [selectedListing, map])

  return null
}

export default function MapView({
  listings,
  selectedId,
  onSelect,
  center,
  zoom = 13,
}: MapViewProps) {
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite'>('streets')
  const [cardDismissed, setCardDismissed] = useState(false)

  // Auto-sync active target lodge with selectedId
  useEffect(() => {
    if (selectedId) {
      setCardDismissed(false)
    }
  }, [selectedId])

  // Active lodge details
  const activeLodge = useMemo(() => {
    if (cardDismissed || !selectedId) return null
    return listings.find((l) => l.id === selectedId) || null
  }, [listings, selectedId, cardDismissed])

  // Map Tile URLs
  const tileUrl =
    mapLayer === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

  const tileAttribution =
    mapLayer === 'satellite'
      ? '&copy; <a href="https://www.esri.com/">Esri</a>'
      : '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

  return (
    <div className="relative h-full w-full flex flex-col bg-[#FAF7F2] dark:bg-[#120C08] overflow-hidden select-none">
      {/* =========================================================================
          TOP MAP BAR: Controls & Visual Pin Legend
         ========================================================================= */}
      <div className="z-[1000] bg-white/95 dark:bg-[#1A120B]/95 border-b border-[#E5DAC8] dark:border-[#382618] px-3 py-2 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shadow-xs transition-colors">
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

        {/* Layer Switcher (Streets vs Satellite) */}
        <div className="flex items-center gap-1 bg-[#FAF7F2] dark:bg-[#120C08] p-1 rounded-xl border border-[#E5DAC8] dark:border-[#382618]">
          <button
            onClick={() => setMapLayer('streets')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapLayer === 'streets'
                ? 'bg-white text-[#78350F] shadow-2xs dark:bg-[#2A1810] dark:text-[#E0904E] font-semibold border border-[#E5DAC8]/60 dark:border-[#382618]'
                : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
            }`}
          >
            Streets
          </button>
          <button
            onClick={() => setMapLayer('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapLayer === 'satellite'
                ? 'bg-white text-[#78350F] shadow-2xs dark:bg-[#2A1810] dark:text-[#E0904E] font-semibold border border-[#E5DAC8]/60 dark:border-[#382618]'
                : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0]'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* =========================================================================
          LEAFLET INTERACTIVE MAP CONTAINER
         ========================================================================= */}
      <div className="flex-1 w-full h-full relative z-0">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          className="h-full w-full"
          attributionControl={false}
        >
          <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={19} />

          <MapFlyController
            selectedListing={listings.find((l) => l.id === selectedId)}
            center={center}
            zoom={zoom}
          />

          {/* Render All Verified Listings on the Map with Exact GPS Coordinates */}
          {listings.map((listing) => {
            if (!listing.latitude || !listing.longitude) return null
            const isSelected = selectedId === listing.id
            const icon = createMapstarListingIcon({
              status: listing.status,
              annualRent: listing.annualRent,
              featured: listing.featured,
              selected: isSelected,
              title: listing.title,
            })

            return (
              <Marker
                key={listing.id}
                position={[listing.latitude, listing.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    onSelect(listing.id)
                    setCardDismissed(false)
                  },
                }}
              >
                {/* Embedded Popup for instant micro-inspection */}
                <Popup className="mapstar-popup" offset={[0, -10]}>
                  <div className="p-1 min-w-[180px] max-w-[220px]">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {listing.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {listing.area}, {listing.city}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#78350F]">
                        {formatNaira(listing.annualRent)}/yr
                      </span>
                      <button
                        onClick={() => onSelect(listing.id)}
                        className="px-2 py-0.5 rounded bg-[#78350F] text-white text-[10px] font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {/* =========================================================================
          FLOATING BOTTOM CARD: Selected Lodge Summary & Quick Actions
         ========================================================================= */}
      {activeLodge && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none flex justify-center">
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
                {/* Status Badge with color match */}
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
                  title="Open GPS Turn-by-Turn Directions"
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

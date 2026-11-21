'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createStarIcon, statusToColor } from './star-pin'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'
import { Moon, Sun, Layers, Compass, Maximize2, ShieldCheck, Sparkles, Building2 } from 'lucide-react'

interface MapViewProps {
  listings: MockListing[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  center: [number, number]
  zoom?: number
}

// Helper to recenter or fly to the selected listing or city center
function Recenter({
  center,
  zoom,
  selectedListing,
}: {
  center: [number, number]
  zoom?: number
  selectedListing?: MockListing | null
}) {
  const map = useMap()

  useEffect(() => {
    if (selectedListing) {
      map.flyTo([selectedListing.latitude, selectedListing.longitude], Math.max(map.getZoom(), 15), {
        animate: true,
        duration: 1.2,
      })
    } else {
      map.setView(center, zoom ?? map.getZoom(), { animate: true })
    }
  }, [center, zoom, selectedListing, map])

  return null
}

// Controller to fit all current listings
function FitAllController({
  trigger,
  listings,
}: {
  trigger: number
  listings: MockListing[]
}) {
  const map = useMap()

  useEffect(() => {
    if (trigger > 0 && listings.length > 0) {
      const bounds = L.latLngBounds(listings.map((l) => [l.latitude, l.longitude]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true })
    }
  }, [trigger, listings, map])

  return null
}

type MapTileStyle = 'dark' | 'satellite' | 'voyager'

export default function MapView({
  listings,
  selectedId,
  onSelect,
  center,
  zoom = 13,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [mapTheme, setMapTheme] = useState<MapTileStyle>('dark')
  const [fitTrigger, setFitTrigger] = useState(0)
  const [legendCollapsed, setLegendCollapsed] = useState(false)

  // Selected listing object (if any)
  const selectedListing = listings.find((l) => l.id === selectedId) ?? null

  // Fix default leaflet marker icon path
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  return (
    <div ref={containerRef} className="relative h-full w-full z-0 isolate overflow-hidden bg-[#070A12] select-none">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full z-0"
        style={{ background: '#070A12', zIndex: 0 }}
      >
        {/* Map Layers */}
        {mapTheme === 'dark' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
            subdomains="abcd"
          />
        )}
        {mapTheme === 'satellite' && (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}
        {mapTheme === 'voyager' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
            subdomains="abcd"
          />
        )}

        <Recenter center={center} zoom={zoom} selectedListing={selectedListing} />
        <FitAllController trigger={fitTrigger} listings={listings} />

        {listings.map((l) => {
          const color = statusToColor(l.status)
          const isSelected = selectedId === l.id
          return (
            <Marker
              key={l.id}
              position={[l.latitude, l.longitude]}
              icon={createStarIcon(color, {
                featured: l.featured,
                selected: isSelected,
              })}
              eventHandlers={{
                click: () => onSelect(l.id),
              }}
            >
              <Popup>
                <div className="min-w-[220px] max-w-[260px] p-1 text-slate-100">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      <span
                        className="inline-block w-2 h-2 rounded-full shadow-xs"
                        style={{
                          background:
                            color === 'green'
                              ? '#10B981'
                              : color === 'orange'
                              ? '#F59E0B'
                              : color === 'blue'
                              ? '#3B82F6'
                              : color === 'grey'
                              ? '#64748B'
                              : '#F43F5E',
                        }}
                      />
                      {l.status.replace('_', ' ')}
                    </span>
                    {l.featured && (
                      <span className="text-[9px] font-extrabold text-sky-400 bg-sky-950/90 border border-sky-800/70 px-1.5 py-0.5 rounded tracking-wider">
                        FEATURED
                      </span>
                    )}
                  </div>

                  <div className="font-semibold text-sm text-white leading-snug line-clamp-2">
                    {l.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {PROPERTY_TYPE_LABELS[l.propertyType]} · {l.area}, {l.city}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-blue-400 font-extrabold text-base leading-none">
                        {formatNaira(l.annualRent)}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">per year</div>
                    </div>
                    <button
                      onClick={() => onSelect(l.id)}
                      className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
                    >
                      Inspect Lodge
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Floating Top Controls Bar over Map */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: Active Pin Count badge */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-[#090D18]/90 px-3 py-1.5 shadow-xl border border-slate-800/90 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className="text-xs font-semibold text-slate-200">
            {listings.length} <span className="text-slate-400 font-normal">pins on map</span>
          </span>
        </div>

        {/* Right: Map Actions & Themes */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {/* Fit all pins button */}
          <button
            onClick={() => setFitTrigger((t) => t + 1)}
            className="flex items-center gap-1.5 rounded-xl bg-[#090D18]/90 hover:bg-[#121B30] text-slate-300 hover:text-white border border-slate-800 px-2.5 py-1.5 text-xs font-medium shadow-xl backdrop-blur-md transition cursor-pointer"
            title="Fit all visible lodges"
          >
            <Maximize2 className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Fit All</span>
          </button>

          {/* Map theme picker */}
          <div className="flex items-center rounded-xl bg-[#090D18]/90 p-1 border border-slate-800 shadow-xl backdrop-blur-md">
            <button
              onClick={() => setMapTheme('dark')}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition cursor-pointer ${
                mapTheme === 'dark'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Midnight Obsidian Dark Map"
            >
              <Moon className="h-3.5 w-3.5 inline mr-1" />
              <span className="hidden md:inline">Dark</span>
            </button>
            <button
              onClick={() => setMapTheme('satellite')}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition cursor-pointer ${
                mapTheme === 'satellite'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Satellite Aerial Imagery"
            >
              <Layers className="h-3.5 w-3.5 inline mr-1" />
              <span className="hidden md:inline">Satellite</span>
            </button>
            <button
              onClick={() => setMapTheme('voyager')}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition cursor-pointer ${
                mapTheme === 'voyager'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="High-Contrast Street Map"
            >
              <Compass className="h-3.5 w-3.5 inline mr-1" />
              <span className="hidden md:inline">Streets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sleek Pin legend overlay (Bottom-Right) */}
      <div className="absolute bottom-3 right-3 z-[1000] rounded-xl bg-[#090D18]/95 p-2.5 shadow-2xl border border-slate-800/90 backdrop-blur-md">
        <button
          onClick={() => setLegendCollapsed(!legendCollapsed)}
          className="w-full flex items-center justify-between gap-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition mb-1 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50" />
            Mapstar Pin Guide
          </div>
          <span className="text-[10px] text-slate-500">{legendCollapsed ? '+' : '−'}</span>
        </button>

        {!legendCollapsed && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] pt-1 border-t border-slate-800/60 mt-1">
            <LegendItem color="#10B981" label="Available" />
            <LegendItem color="#F59E0B" label="Coming soon" />
            <LegendItem color="#3B82F6" label="Under inspection" />
            <LegendItem color="#64748B" label="Recently let" />
            <LegendItem color="#F43F5E" label="Verified lodge" />
            <LegendItem color="#38BDF8" label="Featured star" ring />
          </div>
        )}
      </div>
    </div>
  )
}

function LegendItem({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="11" height="11" viewBox="0 0 32 32">
        {ring && <circle cx="16" cy="16" r="14" fill="none" stroke={color} strokeWidth="3.5" />}
        <path
          d="M16 2 L19.6 12.2 L30.4 12.5 L21.7 19.0 L24.7 29.3 L16 23.2 L7.3 29.3 L10.3 19.0 L1.6 12.5 L12.4 12.2 Z"
          fill={color}
        />
      </svg>
      <span className="text-slate-300 font-medium">{label}</span>
    </div>
  )
}

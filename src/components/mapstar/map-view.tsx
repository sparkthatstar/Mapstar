'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createStarIcon, statusToColor } from './star-pin'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'
import {
  Moon,
  Layers,
  Compass,
  Maximize2,
  Navigation,
  MapPin,
  Car,
  Footprints,
  ExternalLink,
  X,
  RotateCcw,
  Route as RouteIcon,
  Crosshair,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface MapViewProps {
  listings: MockListing[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  center: [number, number]
  zoom?: number
}

// Popular Nigerian Campus & City Landmarks for quick start points
const POPULAR_LANDMARKS = [
  // Owerri
  { name: 'IMSU Main Gate, Owerri', city: 'Owerri', lat: 5.502, lng: 7.039 },
  { name: 'FUTO Main Gate, Ihiagwa', city: 'Owerri', lat: 5.385, lng: 6.995 },
  { name: 'Relief Market, Owerri', city: 'Owerri', lat: 5.482, lng: 7.014 },
  { name: 'Control Post Roundabout, Owerri', city: 'Owerri', lat: 5.475, lng: 6.998 },
  { name: 'Aladinma Mall, Owerri', city: 'Owerri', lat: 5.495, lng: 7.041 },
  { name: 'Federal Poly Nekede Junction', city: 'Owerri', lat: 5.438, lng: 7.026 },
  { name: 'Wetheral / Douglas Rd Junction', city: 'Owerri', lat: 5.485, lng: 7.028 },
  // Enugu
  { name: 'UNN Main Gate, Nsukka', city: 'Enugu', lat: 6.861, lng: 7.396 },
  { name: 'ESUT Agbani Gate, Enugu', city: 'Enugu', lat: 6.312, lng: 7.545 },
  { name: 'IMT Main Campus, Enugu', city: 'Enugu', lat: 6.442, lng: 7.512 },
  { name: 'Polo Park Mall, GRA Enugu', city: 'Enugu', lat: 6.452, lng: 7.508 },
  { name: 'Otigba Junction, Enugu', city: 'Enugu', lat: 6.44, lng: 7.525 },
  { name: 'Holy Ghost / Old Park, Enugu', city: 'Enugu', lat: 6.435, lng: 7.498 },
]

interface RouteStep {
  instruction: string
  distance: number
}

interface RouteResult {
  coordinates: [number, number][]
  distanceMeters: number
  durationSeconds: number
  steps: RouteStep[]
}

// Recenter or fly to selected listing
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
        duration: 1.0,
      })
    } else {
      map.setView(center, zoom ?? map.getZoom(), { animate: true })
    }
  }, [center, zoom, selectedListing, map])

  return null
}

// Fit bounds to show entire active route
function RouteBoundsController({ routeCoords }: { routeCoords: [number, number][] | null }) {
  const map = useMap()

  useEffect(() => {
    if (routeCoords && routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords)
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true })
    }
  }, [routeCoords, map])

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

// Map Click Listener to pick custom start location when picking mode is active
function MapClickPicker({
  picking,
  onPick,
}: {
  picking: boolean
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (picking) {
        onPick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

type MapTileStyle = 'dark' | 'street' | 'satellite'

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

  // Directions state
  const [directionsOpen, setDirectionsOpen] = useState(false)
  const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving')
  const [startPoint, setStartPoint] = useState<{ label: string; lat: number; lng: number } | null>(null)
  const [targetLodgeId, setTargetLodgeId] = useState<string | null>(null)
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const [calculatingRoute, setCalculatingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [pickingLocation, setPickingLocation] = useState(false)
  const [stepsExpanded, setStepsExpanded] = useState(false)

  // Selected listing object (if any)
  const selectedListing = listings.find((l) => l.id === selectedId) ?? null
  const targetLodge = listings.find((l) => l.id === (targetLodgeId || selectedId)) ?? listings[0] ?? null

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

  // Auto-set destination lodge when selected
  useEffect(() => {
    if (selectedId) {
      setTargetLodgeId(selectedId)
    }
  }, [selectedId])

  // Start marker icon
  const startPinIcon = L.divIcon({
    className: 'custom-start-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        background: #10B981;
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 0 15px rgba(16, 185, 129, 0.8), 0 3px 8px rgba(0,0,0,0.6);
        color: white;
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })

  // Use GPS location as start
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setRouteError('Geolocation is not supported by your browser')
      return
    }
    setRouteError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStartPoint({
          label: 'Your Current GPS Location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => {
        // Fallback to closest campus landmark
        const fallback = POPULAR_LANDMARKS[0]
        setStartPoint({
          label: `${fallback.name} (GPS Default)`,
          lat: fallback.lat,
          lng: fallback.lng,
        })
      },
      { timeout: 8000 }
    )
  }

  // Calculate live route via OSRM (100% Free, No Key Required)
  const calculateRoute = async () => {
    if (!startPoint || !targetLodge) {
      setRouteError('Please select both a start point and a destination lodge')
      return
    }

    setCalculatingRoute(true)
    setRouteError(null)

    const profile = travelMode === 'walking' ? 'foot' : 'driving'
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startPoint.lng},${startPoint.lat};${targetLodge.longitude},${targetLodge.latitude}?overview=full&geometries=geojson&steps=true`

    try {
      const res = await fetch(url)
      const data = await res.json()
      if (!data.routes || data.routes.length === 0) {
        setRouteError('No direct road route found between these locations')
        setCalculatingRoute(false)
        return
      }

      const route = data.routes[0]
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      )

      const steps: RouteStep[] = []
      if (route.legs?.[0]?.steps) {
        for (const s of route.legs[0].steps) {
          let text = s.name ? `${s.maneuver.type} onto ${s.name}` : s.maneuver.type
          if (s.maneuver.modifier) {
            text = `${s.maneuver.type} ${s.maneuver.modifier}${s.name ? ' onto ' + s.name : ''}`
          }
          if (s.maneuver.type === 'depart') {
            text = `Head ${s.maneuver.modifier || 'forward'}${s.name ? ' on ' + s.name : ''}`
          } else if (s.maneuver.type === 'arrive') {
            text = `Arrive at lodge on the ${s.maneuver.modifier || 'destination'}`
          }
          text = text.charAt(0).toUpperCase() + text.slice(1)
          steps.push({
            instruction: text,
            distance: Math.round(s.distance),
          })
        }
      }

      setRouteResult({
        coordinates,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        steps,
      })
    } catch {
      setRouteError('Could not reach routing engine. You can still use Google Maps Navigation below.')
    } finally {
      setCalculatingRoute(false)
    }
  }

  // Auto calculate when start point or destination changes
  useEffect(() => {
    if (startPoint && targetLodge && directionsOpen) {
      calculateRoute()
    }
  }, [startPoint, targetLodge?.id, travelMode])

  // Open directions for a specific listing
  const openDirectionsForLodge = (lodgeId: string) => {
    setTargetLodgeId(lodgeId)
    onSelect(lodgeId)
    setDirectionsOpen(true)
    if (!startPoint) {
      handleUseGps()
    }
  }

  // Clear current route
  const clearRoute = () => {
    setRouteResult(null)
    setStartPoint(null)
    setRouteError(null)
    setDirectionsOpen(false)
    setPickingLocation(false)
  }

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(1)} km`
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.max(1, Math.round(seconds / 60))
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'}`
    const hrs = Math.floor(mins / 60)
    const remMins = mins % 60
    return `${hrs}h ${remMins}m`
  }

  return (
    <div ref={containerRef} className="relative h-full w-full z-0 isolate overflow-hidden bg-[#070A12] select-none">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full z-0"
        style={{ background: '#070A12', zIndex: 0 }}
      >
        {/* Layer 1: Obsidian Midnight Dark (OpenStreetMap with custom sleek hardware filter) */}
        {mapTheme === 'dark' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="mapstar-dark-tiles"
            maxZoom={19}
          />
        )}

        {/* Layer 2: Esri Street Map (Crisp daytime street map with sharp landmarks, zero keys) */}
        {mapTheme === 'street' && (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{x}/{y}"
            maxZoom={18}
          />
        )}

        {/* Layer 3: Esri Satellite World Imagery + Street Reference Overlay */}
        {mapTheme === 'satellite' && (
          <>
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
            <TileLayer
              attribution='Labels &copy; Esri'
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </>
        )}

        <Recenter center={center} zoom={zoom} selectedListing={selectedListing} />
        <FitAllController trigger={fitTrigger} listings={listings} />
        <RouteBoundsController routeCoords={routeResult?.coordinates ?? null} />
        <MapClickPicker
          picking={pickingLocation}
          onPick={(lat, lng) => {
            setStartPoint({
              label: `Custom Map Pin (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
              lat,
              lng,
            })
            setPickingLocation(false)
          }}
        />

        {/* Active Route Polyline overlay */}
        {routeResult && (
          <>
            {/* Soft electric-blue glow behind route */}
            <Polyline
              positions={routeResult.coordinates}
              pathOptions={{
                color: '#1D4ED8',
                weight: 9,
                opacity: 0.45,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Crisp foreground route path */}
            <Polyline
              positions={routeResult.coordinates}
              pathOptions={{
                color: '#38BDF8',
                weight: 5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        )}

        {/* Start Point Marker */}
        {startPoint && (
          <Marker position={[startPoint.lat, startPoint.lng]} icon={startPinIcon}>
            <Popup>
              <div className="p-1 text-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Starting Location
                </div>
                <div className="text-xs font-semibold text-white mt-0.5">{startPoint.label}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Lodge Star Pins */}
        {listings.map((l) => {
          const color = statusToColor(l.status)
          const isSelected = selectedId === l.id || targetLodgeId === l.id
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

                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                    <div>
                      <div className="text-blue-400 font-extrabold text-base leading-none">
                        {formatNaira(l.annualRent)}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">per year</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openDirectionsForLodge(l.id)}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2 py-1.5 text-xs font-semibold text-white shadow-md transition cursor-pointer flex items-center gap-1"
                        title="Get live directions to this lodge"
                      >
                        <Navigation className="h-3 w-3" />
                        <span>Route</span>
                      </button>
                      <button
                        onClick={() => onSelect(l.id)}
                        className="rounded-lg bg-blue-600 hover:bg-blue-500 px-2 py-1.5 text-xs font-semibold text-white shadow-md transition cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
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
            {listings.length} <span className="text-slate-400 font-normal">lodges</span>
          </span>
        </div>

        {/* Right: Map Actions & Themes */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {/* Directions Toggle Button */}
          <button
            onClick={() => {
              setDirectionsOpen(!directionsOpen)
              if (!startPoint) handleUseGps()
            }}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xl backdrop-blur-md transition cursor-pointer ${
              directionsOpen
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/25'
                : 'bg-[#090D18]/90 hover:bg-[#121B30] text-slate-200 border-slate-800'
            }`}
          >
            <Navigation className="h-3.5 w-3.5 text-sky-400" />
            <span>Directions</span>
          </button>

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
              title="Obsidian Dark Map"
            >
              <Moon className="h-3.5 w-3.5 inline mr-1" />
              <span className="hidden md:inline">Dark</span>
            </button>
            <button
              onClick={() => setMapTheme('street')}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition cursor-pointer ${
                mapTheme === 'street'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Crisp Streets Map"
            >
              <Compass className="h-3.5 w-3.5 inline mr-1" />
              <span className="hidden md:inline">Streets</span>
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
          </div>
        </div>
      </div>

      {/* Floating Directions Panel (Left / Center) */}
      {directionsOpen && (
        <div className="absolute top-14 left-3 z-[1001] w-[340px] max-w-[calc(100vw-24px)] rounded-2xl bg-[#090D18]/95 p-4 shadow-2xl border border-slate-800/90 backdrop-blur-xl text-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <RouteIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Lodge Directions</h3>
                <p className="text-[10px] text-slate-400">Live turn-by-turn routing</p>
              </div>
            </div>
            <button
              onClick={() => setDirectionsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switcher: Driving / Walking */}
          <div className="grid grid-cols-2 gap-1.5 my-3 p-1 rounded-xl bg-[#070A12] border border-slate-800/80">
            <button
              onClick={() => setTravelMode('driving')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                travelMode === 'driving'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              <span>Drive / Keke</span>
            </button>
            <button
              onClick={() => setTravelMode('walking')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                travelMode === 'walking'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Footprints className="h-3.5 w-3.5" />
              <span>Walk</span>
            </button>
          </div>

          {/* Location Selectors */}
          <div className="space-y-2.5 text-xs">
            {/* Origin (Start) */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <span>Start Point</span>
                <button
                  onClick={handleUseGps}
                  className="text-blue-400 hover:text-blue-300 font-normal flex items-center gap-1 cursor-pointer"
                >
                  <Crosshair className="h-3 w-3" />
                  Use GPS
                </button>
              </div>
              <select
                value={startPoint?.label ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'gps') {
                    handleUseGps()
                  } else if (val === 'click') {
                    setPickingLocation(true)
                  } else {
                    const found = POPULAR_LANDMARKS.find((lm) => lm.name === val)
                    if (found) {
                      setStartPoint({ label: found.name, lat: found.lat, lng: found.lng })
                    }
                  }
                }}
                className="w-full rounded-xl bg-[#070A12] border border-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer text-xs"
              >
                <option value="" disabled>Select Starting Point...</option>
                {startPoint && (
                  <option value={startPoint.label}>📍 {startPoint.label}</option>
                )}
                <option value="gps">🎯 My Current GPS Location</option>
                <option value="click">🗺️ Click on Map to Set Point...</option>
                <optgroup label="Popular Landmarks (Owerri & Enugu)">
                  {POPULAR_LANDMARKS.map((lm) => (
                    <option key={lm.name} value={lm.name}>
                      {lm.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              {pickingLocation && (
                <p className="text-[10px] text-amber-400 animate-pulse mt-1">
                  👉 Click anywhere on the map to set your starting location
                </p>
              )}
            </div>

            {/* Destination (Lodge) */}
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Destination Lodge
              </div>
              <select
                value={targetLodgeId || selectedId || ''}
                onChange={(e) => {
                  setTargetLodgeId(e.target.value)
                  onSelect(e.target.value)
                }}
                className="w-full rounded-xl bg-[#070A12] border border-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer text-xs truncate"
              >
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    ⭐ {l.title} ({l.area}, {l.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calculating state */}
          {calculatingRoute && (
            <div className="my-3 py-2 text-center text-xs text-blue-400 animate-pulse flex items-center justify-center gap-2">
              <Navigation className="h-3.5 w-3.5 animate-spin" />
              <span>Calculating live street route...</span>
            </div>
          )}

          {/* Route Error */}
          {routeError && (
            <div className="my-3 p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-[11px] text-rose-300">
              {routeError}
            </div>
          )}

          {/* Route Results Box */}
          {routeResult && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              {/* Distance & Time Pills */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl bg-[#070A12] border border-slate-800 p-2.5 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Distance
                  </div>
                  <div className="text-base font-extrabold text-blue-400 mt-0.5">
                    {formatDistance(routeResult.distanceMeters)}
                  </div>
                </div>
                <div className="rounded-xl bg-[#070A12] border border-slate-800 p-2.5 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Est. Time
                  </div>
                  <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                    {formatDuration(routeResult.durationSeconds)}
                  </div>
                </div>
              </div>

              {/* Turn-by-Turn Steps Accordion */}
              {routeResult.steps.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setStepsExpanded(!stepsExpanded)}
                    className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-300 hover:text-white p-2 rounded-lg bg-[#070A12] border border-slate-800/80 transition cursor-pointer"
                  >
                    <span>{routeResult.steps.length} Route Navigation Steps</span>
                    {stepsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {stepsExpanded && (
                    <div className="max-h-36 overflow-y-auto mt-1 space-y-1 pr-1 text-[11px] border border-slate-800/60 rounded-xl p-2 bg-[#070A12]/80">
                      {routeResult.steps.map((st, i) => (
                        <div key={i} className="flex items-start gap-2 py-1 border-b border-slate-800/40 last:border-b-0">
                          <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center text-[9px] font-bold">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-slate-200">{st.instruction}</span>
                          {st.distance > 0 && (
                            <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                              {formatDistance(st.distance)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Launch Google Maps Audio Navigation */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${startPoint?.lat ?? ''},${startPoint?.lng ?? ''}&destination=${targetLodge?.latitude ?? ''},${targetLodge?.longitude ?? ''}&travelmode=${travelMode === 'walking' ? 'walking' : 'driving'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3 text-xs shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Google Maps GPS</span>
                </a>

                {/* Clear */}
                <button
                  onClick={clearRoute}
                  className="p-2 rounded-xl bg-[#070A12] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Clear Route"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
          d="M16 2 L20.5 11 L30.5 12.5 L23.2 19.5 L25 29.5 L16 24.8 L7 29.5 L8.8 19.5 L1.5 12.5 L11.5 11 Z"
          fill={color}
        />
      </svg>
      <span className="text-slate-300 capitalize">{label}</span>
    </div>
  )
}

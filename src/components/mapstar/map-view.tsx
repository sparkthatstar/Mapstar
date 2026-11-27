'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'
import { generateStarHouseSvg, getPinState, PinState } from './star-pin'
import {
  Navigation,
  ShieldCheck,
  X,
  MapPin,
  Eye,
  Radio,
  Compass,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MapViewProps {
  listings: MockListing[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  center: [number, number]
  zoom?: number
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

// Helper to convert raw SVG string to HTMLImageElement for Mapbox WebGL canvas
function loadSvgImage(map: mapboxgl.Map, id: string, svgString: string): Promise<void> {
  return new Promise((resolve) => {
    if (map.hasImage(id)) {
      resolve()
      return
    }
    const img = new Image(48, 58)
    img.onload = () => {
      if (!map.hasImage(id)) {
        map.addImage(id, img, { pixelRatio: 2 })
      }
      resolve()
    }
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
  })
}

// Mapbox size interpolations for standard state and enlarged radar scan state
const DEFAULT_ICON_SIZE: any = [
  'interpolate',
  ['linear'],
  ['zoom'],
  9,
  0.55,
  12,
  0.75,
  14,
  0.95,
  17,
  1.25,
]

const ENLARGED_SCAN_ICON_SIZE: any = [
  'interpolate',
  ['linear'],
  ['zoom'],
  9,
  0.95,
  12,
  1.3,
  14,
  1.65,
  17,
  2.1,
]

const GLOW_CIRCLE_RADIUS: any = [
  'interpolate',
  ['linear'],
  ['zoom'],
  9,
  28,
  12,
  44,
  14,
  60,
  17,
  86,
]

export default function MapView({
  listings,
  selectedId,
  onSelect,
  center,
  zoom = 13,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)

  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets')
  const [cardDismissed, setCardDismissed] = useState(false)
  const [googlePinpointOpen, setGooglePinpointOpen] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Floating Movable Map Tools State
  const [toolsPos, setToolsPos] = useState<{ x: number; y: number }>({ x: 16, y: 16 })
  const [isDraggingTools, setIsDraggingTools] = useState(false)
  const dragStateRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null)

  // GPS Locator Tool State
  const [isLocating, setIsLocating] = useState(false)
  const [locationNotice, setLocationNotice] = useState<string | null>(null)
  const [, setUserCoords] = useState<[number, number] | null>(null)

  // Radar Scan Feature State (glassy waves + 10s listings glow & enlargement)
  const [isScanning, setIsScanning] = useState(false)
  const [scanCountdown, setScanCountdown] = useState(0)
  const [scanWaves, setScanWaves] = useState<Array<{ id: number; x: number; y: number }>>([])
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null)

  const STYLES = {
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
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

  // Format GeoJSON FeatureCollection from listings
  const geojson = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: listings
        .filter((l) => Boolean(l.latitude && l.longitude))
        .map((l) => {
          const pinState = getPinState(l.status)
          const iconId = `pin-${pinState.toLowerCase()}${l.featured ? '-featured' : ''}`
          return {
            type: 'Feature' as const,
            id: l.id,
            geometry: {
              type: 'Point' as const,
              coordinates: [l.longitude, l.latitude] as [number, number],
            },
            properties: {
              id: l.id,
              title: l.title,
              area: l.area,
              city: l.city,
              annualRent: l.annualRent,
              formattedRent: formatNaira(l.annualRent),
              status: l.status,
              iconId,
              isSelected: l.id === selectedId,
            },
          }
        }),
    }
  }, [listings, selectedId])

  // =========================================================================
  // RADAR SCAN FEATURE: Glassy waves + 10-second listing highlight & enlargement
  // =========================================================================
  const triggerScan = useCallback((clientX?: number, clientY?: number) => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)

    // Calculate wave origin relative to map container
    let waveX = clientX
    let waveY = clientY

    if (waveX === undefined || waveY === undefined) {
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect()
        waveX = rect.width / 2
        waveY = rect.height / 2
      } else {
        waveX = 200
        waveY = 200
      }
    } else if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect()
      waveX = clientX - rect.left
      waveY = clientY - rect.top
    }

    // Spawn 3 concentric glassy expanding waves
    const waveId = Date.now()
    setScanWaves((prev) => [...prev, { id: waveId, x: waveX!, y: waveY! }])
    setTimeout(() => {
      setScanWaves((prev) => prev.filter((w) => w.id !== waveId))
    }, 1800)

    // Activate 30-second scan state
    setIsScanning(true)
    setScanCountdown(30)

    scanIntervalRef.current = setInterval(() => {
      setScanCountdown((prev) => {
        if (prev <= 1) {
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    scanTimerRef.current = setTimeout(() => {
      setIsScanning(false)
    }, 30000)
  }, [])

  // =========================================================================
  // GPS LOCATOR TOOL: Spins, acquires GPS coords, marks point and flies there
  // =========================================================================
  const locateUserPosition = useCallback(() => {
    if (isLocating) return

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationNotice('Geolocation is not supported on this device.')
      setTimeout(() => setLocationNotice(null), 3500)
      return
    }

    setIsLocating(true)
    setLocationNotice('Pinpointing your real-world GPS position...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude, accuracy } = position.coords
        setUserCoords([longitude, latitude])
        setLocationNotice(`Located! GPS accuracy: ±${Math.round(accuracy)}m`)

        if (mapRef.current) {
          // Create or update high-visibility pulsing GPS user marker
          if (!userMarkerRef.current) {
            const el = document.createElement('div')
            el.className = 'mapstar-user-marker'
            el.innerHTML = `
              <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <div style="position: absolute; inset: -6px; border-radius: 9999px; background: rgba(59, 130, 246, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: absolute; inset: 0px; border-radius: 9999px; background: rgba(59, 130, 246, 0.3); border: 2px solid #3B82F6;"></div>
                <div style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 10px rgba(0,0,0,0.45);"></div>
              </div>
            `
            userMarkerRef.current = new mapboxgl.Marker({
              element: el,
              anchor: 'center',
            })
              .setLngLat([longitude, latitude])
              .setPopup(
                new mapboxgl.Popup({ offset: 14 }).setHTML(`
                  <div style="padding: 6px 8px; font-size: 11px; font-weight: 700; color: #1e293b;">
                    📍 Your Current GPS Location
                    <div style="font-weight: 500; font-size: 10px; color: #64748b; margin-top: 2px;">
                      ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)
                    </div>
                  </div>
                `)
              )
              .addTo(mapRef.current)
          } else {
            userMarkerRef.current.setLngLat([longitude, latitude])
          }

          // Smoothly fly camera to user's coordinates
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 16,
            essential: true,
            duration: 1500,
          })
        }

        // Stop spin animation smoothly after arrival
        setTimeout(() => {
          setIsLocating(false)
          setTimeout(() => setLocationNotice(null), 3500)
        }, 1300)
      },
      (error) => {
        setIsLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationNotice('Location blocked. Please allow location in Settings or browser.')
        } else {
          setLocationNotice(`GPS error: ${error.message}`)
        }
        setTimeout(() => setLocationNotice(null), 4000)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    )
  }, [isLocating])

  // =========================================================================
  // MOVABLE TOOLBAR DRAG LOGIC (Pointer capture for fluid repositioning)
  // =========================================================================
  const handleGripPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: toolsPos.x,
      posY: toolsPos.y,
    }
    setIsDraggingTools(true)
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {}
  }

  const handleGripPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingTools || !dragStateRef.current || !mapContainerRef.current) return
    const dx = e.clientX - dragStateRef.current.startX
    const dy = e.clientY - dragStateRef.current.startY

    const rect = mapContainerRef.current.getBoundingClientRect()
    const maxX = Math.max(10, rect.width - 64)
    const maxY = Math.max(10, rect.height - 180)

    const newX = Math.max(8, Math.min(maxX, dragStateRef.current.posX + dx))
    const newY = Math.max(8, Math.min(maxY, dragStateRef.current.posY + dy))

    setToolsPos({ x: newX, y: newY })
  }

  const handleGripPointerUp = (e: React.PointerEvent) => {
    if (isDraggingTools) {
      setIsDraggingTools(false)
      dragStateRef.current = null
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {}
    }
  }

  // Long-press and Right-click handlers on map container
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY }

    longPressTimerRef.current = setTimeout(() => {
      triggerScan(touch.clientX, touch.clientY)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(60)
        } catch {}
      }
      touchStartPosRef.current = null
    }, 520)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || e.touches.length !== 1) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x)
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y)
    if (dx > 8 || dy > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      touchStartPosRef.current = null
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    touchStartPosRef.current = null
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    triggerScan(e.clientX, e.clientY)
  }

  // =========================================================================
  // INITIALIZE MAPBOX MAP & REGISTER LAYERS
  // =========================================================================
  useEffect(() => {
    if (!mapContainerRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: STYLES[mapStyle],
      center: [center[1], center[0]],
      zoom,
      attributionControl: false,
      trackResize: true,
      fadeDuration: 0,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')

    // Context menu (right click) on Mapbox canvas triggers radar scan
    map.on('contextmenu', (e) => {
      e.preventDefault()
      triggerScan(e.originalEvent.clientX, e.originalEvent.clientY)
    })

    map.on('load', async () => {
      // 1. Register high-DPI vector icons in Mapbox WebGL context
      const iconTypes: Array<{ id: string; state: PinState; featured: boolean }> = [
        { id: 'pin-available', state: 'AVAILABLE', featured: false },
        { id: 'pin-available-featured', state: 'AVAILABLE', featured: true },
        { id: 'pin-coming_soon', state: 'COMING_SOON', featured: false },
        { id: 'pin-coming_soon-featured', state: 'COMING_SOON', featured: true },
        { id: 'pin-unavailable', state: 'UNAVAILABLE', featured: false },
        { id: 'pin-unavailable-featured', state: 'UNAVAILABLE', featured: true },
      ]

      await Promise.all(
        iconTypes.map(({ id, state, featured }) =>
          loadSvgImage(map, id, generateStarHouseSvg(state, featured))
        )
      )

      // 2. Add GeoJSON Source
      if (!map.getSource('listings-source')) {
        map.addSource('listings-source', {
          type: 'geojson',
          data: geojson,
        })
      }

      // 3. Add Glowing Radar Halo Layer (Rendered underneath pins)
      if (!map.getLayer('listings-glow-layer')) {
        map.addLayer({
          id: 'listings-glow-layer',
          type: 'circle',
          source: 'listings-source',
          paint: {
            'circle-radius': GLOW_CIRCLE_RADIUS,
            'circle-color': '#FBBF24',
            'circle-blur': 0.7,
            'circle-opacity': 0,
            'circle-opacity-transition': { duration: 350 },
          },
        })
      }

      // 4. Add Native Symbol Layer with zoom-based size interpolation
      if (!map.getLayer('listings-pins-layer')) {
        map.addLayer({
          id: 'listings-pins-layer',
          type: 'symbol',
          source: 'listings-source',
          layout: {
            'icon-image': ['get', 'iconId'],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-size': DEFAULT_ICON_SIZE,
          },
        })
      }

      setMapLoaded(true)
      map.resize()
    })

    // Click on pin feature
    map.on('click', 'listings-pins-layer', (e) => {
      if (e.features && e.features[0]) {
        const id = e.features[0].properties?.id
        if (id) {
          onSelect(id)
          setCardDismissed(false)
        }
      }
    })

    // Cursor pointer on hover
    map.on('mouseenter', 'listings-pins-layer', (e) => {
      map.getCanvas().style.cursor = 'pointer'
      if (e.features && e.features[0]) {
        const props = e.features[0].properties
        const coords = (e.features[0].geometry as any).coordinates.slice()

        if (popupRef.current) popupRef.current.remove()

        const html = `
          <div style="font-family: inherit; padding: 4px 6px; min-width: 160px;">
            <div style="font-weight: 700; font-size: 11.5px; color: #1e293b; line-height: 1.3;">
              ${props?.title}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 1px;">
              ${props?.area}, ${props?.city}
            </div>
            <div style="font-weight: 800; font-size: 12px; color: #78350F; margin-top: 4px;">
              ${props?.formattedRent}/yr
            </div>
          </div>
        `

        popupRef.current = new mapboxgl.Popup({
          offset: 15,
          closeButton: false,
          className: 'mapstar-micro-popup',
        })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(map)
      }
    })

    map.on('mouseleave', 'listings-pins-layer', () => {
      map.getCanvas().style.cursor = ''
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
    })

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize()
      }
    })
    resizeObserver.observe(mapContainerRef.current)

    mapRef.current = map

    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
      resizeObserver.disconnect()
      map.remove()
    }
  }, [])

  // =========================================================================
  // REACTIVE LAYER ADJUSTMENT: Enlarge pins and glow when scanning
  // =========================================================================
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    const map = mapRef.current

    if (map.getLayer('listings-pins-layer')) {
      map.setLayoutProperty(
        'listings-pins-layer',
        'icon-size',
        isScanning ? ENLARGED_SCAN_ICON_SIZE : DEFAULT_ICON_SIZE
      )
    }

    if (map.getLayer('listings-glow-layer')) {
      map.setPaintProperty(
        'listings-glow-layer',
        'circle-opacity',
        isScanning ? 1.0 : 0
      )
    }
  }, [isScanning, mapLoaded])

  // Switch Mapbox layer styles and rebind source/layer
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    mapRef.current.setStyle(STYLES[mapStyle])

    mapRef.current.once('style.load', async () => {
      const map = mapRef.current!

      const iconTypes: Array<{ id: string; state: PinState; featured: boolean }> = [
        { id: 'pin-available', state: 'AVAILABLE', featured: false },
        { id: 'pin-available-featured', state: 'AVAILABLE', featured: true },
        { id: 'pin-coming_soon', state: 'COMING_SOON', featured: false },
        { id: 'pin-coming_soon-featured', state: 'COMING_SOON', featured: true },
        { id: 'pin-unavailable', state: 'UNAVAILABLE', featured: false },
        { id: 'pin-unavailable-featured', state: 'UNAVAILABLE', featured: true },
      ]

      await Promise.all(
        iconTypes.map(({ id, state, featured }) =>
          loadSvgImage(map, id, generateStarHouseSvg(state, featured))
        )
      )

      if (!map.getSource('listings-source')) {
        map.addSource('listings-source', {
          type: 'geojson',
          data: geojson,
        })
      }

      if (!map.getLayer('listings-glow-layer')) {
        map.addLayer({
          id: 'listings-glow-layer',
          type: 'circle',
          source: 'listings-source',
          paint: {
            'circle-radius': GLOW_CIRCLE_RADIUS,
            'circle-color': '#FBBF24',
            'circle-blur': 0.7,
            'circle-opacity': isScanning ? 1.0 : 0,
            'circle-opacity-transition': { duration: 350 },
          },
        })
      }

      if (!map.getLayer('listings-pins-layer')) {
        map.addLayer({
          id: 'listings-pins-layer',
          type: 'symbol',
          source: 'listings-source',
          layout: {
            'icon-image': ['get', 'iconId'],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-size': isScanning ? ENLARGED_SCAN_ICON_SIZE : DEFAULT_ICON_SIZE,
          },
        })
      }
    })
  }, [mapStyle, geojson])

  // Update GeoJSON source whenever listings or selectedId change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    const source = mapRef.current.getSource('listings-source') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData(geojson)
    }
  }, [geojson, mapLoaded])

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

  return (
    <div className="relative h-full w-full flex flex-col bg-[#FAF7F2] dark:bg-[#120C08] overflow-hidden select-none">
      {/* Dynamic Keyframes for Radar Scanning Wave Effect */}
      <style>{`
        @keyframes radarWavePulse {
          0% {
            transform: translate(-50%, -50%) scale(0.04);
            opacity: 0.95;
          }
          30% {
            opacity: 0.75;
          }
          65% {
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.7);
            opacity: 0;
          }
        }
        .radar-wave-ring {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          animation: radarWavePulse 1.25s cubic-bezier(0.1, 0.75, 0.25, 1) forwards;
          border: 2px solid rgba(186, 230, 253, 0.8);
          background: radial-gradient(circle, rgba(186, 230, 253, 0.16) 0%, rgba(125, 211, 252, 0.08) 45%, rgba(255, 255, 255, 0.03) 75%, transparent 100%);
          box-shadow: 0 0 35px rgba(186, 230, 253, 0.45), inset 0 0 25px rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
        }
      `}</style>

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

        {/* Layer Switcher (Vector Map vs Satellite) */}
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
          MAPBOX GL CANVAS CONTAINER WITH MOVABLE TOOLS & WAVE SCAN
         ========================================================================= */}
      <div
        className="flex-1 w-full h-full relative overflow-hidden min-h-0"
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* -----------------------------------------------------------------------
            GLASSY TRANSPARENT WAVE OVERLAYS (Spawned on scan)
           ----------------------------------------------------------------------- */}
        {scanWaves.map((wave) => (
          <div
            key={wave.id}
            className="pointer-events-none absolute inset-0 overflow-hidden z-15"
          >
            <div
              className="radar-wave-ring"
              style={{
                left: wave.x,
                top: wave.y,
                width: '440px',
                height: '440px',
                animationDelay: '0ms',
              }}
            />
            <div
              className="radar-wave-ring"
              style={{
                left: wave.x,
                top: wave.y,
                width: '440px',
                height: '440px',
                animationDelay: '140ms',
              }}
            />
            <div
              className="radar-wave-ring"
              style={{
                left: wave.x,
                top: wave.y,
                width: '440px',
                height: '440px',
                animationDelay: '280ms',
              }}
            />
          </div>
        ))}

        {/* -----------------------------------------------------------------------
            RADAR ACTIVE HUD PILL (Appears during the 30-second highlight)
           ----------------------------------------------------------------------- */}
        {isScanning && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-25 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 dark:bg-black/90 text-sky-200 text-xs font-bold shadow-xl backdrop-blur-md border border-sky-400/40">
              <Radio className="w-3.5 h-3.5 animate-pulse text-sky-400" />
              <span>Scanning Lodges In Range ({scanCountdown}s)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            GPS LOCATION NOTICE HUD
           ----------------------------------------------------------------------- */}
        {locationNotice && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-25 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 dark:bg-[#1A120B]/95 text-[#78350F] dark:text-[#E0904E] text-[11px] font-semibold shadow-md border border-[#E5DAC8] dark:border-[#382618] backdrop-blur-md">
              <Compass className="w-3.5 h-3.5" />
              <span>{locationNotice}</span>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            FLOATING & MOVABLE MAP TOOLS (Round GPS Tool + Radar Scan + Drag Grip)
           ----------------------------------------------------------------------- */}
        <div
          style={{
            transform: `translate3d(${toolsPos.x}px, ${toolsPos.y}px, 0)`,
          }}
          className="absolute top-0 left-0 z-20 flex flex-col items-center gap-1.5 p-1.5 bg-white/95 dark:bg-[#1A120B]/95 border border-[#E5DAC8] dark:border-[#382618] rounded-2xl shadow-xl backdrop-blur-md transition-shadow select-none"
        >
          {/* Drag Handle Grip */}
          <div
            onPointerDown={handleGripPointerDown}
            onPointerMove={handleGripPointerMove}
            onPointerUp={handleGripPointerUp}
            onPointerCancel={handleGripPointerUp}
            title="Drag to move map tools"
            className="w-full flex items-center justify-center py-1 cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 rounded-lg touch-none group"
          >
            <div className="flex flex-col gap-0.5 items-center">
              <div className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500 group-hover:bg-[#78350F] dark:group-hover:bg-[#E0904E] transition-colors" />
                <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500 group-hover:bg-[#78350F] dark:group-hover:bg-[#E0904E] transition-colors" />
              </div>
              <div className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500 group-hover:bg-[#78350F] dark:group-hover:bg-[#E0904E] transition-colors" />
                <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500 group-hover:bg-[#78350F] dark:group-hover:bg-[#E0904E] transition-colors" />
              </div>
            </div>
          </div>

          {/* 1. Round GPS Sign Tool (Spins when tapped, points user's actual location) */}
          <button
            type="button"
            onClick={locateUserPosition}
            disabled={isLocating}
            title="Locate my actual GPS position (Tap to spin and pinpoint)"
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
              isLocating
                ? 'bg-[#78350F] text-amber-200 ring-4 ring-amber-500/30 shadow-amber-900/30'
                : 'bg-[#78350F] hover:bg-[#854D0E] text-white active:scale-95 shadow-[#78350F]/30 dark:bg-[#B45309] dark:hover:bg-[#C2783B]'
            }`}
          >
            <div className={isLocating ? 'animate-spin' : ''}>
              {/* Custom Round GPS Crosshair Sign */}
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="7.5" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                <line x1="12" y1="1.5" x2="12" y2="4.5" />
                <line x1="12" y1="19.5" x2="12" y2="22.5" />
                <line x1="1.5" y1="12" x2="4.5" y2="12" />
                <line x1="19.5" y1="12" x2="22.5" y2="12" />
              </svg>
            </div>
          </button>

          {/* 2. Radar Scan Tool (Sends glassy transparent waves & highlights lodges for 30s) */}
          <button
            type="button"
            onClick={() => triggerScan()}
            title="Radar Scan: Send glassy waves & highlight lodges for 30s (or long-press/right-click map)"
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
              isScanning
                ? 'bg-sky-600 text-white ring-4 ring-sky-400/40 animate-pulse'
                : 'bg-white dark:bg-[#2A1810] text-[#78350F] dark:text-[#E0904E] hover:bg-[#FAF7F2] dark:hover:bg-[#341F14] border border-[#E5DAC8] dark:border-[#382618] active:scale-95'
            }`}
          >
            <Radio className="w-5 h-5" />
            {isScanning && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-sky-600 text-[9px] font-black text-white rounded-full flex items-center justify-center shadow-xs">
                {scanCountdown}
              </span>
            )}
          </button>
        </div>
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

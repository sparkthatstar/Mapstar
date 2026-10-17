'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createStarIcon, statusToColor } from './star-pin'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'

interface MapViewProps {
  listings: MockListing[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  center: [number, number]
  zoom?: number
}

// Helper to recenter the map when the `center` prop changes
function Recenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true })
  }, [center, zoom, map])
  return null
}

export default function MapView({
  listings,
  selectedId,
  onSelect,
  center,
  zoom = 13,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Fix default leaflet marker icon path (we use custom star icons so this is mostly precautionary)
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
    <div ref={containerRef} className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: '#E8EAED' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} zoom={zoom} />

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
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ background: color === 'green' ? '#10B981' : color === 'orange' ? '#F59E0B' : color === 'blue' ? '#3B82F6' : color === 'grey' ? '#9CA3AF' : '#EF4444' }}
                    />
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">
                      {l.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-slate-900 leading-snug">
                    {l.title}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {PROPERTY_TYPE_LABELS[l.propertyType]} · {l.area}, {l.city}
                  </div>
                  <div className="mt-2 text-emerald-700 font-bold text-base">
                    {formatNaira(l.annualRent)}
                    <span className="text-xs font-normal text-slate-500">/yr</span>
                  </div>
                  <button
                    onClick={() => onSelect(l.id)}
                    className="mt-2 w-full rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    View details
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Pin legend overlay */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/95 p-3 shadow-md ring-1 ring-slate-200">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
          Pin legend
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <LegendItem color="#10B981" label="Available" />
          <LegendItem color="#F59E0B" label="Coming soon" />
          <LegendItem color="#3B82F6" label="Inspection" />
          <LegendItem color="#9CA3AF" label="Recently let" />
          <LegendItem color="#EF4444" label="Verified" />
          <LegendItem color="#06B6D4" label="Featured" ring />
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="12" height="12" viewBox="0 0 32 32">
        {ring && <circle cx="16" cy="16" r="15" fill="none" stroke={color} strokeWidth="3" />}
        <path
          d="M16 2 L19.6 12.2 L30.4 12.5 L21.7 19.0 L24.7 29.3 L16 23.2 L7.3 29.3 L10.3 19.0 L1.6 12.5 L12.4 12.2 Z"
          fill={color}
        />
      </svg>
      <span className="text-slate-700">{label}</span>
    </div>
  )
}

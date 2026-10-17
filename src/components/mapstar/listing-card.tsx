'use client'

import { Badge } from '@/components/ui/badge'
import { Star, ShieldCheck, Video, Camera, Droplet, Zap, Toilet, Wifi, Car, Sparkles } from 'lucide-react'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'

interface ListingCardProps {
  listing: MockListing
  selected: boolean
  onSelect: (id: string) => void
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: 'Available now', color: 'bg-emerald-100 text-emerald-700' },
  COMING_SOON: { label: 'Coming soon', color: 'bg-amber-100 text-amber-700' },
  UNDER_INSPECTION: { label: 'Under inspection', color: 'bg-blue-100 text-blue-700' },
  RECENTLY_LET: { label: 'Recently let', color: 'bg-slate-100 text-slate-600' },
  VERIFIED: { label: 'Verified by Mapstar', color: 'bg-red-100 text-red-700' },
}

export default function ListingCard({ listing, selected, onSelect }: ListingCardProps) {
  const status = STATUS_LABEL[listing.status] ?? STATUS_LABEL.AVAILABLE

  return (
    <button
      onClick={() => onSelect(listing.id)}
      className={`group w-full text-left rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 ${
        selected ? 'ring-2 ring-emerald-500' : 'ring-1 ring-slate-200'
      }`}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-emerald-300" />
          {listing.featured && (
            <div className="absolute top-1 left-1 rounded bg-cyan-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              FEATURED
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-emerald-700">
              {listing.title}
            </h3>
            <div className="text-right shrink-0">
              <div className="text-base font-bold text-emerald-700">
                {formatNaira(listing.annualRent)}
              </div>
              <div className="text-[10px] text-slate-500">per year</div>
            </div>
          </div>

          <div className="text-xs text-slate-500 mt-0.5">
            {PROPERTY_TYPE_LABELS[listing.propertyType]} · {listing.area}, {listing.city}
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${status.color}`}>
              {status.label}
            </span>
            {listing.physicallyVerified && (
              <Badge variant="outline" className="h-5 text-[10px] gap-0.5 px-1.5">
                <ShieldCheck className="h-3 w-3 text-red-500" /> Verified
              </Badge>
            )}
            {listing.fairPriceBadge && (
              <Badge variant="outline" className="h-5 text-[10px] gap-0.5 px-1.5 border-emerald-300 text-emerald-700">
                <Star className="h-3 w-3" /> Fair Price
              </Badge>
            )}
            {listing.has360Tour && (
              <Badge variant="outline" className="h-5 text-[10px] gap-0.5 px-1.5">
                <Camera className="h-3 w-3" /> 360°
              </Badge>
            )}
            {listing.hasVideoWalkthrough && (
              <Badge variant="outline" className="h-5 text-[10px] gap-0.5 px-1.5">
                <Video className="h-3 w-3" /> Video
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-slate-600">
            {listing.bedrooms > 0 && <span className="inline-flex items-center gap-0.5"><Car className="h-3 w-3" /> {listing.bedrooms} bed</span>}
            <span className="inline-flex items-center gap-0.5"><Toilet className="h-3 w-3" /> {listing.bathrooms} bath</span>
            {listing.hasBorehole && <span className="inline-flex items-center gap-0.5"><Droplet className="h-3 w-3 text-blue-500" /> Borehole</span>}
            {listing.hasPrepaidMeter && <span className="inline-flex items-center gap-0.5"><Zap className="h-3 w-3 text-amber-500" /> Prepaid</span>}
            {listing.hasWiFi && <span className="inline-flex items-center gap-0.5"><Wifi className="h-3 w-3" /> WiFi</span>}
          </div>

          {listing.rating > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium text-slate-700">{listing.rating.toFixed(1)}</span>
              <span>({listing.reviewsCount})</span>
              <span className="text-slate-300">·</span>
              <span>{listing.inspectionCount} inspections</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

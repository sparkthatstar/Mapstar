'use client'

import { Badge } from '@/components/ui/badge'
import { Star, ShieldCheck, Video, Camera, Droplet, Zap, Toilet, Wifi, Car, Sparkles, Building2, ChevronRight } from 'lucide-react'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'

interface ListingCardProps {
  listing: MockListing
  selected: boolean
  onSelect: (id: string) => void
}

const STATUS_LABEL: Record<string, { label: string; color: string; dot: string }> = {
  AVAILABLE: {
    label: 'Available Now',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/50',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  COMING_SOON: {
    label: 'Coming Soon',
    color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/50',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  UNDER_INSPECTION: {
    label: 'In Inspection',
    color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700/60',
    dot: 'bg-blue-500 dark:bg-blue-400',
  },
  RECENTLY_LET: {
    label: 'Recently Let',
    color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
  VERIFIED: {
    label: 'Verified Lodge',
    color: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/50',
    dot: 'bg-sky-500 dark:bg-sky-400',
  },
}

export default function ListingCard({ listing, selected, onSelect }: ListingCardProps) {
  const status = STATUS_LABEL[listing.status] ?? STATUS_LABEL.AVAILABLE

  return (
    <div
      onClick={() => onSelect(listing.id)}
      className={`group w-full text-left rounded-xl border p-3.5 transition-all duration-200 cursor-pointer ${
        selected
          ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500 shadow-md dark:bg-[#0E172C] dark:border-blue-500 dark:ring-blue-500 dark:shadow-xl dark:shadow-blue-950/60 -translate-y-0.5'
          : 'bg-white border-slate-200 shadow-2xs hover:bg-slate-50 hover:border-blue-400/80 hover:shadow-md hover:-translate-y-0.5 dark:bg-[#090D18]/90 dark:border-slate-800/80 dark:hover:bg-[#0D1424] dark:hover:border-blue-500/60 dark:hover:shadow-lg dark:hover:shadow-black/60'
      }`}
    >
      <div className="flex gap-3.5">
        {/* Modern Responsive Thumbnail */}
        <div className="relative h-26 w-26 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-[#0B0F19] dark:via-[#10192D] dark:to-[#070A12] border border-slate-200 dark:border-slate-800/90 flex items-center justify-center">
          <Building2 className="h-9 w-9 text-blue-600/30 dark:text-blue-500/35 group-hover:text-blue-600 dark:group-hover:text-blue-400/60 group-hover:scale-105 transition duration-300" />

          {listing.featured && (
            <div className="absolute top-1.5 left-1.5 rounded bg-gradient-to-r from-blue-600 to-sky-500 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white shadow-md shadow-blue-900/50">
              FEATURED
            </div>
          )}

          {listing.photoCount > 0 && (
            <div className="absolute bottom-1.5 right-1.5 rounded-md bg-white/90 text-slate-700 dark:bg-black/85 dark:text-slate-300 px-1.5 py-0.5 text-[8px] font-mono border border-slate-200 dark:border-slate-800/80 shadow-2xs backdrop-blur-xs">
              {listing.photoCount} photos
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 dark:text-slate-100 line-clamp-1 leading-snug dark:group-hover:text-blue-300 transition">
                {listing.title}
              </h3>
              <div className="text-right shrink-0">
                <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 leading-none">
                  {formatNaira(listing.annualRent)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">/year</div>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 truncate">
              <span className="text-blue-600 dark:text-blue-400 font-medium">{PROPERTY_TYPE_LABELS[listing.propertyType]}</span>
              <span className="text-slate-400 dark:text-slate-600">·</span>
              <span className="truncate">{listing.area}, {listing.city}</span>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              {listing.physicallyVerified && (
                <Badge variant="outline" className="h-5 text-[10px] gap-1 px-1.5 border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:text-sky-300 dark:bg-sky-950/40">
                  <ShieldCheck className="h-3 w-3 text-sky-600 dark:text-sky-400" /> Verified
                </Badge>
              )}
              {listing.fairPriceBadge && (
                <Badge variant="outline" className="h-5 text-[10px] gap-1 px-1.5 border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/50 dark:text-blue-300 dark:bg-blue-950/40">
                  <Sparkles className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" /> Fair Price
                </Badge>
              )}
              {listing.has360Tour && (
                <Badge variant="outline" className="h-5 text-[10px] gap-1 px-1.5 border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700/80 dark:text-slate-300 dark:bg-slate-900/60">
                  <Camera className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" /> 360°
                </Badge>
              )}
            </div>
          </div>

          {/* Amenities & specs */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-2 truncate">
              {listing.bedrooms > 0 && (
                <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                  <Car className="h-3 w-3 text-slate-400 dark:text-slate-500" /> {listing.bedrooms} bed
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                <Toilet className="h-3 w-3 text-slate-400 dark:text-slate-500" /> {listing.bathrooms} bath
              </span>
              {listing.hasBorehole && (
                <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300">
                  <Droplet className="h-3 w-3 text-blue-600 dark:text-blue-400" /> Water
                </span>
              )}
              {listing.hasPrepaidMeter && (
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                  <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400" /> Prepaid
                </span>
              )}
            </div>

            <div className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300 font-semibold text-xs shrink-0">
              <span>Inspect</span>
              <ChevronRight className="h-3.5 w-3.5 ml-0.5 group-hover:translate-x-0.5 transition" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

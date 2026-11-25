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
    color: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/50',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  UNDER_INSPECTION: {
    label: 'In Inspection',
    color: 'bg-amber-100/70 text-amber-900 border-amber-300 dark:bg-[#2A1810] dark:text-amber-300 dark:border-[#523018]',
    dot: 'bg-amber-600 dark:bg-amber-400',
  },
  RECENTLY_LET: {
    label: 'Recently Let',
    color: 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-800',
    dot: 'bg-stone-400 dark:bg-stone-500',
  },
  VERIFIED: {
    label: 'Verified Lodge',
    color: 'bg-[#FAF7F2] text-[#78350F] border-[#E5DAC8] dark:bg-[#2A1810] dark:text-[#E0904E] dark:border-[#382618]',
    dot: 'bg-[#78350F] dark:bg-[#E0904E]',
  },
}

export default function ListingCard({ listing, selected, onSelect }: ListingCardProps) {
  const status = STATUS_LABEL[listing.status] ?? STATUS_LABEL.AVAILABLE

  return (
    <div
      onClick={() => onSelect(listing.id)}
      className={`group w-full text-left rounded-xl border p-3.5 transition-all duration-200 cursor-pointer ${
        selected
          ? 'bg-amber-50/80 border-[#78350F] ring-1 ring-[#78350F] shadow-md dark:bg-[#2A1810] dark:border-[#B45309] dark:ring-[#B45309] dark:shadow-xl dark:shadow-[#2A1810]/50 -translate-y-0.5'
          : 'bg-white border-[#E5DAC8] shadow-2xs hover:bg-[#FAF7F2] hover:border-[#78350F]/70 hover:shadow-md hover:-translate-y-0.5 dark:bg-[#1A120B] dark:border-[#382618] dark:hover:bg-[#24160E] dark:hover:border-[#B45309]/70 dark:hover:shadow-lg dark:hover:shadow-black/60'
      }`}
    >
      <div className="flex gap-3.5">
        {/* Modern Responsive Thumbnail */}
        <div className="relative h-26 w-26 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#FAF7F2] via-[#F3ECE2] to-[#FAF7F2] dark:from-[#120C08] dark:via-[#1F140D] dark:to-[#120C08] border border-[#E5DAC8] dark:border-[#382618] flex items-center justify-center">
          <Building2 className="h-9 w-9 text-[#78350F]/30 dark:text-[#E0904E]/30 group-hover:text-[#78350F] dark:group-hover:text-[#E0904E] group-hover:scale-105 transition duration-300" />

          {listing.featured && (
            <div className="absolute top-1.5 left-1.5 rounded bg-gradient-to-r from-[#78350F] to-[#B45309] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white shadow-md shadow-[#78350F]/40">
              FEATURED
            </div>
          )}

          {listing.photoCount > 0 && (
            <div className="absolute bottom-1.5 right-1.5 rounded-md bg-white/95 text-[#3B2314] dark:bg-black/85 dark:text-amber-100/90 px-1.5 py-0.5 text-[8px] font-mono border border-[#E5DAC8] dark:border-[#382618] shadow-2xs backdrop-blur-xs">
              {listing.photoCount} photos
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-[#271810] group-hover:text-[#78350F] dark:text-[#FAF6F0] line-clamp-1 leading-snug dark:group-hover:text-[#E0904E] transition">
                {listing.title}
              </h3>
              <div className="text-right shrink-0">
                <div className="text-base font-extrabold text-[#78350F] dark:text-[#E0904E] leading-none">
                  {formatNaira(listing.annualRent)}
                </div>
                <div className="text-[10px] text-[#7C6859] dark:text-[#B8A598] font-mono mt-0.5">/year</div>
              </div>
            </div>

            <div className="text-xs text-[#7C6859] dark:text-[#B8A598] mt-1 flex items-center gap-1.5 truncate">
              <span className="text-[#78350F] dark:text-[#E0904E] font-medium">{PROPERTY_TYPE_LABELS[listing.propertyType]}</span>
              <span className="text-[#D4C3B3] dark:text-[#4A3222]">·</span>
              <span className="truncate">{listing.area}, {listing.city}</span>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              {listing.physicallyVerified && (
                <Badge variant="outline" className="h-5 text-[10px] gap-1 px-1.5 border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:text-amber-300 dark:bg-amber-950/40">
                  <ShieldCheck className="h-3 w-3 text-[#78350F] dark:text-[#E0904E]" /> Verified
                </Badge>
              )}
              {listing.fairPriceBadge && (
                <Badge variant="outline" className="h-5 text-[10px] gap-1 px-1.5 border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:text-amber-300 dark:bg-amber-950/40">
                  <Sparkles className="h-2.5 w-2.5 text-[#78350F] dark:text-[#E0904E]" /> Fair Price
                </Badge>
              )}
              {listing.has360Tour && (
                <Badge variant="outline" className="h-5 text-[10px] gap-1 px-1.5 border-[#E5DAC8] bg-[#FAF7F2] text-[#3B2314] dark:border-[#382618] dark:text-stone-300 dark:bg-[#120C08]">
                  <Camera className="h-2.5 w-2.5 text-[#78350F] dark:text-[#E0904E]" /> 360°
                </Badge>
              )}
            </div>
          </div>

          {/* Amenities & specs */}
          <div className="mt-2.5 pt-2 border-t border-[#E5DAC8]/70 dark:border-[#382618]/70 flex items-center justify-between gap-2 text-[10px] text-[#7C6859] dark:text-[#B8A598]">
            <div className="flex flex-wrap items-center gap-2 truncate">
              {listing.bedrooms > 0 && (
                <span className="inline-flex items-center gap-1 text-[#3B2314] dark:text-[#FAF6F0] font-medium">
                  <Car className="h-3 w-3 text-[#7C6859] dark:text-[#B8A598]" /> {listing.bedrooms} bed
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[#3B2314] dark:text-[#FAF6F0] font-medium">
                <Toilet className="h-3 w-3 text-[#7C6859] dark:text-[#B8A598]" /> {listing.bathrooms} bath
              </span>
              {listing.hasBorehole && (
                <span className="inline-flex items-center gap-1 text-[#78350F] dark:text-[#E0904E] font-medium">
                  <Droplet className="h-3 w-3 text-[#78350F] dark:text-[#E0904E]" /> Water
                </span>
              )}
              {listing.hasPrepaidMeter && (
                <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300 font-medium">
                  <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400" /> Prepaid
                </span>
              )}
            </div>

            <div className="flex items-center text-[#78350F] hover:text-[#92400E] dark:text-[#E0904E] dark:group-hover:text-amber-200 font-semibold text-xs shrink-0">
              <span>Inspect</span>
              <ChevronRight className="h-3.5 w-3.5 ml-0.5 group-hover:translate-x-0.5 transition" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

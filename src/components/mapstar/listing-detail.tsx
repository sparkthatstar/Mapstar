'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Star, ShieldCheck, Video, Camera, Droplet, Zap, Toilet, Wifi, Car, Sparkles,
  Home, MapPin, FileText, Calendar, CheckCircle2, AlertCircle, Building2, Navigation,
} from 'lucide-react'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'

interface ListingDetailProps {
  listing: MockListing | null
  open: boolean
  onOpenChange: (open: boolean) => void
  fees?: {
    successFee: number
    agentFeeCap: number
    stampDuty: number
    tenantServiceFee: number
    agreementFee: number
    totalTenantPays: number
    totalLandlordReceives: number
  } | null
}

export default function ListingDetail({ listing, open, onOpenChange, fees }: ListingDetailProps) {
  if (!listing) return null

  const statusColor = {
    AVAILABLE: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60',
    COMING_SOON: 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/60',
    UNDER_INSPECTION: 'bg-amber-100/70 text-amber-900 border border-amber-300 dark:bg-[#2A1810] dark:text-amber-300 dark:border-[#523018]',
    RECENTLY_LET: 'bg-stone-100 text-stone-700 border border-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-800',
    VERIFIED: 'bg-[#FAF7F2] text-[#78350F] border border-[#E5DAC8] dark:bg-[#2A1810] dark:text-[#E0904E] dark:border-[#382618]',
  }[listing.status] ?? 'bg-stone-100 text-stone-700 border border-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-800'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] p-0 overflow-hidden bg-white dark:bg-[#1A120B] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] shadow-2xl transition-colors">
        <ScrollArea className="max-h-[92vh]">
          {/* Photo gallery / Header Banner */}
          <div className="relative h-60 bg-gradient-to-br from-[#FAF7F2] via-[#F3ECE2] to-[#FAF7F2] dark:from-[#120C08] dark:via-[#1F140D] dark:to-[#120C08] border-b border-[#E5DAC8] dark:border-[#382618] flex items-center justify-center">
            <Building2 className="h-20 w-20 text-[#78350F]/25 dark:text-[#E0904E]/30" />

            {listing.featured && (
              <div className="absolute top-4 left-4 rounded-md bg-gradient-to-r from-[#78350F] to-[#B45309] px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#78350F]/30">
                FEATURED LODGE
              </div>
            )}
            <div className={`absolute top-4 right-4 rounded-md px-2.5 py-1 text-xs font-semibold ${statusColor}`}>
              {listing.status.replace('_', ' ')}
            </div>
            <div className="absolute bottom-3 left-4 rounded-md bg-white/95 text-[#3B2314] dark:bg-black/85 dark:text-amber-100/90 px-2.5 py-1 text-[11px] font-mono border border-[#E5DAC8] dark:border-[#382618] shadow-xs backdrop-blur-md">
              {listing.photoCount} photos · {listing.has360Tour ? '360° tour available' : 'Standard photos'} · {listing.hasVideoWalkthrough ? 'Video walkthrough' : 'No video'}
            </div>
          </div>

          <div className="p-6">
            <DialogHeader className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-[#271810] dark:text-[#FAF6F0] leading-tight">
                    {listing.title}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-1.5 mt-1.5 text-sm text-[#7C6859] dark:text-[#B8A598]">
                    <MapPin className="h-4 w-4 text-[#78350F] dark:text-[#E0904E] shrink-0" />
                    {listing.address}, {listing.area}, {listing.city} {listing.state}
                  </DialogDescription>
                </div>
                <div className="sm:text-right shrink-0">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#78350F] dark:text-[#E0904E]">
                    {formatNaira(listing.annualRent)}
                  </div>
                  <div className="text-xs text-[#7C6859] dark:text-[#B8A598] font-mono">annual rent</div>
                </div>
              </div>
            </DialogHeader>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {listing.physicallyVerified && (
                <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" /> Physically verified
                </Badge>
              )}
              {listing.fairPriceBadge && (
                <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
                  <Sparkles className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" /> Fair Price Certified
                </Badge>
              )}
              {listing.has360Tour && (
                <Badge variant="outline" className="gap-1 border-[#E5DAC8] bg-[#FAF7F2] text-[#3B2314] dark:border-[#382618] dark:bg-[#120C08] dark:text-stone-300">
                  <Camera className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" /> 360° Tour
                </Badge>
              )}
              {listing.hasVideoWalkthrough && (
                <Badge variant="outline" className="gap-1 border-[#E5DAC8] bg-[#FAF7F2] text-[#3B2314] dark:border-[#382618] dark:bg-[#120C08] dark:text-stone-300">
                  <Video className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" /> Video Walkthrough
                </Badge>
              )}
            </div>

            <p className="text-sm text-[#3B2314] dark:text-[#EFE7DE] leading-relaxed mb-6">{listing.description}</p>

            {/* Specs grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
              <Spec icon={<Home className="h-4 w-4 text-[#78350F] dark:text-[#E0904E]" />} label="Type" value={PROPERTY_TYPE_LABELS[listing.propertyType]} />
              <Spec icon={<Car className="h-4 w-4 text-[#78350F] dark:text-[#E0904E]" />} label="Bedrooms" value={String(listing.bedrooms || 'Studio')} />
              <Spec icon={<Toilet className="h-4 w-4 text-[#78350F] dark:text-[#E0904E]" />} label="Bathrooms" value={String(listing.bathrooms)} />
              <Spec icon={<Car className="h-4 w-4 text-[#78350F] dark:text-[#E0904E]" />} label="Parking" value={String(listing.parkingSpaces)} />
            </div>

            {/* Amenities */}
            <section className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C6859] dark:text-[#B8A598] mb-3">Amenities & Facilities</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Amenity ok={listing.hasBorehole} icon={<Droplet className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" />} label="Borehole water" />
                <Amenity ok={listing.hasPrepaidMeter} icon={<Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />} label="Prepaid meter" />
                <Amenity ok={listing.hasInsideToilet} icon={<Toilet className="h-3.5 w-3.5 text-[#7C6859] dark:text-[#B8A598]" />} label="Inside toilet" />
                <Amenity ok={listing.hasCCTV} icon={<ShieldCheck className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" />} label="CCTV / Security" />
                <Amenity ok={listing.hasGenerator} icon={<Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />} label="Generator wiring" />
                <Amenity ok={listing.hasWiFi} icon={<Wifi className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" />} label="WiFi-ready" />
                <Amenity ok={listing.furnished} icon={<Home className="h-3.5 w-3.5 text-[#7C6859] dark:text-[#B8A598]" />} label="Furnished" />
              </div>
            </section>

            <Separator className="my-6 bg-[#E5DAC8] dark:bg-[#382618]" />

            {/* Fee breakdown */}
            <section className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C6859] dark:text-[#B8A598] mb-3 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" /> Transparent Regulated Fee Schedule
              </h4>
              <div className="rounded-xl border border-[#E5DAC8] dark:border-[#382618] overflow-hidden bg-[#FAF7F2] dark:bg-[#120C08]">
                <FeeRow label="Annual rent" value={formatNaira(listing.annualRent)} bold />
                <FeeRow label="Caution fee (refundable)" value={formatNaira(listing.cautionFee)} />
                <FeeRow label="Legal fee" value={formatNaira(listing.legalFee)} />
                <FeeRow
                  label={`Agent fee cap (regulated)`}
                  value={formatNaira(listing.agentFeeCap)}
                  hint="Mapstar-capped ceiling — no excess agent fees"
                />
                {fees && (
                  <>
                    <FeeRow label="Stamp duty (FIRS 0.78%)" value={formatNaira(fees.stampDuty)} />
                    <FeeRow label="Tenant service fee" value={formatNaira(fees.tenantServiceFee)} />
                    <FeeRow label="Agreement + e-sign fee" value={formatNaira(fees.agreementFee)} hint="First agreement free per landlord" />
                  </>
                )}
                <div className="bg-amber-100/70 dark:bg-[#24150C] px-4 py-3 flex items-center justify-between border-t border-amber-200 dark:border-[#382618]">
                  <span className="text-sm font-semibold text-[#271810] dark:text-[#FAF6F0]">Total payable by tenant</span>
                  <span className="text-xl font-extrabold text-[#78350F] dark:text-[#E0904E]">
                    {formatNaira(fees?.totalTenantPays ?? listing.annualRent + listing.cautionFee + listing.legalFee + listing.agentFeeCap)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-[#7C6859] dark:text-[#B8A598] mt-2 flex items-start gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E] mt-0.5 shrink-0" />
                Escrow funds are held securely until digital agreement e-signing and key handover.
              </p>
            </section>

            {/* Availability */}
            <section className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#7C6859] dark:text-[#B8A598] mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[#78350F] dark:text-[#E0904E]" /> Available from
                </div>
                <div className="text-sm font-semibold text-[#271810] dark:text-[#FAF6F0]">
                  {new Date(listing.availableFrom).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="rounded-xl border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#7C6859] dark:text-[#B8A598] mb-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-[#78350F] dark:text-[#E0904E]" /> Verification Status
                </div>
                <div className="text-sm font-semibold text-[#271810] dark:text-[#FAF6F0]">
                  {listing.lastVerifiedAt
                    ? `Verified ${new Date(listing.lastVerifiedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`
                    : 'Pending physical verification'}
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 h-11 bg-[#78350F] hover:bg-[#854D0E] dark:bg-[#B45309] dark:hover:bg-[#C2783B] text-white font-semibold text-sm shadow-md shadow-[#78350F]/25 transition cursor-pointer"
                disabled={listing.status === 'RECENTLY_LET'}
              >
                {listing.status === 'COMING_SOON' ? 'Notify me when ready' : 'Request Lodge Inspection'}
              </Button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer font-semibold text-xs shadow-xs"
              >
                <Navigation className="h-4 w-4" />
                <span>Directions</span>
              </a>
              <Button
                variant="outline"
                className="h-11 px-4 border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] text-[#3B2314] dark:text-[#FAF6F0] hover:bg-[#F3ECE2] dark:hover:bg-[#24160E] hover:text-[#271810] dark:hover:text-white cursor-pointer shadow-xs"
              >
                Save
              </Button>
            </div>
            <p className="text-[10px] text-[#7C6859] dark:text-[#B8A598] mt-3 text-center">
              Direct landlord contact details are shared immediately upon inspection request.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] p-3 flex items-center gap-2.5">
      <div className="p-2 rounded-lg bg-amber-50 dark:bg-[#2A1810] border border-amber-200/80 dark:border-[#382618] text-[#78350F] dark:text-[#E0904E] shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-[#7C6859] dark:text-[#B8A598] font-medium truncate">{label}</div>
        <div className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0] truncate">{value}</div>
      </div>
    </div>
  )
}

function Amenity({ ok, icon, label }: { ok: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 text-xs font-medium transition ${
      ok
        ? 'border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] text-[#271810] dark:text-[#FAF6F0]'
        : 'border-[#E5DAC8]/40 dark:border-[#382618]/40 bg-transparent text-[#7C6859] dark:text-[#7C6859] opacity-50'
    }`}>
      {icon}
      <span className="truncate">{label}</span>
      {ok && <span className="ml-auto text-[10px] text-[#78350F] dark:text-[#E0904E] font-bold">✓</span>}
    </div>
  )
}

function FeeRow({ label, value, bold, hint }: { label: string; value: string; bold?: boolean; hint?: string }) {
  return (
    <div className="px-4 py-2.5 flex items-center justify-between text-xs border-b border-[#E5DAC8] dark:border-[#382618] last:border-b-0 hover:bg-[#FAF7F2]/60 dark:hover:bg-[#1F140D]/40 transition">
      <div>
        <div className={bold ? 'font-semibold text-[#271810] dark:text-[#FAF6F0]' : 'text-[#3B2314] dark:text-[#D4C3B3]'}>{label}</div>
        {hint && <div className="text-[10px] text-[#78350F]/90 dark:text-[#E0904E]/80">{hint}</div>}
      </div>
      <div className={bold ? 'font-bold text-[#271810] dark:text-[#FAF6F0] font-mono' : 'text-[#3B2314] dark:text-[#D4C3B3] font-mono'}>{value}</div>
    </div>
  )
}

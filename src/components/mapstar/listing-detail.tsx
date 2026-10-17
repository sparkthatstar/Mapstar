'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Star, ShieldCheck, Video, Camera, Droplet, Zap, Toilet, Wifi, Car, Sparkles,
  Home, MapPin, FileText, Calendar, CheckCircle2, AlertCircle
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
    AVAILABLE: 'bg-emerald-100 text-emerald-700',
    COMING_SOON: 'bg-amber-100 text-amber-700',
    UNDER_INSPECTION: 'bg-blue-100 text-blue-700',
    RECENTLY_LET: 'bg-slate-100 text-slate-600',
    VERIFIED: 'bg-red-100 text-red-700',
  }[listing.status] ?? 'bg-slate-100 text-slate-600'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[92vh]">
          {/* Photo gallery placeholder */}
          <div className="relative h-56 bg-gradient-to-br from-emerald-100 via-amber-50 to-emerald-50 flex items-center justify-center">
            <Sparkles className="h-16 w-16 text-emerald-300" />
            {listing.featured && (
              <div className="absolute top-3 left-3 rounded-md bg-cyan-500 px-2 py-1 text-xs font-bold text-white">
                FEATURED
              </div>
            )}
            <div className={`absolute top-3 right-3 rounded-md px-2 py-1 text-xs font-medium ${statusColor}`}>
              {listing.status.replace('_', ' ')}
            </div>
            <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white">
              {listing.photoCount} photos · {listing.has360Tour ? '360° tour' : 'no 360°'} · {listing.hasVideoWalkthrough ? 'video' : 'no video'}
            </div>
          </div>

          <div className="p-5">
            <DialogHeader className="mb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <DialogTitle className="text-xl text-slate-900 leading-tight">
                    {listing.title}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-1 mt-1 text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    {listing.address}, {listing.area}, {listing.city} {listing.state}
                  </DialogDescription>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-emerald-700">
                    {formatNaira(listing.annualRent)}
                  </div>
                  <div className="text-xs text-slate-500">per year</div>
                </div>
              </div>
            </DialogHeader>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {listing.physicallyVerified && (
                <Badge variant="outline" className="gap-1 border-red-300 text-red-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Physically verified
                </Badge>
              )}
              {listing.fairPriceBadge && (
                <Badge variant="outline" className="gap-1 border-emerald-300 text-emerald-700">
                  <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" /> Fair Price
                </Badge>
              )}
              {listing.has360Tour && (
                <Badge variant="outline" className="gap-1"><Camera className="h-3.5 w-3.5" /> 360° Tour</Badge>
              )}
              {listing.hasVideoWalkthrough && (
                <Badge variant="outline" className="gap-1"><Video className="h-3.5 w-3.5" /> Video Walkthrough</Badge>
              )}
              {listing.featured && (
                <Badge variant="outline" className="gap-1 border-cyan-300 text-cyan-700"><Sparkles className="h-3.5 w-3.5" /> Featured</Badge>
              )}
            </div>

            <p className="text-sm text-slate-700 leading-relaxed mb-4">{listing.description}</p>

            {/* Specs grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <Spec icon={<Home className="h-4 w-4" />} label="Type" value={PROPERTY_TYPE_LABELS[listing.propertyType]} />
              <Spec icon={<Car className="h-4 w-4" />} label="Bedrooms" value={String(listing.bedrooms || 'Studio')} />
              <Spec icon={<Toilet className="h-4 w-4" />} label="Bathrooms" value={String(listing.bathrooms)} />
              <Spec icon={<Car className="h-4 w-4" />} label="Parking" value={String(listing.parkingSpaces)} />
            </div>

            {/* Amenities */}
            <section className="mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Amenities</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <Amenity ok={listing.hasBorehole} icon={<Droplet className="h-3.5 w-3.5" />} label="Borehole water" />
                <Amenity ok={listing.hasPrepaidMeter} icon={<Zap className="h-3.5 w-3.5" />} label="Prepaid meter" />
                <Amenity ok={listing.hasInsideToilet} icon={<Toilet className="h-3.5 w-3.5" />} label="Inside toilet" />
                <Amenity ok={listing.hasCCTV} icon={<ShieldCheck className="h-3.5 w-3.5" />} label="CCTV / Security" />
                <Amenity ok={listing.hasGenerator} icon={<Zap className="h-3.5 w-3.5" />} label="Generator wiring" />
                <Amenity ok={listing.hasWiFi} icon={<Wifi className="h-3.5 w-3.5" />} label="WiFi-ready" />
                <Amenity ok={listing.furnished} icon={<Home className="h-3.5 w-3.5" />} label="Furnished" />
              </div>
            </section>

            <Separator className="my-4" />

            {/* Fee breakdown */}
            <section className="mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Fee breakdown
              </h4>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <FeeRow label="Annual rent" value={formatNaira(listing.annualRent)} bold />
                <FeeRow label="Caution fee (refundable)" value={formatNaira(listing.cautionFee)} />
                <FeeRow label="Legal fee" value={formatNaira(listing.legalFee)} />
                <FeeRow
                  label={`Agent fee (capped at ${fees ? fees.agentFeeCap !== listing.agentFeeCap ? formatNaira(fees.agentFeeCap) : formatNaira(listing.agentFeeCap) : formatNaira(listing.agentFeeCap)})`}
                  value={formatNaira(listing.agentFeeCap)}
                  hint="Mapstar-capped per admin policy"
                />
                {fees && (
                  <>
                    <FeeRow label="Stamp duty (FIRS 0.78%)" value={formatNaira(fees.stampDuty)} />
                    <FeeRow label="Tenant service fee" value={formatNaira(fees.tenantServiceFee)} />
                    <FeeRow label="Agreement + e-sign fee" value={formatNaira(fees.agreementFee)} hint="First agreement free per landlord" />
                  </>
                )}
                <div className="bg-emerald-50 px-3 py-2 flex items-center justify-between border-t-2 border-emerald-200">
                  <span className="text-sm font-semibold text-emerald-900">Total tenant pays</span>
                  <span className="text-lg font-bold text-emerald-700">
                    {formatNaira(fees?.totalTenantPays ?? listing.annualRent + listing.cautionFee + listing.legalFee + listing.agentFeeCap)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 flex items-start gap-1">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                Fees are computed live from the admin-configured FeeConfig table. Deposit held in Paystack escrow until agreement is signed.
              </p>
            </section>

            {/* Availability */}
            <section className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Available from
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {new Date(listing.availableFrom).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Last verified
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {listing.lastVerifiedAt
                    ? new Date(listing.lastVerifiedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Pending verification'}
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={listing.status === 'RECENTLY_LET'}>
                {listing.status === 'COMING_SOON' ? 'Notify me when ready' : 'Request inspection'}
              </Button>
              <Button variant="outline" className="flex-1">
                Save listing
              </Button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Landlord contact revealed only after escrow deposit — protects both parties.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

function Amenity({ ok, icon, label }: { ok: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
      <span className={ok ? 'text-emerald-600' : 'text-slate-400'}>{icon}</span>
      <span>{label}</span>
    </div>
  )
}

function FeeRow({
  label,
  value,
  bold,
  hint,
}: {
  label: string
  value: string
  bold?: boolean
  hint?: string
}) {
  return (
    <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 last:border-b-0">
      <div>
        <div className={`text-xs ${bold ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{label}</div>
        {hint && <div className="text-[10px] text-slate-500">{hint}</div>}
      </div>
      <div className={`text-sm ${bold ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{value}</div>
    </div>
  )
}

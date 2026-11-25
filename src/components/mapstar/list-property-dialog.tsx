'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Home,
  Briefcase,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  MapPin,
  Check,
} from 'lucide-react'
import type { MockListing } from '@/lib/mock-data'
import type { AuthedUser } from '@/lib/user-auth'

interface ListPropertyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AuthedUser | null
  onListingCreated: (listing: MockListing, updatedUser?: AuthedUser) => void
}

const PROPERTY_TYPES = [
  { value: 'SELF_CONTAINED', label: 'Self-Contained' },
  { value: 'ROOM_PARLOUR', label: 'Room & Parlour' },
  { value: 'MINI_FLAT', label: 'Mini Flat' },
  { value: 'ONE_BEDROOM_FLAT', label: '1-Bedroom Flat' },
  { value: 'TWO_BEDROOM_FLAT', label: '2-Bedroom Flat' },
  { value: 'THREE_BEDROOM_FLAT', label: '3-Bedroom Flat' },
  { value: 'DUPLEX', label: 'Duplex' },
]

const POPULAR_AREAS: Record<string, string[]> = {
  Owerri: ['Ikenegbu', 'Aladinma', 'Eziobodo (FUTO)', 'Ihiagwa (FUTO)', 'Umuguma', 'World Bank', 'Works Layout'],
  Enugu: ['Independence Layout', 'New Haven', 'Ogui', 'Abakpa', 'Trans-Ekulu', 'GRA', 'Achara Layout'],
}

export default function ListPropertyDialog({
  open,
  onOpenChange,
  user,
  onListingCreated,
}: ListPropertyDialogProps) {
  // Role selection: LANDLORD or AGENT
  const [role, setRole] = useState<'LANDLORD' | 'AGENT'>(
    user?.role === 'AGENT' ? 'AGENT' : 'LANDLORD'
  )

  // Listing fields
  const [title, setTitle] = useState('')
  const [city, setCity] = useState<'Owerri' | 'Enugu'>('Owerri')
  const [area, setArea] = useState('Eziobodo (FUTO)')
  const [address, setAddress] = useState('')
  const [propertyType, setPropertyType] = useState('SELF_CONTAINED')
  const [annualRent, setAnnualRent] = useState('')
  const [cautionFee, setCautionFee] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'AVAILABLE' | 'COMING_SOON' | 'UNDER_INSPECTION'>('AVAILABLE')

  // Amenities
  const [hasBorehole, setHasBorehole] = useState(true)
  const [hasPrepaidMeter, setHasPrepaidMeter] = useState(true)
  const [hasInsideToilet, setHasInsideToilet] = useState(true)
  const [hasGenerator, setHasGenerator] = useState(false)
  const [hasCCTV, setHasCCTV] = useState(false)
  const [hasWiFi, setHasWiFi] = useState(false)
  const [furnished, setFurnished] = useState(false)

  // Status
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const rentNum = parseInt(annualRent, 10)
    if (isNaN(rentNum) || rentNum <= 0) {
      setError('Please specify a valid annual rent in Naira.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          title,
          city,
          state: city === 'Owerri' ? 'Imo' : 'Enugu',
          area,
          address: address || `${area}, ${city}`,
          propertyType,
          annualRent: rentNum,
          cautionFee: parseInt(cautionFee, 10) || Math.round(rentNum * 0.1),
          description: description || `Modern ${propertyType.toLowerCase()} located in ${area}, ${city}.`,
          status,
          hasBorehole,
          hasPrepaidMeter,
          hasInsideToilet,
          hasGenerator,
          hasCCTV,
          hasWiFi,
          furnished,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to publish listing')

      onListingCreated(data.listing, data.user)
      setSuccess(true)

      setTimeout(() => {
        setSuccess(false)
        onOpenChange(false)
        // Reset form
        setTitle('')
        setAnnualRent('')
        setCautionFee('')
        setDescription('')
        setAddress('')
      }, 1800)
    } catch (err: any) {
      setError(err.message || 'Something went wrong while publishing the listing.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-[#1A120B] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] shadow-2xl z-[9999] transition-colors">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#4A2810] via-[#5C3317] to-[#2E180A] px-6 py-5 text-white sticky top-0 z-10 border-b border-[#382618]">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <Building className="h-4 w-4 text-amber-200" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white">List Your Property</span>
          </div>
          <DialogTitle className="sr-only">List Your Property</DialogTitle>
          <DialogDescription className="text-amber-100/80 text-xs">
            Connect directly with verified tenants looking for lodges across Imo & Enugu.
          </DialogDescription>
        </div>

        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 dark:bg-[#2A1810] border border-amber-300 dark:border-[#523018] flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-[#78350F] dark:text-[#E0904E]" />
              </div>
              <h3 className="text-base font-bold text-[#271810] dark:text-[#FAF6F0]">Property Listed Successfully!</h3>
              <p className="text-xs text-[#7C6859] dark:text-[#B8A598] max-w-sm mx-auto">
                Your listing is now live on the Mapstar map and list views for verified tenants to explore.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
                  <div className="flex-1 leading-snug">{error}</div>
                </div>
              )}

              {/* ROLE SELECTION */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#271810] dark:text-[#FAF6F0] block">
                  1. I am listing this property as a:
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('LANDLORD')}
                    className={`flex flex-col p-3 rounded-xl border text-left transition cursor-pointer ${
                      role === 'LANDLORD'
                        ? 'border-[#78350F] bg-amber-50 ring-1 ring-[#78350F] text-[#78350F] dark:bg-[#2A1810] dark:border-[#B45309] dark:ring-[#B45309] dark:text-[#E0904E]'
                        : 'border-[#E5DAC8] bg-[#FAF7F2] hover:bg-[#F3ECE2] text-[#3B2314] dark:border-[#382618] dark:bg-[#120C08] dark:hover:bg-[#24160E] dark:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-[#271810] dark:text-[#FAF6F0]">
                        <Home className="h-4 w-4 text-[#78350F] dark:text-[#E0904E]" />
                        <span>Landlord / Owner</span>
                      </div>
                      {role === 'LANDLORD' && <Check className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" />}
                    </div>
                    <span className="text-[11px] text-[#7C6859] dark:text-[#B8A598] leading-tight">
                      Direct owner listing. 0% agent fee charged to tenants.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('AGENT')}
                    className={`flex flex-col p-3 rounded-xl border text-left transition cursor-pointer ${
                      role === 'AGENT'
                        ? 'border-[#78350F] bg-amber-50 ring-1 ring-[#78350F] text-[#78350F] dark:bg-[#2A1810] dark:border-[#B45309] dark:ring-[#B45309] dark:text-[#E0904E]'
                        : 'border-[#E5DAC8] bg-[#FAF7F2] hover:bg-[#F3ECE2] text-[#3B2314] dark:border-[#382618] dark:bg-[#120C08] dark:hover:bg-[#24160E] dark:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-[#271810] dark:text-[#FAF6F0]">
                        <Briefcase className="h-4 w-4 text-[#78350F] dark:text-[#E0904E]" />
                        <span>Verified Agent</span>
                      </div>
                      {role === 'AGENT' && <Check className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" />}
                    </div>
                    <span className="text-[11px] text-[#7C6859] dark:text-[#B8A598] leading-tight">
                      Fee-regulated agent. Admin-capped fee structure applies.
                    </span>
                  </button>
                </div>
              </div>

              {/* BASIC DETAILS */}
              <div className="space-y-3 pt-2 border-t border-[#E5DAC8] dark:border-[#382618]">
                <Label className="text-xs font-semibold text-[#271810] dark:text-[#FAF6F0] block">
                  2. Lodge Details
                </Label>

                <div className="space-y-1">
                  <Label htmlFor="prop-title" className="text-xs text-[#7C6859] dark:text-[#B8A598] font-medium">
                    Property Title
                  </Label>
                  <Input
                    id="prop-title"
                    required
                    placeholder="e.g. Clean Self-Con with constant borehole water near FUTO gate"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9 text-xs bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] placeholder:text-[#7C6859] dark:placeholder:text-[#B8A598] focus:border-[#78350F] dark:focus:border-[#B45309]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#7C6859] dark:text-[#B8A598] font-medium">City</Label>
                    <select
                      value={city}
                      onChange={(e) => {
                        const nextCity = e.target.value as 'Owerri' | 'Enugu'
                        setCity(nextCity)
                        setArea(POPULAR_AREAS[nextCity][0])
                      }}
                      className="w-full h-9 rounded-md border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] px-3 text-xs text-[#271810] dark:text-[#FAF6F0] focus:outline-none focus:border-[#78350F] dark:focus:border-[#B45309]"
                    >
                      <option value="Owerri">Owerri (Imo State)</option>
                      <option value="Enugu">Enugu (Enugu State)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#7C6859] dark:text-[#B8A598] font-medium">Neighborhood / Campus Area</Label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full h-9 rounded-md border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] px-3 text-xs text-[#271810] dark:text-[#FAF6F0] focus:outline-none focus:border-[#78350F] dark:focus:border-[#B45309]"
                    >
                      {POPULAR_AREAS[city].map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="prop-addr" className="text-xs text-[#7C6859] dark:text-[#B8A598] font-medium">
                    Specific Street / Landmark Address
                  </Label>
                  <Input
                    id="prop-addr"
                    placeholder="e.g. Plot 14, Eze Street, Opposite Salvation Ministry"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-9 text-xs bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] placeholder:text-[#7C6859] dark:placeholder:text-[#B8A598] focus:border-[#78350F] dark:focus:border-[#B45309]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#7C6859] dark:text-[#B8A598] font-medium">Property Type</Label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full h-9 rounded-md border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] px-3 text-xs text-[#271810] dark:text-[#FAF6F0] focus:outline-none focus:border-[#78350F] dark:focus:border-[#B45309]"
                    >
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#7C6859] dark:text-[#B8A598] font-medium">Initial Availability</Label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] px-3 text-xs text-[#271810] dark:text-[#FAF6F0] focus:outline-none focus:border-[#78350F] dark:focus:border-[#B45309]"
                    >
                      <option value="AVAILABLE">Available for Inspection Now</option>
                      <option value="COMING_SOON">Coming Soon (Finishing up)</option>
                      <option value="UNDER_INSPECTION">Under Inspection</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* FINANCIALS */}
              <div className="space-y-3 pt-2 border-t border-[#E5DAC8] dark:border-[#382618]">
                <Label className="text-xs font-semibold text-[#271810] dark:text-[#FAF6F0] block">
                  3. Pricing & Fees
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prop-rent" className="text-xs text-[#7C6859] dark:text-[#B8A598] font-medium">
                      Annual Rent (₦)
                    </Label>
                    <Input
                      id="prop-rent"
                      type="number"
                      required
                      placeholder="e.g. 250000"
                      value={annualRent}
                      onChange={(e) => setAnnualRent(e.target.value)}
                      className="h-9 text-xs bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] placeholder:text-[#7C6859] dark:placeholder:text-[#B8A598] focus:border-[#78350F] dark:focus:border-[#B45309]"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prop-caution" className="text-xs text-[#7C6859] dark:text-[#B8A598] font-medium">
                      Refundable Caution Deposit (₦)
                    </Label>
                    <Input
                      id="prop-caution"
                      type="number"
                      placeholder="e.g. 25000 (Defaults to 10%)"
                      value={cautionFee}
                      onChange={(e) => setCautionFee(e.target.value)}
                      className="h-9 text-xs bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] placeholder:text-[#7C6859] dark:placeholder:text-[#B8A598] focus:border-[#78350F] dark:focus:border-[#B45309]"
                    />
                  </div>
                </div>
              </div>

              {/* AMENITIES */}
              <div className="space-y-2 pt-2 border-t border-[#E5DAC8] dark:border-[#382618]">
                <Label className="text-xs font-semibold text-[#271810] dark:text-[#FAF6F0] block">
                  4. Key Amenities Included
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Borehole Water', checked: hasBorehole, set: setHasBorehole },
                    { label: 'Prepaid Meter', checked: hasPrepaidMeter, set: setHasPrepaidMeter },
                    { label: 'Inside Toilet', checked: hasInsideToilet, set: setHasInsideToilet },
                    { label: 'Standby Generator', checked: hasGenerator, set: setHasGenerator },
                    { label: 'CCTV / Security', checked: hasCCTV, set: setHasCCTV },
                    { label: 'Furnished', checked: furnished, set: setFurnished },
                    { label: 'WiFi Access', checked: hasWiFi, set: setHasWiFi },
                  ].map((amenity, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                        amenity.checked
                          ? 'border-[#78350F] bg-amber-50 text-[#78350F] dark:bg-[#2A1810] dark:border-[#B45309] dark:text-[#E0904E] font-medium'
                          : 'border-[#E5DAC8] bg-[#FAF7F2] text-[#3B2314] hover:bg-[#F3ECE2] dark:border-[#382618] dark:bg-[#120C08] dark:text-stone-300 dark:hover:bg-[#24160E]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={amenity.checked}
                        onChange={(e) => amenity.set(e.target.checked)}
                        className="rounded border-[#E5DAC8] dark:border-[#382618] bg-white dark:bg-[#120C08] text-[#78350F] focus:ring-[#78350F] h-3.5 w-3.5"
                      />
                      <span>{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-1 pt-2 border-t border-[#E5DAC8] dark:border-[#382618]">
                <Label htmlFor="prop-desc" className="text-xs text-[#7C6859] dark:text-[#B8A598] font-medium">
                  Brief Lodge Description
                </Label>
                <Textarea
                  id="prop-desc"
                  rows={2}
                  placeholder="Mention compound rules, proximity to campus, light stability, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs resize-none bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] placeholder:text-[#7C6859] dark:placeholder:text-[#B8A598] focus:border-[#78350F] dark:focus:border-[#B45309]"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[#78350F] hover:bg-[#854D0E] dark:bg-[#B45309] dark:hover:bg-[#C2783B] text-white font-semibold text-xs shadow-md shadow-[#78350F]/25 mt-3 cursor-pointer transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing Lodge Listing…
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Publish Listing to Mapstar
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

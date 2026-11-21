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

      setSuccess(true)
      onListingCreated(data.listing, data.user)

      setTimeout(() => {
        setSuccess(false)
        onOpenChange(false)
        setTitle('')
        setAnnualRent('')
        setCautionFee('')
        setDescription('')
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Failed to publish listing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-0 bg-[#090D18] border-slate-800 text-slate-100 shadow-2xl shadow-black/90 z-[9999]">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 px-6 py-5 text-white sticky top-0 z-10 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <Building className="h-4 w-4 text-blue-400" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white">List Your Property</span>
          </div>
          <DialogTitle className="sr-only">List Your Property</DialogTitle>
          <DialogDescription className="text-blue-200/80 text-xs">
            Connect directly with verified tenants looking for lodges across Imo & Enugu.
          </DialogDescription>
        </div>

        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-950/60 border border-blue-800/60 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-white">Property Listed Successfully!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your listing is now live on the Mapstar map and list views for verified tenants to explore.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-800/60 bg-red-950/40 p-2.5 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1 leading-snug">{error}</div>
                </div>
              )}

              {/* ROLE SELECTION */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-300 block">
                  1. I am listing this property as a:
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('LANDLORD')}
                    className={`flex flex-col p-3 rounded-xl border text-left transition cursor-pointer ${
                      role === 'LANDLORD'
                        ? 'border-blue-500 bg-blue-950/60 ring-1 ring-blue-500 text-blue-200'
                        : 'border-slate-800 bg-[#070A12] hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                        <Home className="h-4 w-4 text-blue-400" />
                        <span>Landlord / Owner</span>
                      </div>
                      {role === 'LANDLORD' && <Check className="h-3.5 w-3.5 text-blue-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      Direct owner listing. 0% agent fee charged to tenants.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('AGENT')}
                    className={`flex flex-col p-3 rounded-xl border text-left transition cursor-pointer ${
                      role === 'AGENT'
                        ? 'border-blue-500 bg-blue-950/60 ring-1 ring-blue-500 text-blue-200'
                        : 'border-slate-800 bg-[#070A12] hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                        <Briefcase className="h-4 w-4 text-sky-400" />
                        <span>Verified Agent</span>
                      </div>
                      {role === 'AGENT' && <Check className="h-3.5 w-3.5 text-blue-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      Fee-regulated agent. Admin-capped fee structure applies.
                    </span>
                  </button>
                </div>
              </div>

              {/* BASIC DETAILS */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <Label className="text-xs font-semibold text-slate-300 block">
                  2. Lodge Details
                </Label>

                <div className="space-y-1">
                  <Label htmlFor="prop-title" className="text-xs text-slate-400 font-medium">
                    Property Title
                  </Label>
                  <Input
                    id="prop-title"
                    required
                    placeholder="e.g. Clean Self-Con with constant borehole water near FUTO gate"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9 text-xs bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prop-city" className="text-xs text-slate-400 font-medium">
                      City
                    </Label>
                    <select
                      id="prop-city"
                      value={city}
                      onChange={(e) => {
                        const newCity = e.target.value as 'Owerri' | 'Enugu'
                        setCity(newCity)
                        setArea(POPULAR_AREAS[newCity][0] || '')
                      }}
                      className="w-full h-9 rounded-md border border-slate-800 bg-[#070A12] px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Owerri">Owerri (Imo)</option>
                      <option value="Enugu">Enugu (Enugu)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prop-type" className="text-xs text-slate-400 font-medium">
                      Lodge Type
                    </Label>
                    <select
                      id="prop-type"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-800 bg-[#070A12] px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prop-area" className="text-xs text-slate-400 font-medium">
                      Neighborhood / Area
                    </Label>
                    <Input
                      id="prop-area"
                      required
                      placeholder="e.g. Eziobodo, Ikenegbu, New Haven"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="h-9 text-xs bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                      list="area-suggestions"
                    />
                    <datalist id="area-suggestions">
                      {POPULAR_AREAS[city].map((a) => (
                        <option key={a} value={a} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prop-address" className="text-xs text-slate-400 font-medium">
                      Street Address / Landmark
                    </Label>
                    <Input
                      id="prop-address"
                      placeholder="e.g. Road 4, Green Garden Estate"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-9 text-xs bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* PRICING & STATUS */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <Label className="text-xs font-semibold text-slate-300 block">
                  3. Pricing & Availability
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prop-rent" className="text-xs text-slate-400 font-medium">
                      Annual Rent (₦)
                    </Label>
                    <Input
                      id="prop-rent"
                      type="number"
                      required
                      placeholder="250000"
                      value={annualRent}
                      onChange={(e) => setAnnualRent(e.target.value)}
                      className="h-9 text-xs font-mono bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prop-caution" className="text-xs text-slate-400 font-medium">
                      Caution Deposit (₦)
                    </Label>
                    <Input
                      id="prop-caution"
                      type="number"
                      placeholder="25000"
                      value={cautionFee}
                      onChange={(e) => setCautionFee(e.target.value)}
                      className="h-9 text-xs font-mono bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prop-status" className="text-xs text-slate-400 font-medium">
                      Current Status
                    </Label>
                    <select
                      id="prop-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-slate-800 bg-[#070A12] px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="AVAILABLE">Available Now (Green Star)</option>
                      <option value="COMING_SOON">Coming Soon (Orange Star)</option>
                      <option value="UNDER_INSPECTION">Under Inspection (Blue Star)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* AMENITIES */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <Label className="text-xs font-semibold text-slate-300 block">
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
                          ? 'border-blue-500 bg-blue-950/50 text-blue-200 font-medium'
                          : 'border-slate-800 bg-[#070A12] text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={amenity.checked}
                        onChange={(e) => amenity.set(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span>{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <Label htmlFor="prop-desc" className="text-xs text-slate-400 font-medium">
                  Brief Lodge Description
                </Label>
                <Textarea
                  id="prop-desc"
                  rows={2}
                  placeholder="Mention compound rules, proximity to campus, light stability, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs resize-none bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 mt-3 cursor-pointer transition"
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

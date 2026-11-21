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

  // Listing details
  const [title, setTitle] = useState('')
  const [city, setCity] = useState<'Owerri' | 'Enugu'>('Owerri')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [propertyType, setPropertyType] = useState('SELF_CONTAINED')
  const [annualRent, setAnnualRent] = useState('')
  const [cautionFee, setCautionFee] = useState('')
  const [status, setStatus] = useState<'AVAILABLE' | 'COMING_SOON' | 'UNDER_INSPECTION'>('AVAILABLE')
  const [description, setDescription] = useState('')

  // Amenities
  const [hasBorehole, setHasBorehole] = useState(true)
  const [hasPrepaidMeter, setHasPrepaidMeter] = useState(true)
  const [hasInsideToilet, setHasInsideToilet] = useState(true)
  const [hasGenerator, setHasGenerator] = useState(false)
  const [hasCCTV, setHasCCTV] = useState(false)
  const [furnished, setFurnished] = useState(false)
  const [hasWiFi, setHasWiFi] = useState(false)

  // Submission state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Please provide a listing title')
      return
    }

    if (!area.trim()) {
      setError('Please select or specify the neighborhood/area')
      return
    }

    const rent = Number(annualRent)
    if (!rent || rent <= 0) {
      setError('Please enter a valid annual rent in Naira')
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
          area: area.trim(),
          address: address.trim(),
          propertyType,
          annualRent: rent,
          cautionFee: Number(cautionFee) || Math.round(rent * 0.1),
          status,
          description,
          hasBorehole,
          hasPrepaidMeter,
          hasInsideToilet,
          hasGenerator,
          hasCCTV,
          furnished,
          hasWiFi,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to list property')
      }

      setSuccess(true)
      onListingCreated(data.listing, data.user)

      setTimeout(() => {
        setSuccess(false)
        onOpenChange(false)
        // Reset form
        setTitle('')
        setArea('')
        setAddress('')
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
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-0 border-slate-200 z-[9999]">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 px-6 py-5 text-white sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Building className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">List Your Property</span>
          </div>
          <DialogTitle className="sr-only">List Your Property</DialogTitle>
          <DialogDescription className="text-emerald-100 text-xs">
            Connect directly with verified tenants looking for lodges across Imo & Enugu.
          </DialogDescription>
        </div>

        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Property Listed Successfully!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your listing is now live on the Mapstar map and list views for verified tenants to explore.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1 leading-snug">{error}</div>
                </div>
              )}

              {/* ROLE SELECTION */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-800 block">
                  1. I am listing this property as a:
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('LANDLORD')}
                    className={`flex flex-col p-3 rounded-lg border text-left transition ${
                      role === 'LANDLORD'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                        <Home className="h-4 w-4 text-emerald-600" />
                        <span>Landlord / Owner</span>
                      </div>
                      {role === 'LANDLORD' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Direct owner listing. 0% agent fee charged to tenants.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('AGENT')}
                    className={`flex flex-col p-3 rounded-lg border text-left transition ${
                      role === 'AGENT'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                        <Briefcase className="h-4 w-4 text-teal-600" />
                        <span>Verified Agent</span>
                      </div>
                      {role === 'AGENT' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Fee-regulated agent. Admin-capped fee structure applies.
                    </span>
                  </button>
                </div>
              </div>

              {/* BASIC DETAILS */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <Label className="text-xs font-semibold text-slate-800 block">
                  2. Lodge Details
                </Label>

                <div className="space-y-1">
                  <Label htmlFor="prop-title" className="text-xs text-slate-600 font-medium">
                    Property Title
                  </Label>
                  <Input
                    id="prop-title"
                    required
                    placeholder="e.g. Clean Self-Con with constant borehole water near FUTO gate"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prop-city" className="text-xs text-slate-600 font-medium">
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
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="Owerri">Owerri (Imo)</option>
                      <option value="Enugu">Enugu (Enugu)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prop-type" className="text-xs text-slate-600 font-medium">
                      Lodge Type
                    </Label>
                    <select
                      id="prop-type"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
                    <Label htmlFor="prop-area" className="text-xs text-slate-600 font-medium">
                      Neighborhood / Area
                    </Label>
                    <Input
                      id="prop-area"
                      required
                      placeholder="e.g. Eziobodo, Ikenegbu, New Haven"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="h-9 text-xs"
                      list="area-suggestions"
                    />
                    <datalist id="area-suggestions">
                      {POPULAR_AREAS[city].map((a) => (
                        <option key={a} value={a} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prop-address" className="text-xs text-slate-600 font-medium">
                      Street Address / Landmark
                    </Label>
                    <Input
                      id="prop-address"
                      placeholder="e.g. Road 4, Green Garden Estate"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* PRICING & STATUS */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <Label className="text-xs font-semibold text-slate-800 block">
                  3. Pricing & Availability
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prop-rent" className="text-xs text-slate-600 font-medium">
                      Annual Rent (₦)
                    </Label>
                    <Input
                      id="prop-rent"
                      type="number"
                      required
                      placeholder="250000"
                      value={annualRent}
                      onChange={(e) => setAnnualRent(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prop-caution" className="text-xs text-slate-600 font-medium">
                      Caution Deposit (₦)
                    </Label>
                    <Input
                      id="prop-caution"
                      type="number"
                      placeholder="25000"
                      value={cautionFee}
                      onChange={(e) => setCautionFee(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prop-status" className="text-xs text-slate-600 font-medium">
                      Current Status
                    </Label>
                    <select
                      id="prop-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="AVAILABLE">Available Now (Green Star)</option>
                      <option value="COMING_SOON">Coming Soon (Orange Star)</option>
                      <option value="UNDER_INSPECTION">Under Inspection (Blue Star)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* AMENITIES */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-xs font-semibold text-slate-800 block">
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
                      className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer select-none transition ${
                        amenity.checked
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-medium'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={amenity.checked}
                        onChange={(e) => amenity.set(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                      />
                      <span>{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <Label htmlFor="prop-desc" className="text-xs text-slate-600 font-medium">
                  Brief Lodge Description
                </Label>
                <Textarea
                  id="prop-desc"
                  rows={2}
                  placeholder="Mention compound rules, proximity to campus, light stability, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm mt-3"
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

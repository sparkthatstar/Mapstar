'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { PROPERTY_TYPE_LABELS } from '@/lib/mock-data'

export interface FilterState {
  city: string | null
  area: string | null
  propertyTypes: string[]
  minRent: number
  maxRent: number
  statuses: string[]
  verifiedOnly: boolean
  featuredOnly: boolean
  fairPriceOnly: boolean
  has360: boolean
  hasVideo: boolean
  furnished: boolean
  hasBorehole: boolean
  hasPrepaidMeter: boolean
  hasInsideToilet: boolean
  hasCCTV: boolean
  hasGenerator: boolean
  hasWiFi: boolean
  sort: string
}

export const DEFAULT_FILTERS: FilterState = {
  city: null,
  area: null,
  propertyTypes: [],
  minRent: 0,
  maxRent: 2000000,
  statuses: ['AVAILABLE', 'COMING_SOON', 'VERIFIED', 'UNDER_INSPECTION', 'RECENTLY_LET'],
  verifiedOnly: false,
  featuredOnly: false,
  fairPriceOnly: false,
  has360: false,
  hasVideo: false,
  furnished: false,
  hasBorehole: false,
  hasPrepaidMeter: false,
  hasInsideToilet: false,
  hasCCTV: false,
  hasGenerator: false,
  hasWiFi: false,
  sort: 'newest',
}

interface FilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilterState
  onChange: (patch: Partial<FilterState>) => void
  onReset: () => void
}

const ALL_PROPERTY_TYPES = Object.keys(PROPERTY_TYPE_LABELS)
const ALL_STATUSES = [
  { id: 'AVAILABLE', label: 'Available now' },
  { id: 'COMING_SOON', label: 'Coming soon' },
  { id: 'UNDER_INSPECTION', label: 'Under inspection' },
  { id: 'RECENTLY_LET', label: 'Recently let' },
  { id: 'VERIFIED', label: 'Verified by Mapstar' },
]

export default function FilterPanel({
  open,
  onOpenChange,
  filters,
  onChange,
  onReset,
}: FilterPanelProps) {
  const activeCount = countActive(filters)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-3 sticky top-0 bg-white z-10 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Advanced filters</SheetTitle>
            {activeCount > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                {activeCount} active
              </Badge>
            )}
          </div>
          <SheetDescription className="text-xs">
            Refine your search across price, location, amenities, and trust signals.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] px-5 py-4">
          {/* City */}
          <section className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Location</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: null, label: 'All cities' },
                { id: 'Owerri', label: 'Owerri (Imo)' },
                { id: 'Enugu', label: 'Enugu (Enugu)' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => onChange({ city: opt.id })}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                    filters.city === opt.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <Separator className="my-4" />

          {/* Price */}
          <section className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Annual rent (₦)
            </h4>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span>₦{(filters.minRent / 1000).toFixed(0)}k</span>
              <span>₦{(filters.maxRent / 1000).toFixed(0)}k</span>
            </div>
            <Slider
              value={[filters.minRent, filters.maxRent]}
              min={0}
              max={2000000}
              step={50000}
              onValueChange={(v) => onChange({ minRent: v[0], maxRent: v[1] })}
              className="mb-2"
            />
          </section>

          <Separator className="my-4" />

          {/* Property type */}
          <section className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Lodge type
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PROPERTY_TYPES.map((t) => {
                const checked = filters.propertyTypes.includes(t)
                return (
                  <label
                    key={t}
                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs cursor-pointer ${
                      checked ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => {
                        const next = checked
                          ? filters.propertyTypes.filter((x) => x !== t)
                          : [...filters.propertyTypes, t]
                        onChange({ propertyTypes: next })
                      }}
                    />
                    <span>{PROPERTY_TYPE_LABELS[t]}</span>
                  </label>
                )
              })}
            </div>
          </section>

          <Separator className="my-4" />

          {/* Availability */}
          <section className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Pin status
            </h4>
            <div className="space-y-2">
              {ALL_STATUSES.map((s) => {
                const checked = filters.statuses.includes(s.id)
                return (
                  <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => {
                        const next = checked
                          ? filters.statuses.filter((x) => x !== s.id)
                          : [...filters.statuses, s.id]
                        onChange({ statuses: next })
                      }}
                    />
                    <span>{s.label}</span>
                  </label>
                )
              })}
            </div>
          </section>

          <Separator className="my-4" />

          {/* Trust signals */}
          <section className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Trust & verification
            </h4>
            <div className="space-y-2.5">
              <ToggleRow
                label="Verified by Mapstar only"
                checked={filters.verifiedOnly}
                onChange={(v) => onChange({ verifiedOnly: v })}
              />
              <ToggleRow
                label="Featured listings only"
                checked={filters.featuredOnly}
                onChange={(v) => onChange({ featuredOnly: v })}
              />
              <ToggleRow
                label="Fair Price badge only"
                checked={filters.fairPriceOnly}
                onChange={(v) => onChange({ fairPriceOnly: v })}
              />
              <ToggleRow
                label="Has 360° tour"
                checked={filters.has360}
                onChange={(v) => onChange({ has360: v })}
              />
              <ToggleRow
                label="Has video walkthrough"
                checked={filters.hasVideo}
                onChange={(v) => onChange({ hasVideo: v })}
              />
            </div>
          </section>

          <Separator className="my-4" />

          {/* Amenities */}
          <section className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Amenities
            </h4>
            <div className="space-y-2.5">
              <ToggleRow label="Furnished" checked={filters.furnished} onChange={(v) => onChange({ furnished: v })} />
              <ToggleRow label="Borehole water" checked={filters.hasBorehole} onChange={(v) => onChange({ hasBorehole: v })} />
              <ToggleRow label="Prepaid meter" checked={filters.hasPrepaidMeter} onChange={(v) => onChange({ hasPrepaidMeter: v })} />
              <ToggleRow label="Inside toilet" checked={filters.hasInsideToilet} onChange={(v) => onChange({ hasInsideToilet: v })} />
              <ToggleRow label="CCTV / Security" checked={filters.hasCCTV} onChange={(v) => onChange({ hasCCTV: v })} />
              <ToggleRow label="Generator wiring" checked={filters.hasGenerator} onChange={(v) => onChange({ hasGenerator: v })} />
              <ToggleRow label="WiFi-ready" checked={filters.hasWiFi} onChange={(v) => onChange({ hasWiFi: v })} />
            </div>
          </section>

          <Separator className="my-4" />

          {/* Sort */}
          <section className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Sort by
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'newest', label: 'Newest' },
                { id: 'price_asc', label: 'Price ↑' },
                { id: 'price_desc', label: 'Price ↓' },
                { id: 'distance', label: 'Distance' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange({ sort: s.id })}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                    filters.sort === s.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t px-5 py-3 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onReset}>
            Reset
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onOpenChange(false)}
          >
            Show results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs text-slate-700 cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function countActive(f: FilterState): number {
  let n = 0
  if (f.city) n++
  if (f.propertyTypes.length) n++
  if (f.minRent > 0 || f.maxRent < 2000000) n++
  if (f.verifiedOnly) n++
  if (f.featuredOnly) n++
  if (f.fairPriceOnly) n++
  if (f.has360) n++
  if (f.hasVideo) n++
  if (f.furnished) n++
  if (f.hasBorehole) n++
  if (f.hasPrepaidMeter) n++
  if (f.hasInsideToilet) n++
  if (f.hasCCTV) n++
  if (f.hasGenerator) n++
  if (f.hasWiFi) n++
  return n
}

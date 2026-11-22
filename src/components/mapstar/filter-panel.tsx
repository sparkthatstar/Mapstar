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
import { Filter, RotateCcw } from 'lucide-react'

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
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto p-0 bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
        <SheetHeader className="px-5 pt-5 pb-3 sticky top-0 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md z-10 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <SheetTitle className="text-lg font-bold text-slate-900 dark:text-white">Filter Lodges</SheetTitle>
            </div>
            {activeCount > 0 && (
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800/60 text-xs">
                {activeCount} active
              </Badge>
            )}
          </div>
          <SheetDescription className="text-xs text-slate-500 dark:text-slate-400">
            Refine your lodge search across price, amenities, and trust signals.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] px-5 py-4">
          {/* City */}
          <section className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Location</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: null, label: 'All cities' },
                { id: 'Owerri', label: 'Owerri' },
                { id: 'Enugu', label: 'Enugu' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => onChange({ city: opt.id })}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition cursor-pointer ${
                    filters.city === opt.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/60 dark:text-blue-300'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-[#070A12] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <Separator className="my-4 bg-slate-200 dark:bg-slate-800" />

          {/* Price */}
          <section className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Annual Rent Budget
              </h4>
              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                ₦{(filters.minRent / 1000).toFixed(0)}k — ₦{(filters.maxRent / 1000).toFixed(0)}k
              </div>
            </div>
            <Slider
              value={[filters.minRent, filters.maxRent]}
              min={0}
              max={2000000}
              step={50000}
              onValueChange={(v) => onChange({ minRent: v[0], maxRent: v[1] })}
              className="my-3"
            />
          </section>

          <Separator className="my-4 bg-slate-200 dark:bg-slate-800" />

          {/* Property type */}
          <section className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Lodge Type
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PROPERTY_TYPES.map((t) => {
                const checked = filters.propertyTypes.includes(t)
                return (
                  <label
                    key={t}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium cursor-pointer transition ${
                      checked
                        ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-200'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-[#070A12] dark:text-slate-300 dark:hover:bg-slate-800'
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
                    <span className="truncate">{PROPERTY_TYPE_LABELS[t]}</span>
                  </label>
                )
              })}
            </div>
          </section>

          <Separator className="my-4 bg-slate-200 dark:bg-slate-800" />

          {/* Availability / Pin status */}
          <section className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Availability Status
            </h4>
            <div className="space-y-2">
              {ALL_STATUSES.map((s) => {
                const checked = filters.statuses.includes(s.id)
                return (
                  <label key={s.id} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white">
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

          <Separator className="my-4 bg-slate-200 dark:bg-slate-800" />

          {/* Trust & Verification */}
          <section className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Trust & Verification
            </h4>
            <div className="space-y-3">
              <ToggleRow
                label="Physically verified only"
                desc="Lodge visited and checked by a Mapstar agent"
                checked={filters.verifiedOnly}
                onChange={(v) => onChange({ verifiedOnly: v })}
              />
              <ToggleRow
                label="Fair Price certified only"
                desc="Rent is within ±10% of local median"
                checked={filters.fairPriceOnly}
                onChange={(v) => onChange({ fairPriceOnly: v })}
              />
              <ToggleRow
                label="Featured lodges only"
                desc="Verified high-priority lodges"
                checked={filters.featuredOnly}
                onChange={(v) => onChange({ featuredOnly: v })}
              />
            </div>
          </section>

          <Separator className="my-4 bg-slate-200 dark:bg-slate-800" />

          {/* Amenities & Infrastructure */}
          <section className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Essential Amenities
            </h4>
            <div className="space-y-3">
              <ToggleRow
                label="Borehole running water"
                desc="Private water source on premises"
                checked={filters.hasBorehole}
                onChange={(v) => onChange({ hasBorehole: v })}
              />
              <ToggleRow
                label="Prepaid meter installed"
                desc="Individual NEPA meter — no shared bill disputes"
                checked={filters.hasPrepaidMeter}
                onChange={(v) => onChange({ hasPrepaidMeter: v })}
              />
              <ToggleRow
                label="Private inside toilet"
                desc="En-suite bathroom — not shared"
                checked={filters.hasInsideToilet}
                onChange={(v) => onChange({ hasInsideToilet: v })}
              />
              <ToggleRow
                label="Generator / Inverter wiring"
                desc="Changeover switch installed"
                checked={filters.hasGenerator}
                onChange={(v) => onChange({ hasGenerator: v })}
              />
              <ToggleRow
                label="Furnished lodge"
                desc="Bed frame, wardrobe, and basic furniture included"
                checked={filters.furnished}
                onChange={(v) => onChange({ furnished: v })}
              />
              <ToggleRow
                label="WiFi connection ready"
                desc="Fibre or router installed"
                checked={filters.hasWiFi}
                onChange={(v) => onChange({ hasWiFi: v })}
              />
            </div>
          </section>
        </ScrollArea>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="flex-1 border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-[#070A12] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white text-xs h-9 shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset all
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 shadow-md shadow-blue-500/20"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1">
        <Label className="text-xs font-semibold text-slate-900 dark:text-slate-200 cursor-pointer">{label}</Label>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function countActive(filters: FilterState): number {
  let c = 0
  if (filters.city !== null) c++
  if (filters.propertyTypes.length > 0) c += filters.propertyTypes.length
  if (filters.minRent > 0 || filters.maxRent < 2000000) c++
  if (filters.statuses.length < 5) c++
  if (filters.verifiedOnly) c++
  if (filters.featuredOnly) c++
  if (filters.fairPriceOnly) c++
  if (filters.has360) c++
  if (filters.hasVideo) c++
  if (filters.furnished) c++
  if (filters.hasBorehole) c++
  if (filters.hasPrepaidMeter) c++
  if (filters.hasInsideToilet) c++
  if (filters.hasCCTV) c++
  if (filters.hasGenerator) c++
  if (filters.hasWiFi) c++
  return c
}

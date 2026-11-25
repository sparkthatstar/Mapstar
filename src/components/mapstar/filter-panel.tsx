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
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto p-0 bg-white dark:bg-[#1A120B] border-r border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] transition-colors">
        <SheetHeader className="px-5 pt-5 pb-3 sticky top-0 bg-white/95 dark:bg-[#1A120B]/95 backdrop-blur-md z-10 border-b border-[#E5DAC8] dark:border-[#382618]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#78350F] dark:text-[#E0904E]" />
              <SheetTitle className="text-lg font-bold text-[#271810] dark:text-[#FAF6F0]">Filter Lodges</SheetTitle>
            </div>
            {activeCount > 0 && (
              <Badge className="bg-amber-100/80 text-amber-900 border border-amber-300 dark:bg-[#2A1810] dark:text-amber-200 dark:border-[#382618] text-xs">
                {activeCount} active
              </Badge>
            )}
          </div>
          <SheetDescription className="text-xs text-[#7C6859] dark:text-[#B8A598]">
            Refine your lodge search across price, amenities, and trust signals.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] px-5 py-4">
          {/* City */}
          <section className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C6859] dark:text-[#B8A598] mb-2">Location</h4>
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
                      ? 'border-[#78350F] bg-amber-50 text-[#78350F] shadow-xs dark:border-[#B45309] dark:bg-[#2A1810] dark:text-[#E0904E]'
                      : 'border-[#E5DAC8] bg-[#FAF7F2] text-[#3B2314] hover:bg-[#F3ECE2] dark:border-[#382618] dark:bg-[#120C08] dark:text-stone-300 dark:hover:bg-[#24160E]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <Separator className="my-4 bg-[#E5DAC8] dark:bg-[#382618]" />

          {/* Price */}
          <section className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C6859] dark:text-[#B8A598]">
                Annual Rent Budget
              </h4>
              <div className="text-xs font-mono font-bold text-[#78350F] dark:text-[#E0904E]">
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

          <Separator className="my-4 bg-[#E5DAC8] dark:bg-[#382618]" />

          {/* Property type */}
          <section className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C6859] dark:text-[#B8A598] mb-2.5">
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
                        ? 'border-[#78350F] bg-amber-50 text-[#78350F] dark:border-[#B45309] dark:bg-[#2A1810] dark:text-[#E0904E]'
                        : 'border-[#E5DAC8] bg-[#FAF7F2] text-[#3B2314] hover:bg-[#F3ECE2] dark:border-[#382618] dark:bg-[#120C08] dark:text-stone-300 dark:hover:bg-[#24160E]'
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

          <Separator className="my-4 bg-[#E5DAC8] dark:bg-[#382618]" />

          {/* Availability / Pin status */}
          <section className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C6859] dark:text-[#B8A598] mb-2.5">
              Availability Status
            </h4>
            <div className="space-y-2">
              {ALL_STATUSES.map((s) => {
                const checked = filters.statuses.includes(s.id)
                return (
                  <label key={s.id} className="flex items-center gap-2.5 text-xs text-[#3B2314] dark:text-[#FAF6F0] cursor-pointer hover:text-[#78350F] dark:hover:text-[#E0904E]">
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

          <Separator className="my-4 bg-[#E5DAC8] dark:bg-[#382618]" />

          {/* Trust & Verification */}
          <section className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C6859] dark:text-[#B8A598] mb-3">
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

          <Separator className="my-4 bg-[#E5DAC8] dark:bg-[#382618]" />

          {/* Amenities & Infrastructure */}
          <section className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C6859] dark:text-[#B8A598] mb-3">
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
        <div className="p-4 border-t border-[#E5DAC8] dark:border-[#382618] bg-white dark:bg-[#1A120B] flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="flex-1 border-[#E5DAC8] bg-[#FAF7F2] text-[#3B2314] hover:bg-[#F3ECE2] dark:border-[#382618] dark:bg-[#120C08] dark:text-stone-300 dark:hover:bg-[#24160E] text-xs h-9 shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset all
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-[#78350F] hover:bg-[#854D0E] dark:bg-[#B45309] dark:hover:bg-[#C2783B] text-white font-semibold text-xs h-9 shadow-md shadow-[#78350F]/20"
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
        <Label className="text-xs font-semibold text-[#271810] dark:text-[#FAF6F0] cursor-pointer">{label}</Label>
        <p className="text-[10px] text-[#7C6859] dark:text-[#B8A598] mt-0.5">{desc}</p>
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

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Map as MapIcon, List, SlidersHorizontal, Plus, Search, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import MapView from '@/components/mapstar/map-view'
import ListingCard from '@/components/mapstar/listing-card'
import ListingDetail from '@/components/mapstar/listing-detail'
import FilterPanel, { DEFAULT_FILTERS, FilterState } from '@/components/mapstar/filter-panel'
import { MockListing, formatNaira } from '@/lib/mock-data'
import { MOCK_LISTINGS as listings } from '@/lib/mock-data'

type ViewMode = 'map' | 'list'

const CITIES = [
  { id: 'Owerri', label: 'Owerri', center: [5.497, 7.025] as [number, number], state: 'Imo' },
  { id: 'Enugu', label: 'Enugu', center: [6.454, 7.516] as [number, number], state: 'Enugu' },
]

export default function Home() {
  const [view, setView] = useState<ViewMode>('map')
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS })
  const [filterOpen, setFilterOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeCity, setActiveCity] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [fees, setFees] = useState<any>(null)

  useEffect(() => {
    fetch('/api/fees', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setFees(d.config))
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    let r = listings.filter((l) => {
      if (activeCity && l.city !== activeCity) return false
      if (filters.city && l.city !== filters.city) return false
      if (filters.propertyTypes.length && !filters.propertyTypes.includes(l.propertyType)) return false
      if (l.annualRent < filters.minRent || l.annualRent > filters.maxRent) return false
      if (!filters.statuses.includes(l.status)) return false
      if (filters.verifiedOnly && !l.physicallyVerified) return false
      if (filters.featuredOnly && !l.featured) return false
      if (filters.fairPriceOnly && !l.fairPriceBadge) return false
      if (filters.has360 && !l.has360Tour) return false
      if (filters.hasVideo && !l.hasVideoWalkthrough) return false
      if (filters.furnished && !l.furnished) return false
      if (filters.hasBorehole && !l.hasBorehole) return false
      if (filters.hasPrepaidMeter && !l.hasPrepaidMeter) return false
      if (filters.hasInsideToilet && !l.hasInsideToilet) return false
      if (filters.hasCCTV && !l.hasCCTV) return false
      if (filters.hasGenerator && !l.hasGenerator) return false
      if (filters.hasWiFi && !l.hasWiFi) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!l.title.toLowerCase().includes(q) && !l.area.toLowerCase().includes(q) && !l.city.toLowerCase().includes(q)) return false
      }
      return true
    })
    switch (filters.sort) {
      case 'price_asc': r = [...r].sort((a, b) => a.annualRent - b.annualRent); break
      case 'price_desc': r = [...r].sort((a, b) => b.annualRent - a.annualRent); break
      case 'newest': r = [...r].reverse(); break
    }
    return r
  }, [filters, activeCity, searchQuery])

  const selected = useMemo(
    () => filtered.find((l) => l.id === selectedId) ?? listings.find((l) => l.id === selectedId) ?? null,
    [selectedId, filtered]
  )

  const computedFees = useMemo(() => {
    if (!selected || !fees) return null
    const successFee = Math.round((selected.annualRent * fees.successFeePercent) / 100)
    const agentFeeCap = Math.round((selected.annualRent * fees.agentFeeCapPercent) / 100)
    const stampDuty = Math.round((selected.annualRent * fees.stampDutyPercent) / 100)
    return {
      successFee,
      agentFeeCap,
      stampDuty,
      tenantServiceFee: fees.tenantServiceFeeNaira,
      agreementFee: fees.agreementFeeNaira,
      totalTenantPays: selected.annualRent + selected.cautionFee + stampDuty + fees.tenantServiceFeeNaira + fees.agreementFeeNaira,
      totalLandlordReceives: selected.annualRent - successFee - agentFeeCap,
    }
  }, [selected, fees])

  function openListing(id: string) {
    setSelectedId(id)
    setDetailOpen(true)
  }

  function patchFilters(p: Partial<FilterState>) {
    setFilters((f) => ({ ...f, ...p }))
  }

  function resetFilters() {
    setFilters({ ...DEFAULT_FILTERS })
    setSearchQuery('')
  }

  const mapCenter: [number, number] = activeCity
    ? CITIES.find((c) => c.id === activeCity)?.center ?? [5.497, 7.025]
    : [5.497, 7.025]

  const counts = useMemo(() => {
    return {
      available: listings.filter((l) => l.status === 'AVAILABLE' || l.status === 'VERIFIED').length,
      comingSoon: listings.filter((l) => l.status === 'COMING_SOON').length,
      inspection: listings.filter((l) => l.status === 'UNDER_INSPECTION').length,
      let_: listings.filter((l) => l.status === 'RECENTLY_LET').length,
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="shrink-0 bg-white border-b border-slate-200 px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative h-8 w-8 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="h-8 w-8">
                <path
                  d="M16 2 L19.6 12.2 L30.4 12.5 L21.7 19.0 L24.7 29.3 L16 23.2 L7.3 29.3 L10.3 19.0 L1.6 12.5 L12.4 12.2 Z"
                  fill="#10B981"
                  stroke="#047857"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-bold text-slate-900 leading-none">Mapstar</div>
              <div className="text-[10px] text-slate-500 leading-none mt-0.5">Find lodges. Skip the agent fees.</div>
            </div>
          </div>

          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Owerri, Enugu, area, or lodge..."
              className="h-9 pl-8 text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">List lodge</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveCity(null)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                activeCity === null ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {CITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCity(c.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  activeCity === c.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-slate-200 shrink-0" />
          <div className="flex items-center gap-2 text-[10px] text-slate-500 shrink-0">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{counts.available} available</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{counts.comingSoon} soon</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />{counts.inspection} inspection</span>
          </div>
        </div>
      </header>

      <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-1.5 flex items-center justify-between">
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{filtered.length}</span> lodges match
        </div>
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
          <button
            onClick={() => setView('map')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition ${
              view === 'map' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-600'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" /> Map
          </button>
          <button
            onClick={() => setView('list')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition ${
              view === 'list' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-600'
            }`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      <main className="flex-1 min-h-0 relative">
        {view === 'map' ? (
          <div className="absolute inset-0 flex">
            <div className="flex-1 h-full">
              <MapView
                listings={filtered}
                selectedId={selectedId}
                onSelect={openListing}
                center={mapCenter}
                zoom={13}
              />
            </div>
            <aside className="hidden lg:block w-96 border-l border-slate-200 bg-white overflow-y-auto">
              <div className="p-3 space-y-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold px-1">
                  {filtered.length} lodges in view
                </div>
                {filtered.length === 0 ? (
                  <EmptyState onReset={resetFilters} />
                ) : (
                  filtered.map((l) => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      selected={selectedId === l.id}
                      onSelect={openListing}
                    />
                  ))
                )}
              </div>
            </aside>
          </div>
        ) : (
          <div className="absolute inset-0 overflow-y-auto bg-slate-50">
            <div className="max-w-3xl mx-auto p-3 sm:p-4 space-y-2.5">
              {filtered.some((l) => l.featured) && (
                <section className="mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 px-1">
                    <Star className="h-3.5 w-3.5 text-cyan-500 fill-cyan-500" /> Featured
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {filtered.filter((l) => l.featured).slice(0, 4).map((l) => (
                      <ListingCard
                        key={l.id}
                        listing={l}
                        selected={selectedId === l.id}
                        onSelect={openListing}
                      />
                    ))}
                  </div>
                </section>
              )}

              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1 px-1">
                All lodges
              </div>
              {filtered.length === 0 ? (
                <EmptyState onReset={resetFilters} />
              ) : (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {filtered.map((l) => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      selected={selectedId === l.id}
                      onSelect={openListing}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <FilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={patchFilters}
        onReset={resetFilters}
      />
      <ListingDetail
        listing={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        fees={computedFees}
      />
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700">No lodges match</h3>
      <p className="text-xs text-slate-500 mt-1 mb-3">Try widening your filters or removing the price cap.</p>
      <Button size="sm" variant="outline" onClick={onReset}>Reset filters</Button>
    </div>
  )
}

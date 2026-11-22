'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Map as MapIcon,
  List,
  SlidersHorizontal,
  Search,
  Star,
  LogIn,
  LogOut,
  User as UserIcon,
  UserPlus,
  ChevronDown,
  Shield,
  Columns2,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  Droplet,
  Zap,
  ArrowUpDown,
  X,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ListingCard from '@/components/mapstar/listing-card'
import ListingDetail from '@/components/mapstar/listing-detail'
import FilterPanel, { DEFAULT_FILTERS, FilterState } from '@/components/mapstar/filter-panel'
import LoginSignupDialog, { AuthedUser } from '@/components/mapstar/login-signup-dialog'
import ListPropertyDialog from '@/components/mapstar/list-property-dialog'
import WelcomeOnboardingModal from '@/components/mapstar/welcome-onboarding-modal'
import NewUserBanner from '@/components/mapstar/new-user-banner'
import BottomNavigation, { NavTab } from '@/components/mapstar/bottom-navigation'
import ChatView from '@/components/mapstar/chat-view'
import MeView from '@/components/mapstar/me-view'
import StarPowerView from '@/components/mapstar/star-power-view'
import SettingsDialog from '@/components/mapstar/settings-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { MOCK_LISTINGS, MockListing, formatNaira } from '@/lib/mock-data'

// Interactive Google Maps & Turn-by-Turn Directions Component
const MapView = dynamic(() => import('@/components/mapstar/map-view'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070A12] text-sm text-slate-500 dark:text-slate-400 gap-2">
      <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span>Loading Google Maps Navigation…</span>
    </div>
  ),
})

type ViewMode = 'split' | 'list' | 'map'

const CITIES = [
  { id: 'Owerri', label: 'Owerri', center: [5.497, 7.025] as [number, number], state: 'Imo' },
  { id: 'Enugu', label: 'Enugu', center: [6.454, 7.516] as [number, number], state: 'Enugu' },
]

export default function Home() {
  const [view, setView] = useState<ViewMode>('split')
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS })
  const [filterOpen, setFilterOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeCity, setActiveCity] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [fees, setFees] = useState<any>(null)

  // Listings state (includes custom listings)
  const [listingsData, setListingsData] = useState<MockListing[]>(MOCK_LISTINGS)

  // User auth state
  const [user, setUser] = useState<AuthedUser | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // List property dialog state
  const [listPropertyOpen, setListPropertyOpen] = useState(false)

  // Interactive Onboarding & User Guide Modal state
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  // Bottom Layer Navigation state
  const [bottomTab, setBottomTab] = useState<NavTab>('listings')
  const [settingsOpen, setSettingsOpen] = useState(false)

  function handleTabChange(tab: NavTab) {
    if (tab === 'settings') {
      setSettingsOpen(true)
      return
    }
    setBottomTab(tab)
  }

  // Automatically welcome new users on first visit (only once)
  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('mapstar_has_seen_onboarding')
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setOnboardingOpen(true)
        }, 750)
        return () => clearTimeout(timer)
      }
    } catch {}
  }, [])

  // Load fee config (admin-regulated) for the listing detail fee breakdown
  useEffect(() => {
    fetch('/api/fees', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setFees(d.config))
      .catch(() => {})
  }, [])

  // Load listings from API (fetches saved custom listings + mock listings)
  useEffect(() => {
    fetch('/api/listings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.listings && Array.isArray(d.listings)) {
          setListingsData(d.listings)
        }
      })
      .catch(() => {})
  }, [])

  // Load current user (if any) on mount
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
  }, [])

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }

  function handleListingCreated(newListing: MockListing, updatedUser?: AuthedUser) {
    setListingsData((prev) => [newListing, ...prev])
    if (updatedUser) {
      setUser(updatedUser)
    }
    openListing(newListing.id)
  }

  // Filtered listings
  const filtered = useMemo(() => {
    let r = listingsData.filter((l) => {
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
        if (
          !l.title.toLowerCase().includes(q) &&
          !l.area.toLowerCase().includes(q) &&
          !l.city.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
    switch (filters.sort) {
      case 'price_asc':
        r = [...r].sort((a, b) => a.annualRent - b.annualRent)
        break
      case 'price_desc':
        r = [...r].sort((a, b) => b.annualRent - a.annualRent)
        break
      case 'newest':
        r = [...r].reverse()
        break
    }
    return r
  }, [listingsData, filters, activeCity, searchQuery])

  const selected = useMemo(
    () => filtered.find((l) => l.id === selectedId) ?? listingsData.find((l) => l.id === selectedId) ?? null,
    [selectedId, filtered, listingsData]
  )

  // Computed fees for the selected listing
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
      totalTenantPays:
        selected.annualRent + selected.cautionFee + stampDuty + fees.tenantServiceFeeNaira + fees.agreementFeeNaira,
      totalLandlordReceives: selected.annualRent - successFee - agentFeeCap,
    }
  }, [selected, fees])

  function openListing(id: string) {
    setSelectedId(id)
    setDetailOpen(true)
  }

  function handleSelectFromCard(id: string) {
    setSelectedId(id)
  }

  function patchFilters(p: Partial<FilterState>) {
    setFilters((f) => ({ ...f, ...p }))
  }

  function resetFilters() {
    setFilters({ ...DEFAULT_FILTERS })
    setSearchQuery('')
    setActiveCity(null)
  }

  const mapCenter: [number, number] = activeCity
    ? CITIES.find((c) => c.id === activeCity)?.center ?? [5.497, 7.025]
    : [5.497, 7.025]

  const counts = useMemo(() => {
    return {
      available: listingsData.filter((l) => l.status === 'AVAILABLE' || l.status === 'VERIFIED').length,
      comingSoon: listingsData.filter((l) => l.status === 'COMING_SOON').length,
      inspection: listingsData.filter((l) => l.status === 'UNDER_INSPECTION').length,
      let_: listingsData.filter((l) => l.status === 'RECENTLY_LET').length,
    }
  }, [listingsData])

  const activeFilterCount = useMemo(() => {
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
  }, [filters])

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] dark:bg-[#070A12] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* =========================================================================
          TOP HEADER: Pure, Centered Mapstar Brand Header
          (Search, filters, theme toggle, sign in/login, and list options moved)
         ========================================================================= */}
      <header className="shrink-0 bg-white/95 dark:bg-[#090D18] border-b border-slate-200 dark:border-slate-800/90 py-3 px-4 z-20 backdrop-blur-md transition-colors shadow-2xs">
        <div className="flex flex-col items-center justify-center text-center">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => {
              setBottomTab('listings')
              resetFilters()
            }}
          >
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-950 p-1 flex items-center justify-center shadow-lg shadow-blue-600/30 border border-blue-500/40 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 32 32" className="h-5 w-5">
                <path
                  d="M16 2 L19.6 12.2 L30.4 12.5 L21.7 19.0 L24.7 29.3 L16 23.2 L7.3 29.3 L10.3 19.0 L1.6 12.5 L12.4 12.2 Z"
                  fill="#60A5FA"
                  stroke="#1D4ED8"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Mapstar
              </span>
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/50">
                PRO
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium tracking-tight">
            Verified Lodges · Regulated Fees
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
        {/* TAB 1: Real-time Community Chat */}
        {bottomTab === 'chat' && (
          <ChatView
            user={user}
            onOpenAuth={(mode) => {
              setAuthMode(mode || 'login')
              setAuthOpen(true)
            }}
          />
        )}

        {/* TAB: Administrator Star Power Space */}
        {bottomTab === 'star_power' && (
          <StarPowerView
            user={user}
            onOpenListingDetail={openListing}
          />
        )}

        {/* TAB 2: User Profile / Me */}
        {bottomTab === 'me' && (
          <MeView
            user={user}
            onOpenAuth={(mode) => {
              setAuthMode(mode || 'login')
              setAuthOpen(true)
            }}
            onLogout={handleLogout}
            onOpenListProperty={() => {
              if (!user) {
                setAuthMode('login')
                setAuthOpen(true)
              } else {
                setListPropertyOpen(true)
              }
            }}
          />
        )}

        {/* TAB 3: Main Listings Feed & Interactive Map */}
        {bottomTab === 'listings' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* =========================================================================
                MIDDLE ROW: Creatively Merged Search + Filter, plus Sorting & View Switcher
               ========================================================================= */}
            <div className="shrink-0 bg-white dark:bg-[#090D18] border-b border-slate-200 dark:border-slate-800/80 px-3 py-2.5 sm:px-5 sm:py-3 z-10 transition-colors">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 max-w-full mx-auto">
                {/* Unified Search & Filter Command Bar */}
                <div className="flex-1 flex items-center">
                  <div className="relative flex-1 flex items-center">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search lodge, area (e.g. Eziobodo, New Haven, Ikenegbu)..."
                      className="h-10 pl-10 pr-24 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 rounded-xl shadow-2xs"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-22 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Integrated Filter Trigger inside Search Bar */}
                    <button
                      onClick={() => setFilterOpen(true)}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        activeFilterCount > 0
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#0E1526] text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800 shadow-2xs'
                      }`}
                      title="Open advanced lodge filters"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span>Filters</span>
                      {activeFilterCount > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-blue-600 text-[9px] font-bold">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sorting and View Options in the Same Row */}
                <div className="flex items-center justify-between lg:justify-end gap-2.5 shrink-0">
                  {/* Sorting dropdown */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0 flex items-center gap-1">
                      <ArrowUpDown className="h-3 w-3" /> Sort:
                    </span>
                    <select
                      value={filters.sort}
                      onChange={(e) => patchFilters({ sort: e.target.value })}
                      className="h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A12] px-2.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs font-medium"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                  </div>

                  {/* View Switcher (Desktop & Mobile) */}
                  <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#070A12] p-0.5 shadow-2xs">
                    <button
                      onClick={() => setView('split')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        view === 'split' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                      title="Split view (Listings + Map)"
                    >
                      <Columns2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Split</span>
                    </button>
                    <button
                      onClick={() => setView('list')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        view === 'list' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                      title="Full Listings view"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">List</span>
                    </button>
                    <button
                      onClick={() => setView('map')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        view === 'map' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                      title="Full Map view"
                    >
                      <MapIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Map</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* City Filter & Availability Status Bar */}
              <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-850/80 overflow-x-auto text-xs">
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setActiveCity(null)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                      activeCity === null
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-[#070A12] dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800/80'
                    }`}
                  >
                    All Cities
                  </button>
                  {CITIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCity(c.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                        activeCity === c.id
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-[#070A12] dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800/80'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">{counts.available}</strong> Available
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50" />
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">{counts.comingSoon}</strong> Soon
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50" />
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">{counts.inspection}</strong> In Inspection
                  </span>
                </div>
              </div>
            </div>

            {/* Workspace Container: Left Side Listings Feed & Right Side Map */}
            <div className="flex-1 min-h-0 relative flex overflow-hidden">
              {/* Left Side: Listed Houses Feed */}
              <div
                className={`flex flex-col h-full bg-[#F8FAFC] dark:bg-[#070A12] overflow-hidden transition-all duration-300 ${
                  view === 'map'
                    ? 'hidden'
                    : view === 'list'
                    ? 'w-full'
                    : 'w-full lg:w-[54%] xl:w-[52%] 2xl:w-[50%]'
                }`}
              >
                {/* Quick Filter Tag Chips */}
                <div className="shrink-0 bg-slate-100/70 dark:bg-[#070A12] px-4 py-1.5 border-b border-slate-200 dark:border-slate-850 flex items-center gap-1.5 overflow-x-auto text-[11px] transition-colors">
                  <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 shrink-0">Quick filters:</span>
                  <button
                    onClick={() => patchFilters({ verifiedOnly: !filters.verifiedOnly })}
                    className={`rounded-full px-2.5 py-0.5 font-medium transition shrink-0 cursor-pointer ${
                      filters.verifiedOnly
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs dark:bg-[#0B1120] dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Verified Only
                  </button>
                  <button
                    onClick={() => patchFilters({ fairPriceOnly: !filters.fairPriceOnly })}
                    className={`rounded-full px-2.5 py-0.5 font-medium transition shrink-0 cursor-pointer ${
                      filters.fairPriceOnly
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs dark:bg-[#0B1120] dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Fair Price
                  </button>
                  <button
                    onClick={() => patchFilters({ hasBorehole: !filters.hasBorehole })}
                    className={`rounded-full px-2.5 py-0.5 font-medium transition shrink-0 cursor-pointer ${
                      filters.hasBorehole
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs dark:bg-[#0B1120] dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Borehole Water
                  </button>
                  <button
                    onClick={() => patchFilters({ hasPrepaidMeter: !filters.hasPrepaidMeter })}
                    className={`rounded-full px-2.5 py-0.5 font-medium transition shrink-0 cursor-pointer ${
                      filters.hasPrepaidMeter
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs dark:bg-[#0B1120] dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Prepaid NEPA
                  </button>
                  <button
                    onClick={() => patchFilters({ hasWiFi: !filters.hasWiFi })}
                    className={`rounded-full px-2.5 py-0.5 font-medium transition shrink-0 cursor-pointer ${
                      filters.hasWiFi
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs dark:bg-[#0B1120] dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800'
                    }`}
                  >
                    WiFi Ready
                  </button>
                </div>

                {/* Scrollable Listings Feed */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-4">
                  <NewUserBanner onOpenGuide={() => setOnboardingOpen(true)} />

                  {filtered.length === 0 ? (
                    <EmptyState onReset={resetFilters} />
                  ) : (
                    <div
                      className={`grid gap-3 ${
                        view === 'list'
                          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto'
                          : 'grid-cols-1 xl:grid-cols-2'
                      }`}
                    >
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

              {/* Right Side: Map */}
              <div
                className={`h-full relative overflow-hidden border-l border-slate-200 dark:border-slate-850 transition-all duration-300 ${
                  view === 'list'
                    ? 'hidden'
                    : view === 'map'
                    ? 'w-full'
                    : 'hidden lg:flex flex-1'
                }`}
              >
                <MapView
                  listings={filtered}
                  selectedId={selectedId}
                  onSelect={openListing}
                  center={mapCenter}
                  zoom={13}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          BOTTOM LAYER: Persistent Bottom Navigation Bar
          (Listings · Chat · [Star Power if Admin] · Me · Settings)
         ========================================================================= */}
      <BottomNavigation
        currentTab={settingsOpen ? 'settings' : bottomTab}
        onTabChange={handleTabChange}
        isLoggedIn={Boolean(user)}
        isAdmin={user?.role === 'ADMIN'}
      />

      {/* Settings Dialog (Appearance theme, Login/Signup, Policies, Guide) */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
        onOpenAuth={(mode) => {
          setAuthMode(mode || 'login')
          setAuthOpen(true)
        }}
        onLogout={handleLogout}
        onOpenGuide={() => setOnboardingOpen(true)}
        onOpenStarPower={() => setBottomTab('star_power')}
      />

      {/* Drawers & Dialogs */}
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
      <LoginSignupDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        defaultMode={authMode}
        onAuthed={(u) => setUser(u)}
      />
      <ListPropertyDialog
        open={listPropertyOpen}
        onOpenChange={setListPropertyOpen}
        user={user}
        onListingCreated={handleListingCreated}
      />
      <WelcomeOnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onSelectCity={(city) => setActiveCity(city)}
      />
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800/80 shadow-sm my-4 max-w-md mx-auto">
      <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center mb-3">
        <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">No lodges match your filters</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-5 max-w-xs mx-auto">
        Try adjusting your budget range, changing the city, or removing amenity restrictions.
      </p>
      <Button
        size="sm"
        onClick={onReset}
        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 h-9 shadow-md shadow-blue-600/30 cursor-pointer"
      >
        Reset all filters
      </Button>
    </div>
  )
}

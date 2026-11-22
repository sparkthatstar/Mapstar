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
  Plus,
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
      {/* Top Header — Clean Matured Slate in Light Mode / Obsidian Midnight in Dark Mode */}
      <header className="shrink-0 bg-white/95 dark:bg-[#090D18] border-b border-slate-200 dark:border-slate-800/90 px-3 py-2 sm:px-5 sm:py-2.5 z-20 backdrop-blur-md transition-colors">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => resetFilters()}>
            <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-950 p-1 flex items-center justify-center shadow-lg shadow-blue-600/30 border border-blue-500/40">
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
            <div className="hidden sm:block">
              <div className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1 leading-none">
                Mapstar <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800/50">PRO</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-1">Verified Lodges · Regulated Fees</div>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lodge, area (e.g. Eziobodo, New Haven, Ikenegbu)..."
              className="h-9 pl-9 pr-8 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              className={`h-9 text-xs border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-[#070A12] dark:hover:bg-slate-850 hover:border-blue-500/60 cursor-pointer shadow-xs ${
                activeFilterCount > 0 ? 'text-blue-600 border-blue-300 bg-blue-50/80 dark:text-blue-400 dark:border-blue-500/60 dark:bg-blue-950/30' : 'text-slate-700 dark:text-slate-300'
              }`}
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Bright / Dark Theme Toggle Option */}
            <ThemeToggle />

            {/* How it Works / Interactive Tour Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5 sm:px-3 text-xs font-semibold border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-[#070A12] dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 shadow-xs cursor-pointer transition"
              onClick={() => setOnboardingOpen(true)}
              title="How to use Mapstar & interactive guide"
            >
              <HelpCircle className="h-3.5 w-3.5 mr-1 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline">How it Works</span>
              <span className="md:hidden">Guide</span>
            </Button>

            {/* List Property Action Button */}
            <Button
              size="sm"
              className="h-9 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-700/60 shadow-xs cursor-pointer transition"
              onClick={() => {
                if (!user) {
                  setAuthMode('login')
                  setAuthOpen(true)
                } else {
                  setListPropertyOpen(true)
                }
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline">List Property</span>
              <span className="md:hidden">List</span>
            </Button>

            {/* User Profile or Login/Signup */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5 pr-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070A12] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-xs">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white shadow-xs">
                      {(user.fullName || user.email || '?').charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden sm:inline max-w-[100px] truncate text-xs font-medium">
                      {user.fullName || user.email}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#090D18] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
                  <DropdownMenuLabel className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {user.fullName || 'Unnamed user'}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-normal truncate text-[11px]">{user.email}</span>
                      <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 text-[9px] font-semibold text-blue-700 dark:text-blue-300">
                        {user.role === 'ADMIN' ? 'Administrator' : user.role === 'LANDLORD' ? 'Landlord / Owner' : user.role === 'AGENT' ? 'Verified Agent' : 'Student / Tenant'}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenuItem
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                    onClick={() => setListPropertyOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-2" /> List a Property
                  </DropdownMenuItem>

                  {user.role === 'ADMIN' && (
                    <>
                      <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                      <DropdownMenuItem asChild className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer">
                        <Link href="/admin">
                          <Shield className="h-3.5 w-3.5 mr-2" /> Admin Control Portal
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenuItem className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer" onClick={handleLogout}>
                    <LogOut className="h-3.5 w-3.5 mr-2" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2.5 sm:px-3 text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-[#070A12] dark:hover:bg-slate-850 cursor-pointer shadow-xs"
                  onClick={() => {
                    setAuthMode('login')
                    setAuthOpen(true)
                  }}
                >
                  <LogIn className="h-3.5 w-3.5 mr-1 text-blue-600 dark:text-blue-400" />
                  <span>Log in</span>
                </Button>
                <Button
                  size="sm"
                  className="h-9 px-2.5 sm:px-3 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 cursor-pointer transition"
                  onClick={() => {
                    setAuthMode('signup')
                    setAuthOpen(true)
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  <span>Sign up</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* City Filter & Status Ticker */}
        <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-slate-200 dark:border-slate-850/80 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveCity(null)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                activeCity === null
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
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
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
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
      </header>

      {/* Main Body — Rearranged Layout: Houses on the LEFT side, Balanced Map on the RIGHT side */}
      <main className="flex-1 min-h-0 relative flex flex-col">
        {/* Mobile View Toggle Bar (visible only below lg) */}
        <div className="lg:hidden shrink-0 bg-white dark:bg-[#090D18] border-b border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-blue-600 dark:text-blue-400">{filtered.length}</span> lodges found
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#070A12] p-0.5">
            <button
              onClick={() => setView('split')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                view === 'split' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" /> Split
            </button>
            <button
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                view === 'list' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button
              onClick={() => setView('map')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                view === 'map' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" /> Map
            </button>
          </div>
        </div>

        {/* Workspace Container */}
        <div className="flex-1 min-h-0 relative flex overflow-hidden">
          {/* =========================================================================
              LEFT SIDE: Listed Houses Feed (Occupies the Left side as explicitly requested)
             ========================================================================= */}
          <div
            className={`flex flex-col h-full bg-[#F8FAFC] dark:bg-[#070A12] overflow-hidden transition-all duration-300 ${
              view === 'map'
                ? 'hidden'
                : view === 'list'
                ? 'w-full'
                : 'w-full lg:w-[54%] xl:w-[52%] 2xl:w-[50%]'
            }`}
          >
            {/* Top Toolbar for the Left Listings Pane */}
            <div className="shrink-0 bg-white dark:bg-[#090D18] border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3 z-10 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                  {filtered.length} {filtered.length === 1 ? 'Lodge' : 'Lodges'}
                </span>
                {activeCity && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">in {activeCity}</span>
                )}
                {filters.sort && (
                  <span className="hidden sm:inline text-[11px] text-slate-500">
                    · sorted by{' '}
                    {filters.sort === 'price_asc'
                      ? 'price (low to high)'
                      : filters.sort === 'price_desc'
                      ? 'price (high to low)'
                      : 'newest'}
                  </span>
                )}
              </div>

              {/* View options & Quick Sort */}
              <div className="flex items-center gap-2">
                <select
                  value={filters.sort}
                  onChange={(e) => patchFilters({ sort: e.target.value })}
                  className="h-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A12] px-2 text-[11px] text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>

                {/* Desktop View Switcher */}
                <div className="hidden lg:inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#070A12] p-0.5">
                  <button
                    onClick={() => setView('split')}
                    className={`p-1 rounded transition cursor-pointer ${
                      view === 'split' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title="Split view (List on left, map on right)"
                  >
                    <Columns2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-1 rounded transition cursor-pointer ${
                      view === 'list' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title="Full listings view"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setView('map')}
                    className={`p-1 rounded transition cursor-pointer ${
                      view === 'map' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title="Full map view"
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

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
              {/* Interactive Welcome Banner for New Users */}
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

          {/* =========================================================================
              RIGHT SIDE: Balanced, High-Tech Map (Framed on the Right side)
             ========================================================================= */}
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
      </main>

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

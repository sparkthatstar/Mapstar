'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Shield, Save, RefreshCw, Lock, LogOut, DollarSign, Building, Users,
  Flag, BarChart3, LayoutDashboard, Loader2, ExternalLink, Star,
  Database, CheckCircle2, AlertTriangle, Settings, Key, Link2, Sparkles,
  LifeBuoy, Phone, Mail, MessageSquare, AlertCircle, Clock, Check, X, Search,
  Scale, ShieldAlert, Radio, Globe, Trash2, Eye, Send,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import MapstarAppIcon from '@/components/mapstar/app-icon'
import { DEFAULT_FEES, FeeConfig } from '@/lib/fees'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'
import { MOCK_LISTINGS } from '@/lib/mock-data'

type Tab = 'overview' | 'fees' | 'listings' | 'users' | 'reports' | 'analytics' | 'appeals' | 'chats'

interface AdminDashboardProps {
  adminEmail: string
}

export default function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const [openComplaintsCount, setOpenComplaintsCount] = useState<number>(0)
  const [pendingAppealsCount, setPendingAppealsCount] = useState<number>(0)

  const loadAppealsCount = useCallback(() => {
    fetch('/api/chat?action=appeals')
      .then((r) => r.json())
      .then((d) => {
        if (d.appeals && Array.isArray(d.appeals)) {
          const count = d.appeals.filter((a: any) => a.status === 'PENDING').length
          setPendingAppealsCount(count)
        }
      })
      .catch(() => {})
  }, [])

  const loadComplaintsCount = useCallback(() => {
    fetch('/api/admin/complaints')
      .then((r) => r.json())
      .then((d) => {
        if (d.counts?.open !== undefined) {
          setOpenComplaintsCount(d.counts.open)
        } else if (d.complaints) {
          const count = d.complaints.filter((c: any) => c.status === 'OPEN').length
          setOpenComplaintsCount(count)
        }
      })
      .catch(() => {
        fetch('/api/support')
          .then((r) => r.json())
          .then((d) => {
            if (d.tickets) {
              const count = d.tickets.filter((t: any) => t.status === 'OPEN').length
              setOpenComplaintsCount(count)
            }
          })
          .catch(() => {})
      })
  }, [])

  useEffect(() => {
    loadComplaintsCount()
    loadAppealsCount()
  }, [loadComplaintsCount, loadAppealsCount])

  function logout() {
    fetch('/api/admin/logout', { method: 'POST' }).then(() => {
      window.location.href = '/admin'
    })
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-[#090D18] border-b border-slate-800 text-white shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapstarAppIcon className="h-8 w-8 shadow-md shadow-[#78350F]/25" />
            <div>
              <div className="text-sm font-semibold leading-none">Mapstar Admin</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Control panel</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300">
              <Lock className="h-3 w-3 text-amber-400" />
              <span>{adminEmail}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-800 bg-[#070A12] text-slate-200 hover:bg-slate-800 hover:text-white"
              asChild
            >
              <a href="/" target="_blank">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View site
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-800 bg-[#070A12] text-slate-200 hover:bg-rose-950 hover:border-rose-800 hover:text-rose-200"
              onClick={logout}
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex gap-6 min-h-0">
        {/* Sidebar */}
        <nav className="w-56 shrink-0 hidden md:block">
          <ul className="space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'fees', label: 'Fee Configuration', icon: DollarSign },
              { id: 'listings', label: 'Listings', icon: Building },
              { id: 'users', label: 'Users', icon: Users },
              {
                id: 'reports',
                label: 'Customer Complaints',
                icon: LifeBuoy,
                badge: openComplaintsCount > 0 ? openComplaintsCount : null,
              },
              {
                id: 'appeals',
                label: 'Group Appeals',
                icon: Scale,
                badge: pendingAppealsCount > 0 ? pendingAppealsCount : null,
              },
              {
                id: 'chats',
                label: 'Omni-Chat Vault',
                icon: MessageSquare,
              },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map((item) => {
              const Icon = item.icon
              const active = tab === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setTab(item.id as Tab)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                      active
                        ? 'bg-[#78350F] dark:bg-[#B45309] text-white shadow-md shadow-[#78350F]/25'
                        : 'text-slate-400 hover:bg-[#0E1526] hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Mobile tab selector */}
        <div className="md:hidden -mx-4 px-4 mb-2 flex gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'fees', label: 'Fees' },
            { id: 'listings', label: 'Listings' },
            { id: 'users', label: 'Users' },
            {
              id: 'reports',
              label: openComplaintsCount > 0 ? `Complaints (${openComplaintsCount})` : 'Complaints',
            },
            {
              id: 'appeals',
              label: pendingAppealsCount > 0 ? `Appeals (${pendingAppealsCount})` : 'Appeals',
            },
            { id: 'chats', label: 'Omni-Chat' },
            { id: 'analytics', label: 'Analytics' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                tab === item.id ? 'bg-[#78350F] dark:bg-[#B45309] text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main panel */}
        <main className="flex-1 min-w-0 bg-[#090D18] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">
          {tab === 'overview' && (
            <OverviewTab onNavigate={setTab} openComplaintsCount={openComplaintsCount} />
          )}
          {tab === 'fees' && <FeesTab />}
          {tab === 'listings' && <ListingsTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'reports' && (
            <ReportsTab onCountChange={setOpenComplaintsCount} />
          )}
          {tab === 'appeals' && (
            <AppealsTab onCountChange={setPendingAppealsCount} />
          )}
          {tab === 'chats' && <OmniChatVaultTab />}
          {tab === 'analytics' && <AnalyticsTab />}
        </main>
      </div>
    </div>
  )
}

/* ---------------- Overview ---------------- */

function OverviewTab({
  onNavigate,
  openComplaintsCount = 0,
}: {
  onNavigate: (t: Tab) => void
  openComplaintsCount?: number
}) {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [dbLoading, setDbLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [fees, setFees] = useState<FeeConfig | null>(null)

  // Configuration dialog state
  const [configOpen, setConfigOpen] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('')
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState('')
  const [supabaseServiceKeyInput, setSupabaseServiceKeyInput] = useState('')
  const [databaseUrlInput, setDatabaseUrlInput] = useState('')
  const [directUrlInput, setDirectUrlInput] = useState('')

  const loadDbStatus = useCallback(() => {
    setDbLoading(true)
    fetch('/api/admin/database', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setDbStatus(d)
        if (d.supabaseUrl) setSupabaseUrlInput(d.supabaseUrl)
      })
      .catch(() => {})
      .finally(() => setDbLoading(false))
  }, [])

  useEffect(() => {
    loadDbStatus()
  }, [loadDbStatus])

  async function handleSeed() {
    setSeeding(true)
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Supabase database seeded successfully!')
        loadDbStatus()
      } else {
        toast.error(data.error || 'Failed to seed Supabase database')
      }
    } catch (err: any) {
      toast.error('Seed error: ' + err.message)
    } finally {
      setSeeding(false)
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault()
    setSavingConfig(true)
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure',
          supabaseUrl: supabaseUrlInput.trim(),
          supabaseAnonKey: supabaseAnonKeyInput.trim(),
          supabaseServiceKey: supabaseServiceKeyInput.trim(),
          databaseUrl: databaseUrlInput.trim(),
          directUrl: directUrlInput.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Supabase credentials saved successfully!')
        setConfigOpen(false)
        loadDbStatus()
      } else {
        toast.error(data.error || 'Failed to save configuration')
      }
    } catch (err: any) {
      toast.error('Configuration error: ' + err.message)
    } finally {
      setSavingConfig(false)
    }
  }

  const stats = useMemo(() => {
    const listingCount = dbStatus?.counts?.listings || MOCK_LISTINGS.length
    return {
      listings: listingCount,
      users: dbStatus?.counts?.users || 0,
      properties: dbStatus?.counts?.properties || 0,
      available: MOCK_LISTINGS.filter((l) => l.status === 'AVAILABLE' || l.status === 'VERIFIED').length,
      comingSoon: MOCK_LISTINGS.filter((l) => l.status === 'COMING_SOON').length,
      featured: MOCK_LISTINGS.filter((l) => l.featured).length,
      verified: MOCK_LISTINGS.filter((l) => l.physicallyVerified).length,
      totalRentValue: MOCK_LISTINGS.reduce((s, l) => s + l.annualRent, 0),
    }
  }, [dbStatus])

  useEffect(() => {
    fetch('/api/fees', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setFees(d.config))
      .catch(() => {})
  }, [])

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-tight">Welcome back, Admin</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor and control Supabase cloud storage, lodge listings, and fee regulations.
        </p>

        {/* Supabase Database Connection Card */}
        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#070A12] p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                dbStatus?.connected
                  ? 'bg-[#2A1810] text-amber-400 border border-[#523018] shadow-lg shadow-[#2A1810]/50'
                  : 'bg-amber-950/70 text-amber-400 border border-amber-800/60'
              }`}>
                <Database className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Supabase Cloud Database</h3>
                  {dbStatus?.connected ? (
                    <Badge variant="outline" className="bg-[#2A1810] border-amber-600/60 text-amber-300 text-[10px] gap-1.5 px-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Connected ({dbStatus.latencyMs}ms)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-950/80 border-amber-500/60 text-amber-300 text-[10px] gap-1 px-2">
                      <AlertTriangle className="h-3 w-3" /> {dbStatus?.status === 'unconfigured' ? 'Awaiting Credentials' : 'Local Fallback Active'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Engine: <span className="font-mono text-amber-400">PostgreSQL (Supabase pgBouncer + REST API)</span>
                  {dbStatus?.databaseUrlMasked && (
                    <span className="hidden md:inline ml-2 text-slate-500">· {dbStatus.databaseUrlMasked}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfigOpen(true)}
                className="h-8 text-xs border-slate-800 bg-[#090D18] text-slate-200 hover:border-amber-600/60 hover:text-white cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                Configure Supabase
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDbStatus}
                disabled={dbLoading}
                className="h-8 text-xs border-slate-800 bg-[#090D18] text-slate-200 hover:border-amber-600/60 hover:text-white cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-amber-400 ${dbLoading ? 'animate-spin' : ''}`} />
                Test Ping
              </Button>
              <Button
                size="sm"
                onClick={handleSeed}
                disabled={seeding}
                className="h-8 text-xs bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white font-semibold shadow-md shadow-[#78350F]/25 cursor-pointer transition"
              >
                <Database className="h-3.5 w-3.5 mr-1.5" />
                {seeding ? 'Seeding...' : 'Seed Anchor Lodges'}
              </Button>
            </div>
          </div>

          {/* Database table counts preview */}
          {dbStatus?.connected && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-3.5 border-t border-slate-800/80 text-center">
              <div className="bg-[#090D18] border border-slate-800/60 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cloud Users</span>
                <div className="text-base font-extrabold text-white mt-0.5">{dbStatus.counts.users}</div>
              </div>
              <div className="bg-[#090D18] border border-slate-800/60 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cloud Properties</span>
                <div className="text-base font-extrabold text-white mt-0.5">{dbStatus.counts.properties}</div>
              </div>
              <div className="bg-[#090D18] border border-slate-800/60 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cloud Listings</span>
                <div className="text-base font-extrabold text-amber-400 mt-0.5">{dbStatus.counts.listings}</div>
              </div>
              <div className="bg-[#090D18] border border-slate-800/60 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fee Regulation</span>
                <div className="text-base font-extrabold text-amber-300 mt-0.5">{dbStatus.counts.feeConfigs > 0 ? 'Active in DB' : 'Using Defaults'}</div>
              </div>
              <div className="bg-[#090D18] border border-slate-800/60 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cloud Chat Messages</span>
                <div className="text-base font-extrabold text-emerald-400 mt-0.5">{dbStatus.counts.chatMessages || 0}</div>
              </div>
            </div>
          )}
        </div>

        {/* Configure Supabase Modal Dialog */}
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto p-0 bg-[#090D18] border-slate-800 text-slate-100 shadow-2xl shadow-black/90 z-[9999]">
            <div className="bg-gradient-to-r from-[#4A2810] via-[#5C3317] to-[#2E180A] px-6 py-5 text-white border-b border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                  <Database className="h-4 w-4 text-amber-400" />
                </div>
                <span className="font-bold tracking-tight text-lg text-white">Supabase Connection Settings</span>
              </div>
              <DialogTitle className="sr-only">Supabase Connection Settings</DialogTitle>
              <DialogDescription className="text-amber-100/80 text-xs">
                Connect Mapstar to your live Supabase project to store properties, lodge listings, and tenant agreements.
              </DialogDescription>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="supabase-url" className="text-xs font-semibold text-slate-300">
                  Supabase Project URL
                </Label>
                <Input
                  id="supabase-url"
                  placeholder="https://xyzprojectref.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  className="h-9 text-xs bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#78350F]"
                />
                <p className="text-[10px] text-slate-500">Found in: Supabase Dashboard → Project Settings → API → Project URL</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="supabase-anon" className="text-xs font-semibold text-slate-300">
                  Supabase Anon Public Key (Publishable)
                </Label>
                <Input
                  id="supabase-anon"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKeyInput}
                  onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                  className="h-9 text-xs font-mono bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#78350F]"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="supabase-service" className="text-xs font-semibold text-slate-300">
                  Supabase Service Role Key (Secret)
                </Label>
                <Input
                  id="supabase-service"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseServiceKeyInput}
                  onChange={(e) => setSupabaseServiceKeyInput(e.target.value)}
                  className="h-9 text-xs font-mono bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#78350F]"
                />
                <p className="text-[10px] text-slate-500">Bypasses RLS for secure backend API mutations and database seeding.</p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800">
                <Label htmlFor="db-url" className="text-xs font-semibold text-slate-300">
                  PostgreSQL DATABASE_URL (Transaction Pooler - port 6543)
                </Label>
                <Input
                  id="db-url"
                  placeholder="postgresql://postgres.ref:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
                  value={databaseUrlInput}
                  onChange={(e) => setDatabaseUrlInput(e.target.value)}
                  className="h-9 text-xs font-mono bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#78350F]"
                />
                <p className="text-[10px] text-slate-500">Found in: Supabase Dashboard → Settings → Database → Connection string (URI)</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="direct-url" className="text-xs font-semibold text-slate-300">
                  DIRECT_URL (Direct / Session Mode - port 5432, for migrations)
                </Label>
                <Input
                  id="direct-url"
                  placeholder="postgresql://postgres.ref:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres"
                  value={directUrlInput}
                  onChange={(e) => setDirectUrlInput(e.target.value)}
                  className="h-9 text-xs font-mono bg-[#070A12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#78350F]"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfigOpen(false)}
                  className="h-9 text-xs border-slate-800 bg-[#070A12] text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingConfig}
                  className="h-9 text-xs bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white font-semibold shadow-md shadow-[#78350F]/25 cursor-pointer transition"
                >
                  {savingConfig ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving & Connecting...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 mr-1.5" /> Save & Reconnect Supabase
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <StatCard label="Total listings" value={String(stats.listings)} icon={<Building className="h-4 w-4" />} accent="bg-[#2A1810] border border-[#523018] text-amber-400" />
          <StatCard label="Available now" value={String(stats.available)} icon={<Star className="h-4 w-4" />} accent="bg-emerald-950/60 border border-emerald-800/40 text-emerald-400" />
          <StatCard label="Featured" value={String(stats.featured)} icon={<Star className="h-4 w-4" />} accent="bg-[#2A1810] border border-[#523018] text-amber-300" />
          <StatCard label="Physically verified" value={String(stats.verified)} icon={<Shield className="h-4 w-4" />} accent="bg-[#2A1810] border border-[#523018] text-amber-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <StatCard
            label="Customer complaints"
            value={String(openComplaintsCount)}
            icon={<LifeBuoy className="h-4 w-4" />}
            accent={openComplaintsCount > 0 ? "bg-rose-950/70 border border-rose-800/60 text-rose-400" : "bg-[#2A1810] border border-[#523018] text-amber-400"}
          />
          <StatCard label="Coming soon (orange)" value={String(stats.comingSoon)} icon={<Building className="h-4 w-4" />} accent="bg-amber-950/60 border border-amber-800/40 text-amber-400" />
          <StatCard label="Total annual rent value" value={formatNaira(stats.totalRentValue)} icon={<DollarSign className="h-4 w-4" />} accent="bg-[#2A1810] border border-[#523018] text-amber-400" wide />
        </div>

        {/* Quick actions */}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mt-8 mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ActionCard
            title="Adjust fee caps"
            description="Change success fee, agent cap, tenant service fee, agreement fee, and bounty rates."
            cta="Open fee config"
            icon={<DollarSign className="h-5 w-5" />}
            onClick={() => onNavigate('fees')}
          />
          <ActionCard
            title="Moderate listings"
            description="Review new listings, mark as physically verified, feature, or delist problem properties."
            cta="Go to listings"
            icon={<Building className="h-5 w-5" />}
            onClick={() => onNavigate('listings')}
          />
          <ActionCard
            title="Customer Complaints & Disputes"
            description="Triage illegal agency fees, fake lodges, caution fee deductions, and facility failures reported by tenants."
            cta="Open complaints center"
            icon={<LifeBuoy className="h-5 w-5" />}
            onClick={() => onNavigate('reports')}
          />
        </div>

        {/* Current fee snapshot */}
        {fees && (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mt-8 mb-3">
              Current fee policy snapshot
            </h2>
            <div className="rounded-xl border border-slate-800 overflow-hidden text-sm bg-[#070A12]">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-800">
                <FeeSnap label="Success fee" value={`${fees.successFeePercent}%`} />
                <FeeSnap label="Agent cap" value={`${fees.agentFeeCapPercent}%`} />
                <FeeSnap label="Stamp duty" value={`${fees.stampDutyPercent}%`} />
                <FeeSnap label="Fair Price tol." value={`±${fees.fairPriceTolerancePercent}%`} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-800 border-t border-slate-800">
                <FeeSnap label="Tenant service fee" value={formatNaira(fees.tenantServiceFeeNaira)} />
                <FeeSnap label="Agreement fee" value={formatNaira(fees.agreementFeeNaira)} />
                <FeeSnap label="Featured 7d" value={formatNaira(fees.featuredBoost7DayNaira)} />
                <FeeSnap label="Referral bounty" value={formatNaira(fees.referralBountyNaira)} />
              </div>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  )
}

function StatCard({ label, value, icon, accent, wide }: { label: string; value: string; icon: React.ReactNode; accent: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-[#070A12] p-4 ${wide ? 'lg:col-span-2' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{label}</span>
        <span className={`p-1.5 rounded-lg ${accent}`}>{icon}</span>
      </div>
      <div className="text-2xl font-extrabold text-white">{value}</div>
    </div>
  )
}

function ActionCard({ title, description, cta, icon, onClick }: { title: string; description: string; cta: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#070A12] p-4 flex flex-col justify-between">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#2A1810] border border-[#523018] text-amber-400 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        </div>
      </div>
      <Button size="sm" variant="outline" className="mt-4 self-start border-slate-800 bg-[#090D18] text-slate-200 hover:border-amber-600/60 hover:text-white cursor-pointer" onClick={onClick}>
        {cta}
      </Button>
    </div>
  )
}

function FeeSnap({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className="text-base font-extrabold text-white mt-0.5">{value}</div>
    </div>
  )
}

/* ---------------- Fees ---------------- */

function FeesTab() {
  const [config, setConfig] = useState<FeeConfig>({ ...DEFAULT_FEES })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    setLoading(true)
    try {
      const res = await fetch('/api/fees', { cache: 'no-store' })
      const data = await res.json()
      if (data?.config) {
        setConfig(data.config)
        setDirty(false)
      }
    } catch {
      toast.error('Failed to load fee config')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/fees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }
      const data = await res.json()
      setConfig(data.config)
      setDirty(false)
      toast.success('Fee config saved — applies to all new transactions immediately.')
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function patch<K extends keyof FeeConfig>(key: K, value: FeeConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }))
    setDirty(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading fee configuration...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      <div className="p-6 pb-3 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fee Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">
            All fee caps, rates, and bounties are regulated here. Changes apply to all new transactions immediately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty ? (
            <Badge variant="outline" className="border-amber-400 text-amber-700">Unsaved changes</Badge>
          ) : (
            <Badge variant="outline" className="border-emerald-300 text-emerald-700">All saved</Badge>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="max-w-3xl space-y-6">
          <Section title="Tenant fees" subtitle="Charged per successful tenancy match">
            <FeeField label="Tenant service fee" unit="₦" value={config.tenantServiceFeeNaira} onChange={(v) => patch('tenantServiceFeeNaira', v)} help="Covers escrow + verification + dispute desk" />
            <FeeField label="Agreement + e-sign fee" unit="₦" value={config.agreementFeeNaira} onChange={(v) => patch('agreementFeeNaira', v)} help="Per tenancy agreement. First agreement free per landlord if toggle on." />
            <FeeToggle label="First agreement free per landlord" checked={config.firstAgreementFreePerLandlord} onChange={(v) => patch('firstAgreementFreePerLandlord', v)} />
          </Section>

          <Separator />

          <Section title="Landlord & Agent fees" subtitle="Caps enforced on every listing">
            <FeeField label="Success fee (Mapstar commission)" unit="%" step={0.5} value={config.successFeePercent} onChange={(v) => patch('successFeePercent', v)} help="Percent of annual rent, charged on deposit release" />
            <FeeField label="Agent fee cap (hard ceiling)" unit="%" step={0.5} value={config.agentFeeCapPercent} onChange={(v) => patch('agentFeeCapPercent', v)} help="Maximum any agent can charge via Mapstar — kills excess fees" />
            <FeeField label="Verified agent annual subscription" unit="₦" value={config.verifiedAgentAnnualNaira} onChange={(v) => patch('verifiedAgentAnnualNaira', v)} help="Annual KYC refresh + verified badge" />
            <FeeField label="First-time landlord listing cap" unit="listings" value={config.firstTimeLandlordListingCap} onChange={(v) => patch('firstTimeLandlordListingCap', v)} help="New landlords limited to N listings until first tenancy completes" />
          </Section>

          <Separator />

          <Section title="Government & tax" subtitle="Auto-routed from agreement signing flow">
            <FeeField label="Stamp duty rate (FIRS)" unit="%" step={0.01} value={config.stampDutyPercent} onChange={(v) => patch('stampDutyPercent', v)} help="Federal rate — applied to annual rent" />
          </Section>

          <Separator />

          <Section title="Featured placements & bounties" subtitle="Monetization levers">
            <FeeField label="Featured boost — 7 days" unit="₦" value={config.featuredBoost7DayNaira} onChange={(v) => patch('featuredBoost7DayNaira', v)} help="Pin gets cyan ring + carousel placement" />
            <FeeField label="Featured boost — 14 days" unit="₦" value={config.featuredBoost14DayNaira} onChange={(v) => patch('featuredBoost14DayNaira', v)} help="Better value for landlords in a hurry" />
            <FeeField label="Referral bounty ('Refer a Lodge')" unit="₦" value={config.referralBountyNaira} onChange={(v) => patch('referralBountyNaira', v)} help="Paid when flagged lodge is successfully onboarded" />
          </Section>

          <Separator />

          <Section title="Fair Price engine" subtitle="Computes median rent per area + property type">
            <FeeField label="Fair Price tolerance" unit="%" step={1} value={config.fairPriceTolerancePercent} onChange={(v) => patch('fairPriceTolerancePercent', v)} help="Listings within ±N% of median get the Fair Price badge" />
          </Section>

          {/* Security notice */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
            <Lock className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium mb-0.5">Audit trail</p>
              <p>All fee changes are attributed to your admin account ({process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@mapstar.ng'}) and timestamped. In production, every PATCH is logged to the AdminAction table for compliance.</p>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={loadConfig} disabled={loading}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reload
        </Button>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={save} disabled={saving || !dirty}>
          <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mb-3">{subtitle}</p>}
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function FeeField({ label, value, unit, onChange, step = 1, help }: { label: string; value: number; unit: string; step?: number; onChange: (v: number) => void; help?: string }) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-700">{label}</Label>
      <div className="flex items-center gap-1.5 mt-1">
        {unit === '₦' && <span className="text-sm text-slate-500">₦</span>}
        <Input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} className="h-8 text-sm" />
        {(unit === '%' || unit === 'listings') && <span className="text-xs text-slate-500 w-16">{unit}</span>}
      </div>
      {help && <p className="text-[10px] text-slate-500 mt-1">{help}</p>}
    </div>
  )
}

function FeeToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs font-medium text-slate-700">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/* ---------------- Listings ---------------- */

function ListingsTab() {
  const [filter, setFilter] = useState<string>('all')
  const [listings, setListings] = useState<MockListing[]>(MOCK_LISTINGS)
  const [loading, setLoading] = useState(true)

  const loadListings = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/listings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.listings && d.listings.length > 0) {
          setListings(d.listings)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadListings()
  }, [loadListings])

  async function toggleVerify(id: string) {
    const target = listings.find((l) => l.id === id)
    if (!target) return
    const next = !target.physicallyVerified

    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, physicallyVerified: next } : l))
    )
    toast(next ? 'Marked physically verified' : 'Verification removed', {
      description: target.title,
    })

    try {
      await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, physicallyVerified: next }),
      })
    } catch {
      toast.error('Failed to update listing in database')
      loadListings()
    }
  }

  async function toggleFeatured(id: string) {
    const target = listings.find((l) => l.id === id)
    if (!target) return
    const next = !target.featured

    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, featured: next } : l))
    )
    toast(next ? 'Listing boosted as Featured' : 'Featured boost removed', {
      description: target.title,
    })

    try {
      await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, featured: next }),
      })
    } catch {
      toast.error('Failed to update listing in database')
      loadListings()
    }
  }

  async function delist(id: string) {
    const target = listings.find((l) => l.id === id)
    if (!target) return

    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'DELISTED' as any } : l))
    )
    toast.error('Listing delisted from public view', {
      description: target.title,
    })

    try {
      await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'DELISTED' }),
      })
    } catch {
      toast.error('Failed to delist in database')
      loadListings()
    }
  }

  const filtered = listings.filter((l) => {
    if (filter === 'all') return true
    if (filter === 'featured') return l.featured
    if (filter === 'verified') return l.physicallyVerified
    if (filter === 'coming_soon') return l.comingSoon
    if (filter === 'unverified') return !l.physicallyVerified
    return true
  })

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-900">Listing moderation</h1>
        <p className="text-sm text-slate-500 mt-1">Approve, feature, verify, or delist properties across all cities.</p>

        <div className="flex flex-wrap gap-1 mt-4 mb-4">
          {[
            { id: 'all', label: `All (${listings.length})` },
            { id: 'unverified', label: `Pending verification (${listings.filter((l) => !l.physicallyVerified).length})` },
            { id: 'verified', label: `Verified (${listings.filter((l) => l.physicallyVerified).length})` },
            { id: 'featured', label: `Featured (${listings.filter((l) => l.featured).length})` },
            { id: 'coming_soon', label: `Coming soon (${listings.filter((l) => l.comingSoon).length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === f.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-semibold">Listing</th>
                <th className="px-3 py-2 font-semibold hidden sm:table-cell">Location</th>
                <th className="px-3 py-2 font-semibold text-right">Rent</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Flags</th>
                <th className="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-900 line-clamp-1">{l.title}</div>
                    <div className="text-[10px] text-slate-500">{PROPERTY_TYPE_LABELS[l.propertyType]} · {l.id}</div>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell text-xs text-slate-600">
                    {l.area}, {l.city}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-medium text-slate-900">
                    {formatNaira(l.annualRent)}
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={
                        l.status === 'AVAILABLE' || l.status === 'VERIFIED'
                          ? 'AVAILABLE'
                          : l.status === 'COMING_SOON' || l.status === 'UNDER_INSPECTION'
                          ? 'COMING_SOON'
                          : 'DELISTED'
                      }
                      onChange={async (e) => {
                        const newStatus = e.target.value
                        try {
                          await fetch('/api/admin/listings', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: l.id, status: newStatus }),
                          })
                          toast.success(`Listing status updated to ${newStatus}`)
                          setListings((prev) =>
                            prev.map((item) => (item.id === l.id ? { ...item, status: newStatus as any } : item))
                          )
                        } catch {
                          toast.error('Failed to update status')
                        }
                      }}
                      className="text-xs bg-[#070A12] border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-medium cursor-pointer"
                    >
                      <option value="AVAILABLE">🟢 Available</option>
                      <option value="COMING_SOON">🟠 Coming Soon</option>
                      <option value="DELISTED">🔴 Unavailable</option>
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-0.5">
                      {l.physicallyVerified && <Badge variant="outline" className="h-5 text-[9px] border-red-300 text-red-700 px-1">Verified</Badge>}
                      {l.featured && <Badge variant="outline" className="h-5 text-[9px] border-cyan-300 text-cyan-700 px-1">Featured</Badge>}
                      {l.fairPriceBadge && <Badge variant="outline" className="h-5 text-[9px] border-emerald-300 text-emerald-700 px-1">Fair</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 text-[10px] ${l.physicallyVerified ? 'text-red-600 font-semibold' : 'text-slate-600'}`}
                        title="Toggle physically verified"
                        onClick={() => toggleVerify(l.id)}
                      >
                        <Shield className="h-3 w-3 mr-0.5" />
                        <span className="hidden sm:inline">{l.physicallyVerified ? 'Verified' : 'Verify'}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 text-[10px] ${l.featured ? 'text-cyan-600 font-semibold' : 'text-slate-600'}`}
                        title="Toggle featured"
                        onClick={() => toggleFeatured(l.id)}
                      >
                        <Star className="h-3 w-3 mr-0.5" />
                        <span className="hidden sm:inline">{l.featured ? 'Boosted' : 'Feature'}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px] text-red-600 hover:text-red-700"
                        title="Delist"
                        onClick={() => delist(l.id)}
                      >
                        <Flag className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ScrollArea>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    AVAILABLE: { label: 'Available', cls: 'bg-emerald-100 text-emerald-700' },
    COMING_SOON: { label: 'Coming soon', cls: 'bg-amber-100 text-amber-700' },
    UNDER_INSPECTION: { label: 'Inspection', cls: 'bg-amber-100 text-amber-900' },
    RECENTLY_LET: { label: 'Recently let', cls: 'bg-slate-100 text-slate-600' },
    VERIFIED: { label: 'Verified', cls: 'bg-red-100 text-red-700' },
    DELISTED: { label: 'Delisted', cls: 'bg-red-200 text-red-900' },
  }
  const m = map[status] || map.AVAILABLE
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${m.cls}`}>{m.label}</span>
}

/* ---------------- Users ---------------- */

function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadUsers = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/users', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.users && d.users.length > 0) {
          setUsers(
            d.users.map((u: any) => ({
              id: u.id,
              name: u.fullName || u.email.split('@')[0],
              email: u.email,
              role: u.role || 'TENANT',
              city: u.city || 'Owerri',
              listings: u.listingsCount || 0,
              verified: Boolean(u.ninVerified || u.bvnVerified),
              status: u.status || 'ACTIVE',
            }))
          )
        } else {
          // Default initial set
          setUsers([
            { id: 'u1', name: 'Mrs. Okoro', email: 'okoro@example.com', role: 'LANDLORD', city: 'Owerri', listings: 3, verified: true, status: 'ACTIVE' },
            { id: 'u2', name: 'Mr. Eze', email: 'eze@example.com', role: 'LANDLORD', city: 'Enugu', listings: 2, verified: true, status: 'ACTIVE' },
            { id: 'u3', name: 'Chidinma N.', email: 'chidinma@example.com', role: 'TENANT', city: 'Owerri', listings: 0, verified: true, status: 'ACTIVE' },
            { id: 'u4', name: 'Emeka O.', email: 'emeka@example.com', role: 'TENANT', city: 'Enugu', listings: 0, verified: false, status: 'ACTIVE' },
            { id: 'u5', name: 'Agent Johnson', email: 'johnson@properties.ng', role: 'AGENT', city: 'Owerri', listings: 4, verified: true, status: 'ACTIVE' },
          ])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  async function approveKYC(id: string) {
    const target = users.find((u) => u.id === id)
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          toast.success(`Approved verification for ${u.name}`)
          return { ...u, verified: true }
        }
        return u
      })
    )

    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ninVerified: true, bvnVerified: true }),
      })
    } catch {
      toast.error('Failed to save to database')
      loadUsers()
    }
  }

  function toggleSuspend(id: string) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const next = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
          if (next === 'SUSPENDED') toast.error(`Suspended account ${u.email}`)
          else toast.success(`Reactivated account ${u.email}`)
          return { ...u, status: next }
        }
        return u
      })
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-900">User management</h1>
        <p className="text-sm text-slate-500 mt-1">View and moderate landlords, agents, and tenants.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-5">
          <StatCard label="Total users" value={String(users.length)} icon={<Users className="h-4 w-4" />} accent="bg-slate-100 text-slate-700" />
          <StatCard label="Landlords" value={String(users.filter((u) => u.role === 'LANDLORD').length)} icon={<Building className="h-4 w-4" />} accent="bg-emerald-50 text-emerald-700" />
          <StatCard label="Agents" value={String(users.filter((u) => u.role === 'AGENT').length)} icon={<Shield className="h-4 w-4" />} accent="bg-amber-100 text-amber-900" />
          <StatCard label="Pending KYC" value={String(users.filter((u) => !u.verified).length)} icon={<Flag className="h-4 w-4" />} accent="bg-amber-50 text-amber-700" />
        </div>

        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-semibold">User</th>
                <th className="px-3 py-2 font-semibold">Role</th>
                <th className="px-3 py-2 font-semibold hidden sm:table-cell">City</th>
                <th className="px-3 py-2 font-semibold text-center">Listings</th>
                <th className="px-3 py-2 font-semibold">KYC</th>
                <th className="px-3 py-2 font-semibold hidden sm:table-cell">Status</th>
                <th className="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-900">{u.name}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className={
                      u.role === 'LANDLORD' ? 'border-emerald-300 text-emerald-700' :
                      u.role === 'AGENT' ? 'border-amber-300 text-amber-900' :
                      'border-slate-300 text-slate-700'
                    }>{u.role}</Badge>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell text-xs text-slate-600">{u.city}</td>
                  <td className="px-3 py-2.5 text-center text-sm text-slate-700">{u.listings}</td>
                  <td className="px-3 py-2.5">
                    {u.verified ? (
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-300 text-amber-700">Pending</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${u.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      {!u.verified && (
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] text-emerald-700 hover:text-emerald-800" onClick={() => approveKYC(u.id)}>
                          Approve KYC
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 text-[10px] ${u.status === 'SUSPENDED' ? 'text-emerald-700' : 'text-red-600 hover:text-red-700'}`}
                        onClick={() => toggleSuspend(u.id)}
                      >
                        {u.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ScrollArea>
  )
}

/* ---------------- Reports & Customer Complaints ---------------- */

interface ComplaintTicket {
  ticketId: string
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  category: string
  subject: string
  lodgeName?: string
  accusedPerson?: string
  description: string
  disputedAmount?: number
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'
  createdAt: string
  updatedAt?: string
  resolutionNotes?: string
  dbMessageId?: string
}

const CATEGORY_MAP: Record<string, { label: string; badgeClass: string }> = {
  EXCESS_FEES: { label: 'Illegal Agent Fee (>5%)', badgeClass: 'bg-amber-950/80 border-amber-600/70 text-amber-300' },
  FAKE_LISTING: { label: 'Fake Lodge / Fraud', badgeClass: 'bg-rose-950/80 border-rose-600/70 text-rose-300' },
  CAUTION_FEE: { label: 'Caution Fee Dispute', badgeClass: 'bg-blue-950/80 border-blue-600/70 text-blue-300' },
  FACILITY_FAILURE: { label: 'Facility Breakdown', badgeClass: 'bg-purple-950/80 border-purple-600/70 text-purple-300' },
  AGENT_CONDUCT: { label: 'Agent Conduct / Harassment', badgeClass: 'bg-orange-950/80 border-orange-600/70 text-orange-300' },
  OTHER: { label: 'General Dispute / App Issue', badgeClass: 'bg-slate-900 border-slate-700 text-slate-300' },
}

function ReportsTab({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [complaints, setComplaints] = useState<ComplaintTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Resolution modal state
  const [resolvingTicket, setResolvingTicket] = useState<ComplaintTicket | null>(null)
  const [targetStatus, setTargetStatus] = useState<'INVESTIGATING' | 'RESOLVED' | 'DISMISSED' | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  const fetchComplaints = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      let data: any = null
      const res = await fetch('/api/admin/complaints', { cache: 'no-store' })
      if (res.ok) {
        data = await res.json()
      } else {
        const res2 = await fetch('/api/support', { cache: 'no-store' })
        if (res2.ok) data = await res2.json()
      }

      if (data) {
        const list = data.complaints || data.tickets || []
        setComplaints(list)
        const openCount = list.filter((c: any) => c.status === 'OPEN').length
        onCountChange?.(openCount)
        if (isRefresh) toast.success(`Loaded ${list.length} complaint ticket${list.length === 1 ? '' : 's'}`)
      }
    } catch (err: any) {
      toast.error('Failed to load complaints: ' + (err.message || 'Network error'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [onCountChange])

  useEffect(() => {
    fetchComplaints()
  }, [fetchComplaints])

  async function handleUpdateStatus(ticket: ComplaintTicket, status: 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED', notes?: string) {
    setSubmittingAction(true)
    try {
      let success = false
      let updatedTicket: ComplaintTicket | null = null

      const res = await fetch('/api/admin/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.ticketId, status, resolutionNotes: notes }),
      })

      if (res.ok) {
        const data = await res.json()
        success = data.success
        updatedTicket = data.ticket
      } else {
        const res2 = await fetch('/api/support', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: ticket.ticketId, status, resolutionNotes: notes }),
        })
        if (res2.ok) {
          const data2 = await res2.json()
          success = data2.success
          updatedTicket = data2.ticket
        }
      }

      if (success || updatedTicket) {
        toast.success(`Complaint #${ticket.ticketId} marked as ${status}`)
        setComplaints((prev) =>
          prev.map((c) =>
            c.ticketId === ticket.ticketId
              ? { ...c, status, resolutionNotes: notes || c.resolutionNotes, updatedAt: new Date().toISOString() }
              : c
          )
        )
        const updatedList = complaints.map((c) => c.ticketId === ticket.ticketId ? { ...c, status } : c)
        onCountChange?.(updatedList.filter((c) => c.status === 'OPEN').length)
        setResolvingTicket(null)
        setTargetStatus(null)
        setResolutionNotes('')
      } else {
        toast.error('Could not update status. Please try again.')
      }
    } catch (err: any) {
      toast.error('Failed to update complaint: ' + (err.message || 'Error'))
    } finally {
      setSubmittingAction(false)
    }
  }

  const counts = useMemo(() => {
    return {
      total: complaints.length,
      open: complaints.filter((c) => c.status === 'OPEN').length,
      investigating: complaints.filter((c) => c.status === 'INVESTIGATING').length,
      resolved: complaints.filter((c) => c.status === 'RESOLVED').length,
      dismissed: complaints.filter((c) => c.status === 'DISMISSED').length,
    }
  }, [complaints])

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const match =
          c.ticketId.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.userName.toLowerCase().includes(q) ||
          c.userEmail.toLowerCase().includes(q) ||
          (c.userPhone && c.userPhone.includes(q)) ||
          (c.lodgeName && c.lodgeName.toLowerCase().includes(q)) ||
          (c.accusedPerson && c.accusedPerson.toLowerCase().includes(q))
        if (!match) return false
      }
      return true
    })
  }, [complaints, statusFilter, categoryFilter, searchQuery])

  function getWhatsAppLink(phone?: string, ticketId?: string) {
    if (!phone) return null
    const cleaned = phone.replace(/^0/, '234').replace(/\D/g, '')
    const msg = encodeURIComponent(`Hello, this is Mapstar Customer Service regarding dispute ticket #${ticketId}.`)
    return `https://wa.me/${cleaned}?text=${msg}`
  }

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Customer Complaints & Disputes</h1>
              <Badge variant="outline" className="bg-[#2A1810] border-amber-600/70 text-amber-300 text-xs px-2">
                Live Supabase Feed
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Review and address customer service complaints filed by tenants, landlords, and agents.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchComplaints(true)}
            disabled={refreshing || loading}
            className="h-8 text-xs border-slate-800 bg-[#070A12] text-slate-200 hover:border-amber-600/60 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-amber-400 ${refreshing || loading ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Complaints'}
          </Button>
        </div>

        {/* Stat metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-5">
          <StatCard
            label="Open disputes"
            value={String(counts.open)}
            icon={<AlertTriangle className="h-4 w-4" />}
            accent={counts.open > 0 ? "bg-rose-950/70 border border-rose-800/60 text-rose-400" : "bg-slate-900 text-slate-400"}
          />
          <StatCard
            label="Under investigation"
            value={String(counts.investigating)}
            icon={<Clock className="h-4 w-4" />}
            accent="bg-amber-950/60 border border-amber-800/40 text-amber-400"
          />
          <StatCard
            label="Resolved & enforced"
            value={String(counts.resolved)}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="bg-emerald-950/60 border border-emerald-800/40 text-emerald-400"
          />
          <StatCard
            label="Total tickets"
            value={String(counts.total)}
            icon={<LifeBuoy className="h-4 w-4" />}
            accent="bg-[#2A1810] border border-[#523018] text-amber-300"
          />
        </div>

        {/* Filters and search */}
        <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3.5 mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search ticket #MAP, tenant, lodge name, email, or accused agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-[#090D18] border-slate-800 text-white placeholder:text-slate-500 focus:border-[#78350F]"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-md text-xs bg-[#090D18] border border-slate-800 text-slate-300 focus:border-[#78350F] outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="EXCESS_FEES">Illegal Agent Fees (&gt;5%)</option>
              <option value="FAKE_LISTING">Fake Lodge / Fraud</option>
              <option value="CAUTION_FEE">Caution Fee Dispute</option>
              <option value="FACILITY_FAILURE">Facility Breakdown</option>
              <option value="AGENT_CONDUCT">Agent Conduct</option>
              <option value="OTHER">Other Issues</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#78350F] dark:bg-[#B45309] text-white shadow-sm'
                    : 'bg-[#090D18] border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st.replace('_', ' ')}
                {st === 'OPEN' && counts.open > 0 && (
                  <span className="ml-1.5 bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                    {counts.open}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints list */}
        {loading && complaints.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#070A12] p-12 text-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500 mb-3" />
            <p className="text-sm font-semibold text-white">Loading customer complaints from Supabase...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#070A12] p-12 text-center text-slate-400">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No complaints match your criteria</p>
            <p className="text-xs text-slate-500 mt-1">
              {complaints.length === 0
                ? 'No customer complaints have been filed yet.'
                : 'Try clearing your search query or status filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => {
              const catInfo = CATEGORY_MAP[ticket.category] || CATEGORY_MAP.OTHER
              const waLink = getWhatsAppLink(ticket.userPhone, ticket.ticketId)

              return (
                <div
                  key={ticket.ticketId}
                  className="rounded-2xl border border-slate-800 bg-[#070A12] p-5 shadow-lg transition hover:border-slate-700 space-y-4"
                >
                  {/* Top row */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-[#2A1810] border border-[#523018] px-2 py-0.5 rounded-md">
                        #{ticket.ticketId}
                      </span>
                      <Badge variant="outline" className={`text-xs ${catInfo.badgeClass}`}>
                        {catInfo.label}
                      </Badge>
                      {/* Urgency */}
                      {ticket.urgency === 'CRITICAL' && (
                        <Badge variant="outline" className="bg-red-950/80 border-red-500 text-red-200 text-[10px] gap-1 px-2 py-0.5 animate-pulse">
                          <AlertTriangle className="h-3 w-3 text-red-400" /> CRITICAL
                        </Badge>
                      )}
                      {ticket.urgency === 'HIGH' && (
                        <Badge variant="outline" className="bg-rose-950/80 border-rose-500/70 text-rose-300 text-[10px] gap-1 px-2 py-0.5">
                          <AlertCircle className="h-3 w-3 text-rose-400" /> HIGH
                        </Badge>
                      )}
                      {ticket.urgency === 'MEDIUM' && (
                        <Badge variant="outline" className="bg-amber-950/70 border-amber-600/60 text-amber-300 text-[10px] px-2 py-0.5">
                          MEDIUM
                        </Badge>
                      )}
                      {ticket.urgency === 'LOW' && (
                        <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-400 text-[10px] px-2 py-0.5">
                          LOW
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {ticket.status === 'OPEN' && (
                        <Badge variant="outline" className="bg-rose-950/80 border-rose-600/70 text-rose-300 text-xs font-bold px-2 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 animate-ping" /> OPEN
                        </Badge>
                      )}
                      {ticket.status === 'INVESTIGATING' && (
                        <Badge variant="outline" className="bg-amber-950/80 border-amber-500/70 text-amber-300 text-xs font-bold px-2 py-0.5">
                          <Clock className="h-3 w-3 mr-1 text-amber-400" /> INVESTIGATING
                        </Badge>
                      )}
                      {ticket.status === 'RESOLVED' && (
                        <Badge variant="outline" className="bg-emerald-950/80 border-emerald-500/70 text-emerald-300 text-xs font-bold px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" /> RESOLVED
                        </Badge>
                      )}
                      {ticket.status === 'DISMISSED' && (
                        <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-400 text-xs font-bold px-2 py-0.5">
                          DISMISSED
                        </Badge>
                      )}
                      <span className="text-[11px] text-slate-500">
                        {new Date(ticket.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Subject and narrative */}
                  <div>
                    <h3 className="text-base font-bold text-white">{ticket.subject}</h3>
                    <div className="mt-2 p-3.5 rounded-xl bg-[#090D18] border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {ticket.description}
                    </div>
                  </div>

                  {/* Complainant & Incident Meta Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    {/* Complainant */}
                    <div className="p-2.5 rounded-xl bg-[#090D18] border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Complainant</span>
                      <div className="font-semibold text-white">{ticket.userName}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{ticket.userEmail}</div>
                      {ticket.userPhone && (
                        <div className="text-[11px] text-amber-400 font-mono mt-0.5">{ticket.userPhone}</div>
                      )}
                    </div>

                    {/* Affected Lodge */}
                    <div className="p-2.5 rounded-xl bg-[#090D18] border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lodge / Property</span>
                      <div className="font-semibold text-white">
                        {ticket.lodgeName || <span className="text-slate-500 italic">Not specified</span>}
                      </div>
                    </div>

                    {/* Accused Person */}
                    <div className="p-2.5 rounded-xl bg-[#090D18] border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Accused Landlord / Agent</span>
                      <div className="font-semibold text-white">
                        {ticket.accusedPerson || <span className="text-slate-500 italic">Not specified</span>}
                      </div>
                    </div>

                    {/* Disputed Amount */}
                    <div className="p-2.5 rounded-xl bg-[#090D18] border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Disputed Amount</span>
                      <div className="font-extrabold text-amber-400 text-sm">
                        {ticket.disputedAmount ? formatNaira(ticket.disputedAmount) : 'None reported'}
                      </div>
                    </div>
                  </div>

                  {/* Resolution notes if already resolved / investigating */}
                  {ticket.resolutionNotes && (
                    <div className="p-3 rounded-xl bg-[#2A1810] border border-[#523018] text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                        <span>Admin Resolution Note</span>
                        {ticket.updatedAt && (
                          <span className="text-[10px] text-slate-400 font-normal ml-auto">
                            Updated {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200">{ticket.resolutionNotes}</p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      {waLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-emerald-800/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 hover:text-white"
                          asChild
                        >
                          <a href={waLink} target="_blank" rel="noopener noreferrer">
                            <MessageSquare className="h-3 w-3 mr-1" /> WhatsApp Customer
                          </a>
                        </Button>
                      )}
                      {ticket.userPhone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-slate-800 bg-[#090D18] text-slate-300 hover:text-white"
                          asChild
                        >
                          <a href={`tel:${ticket.userPhone}`}>
                            <Phone className="h-3 w-3 mr-1" /> Call
                          </a>
                        </Button>
                      )}
                      {ticket.userEmail && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-slate-800 bg-[#090D18] text-slate-300 hover:text-white"
                          asChild
                        >
                          <a href={`mailto:${ticket.userEmail}?subject=Mapstar%20Dispute%20Resolution%20Ticket%20%23${ticket.ticketId}`}>
                            <Mail className="h-3 w-3 mr-1" /> Email
                          </a>
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {ticket.status !== 'INVESTIGATING' && ticket.status !== 'RESOLVED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(ticket, 'INVESTIGATING', 'Officer assigned and investigating dispute.')}
                          disabled={submittingAction}
                          className="h-7 text-xs border-amber-600/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 cursor-pointer"
                        >
                          <Clock className="h-3 w-3 mr-1" /> Mark Investigating
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => {
                          setResolvingTicket(ticket)
                          setTargetStatus('RESOLVED')
                          setResolutionNotes(ticket.resolutionNotes || '')
                        }}
                        disabled={submittingAction}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-900/30 cursor-pointer"
                      >
                        <Check className="h-3 w-3 mr-1" /> Enforce Resolution
                      </Button>

                      {ticket.status !== 'DISMISSED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setResolvingTicket(ticket)
                            setTargetStatus('DISMISSED')
                            setResolutionNotes('')
                          }}
                          disabled={submittingAction}
                          className="h-7 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                        >
                          <X className="h-3 w-3 mr-1" /> Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Resolution Dialog Modal */}
        <Dialog open={Boolean(resolvingTicket)} onOpenChange={(open) => { if (!open) setResolvingTicket(null) }}>
          <DialogContent className="max-w-lg bg-[#090D18] border border-slate-800 text-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                {targetStatus === 'RESOLVED' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    Enforce Resolution for #{resolvingTicket?.ticketId}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                    Dismiss Complaint #{resolvingTicket?.ticketId}
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {targetStatus === 'RESOLVED'
                  ? 'Record dispute settlement, excess fee refund confirmation, or disciplinary action against landlord/agent.'
                  : 'Specify reason for dismissal (e.g. non-violating tenancy dispute or unsubstantiated claim).'}
              </DialogDescription>
            </DialogHeader>

            {resolvingTicket && (
              <div className="space-y-4 pt-2">
                <div className="p-3 rounded-xl bg-[#070A12] border border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-white">{resolvingTicket.subject}</div>
                  <div className="text-slate-400">
                    Complainant: <span className="text-slate-200">{resolvingTicket.userName}</span>
                    {resolvingTicket.lodgeName && <> · Lodge: <span className="text-slate-200">{resolvingTicket.lodgeName}</span></>}
                    {resolvingTicket.disputedAmount ? <> · Disputed: <span className="text-amber-400 font-bold">{formatNaira(resolvingTicket.disputedAmount)}</span></> : null}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="resolution-notes" className="text-xs font-semibold text-slate-300">
                    {targetStatus === 'RESOLVED' ? 'Resolution & Enforcement Notes (visible to customer):' : 'Dismissal Explanation:'}
                  </Label>
                  <textarea
                    id="resolution-notes"
                    rows={3}
                    placeholder={
                      targetStatus === 'RESOLVED'
                        ? 'e.g., Landlord agreed to refund excess agency fee of ₦38,888 within 24 hours. Formal warning issued for breach of 5% fee cap.'
                        : 'e.g., Reviewed documentation; charges complied with lease terms agreed before inspection.'
                    }
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#070A12] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-[#78350F] focus:outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResolvingTicket(null)}
                    className="h-8 text-xs border-slate-800 bg-[#070A12] text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={submittingAction}
                    onClick={() => {
                      if (resolvingTicket && targetStatus) {
                        handleUpdateStatus(resolvingTicket, targetStatus, resolutionNotes.trim() || undefined)
                      }
                    }}
                    className={`h-8 text-xs font-semibold text-white shadow-md ${
                      targetStatus === 'RESOLVED'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
                    }`}
                  >
                    {submittingAction ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Submitting...
                      </>
                    ) : targetStatus === 'RESOLVED' ? (
                      <>
                        <Check className="h-3 w-3 mr-1.5" /> Enforce & Close
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1.5" /> Dismiss Complaint
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}

/* ---------------- Analytics ---------------- */

function AnalyticsTab() {
  const cityStats = ['Owerri', 'Enugu'].map((city) => {
    const list = MOCK_LISTINGS.filter((l) => l.city === city)
    return {
      city,
      total: list.length,
      avgRent: list.length ? Math.round(list.reduce((s, l) => s + l.annualRent, 0) / list.length) : 0,
      verified: list.filter((l) => l.physicallyVerified).length,
      featured: list.filter((l) => l.featured).length,
    }
  })

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Platform performance and city-by-city breakdown.</p>

        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mt-6 mb-3">City performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {cityStats.map((c) => (
            <div key={c.city} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">{c.city}</h3>
                <Badge variant="outline">{c.total} listings</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-slate-900">{formatNaira(c.avgRent)}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Avg rent</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{c.verified}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Verified</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-cyan-600">{c.featured}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Featured</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mt-8 mb-3">Property type distribution</h2>
        <div className="rounded-lg border border-slate-200 p-4">
          {Object.entries(PROPERTY_TYPE_LABELS).map(([type, label]) => {
            const count = MOCK_LISTINGS.filter((l) => l.propertyType === type).length
            const pct = Math.round((count / MOCK_LISTINGS.length) * 100)
            return (
              <div key={type} className="flex items-center gap-3 py-1.5">
                <div className="w-32 text-xs text-slate-700">{label}</div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="w-12 text-right text-xs text-slate-600">{count}</div>
              </div>
            )
          })}
        </div>

        <p className="text-[10px] text-slate-500 mt-4">
          In production, this view queries the Supabase analytics tables (Listings, Transactions, Agreements) with date-range filters and CSV export.
        </p>
      </div>
    </ScrollArea>
  )
}


/* ---------------- Group Appeals Tab ---------------- */

interface GroupAppealItem {
  appealId: string
  channelId: string
  channelName: string
  channelType: 'group' | 'channel'
  ownerId: string
  ownerName: string
  ownerEmail: string
  ownerPhone?: string
  sanctionType: 'SUSPENDED' | 'BANNED' | 'DELETED'
  sanctionReason: string
  explanation: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes?: string
  resolvedAt?: string
  resolvedBy?: string
  createdAt: string
}

function AppealsTab({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [appeals, setAppeals] = useState<GroupAppealItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAppeal, setSelectedAppeal] = useState<GroupAppealItem | null>(null)
  const [resolvingAction, setResolvingAction] = useState<'APPROVE' | 'REJECT' | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchAppeals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/chat?action=appeals')
      if (res.ok) {
        const data = await res.json()
        const list = data.appeals || []
        setAppeals(list)
        if (onCountChange) {
          const pending = list.filter((a: any) => a.status === 'PENDING').length
          onCountChange(pending)
        }
      }
    } catch {
      toast.error('Failed to load appeals')
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    fetchAppeals()
  }, [fetchAppeals])

  async function handleResolveAppeal(decision: 'APPROVE' | 'REJECT') {
    if (!selectedAppeal) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve-appeal',
          appealId: selectedAppeal.appealId,
          channelId: selectedAppeal.channelId,
          decision,
          adminNotes: resolutionNotes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(decision === 'APPROVE' ? `Appeal approved: ${selectedAppeal.channelName} reinstated to Active!` : 'Appeal rejected.')
        setResolvingAction(null)
        setSelectedAppeal(null)
        setResolutionNotes('')
        fetchAppeals()
      } else {
        toast.error(data.error || 'Failed to resolve appeal')
      }
    } catch (err: any) {
      toast.error('Error resolving appeal: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAppeals = appeals.filter((a) => {
    if (filter !== 'ALL' && a.status !== filter) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      a.channelName.toLowerCase().includes(q) ||
      a.ownerName.toLowerCase().includes(q) ||
      a.ownerEmail.toLowerCase().includes(q) ||
      (a.ownerPhone && a.ownerPhone.includes(q)) ||
      a.explanation.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-500" />
            Group & Channel Sanction Appeals
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review appeals filed by group and broadcast channel owners whose channels were banned or suspended.
          </p>
        </div>
        <Button
          size="sm"
          onClick={fetchAppeals}
          disabled={loading}
          className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0D1322] border border-slate-800 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Appeals</span>
          <div className="text-lg font-bold text-slate-100 mt-0.5">{appeals.length}</div>
        </div>
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-400">Pending Review</span>
          <div className="text-lg font-bold text-amber-300 mt-0.5">
            {appeals.filter((a) => a.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Approved & Reinstated</span>
          <div className="text-lg font-bold text-emerald-300 mt-0.5">
            {appeals.filter((a) => a.status === 'APPROVED').length}
          </div>
        </div>
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-rose-400">Rejected</span>
          <div className="text-lg font-bold text-rose-300 mt-0.5">
            {appeals.filter((a) => a.status === 'REJECTED').length}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0D1322] border border-slate-800 rounded-xl p-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by group name, owner, phone, or statement..."
            className="pl-8 h-8 text-xs bg-[#090D18] border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg w-full"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filter === st
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#090D18] border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Appeals List */}
      <div className="space-y-3">
        {filteredAppeals.map((appeal) => {
          const isPending = appeal.status === 'PENDING'
          return (
            <div
              key={appeal.appealId}
              className="bg-[#0D1322] border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">#{appeal.appealId}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    appeal.status === 'APPROVED'
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                      : appeal.status === 'REJECTED'
                      ? 'bg-rose-950 border border-rose-800 text-rose-300'
                      : 'bg-amber-950 border border-amber-800 text-amber-300 animate-pulse'
                  }`}>
                    {appeal.status}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    {appeal.sanctionType}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Filed on {new Date(appeal.createdAt).toLocaleDateString()} at{' '}
                  {new Date(appeal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Sanctioned Group:</span>
                  <div className="font-bold text-slate-100 text-sm">{appeal.channelName}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">ID: {appeal.channelId}</div>
                  <div className="text-[11px] text-rose-400 mt-1">
                    Sanction Reason: <span className="font-semibold text-rose-300">{appeal.sanctionReason}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Appellant (Group Owner):</span>
                  <div className="font-semibold text-slate-200">{appeal.ownerName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{appeal.ownerEmail}</div>
                  {appeal.ownerPhone && (
                    <div className="text-[11px] font-mono text-amber-400 mt-0.5">{appeal.ownerPhone}</div>
                  )}
                </div>
              </div>

              {/* Statement */}
              <div className="bg-[#090D18] border border-slate-800 rounded-lg p-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                <span className="font-bold text-slate-200 block mb-1">Owner Appeal Statement:</span>
                {appeal.explanation}
              </div>

              {/* Admin notes if resolved */}
              {appeal.adminNotes && (
                <div className={`p-2.5 rounded-lg border text-xs ${
                  appeal.status === 'APPROVED'
                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                }`}>
                  <span className="font-bold block mb-0.5">Resolution Notes ({appeal.resolvedBy || 'Admin'}):</span>
                  {appeal.adminNotes}
                </div>
              )}

              {/* Action Buttons */}
              {isPending && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedAppeal(appeal)
                      setResolvingAction('REJECT')
                      setResolutionNotes('')
                    }}
                    className="h-8 bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-rose-200 text-xs font-semibold cursor-pointer"
                  >
                    Reject Appeal
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedAppeal(appeal)
                      setResolvingAction('APPROVE')
                      setResolutionNotes('')
                    }}
                    className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve & Reinstate Group
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        {filteredAppeals.length === 0 && !loading && (
          <div className="bg-[#0D1322] border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-200">No Appeals Found</p>
            <p className="text-xs text-slate-400 mt-1">There are no sanction appeals matching the current filter.</p>
          </div>
        )}
      </div>

      {/* Resolution Confirmation Modal */}
      {selectedAppeal && resolvingAction && (
        <Dialog open={Boolean(selectedAppeal)} onOpenChange={() => { setSelectedAppeal(null); setResolvingAction(null) }}>
          <DialogContent className="max-w-md bg-[#0D1322] border-slate-800 text-slate-100 rounded-2xl p-5 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                {resolvingAction === 'APPROVE' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Approve Appeal & Reinstate &apos;{selectedAppeal.channelName}&apos;</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-rose-500" />
                    <span>Reject Appeal for &apos;{selectedAppeal.channelName}&apos;</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {resolvingAction === 'APPROVE'
                  ? 'This will immediately restore the group to Active status and notify the owner.'
                  : 'This will uphold the ban/suspension and record the justification.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 mt-2 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Resolution Notes (Visible to Group Owner):
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={
                    resolvingAction === 'APPROVE'
                      ? 'e.g. Corrective steps verified. Group reinstated with standard monitoring.'
                      : 'e.g. Tenancy fee violations confirmed. Ban upheld.'
                  }
                  className="w-full p-2.5 rounded-xl bg-[#090D18] border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedAppeal(null); setResolvingAction(null) }}
                  className="h-8 text-xs border-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={submitting}
                  onClick={() => handleResolveAppeal(resolvingAction)}
                  className={`h-8 text-xs font-bold text-white shadow-sm cursor-pointer ${
                    resolvingAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {submitting ? 'Processing…' : resolvingAction === 'APPROVE' ? 'Confirm Reinstatement' : 'Confirm Rejection'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

/* ---------------- Omni-Chat Surveillance Vault Tab ---------------- */

interface ThreadItem {
  channelId: string
  type: 'world' | 'dm' | 'group' | 'channel'
  title: string
  subtitle: string
  status: string
  messageCount: number
  lastMessage: string
  lastSenderName: string
  lastTime: string
}

function OmniChatVaultTab() {
  const [threads, setThreads] = useState<ThreadItem[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | 'dm' | 'group' | 'channel' | 'world'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedThread, setSelectedThread] = useState<ThreadItem | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [purging, setPurging] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modModalOpen, setModModalOpen] = useState(false)
  const [modStatus, setModStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED'>('SUSPENDED')
  const [modReason, setModReason] = useState('')
  const [moderating, setModerating] = useState(false)

  const fetchThreads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/chat?action=all-threads')
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads || [])
        setMetrics(data.metrics || null)
        if (!selectedThread && data.threads?.length > 0) {
          setSelectedThread(data.threads[0])
        }
      }
    } catch {
      toast.error('Failed to load chat surveillance feed')
    } finally {
      setLoading(false)
    }
  }, [selectedThread])

  useEffect(() => {
    fetchThreads()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMessages = useCallback(async (channelId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/chat?channelId=${encodeURIComponent(channelId)}&limit=200`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch {
      toast.error('Failed to load thread messages')
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (selectedThread?.channelId) {
      fetchMessages(selectedThread.channelId)
    }
  }, [selectedThread, fetchMessages])

  async function handleDeleteMessage(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/chat?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Message deleted')
        setMessages((prev) => prev.filter((m) => m.id !== id))
        fetchThreads()
      } else {
        toast.error('Failed to delete message')
      }
    } catch {
      toast.error('Error deleting message')
    } finally {
      setDeletingId(null)
    }
  }

  async function handlePurgeThread() {
    if (!selectedThread) return
    if (!confirm(`Are you sure you want to permanently clear all messages in "${selectedThread.title}" to save database storage?`)) return
    setPurging(true)
    try {
      const res = await fetch(`/api/chat?channelId=${encodeURIComponent(selectedThread.channelId)}&purge=true`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Thread text purged successfully')
        setMessages([])
        fetchThreads()
      } else {
        toast.error(data.error || 'Failed to purge thread')
      }
    } catch {
      toast.error('Error purging thread')
    } finally {
      setPurging(false)
    }
  }

  async function handleModerateChannel() {
    if (!selectedThread) return
    setModerating(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'moderate-channel',
          channelId: selectedThread.channelId,
          status: modStatus,
          reason: modReason.trim() || 'Trust & Safety enforcement',
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Group updated to ${modStatus}`)
        setModModalOpen(false)
        setSelectedThread((prev) => prev ? { ...prev, status: modStatus } : null)
        fetchThreads()
      } else {
        toast.error(data.error || 'Failed to moderate channel')
      }
    } catch (err: any) {
      toast.error('Error moderating channel: ' + err.message)
    } finally {
      setModerating(false)
    }
  }

  const filteredThreads = threads.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return t.title.toLowerCase().includes(q) || t.channelId.toLowerCase().includes(q) || t.lastMessage.toLowerCase().includes(q)
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            Omni-Chat Surveillance & Vault
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time administrative watchtower over all platform DMs, community groups, channels, and forum chats.
          </p>
        </div>
        <Button
          size="sm"
          onClick={fetchThreads}
          disabled={loading}
          className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Watchtower</span>
        </Button>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#0D1322] border border-slate-800 rounded-xl p-3 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Messages</span>
            <div className="text-lg font-bold text-slate-100 mt-0.5">{metrics.totalMessages}</div>
          </div>
          <div className="bg-[#0D1322] border border-slate-800 rounded-xl p-3 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Threads</span>
            <div className="text-lg font-bold text-slate-100 mt-0.5">{metrics.totalThreads}</div>
          </div>
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-amber-400">Direct Messages</span>
            <div className="text-lg font-bold text-amber-300 mt-0.5">{metrics.totalDMs}</div>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Community Groups</span>
            <div className="text-lg font-bold text-emerald-300 mt-0.5">{metrics.totalGroups}</div>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-xl p-3 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-cyan-400">Broadcast Channels</span>
            <div className="text-lg font-bold text-cyan-300 mt-0.5">{metrics.totalChannels}</div>
          </div>
        </div>
      )}

      {/* Split Surveillance Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[650px] min-h-0">
        {/* Left Column: Thread Browser (4 cols) */}
        <div className="lg:col-span-4 flex flex-col bg-[#0D1322] border border-slate-800 rounded-2xl overflow-hidden min-h-0">
          <div className="p-3 border-b border-slate-800/80 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads, names, or IDs..."
                className="pl-8 h-8 text-xs bg-[#090D18] border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg w-full"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'dm', label: 'DMs' },
                { id: 'group', label: 'Groups' },
                { id: 'channel', label: 'Channels' },
                { id: 'world', label: 'World' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id as any)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                    typeFilter === tab.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#090D18] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1.5 space-y-1">
            {filteredThreads.map((thread) => {
              const isSelected = selectedThread?.channelId === thread.channelId
              return (
                <div
                  key={thread.channelId}
                  onClick={() => setSelectedThread(thread)}
                  className={`p-2.5 rounded-xl transition cursor-pointer flex flex-col gap-1 ${
                    isSelected ? 'bg-slate-800/80 border border-amber-600/60 shadow-sm' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-xs text-slate-200 truncate">{thread.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 shrink-0">
                      {thread.messageCount} msgs
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="capitalize text-slate-500 font-semibold">{thread.type}</span>
                    <span>·</span>
                    <span className="truncate">{thread.subtitle}</span>
                    {thread.status !== 'ACTIVE' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950 text-rose-300 ml-auto shrink-0">
                        {thread.status}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5">
                    &quot;{thread.lastMessage}&quot;
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Live Message Transcript & Actions (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-[#0D1322] border border-slate-800 rounded-2xl overflow-hidden min-h-0">
          {selectedThread ? (
            <>
              {/* Thread Context Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-[#090D18]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-100 truncate">{selectedThread.title}</h2>
                    {selectedThread.status !== 'ACTIVE' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 border border-rose-800 text-rose-300">
                        {selectedThread.status}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                    ID: {selectedThread.channelId} · {messages.length} messages loaded
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Channel Moderation for Groups/Channels */}
                  {(selectedThread.type === 'group' || selectedThread.type === 'channel') && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setModStatus(selectedThread.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
                        setModReason('')
                        setModModalOpen(true)
                      }}
                      className="h-7 px-2.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <ShieldAlert className="h-3 w-3 text-rose-400" />
                      <span>Moderate</span>
                    </Button>
                  )}

                  {/* Purge thread text button */}
                  <Button
                    size="sm"
                    onClick={handlePurgeThread}
                    disabled={purging || messages.length === 0}
                    className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1"
                    title="Clear text in this thread to save database storage"
                  >
                    <Trash2 className="h-3 w-3 text-slate-400" />
                    <span>Purge Text</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fetchMessages(selectedThread.channelId)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Message Transcript Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#080C16]">
                {loadingMessages && messages.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-500">Loading transcript…</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-500">No messages in this thread.</div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-[#0D1322] border border-slate-800/80 space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{m.senderName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-800 text-slate-400">
                            {m.senderRole}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteMessage(m.id)}
                          disabled={deletingId === m.id}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 p-1 transition cursor-pointer text-[10px] flex items-center gap-1"
                          title="Delete message from database"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              Select a thread from the left to view surveillance transcript.
            </div>
          )}
        </div>
      </div>

      {/* Moderation Modal for Omni-Chat Vault */}
      {modModalOpen && selectedThread && (
        <Dialog open={modModalOpen} onOpenChange={setModModalOpen}>
          <DialogContent className="max-w-md bg-[#0D1322] border-slate-800 text-slate-100 rounded-2xl p-5 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                <span>Moderate Channel: {selectedThread.title}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Suspend, ban, or reinstate this group or channel across Mapstar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 mt-2 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Action to Apply:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ACTIVE', label: 'Reinstate (Active)' },
                    { id: 'SUSPENDED', label: 'Suspend Group' },
                    { id: 'BANNED', label: 'Ban Group' },
                    { id: 'DELETED', label: 'Delete Group' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setModStatus(act.id as any)}
                      className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer text-left ${
                        modStatus === act.id
                          ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                          : 'bg-[#090D18] border-slate-800 text-slate-400'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Reason for Action (Visible to Group Members & Owner):
                </label>
                <textarea
                  rows={3}
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  placeholder="e.g. Tenancy fee violations, unverified lodge listings, hate speech, or scam solicitation."
                  className="w-full p-2.5 rounded-xl bg-[#090D18] border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModModalOpen(false)}
                  className="h-8 text-xs border-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={moderating}
                  onClick={handleModerateChannel}
                  className={`h-8 font-bold text-white text-xs rounded-xl shadow-xs cursor-pointer ${
                    modStatus === 'ACTIVE'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {moderating ? 'Saving…' : `Confirm ${modStatus}`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

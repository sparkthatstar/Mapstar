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
} from 'lucide-react'
import { DEFAULT_FEES, FeeConfig } from '@/lib/fees'
import { MockListing, formatNaira, PROPERTY_TYPE_LABELS } from '@/lib/mock-data'
import { MOCK_LISTINGS } from '@/lib/mock-data'

type Tab = 'overview' | 'fees' | 'listings' | 'users' | 'reports' | 'analytics'

interface AdminDashboardProps {
  adminEmail: string
}

export default function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('overview')

  function logout() {
    fetch('/api/admin/logout', { method: 'POST' }).then(() => {
      window.location.href = '/admin'
    })
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-slate-900 text-white shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">Mapstar Admin</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Control panel</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300">
              <Lock className="h-3 w-3" />
              <span>{adminEmail}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              asChild
            >
              <a href="/" target="_blank">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View site
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-700 bg-slate-800 text-slate-200 hover:bg-red-900 hover:border-red-700 hover:text-white"
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
              { id: 'reports', label: 'Reports Queue', icon: Flag },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map((item) => {
              const Icon = item.icon
              const active = tab === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setTab(item.id as Tab)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
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
            { id: 'reports', label: 'Reports' },
            { id: 'analytics', label: 'Analytics' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                tab === item.id ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main panel */}
        <main className="flex-1 min-w-0 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
          {tab === 'overview' && <OverviewTab onNavigate={setTab} />}
          {tab === 'fees' && <FeesTab />}
          {tab === 'listings' && <ListingsTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'reports' && <ReportsTab />}
          {tab === 'analytics' && <AnalyticsTab />}
        </main>
      </div>
    </div>
  )
}

/* ---------------- Overview ---------------- */

function OverviewTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const stats = useMemo(() => ({
    listings: MOCK_LISTINGS.length,
    available: MOCK_LISTINGS.filter((l) => l.status === 'AVAILABLE' || l.status === 'VERIFIED').length,
    comingSoon: MOCK_LISTINGS.filter((l) => l.status === 'COMING_SOON').length,
    featured: MOCK_LISTINGS.filter((l) => l.featured).length,
    verified: MOCK_LISTINGS.filter((l) => l.physicallyVerified).length,
    totalRentValue: MOCK_LISTINGS.reduce((s, l) => s + l.annualRent, 0),
  }), [])

  const [fees, setFees] = useState<FeeConfig | null>(null)

  useEffect(() => {
    fetch('/api/fees', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setFees(d.config))
      .catch(() => {})
  }, [])

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-900">Welcome back, Admin</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor and control every aspect of Mapstar from this panel.
        </p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <StatCard label="Total listings" value={String(stats.listings)} icon={<Building className="h-4 w-4" />} accent="bg-emerald-50 text-emerald-700" />
          <StatCard label="Available now" value={String(stats.available)} icon={<Star className="h-4 w-4" />} accent="bg-blue-50 text-blue-700" />
          <StatCard label="Featured" value={String(stats.featured)} icon={<Star className="h-4 w-4" />} accent="bg-cyan-50 text-cyan-700" />
          <StatCard label="Physically verified" value={String(stats.verified)} icon={<Shield className="h-4 w-4" />} accent="bg-red-50 text-red-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
          <StatCard label="Coming soon (orange)" value={String(stats.comingSoon)} icon={<Building className="h-4 w-4" />} accent="bg-amber-50 text-amber-700" />
          <StatCard label="Total annual rent value" value={formatNaira(stats.totalRentValue)} icon={<DollarSign className="h-4 w-4" />} accent="bg-emerald-50 text-emerald-700" wide />
        </div>

        {/* Quick actions */}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mt-8 mb-3">
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
            title="Reports queue"
            description="Triage community reports of fake listings, scam landlords, or duplicate properties."
            cta="View reports"
            icon={<Flag className="h-5 w-5" />}
            onClick={() => onNavigate('reports')}
          />
        </div>

        {/* Current fee snapshot */}
        {fees && (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mt-8 mb-3">
              Current fee policy snapshot
            </h2>
            <div className="rounded-lg border border-slate-200 overflow-hidden text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-200">
                <FeeSnap label="Success fee" value={`${fees.successFeePercent}%`} />
                <FeeSnap label="Agent cap" value={`${fees.agentFeeCapPercent}%`} />
                <FeeSnap label="Stamp duty" value={`${fees.stampDutyPercent}%`} />
                <FeeSnap label="Fair Price tol." value={`±${fees.fairPriceTolerancePercent}%`} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-200 border-t border-slate-200">
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
    <div className={`rounded-lg border border-slate-200 p-4 ${wide ? 'lg:col-span-2' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</span>
        <span className={`p-1.5 rounded-md ${accent}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  )
}

function ActionCard({ title, description, cta, icon, onClick }: { title: string; description: string; cta: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 flex flex-col">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-emerald-50 text-emerald-700">{icon}</div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1 flex-1">{description}</p>
        </div>
      </div>
      <Button size="sm" variant="outline" className="mt-3 self-start" onClick={onClick}>
        {cta}
      </Button>
    </div>
  )
}

function FeeSnap({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
      <div className="text-base font-bold text-slate-900 mt-0.5">{value}</div>
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

  const filtered = MOCK_LISTINGS.filter((l) => {
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
            { id: 'all', label: `All (${MOCK_LISTINGS.length})` },
            { id: 'unverified', label: `Pending verification (${MOCK_LISTINGS.filter((l) => !l.physicallyVerified).length})` },
            { id: 'verified', label: `Verified (${MOCK_LISTINGS.filter((l) => l.physicallyVerified).length})` },
            { id: 'featured', label: `Featured (${MOCK_LISTINGS.filter((l) => l.featured).length})` },
            { id: 'coming_soon', label: `Coming soon (${MOCK_LISTINGS.filter((l) => l.comingSoon).length})` },
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
                    <StatusPill status={l.status} />
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
                      <Button size="sm" variant="ghost" className="h-7 text-[10px]" title="Mark physically verified">
                        <Shield className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px]" title="Toggle featured">
                        <Star className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-600 hover:text-red-700" title="Delist">
                        <Flag className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-slate-500 mt-3">
          Action buttons are wired to UI only in this sandbox. In production they call <code className="bg-slate-100 px-1 rounded">PATCH /api/admin/listings/[id]</code> with audit logging.
        </p>
      </div>
    </ScrollArea>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    AVAILABLE: { label: 'Available', cls: 'bg-emerald-100 text-emerald-700' },
    COMING_SOON: { label: 'Coming soon', cls: 'bg-amber-100 text-amber-700' },
    UNDER_INSPECTION: { label: 'Inspection', cls: 'bg-blue-100 text-blue-700' },
    RECENTLY_LET: { label: 'Recently let', cls: 'bg-slate-100 text-slate-600' },
    VERIFIED: { label: 'Verified', cls: 'bg-red-100 text-red-700' },
  }
  const m = map[status] || map.AVAILABLE
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${m.cls}`}>{m.label}</span>
}

/* ---------------- Users ---------------- */

function UsersTab() {
  const mockUsers = [
    { id: 'u1', name: 'Mrs. Okoro', email: 'okoro@example.com', role: 'LANDLORD', city: 'Owerri', listings: 3, verified: true, joined: '2 weeks ago' },
    { id: 'u2', name: 'Mr. Eze', email: 'eze@example.com', role: 'LANDLORD', city: 'Enugu', listings: 2, verified: true, joined: '1 month ago' },
    { id: 'u3', name: 'Chidinma N.', email: 'chidinma@example.com', role: 'TENANT', city: 'Owerri', listings: 0, verified: true, joined: '3 days ago' },
    { id: 'u4', name: 'Emeka O.', email: 'emeka@example.com', role: 'TENANT', city: 'Enugu', listings: 0, verified: true, joined: '5 days ago' },
    { id: 'u5', name: 'Agent Johnson', email: 'johnson@properties.ng', role: 'AGENT', city: 'Owerri', listings: 4, verified: true, joined: '1 week ago' },
    { id: 'u6', name: 'Agent Blessing', email: 'blessing@homes.ng', role: 'AGENT', city: 'Enugu', listings: 3, verified: false, joined: '2 days ago' },
    { id: 'u7', name: 'Unknown', email: 'suspicious@temp.com', role: 'LANDLORD', city: 'Owerri', listings: 1, verified: false, joined: '1 hour ago' },
  ]

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-900">User management</h1>
        <p className="text-sm text-slate-500 mt-1">View and moderate landlords, agents, and tenants.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-5">
          <StatCard label="Total users" value={String(mockUsers.length)} icon={<Users className="h-4 w-4" />} accent="bg-slate-100 text-slate-700" />
          <StatCard label="Landlords" value={String(mockUsers.filter((u) => u.role === 'LANDLORD').length)} icon={<Building className="h-4 w-4" />} accent="bg-emerald-50 text-emerald-700" />
          <StatCard label="Agents" value={String(mockUsers.filter((u) => u.role === 'AGENT').length)} icon={<Shield className="h-4 w-4" />} accent="bg-blue-50 text-blue-700" />
          <StatCard label="Pending KYC" value={String(mockUsers.filter((u) => !u.verified).length)} icon={<Flag className="h-4 w-4" />} accent="bg-amber-50 text-amber-700" />
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
                <th className="px-3 py-2 font-semibold hidden sm:table-cell">Joined</th>
                <th className="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-900">{u.name}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className={
                      u.role === 'LANDLORD' ? 'border-emerald-300 text-emerald-700' :
                      u.role === 'AGENT' ? 'border-blue-300 text-blue-700' :
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
                  <td className="px-3 py-2.5 hidden sm:table-cell text-xs text-slate-500">{u.joined}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Button size="sm" variant="ghost" className="h-7 text-[10px]">View</Button>
                    {u.role === 'LANDLORD' && !u.verified && (
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] text-emerald-700">Approve KYC</Button>
                    )}
                    {u.role === 'AGENT' && !u.verified && (
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] text-emerald-700">Approve</Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-600">Suspend</Button>
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

/* ---------------- Reports ---------------- */

function ReportsTab() {
  const reports = [
    { id: 'r1', property: 'Self-con near IMSU main gate', reason: 'Fake photos — actual lodge is much smaller', reporter: 'Chidinma N.', status: 'OPEN', createdAt: '2 hours ago' },
    { id: 'r2', property: '2-Bedroom flat in Independence Layout', reason: 'Landlord asked for inspection fee outside app', reporter: 'Emeka O.', status: 'OPEN', createdAt: '5 hours ago' },
    { id: 'r3', property: 'Room & parlour near Relief Market', reason: 'Listed twice by different agents', reporter: 'Anonymous', status: 'UNDER_REVIEW', createdAt: '1 day ago' },
    { id: 'r4', property: '3-Bedroom flat in Aladinma', reason: 'Price changed after inspection', reporter: 'Anonymous', status: 'RESOLVED', createdAt: '3 days ago' },
  ]

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-900">Reports queue</h1>
        <p className="text-sm text-slate-500 mt-1">Community reports of fake listings, scam landlords, or duplicate properties.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-5">
          <StatCard label="Open" value={String(reports.filter((r) => r.status === 'OPEN').length)} icon={<Flag className="h-4 w-4" />} accent="bg-red-50 text-red-700" />
          <StatCard label="Under review" value={String(reports.filter((r) => r.status === 'UNDER_REVIEW').length)} icon={<Flag className="h-4 w-4" />} accent="bg-amber-50 text-amber-700" />
          <StatCard label="Resolved" value={String(reports.filter((r) => r.status === 'RESOLVED').length)} icon={<Flag className="h-4 w-4" />} accent="bg-emerald-50 text-emerald-700" />
          <StatCard label="SLA breach (<24h)" value="0" icon={<Flag className="h-4 w-4" />} accent="bg-emerald-50 text-emerald-700" />
        </div>

        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-slate-200 p-4 flex items-start gap-3">
              <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                r.status === 'OPEN' ? 'bg-red-500' : r.status === 'UNDER_REVIEW' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-900">{r.property}</h3>
                  <Badge variant="outline" className={
                    r.status === 'OPEN' ? 'border-red-300 text-red-700' :
                    r.status === 'UNDER_REVIEW' ? 'border-amber-300 text-amber-700' :
                    'border-emerald-300 text-emerald-700'
                  }>{r.status.replace('_', ' ')}</Badge>
                  <span className="text-[10px] text-slate-500">{r.createdAt}</span>
                </div>
                <p className="text-sm text-slate-700 mt-1">{r.reason}</p>
                <p className="text-[10px] text-slate-500 mt-1">Reported by: {r.reporter}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {r.status !== 'RESOLVED' && (
                  <>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]">Investigate</Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] text-red-600 hover:text-red-700">Delist</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] text-slate-500">Dismiss</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
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

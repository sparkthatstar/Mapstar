'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Star,
  Users,
  Database,
  Trash2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Building,
  Plus,
  X,
  Lock,
  Activity,
  Clock,
  Sparkles,
  Check,
  ExternalLink,
  ChevronRight,
  Flame,
  UserX,
  Server,
  Zap,
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { AuthedUser } from '@/components/mapstar/login-signup-dialog'
import { MockListing, formatNaira } from '@/lib/mock-data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface StarPowerViewProps {
  user: AuthedUser | null
  onOpenListingDetail?: (id: string) => void
}

type StarPowerTab = 'users' | 'verifications' | 'listings' | 'database' | 'activity'

export default function StarPowerView({
  user,
  onOpenListingDetail,
}: StarPowerViewProps) {
  const [activeTab, setActiveTab] = useState<StarPowerTab>('users')

  // Database status state
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [loadingDb, setLoadingDb] = useState(false)

  // Users state
  const [usersList, setUsersList] = useState<AuthedUser[]>([])
  const [loginActivity, setLoginActivity] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<AuthedUser | null>(null)

  // Verification applications state
  const [verifications, setVerifications] = useState<any[]>([])
  const [loadingVerifications, setLoadingVerifications] = useState(false)
  const [processingVerifId, setProcessingVerifId] = useState<string | null>(null)

  // Listings state
  const [listings, setListings] = useState<MockListing[]>([])
  const [listingSearch, setListingSearch] = useState('')
  const [loadingListings, setLoadingListings] = useState(false)
  const [isDatabaseSource, setIsDatabaseSource] = useState(false)
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null)
  const [confirmClearAllListings, setConfirmClearAllListings] = useState(false)
  const [clearingListings, setClearingListings] = useState(false)

  // Wipe database state
  const [wipingDatabase, setWipingDatabase] = useState(false)
  const [confirmWipeModal, setConfirmWipeModal] = useState(false)

  // Fetch initial data when user is ADMIN
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchDbStatus()
      fetchUsers()
      fetchVerifications()
      fetchListings()
    }
  }, [user?.role])

  // 1. Fetch Database Health
  async function fetchDbStatus() {
    setLoadingDb(true)
    try {
      const res = await fetch('/api/admin/database')
      if (res.ok) {
        const data = await res.json()
        setDbStatus(data)
      }
    } catch {
      // offline/fallback
    } finally {
      setLoadingDb(false)
    }
  }

  // 2. Fetch Users & Activity
  async function fetchUsers() {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsersList(data.users || [])
        setLoginActivity(data.loginActivity || [])
      }
    } catch {
      toast.error('Failed to load users from database')
    } finally {
      setLoadingUsers(false)
    }
  }

  // 3. Fetch Verification Applications
  async function fetchVerifications() {
    setLoadingVerifications(true)
    try {
      const res = await fetch('/api/admin/verifications')
      if (res.ok) {
        const data = await res.json()
        setVerifications(data.applications || [])
      }
    } catch {
    } finally {
      setLoadingVerifications(false)
    }
  }

  // Action: Process verification application
  async function handleProcessVerification(applicationId: string, action: string) {
    setProcessingVerifId(applicationId)
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, action }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Verification updated.')
        fetchVerifications()
        fetchUsers()
      } else {
        toast.error(data.error || 'Failed to update verification.')
      }
    } catch {
      toast.error('Error processing verification.')
    } finally {
      setProcessingVerifId(null)
    }
  }

  // Action: Wipe database clean
  async function handleWipeDatabase() {
    setWipingDatabase(true)
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'wipe' }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Database wiped clean successfully!')
        setListings([])
        setConfirmWipeModal(false)
        fetchUsers()
        fetchListings()
        fetchDbStatus()
        fetchVerifications()
      } else {
        toast.error(data.error || 'Failed to wipe database.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error wiping database.')
    } finally {
      setWipingDatabase(false)
    }
  }

  // 3. Fetch Listings
  async function fetchListings() {
    setLoadingListings(true)
    try {
      const res = await fetch('/api/admin/listings')
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
        setIsDatabaseSource(Boolean(data.fromDatabase))
      }
    } catch {
      toast.error('Failed to load listings')
    } finally {
      setLoadingListings(false)
    }
  }

  // Action: Delete user account
  async function handleDeleteUser(targetUser: AuthedUser) {
    setDeletingUserId(targetUser.id)
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(targetUser.id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`User ${targetUser.email} account deleted from database.`)
        setUsersList((prev) => prev.filter((u) => u.id !== targetUser.id))
        setConfirmDeleteUser(null)
      } else {
        toast.error(data.error || 'Failed to delete user account.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting user account.')
    } finally {
      setDeletingUserId(null)
    }
  }

  // Action: Toggle user verification
  async function handleToggleUserVerification(id: string, type: 'nin' | 'bvn', currentVal: boolean) {
    try {
      const payload: any = { id }
      if (type === 'nin') payload.ninVerified = !currentVal
      if (type === 'bvn') payload.bvnVerified = !currentVal

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success(`User ${type.toUpperCase()} verification updated.`)
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  ninVerified: type === 'nin' ? !currentVal : u.ninVerified,
                  bvnVerified: type === 'bvn' ? !currentVal : u.bvnVerified,
                }
              : u
          )
        )
      }
    } catch {
      toast.error('Failed to update verification status.')
    }
  }

  // Action: Toggle listing verification or status
  async function handleUpdateListing(id: string, patch: Record<string, any>) {
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      })
      if (res.ok) {
        toast.success('Listing updated successfully.')
        setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
      }
    } catch {
      toast.error('Failed to update listing.')
    }
  }

  // Action: Delete single listing
  async function handleDeleteListing(id: string) {
    setDeletingListingId(id)
    try {
      const res = await fetch(`/api/admin/listings?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Listing removed from database directly.')
        setListings((prev) => prev.filter((l) => l.id !== id))
      } else {
        toast.error(data.error || 'Failed to delete listing.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting listing.')
    } finally {
      setDeletingListingId(null)
    }
  }

  // Action: Clear ALL listings from database directly
  async function handleClearAllListings() {
    setClearingListings(true)
    try {
      const res = await fetch('/api/admin/listings?clearAll=true', {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'All database listings cleared directly from Supabase.')
        setListings([])
        setConfirmClearAllListings(false)
        fetchDbStatus()
      } else {
        toast.error(data.error || 'Failed to clear database listings.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error clearing database listings.')
    } finally {
      setClearingListings(false)
    }
  }

  // Action: Seed Data into database
  async function handleSeedDatabase() {
    setSeeding(true)
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Database seeded with anchor lodges!')
        fetchListings()
        fetchDbStatus()
      } else {
        toast.error(data.error || 'Failed to seed database.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error seeding database.')
    } finally {
      setSeeding(false)
    }
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return usersList
    const q = userSearch.toLowerCase()
    return usersList.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
    )
  }, [usersList, userSearch])

  // Filtered listings
  const filteredListings = useMemo(() => {
    if (!listingSearch.trim()) return listings
    const q = listingSearch.toLowerCase()
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
    )
  }, [listings, listingSearch])

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#070A12] text-slate-100">
        <div className="max-w-md w-full bg-[#090D18] border border-slate-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-white">Administrator Access Required</h2>
          <p className="text-xs text-slate-400 mt-2">
            This space is restricted to administrators. Please sign in with administrator credentials in Settings to access database management tools.
          </p>
        </div>
      </div>
    )
  }

  // =========================================================================
  // MAIN STAR POWER DASHBOARD: ACTIVE WHEN USER IS ADMIN
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#070A12] text-slate-100 overflow-hidden">
      {/* Top Glassy Star Power Banner */}
      <div className="shrink-0 bg-gradient-to-r from-[#090D18] via-[#10182E] to-[#090D18] border-b border-amber-500/20 px-4 py-3 sm:px-6 relative overflow-hidden shadow-lg">
        {/* Ambient gold glow */}
        <div className="absolute -top-12 left-1/3 w-96 h-24 bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            {/* Shiny Glassy Yellow Star Emblem */}
            <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 p-0.5 shadow-lg shadow-amber-500/40 border border-yellow-200/90 backdrop-blur-md shrink-0">
              <div className="absolute inset-0 rounded-[14px] bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
              <div className="h-full w-full rounded-[14px] flex items-center justify-center bg-gradient-to-b from-amber-300/40 to-amber-600/40 relative">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-amber-950 fill-amber-950 drop-shadow-sm filter"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white shadow-xs animate-ping" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  Star Power
                  <span className="text-amber-400">⚡</span>
                </h1>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40 font-mono text-[10px] uppercase font-bold tracking-wider">
                  Admin DB Center
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Direct Supabase PostgreSQL control</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {dbStatus?.connected ? 'Supabase Live' : 'Connected'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-200 cursor-pointer"
              onClick={() => {
                fetchDbStatus()
                fetchUsers()
                fetchListings()
                toast.success('Database state synchronized!')
              }}
              disabled={loadingDb || loadingUsers || loadingListings}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${
                  loadingDb || loadingUsers || loadingListings ? 'animate-spin' : ''
                }`}
              />
              Sync DB
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs shadow-md shadow-rose-500/10 cursor-pointer"
              onClick={() => setConfirmWipeModal(true)}
              disabled={wipingDatabase}
            >
              <Trash2 className={`h-3.5 w-3.5 mr-1.5 ${wipingDatabase ? 'animate-spin' : ''}`} />
              {wipingDatabase ? 'Wiping DB...' : 'Wipe Database Clean'}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="shrink-0 bg-[#090D18] border-b border-slate-800/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-amber-400" />
            <span>Users & Login Activity</span>
            <Badge className="bg-slate-800 text-slate-300 text-[10px] ml-1">
              {usersList.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('verifications')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              activeTab === 'verifications'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            <span>Verification Applications</span>
            {verifications.filter((v) => v.status === 'PENDING').length > 0 && (
              <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] ml-1">
                {verifications.filter((v) => v.status === 'PENDING').length} new
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              activeTab === 'listings'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building className="h-3.5 w-3.5 text-yellow-400" />
            <span>Manage & Clear Listings</span>
            <Badge className="bg-slate-800 text-slate-300 text-[10px] ml-1">
              {listings.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              activeTab === 'database'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="h-3.5 w-3.5 text-amber-400" />
            <span>Database Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              activeTab === 'activity'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Audit Stream</span>
            <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px] ml-1">
              {loginActivity.length}
            </Badge>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* =========================================================================
              TAB 1: USERS & LOGIN ACTIVITY
             ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#090D18] border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search users by name, email, or role..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="h-9 pl-10 text-xs bg-slate-900 border-slate-800 text-white rounded-xl focus:border-amber-400"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Total Users: <strong className="text-white">{usersList.length}</strong></span>
                  <span>·</span>
                  <span>Active Sessions: <strong className="text-emerald-400">{loginActivity.filter(a => a.status === 'SUCCESS').length}</strong></span>
                </div>
              </div>

              {/* Users List Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredUsers.map((u) => {
                  const isMasterAdmin =
                    u.email.toLowerCase() === 'mapstar777@gmail.com' || u.role === 'ADMIN'
                  const recentLogins = loginActivity.filter((a) => a.email.toLowerCase() === u.email.toLowerCase())
                  const lastActive = recentLogins[0]?.timestamp || u.createdAt

                  return (
                    <div
                      key={u.id}
                      className="bg-[#090D18] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition shadow-sm space-y-3.5 relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base shrink-0">
                            {(u.fullName || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white truncate">
                                {u.fullName || 'User'}
                              </h3>
                              <Badge
                                className={`text-[10px] font-semibold ${
                                  u.role === 'ADMIN'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : u.role === 'LANDLORD'
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                    : u.role === 'AGENT'
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                {u.role}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-400 truncate mt-0.5">{u.email}</div>
                          </div>
                        </div>

                        {/* Delete User Action */}
                        {!isMasterAdmin ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                            onClick={() => setConfirmDeleteUser(u)}
                            title="Delete user account directly from database"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-400/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                            Protected
                          </span>
                        )}
                      </div>

                      <Separator className="bg-slate-800/80" />

                      {/* Login Activity & Verification Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">
                            Login Activity
                          </span>
                          <span className="text-slate-300 flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3 text-amber-400" />
                            {lastActive
                              ? new Date(lastActive).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'No recent login'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">
                            Phone
                          </span>
                          <span className="text-slate-300 mt-0.5 block truncate">
                            {u.phone || 'None provided'}
                          </span>
                        </div>
                      </div>

                      {/* NIN / BVN Controls */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleUserVerification(u.id, 'nin', Boolean(u.ninVerified))}
                            className={`text-[10px] px-2 py-1 rounded-md font-semibold border transition cursor-pointer flex items-center gap-1 ${
                              u.ninVerified
                                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            NIN {u.ninVerified ? 'Verified' : 'Unverified'}
                          </button>

                          <button
                            onClick={() => handleToggleUserVerification(u.id, 'bvn', Boolean(u.bvnVerified))}
                            className={`text-[10px] px-2 py-1 rounded-md font-semibold border transition cursor-pointer flex items-center gap-1 ${
                              u.bvnVerified
                                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            BVN {u.bvnVerified ? 'Verified' : 'Unverified'}
                          </button>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500">
                          ID: {u.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredUsers.length === 0 && (
                <div className="bg-[#090D18] border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                  <UserX className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-semibold">No users matching search</p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: VERIFICATION APPLICATIONS PROCESSING (NIN / BVN / LANDLORD / AGENT)
             ========================================================================= */}
          {activeTab === 'verifications' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#090D18] border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    Identity & Listing Verification Queue
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Process tenant NIN & BVN verification, and approve Landlords and Agents to list properties.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                    Pending: {verifications.filter((v) => v.status === 'PENDING').length}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchVerifications}
                    className="h-8 text-xs border-slate-700 bg-slate-800/60 text-slate-300"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${loadingVerifications ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Applications List */}
              <div className="space-y-3.5">
                {verifications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-[#090D18] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 font-bold">
                          {(app.fullName || app.userEmail || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{app.fullName}</span>
                            <Badge
                              className={`text-[10px] ${
                                app.status === 'PENDING'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : app.status === 'APPROVED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {app.status}
                            </Badge>
                            <Badge className="bg-slate-800 text-slate-300 text-[10px]">
                              {app.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-400">{app.userEmail}</span>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-slate-500">
                        Submitted: {new Date(app.createdAt).toLocaleDateString()} {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Application Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl text-xs border border-slate-800/60">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">NIN Number</span>
                        <span className="font-mono text-slate-200 font-semibold">{app.nin || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">BVN Number</span>
                        <span className="font-mono text-slate-200 font-semibold">{app.bvn || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Business / Property</span>
                        <span className="text-slate-200 truncate block">{app.businessName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Address / Location</span>
                        <span className="text-slate-200 truncate block">{app.propertyOrOfficeAddress || '—'}</span>
                      </div>
                    </div>

                    {app.notes && (
                      <p className="text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40">
                        &quot;{app.notes}&quot;
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-2">
                        {app.nin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessVerification(app.id, 'APPROVE_NIN')}
                            disabled={processingVerifId === app.id}
                            className="h-8 text-xs border-emerald-800/60 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verify NIN
                          </Button>
                        )}

                        {app.bvn && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessVerification(app.id, 'APPROVE_BVN')}
                            disabled={processingVerifId === app.id}
                            className="h-8 text-xs border-emerald-800/60 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verify BVN
                          </Button>
                        )}

                        {app.type === 'LANDLORD' && (
                          <Button
                            size="sm"
                            onClick={() => handleProcessVerification(app.id, 'APPROVE_LANDLORD')}
                            disabled={processingVerifId === app.id}
                            className="h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold"
                          >
                            <Building className="h-3.5 w-3.5 mr-1" /> Approve Landlord Listing Rights
                          </Button>
                        )}

                        {app.type === 'AGENT' && (
                          <Button
                            size="sm"
                            onClick={() => handleProcessVerification(app.id, 'APPROVE_AGENT')}
                            disabled={processingVerifId === app.id}
                            className="h-8 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold"
                          >
                            <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Approve Verified Agent
                          </Button>
                        )}

                        {app.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => handleProcessVerification(app.id, 'APPROVE_ALL')}
                            disabled={processingVerifId === app.id}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve Everything
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {app.status === 'APPROVED' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessVerification(app.id, 'REVOKE')}
                            disabled={processingVerifId === app.id}
                            className="h-8 text-xs border-rose-800/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40"
                          >
                            Revoke Status
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleProcessVerification(app.id, 'REJECT')}
                            disabled={processingVerifId === app.id}
                            className="h-8 text-xs text-slate-400 hover:text-rose-400"
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {verifications.length === 0 && (
                  <div className="bg-[#090D18] border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                    <Shield className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold">No verification applications submitted yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      When users apply for NIN, BVN, or Landlord/Agent listing permission under &apos;Me&apos;, they will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: DIRECT DATABASE LISTINGS MANAGEMENT & CLEARING
             ========================================================================= */}
          {activeTab === 'listings' && (
            <div className="space-y-5">
              {/* Top Warning & Clear Database Listings Control */}
              <div className="bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-rose-400" />
                    <h2 className="text-sm font-bold text-white">
                      Clear & Manage Database Listings Directly
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Admin can purge all current listings and properties directly from Supabase. You can immediately repopulate at any time using the <strong>Seed Data</strong> button.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-9 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer"
                    onClick={() => setConfirmClearAllListings(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Clear All Database Listings
                  </Button>
                </div>
              </div>

              {/* Listings Search and Count */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#090D18] border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search listings by title, city, or area..."
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    className="h-9 pl-10 text-xs bg-slate-900 border-slate-800 text-white rounded-xl focus:border-amber-400"
                  />
                  {listingSearch && (
                    <button
                      onClick={() => setListingSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Source: <strong className={isDatabaseSource ? 'text-emerald-400' : 'text-amber-400'}>{isDatabaseSource ? 'Supabase Database' : 'Mock / In-Memory'}</strong></span>
                  <span>·</span>
                  <span>Total Listings: <strong className="text-white">{listings.length}</strong></span>
                </div>
              </div>

              {/* Listings Cards */}
              <div className="space-y-3">
                {filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-[#090D18] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-slate-800 overflow-hidden relative shrink-0 border border-slate-700/60">
                        {listing.photoUrls?.[0] ? (
                          <img
                            src={listing.photoUrls[0]}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-600">
                            <Building className="h-6 w-6" />
                          </div>
                        )}
                        {listing.physicallyVerified && (
                          <span className="absolute bottom-1 left-1 bg-emerald-600/90 text-white p-0.5 rounded shadow-xs">
                            <CheckCircle2 className="h-3 w-3" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white truncate max-w-sm">
                            {listing.title}
                          </h3>
                          <Badge
                            className={`text-[10px] font-semibold ${
                              listing.status === 'AVAILABLE'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {listing.status}
                          </Badge>
                          {listing.featured && (
                            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-[10px]">
                              Featured
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-slate-400">
                          {listing.area}, {listing.city} ·{' '}
                          <span className="font-semibold text-white">
                            {formatNaira(listing.annualRent)}/yr
                          </span>
                        </div>

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                          <span>{listing.bedrooms} Beds</span>
                          <span>·</span>
                          <span>{listing.bathrooms} Baths</span>
                          <span>·</span>
                          <span>ID: {listing.id.substring(0, 10)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-slate-700 bg-slate-900 text-xs text-slate-300 hover:text-white cursor-pointer"
                        onClick={() =>
                          handleUpdateListing(listing.id, {
                            physicallyVerified: !listing.physicallyVerified,
                          })
                        }
                      >
                        {listing.physicallyVerified ? 'Unverify' : 'Verify'}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-slate-700 bg-slate-900 text-xs text-slate-300 hover:text-white cursor-pointer"
                        onClick={() =>
                          handleUpdateListing(listing.id, {
                            featured: !listing.featured,
                          })
                        }
                      >
                        {listing.featured ? 'Unfeature' : 'Feature'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 cursor-pointer"
                        onClick={() => handleDeleteListing(listing.id)}
                        disabled={deletingListingId === listing.id}
                        title="Delete listing directly from database"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredListings.length === 0 && (
                  <div className="bg-[#090D18] border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                    <Building className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold">No listings in database</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click &quot;Seed Data&quot; at the top to populate anchor lodges into Supabase.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: DATABASE HUB & HEALTH
             ========================================================================= */}
          {activeTab === 'database' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#090D18] border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Total Users</span>
                    <Users className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2">
                    {dbStatus?.counts?.users ?? usersList.length}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">In Supabase DB</span>
                </div>

                <div className="bg-[#090D18] border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Active Listings</span>
                    <Building className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2">
                    {dbStatus?.counts?.listings ?? listings.length}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Real-time properties</span>
                </div>

                <div className="bg-[#090D18] border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">DB Latency</span>
                    <Zap className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2">
                    {dbStatus?.latencyMs ? `${dbStatus.latencyMs}ms` : '18ms'}
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1 block">eu-west-1 fast pool</span>
                </div>

                <div className="bg-[#090D18] border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Dual-Tier Fallback</span>
                    <Server className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2">Active</div>
                  <span className="text-[10px] text-blue-400 mt-1 block">Prisma + Supabase REST</span>
                </div>
              </div>

              {/* Connection Specs */}
              <div className="bg-[#090D18] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-amber-400" />
                  Supabase PostgreSQL Infrastructure
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80 gap-1">
                    <span className="text-slate-400">Project Endpoint</span>
                    <span className="font-mono text-slate-200">
                      https://xklwwldxapbxjpnnxbcd.supabase.co
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80 gap-1">
                    <span className="text-slate-400">Connection Pooler</span>
                    <span className="font-mono text-slate-200">
                      aws-0-eu-west-1.pooler.supabase.com:6543
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80 gap-1">
                    <span className="text-slate-400">Direct PostgreSQL Connection</span>
                    <span className="font-mono text-slate-200">
                      aws-0-eu-west-1.pooler.supabase.com:5432
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-1">
                    <span className="text-slate-400">Database Role</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      postgres (RLS & Full Admin Mode)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: AUDIT STREAM / LOGIN ACTIVITY
             ========================================================================= */}
          {activeTab === 'activity' && (
            <div className="space-y-5">
              <div className="bg-[#090D18] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    Live Authentication & Login Activity
                  </h3>
                  <span className="text-xs text-slate-400">
                    Displaying last {loginActivity.length} events
                  </span>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {loginActivity.map((log) => (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{log.email}</span>
                          <Badge
                            className={`text-[9px] ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                : 'bg-rose-950/60 text-rose-300 border-rose-800'
                            }`}
                          >
                            {log.status}
                          </Badge>
                          {log.role && (
                            <Badge className="bg-slate-800 text-slate-300 text-[9px]">
                              {log.role}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{log.details || 'User session'}</p>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {log.ip ? `IP: ${log.ip} · ` : ''}
                          {log.userAgent || 'Web browser'}
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}

                  {loginActivity.length === 0 && (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      No recent login activity logged.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Confirmation Dialog: Delete User */}
      <Dialog
        open={Boolean(confirmDeleteUser)}
        onOpenChange={(open) => !open && setConfirmDeleteUser(null)}
      >
        <DialogContent className="max-w-md bg-[#090D18] border border-slate-800 text-slate-100 rounded-3xl p-6">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-white">
              Permanently Delete User Account?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-400 mt-1.5 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-white">{confirmDeleteUser?.email}</strong>?
              This will erase their profile, applications, and permissions from Supabase directly.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2.5 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 text-xs"
              onClick={() => setConfirmDeleteUser(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="bg-rose-600 hover:bg-rose-500 text-xs font-semibold"
              onClick={() => confirmDeleteUser && handleDeleteUser(confirmDeleteUser)}
              disabled={Boolean(deletingUserId)}
            >
              {deletingUserId ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Clear All Listings */}
      <Dialog
        open={confirmClearAllListings}
        onOpenChange={setConfirmClearAllListings}
      >
        <DialogContent className="max-w-md bg-[#090D18] border border-rose-500/30 text-slate-100 rounded-3xl p-6">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-white">
              Clear All Database Listings?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-400 mt-1.5 leading-relaxed">
              This will purge all listings and associated property records from the Supabase database.
              You can re-populate verified lodges at any time using the <strong>Seed Data</strong> button.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2.5 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 text-xs"
              onClick={() => setConfirmClearAllListings(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="bg-rose-600 hover:bg-rose-500 text-xs font-bold shadow-md shadow-rose-600/30"
              onClick={handleClearAllListings}
              disabled={clearingListings}
            >
              {clearingListings ? 'Clearing...' : 'Yes, Clear All Listings'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Wipe Entire Database Clean */}
      <Dialog
        open={confirmWipeModal}
        onOpenChange={setConfirmWipeModal}
      >
        <DialogContent className="max-w-md bg-[#090D18] border border-rose-500/40 text-slate-100 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-white">
              Wipe Database Clean?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-400 mt-1.5 leading-relaxed">
              This will permanently delete ALL property listings and ALL users (except the master administrator) directly from Supabase PostgreSQL. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-300 my-2">
            <strong>Permanent Action:</strong> Supabase tables will be completely cleared. Only master admin <span className="font-mono text-white">mapstar777@gmail.com</span> will be preserved.
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 text-xs"
              onClick={() => setConfirmWipeModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="bg-rose-600 hover:bg-rose-500 text-xs font-bold shadow-md shadow-rose-600/30"
              onClick={handleWipeDatabase}
              disabled={wipingDatabase}
            >
              {wipingDatabase ? 'Wiping Clean...' : 'Yes, Wipe Everything Clean'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

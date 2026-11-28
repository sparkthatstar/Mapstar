'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Building,
  Plus,
  LogOut,
  Mail,
  Phone,
  Clock,
  Send,
  Loader2,
  LogIn,
  BadgeCheck,
  FileCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { AuthedUser } from '@/components/mapstar/login-signup-dialog'

interface MeViewProps {
  user: AuthedUser | null
  onOpenAuth: (mode?: 'login' | 'signup') => void
  onLogout: () => void
  onOpenListProperty: () => void
}

export default function MeView({
  user,
  onOpenAuth,
  onLogout,
  onOpenListProperty,
}: MeViewProps) {
  // 1. Identity Verification dialog state (Persona API - for all users)
  const [identityModalOpen, setIdentityModalOpen] = useState(false)
  const [personaLoading, setPersonaLoading] = useState(false)

  // 2. Listing Application dialog state (Landlord / Agent privilege onboarding)
  const [listingModalOpen, setListingModalOpen] = useState(false)
  const [listingRole, setListingRole] = useState<'LANDLORD' | 'AGENT'>('LANDLORD')
  const [businessName, setBusinessName] = useState('')
  const [propertyAddress, setPropertyAddress] = useState('')
  const [listingNotes, setListingNotes] = useState('')
  const [submittingListing, setSubmittingListing] = useState(false)

  const [myApplications, setMyApplications] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchMyApplications()
    }
  }, [user?.id])

  // Dynamically inject Persona Embedded SDK script if not already present
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('persona-embedded-script')) {
      const script = document.createElement('script')
      script.id = 'persona-embedded-script'
      script.src = 'https://embed.withpersona.com/v1/latest.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  async function fetchMyApplications() {
    try {
      const res = await fetch('/api/verification')
      if (res.ok) {
        const data = await res.json()
        setMyApplications(data.applications || [])
      }
    } catch {}
  }

  /**
   * Launch Persona Identity Verification using official Persona API & SDK
   */
  async function handleStartPersona() {
    if (!user) return
    setPersonaLoading(true)

    try {
      const res = await fetch('/api/verification/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to initiate Persona verification.')
        setPersonaLoading(false)
        return
      }

      const PersonaSDK = (window as any).Persona
      if (PersonaSDK && data.templateId) {
        const client = new PersonaSDK.Client({
          templateId: data.templateId,
          environmentId: data.environmentId,
          inquiryId: data.inquiryId?.startsWith('inq_') && data.mode === 'live' ? data.inquiryId : undefined,
          sessionToken: data.sessionToken || undefined,
          referenceId: user.id,
          fields: {
            nameFirst: user.fullName ? user.fullName.split(' ')[0] : undefined,
            nameLast: user.fullName ? user.fullName.split(' ').slice(1).join(' ') : undefined,
            emailAddress: user.email,
            phoneNumber: user.phone || undefined,
          },
          onReady: () => {
            client.open()
          },
          onComplete: async ({ inquiryId, status }: any) => {
            toast.success('Persona identity verified! Credibility badge activated.')
            await fetch('/api/verification/persona/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ inquiryId, status }),
            })
            setIdentityModalOpen(false)
            fetchMyApplications()
          },
          onCancel: () => {
            toast.info('Persona verification closed.')
          },
          onError: (err: any) => {
            console.error('Persona SDK error:', err)
            toast.error('Persona verification encountered an issue.')
          },
        })
        client.open()
      } else if (data.inquiryUrl) {
        window.open(data.inquiryUrl, '_blank')
        toast.info('Opened Persona verification window. Complete steps to verify.')
        setIdentityModalOpen(false)
      } else {
        // Fallback / sandbox test mode
        await fetch('/api/verification/persona/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inquiryId: data.inquiryId, status: 'sandbox_verified' }),
        })
        toast.success('Persona verification completed! Credibility badge activated.')
        setIdentityModalOpen(false)
        fetchMyApplications()
      }
    } catch (err: any) {
      console.error('Persona verification error:', err)
      toast.error('Could not connect to Persona verification service.')
    } finally {
      setPersonaLoading(false)
    }
  }

  /**
   * Submit Landlord or Agent listing privilege application
   */
  async function handleApplyListing(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    if (!propertyAddress.trim()) {
      toast.error('Please provide a property or office address.')
      return
    }

    setSubmittingListing(true)
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: listingRole,
          businessName,
          propertyOrOfficeAddress: propertyAddress,
          notes: listingNotes,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(
          `Application to list properties as ${listingRole === 'LANDLORD' ? 'Landlord' : 'Agent'} submitted! Our team will review it.`
        )
        setListingModalOpen(false)
        setBusinessName('')
        setPropertyAddress('')
        setListingNotes('')
        fetchMyApplications()
      } else {
        toast.error(data.error || 'Failed to submit application.')
      }
    } catch {
      toast.error('Network error submitting application.')
    } finally {
      setSubmittingListing(false)
    }
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F8FAFC] dark:bg-[#070A12]">
        <div className="max-w-md w-full bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-50 dark:bg-[#2A1810]/60 border border-amber-200 dark:border-[#523018]/60 flex items-center justify-center mb-5 shadow-inner">
            <User className="h-8 w-8 text-[#78350F] dark:text-[#E0904E]" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Log in to view your profile
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
            Access your saved lodges, direct-from-landlord applications, verified tenancy agreements, and direct landlord contact.
          </p>

          <div className="space-y-2.5">
            <Button
              className="w-full h-10 bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white font-semibold text-xs shadow-md shadow-[#78350F]/25 cursor-pointer"
              onClick={() => onOpenAuth('login')}
            >
              <LogIn className="h-4 w-4 mr-2" /> Log in to Mapstar
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A12] text-xs font-semibold cursor-pointer"
              onClick={() => onOpenAuth('signup')}
            >
              Create a free Mapstar account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const roleLabel =
    user.role === 'ADMIN'
      ? 'Administrator'
      : user.role === 'LANDLORD'
      ? 'Landlord / Property Owner'
      : user.role === 'AGENT'
      ? 'Mapstar-Verified Agent'
      : 'Tenant'

  const canPostListings = user.role === 'ADMIN' || user.role === 'LANDLORD' || user.role === 'AGENT'
  const isIdentityVerified = Boolean(user.ninVerified || user.bvnVerified)
  const pendingApplication = myApplications.find((a) => a.status === 'PENDING')

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#F8FAFC] dark:bg-[#070A12]">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#78350F] via-[#854D0E] to-[#451A03] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#78350F]/25 border border-amber-600/30 shrink-0">
              {(user.fullName || user.email || '?').charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
                  {user.fullName || 'Mapstar User'}
                </h1>
                <Badge className="w-fit mx-auto sm:mx-0 bg-amber-50 dark:bg-[#2A1810]/80 text-[#78350F] dark:text-[#E0904E] border-amber-200 dark:border-[#523018]/60 font-semibold text-[10px]">
                  {roleLabel}
                </Badge>
              </div>

              <div className="mt-2.5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              {/* Dynamic Credibility & Verification Badges */}
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {isIdentityVerified ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    {user.role === 'LANDLORD' ? 'Verified Landlord' : user.role === 'AGENT' ? 'Verified Agent' : 'Verified Tenant'}
                  </div>
                ) : (
                  <button
                    onClick={() => setIdentityModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    Get Verified (Boost Credibility)
                  </button>
                )}

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                  Direct Landlord Contact
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-slate-100 dark:bg-slate-800" />

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {canPostListings ? (
              <Button
                onClick={onOpenListProperty}
                className="h-10 bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white font-semibold text-xs shadow-md shadow-[#78350F]/25 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" /> List a Property
              </Button>
            ) : (
              <Button
                onClick={() => setIdentityModalOpen(true)}
                className="h-10 bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white font-semibold text-xs shadow-md shadow-[#78350F]/25 cursor-pointer"
              >
                <Shield className="h-4 w-4 mr-2" /> Get Verified on Mapstar
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onLogout}
              className="h-10 border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Verification Status Banner / Application Hub */}
        {!isIdentityVerified && (
          <div className="bg-white dark:bg-[#090D18] border border-amber-200/80 dark:border-amber-800/60 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Get Verified on Mapstar
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                  Get verified to build trust, stand out, and appear credible to landlords, lodge owners, and roommates when inquiring or applying for apartments.
                </p>
                {pendingApplication && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                    <Clock className="h-3.5 w-3.5" /> Verification under review
                  </div>
                )}
              </div>

              <Button
                onClick={() => setIdentityModalOpen(true)}
                className="w-full sm:w-auto h-10 px-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-600/30 cursor-pointer shrink-0"
              >
                <FileCheck className="h-4 w-4 mr-1.5" /> Get Verified
              </Button>
            </div>
          </div>
        )}

        {/* Landlord & Agent Hub - List Property Card (Shown only to approved roles) */}
        {canPostListings && (
          <div className="bg-white dark:bg-[#090D18] border border-amber-200/80 dark:border-[#523018]/60 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-[#2A1810]/80 border border-amber-200 dark:border-[#523018]/60 flex items-center justify-center text-[#78350F] dark:text-[#E0904E]">
                    <Building className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    List Your Property on Mapstar
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                  Approved listing privilege active. Post lodges, self-contain units, and flats directly with fee caps and instant tenant inquiries.
                </p>
              </div>
              <Button
                onClick={onOpenListProperty}
                className="w-full sm:w-auto h-10 px-4 bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white font-semibold text-xs shadow-md shadow-[#78350F]/25 cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4 mr-1.5" /> List Property
              </Button>
            </div>
          </div>
        )}

        {/* Security & Account Details */}
        <div className="bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-[#78350F]" /> Account Security & Protection
          </h2>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span>Account ID</span>
              <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{user.id}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span>User Role</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{roleLabel}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span>Identity Verification</span>
              <span className={isIdentityVerified ? 'text-emerald-600 font-bold' : 'text-amber-600 font-medium'}>
                {isIdentityVerified ? 'Verified Credibility' : 'Pending Verification'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Direct Inquiries</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Enabled & Protected</span>
            </div>
          </div>
        </div>

        {/* Apply to List Properties Card (Positioned at bottom for Tenants/Standard users) */}
        {!canPostListings && (
          <div className="bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-[#2A1810]/80 border border-amber-200 dark:border-[#523018]/60 flex items-center justify-center text-[#78350F] dark:text-[#E0904E]">
                    <Building className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Apply to List Properties
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                  Are you a lodge owner, landlord, or verified real estate agent? Apply for property listing access to publish lodges directly on Mapstar.
                </p>
              </div>

              <Button
                onClick={() => setListingModalOpen(true)}
                className="w-full sm:w-auto h-10 px-4 bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white font-semibold text-xs shadow-md shadow-[#78350F]/25 cursor-pointer shrink-0"
              >
                <BadgeCheck className="h-4 w-4 mr-1.5" /> Apply to List Properties
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Identity Verification Modal (Persona API - NO application types) */}
      <Dialog open={identityModalOpen} onOpenChange={setIdentityModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#78350F] dark:text-[#E0904E]" /> Get Verified on Mapstar
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Identity verification is powered by Persona to build credibility across Mapstar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-[#78350F] dark:text-[#E0904E] flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Mapstar Identity Verification <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Verify your government ID (Passport, National ID, Voter&apos;s Card, or Driver&apos;s License) securely via the Persona API.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Instant verified credibility badge on your profile and inquiries</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Bank-grade privacy &amp; automated ID scanning via Persona</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Higher response rate &amp; trust from lodge owners and landlords</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIdentityModalOpen(false)}
                className="text-xs h-9"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={personaLoading}
                onClick={handleStartPersona}
                className="bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white text-xs h-9 px-4 font-semibold shadow-md shadow-[#78350F]/20 cursor-pointer"
              >
                {personaLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Connecting Persona...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Start Persona Verification
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Listing Application Modal (Landlord / Agent Privilege Onboarding) */}
      <Dialog open={listingModalOpen} onOpenChange={setListingModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-[#78350F]" /> Apply to List Properties
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Submit your property or agency details to unlock property listing privileges on Mapstar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplyListing} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-semibold">Listing Role</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <Button
                  type="button"
                  variant={listingRole === 'LANDLORD' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setListingRole('LANDLORD')}
                  className="text-xs h-9"
                >
                  Landlord / Owner
                </Button>
                <Button
                  type="button"
                  variant={listingRole === 'AGENT' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setListingRole('AGENT')}
                  className="text-xs h-9"
                >
                  Mapstar Agent
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="business-input" className="text-xs font-medium">
                {listingRole === 'LANDLORD' ? 'Property Name / CAC (Optional)' : 'Agency Name / License'}
              </Label>
              <Input
                id="business-input"
                placeholder={listingRole === 'LANDLORD' ? 'e.g. Amadi Lodge Owerri' : 'e.g. Prime Realty Owerri'}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="address-input" className="text-xs font-medium">
                {listingRole === 'LANDLORD' ? 'Property Address' : 'Office Address'}
              </Label>
              <Input
                id="address-input"
                placeholder="e.g. 12 Ikenegbu Layout, Owerri"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                className="mt-1 h-9 text-xs"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes-input" className="text-xs font-medium">
                Additional Notes
              </Label>
              <Textarea
                id="notes-input"
                placeholder="Provide any additional info for faster review..."
                rows={2}
                value={listingNotes}
                onChange={(e) => setListingNotes(e.target.value)}
                className="mt-1 text-xs resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setListingModalOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingListing}
                className="bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white text-xs h-9"
              >
                {submittingListing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Submit Listing Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


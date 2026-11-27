'use client'

import { useState, useEffect } from 'react'
import {
  LifeBuoy,
  ShieldAlert,
  AlertTriangle,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  Send,
  Building,
  User,
  ExternalLink,
  ChevronRight,
  Search,
  FileText,
  BadgeAlert,
  Sparkles,
  HelpCircle,
  Scale,
  RefreshCw,
  X,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AuthedUser } from '@/components/mapstar/login-signup-dialog'
import { MOCK_LISTINGS, formatNaira } from '@/lib/mock-data'
import { toast } from 'sonner'

export interface ComplaintTicket {
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
}

interface CustomerServiceViewProps {
  user: AuthedUser | null
  onOpenAuth: (mode?: 'login' | 'signup') => void
  onOpenListingDetail?: (listingId: string) => void
}

const COMPLAINT_CATEGORIES = [
  {
    id: 'EXCESS_FEES',
    label: '🚨 Illegal / Excess Agency Fees (>5%)',
    desc: 'An agent charged past the legal 5% cap or demanded unapproved inspection fees',
  },
  {
    id: 'FRAUD_SCAM',
    label: '⚠️ Fake Lodge / Ghost Listing / Scam',
    desc: 'Lodge does not physically exist, deceptive photos, or impersonating an owner',
  },
  {
    id: 'FACILITY_FAILURE',
    label: '💧 Light / Borehole / Facility Failure',
    desc: 'Promised water, prepaid meter, or security failure without landlord remedy',
  },
  {
    id: 'CAUTION_DISPUTE',
    label: '⚖️ Caution Fee / Rent Refund Dispute',
    desc: 'Landlord refusing to refund legal caution deposit or unexpired rent balance',
  },
  {
    id: 'AGENT_CONDUCT',
    label: '🛡️ Unverified Agent Harassment / Conduct',
    desc: 'Intimidation, unauthorized lockouts, or breach of Mapstar conduct standards',
  },
  {
    id: 'GENERAL_SUPPORT',
    label: '💬 App Support & Payment Assistance',
    desc: 'Issues with account login, verification, agreements, or technical support',
  },
]

export default function CustomerServiceView({
  user,
  onOpenAuth,
  onOpenListingDetail,
}: CustomerServiceViewProps) {
  const isAdmin = user?.role === 'ADMIN'
  const [activeTab, setActiveTab] = useState<'investigate' | 'file' | 'track' | 'faq'>(
    user?.role === 'ADMIN' ? 'investigate' : 'file'
  )

  // Form states
  const [category, setCategory] = useState(COMPLAINT_CATEGORIES[0].id)
  const [subject, setSubject] = useState('')
  const [lodgeName, setLodgeName] = useState('')
  const [accusedPerson, setAccusedPerson] = useState('')
  const [disputedAmount, setDisputedAmount] = useState('')
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM')
  const [description, setDescription] = useState('')
  const [contactPhone, setContactPhone] = useState(user?.phone || '')
  const [contactEmail, setContactEmail] = useState(user?.email || '')
  const [submitting, setSubmitting] = useState(false)

  // Tracked tickets
  const [tickets, setTickets] = useState<ComplaintTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<ComplaintTicket | null>(null)
  const [ticketSearch, setTicketSearch] = useState('')
  const [adminStatusFilter, setAdminStatusFilter] = useState<'ALL' | 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'>('ALL')
  const [resolvingTicket, setResolvingTicket] = useState<ComplaintTicket | null>(null)
  const [resolutionAction, setResolutionAction] = useState<'RESOLVED' | 'DISMISSED' | null>(null)
  const [resolutionNotesInput, setResolutionNotesInput] = useState('')
  const [updatingTicket, setUpdatingTicket] = useState(false)

  // Prefill contact info when user logs in
  useEffect(() => {
    if (user?.email) setContactEmail(user.email)
    if (user?.phone) setContactPhone(user.phone)
    if (user?.role === 'ADMIN') setActiveTab('investigate')
  }, [user])

  // Load existing tickets
  async function fetchTickets() {
    setLoadingTickets(true)
    try {
      let data: any = null
      if (isAdmin) {
        const resAdmin = await fetch('/api/admin/complaints')
        if (resAdmin.ok) data = await resAdmin.json()
      }
      if (!data) {
        const res = await fetch('/api/support')
        if (res.ok) data = await res.json()
      }
      if (data) {
        const list = data.complaints || data.tickets || []
        setTickets(list)
      }
    } catch (err: any) {
      console.warn('[Support fetch error]', err)
    } finally {
      setLoadingTickets(false)
    }
  }

  // Admin action handler: update complaint status and add resolution notes
  async function handleAdminUpdateStatus(ticket: ComplaintTicket, status: 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED', notes?: string) {
    setUpdatingTicket(true)
    try {
      let res = await fetch('/api/admin/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.ticketId, status, resolutionNotes: notes }),
      })
      if (!res.ok) {
        res = await fetch('/api/support', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: ticket.ticketId, status, resolutionNotes: notes }),
        })
      }
      const data = await res.json()
      if (res.ok && (data.success || data.ticket)) {
        toast.success(`Complaint #${ticket.ticketId} status updated to ${status}`)
        setTickets((prev) =>
          prev.map((t) => (t.ticketId === ticket.ticketId ? { ...t, status, resolutionNotes: notes, updatedAt: new Date().toISOString() } : t))
        )
        if (selectedTicket?.ticketId === ticket.ticketId) {
          setSelectedTicket((prev) => prev ? { ...prev, status, resolutionNotes: notes, updatedAt: new Date().toISOString() } : null)
        }
        setResolvingTicket(null)
        setResolutionAction(null)
        setResolutionNotesInput('')
      } else {
        toast.error(data.error || 'Failed to update ticket')
      }
    } catch (err: any) {
      toast.error('Error updating ticket: ' + err.message)
    } finally {
      setUpdatingTicket(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [isAdmin])

  // Submit new complaint
  async function handleSubmitComplaint(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      toast.error('Please enter a subject and description of your complaint.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          lodgeName: lodgeName.trim() || undefined,
          accusedPerson: accusedPerson.trim() || undefined,
          description: description.trim(),
          disputedAmount: disputedAmount ? parseFloat(disputedAmount) : undefined,
          urgency,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Complaint submitted successfully!')
        setTickets((prev) => [data.ticket, ...prev])
        setSelectedTicket(data.ticket)
        setActiveTab('track')

        // Reset form
        setSubject('')
        setLodgeName('')
        setAccusedPerson('')
        setDisputedAmount('')
        setDescription('')
      } else {
        toast.error(data.error || 'Failed to submit complaint.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error submitting complaint.')
    } finally {
      setSubmitting(false)
    }
  }

  // Render status badge
  function renderStatusBadge(status: ComplaintTicket['status']) {
    switch (status) {
      case 'OPEN':
        return (
          <Badge className="bg-amber-100 text-[#78350F] border border-amber-300 font-bold text-[10px]">
            🟡 OPEN · UNDER REVIEW
          </Badge>
        )
      case 'INVESTIGATING':
        return (
          <Badge className="bg-sky-100 text-sky-800 border border-sky-300 font-bold text-[10px]">
            🔵 DISPUTE OFFICER ASSIGNED
          </Badge>
        )
      case 'RESOLVED':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
            🟢 RESOLVED
          </Badge>
        )
      case 'DISMISSED':
      default:
        return (
          <Badge className="bg-stone-100 text-stone-700 border border-stone-300 font-bold text-[10px]">
            ⚪ CLOSED
          </Badge>
        )
    }
  }

  // Render urgency badge
  function renderUrgencyBadge(urgency: ComplaintTicket['urgency']) {
    switch (urgency) {
      case 'CRITICAL':
        return (
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-300">
            CRITICAL
          </span>
        )
      case 'HIGH':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300">
            HIGH
          </span>
        )
      case 'MEDIUM':
        return (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-[#78350F] border border-amber-200">
            MEDIUM
          </span>
        )
      case 'LOW':
      default:
        return (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
            ROUTINE
          </span>
        )
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#FAF7F2] text-[#271810] overflow-hidden select-none">
      {/* =========================================================================
          TOP APP BAR: Customer Service Center Brand & Fast Support Links
         ========================================================================= */}
      <header className="shrink-0 bg-white border-b border-[#E5DAC8] px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#78350F] to-[#B45309] text-white flex items-center justify-center shrink-0 shadow-xs">
            <LifeBuoy className="h-4 w-4 text-amber-200" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-[#271810] truncate">
                {isAdmin ? 'Admin Complaints Desk' : 'Customer Service Center'}
              </h1>
              <Badge className={isAdmin ? "bg-amber-100 text-[#78350F] border border-amber-300 text-[9px] font-bold" : "bg-emerald-50 text-emerald-800 border border-emerald-300 text-[9px] font-semibold"}>
                {isAdmin ? '🛡️ Admin Center' : <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" /> Live Desk</>}
              </Badge>
            </div>
            <p className="text-[10px] text-[#7C6859] truncate">
              {isAdmin
                ? 'Review, investigate, and enforce resolutions on tenant complaints & fee disputes'
                : 'Dispute resolution · 5% fee cap protection · Fraud reporting · 24/7 assistance'}
            </p>
          </div>
        </div>

        {/* Quick Emergency Hotlines */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href="https://wa.me/2348000000000?text=Hello%20Mapstar%20Dispute%20Desk%2C%20I%20need%20assistance%20with%20a%20lodge%20dispute"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">WhatsApp Support</span>
          </a>

          <a
            href="tel:+2348000000000"
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#78350F] hover:bg-[#854D0E] text-white text-xs font-bold shadow-xs transition"
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Hotline</span>
          </a>
        </div>
      </header>

      {/* =========================================================================
          NAVIGATION TABS: Admin Investigation vs Student Complaint / FAQ
         ========================================================================= */}
      <nav className="shrink-0 bg-white border-b border-[#E5DAC8] px-4 py-1.5">
        {isAdmin ? (
          <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl max-w-lg mx-auto sm:mx-0">
            <button
              onClick={() => {
                setActiveTab('investigate')
                fetchTickets()
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'investigate'
                  ? 'bg-[#78350F] text-white shadow-xs'
                  : 'text-[#7C6859] hover:text-[#271810]'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Investigate Complaints</span>
              {tickets.length > 0 && (
                <Badge className="h-4 px-1.5 bg-rose-500 text-white text-[9px] font-bold">
                  {tickets.filter((t) => t.status === 'OPEN').length || tickets.length}
                </Badge>
              )}
            </button>

            <button
              onClick={() => setActiveTab('faq')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'faq'
                  ? 'bg-[#78350F] text-white shadow-xs'
                  : 'text-[#7C6859] hover:text-[#271810]'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              <span>5% Fee Cap Law</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl max-w-lg mx-auto sm:mx-0">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'file'
                  ? 'bg-[#78350F] text-white shadow-xs'
                  : 'text-[#7C6859] hover:text-[#271810]'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>File Complaint</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('track')
                fetchTickets()
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition relative ${
                activeTab === 'track'
                  ? 'bg-[#78350F] text-white shadow-xs'
                  : 'text-[#7C6859] hover:text-[#271810]'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Track Complaints</span>
              {tickets.length > 0 && (
                <Badge className="h-4 px-1 bg-amber-500 text-white text-[9px] font-bold">
                  {tickets.length}
                </Badge>
              )}
            </button>

            <button
              onClick={() => setActiveTab('faq')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'faq'
                  ? 'bg-[#78350F] text-white shadow-xs'
                  : 'text-[#7C6859] hover:text-[#271810]'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Rights & FAQs</span>
            </button>
          </div>
        )}
      </nav>

      {/* =========================================================================
          MAIN BODY
         ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* =====================================================================
              TAB: ADMIN INVESTIGATE COMPLAINTS (Admin Center View)
             ===================================================================== */}
          {activeTab === 'investigate' && (
            <div className="space-y-4">
              {/* Admin Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white border border-[#E5DAC8] rounded-xl p-3 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-[#7C6859]">Total Cases</span>
                  <div className="text-lg font-extrabold text-[#271810] mt-0.5">{tickets.length}</div>
                </div>
                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-rose-800">Open Disputes</span>
                  <div className="text-lg font-extrabold text-rose-700 mt-0.5">
                    {tickets.filter((t) => t.status === 'OPEN').length}
                  </div>
                </div>
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-amber-800">Investigating</span>
                  <div className="text-lg font-extrabold text-[#78350F] mt-0.5">
                    {tickets.filter((t) => t.status === 'INVESTIGATING').length}
                  </div>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-emerald-800">Resolved</span>
                  <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
                    {tickets.filter((t) => t.status === 'RESOLVED').length}
                  </div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="bg-white border border-[#E5DAC8] rounded-2xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C6859]" />
                  <Input
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Search by ticket #, tenant, phone, lodge, or accused..."
                    className="pl-8 h-8 text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-xl w-full"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {(['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setAdminStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        adminStatusFilter === st
                          ? 'bg-[#78350F] text-white'
                          : 'bg-[#FAF7F2] text-[#7C6859] hover:text-[#271810]'
                      }`}
                    >
                      {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                    </button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchTickets}
                    disabled={loadingTickets}
                    className="h-7 text-xs border-[#E5DAC8] text-[#78350F] hover:bg-[#FAF7F2] shrink-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingTickets ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Tickets List */}
              <div className="space-y-3">
                {tickets
                  .filter((t) => {
                    if (adminStatusFilter !== 'ALL' && t.status !== adminStatusFilter) return false
                    if (ticketSearch.trim()) {
                      const q = ticketSearch.toLowerCase()
                      const match =
                        t.ticketId.toLowerCase().includes(q) ||
                        t.subject.toLowerCase().includes(q) ||
                        t.userName.toLowerCase().includes(q) ||
                        (t.userPhone && t.userPhone.includes(q)) ||
                        (t.lodgeName && t.lodgeName.toLowerCase().includes(q)) ||
                        (t.accusedPerson && t.accusedPerson.toLowerCase().includes(q))
                      if (!match) return false
                    }
                    return true
                  })
                  .map((t) => {
                    const waLink = t.userPhone ? `https://wa.me/234${t.userPhone.replace(/^0/, '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, this is Mapstar Dispute Resolution regarding ticket #${t.ticketId}.`)}` : null

                    return (
                      <div
                        key={t.ticketId}
                        className="bg-white border border-[#E5DAC8] hover:border-[#78350F] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E5DAC8]/60">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-[#78350F]">
                              #{t.ticketId}
                            </span>
                            {renderStatusBadge(t.status)}
                            {renderUrgencyBadge(t.urgency)}
                            <Badge className="bg-[#FAF7F2] text-[#78350F] border border-[#E5DAC8] text-[10px]">
                              {t.category}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-[#7C6859]">
                            {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-[#271810]">{t.subject}</h3>
                          <div className="mt-1.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DAC8] text-xs text-[#271810] leading-relaxed whitespace-pre-wrap">
                            {t.description}
                          </div>
                        </div>

                        {/* Complainant & Incident Meta */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                            <span className="text-[10px] uppercase font-bold text-[#7C6859] block">Complainant</span>
                            <div className="font-bold text-[#271810]">{t.userName}</div>
                            <div className="text-[11px] text-[#7C6859] truncate">{t.userEmail}</div>
                            {t.userPhone && <div className="text-[11px] font-mono text-amber-800">{t.userPhone}</div>}
                          </div>

                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                            <span className="text-[10px] uppercase font-bold text-[#7C6859] block">Property & Opposing Party</span>
                            <div className="font-bold text-[#78350F]">{t.lodgeName || 'Lodge not specified'}</div>
                            <div className="text-[11px] text-rose-700 font-semibold">{t.accusedPerson ? `Accused: ${t.accusedPerson}` : 'No person specified'}</div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                            <span className="text-[10px] uppercase font-bold text-[#7C6859] block">Disputed Amount</span>
                            <div className="font-extrabold text-amber-800 text-sm">
                              {t.disputedAmount ? formatNaira(t.disputedAmount) : 'None reported'}
                            </div>
                          </div>
                        </div>

                        {/* Resolution notes if present */}
                        {t.resolutionNotes && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-0.5">
                            <span className="font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Resolution Note:
                            </span>
                            <p className="text-[11px] leading-relaxed">{t.resolutionNotes}</p>
                          </div>
                        )}

                        {/* Admin Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5DAC8]/60">
                          <div className="flex items-center gap-1.5">
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                              >
                                <MessageCircle className="h-3 w-3" /> WhatsApp
                              </a>
                            )}
                            {t.userPhone && (
                              <a
                                href={`tel:${t.userPhone}`}
                                className="inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-[#FAF7F2] border border-[#E5DAC8] text-[#271810] text-xs font-semibold hover:bg-white transition"
                              >
                                <Phone className="h-3 w-3" /> Call
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {t.status !== 'INVESTIGATING' && t.status !== 'RESOLVED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAdminUpdateStatus(t, 'INVESTIGATING', 'Officer assigned and investigating claim.')}
                                disabled={updatingTicket}
                                className="h-7 text-xs border-amber-300 bg-amber-50 text-[#78350F] hover:bg-amber-100 cursor-pointer"
                              >
                                <Clock className="h-3 w-3 mr-1" /> Mark Investigating
                              </Button>
                            )}

                            <Button
                              size="sm"
                              onClick={() => {
                                setResolvingTicket(t)
                                setResolutionAction('RESOLVED')
                                setResolutionNotesInput(t.resolutionNotes || '')
                              }}
                              disabled={updatingTicket}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Enforce Resolution
                            </Button>

                            {t.status !== 'DISMISSED' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setResolvingTicket(t)
                                  setResolutionAction('DISMISSED')
                                  setResolutionNotesInput('')
                                }}
                                disabled={updatingTicket}
                                className="h-7 text-xs text-[#7C6859] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              >
                                Dismiss
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                {tickets.length === 0 && !loadingTickets && (
                  <div className="bg-white border border-[#E5DAC8] rounded-2xl p-12 text-center text-[#7C6859]">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#271810]">No Complaints Filed</p>
                    <p className="text-xs text-[#7C6859] mt-1">All complaints filed from customer service will appear here for review.</p>
                  </div>
                )}
              </div>
            </div>
          )}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* =====================================================================
              TAB 1: FILE A COMPLAINT / REPORT DISPUTE
             ===================================================================== */}
          {activeTab === 'file' && (
            <div className="space-y-6">
              {/* Consumer Warning Banner */}
              <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-[#78350F] flex items-center justify-center shrink-0">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#78350F]">
                    Mapstar Zero-Tolerance Protection Guarantee
                  </h3>
                  <p className="text-xs text-[#7C6859] leading-relaxed">
                    Mapstar legally caps all inspection agency fees at a maximum of <strong>5%</strong>. Demanding 10%–20%, double inspection fees, or ghost listings is illegal. All complaints are investigated by certified dispute officers within 24 hours.
                  </p>
                </div>
              </div>

              {/* Complaint Submission Form Card */}
              <div className="bg-white border border-[#E5DAC8] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                <div>
                  <h2 className="text-base font-extrabold text-[#271810]">
                    Submit a Formal Complaint or Dispute
                  </h2>
                  <p className="text-xs text-[#7C6859] mt-0.5">
                    Provide details below. A unique tracking reference will be generated for your case.
                  </p>
                </div>

                <form onSubmit={handleSubmitComplaint} className="space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label className="text-xs font-bold text-[#271810] block mb-2">
                      Complaint Category *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {COMPLAINT_CATEGORIES.map((cat) => {
                        const isSelected = category === cat.id
                        return (
                          <div
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                              isSelected
                                ? 'bg-amber-50/80 border-[#78350F] ring-1 ring-[#78350F] shadow-2xs'
                                : 'bg-[#FAF7F2]/50 border-[#E5DAC8] hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <span className="text-xs font-bold text-[#271810]">{cat.label}</span>
                            <span className="text-[10px] text-[#7C6859] mt-1 line-clamp-2">{cat.desc}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-xs font-bold text-[#271810] block mb-1">
                      Subject / Complaint Title *
                    </label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Agent demanded ₦20,000 inspection fee for Silver Crest Lodge"
                      className="h-10 text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-xl focus:border-[#78350F]"
                      required
                    />
                  </div>

                  {/* Optional Lodge Name & Accused Person */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#271810] block mb-1">
                        Lodge / Property Name (Optional)
                      </label>
                      <Input
                        value={lodgeName}
                        onChange={(e) => setLodgeName(e.target.value)}
                        placeholder="e.g. Silver Crest Lodge or Hilltop Villa"
                        className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#271810] block mb-1">
                        Agent or Landlord Name / Phone (Optional)
                      </label>
                      <Input
                        value={accusedPerson}
                        onChange={(e) => setAccusedPerson(e.target.value)}
                        placeholder="e.g. Victor O. (+234 809...)"
                        className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Disputed Amount & Urgency */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#271810] block mb-1">
                        Disputed Amount in Naira (Optional)
                      </label>
                      <Input
                        type="number"
                        value={disputedAmount}
                        onChange={(e) => setDisputedAmount(e.target.value)}
                        placeholder="e.g. 25000"
                        className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#271810] block mb-1">
                        Urgency Level *
                      </label>
                      <select
                        value={urgency}
                        onChange={(e: any) => setUrgency(e.target.value)}
                        className="w-full h-9 text-xs bg-[#FAF7F2] border border-[#E5DAC8] rounded-xl px-2.5 text-[#271810] font-semibold"
                      >
                        <option value="LOW">Routine (General Inquiry / Feedback)</option>
                        <option value="MEDIUM">Medium (Standard 24h Review)</option>
                        <option value="HIGH">High (Active Fee Extortion / Ongoing Dispute)</option>
                        <option value="CRITICAL">Critical (Scam / Threat of Eviction / Fraud)</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold text-[#271810] block mb-1">
                      Detailed Explanation of What Happened *
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please state what happened in detail, including dates, terms agreed, amount paid, and receipts available..."
                      className="text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-xl resize-none h-28 leading-relaxed"
                      required
                    />
                  </div>

                  {/* Contact Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#271810] block mb-1">
                        Your WhatsApp / Phone Number
                      </label>
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="e.g. +234 803 123 4567"
                        className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#271810] block mb-1">
                        Your Email Address
                      </label>
                      <Input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. student@gmail.com"
                        className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-[#7C6859]">
                      Submitted complaints are securely stored in the Mapstar legal audit vault.
                    </p>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-10 px-6 bg-[#78350F] hover:bg-[#854D0E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer shrink-0"
                    >
                      {submitting ? 'Submitting…' : 'Submit Formal Complaint'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 2: TRACK MY COMPLAINTS & TICKETS
             ===================================================================== */}
          {activeTab === 'track' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C6859]" />
                  <Input
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Search by ticket # or subject..."
                    className="pl-8 h-8 text-xs bg-white border-[#E5DAC8] rounded-xl"
                  />
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchTickets}
                  disabled={loadingTickets}
                  className="h-8 text-xs border-[#E5DAC8] text-[#78350F] hover:bg-white cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingTickets ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Tickets List */}
              <div className="space-y-3">
                {tickets
                  .filter(
                    (t) =>
                      t.ticketId.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                      t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                      t.category.toLowerCase().includes(ticketSearch.toLowerCase())
                  )
                  .map((t) => (
                    <div
                      key={t.ticketId}
                      onClick={() => setSelectedTicket(t)}
                      className="bg-white border border-[#E5DAC8] hover:border-[#78350F] rounded-2xl p-4 sm:p-5 transition shadow-2xs cursor-pointer space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#78350F]">
                            #{t.ticketId}
                          </span>
                          {renderStatusBadge(t.status)}
                          {renderUrgencyBadge(t.urgency)}
                        </div>
                        <span className="text-[10px] text-[#7C6859]">
                          Filed on {new Date(t.createdAt).toLocaleDateString()} at{' '}
                          {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-[#271810]">{t.subject}</h3>
                        <p className="text-xs text-[#7C6859] line-clamp-2 mt-1 leading-relaxed">
                          {t.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#E5DAC8]/60 text-xs text-[#7C6859] gap-2">
                        <div className="flex items-center gap-3">
                          {t.lodgeName && (
                            <span className="flex items-center gap-1 text-[#78350F] font-semibold">
                              <Building className="h-3 w-3" /> {t.lodgeName}
                            </span>
                          )}
                          {t.disputedAmount && (
                            <span className="font-bold text-amber-700">
                              Disputed: {formatNaira(t.disputedAmount)}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-bold text-[#78350F] flex items-center gap-1">
                          View Case Details <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}

                {tickets.length === 0 && !loadingTickets && (
                  <div className="bg-white border border-[#E5DAC8] rounded-2xl p-12 text-center text-[#7C6859]">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600 mb-2" />
                    <p className="text-sm font-bold text-[#271810]">No Complaints Logged</p>
                    <p className="text-xs text-[#7C6859] mt-1">
                      You currently have no active complaints or dispute cases.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('file')}
                      className="mt-4 h-8 bg-[#78350F] text-white text-xs font-bold"
                    >
                      File a New Complaint
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 3: CONSUMER RIGHTS, 5% CAP & TENANCY FAQs
             ===================================================================== */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E5DAC8] rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#271810] flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[#78350F]" />
                  Tenants Protection & Fee Regulations Guide
                </h3>

                <div className="space-y-3 divide-y divide-[#E5DAC8]/60 text-xs text-[#7C6859]">
                  <div className="pt-3 first:pt-0 space-y-1">
                    <h4 className="font-bold text-[#271810] text-xs">
                      What is the legal 5% Mapstar Agent Fee Cap?
                    </h4>
                    <p className="leading-relaxed">
                      Under Mapstar platform regulations and State Tenancy consumer standards, certified agents are strictly prohibited from demanding more than 5% of annual rent. If an agent asks for 10%, 15%, or 20%, file an immediate complaint with evidence for automatic fee refund and agent sanction.
                    </p>
                  </div>

                  <div className="pt-3 space-y-1">
                    <h4 className="font-bold text-[#271810] text-xs">
                      What should I do if a lodge photos were fake or scam?
                    </h4>
                    <p className="leading-relaxed">
                      Do not pay any deposit without physical verification. Report the listing under &apos;Fake Lodge / Fraud&apos;. Our dispute officers will dispatch a physical verification team and permanently delist the offending profile.
                    </p>
                  </div>

                  <div className="pt-3 space-y-1">
                    <h4 className="font-bold text-[#271810] text-xs">
                      How are caution fees refunded?
                    </h4>
                    <p className="leading-relaxed">
                      Caution deposits are legally held in trust to cover verified damages at move-out. Landlords must present itemized receipts of actual damage within 14 days of tenancy expiration, or refund the caution deposit in full.
                    </p>
                  </div>

                  <div className="pt-3 space-y-1">
                    <h4 className="font-bold text-[#271810] text-xs">
                      How long does dispute resolution take?
                    </h4>
                    <p className="leading-relaxed">
                      Urgent and Critical complaints are picked up within 2 to 4 hours. General disputes are investigated and mediated within 24 to 48 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* =========================================================================
          MODAL: Detailed Ticket Viewer & Resolution Notes
         ========================================================================= */}
      {selectedTicket && (
        <Dialog open={Boolean(selectedTicket)} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-lg bg-white border-[#E5DAC8] text-[#271810] rounded-2xl p-5">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#78350F]">
                  Case #{selectedTicket.ticketId}
                </span>
                {renderStatusBadge(selectedTicket.status)}
              </div>
              <DialogTitle className="text-base font-bold mt-1">
                {selectedTicket.subject}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#7C6859]">
                Filed by {selectedTicket.userName} on {new Date(selectedTicket.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 mt-3 text-xs">
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E5DAC8] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#7C6859]">Category:</span>
                  <span className="font-bold text-[#271810]">{selectedTicket.category}</span>
                </div>
                {selectedTicket.lodgeName && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#7C6859]">Lodge:</span>
                    <span className="font-bold text-[#78350F]">{selectedTicket.lodgeName}</span>
                  </div>
                )}
                {selectedTicket.accusedPerson && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#7C6859]">Opposing Party:</span>
                    <span className="font-bold text-rose-700">{selectedTicket.accusedPerson}</span>
                  </div>
                )}
                {selectedTicket.disputedAmount && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#7C6859]">Amount Disputed:</span>
                    <span className="font-bold text-amber-800">{formatNaira(selectedTicket.disputedAmount)}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="font-bold text-[#271810] block mb-1">Full Statement:</span>
                <p className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.resolutionNotes && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Resolution Action:
                  </span>
                  <p className="text-emerald-800 text-xs leading-relaxed">
                    {selectedTicket.resolutionNotes}
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedTicket(null)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Close
                </Button>
                {isAdmin ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setResolvingTicket(selectedTicket)
                      setResolutionAction('RESOLVED')
                      setResolutionNotesInput(selectedTicket.resolutionNotes || '')
                      setSelectedTicket(null)
                    }}
                    className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Enforce Resolution
                  </Button>
                ) : (
                  <a
                    href={`https://wa.me/2348000000000?text=Hello%20Mapstar%20Officer%2C%20following%20up%20on%20Complaint%20%23${selectedTicket.ticketId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat with Dispute Officer
                  </a>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          ADMIN ACTION DIALOG: Enforce Resolution & Refund or Dismiss
         ========================================================================= */}
      {resolvingTicket && (
        <Dialog open={Boolean(resolvingTicket)} onOpenChange={() => setResolvingTicket(null)}>
          <DialogContent className="max-w-md bg-white border-[#E5DAC8] text-[#271810] rounded-2xl p-5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
                {resolutionAction === 'RESOLVED' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Enforce Resolution for #{resolvingTicket.ticketId}</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-rose-600" />
                    <span>Dismiss Complaint #{resolvingTicket.ticketId}</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#7C6859]">
                {resolutionAction === 'RESOLVED'
                  ? 'Record settlement, excess fee refund, or disciplinary warning to landlord/agent.'
                  : 'Document legal reason for dismissing this complaint.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E5DAC8] space-y-1">
                <div className="font-bold text-[#271810]">{resolvingTicket.subject}</div>
                <div className="text-[11px] text-[#7C6859]">
                  Complainant: <span className="font-semibold text-[#271810]">{resolvingTicket.userName}</span>
                  {resolvingTicket.disputedAmount ? ` · Disputed: ${formatNaira(resolvingTicket.disputedAmount)}` : ''}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#271810] block mb-1">
                  {resolutionAction === 'RESOLVED' ? 'Resolution & Refund Notes (Visible to Customer):' : 'Dismissal Justification:'}
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotesInput}
                  onChange={(e) => setResolutionNotesInput(e.target.value)}
                  placeholder={
                    resolutionAction === 'RESOLVED'
                      ? 'e.g. Landlord refunded ₦38,888 excess inspection fees. Official sanction issued to agent.'
                      : 'e.g. Tenancy fee within 5% cap. Complaint unsubstantiated.'
                  }
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E5DAC8] text-xs text-[#271810] placeholder:text-[#7C6859] focus:border-[#78350F] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setResolvingTicket(null)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={updatingTicket}
                  onClick={() => {
                    if (resolvingTicket && resolutionAction) {
                      handleAdminUpdateStatus(resolvingTicket, resolutionAction, resolutionNotesInput.trim() || undefined)
                    }
                  }}
                  className={`h-8 text-xs font-bold text-white shadow-xs cursor-pointer ${
                    resolutionAction === 'RESOLVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {updatingTicket ? 'Saving…' : resolutionAction === 'RESOLVED' ? 'Enforce & Resolve' : 'Confirm Dismissal'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

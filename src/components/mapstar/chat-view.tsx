'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users,
  MessageSquare,
  Send,
  Shield,
  Building,
  GraduationCap,
  Sparkles,
  Phone,
  CheckCircle2,
  Building2,
  X,
  Plus,
  ArrowLeft,
  Search,
  Lightbulb,
  Radio,
  Globe,
  Trash2,
  LogIn,
  RefreshCw,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AuthedUser } from '@/components/mapstar/login-signup-dialog'
import { MOCK_LISTINGS, MockListing, formatNaira } from '@/lib/mock-data'
import { toast } from 'sonner'

export type SocialTab = 'world' | 'dms' | 'groups' | 'channels'

export interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  senderName: string
  senderRole: 'TENANT' | 'LANDLORD' | 'AGENT' | 'ADMIN'
  content: string
  createdAt: string
  attachedLodgeId?: string
  reactions?: Record<string, number>
}

interface ChatViewProps {
  user: AuthedUser | null
  onOpenAuth: (mode?: 'login' | 'signup') => void
  onOpenListingDetail?: (listingId: string) => void
}

// ---------------------------------------------------------------------------
// 1. Stories / Status Highlights (Property Drops)
// ---------------------------------------------------------------------------
interface PropertyStory {
  id: string
  title: string
  tag: string
  author: string
  role: 'LANDLORD' | 'AGENT' | 'ADMIN'
  image: string
  price: string
  location: string
  verified: boolean
}

const PROPERTY_STORIES: PropertyStory[] = [
  {
    id: 'story-1',
    title: 'Instant Drop: 1-Bed Flat',
    tag: '⚡ 0% Fee',
    author: 'Chief Emeka',
    role: 'LANDLORD',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80',
    price: '₦220,000/yr',
    location: 'IMSU Front Gate, Owerri',
    verified: true,
  },
  {
    id: 'story-2',
    title: 'Roommate Match (Girls Only)',
    tag: '🤝 Split 50/50',
    author: 'Adaeze (Student)',
    role: 'ADMIN',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80',
    price: '₦90,000/yr each',
    location: 'FUTO Eziobodo, Owerri',
    verified: true,
  },
  {
    id: 'story-3',
    title: 'Self-Con with Borehole',
    tag: '💧 24/7 Water',
    author: 'Mrs. Nwosu',
    role: 'LANDLORD',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop&q=80',
    price: '₦280,000/yr',
    location: 'UNN Hilltop, Nsukka',
    verified: true,
  },
  {
    id: 'story-4',
    title: 'Verified Group Tour',
    tag: '🛡️ 5% Capped',
    author: 'Engr. Victor',
    role: 'AGENT',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format&fit=crop&q=80',
    price: '3 Lodges Inspected',
    location: "Bishop's Court, Owerri",
    verified: true,
  },
]

// ---------------------------------------------------------------------------
// 2. DM Contacts
// ---------------------------------------------------------------------------
interface DMContact {
  id: string
  name: string
  role: 'LANDLORD' | 'AGENT' | 'TENANT' | 'ADMIN'
  avatar: string
  channelId: string
  listingTitle?: string
  listingId?: string
  phone?: string
  unreadCount?: number
  lastMessage: string
  lastTime: string
  verified: boolean
}

const DM_CONTACTS: DMContact[] = [
  {
    id: 'dm-emeka',
    name: 'Chief Emeka',
    role: 'LANDLORD',
    avatar: 'CE',
    channelId: 'dm-landlord-emeka',
    listingTitle: 'Silver Crest Lodge (IMSU)',
    listingId: 'mock-1',
    phone: '+2348031234567',
    unreadCount: 1,
    lastMessage: 'Yes, the self-con is still vacant. You can inspect today by 2 PM.',
    lastTime: '10:45 AM',
    verified: true,
  },
  {
    id: 'dm-victor',
    name: 'Engr. Victor',
    role: 'AGENT',
    avatar: 'EV',
    channelId: 'dm-agent-victor',
    listingTitle: 'Royal Palms Villa (FUTO)',
    listingId: 'mock-2',
    phone: '+2348098765432',
    unreadCount: 0,
    lastMessage: 'All inspection fees are legally capped at 5%. Let me know when you arrive.',
    lastTime: 'Yesterday',
    verified: true,
  },
  {
    id: 'dm-chidi',
    name: 'Chidi Okonkwo',
    role: 'TENANT',
    avatar: 'CO',
    channelId: 'dm-student-chidi',
    listingTitle: 'Green Valley Suites',
    listingId: 'mock-3',
    unreadCount: 0,
    lastMessage: 'Hey bro, are you interested in co-sharing the 2-bedroom unit?',
    lastTime: '2d ago',
    verified: false,
  },
]

// ---------------------------------------------------------------------------
// 3. Groups List
// ---------------------------------------------------------------------------
interface GroupChannel {
  id: string
  name: string
  category: string
  membersCount: number
  desc: string
  pinnedLodgeId?: string
  lastMessage?: string
  lastTime?: string
}

const GROUPS_LIST: GroupChannel[] = [
  {
    id: 'group-imsu-hunters',
    name: "IMSU Front Gate & Bishop's Court",
    category: 'IMSU Community',
    membersCount: 1240,
    desc: 'Lodge availability, price reports, and landlord contacts around IMSU',
    pinnedLodgeId: 'mock-1',
    lastMessage: 'Chief Emeka just dropped 2 self-cons at Silver Crest Lodge',
    lastTime: '12m ago',
  },
  {
    id: 'group-futo-eziobodo',
    name: 'FUTO Eziobodo & Ihiagwa Hunters',
    category: 'FUTO Community',
    membersCount: 980,
    desc: 'Off-campus housing, light/water updates, and roommate searches',
    pinnedLodgeId: 'mock-2',
    lastMessage: 'Any lodges with reliable transformer light right now?',
    lastTime: '45m ago',
  },
  {
    id: 'group-roommates-hub',
    name: 'Nigeria Roommate Match Hub 🤝',
    category: 'Roommate Match',
    membersCount: 1520,
    desc: 'Find compatible co-tenants to split annual rent 50/50 safely',
    lastMessage: 'Looking for a clean male flatmate around Hilltop',
    lastTime: '1h ago',
  },
  {
    id: 'group-unn-hilltop',
    name: 'UNN Hilltop & Odim Gate Students',
    category: 'UNN Nsukka',
    membersCount: 850,
    desc: 'Verified student hostels & self-con apartments around UNN campus',
    pinnedLodgeId: 'mock-3',
    lastMessage: 'Water supply restored at Green Valley Suites',
    lastTime: '3h ago',
  },
]

// ---------------------------------------------------------------------------
// 4. Broadcast Channels
// ---------------------------------------------------------------------------
interface BroadcastChannel {
  id: string
  name: string
  subscribers: string
  verifiedOrg: string
  desc: string
  badgeText: string
  lastMessage?: string
  lastTime?: string
}

const BROADCAST_CHANNELS: BroadcastChannel[] = [
  {
    id: 'channel-instant-drops',
    name: 'Instant Lodge Drops ⚡',
    subscribers: '14.2k',
    verifiedOrg: 'Mapstar Verified',
    desc: 'Instant alerts when verified 0% fee self-cons drop on the map',
    badgeText: '0% FEE',
    lastMessage: '3 newly completed self-cons listed in IMSU at ₦220k',
    lastTime: '15m ago',
  },
  {
    id: 'channel-landlords-bulletin',
    name: 'Landlords Direct Notice Board 🏛️',
    subscribers: '8.9k',
    verifiedOrg: 'Property Owners Guild',
    desc: 'Direct landlord vacancies and semester renewals',
    badgeText: 'DIRECT',
    lastMessage: 'Official rent payment window opens next Monday',
    lastTime: '2h ago',
  },
  {
    id: 'channel-agent-tours',
    name: 'Inspection Tours 🛡️',
    subscribers: '6.5k',
    verifiedOrg: 'Licensed Agents Council',
    desc: 'Regulated group inspections with strictly capped 5% fees',
    badgeText: '5% CAP',
    lastMessage: 'Saturday group inspection schedule for Eziobodo lodges is ready',
    lastTime: 'Yesterday',
  },
]

// Default initial fallback community messages
const INITIAL_WORLD_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    channelId: 'world-square',
    senderId: 'user-emeka',
    senderName: 'Chief Emeka',
    senderRole: 'LANDLORD',
    content: 'Good day students! 2 new self-contained units just opened up at Silver Crest Lodge near IMSU front gate. Clean borehole water, prepaid meter, and zero agency fee.',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    attachedLodgeId: 'mock-1',
    reactions: { '👍': 4, '🏠': 2 },
  },
  {
    id: 'msg-init-2',
    channelId: 'world-square',
    senderId: 'user-victor',
    senderName: 'Engr. Victor',
    senderRole: 'AGENT',
    content: 'I have 3 verified lodges around FUTO Eziobodo ready for physical inspection. All inspection fees are legally capped at ₦2,000 maximum per Mapstar regulations.',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    attachedLodgeId: 'mock-2',
    reactions: { '🔥': 3 },
  },
  {
    id: 'msg-init-3',
    channelId: 'world-square',
    senderId: 'user-chioma',
    senderName: 'Chioma Eze',
    senderRole: 'TENANT',
    content: "Hello everyone! I am a 200L Nursing student at IMSU looking for a female roommate to share a neat self-con flat around Bishop's court. Budget is ₦120k split.",
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    reactions: { '❤️': 5 },
  },
]

export default function ChatView({ user, onOpenAuth, onOpenListingDetail }: ChatViewProps) {
  const [activeTab, setActiveTab] = useState<SocialTab>('world')
  const [activeDM, setActiveDM] = useState<DMContact | null>(null)
  const [activeGroup, setActiveGroup] = useState<GroupChannel | null>(null)
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastChannel | null>(null)

  // Current active channel identifier
  const [currentChannelId, setCurrentChannelId] = useState('world-square')

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_WORLD_MESSAGES)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [selectedLodgeToAttach, setSelectedLodgeToAttach] = useState<MockListing | null>(null)
  const [attachModalOpen, setAttachModalOpen] = useState(false)
  const [searchLodgeQuery, setSearchLodgeQuery] = useState('')
  const [selectedStory, setSelectedStory] = useState<PropertyStory | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showQuickPrompts, setShowQuickPrompts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.role === 'ADMIN'

  // Update currentChannelId according to active view
  useEffect(() => {
    if (activeTab === 'world') {
      setCurrentChannelId('world-square')
    } else if (activeTab === 'dms') {
      setCurrentChannelId(activeDM?.channelId || '')
    } else if (activeTab === 'groups') {
      setCurrentChannelId(activeGroup?.id || '')
    } else if (activeTab === 'channels') {
      setCurrentChannelId(activeBroadcast?.id || '')
    }
  }, [activeTab, activeDM, activeGroup, activeBroadcast])

  // Fetch messages from Supabase via /api/chat
  async function fetchMessages(channelId: string, showToast = false) {
    if (!channelId) {
      setMessages([])
      return
    }
    try {
      setLoading(true)
      const res = await fetch(`/api/chat?channelId=${encodeURIComponent(channelId)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages)
        } else if (channelId === 'world-square') {
          setMessages(INITIAL_WORLD_MESSAGES)
        } else {
          setMessages([])
        }
        if (showToast) toast.success('Messages refreshed')
      }
    } catch (err: any) {
      console.warn('[Socials fetch error]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentChannelId) {
      fetchMessages(currentChannelId)
    }
  }, [currentChannelId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentChannelId])

  // Background refresh polling every 10s
  useEffect(() => {
    if (!currentChannelId) return
    const timer = setInterval(() => {
      fetch(`/api/chat?channelId=${encodeURIComponent(currentChannelId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.messages && data.messages.length > 0) {
            setMessages(data.messages)
          }
        })
        .catch(() => {})
    }, 10000)
    return () => clearInterval(timer)
  }, [currentChannelId])

  // Send message
  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() && !selectedLodgeToAttach) return
    if (!user) {
      onOpenAuth('login')
      return
    }
    if (!currentChannelId) return

    const trimmed = input.trim()
    const lodgeToAttach = selectedLodgeToAttach
    let formattedContent = trimmed

    if (lodgeToAttach) {
      formattedContent = `[LODGE:${lodgeToAttach.id}] ${trimmed}`.trim()
    }

    setInput('')
    setSelectedLodgeToAttach(null)
    setShowQuickPrompts(false)
    setSending(true)

    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      channelId: currentChannelId,
      senderId: user.id,
      senderName: user.fullName || user.email.split('@')[0],
      senderRole: (user.role as any) || 'TENANT',
      content: formattedContent,
      createdAt: new Date().toISOString(),
      attachedLodgeId: lodgeToAttach?.id,
    }
    setMessages((prev) => [...prev, optimisticMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: currentChannelId,
          content: formattedContent,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to post message')
      }

      const data = await res.json()
      if (data.message) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? data.message : m)))
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not send message')
      setInput(trimmed)
    } finally {
      setSending(false)
    }
  }

  // Handle reaction
  function handleReaction(messageId: string, emoji: string) {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const currentCount = msg.reactions?.[emoji] || 0
          return {
            ...msg,
            reactions: {
              ...(msg.reactions || {}),
              [emoji]: currentCount + 1,
            },
          }
        }
        return msg
      })
    )
  }

  // Admin delete message
  async function handleDeleteMessage(id: string) {
    if (!isAdmin) return
    if (!confirm('Delete this message permanently?')) return

    try {
      setDeletingId(id)
      const res = await fetch(`/api/chat?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setMessages((prev) => prev.filter((m) => m.id !== id))
      toast.success('Message deleted')
    } catch (err: any) {
      toast.error(err.message || 'Error deleting message')
    } finally {
      setDeletingId(null)
    }
  }

  // Helper to parse lodge attachment from content
  function parseLodgeId(content: string): { lodgeId?: string; cleanText: string } {
    const match = content.match(/\[LODGE:(mock-[a-zA-Z0-9_-]+|custom-[a-zA-Z0-9_-]+)\]/)
    if (match) {
      return {
        lodgeId: match[1],
        cleanText: content.replace(match[0], '').trim(),
      }
    }
    return { cleanText: content }
  }

  // Filtered mock listings for attachment dialog
  const filteredLodges = MOCK_LISTINGS.filter(
    (l) =>
      l.title.toLowerCase().includes(searchLodgeQuery.toLowerCase()) ||
      l.area.toLowerCase().includes(searchLodgeQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchLodgeQuery.toLowerCase())
  )

  // Compact role badges
  function renderRoleBadge(role: 'TENANT' | 'LANDLORD' | 'AGENT' | 'ADMIN') {
    switch (role) {
      case 'LANDLORD':
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-[#78350F] border border-amber-200">
            <Building className="h-2.5 w-2.5 text-[#78350F]" />
            Landlord
          </span>
        )
      case 'AGENT':
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Shield className="h-2.5 w-2.5 text-emerald-600" />
            Agent · 5% Cap
          </span>
        )
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold bg-[#78350F] text-white">
            <Sparkles className="h-2.5 w-2.5 text-amber-300" />
            Mapstar Official
          </span>
        )
      case 'TENANT':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium bg-[#EFE9DF] text-[#78350F]">
            <GraduationCap className="h-2.5 w-2.5" />
            Tenant
          </span>
        )
    }
  }

  // Check if we are currently inside an active conversation
  const isInConversation =
    activeTab === 'world' ||
    (activeTab === 'dms' && activeDM !== null) ||
    (activeTab === 'groups' && activeGroup !== null) ||
    (activeTab === 'channels' && activeBroadcast !== null)

  // Current conversation metadata
  const conversationTitle =
    activeTab === 'world'
      ? 'World Square'
      : activeTab === 'dms'
      ? activeDM?.name || 'Direct Message'
      : activeTab === 'groups'
      ? activeGroup?.name || 'Group'
      : activeBroadcast?.name || 'Channel'

  const conversationSubtitle =
    activeTab === 'world'
      ? 'All Nigeria Property Socials'
      : activeTab === 'dms'
      ? activeDM?.listingTitle ? `Regarding: ${activeDM.listingTitle}` : 'Direct Chat'
      : activeTab === 'groups'
      ? `${activeGroup?.membersCount} members · ${activeGroup?.category}`
      : `${activeBroadcast?.subscribers} subscribers`

  return (
    <div className="h-full flex flex-col bg-[#FAF7F2] text-[#271810] overflow-hidden select-none">
      {/* =========================================================================
          TOP APP BAR: Clean & Uncluttered
         ========================================================================= */}
      <header className="shrink-0 bg-white border-b border-[#E5DAC8] px-3 sm:px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {/* Back button when inside a DM / Group / Channel on small screens */}
          {activeTab !== 'world' && isInConversation && (
            <button
              onClick={() => {
                if (activeTab === 'dms') setActiveDM(null)
                if (activeTab === 'groups') setActiveGroup(null)
                if (activeTab === 'channels') setActiveBroadcast(null)
              }}
              className="md:hidden p-1.5 -ml-1 text-[#78350F] hover:bg-[#FAF7F2] rounded-lg transition"
              title="Back to list"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#78350F] flex items-center justify-center text-white shrink-0">
              <Users className="h-4 w-4 text-amber-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-[#271810] truncate">
                  {isInConversation && activeTab !== 'world' ? conversationTitle : 'Mapstar Socials'}
                </h1>
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Live Connection" />
              </div>
              <p className="text-[10px] text-[#7C6859] truncate">
                {isInConversation && activeTab !== 'world' ? conversationSubtitle : 'Connect with tenants, landlords & agents'}
              </p>
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Direct call button if in DM with phone */}
          {activeTab === 'dms' && activeDM?.phone && (
            <a
              href={`tel:${activeDM.phone}`}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Phone className="h-3 w-3" />
              <span className="hidden sm:inline">Call</span>
            </a>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchMessages(currentChannelId, true)}
            className="h-7 w-7 p-0 text-[#7C6859] hover:text-[#271810] hover:bg-[#FAF7F2] rounded-lg cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* =========================================================================
          TAB NAVIGATION: 4 Simple Pills (All / DMs / Groups / Channels)
         ========================================================================= */}
      <nav className="shrink-0 bg-white border-b border-[#E5DAC8] px-3 py-1.5">
        <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('world')
              setActiveDM(null)
              setActiveGroup(null)
              setActiveBroadcast(null)
            }}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'world'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'text-[#7C6859] hover:text-[#271810]'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>World</span>
          </button>

          <button
            onClick={() => setActiveTab('dms')}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition relative ${
              activeTab === 'dms'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'text-[#7C6859] hover:text-[#271810]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>DMs</span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'groups'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'text-[#7C6859] hover:text-[#271810]'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Groups</span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'channels'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'text-[#7C6859] hover:text-[#271810]'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Channels</span>
          </button>
        </div>
      </nav>

      {/* =========================================================================
          SUBTLE STORIES REEL: Compact & Unobtrusive (Shown on World & List views)
         ========================================================================= */}
      {(!isInConversation || activeTab === 'world') && (
        <div className="shrink-0 bg-white/60 border-b border-[#E5DAC8] px-3 py-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAttachModalOpen(true)}
              className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
            >
              <div className="h-11 w-11 rounded-full border border-dashed border-[#78350F] bg-amber-50 flex items-center justify-center text-[#78350F] group-hover:bg-amber-100 transition">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium text-[#78350F]">Drop Lodge</span>
            </button>

            {PROPERTY_STORIES.map((story) => (
              <button
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
              >
                <div className="relative h-11 w-11 rounded-full p-0.5 bg-gradient-to-tr from-[#78350F] to-amber-400 group-hover:scale-105 transition">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="h-full w-full rounded-full object-cover border-2 border-white"
                  />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <span className="text-[10px] text-[#271810] font-medium max-w-[60px] truncate">
                  {story.author.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN CONTENT AREA
         ========================================================================= */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* LIST VIEW for DMs, Groups, and Channels */}
        {activeTab !== 'world' && (
          <div
            className={`w-full md:w-80 md:shrink-0 md:border-r md:border-[#E5DAC8] bg-white flex flex-col overflow-y-auto ${
              isInConversation ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search filter for list items */}
            <div className="p-2 border-b border-[#E5DAC8]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C6859]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="pl-8 h-8 text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-lg"
                />
              </div>
            </div>

            {/* DMs List */}
            {activeTab === 'dms' && (
              <div className="divide-y divide-[#E5DAC8]/50">
                {DM_CONTACTS.filter((dm) =>
                  dm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  dm.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((dm) => {
                  const isSelected = activeDM?.id === dm.id
                  return (
                    <div
                      key={dm.id}
                      onClick={() => setActiveDM(dm)}
                      className={`p-3 cursor-pointer transition flex items-start gap-3 hover:bg-[#FAF7F2] ${
                        isSelected ? 'bg-[#FAF7F2] border-l-4 border-l-[#78350F]' : ''
                      }`}
                    >
                      <div className="relative h-10 w-10 rounded-full bg-[#78350F] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {dm.avatar}
                        {dm.verified && (
                          <CheckCircle2 className="h-3 w-3 text-amber-300 absolute -bottom-0.5 -right-0.5 bg-[#78350F] rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#271810] truncate">{dm.name}</span>
                          <span className="text-[10px] text-[#7C6859] shrink-0">{dm.lastTime}</span>
                        </div>
                        <div className="mt-0.5">{renderRoleBadge(dm.role)}</div>
                        <p className="text-[11px] text-[#7C6859] truncate mt-1">{dm.lastMessage}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Groups List */}
            {activeTab === 'groups' && (
              <div className="divide-y divide-[#E5DAC8]/50">
                {GROUPS_LIST.filter((g) =>
                  g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  g.category.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((grp) => {
                  const isSelected = activeGroup?.id === grp.id
                  return (
                    <div
                      key={grp.id}
                      onClick={() => setActiveGroup(grp)}
                      className={`p-3 cursor-pointer transition flex items-start justify-between gap-2 hover:bg-[#FAF7F2] ${
                        isSelected ? 'bg-[#FAF7F2] border-l-4 border-l-[#78350F]' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#271810] truncate">{grp.name}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#78350F] mt-0.5">
                          <span className="font-semibold">{grp.category}</span>
                          <span className="text-[#7C6859]">· {grp.membersCount} members</span>
                        </div>
                        {grp.lastMessage && (
                          <p className="text-[11px] text-[#7C6859] truncate mt-1">{grp.lastMessage}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#7C6859] shrink-0 mt-1" />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Channels List */}
            {activeTab === 'channels' && (
              <div className="divide-y divide-[#E5DAC8]/50">
                {BROADCAST_CHANNELS.filter((c) =>
                  c.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((chan) => {
                  const isSelected = activeBroadcast?.id === chan.id
                  return (
                    <div
                      key={chan.id}
                      onClick={() => setActiveBroadcast(chan)}
                      className={`p-3 cursor-pointer transition flex items-start justify-between gap-2 hover:bg-[#FAF7F2] ${
                        isSelected ? 'bg-[#FAF7F2] border-l-4 border-l-[#78350F]' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#271810] truncate">{chan.name}</h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-[#78350F]">
                            {chan.badgeText}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#7C6859] mt-0.5">{chan.subscribers} subscribers</p>
                        {chan.lastMessage && (
                          <p className="text-[11px] text-[#7C6859] truncate mt-1">{chan.lastMessage}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#7C6859] shrink-0 mt-1" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* CHAT THREAD CONVERSATION AREA */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-[#FAF7F2] ${
            !isInConversation && activeTab !== 'world' ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {!isInConversation && activeTab !== 'world' ? (
            <div className="text-center p-8 text-[#7C6859]">
              <MessageSquare className="h-10 w-10 mx-auto text-[#78350F]/40 mb-2" />
              <p className="text-xs font-semibold">Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Optional Active Lodge Context Header (if discussion is tied to a lodge) */}
              {activeTab === 'dms' && activeDM?.listingId && (
                <div className="shrink-0 bg-amber-50/70 border-b border-amber-200/60 px-4 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="h-3.5 w-3.5 text-[#78350F] shrink-0" />
                    <span className="text-[#78350F] truncate font-medium">
                      Discussing: <strong>{activeDM.listingTitle}</strong>
                    </span>
                  </div>
                  {onOpenListingDetail && (
                    <button
                      onClick={() => onOpenListingDetail(activeDM.listingId!)}
                      className="text-[11px] font-bold text-[#78350F] underline hover:text-amber-800 shrink-0 ml-2 cursor-pointer"
                    >
                      View Lodge
                    </button>
                  )}
                </div>
              )}

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {loading && messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#7C6859]">
                    Loading messages…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#7C6859]">
                    No messages yet. Say hello to get things started!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = user ? msg.senderId === user.id : false
                    const isDeleting = deletingId === msg.id
                    const { lodgeId, cleanText } = parseLodgeId(msg.content)
                    const attachedListing = lodgeId ? MOCK_LISTINGS.find((l) => l.id === lodgeId) : null

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} ${
                          isDeleting ? 'opacity-40 pointer-events-none' : ''
                        }`}
                      >
                        {/* Sender info */}
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[11px] font-bold text-[#271810]">
                            {isMe ? 'You' : msg.senderName}
                          </span>
                          {renderRoleBadge(msg.senderRole)}
                          <span className="text-[9px] text-[#7C6859]">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 ml-1 transition"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {/* Bubble */}
                        <div
                          className={`max-w-md sm:max-w-lg rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                            isMe
                              ? 'bg-[#78350F] text-white rounded-br-xs'
                              : 'bg-white text-[#271810] border border-[#E5DAC8] rounded-bl-xs'
                          }`}
                        >
                          {/* Attached Lodge Preview */}
                          {attachedListing && (
                            <div
                              className={`mb-2 p-2 rounded-xl border flex items-center justify-between gap-2 ${
                                isMe
                                  ? 'bg-amber-950/40 border-amber-600/40 text-white'
                                  : 'bg-[#FAF7F2] border-[#E5DAC8] text-[#271810]'
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="text-[9px] font-bold uppercase text-amber-500 block">
                                  Lodge Attachment
                                </span>
                                <h5 className="font-bold truncate text-xs">{attachedListing.title}</h5>
                                <p className="text-[10px] opacity-80">
                                  {formatNaira(attachedListing.annualRent)}/yr · {attachedListing.area}
                                </p>
                              </div>
                              {onOpenListingDetail && (
                                <Button
                                  size="sm"
                                  onClick={() => onOpenListingDetail(attachedListing.id)}
                                  className="h-6 text-[10px] bg-amber-600 hover:bg-amber-700 text-white px-2 shrink-0"
                                >
                                  Inspect
                                </Button>
                              )}
                            </div>
                          )}

                          <p className="whitespace-pre-wrap">{cleanText}</p>

                          {/* Existing Reactions Pill */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-black/5 dark:border-white/10">
                              {Object.entries(msg.reactions).map(([emoji, count]) =>
                                count > 0 ? (
                                  <span
                                    key={emoji}
                                    onClick={() => handleReaction(msg.id, emoji)}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-50 text-[#78350F] border border-amber-200 cursor-pointer"
                                  >
                                    <span>{emoji}</span>
                                    <span className="font-bold">{count}</span>
                                  </span>
                                ) : null
                              )}
                            </div>
                          )}
                        </div>

                        {/* Hover Quick Reaction Buttons */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 mt-0.5 px-1 transition">
                          {['👍', '🔥', '🏠', '❤️'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className="text-xs hover:scale-125 transition p-0.5"
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* =========================================================================
                  COMPACT INPUT BAR
                 ========================================================================= */}
              <div className="shrink-0 p-2.5 sm:p-3 bg-white border-t border-[#E5DAC8]">
                {/* Suggestions Dropdown (when lightbulb is toggled) */}
                {showQuickPrompts && (
                  <div className="mb-2 p-2 bg-[#FAF7F2] border border-[#E5DAC8] rounded-xl flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                      '🔍 Looking for Self-Con',
                      '🤝 Roommate Wanted (50/50)',
                      '💧 Light & Borehole available?',
                      '🔑 Any Vacancy near IMSU?',
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => {
                          setInput((prev) => (prev ? `${prev} ${prompt}` : prompt))
                          setShowQuickPrompts(false)
                        }}
                        className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white border border-[#E5DAC8] text-[#78350F] hover:bg-amber-50 shrink-0 transition"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Lodge Attachment Banner */}
                {selectedLodgeToAttach && (
                  <div className="mb-2 p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 text-[#78350F] shrink-0" />
                      <span className="truncate">
                        Attaching: <strong>{selectedLodgeToAttach.title}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedLodgeToAttach(null)}
                      className="p-1 text-slate-500 hover:text-slate-800"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Main Form */}
                <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickPrompts(!showQuickPrompts)}
                    className="h-9 w-9 p-0 text-[#78350F] hover:bg-[#FAF7F2] rounded-xl shrink-0"
                    title="Quick property phrases"
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachModalOpen(true)}
                    className="h-9 w-9 p-0 text-[#78350F] hover:bg-[#FAF7F2] rounded-xl shrink-0"
                    title="Attach lodge"
                  >
                    <Building2 className="h-4 w-4" />
                  </Button>

                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      user
                        ? `Message ${conversationTitle}…`
                        : 'Sign in to message students, landlords & agents…'
                    }
                    disabled={sending}
                    className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-xl flex-1 focus:border-[#78350F]"
                  />

                  {user ? (
                    <Button
                      type="submit"
                      disabled={(!input.trim() && !selectedLodgeToAttach) || sending}
                      className="h-9 px-3.5 bg-[#78350F] hover:bg-[#854D0E] text-white rounded-xl font-bold shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => onOpenAuth('login')}
                      className="h-9 px-3 bg-[#78350F] hover:bg-[#854D0E] text-white text-xs font-bold rounded-xl shrink-0"
                    >
                      <LogIn className="h-3.5 w-3.5 mr-1" /> Sign In
                    </Button>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL: Attach Lodge Picker
         ========================================================================= */}
      <Dialog open={attachModalOpen} onOpenChange={setAttachModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E5DAC8] rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-[#271810]">
              <Building2 className="h-4 w-4 text-[#78350F]" />
              Attach Lodge to Message
            </DialogTitle>
            <DialogDescription className="text-xs text-[#7C6859]">
              Select a verified lodge to share with live pricing and inspection access.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C6859]" />
            <Input
              value={searchLodgeQuery}
              onChange={(e) => setSearchLodgeQuery(e.target.value)}
              placeholder="Search lodge name or campus..."
              className="pl-8 h-8 text-xs bg-[#FAF7F2] border-[#E5DAC8]"
            />
          </div>

          <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
            {filteredLodges.map((lodge) => (
              <div
                key={lodge.id}
                onClick={() => {
                  setSelectedLodgeToAttach(lodge)
                  setAttachModalOpen(false)
                  toast.success(`Attached ${lodge.title}`)
                }}
                className="p-2.5 rounded-xl border border-[#E5DAC8] hover:border-[#78350F] hover:bg-amber-50/40 cursor-pointer transition flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold truncate text-[#271810]">{lodge.title}</h4>
                  <p className="text-[10px] text-[#7C6859]">
                    {formatNaira(lodge.annualRent)}/yr · {lodge.area}
                  </p>
                </div>
                <Button size="sm" className="h-6 text-[10px] bg-[#78350F] text-white px-2">
                  Attach
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: Story Viewer
         ========================================================================= */}
      {selectedStory && (
        <Dialog open={Boolean(selectedStory)} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="max-w-sm bg-stone-900 text-white rounded-2xl p-0 overflow-hidden">
            <div className="relative h-56 w-full">
              <img
                src={selectedStory.image}
                alt={selectedStory.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{selectedStory.author}</span>
                  <button onClick={() => setSelectedStory(null)} className="p-1 text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <Badge className="bg-amber-500 text-white text-[9px] font-bold mb-1">
                    {selectedStory.price}
                  </Badge>
                  <h3 className="text-sm font-bold">{selectedStory.title}</h3>
                  <p className="text-[11px] text-amber-200 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedStory.location}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3">
              <Button
                onClick={() => {
                  setSelectedStory(null)
                  setActiveTab('world')
                  setInput(`Inquiring about ${selectedStory.title} (${selectedStory.price})`)
                }}
                className="w-full h-8 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold text-xs"
              >
                Inquire in World Square
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

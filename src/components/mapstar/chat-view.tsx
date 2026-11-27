'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users,
  MessageSquare,
  Send,
  Shield,
  Building,
  GraduationCap,
  Lock,
  LogIn,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Globe,
  Radio,
  MapPin,
  Sparkles,
  Phone,
  CheckCircle2,
  Share2,
  Heart,
  Flame,
  ThumbsUp,
  Building2,
  X,
  Plus,
  Compass,
  ArrowRight,
  ExternalLink,
  Search,
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
// 1. Stories / Status Highlights (Snapchat & WhatsApp Style for Properties)
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
    tag: '⚡ 0% Agent Fee',
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
    title: 'Self-Con with Generator & Borehole',
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
    title: 'Official Group Inspection Tour',
    tag: '🛡️ 5% Fee Capped',
    author: 'Engr. Victor',
    role: 'AGENT',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format&fit=crop&q=80',
    price: '3 Lodges Inspected',
    location: 'Bishop\'s Court, Owerri',
    verified: true,
  },
]

// ---------------------------------------------------------------------------
// 2. Mock Pre-Configured Channels, DMs, and Groups
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
    name: 'Engr. Victor (Mapstar Verified Agent)',
    role: 'AGENT',
    avatar: 'EV',
    channelId: 'dm-agent-victor',
    listingTitle: 'Royal Palms Villa (FUTO)',
    listingId: 'mock-2',
    phone: '+2348098765432',
    unreadCount: 0,
    lastMessage: 'All inspection fees are legally capped at 5%. Let me know when you arrive at Eziobodo.',
    lastTime: 'Yesterday',
    verified: true,
  },
  {
    id: 'dm-chidi',
    name: 'Chidi Okonkwo (Student / Tenant)',
    role: 'TENANT',
    avatar: 'CO',
    channelId: 'dm-student-chidi',
    listingTitle: 'Green Valley Suites',
    listingId: 'mock-3',
    unreadCount: 0,
    lastMessage: 'Hey bro, are you interested in co-sharing the 2-bedroom unit?',
    lastTime: '2 days ago',
    verified: false,
  },
]

interface GroupChannel {
  id: string
  name: string
  category: string
  membersCount: number
  desc: string
  pinnedLodgeId?: string
}

const GROUPS_LIST: GroupChannel[] = [
  {
    id: 'group-imsu-hunters',
    name: 'IMSU Front Gate & Bishop\'s Court',
    category: 'IMSU Community',
    membersCount: 1240,
    desc: 'Lodge availability, price reports, and landlord contacts around IMSU',
    pinnedLodgeId: 'mock-1',
  },
  {
    id: 'group-futo-eziobodo',
    name: 'FUTO Eziobodo & Ihiagwa Hunters',
    category: 'FUTO Community',
    membersCount: 980,
    desc: 'Off-campus housing, light/water updates, and roommate searches',
    pinnedLodgeId: 'mock-2',
  },
  {
    id: 'group-unn-hilltop',
    name: 'UNN Hilltop & Odim Gate Students',
    category: 'UNN Nsukka',
    membersCount: 850,
    desc: 'Verified student hostels & self-con apartments around UNN campus',
    pinnedLodgeId: 'mock-3',
  },
  {
    id: 'group-roommates-hub',
    name: 'Nigeria Roommate Match Hub 🤝',
    category: 'Roommate Match',
    membersCount: 1520,
    desc: 'Find compatible co-tenants to split annual rent 50/50 safely',
  },
  {
    id: 'group-fee-watchdog',
    name: 'Regulated Fees & Tenants Watchdog ⚖️',
    category: 'Legal & Fees',
    membersCount: 670,
    desc: 'Reporting excess illegal agency charges and blacklisted fake agents',
  },
]

interface BroadcastChannel {
  id: string
  name: string
  subscribers: string
  verifiedOrg: string
  desc: string
  badgeText: string
}

const BROADCAST_CHANNELS: BroadcastChannel[] = [
  {
    id: 'channel-instant-drops',
    name: 'Mapstar Instant Lodge Drops ⚡',
    subscribers: '14.2k subscribers',
    verifiedOrg: 'Mapstar Verified',
    desc: 'Official alerts the minute a verified 0% fee self-con drops on the map',
    badgeText: '0% FEE ALERTS',
  },
  {
    id: 'channel-landlords-bulletin',
    name: 'Verified Landlords Direct Notice Board 🏛️',
    subscribers: '8.9k subscribers',
    verifiedOrg: 'Property Owners Guild',
    desc: 'Direct landlord vacancies, semester renewals, and open house announcements',
    badgeText: 'DIRECT OWNERS',
  },
  {
    id: 'channel-agent-tours',
    name: 'Certified Agents Inspection Tours 🛡️',
    subscribers: '6.5k subscribers',
    verifiedOrg: 'Licensed Agents Council',
    desc: 'Regulated group inspections with strictly capped 5% platform fees',
    badgeText: 'CAPPED 5%',
  },
  {
    id: 'channel-campus-housing',
    name: 'Campus Resumption Housing Alerts 🎓',
    subscribers: '18.1k subscribers',
    verifiedOrg: 'Campus Accommodations Board',
    desc: 'Semester schedules, hostel allocation updates, and housing safety',
    badgeText: 'CAMPUS NEWS',
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
  },
  {
    id: 'msg-init-3',
    channelId: 'world-square',
    senderId: 'user-chioma',
    senderName: 'Chioma Eze',
    senderRole: 'TENANT',
    content: 'Hello everyone! I am a 200L Nursing student at IMSU looking for a female roommate to share a neat self-con flat around Bishop\'s court. Budget is ₦120k split.',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
]

// ---------------------------------------------------------------------------
// 3. Main Socials Component
// ---------------------------------------------------------------------------
export default function ChatView({ user, onOpenAuth, onOpenListingDetail }: ChatViewProps) {
  // Navigation tabs: World, DMs, Groups, Channels
  const [activeTab, setActiveTab] = useState<SocialTab>('world')

  // Selected channel / thread
  const [currentChannelId, setCurrentChannelId] = useState('world-square')
  const [activeDM, setActiveDM] = useState<DMContact | null>(DM_CONTACTS[0])
  const [activeGroup, setActiveGroup] = useState<GroupChannel | null>(GROUPS_LIST[0])
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastChannel | null>(BROADCAST_CHANNELS[0])

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
  const [purging, setPurging] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.role === 'ADMIN'

  // Determine active channel ID based on tab
  useEffect(() => {
    if (activeTab === 'world') {
      setCurrentChannelId('world-square')
    } else if (activeTab === 'dms') {
      setCurrentChannelId(activeDM?.channelId || 'dm-general')
    } else if (activeTab === 'groups') {
      setCurrentChannelId(activeGroup?.id || 'group-imsu-hunters')
    } else if (activeTab === 'channels') {
      setCurrentChannelId(activeBroadcast?.id || 'channel-instant-drops')
    }
  }, [activeTab, activeDM, activeGroup, activeBroadcast])

  // Fetch live messages from Supabase via /api/chat
  async function fetchMessages(channelId: string, showToast = false) {
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
        if (showToast) toast.success('Social feed updated')
      }
    } catch (err: any) {
      console.warn('[Socials fetch error]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages(currentChannelId)
  }, [currentChannelId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentChannelId])

  // Periodic polling every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetch(`/api/chat?channelId=${encodeURIComponent(currentChannelId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.messages && data.messages.length > 0) {
            setMessages(data.messages)
          }
        })
        .catch(() => {})
    }, 8000)
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

    const trimmed = input.trim()
    const lodgeToAttach = selectedLodgeToAttach
    let formattedContent = trimmed

    if (lodgeToAttach) {
      formattedContent = `[LODGE:${lodgeToAttach.id}] ${trimmed}`.trim()
    }

    setInput('')
    setSelectedLodgeToAttach(null)
    setSending(true)

    // Optimistic UI update
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

  // Quick reaction handler
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
    toast.success(`Reacted with ${emoji}`)
  }

  // Admin delete message
  async function handleDeleteMessage(id: string) {
    if (!isAdmin) return
    if (!confirm('Permanently delete this message from Supabase?')) return

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

  // Admin purge channel
  async function handlePurgeChannel() {
    if (!isAdmin) return
    if (!confirm(`Permanently delete all messages in #${currentChannelId} from Supabase?`)) return

    try {
      setPurging(true)
      const res = await fetch(`/api/chat?channelId=${encodeURIComponent(currentChannelId)}&purge=true`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to purge')
      setMessages([])
      toast.success('Channel messages purged')
    } catch (err: any) {
      toast.error(err.message || 'Error purging channel')
    } finally {
      setPurging(false)
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

  // ---------------------------------------------------------------------------
  // Render Sender Role Badge Component
  // ---------------------------------------------------------------------------
  function renderRoleBadge(role: 'TENANT' | 'LANDLORD' | 'AGENT' | 'ADMIN') {
    switch (role) {
      case 'LANDLORD':
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 dark:bg-amber-950/80 text-[#78350F] dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
            <Building className="h-2.5 w-2.5 text-[#78350F] dark:text-amber-400" />
            Verified Landlord · 0% Fee
          </span>
        )
      case 'AGENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-2xs">
            <Shield className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
            Certified Agent · 5% Cap
          </span>
        )
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-[#78350F] to-[#B45309] text-white border border-amber-400/50 shadow-2xs">
            <Sparkles className="h-2.5 w-2.5 text-yellow-300" />
            Mapstar Official
          </span>
        )
      case 'TENANT':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-[#FAF7F2] dark:bg-[#2A1810] text-[#7C6859] dark:text-[#C5B4A5] border border-[#E5DAC8] dark:border-[#4A2810]">
            <GraduationCap className="h-2.5 w-2.5 text-[#78350F] dark:text-amber-400" />
            Customer (Tenant)
          </span>
        )
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#FAF7F2] dark:bg-[#120C08] text-[#271810] dark:text-[#FAF6F0] overflow-hidden select-none">
      {/* =========================================================================
          TOP HEADER: Brand, Live Supabase status, and Section Segmented Switcher
         ========================================================================= */}
      <div className="shrink-0 bg-white/95 dark:bg-[#1A120B]/95 border-b border-[#E5DAC8] dark:border-[#382618] px-3 sm:px-5 py-2.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#78350F] to-[#451A03] flex items-center justify-center text-white shadow-xs">
              <Users className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-[#271810] dark:text-white tracking-tight">
                  Mapstar Socials
                </h1>
                <Badge className="h-4 text-[9px] font-mono font-bold bg-amber-100 text-[#78350F] border border-amber-300 dark:bg-[#382618] dark:text-amber-200">
                  HUB
                </Badge>
              </div>
              <p className="text-[10px] text-[#7C6859] dark:text-[#B8A598]">
                Real-time property connections · DMs · Groups · Channels · World Square
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Supabase Live
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchMessages(currentChannelId, true)}
              className="h-7 px-2 text-xs text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-white cursor-pointer"
              title="Refresh messages"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>

            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handlePurgeChannel}
                disabled={purging || messages.length === 0}
                className="h-7 px-2 text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-medium cursor-pointer shadow-xs"
                title="Admin: Purge channel history"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {purging ? 'Purging…' : 'Purge'}
              </Button>
            )}
          </div>
        </div>

        {/* 4 First-Class Navigation Pills */}
        <div className="grid grid-cols-4 gap-1.5 bg-[#FAF7F2] dark:bg-[#120C08] p-1 rounded-xl border border-[#E5DAC8] dark:border-[#382618]">
          <button
            onClick={() => setActiveTab('world')}
            className={`py-1.5 px-1 sm:px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'world'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'text-[#7C6859] dark:text-[#B8A598] hover:text-[#271810] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">World Square</span>
          </button>

          <button
            onClick={() => setActiveTab('dms')}
            className={`py-1.5 px-1 sm:px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              activeTab === 'dms'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'text-[#7C6859] dark:text-[#B8A598] hover:text-[#271810] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">DMs</span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 absolute top-1 right-2" />
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`py-1.5 px-1 sm:px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'text-[#7C6859] dark:text-[#B8A598] hover:text-[#271810] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Groups</span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`py-1.5 px-1 sm:px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'channels'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'text-[#7C6859] dark:text-[#B8A598] hover:text-[#271810] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <Radio className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Channels</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          HORIZONTAL STORIES REEL: WhatsApp / Snapchat Style Property Statuses
         ========================================================================= */}
      <div className="shrink-0 bg-white/70 dark:bg-[#160E08]/70 border-b border-[#E5DAC8] dark:border-[#382618] px-3 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3 min-w-max">
          <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setAttachModalOpen(true)}>
            <div className="h-12 w-12 rounded-full border-2 border-dashed border-[#78350F] dark:border-amber-500/70 p-0.5 flex items-center justify-center group-hover:scale-105 transition-transform bg-[#FAF7F2] dark:bg-[#1A120B]">
              <Plus className="h-5 w-5 text-[#78350F] dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-semibold text-[#78350F] dark:text-amber-300">Drop Lodge</span>
          </div>

          {PROPERTY_STORIES.map((story) => (
            <div
              key={story.id}
              onClick={() => setSelectedStory(story)}
              className="flex flex-col items-center gap-1 cursor-pointer group"
            >
              <div className="relative h-12 w-12 rounded-full p-0.5 bg-gradient-to-tr from-[#78350F] via-amber-400 to-[#F59E0B] group-hover:scale-105 transition-transform">
                <img
                  src={story.image}
                  alt={story.title}
                  className="h-full w-full rounded-full object-cover border-2 border-white dark:border-[#1A120B]"
                />
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1A120B]" />
              </div>
              <span className="text-[10px] font-medium text-[#271810] dark:text-[#FAF6F0] max-w-[68px] truncate">
                {story.author.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          MAIN BODY: Left Selector Drawer (for DMs, Groups, Channels) + Chat Area
         ========================================================================= */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Sub-list for DMs, Groups, and Channels */}
        {activeTab !== 'world' && (
          <div className="w-56 sm:w-72 shrink-0 border-r border-[#E5DAC8] dark:border-[#382618] bg-white/90 dark:bg-[#170F0A]/90 flex flex-col overflow-y-auto">
            {/* DMs List */}
            {activeTab === 'dms' && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 text-[11px] font-bold text-[#7C6859] dark:text-[#B8A598] uppercase tracking-wider flex items-center justify-between">
                  <span>Direct Inquiries</span>
                  <Badge variant="outline" className="text-[9px] border-[#E5DAC8]">
                    {DM_CONTACTS.length}
                  </Badge>
                </div>
                {DM_CONTACTS.map((dm) => {
                  const isSelected = activeDM?.id === dm.id
                  return (
                    <div
                      key={dm.id}
                      onClick={() => setActiveDM(dm)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-[#FAF7F2] dark:bg-[#2A1810] border border-amber-300 dark:border-amber-700/50 shadow-xs'
                          : 'hover:bg-[#FAF7F2]/60 dark:hover:bg-[#1F140D]'
                      }`}
                    >
                      <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-[#78350F] to-[#854D0E] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {dm.avatar}
                        {dm.verified && (
                          <CheckCircle2 className="h-3 w-3 text-amber-300 absolute -bottom-0.5 -right-0.5 bg-[#78350F] rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#271810] dark:text-white truncate">
                            {dm.name}
                          </span>
                          <span className="text-[9px] text-[#7C6859] dark:text-[#B8A598] shrink-0">
                            {dm.lastTime}
                          </span>
                        </div>
                        <div className="mt-0.5">{renderRoleBadge(dm.role)}</div>
                        <p className="text-[11px] text-[#7C6859] dark:text-[#B8A598] truncate mt-1">
                          {dm.lastMessage}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Groups List */}
            {activeTab === 'groups' && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 text-[11px] font-bold text-[#7C6859] dark:text-[#B8A598] uppercase tracking-wider">
                  Campus & Lodge Groups
                </div>
                {GROUPS_LIST.map((grp) => {
                  const isSelected = activeGroup?.id === grp.id
                  return (
                    <div
                      key={grp.id}
                      onClick={() => setActiveGroup(grp)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#FAF7F2] dark:bg-[#2A1810] border border-amber-300 dark:border-amber-700/50 shadow-xs'
                          : 'hover:bg-[#FAF7F2]/60 dark:hover:bg-[#1F140D]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#271810] dark:text-white truncate">
                          {grp.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#78350F] dark:text-amber-400 font-semibold">
                          {grp.category}
                        </span>
                        <span className="text-[10px] text-[#7C6859] dark:text-[#B8A598]">
                          · {grp.membersCount} members
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7C6859] dark:text-[#B8A598] line-clamp-1 mt-0.5">
                        {grp.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Broadcast Channels List */}
            {activeTab === 'channels' && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 text-[11px] font-bold text-[#7C6859] dark:text-[#B8A598] uppercase tracking-wider">
                  Official Channels
                </div>
                {BROADCAST_CHANNELS.map((chan) => {
                  const isSelected = activeBroadcast?.id === chan.id
                  return (
                    <div
                      key={chan.id}
                      onClick={() => setActiveBroadcast(chan)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#FAF7F2] dark:bg-[#2A1810] border border-amber-300 dark:border-amber-700/50 shadow-xs'
                          : 'hover:bg-[#FAF7F2]/60 dark:hover:bg-[#1F140D]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#271810] dark:text-white truncate">
                          {chan.name}
                        </span>
                      </div>
                      <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-[#78350F] dark:bg-[#382618] dark:text-amber-200">
                        {chan.badgeText}
                      </span>
                      <p className="text-[10px] text-[#7C6859] dark:text-[#B8A598] line-clamp-1 mt-0.5">
                        {chan.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            RIGHT SIDE: Active Thread, Messages Feed, and Input Controls
           ===================================================================== */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FAF7F2]/40 dark:bg-[#120C08]/40">
          {/* Active Context Banner */}
          <div className="shrink-0 bg-white/90 dark:bg-[#1A120B]/90 border-b border-[#E5DAC8] dark:border-[#382618] px-4 py-2 flex items-center justify-between gap-3 shadow-2xs">
            <div className="min-w-0">
              {activeTab === 'world' && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-[#78350F] dark:text-amber-400" />
                    <span className="text-xs font-bold text-[#271810] dark:text-white">
                      World Square · All Nigeria Community Chat
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7C6859] dark:text-[#B8A598]">
                    Ask about vacant lodges, connect with landlords, and find roommates across all campuses.
                  </span>
                </div>
              )}

              {activeTab === 'dms' && activeDM && (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#271810] dark:text-white truncate">
                      {activeDM.name}
                    </span>
                    {renderRoleBadge(activeDM.role)}
                  </div>
                  {activeDM.listingTitle && (
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#78350F] dark:text-amber-300">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">Discussing: {activeDM.listingTitle}</span>
                      {activeDM.listingId && onOpenListingDetail && (
                        <button
                          onClick={() => onOpenListingDetail(activeDM.listingId!)}
                          className="underline hover:text-amber-600 font-semibold cursor-pointer"
                        >
                          View Lodge
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'groups' && activeGroup && (
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#78350F] dark:text-amber-400" />
                    <span className="text-xs font-bold text-[#271810] dark:text-white truncate">
                      {activeGroup.name}
                    </span>
                    <Badge variant="outline" className="text-[9px]">
                      {activeGroup.membersCount} members
                    </Badge>
                  </div>
                  <span className="text-[10px] text-[#7C6859] dark:text-[#B8A598]">
                    {activeGroup.desc}
                  </span>
                </div>
              )}

              {activeTab === 'channels' && activeBroadcast && (
                <div>
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-[#78350F] dark:text-amber-400" />
                    <span className="text-xs font-bold text-[#271810] dark:text-white truncate">
                      {activeBroadcast.name}
                    </span>
                    <Badge className="bg-[#78350F] text-white text-[9px]">
                      {activeBroadcast.subscribers}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-[#7C6859] dark:text-[#B8A598]">
                    {activeBroadcast.desc}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Landlord Direct Call in DMs */}
            {activeTab === 'dms' && activeDM?.phone && (
              <a
                href={`tel:${activeDM.phone}`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer shrink-0"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Call Verified</span>
              </a>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {loading && messages.length === 0 ? (
              <div className="text-center py-16 text-xs text-[#7C6859] dark:text-[#B8A598]">
                Loading verified property social stream…
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-xs text-[#7C6859] dark:text-[#B8A598]">
                No messages yet in this channel. Be the first to start the conversation!
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
                    {/* Message Meta: Sender Name + Explicit Role Badge + Timestamp */}
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-xs font-bold text-[#271810] dark:text-white">
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      {renderRoleBadge(msg.senderRole)}
                      <span className="text-[10px] text-[#7C6859] dark:text-[#B8A598]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {/* Admin moderation delete */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="Admin: Delete message permanently"
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 ml-1 cursor-pointer transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-md sm:max-w-lg rounded-2xl p-3 text-xs shadow-xs leading-relaxed transition-colors ${
                        isMe
                          ? 'bg-[#78350F] text-white rounded-tr-xs shadow-[#78350F]/20'
                          : 'bg-white dark:bg-[#1A120B] text-[#271810] dark:text-[#FAF6F0] border border-[#E5DAC8] dark:border-[#382618] rounded-tl-xs'
                      }`}
                    >
                      {/* Attached Interactive Lodge Card */}
                      {attachedListing && (
                        <div
                          className={`mb-2.5 p-2.5 rounded-xl border flex flex-col sm:flex-row gap-2.5 ${
                            isMe
                              ? 'bg-amber-950/40 border-amber-700/50 text-white'
                              : 'bg-[#FAF7F2] dark:bg-[#24170E] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0]'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white uppercase">
                                Lodge Pin
                              </span>
                              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                {formatNaira(attachedListing.annualRent)}/yr
                              </span>
                            </div>
                            <h4 className="text-xs font-bold truncate">{attachedListing.title}</h4>
                            <p className="text-[10px] opacity-80 truncate">{attachedListing.area}, {attachedListing.city}</p>
                          </div>
                          {onOpenListingDetail && (
                            <Button
                              size="sm"
                              onClick={() => onOpenListingDetail(attachedListing.id)}
                              className="h-7 text-[11px] bg-[#78350F] hover:bg-[#854D0E] text-white font-semibold cursor-pointer shrink-0"
                            >
                              Inspect Lodge
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Clean Message Body */}
                      <p className="whitespace-pre-wrap">{cleanText}</p>

                      {/* Interactive Emoji Reaction Bar */}
                      <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-black/10 dark:border-white/10">
                        {['👍', '🔥', '🏠', '❤️'].map((emoji) => {
                          const count = msg.reactions?.[emoji] || 0
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer flex items-center gap-1 ${
                                count > 0
                                  ? 'bg-amber-100/30 text-amber-300 font-bold'
                                  : 'opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && <span>{count}</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* =========================================================================
              BOTTOM MESSAGE COMPOSER: Property chips, Attach Lodge, & Send
             ========================================================================= */}
          <div className="shrink-0 p-3 bg-white dark:bg-[#1A120B] border-t border-[#E5DAC8] dark:border-[#382618]">
            {/* Quick Property Filter Chips */}
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar">
              {[
                '🔍 Looking for Self-Con',
                '🤝 Roommate Wanted (Split 50/50)',
                '🔑 Any Vacancy around IMSU?',
                '💧 Light & Borehole available?',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setInput((prev) => (prev ? `${prev} ${chip}` : chip))}
                  className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FAF7F2] dark:bg-[#24170E] border border-[#E5DAC8] dark:border-[#382618] text-[#78350F] dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition shrink-0 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Selected Lodge Attachment Preview Banner */}
            {selectedLodgeToAttach && (
              <div className="mb-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#78350F] dark:text-amber-400" />
                  <span>
                    Attaching: <strong>{selectedLodgeToAttach.title}</strong> ({formatNaira(selectedLodgeToAttach.annualRent)}/yr)
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLodgeToAttach(null)}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAttachModalOpen(true)}
                className="h-10 px-2.5 border-[#E5DAC8] dark:border-[#382618] text-[#78350F] dark:text-amber-400 hover:bg-[#FAF7F2] dark:hover:bg-[#24170E] cursor-pointer shrink-0"
                title="Attach verified lodge to message"
              >
                <Building2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-xs font-semibold">Attach Lodge</span>
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  user
                    ? `Message #${activeTab === 'world' ? 'world-square' : activeTab} as ${user.fullName || user.email.split('@')[0]}…`
                    : 'Sign in to chat with landlords, agents, and students…'
                }
                disabled={sending}
                className="h-10 text-xs bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] rounded-xl focus:border-[#78350F] dark:focus:border-[#B45309]"
              />

              {user ? (
                <Button
                  type="submit"
                  disabled={(!input.trim() && !selectedLodgeToAttach) || sending}
                  className="h-10 px-4 bg-[#78350F] hover:bg-[#854D0E] dark:bg-[#B45309] dark:hover:bg-[#C2783B] text-white font-bold rounded-xl cursor-pointer shadow-md shadow-[#78350F]/25 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="h-10 px-3 bg-[#78350F] hover:bg-[#854D0E] text-white text-xs font-bold rounded-xl cursor-pointer shrink-0"
                >
                  <LogIn className="h-3.5 w-3.5 mr-1" /> Sign In
                </Button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: Attach Lodge Picker Dialog
         ========================================================================= */}
      <Dialog open={attachModalOpen} onOpenChange={setAttachModalOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-[#1A120B] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#78350F] dark:text-amber-400" />
              Attach Verified Lodge to Message
            </DialogTitle>
            <DialogDescription className="text-xs text-[#7C6859] dark:text-[#B8A598]">
              Select a lodge to share directly in chat with live pricing, photos, and inspection routing.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C6859]" />
            <Input
              value={searchLodgeQuery}
              onChange={(e) => setSearchLodgeQuery(e.target.value)}
              placeholder="Search by lodge name, area (e.g. IMSU, FUTO, Eziobodo)..."
              className="pl-9 h-9 text-xs bg-[#FAF7F2] dark:bg-[#120C08] border-[#E5DAC8] dark:border-[#382618]"
            />
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
            {filteredLodges.map((lodge) => (
              <div
                key={lodge.id}
                onClick={() => {
                  setSelectedLodgeToAttach(lodge)
                  setAttachModalOpen(false)
                  toast.success(`Attached ${lodge.title}`)
                }}
                className="p-3 rounded-xl border border-[#E5DAC8] dark:border-[#382618] hover:border-[#78350F] dark:hover:border-amber-500 bg-[#FAF7F2]/50 dark:bg-[#140D08]/50 hover:bg-[#FAF7F2] dark:hover:bg-[#22150E] cursor-pointer transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-[#78350F] dark:bg-[#382618] dark:text-amber-200">
                      {lodge.propertyType}
                    </span>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      {formatNaira(lodge.annualRent)}/yr
                    </span>
                  </div>
                  <h4 className="text-xs font-bold truncate text-[#271810] dark:text-white">
                    {lodge.title}
                  </h4>
                  <p className="text-[10px] text-[#7C6859] dark:text-[#B8A598] truncate">
                    {lodge.area}, {lodge.city}
                  </p>
                </div>
                <Button size="sm" className="h-7 text-xs bg-[#78350F] text-white">
                  Select
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 2: Property Story Highlight Viewer (Snapchat Style)
         ========================================================================= */}
      {selectedStory && (
        <Dialog open={Boolean(selectedStory)} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="max-w-md bg-gradient-to-b from-[#2E180A] to-[#120C08] text-white border-[#523018] rounded-3xl p-0 overflow-hidden shadow-2xl">
            <div className="relative h-64 w-full">
              <img
                src={selectedStory.image}
                alt={selectedStory.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120C08] via-transparent to-black/60 p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
                      {selectedStory.author[0]}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{selectedStory.author}</span>
                      <span className="text-[9px] text-amber-200">{selectedStory.tag}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStory(null)} className="p-1 text-white/80 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div>
                  <Badge className="bg-amber-500 text-white text-[10px] font-bold mb-1">
                    {selectedStory.price}
                  </Badge>
                  <h3 className="text-lg font-bold">{selectedStory.title}</h3>
                  <p className="text-xs text-amber-100 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-400" />
                    {selectedStory.location}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Direct property drop live for 24 hours. Contact the verified publisher directly or inspect on the map.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setSelectedStory(null)
                    setActiveTab('world')
                    setInput(`Inquiring about ${selectedStory.title} (${selectedStory.price})`)
                  }}
                  className="flex-1 h-9 bg-amber-500 hover:bg-amber-600 text-[#271810] font-bold text-xs cursor-pointer"
                >
                  Message in World Square
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedStory(null)}
                  className="h-9 border-[#523018] text-white hover:bg-white/10 text-xs cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

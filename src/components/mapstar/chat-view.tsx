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
  Building2,
  X,
  Plus,
  ArrowLeft,
  Search,
  Radio,
  Globe,
  Trash2,
  LogIn,
  RefreshCw,
  Lightbulb,
  ChevronRight,
  Database,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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

export interface UserGroup {
  id: string
  name: string
  category: string
  desc: string
  createdBy?: string
  createdAt: string
  membersCount: number
  lastMessage?: string
  lastTime?: string
}

export interface UserChannel {
  id: string
  name: string
  badgeText: string
  desc: string
  createdBy?: string
  createdAt: string
  subscribers: string
  lastMessage?: string
  lastTime?: string
}

export interface UserDM {
  id: string
  name: string
  role: 'LANDLORD' | 'AGENT' | 'TENANT' | 'ADMIN'
  channelId: string
  listingTitle?: string
  listingId?: string
  phone?: string
  lastMessage?: string
  lastTime?: string
  verified: boolean
}

interface ChatViewProps {
  user: AuthedUser | null
  onOpenAuth: (mode?: 'login' | 'signup') => void
  onOpenListingDetail?: (listingId: string) => void
}

export default function ChatView({ user, onOpenAuth, onOpenListingDetail }: ChatViewProps) {
  const [activeTab, setActiveTab] = useState<SocialTab>('world')

  // Real dynamic user groups, channels, and DMs (stored in state and synced with localStorage + Supabase)
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [channels, setChannels] = useState<UserChannel[]>([])
  const [dms, setDms] = useState<UserDM[]>([])

  // Active selections
  const [activeDM, setActiveDM] = useState<UserDM | null>(null)
  const [activeGroup, setActiveGroup] = useState<UserGroup | null>(null)
  const [activeBroadcast, setActiveBroadcast] = useState<UserChannel | null>(null)
  const [currentChannelId, setCurrentChannelId] = useState('world-square')

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [selectedLodgeToAttach, setSelectedLodgeToAttach] = useState<MockListing | null>(null)
  const [attachModalOpen, setAttachModalOpen] = useState(false)
  const [searchLodgeQuery, setSearchLodgeQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showQuickPrompts, setShowQuickPrompts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Creation dialog states
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupCategory, setNewGroupCategory] = useState('IMSU')
  const [newGroupDesc, setNewGroupDesc] = useState('')

  const [createChannelOpen, setCreateChannelOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelBadge, setNewChannelBadge] = useState('0% Fee')
  const [newChannelDesc, setNewChannelDesc] = useState('')

  const [createDMOpen, setCreateDMOpen] = useState(false)
  const [newDMName, setNewDMName] = useState('')
  const [newDMRole, setNewDMRole] = useState<'LANDLORD' | 'AGENT' | 'TENANT'>('LANDLORD')
  const [newDMPhone, setNewDMPhone] = useState('')

  // Star Power / Admin cleanup modal state
  const [starPowerCleanOpen, setStarPowerCleanOpen] = useState(false)
  const [purging, setPurging] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.role === 'ADMIN'

  // Load created groups, channels, and DMs from localStorage & backend on mount
  useEffect(() => {
    try {
      const savedGroups = localStorage.getItem('mapstar_user_groups')
      if (savedGroups) setGroups(JSON.parse(savedGroups))

      const savedChannels = localStorage.getItem('mapstar_user_channels')
      if (savedChannels) setChannels(JSON.parse(savedChannels))

      const savedDms = localStorage.getItem('mapstar_user_dms')
      if (savedDms) setDms(JSON.parse(savedDms))
    } catch {
      // fallback
    }

    // Also fetch any dynamic channels registered on the server
    fetch('/api/chat?action=channels')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.channels && data.channels.length > 0) {
          const remoteGroups: UserGroup[] = []
          const remoteChannels: UserChannel[] = []

          data.channels.forEach((item: any) => {
            if (item.type === 'group') {
              remoteGroups.push({
                id: item.id,
                name: item.name,
                category: item.category || 'General',
                desc: item.desc || '',
                createdBy: item.creatorName,
                createdAt: item.createdAt,
                membersCount: 1,
              })
            } else if (item.type === 'channel') {
              remoteChannels.push({
                id: item.id,
                name: item.name,
                badgeText: item.badgeText || 'OFFICIAL',
                desc: item.desc || '',
                createdBy: item.creatorName,
                createdAt: item.createdAt,
                subscribers: '1 subscriber',
              })
            }
          })

          if (remoteGroups.length > 0) {
            setGroups((prev) => {
              const ids = new Set(prev.map((g) => g.id))
              const merged = [...prev, ...remoteGroups.filter((g) => !ids.has(g.id))]
              return merged
            })
          }

          if (remoteChannels.length > 0) {
            setChannels((prev) => {
              const ids = new Set(prev.map((c) => c.id))
              const merged = [...prev, ...remoteChannels.filter((c) => !ids.has(c.id))]
              return merged
            })
          }
        }
      })
      .catch(() => {})
  }, [])

  // Persist created groups to localStorage
  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem('mapstar_user_groups', JSON.stringify(groups))
    }
  }, [groups])

  // Persist created channels to localStorage
  useEffect(() => {
    if (channels.length > 0) {
      localStorage.setItem('mapstar_user_channels', JSON.stringify(channels))
    }
  }, [channels])

  // Persist created DMs to localStorage
  useEffect(() => {
    if (dms.length > 0) {
      localStorage.setItem('mapstar_user_dms', JSON.stringify(dms))
    }
  }, [dms])

  // Synchronize current channel ID according to view
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
        if (data.messages) {
          // Filter out internal metadata messages
          const clean = data.messages.filter((m: ChatMessage) => !m.content.startsWith('[CHANNEL_META:'))
          setMessages(clean)
        } else {
          setMessages([])
        }
        if (showToast) toast.success('Feed refreshed')
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

  // Polling every 10 seconds for real-time updates
  useEffect(() => {
    if (!currentChannelId) return
    const timer = setInterval(() => {
      fetch(`/api/chat?channelId=${encodeURIComponent(currentChannelId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.messages) {
            const clean = data.messages.filter((m: ChatMessage) => !m.content.startsWith('[CHANNEL_META:'))
            setMessages(clean)
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

  // Delete message: available to author OR Star Power (Admin) to preserve database space
  async function handleDeleteMessage(id: string) {
    try {
      setDeletingId(id)
      const res = await fetch(`/api/chat?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete message')
      }
      setMessages((prev) => prev.filter((m) => m.id !== id))
      toast.success('Message deleted from database.')
    } catch (err: any) {
      toast.error(err.message || 'Error deleting message')
    } finally {
      setDeletingId(null)
    }
  }

  // Star Power (Admin): Purge active channel to reclaim database space
  async function handlePurgeCurrentChannel() {
    if (!isAdmin || !currentChannelId) return
    if (!confirm(`Purge all messages in #${currentChannelId} to free database space?`)) return

    try {
      setPurging(true)
      const res = await fetch(`/api/chat?channelId=${encodeURIComponent(currentChannelId)}&purge=true`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setMessages([])
        toast.success(data.message || 'Channel messages purged to preserve database space.')
        setStarPowerCleanOpen(false)
      } else {
        toast.error(data.error || 'Failed to purge channel.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error purging channel')
    } finally {
      setPurging(false)
    }
  }

  // Star Power (Admin): Delete old messages (>30 days or >7 days)
  async function handlePurgeOldMessages(days: number) {
    if (!isAdmin) return
    if (!confirm(`Delete all chat messages older than ${days} days across database?`)) return

    try {
      setPurging(true)
      const res = await fetch(`/api/chat?olderThanDays=${days}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || `Deleted messages older than ${days} days.`)
        fetchMessages(currentChannelId)
        setStarPowerCleanOpen(false)
      } else {
        toast.error(data.error || 'Failed to purge old messages.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error purging old messages')
    } finally {
      setPurging(false)
    }
  }

  // Create real group
  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!newGroupName.trim()) {
      toast.error('Group name is required')
      return
    }

    const groupId = `group-${Date.now()}`
    const newGroup: UserGroup = {
      id: groupId,
      name: newGroupName.trim(),
      category: newGroupCategory.trim() || 'General',
      desc: newGroupDesc.trim() || 'Community property group',
      createdBy: user?.fullName || user?.email || 'User',
      createdAt: new Date().toISOString(),
      membersCount: 1,
    }

    setGroups((prev) => [newGroup, ...prev])
    setActiveGroup(newGroup)
    setActiveTab('groups')
    setCreateGroupOpen(false)
    setNewGroupName('')
    setNewGroupDesc('')

    // Broadcast group creation via metadata message so other users see it
    if (user) {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: groupId,
          content: `[CHANNEL_META:${JSON.stringify({
            type: 'group',
            name: newGroup.name,
            category: newGroup.category,
            desc: newGroup.desc,
          })}] Group "${newGroup.name}" created by ${user.fullName || user.email}`,
        }),
      }).catch(() => {})
    }

    toast.success(`Group "${newGroup.name}" created!`)
  }

  // Create real channel
  async function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault()
    if (!newChannelName.trim()) {
      toast.error('Channel name is required')
      return
    }

    const channelId = `channel-${Date.now()}`
    const newChan: UserChannel = {
      id: channelId,
      name: newChannelName.trim(),
      badgeText: newChannelBadge.trim() || 'BROADCAST',
      desc: newChannelDesc.trim() || 'Official broadcast channel',
      createdBy: user?.fullName || user?.email || 'User',
      createdAt: new Date().toISOString(),
      subscribers: '1 subscriber',
    }

    setChannels((prev) => [newChan, ...prev])
    setActiveBroadcast(newChan)
    setActiveTab('channels')
    setCreateChannelOpen(false)
    setNewChannelName('')
    setNewChannelDesc('')

    // Broadcast channel creation via metadata message
    if (user) {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          content: `[CHANNEL_META:${JSON.stringify({
            type: 'channel',
            name: newChan.name,
            badgeText: newChan.badgeText,
            desc: newChan.desc,
          })}] Channel "${newChan.name}" created by ${user.fullName || user.email}`,
        }),
      }).catch(() => {})
    }

    toast.success(`Channel "${newChan.name}" created!`)
  }

  // Create real DM
  function handleCreateDM(e: React.FormEvent) {
    e.preventDefault()
    if (!newDMName.trim()) {
      toast.error('Recipient name or contact is required')
      return
    }

    const dmChannelId = `dm-${Date.now()}`
    const newDM: UserDM = {
      id: dmChannelId,
      name: newDMName.trim(),
      role: newDMRole,
      channelId: dmChannelId,
      phone: newDMPhone.trim() || undefined,
      verified: newDMRole === 'LANDLORD' || newDMRole === 'AGENT',
      lastMessage: 'Conversation started',
      lastTime: 'Just now',
    }

    setDms((prev) => [newDM, ...prev])
    setActiveDM(newDM)
    setActiveTab('dms')
    setCreateDMOpen(false)
    setNewDMName('')
    setNewDMPhone('')

    toast.success(`Started direct conversation with ${newDM.name}`)
  }

  // Admin: Fetch all platform DMs for surveillance and oversight
  const fetchAdminDMs = useCallback(async () => {
    if (!isAdmin) return
    try {
      const res = await fetch('/api/chat?action=dms')
      if (res.ok) {
        const data = await res.json()
        if (data.dms && Array.isArray(data.dms)) {
          setDms((prev) => {
            const map = new Map<string, UserDM>()
            // Add discovered DMs
            data.dms.forEach((d: any) => {
              map.set(d.channelId, {
                id: d.channelId,
                name: d.name || `DM ${d.channelId}`,
                role: d.role || 'TENANT',
                channelId: d.channelId,
                lastMessage: d.lastMessage,
                lastTime: new Date(d.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              })
            })
            // Overlay existing local DMs
            prev.forEach((d) => map.set(d.channelId, d))
            return Array.from(map.values())
          })
        }
      }
    } catch (e) {
      console.warn('Failed to fetch admin DMs:', e)
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin && activeTab === 'dms') {
      fetchAdminDMs()
    }
  }, [isAdmin, activeTab, fetchAdminDMs])

  // Admin action: Clear text in the active DM to save storage
  async function handleClearActiveDMText() {
    if (!activeDM) return
    if (!confirm(`Are you sure you want to clear all text in DM #${activeDM.id} with ${activeDM.name} to free up Supabase storage?`)) return
    setPurging(true)
    try {
      const res = await fetch(`/api/chat?channelId=${activeDM.id}&purge=true`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Cleared DM text to preserve database storage')
        setMessages([])
        fetchAdminDMs()
      } else {
        toast.error(data.error || 'Failed to clear DM')
      }
    } catch (err: any) {
      toast.error('Error clearing DM: ' + err.message)
    } finally {
      setPurging(false)
    }
  }

  // Admin action: Clear ALL DMs text across the database to preserve space
  async function handleClearAllDMsText() {
    if (!confirm('Are you sure you want to permanently clear ALL direct message (DM) texts across the database to reclaim storage space?')) return
    setPurging(true)
    try {
      const res = await fetch('/api/chat?scope=dms', { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Successfully cleared all DM texts to save database space')
        if (activeTab === 'dms') {
          setMessages([])
        }
        setStarPowerCleanOpen(false)
        fetchAdminDMs()
      } else {
        toast.error(data.error || 'Failed to clear DMs')
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message)
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

  // Role badges
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

  const isInConversation =
    activeTab === 'world' ||
    (activeTab === 'dms' && activeDM !== null) ||
    (activeTab === 'groups' && activeGroup !== null) ||
    (activeTab === 'channels' && activeBroadcast !== null)

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
      ? activeDM?.listingTitle ? `Regarding: ${activeDM.listingTitle}` : 'Direct Conversation'
      : activeTab === 'groups'
      ? `${activeGroup?.category} · Community Group`
      : `${activeBroadcast?.badgeText} · Official Channel`

  return (
    <div className="h-full flex flex-col bg-[#FAF7F2] text-[#271810] overflow-hidden select-none">
      {/* =========================================================================
          TOP APP BAR: Header, Star Power Space Controls, & Connection
         ========================================================================= */}
      <header className="shrink-0 bg-white border-b border-[#E5DAC8] px-3 sm:px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
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
                {isInConversation && activeTab !== 'world' ? conversationSubtitle : 'Real-time property connections'}
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

          {/* Star Power (Admin) Storage Cleanup Action */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStarPowerCleanOpen(true)}
              className="h-7 px-2 border-amber-300 bg-amber-50 text-[#78350F] hover:bg-amber-100 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1"
              title="Star Power: Manage chat storage & free up space"
            >
              <Database className="h-3 w-3" />
              <span className="hidden sm:inline">Storage Clean</span>
            </Button>
          )}

          {/* Admin direct DM text clear to save storage */}
          {isAdmin && activeTab === 'dms' && activeDM && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearActiveDMText}
              disabled={purging}
              className="h-7 px-2 border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1"
              title="Clear all text in this DM to save Supabase storage"
            >
              <Trash2 className="h-3 w-3 text-rose-600" />
              <span className="hidden sm:inline">Clear DM Text</span>
            </Button>
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
          TAB NAVIGATION: 4 Simple Pills (World / DMs / Groups / Channels)
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
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'dms'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'text-[#7C6859] hover:text-[#271810]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>DMs</span>
            {dms.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
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
            {/* Header with Search and Create Action */}
            <div className="p-2 border-b border-[#E5DAC8] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C6859]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="pl-8 h-8 text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-lg"
                />
              </div>

              {/* Action Button: Create Group / Channel / DM */}
              {activeTab === 'groups' && (
                <Button
                  size="sm"
                  onClick={() => setCreateGroupOpen(true)}
                  className="h-8 px-2.5 bg-[#78350F] hover:bg-[#854D0E] text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                  title="Create a new group"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Group
                </Button>
              )}

              {activeTab === 'channels' && (
                <Button
                  size="sm"
                  onClick={() => setCreateChannelOpen(true)}
                  className="h-8 px-2.5 bg-[#78350F] hover:bg-[#854D0E] text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                  title="Create an announcement channel"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Channel
                </Button>
              )}

              {activeTab === 'dms' && (
                <Button
                  size="sm"
                  onClick={() => setCreateDMOpen(true)}
                  className="h-8 px-2.5 bg-[#78350F] hover:bg-[#854D0E] text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                  title="Start a direct conversation"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> DM
                </Button>
              )}
            </div>

            {/* DMs List */}
            {activeTab === 'dms' && (
              <div>
                {/* User-facing End-to-End Encryption Banner */}
                <div className="m-2.5 p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl text-center text-[10px] text-[#78350F] flex items-center justify-center gap-1.5 shadow-2xs">
                  <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span><strong>End-to-End Encrypted</strong> · Messages in direct chats are private and secure</span>
                </div>

                {/* Admin Vault Surveillance Indicator */}
                {isAdmin && (
                  <div className="mx-2.5 mb-2 px-2.5 py-1 bg-[#2A1810] border border-[#523018] rounded-lg text-[9px] text-amber-300 flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1">
                      <Shield className="h-3 w-3 text-amber-400" /> Admin Vault Active ({dms.length} DMs)
                    </span>
                    <button
                      onClick={fetchAdminDMs}
                      className="underline text-amber-400 hover:text-white cursor-pointer"
                    >
                      Sync All
                    </button>
                  </div>
                )}

                <div className="divide-y divide-[#E5DAC8]/50">
                {dms.filter((dm) =>
                  dm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (dm.lastMessage && dm.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
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
                        {dm.name.substring(0, 2).toUpperCase()}
                        {dm.verified && (
                          <CheckCircle2 className="h-3 w-3 text-amber-300 absolute -bottom-0.5 -right-0.5 bg-[#78350F] rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#271810] truncate">{dm.name}</span>
                          <span className="text-[10px] text-[#7C6859] shrink-0">{dm.lastTime || 'Active'}</span>
                        </div>
                        <div className="mt-0.5">{renderRoleBadge(dm.role)}</div>
                        <p className="text-[11px] text-[#7C6859] truncate mt-1">
                          {dm.lastMessage || 'Direct inquiry'}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {dms.length === 0 && (
                  <div className="p-8 text-center text-[#7C6859]">
                    <MessageSquare className="h-8 w-8 mx-auto text-[#78350F]/40 mb-2" />
                    <p className="text-xs font-semibold">No direct messages yet</p>
                    <p className="text-[11px] text-[#7C6859] mt-1">
                      Start a direct chat with a landlord, agent, or tenant.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setCreateDMOpen(true)}
                      className="mt-3 h-8 bg-[#78350F] text-white text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Start Direct Message
                    </Button>
                  </div>
                )}
                </div>
              </div>
            )}

            {/* Groups List */}
            {activeTab === 'groups' && (
              <div className="divide-y divide-[#E5DAC8]/50">
                {groups.filter((g) =>
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
                        <p className="text-[11px] text-[#7C6859] truncate mt-1">{grp.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#7C6859] shrink-0 mt-1" />
                    </div>
                  )
                })}

                {groups.length === 0 && (
                  <div className="p-8 text-center text-[#7C6859]">
                    <Users className="h-8 w-8 mx-auto text-[#78350F]/40 mb-2" />
                    <p className="text-xs font-semibold">No groups yet</p>
                    <p className="text-[11px] text-[#7C6859] mt-1">
                      Create the first campus or lodge community group!
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setCreateGroupOpen(true)}
                      className="mt-3 h-8 bg-[#78350F] text-white text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Create Group
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Channels List */}
            {activeTab === 'channels' && (
              <div className="divide-y divide-[#E5DAC8]/50">
                {channels.filter((c) =>
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
                        <p className="text-[10px] text-[#7C6859] mt-0.5">{chan.subscribers}</p>
                        <p className="text-[11px] text-[#7C6859] truncate mt-1">{chan.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#7C6859] shrink-0 mt-1" />
                    </div>
                  )
                })}

                {channels.length === 0 && (
                  <div className="p-8 text-center text-[#7C6859]">
                    <Radio className="h-8 w-8 mx-auto text-[#78350F]/40 mb-2" />
                    <p className="text-xs font-semibold">No channels yet</p>
                    <p className="text-[11px] text-[#7C6859] mt-1">
                      Create an official channel to broadcast property vacancies and inspection alerts.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setCreateChannelOpen(true)}
                      className="mt-3 h-8 bg-[#78350F] text-white text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Create Channel
                    </Button>
                  </div>
                )}
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
              <p className="text-xs font-semibold">Select or create a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Optional Active Lodge Context Header */}
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
                {/* User-facing End-to-End Encryption Banner inside DMs */}
                {activeTab === 'dms' && (
                  <div className="mx-auto max-w-sm bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 text-center text-[10px] text-[#78350F] shadow-2xs space-y-1 mb-3">
                    <div className="flex items-center justify-center gap-1.5 font-bold text-xs text-[#78350F]">
                      <Lock className="h-3.5 w-3.5 text-emerald-600" />
                      <span>End-to-End Encrypted</span>
                    </div>
                    <p className="text-[#7C6859] leading-relaxed">
                      Messages and calls are end-to-end encrypted. No one outside of this chat can read them.
                    </p>
                    {isAdmin && (
                      <div className="pt-1.5 mt-1 border-t border-amber-200/60 text-[9px] font-bold text-amber-800 flex items-center justify-center gap-1.5">
                        <Shield className="h-2.5 w-2.5 text-[#78350F]" />
                        <span>Admin Oversight Mode · Viewing Private DM Transcript</span>
                      </div>
                    )}
                  </div>
                )}
                {loading && messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#7C6859]">
                    Loading messages from database…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#7C6859] space-y-1">
                    <p className="font-semibold text-[#271810]">
                      {activeTab === 'world'
                        ? 'Welcome to World Square!'
                        : `Conversation #${currentChannelId} is ready.`}
                    </p>
                    <p>Be the first to post a message or inquiry!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = user ? msg.senderId === user.id : false
                    const canDelete = isMe || isAdmin
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

                          {/* Delete message to preserve database space */}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 ml-1 transition cursor-pointer"
                              title="Delete message from database"
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
                                  className="h-6 text-[10px] bg-amber-600 hover:bg-amber-700 text-white px-2 shrink-0 cursor-pointer"
                                >
                                  Inspect
                                </Button>
                              )}
                            </div>
                          )}

                          <p className="whitespace-pre-wrap">{cleanText}</p>

                          {/* Existing Reactions Pill */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-black/5">
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
                              className="text-xs hover:scale-125 transition p-0.5 cursor-pointer"
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
                {/* Suggestions Dropdown */}
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
                        className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white border border-[#E5DAC8] text-[#78350F] hover:bg-amber-50 shrink-0 transition cursor-pointer"
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
                      className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
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
                    className="h-9 w-9 p-0 text-[#78350F] hover:bg-[#FAF7F2] rounded-xl shrink-0 cursor-pointer"
                    title="Quick property phrases"
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachModalOpen(true)}
                    className="h-9 w-9 p-0 text-[#78350F] hover:bg-[#FAF7F2] rounded-xl shrink-0 cursor-pointer"
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
                        : 'Sign in to chat with landlords, agents & students…'
                    }
                    disabled={sending}
                    className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8] rounded-xl flex-1 focus:border-[#78350F]"
                  />

                  {user ? (
                    <Button
                      type="submit"
                      disabled={(!input.trim() && !selectedLodgeToAttach) || sending}
                      className="h-9 px-3.5 bg-[#78350F] hover:bg-[#854D0E] text-white rounded-xl font-bold shrink-0 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => onOpenAuth('login')}
                      className="h-9 px-3 bg-[#78350F] hover:bg-[#854D0E] text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer"
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
          MODAL 1: Create Group Dialog
         ========================================================================= */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="max-w-md bg-white border-[#E5DAC8] rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-[#271810]">
              <Users className="h-5 w-5 text-[#78350F]" />
              Create Campus or Community Group
            </DialogTitle>
            <DialogDescription className="text-xs text-[#7C6859]">
              Create a group for your campus, neighborhood, or roommate finding.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGroup} className="space-y-3 mt-3">
            <div>
              <label className="text-xs font-semibold text-[#271810] block mb-1">Group Name</label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. IMSU Front Gate Hunters"
                className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#271810] block mb-1">Campus / Category</label>
              <Input
                value={newGroupCategory}
                onChange={(e) => setNewGroupCategory(e.target.value)}
                placeholder="e.g. IMSU, FUTO, UNN, Roommate Match"
                className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#271810] block mb-1">Description</label>
              <Textarea
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                placeholder="Describe what members can discuss, share, or report in this group..."
                className="text-xs bg-[#FAF7F2] border-[#E5DAC8] resize-none h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateGroupOpen(false)}
                className="h-9 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 bg-[#78350F] hover:bg-[#854D0E] text-white text-xs font-bold cursor-pointer"
              >
                Create Group
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 2: Create Channel Dialog
         ========================================================================= */}
      <Dialog open={createChannelOpen} onOpenChange={setCreateChannelOpen}>
        <DialogContent className="max-w-md bg-white border-[#E5DAC8] rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-[#271810]">
              <Radio className="h-5 w-5 text-[#78350F]" />
              Create Announcement Channel
            </DialogTitle>
            <DialogDescription className="text-xs text-[#7C6859]">
              Broadcast verified property vacancies, landlord bulletins, and inspection tours.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateChannel} className="space-y-3 mt-3">
            <div>
              <label className="text-xs font-semibold text-[#271810] block mb-1">Channel Name</label>
              <Input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="e.g. Mapstar Instant 0% Fee Drops"
                className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#271810] block mb-1">Badge / Tag</label>
              <Input
                value={newChannelBadge}
                onChange={(e) => setNewChannelBadge(e.target.value)}
                placeholder="e.g. 0% Fee, Direct Landlord, 5% Cap"
                className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#271810] block mb-1">Description</label>
              <Textarea
                value={newChannelDesc}
                onChange={(e) => setNewChannelDesc(e.target.value)}
                placeholder="What announcements will subscribers receive in this channel?"
                className="text-xs bg-[#FAF7F2] border-[#E5DAC8] resize-none h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateChannelOpen(false)}
                className="h-9 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 bg-[#78350F] hover:bg-[#854D0E] text-white text-xs font-bold cursor-pointer"
              >
                Create Channel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 3: Start Direct Message (DM) Dialog
         ========================================================================= */}
      <Dialog open={createDMOpen} onOpenChange={setCreateDMOpen}>
        <DialogContent className="max-w-md bg-white border-[#E5DAC8] rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-[#271810]">
              <MessageSquare className="h-5 w-5 text-[#78350F]" />
              Start Direct Message
            </DialogTitle>
            <DialogDescription className="text-xs text-[#7C6859]">
              Connect directly with a landlord, agent, or prospective tenant.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDM} className="space-y-3 mt-3">
            <div>
              <label className="text-xs font-semibold text-[#271810] block mb-1">Recipient Name</label>
              <Input
                value={newDMName}
                onChange={(e) => setNewDMName(e.target.value)}
                placeholder="e.g. Chief Emeka or Engr. Victor"
                className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#271810] block mb-1">Role</label>
              <select
                value={newDMRole}
                onChange={(e: any) => setNewDMRole(e.target.value)}
                className="w-full h-9 text-xs bg-[#FAF7F2] border border-[#E5DAC8] rounded-lg px-2 text-[#271810] font-semibold"
              >
                <option value="LANDLORD">🏛️ Landlord (Property Owner)</option>
                <option value="AGENT">🛡️ Verified Agent (5% Cap)</option>
                <option value="TENANT">🎓 Student / Tenant</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#271810] block mb-1">Phone Number (Optional)</label>
              <Input
                value={newDMPhone}
                onChange={(e) => setNewDMPhone(e.target.value)}
                placeholder="e.g. +234 803 123 4567"
                className="h-9 text-xs bg-[#FAF7F2] border-[#E5DAC8]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateDMOpen(false)}
                className="h-9 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 bg-[#78350F] hover:bg-[#854D0E] text-white text-xs font-bold cursor-pointer"
              >
                Start Chat
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 4: Star Power Chat Storage Space Cleanup Dialog
         ========================================================================= */}
      {isAdmin && (
        <Dialog open={starPowerCleanOpen} onOpenChange={setStarPowerCleanOpen}>
          <DialogContent className="max-w-md bg-white border-[#E5DAC8] rounded-2xl p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-700">
                <Trash2 className="h-5 w-5 text-rose-600" />
                Star Power: Preserve Database Space
              </DialogTitle>
              <DialogDescription className="text-xs text-[#7C6859]">
                Purge messages from Supabase PostgreSQL to free up table storage and maintain high speed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <h4 className="text-xs font-bold text-rose-900">Purge Active Channel</h4>
                <p className="text-[11px] text-rose-700">
                  Permanently deletes all messages in <strong>#{currentChannelId}</strong>.
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handlePurgeCurrentChannel}
                  disabled={purging || messages.length === 0}
                  className="mt-2 h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  {purging ? 'Purging…' : `Purge #${currentChannelId}`}
                </Button>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <h4 className="text-xs font-bold text-[#78350F]">Clear Historical Messages</h4>
                <p className="text-[11px] text-[#7C6859]">
                  Delete old messages across all channels to reclaim storage.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePurgeOldMessages(30)}
                    disabled={purging}
                    className="h-8 text-xs border-[#E5DAC8] text-[#78350F] hover:bg-amber-100 cursor-pointer"
                  >
                    Delete &gt; 30 Days
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePurgeOldMessages(7)}
                    disabled={purging}
                    className="h-8 text-xs border-[#E5DAC8] text-[#78350F] hover:bg-amber-100 cursor-pointer"
                  >
                    Delete &gt; 7 Days
                  </Button>
                </div>
              </div>

              {/* Direct Messages (DMs) Space Recovery */}
              <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#78350F] flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-700" />
                    Direct Messages (DMs) Space Recovery
                  </h4>
                  <Badge className="bg-amber-100 text-[#78350F] border border-amber-300 text-[9px]">
                    Private Chats
                  </Badge>
                </div>
                <p className="text-[11px] text-[#7C6859] leading-relaxed">
                  Permanently clear all text and message records in private direct chats across the database to preserve storage space.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleClearAllDMsText}
                    disabled={purging}
                    className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                  >
                    {purging ? 'Clearing…' : 'Clear All DMs Text (Save Storage)'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          MODAL 5: Attach Lodge Picker
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
                <Button size="sm" className="h-6 text-[10px] bg-[#78350F] text-white px-2 cursor-pointer">
                  Attach
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

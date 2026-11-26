'use client'

import { useState, useEffect, useRef } from 'react'
import {
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AuthedUser } from '@/components/mapstar/login-signup-dialog'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  senderName: string
  senderRole: 'TENANT' | 'LANDLORD' | 'AGENT' | 'ADMIN'
  content: string
  createdAt: string
}

interface ChatViewProps {
  user: AuthedUser | null
  onOpenAuth: (mode?: 'login' | 'signup') => void
}

const CHANNELS = [
  {
    id: 'student-lodges',
    name: 'Student Lodges',
    icon: GraduationCap,
    desc: 'Public chat for students around FUTO, IMSU, UNN & ESUT',
  },
  {
    id: 'verified-agents',
    name: 'Verified Agents',
    icon: Shield,
    desc: 'Connect with fee-capped, verified agents',
  },
  {
    id: 'direct-landlords',
    name: 'Direct Landlords',
    icon: Building,
    desc: 'Chat directly with property owners',
  },
]

export default function ChatView({ user, onOpenAuth }: ChatViewProps) {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0].id)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [purging, setPurging] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.role === 'ADMIN'

  // Fetch messages from Supabase Postgres
  async function fetchMessages(channelId: string, showToast = false) {
    try {
      setLoading(true)
      const res = await fetch(`/api/chat?channelId=${encodeURIComponent(channelId)}`)
      if (!res.ok) {
        throw new Error('Failed to load chat messages')
      }
      const data = await res.json()
      setMessages(data.messages || [])
      if (showToast) {
        toast.success('Chat refreshed')
      }
    } catch (err: any) {
      console.error('[ChatView fetch error]', err)
      toast.error(err.message || 'Error loading chat messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchMessages(activeChannel)
    }
  }, [activeChannel, user])

  // Periodic polling for new messages every 6 seconds
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      fetch(`/api/chat?channelId=${encodeURIComponent(activeChannel)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.messages) {
            setMessages(data.messages)
          }
        })
        .catch(() => {})
    }, 6000)

    return () => clearInterval(interval)
  }, [activeChannel, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChannel])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !user || sending) return

    const trimmed = input.trim()
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: activeChannel,
          content: trimmed,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to post message')
      }

      const data = await res.json()
      if (data.message) {
        setMessages((prev) => [...prev, data.message])
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not send message')
      setInput(trimmed) // Restore text on failure
    } finally {
      setSending(false)
    }
  }

  // Admin delete single message permanently
  async function handleDeleteMessage(id: string) {
    if (!isAdmin) return
    if (!confirm('Permanently delete this message from Supabase PostgreSQL?')) return

    try {
      setDeletingId(id)
      const res = await fetch(`/api/chat?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete message')
      }

      setMessages((prev) => prev.filter((m) => m.id !== id))
      toast.success('Message permanently deleted from database')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete message')
    } finally {
      setDeletingId(null)
    }
  }

  // Admin purge entire channel history permanently
  async function handlePurgeChannel() {
    if (!isAdmin) return
    const channelObj = CHANNELS.find((c) => c.id === activeChannel)
    const promptConfirm = confirm(
      `WARNING: Permanently delete ALL messages in #${channelObj?.name || activeChannel} from Supabase? This action is irreversible.`
    )
    if (!promptConfirm) return

    try {
      setPurging(true)
      const res = await fetch(`/api/chat?channelId=${encodeURIComponent(activeChannel)}&purge=true`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to purge channel history')
      }

      const data = await res.json()
      setMessages([])
      toast.success(data.message || 'Channel history permanently cleared')
    } catch (err: any) {
      toast.error(err.message || 'Failed to purge chat history')
    } finally {
      setPurging(false)
    }
  }

  // Logged-out state: "log in to use feature"
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F8FAFC] dark:bg-[#070A12]">
        <div className="max-w-md w-full bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-50 dark:bg-[#2A1810]/60 border border-amber-200 dark:border-[#523018]/60 flex items-center justify-center mb-5 shadow-inner">
            <Lock className="h-8 w-8 text-[#78350F] dark:text-[#E0904E]" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Log in to use Community Chat
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
            Chat in real time with property owners, verified agents, and fellow student tenants. Discuss lodge inspections, negotiate rent, and ask neighborhood questions directly.
          </p>

          <div className="space-y-2.5">
            <Button
              className="w-full h-10 bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white font-semibold text-xs shadow-md shadow-[#78350F]/25 cursor-pointer"
              onClick={() => onOpenAuth('login')}
            >
              <LogIn className="h-4 w-4 mr-2" /> Log in to use feature
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

  const currentChanInfo = CHANNELS.find((c) => c.id === activeChannel)

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#F8FAFC] dark:bg-[#070A12]">
      {/* Channels Sidebar */}
      <div className="w-full md:w-64 shrink-0 bg-white dark:bg-[#090D18] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex md:flex-col overflow-x-auto p-3 gap-2">
        <div className="hidden md:block mb-2 px-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[#78350F]" /> Supabase Live Channels
          </div>
        </div>
        {CHANNELS.map((ch) => {
          const Icon = ch.icon
          const isActive = activeChannel === ch.id
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#78350F] dark:bg-[#B45309] text-white shadow-sm shadow-[#78350F]/25 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <div className="truncate font-semibold">{ch.name}</div>
                <div className={`text-[10px] truncate hidden md:block ${isActive ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {ch.desc}
                </div>
              </div>
            </button>
          )
        })}

        {isAdmin && (
          <div className="hidden md:block mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 px-2">
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase flex items-center gap-1 mb-1">
              <Shield className="h-3 w-3" /> Admin Moderation Active
            </div>
            <p className="text-[10px] text-slate-500">
              You can delete individual messages or wipe whole channels permanently from the database.
            </p>
          </div>
        )}
      </div>

      {/* Main Chat Thread */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Channel Header */}
        <div className="shrink-0 bg-white dark:bg-[#090D18] border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              #{currentChanInfo?.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              · {currentChanInfo?.desc}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchMessages(activeChannel, true)}
              className="h-7 px-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Refresh messages"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>

            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handlePurgeChannel}
                disabled={purging || messages.length === 0}
                className="h-7 px-2.5 text-xs bg-red-600/90 hover:bg-red-700 text-white shadow-xs font-medium cursor-pointer"
                title="Permanently delete all messages in this channel from Supabase"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {purging ? 'Purging...' : 'Purge Channel History'}
              </Button>
            )}

            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Live DB
            </Badge>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {loading && messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Loading chat messages from Supabase...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No messages yet in #{currentChanInfo?.name}. Be the first to say hello!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user.id
              const isDeleting = deletingId === msg.id

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {msg.senderName}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                      {msg.senderRole}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Admin Delete Action Button */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        title="Delete permanently from Supabase"
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition p-0.5 ml-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div
                    className={`max-w-lg rounded-2xl px-4 py-2 text-xs shadow-xs leading-relaxed relative ${
                      isMe
                        ? 'bg-[#78350F] dark:bg-[#B45309] text-white rounded-tr-xs'
                        : 'bg-white dark:bg-[#0E1526] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="shrink-0 p-3 bg-white dark:bg-[#090D18] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message #${currentChanInfo?.name}...`}
            disabled={sending}
            className="h-10 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
          />
          <Button
            type="submit"
            disabled={!input.trim() || sending}
            className="h-10 px-4 bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white font-semibold rounded-xl cursor-pointer shadow-sm shadow-[#78350F]/25"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

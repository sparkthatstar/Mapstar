'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Send,
  Users,
  Shield,
  Building,
  GraduationCap,
  Lock,
  LogIn,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AuthedUser } from '@/components/mapstar/login-signup-dialog'

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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    channelId: 'student-lodges',
    senderId: 'user_agent_01',
    senderName: 'Amaka Obi (Verified Agent)',
    senderRole: 'AGENT',
    content: 'Welcome to Mapstar Chat! Feel free to ask about lodge availability around IMSU and UNN. All agent fees are legally capped at 5%.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg_2',
    channelId: 'student-lodges',
    senderId: 'user_landlord_01',
    senderName: 'Chief Emeka Eze',
    senderRole: 'LANDLORD',
    content: 'Just updated the water pump and prepaid meter at my lodge in Works Layout, Owerri. Inspected yesterday.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'msg_3',
    channelId: 'student-lodges',
    senderId: 'user_tenant_01',
    senderName: 'Chinedu Okeke',
    senderRole: 'TENANT',
    content: 'Has anyone seen the self-con near FUTO back gate? Looking for a quiet place with 24/7 borehole.',
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
]

export default function ChatView({ user, onOpenAuth }: ChatViewProps) {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0].id)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mapstar_chat_messages')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return INITIAL_MESSAGES
  })
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem('mapstar_chat_messages', JSON.stringify(messages))
    } catch {}
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChannel])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !user) return

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      channelId: activeChannel,
      senderId: user.id,
      senderName: user.fullName || user.email,
      senderRole: user.role,
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMsg])
    setInput('')
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

  // Filter messages for active channel
  const channelMessages = messages.filter((m) => m.channelId === activeChannel)
  const currentChanInfo = CHANNELS.find((c) => c.id === activeChannel)

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#F8FAFC] dark:bg-[#070A12]">
      {/* Channels Sidebar */}
      <div className="w-full md:w-64 shrink-0 bg-white dark:bg-[#090D18] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex md:flex-col overflow-x-auto p-3 gap-2">
        <div className="hidden md:block mb-2 px-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[#78350F]" /> Real-time Channels
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
          <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Live
          </Badge>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {channelMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No messages yet in #{currentChanInfo?.name}. Be the first to say hello!
            </div>
          ) : (
            channelMessages.map((msg) => {
              const isMe = msg.senderId === user.id
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
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
                  </div>
                  <div
                    className={`max-w-lg rounded-2xl px-4 py-2 text-xs shadow-xs leading-relaxed ${
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
            className="h-10 text-xs bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
          />
          <Button
            type="submit"
            disabled={!input.trim()}
            className="h-10 px-4 bg-[#78350F] dark:bg-[#B45309] hover:bg-[#854D0E] dark:hover:bg-[#C2783B] text-white font-semibold rounded-xl cursor-pointer shadow-sm shadow-[#78350F]/25"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

'use client'

import { Building2, MessageSquare, User, Settings } from 'lucide-react'

export type NavTab = 'listings' | 'chat' | 'me' | 'settings'

interface BottomNavigationProps {
  currentTab: NavTab
  onTabChange: (tab: NavTab) => void
  unreadChatCount?: number
  isLoggedIn?: boolean
}

export default function BottomNavigation({
  currentTab,
  onTabChange,
  unreadChatCount = 0,
  isLoggedIn = false,
}: BottomNavigationProps) {
  const tabs = [
    {
      id: 'listings' as NavTab,
      label: 'Listings',
      icon: Building2,
    },
    {
      id: 'chat' as NavTab,
      label: 'Chat',
      icon: MessageSquare,
      badge: unreadChatCount > 0 ? unreadChatCount : undefined,
    },
    {
      id: 'me' as NavTab,
      label: 'Me',
      icon: User,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
    },
  ]

  return (
    <nav
      aria-label="Bottom Navigation"
      className="shrink-0 w-full z-40 bg-white/95 dark:bg-[#090D18]/95 border-t border-slate-200 dark:border-slate-800/90 backdrop-blur-md shadow-lg transition-colors py-1.5 px-4 sm:px-8"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative min-w-[64px] ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

'use client'

import { Building2, MessageSquare, User, Settings, Users, LifeBuoy } from 'lucide-react'

export type NavTab = 'listings' | 'chat' | 'support' | 'star_power' | 'me' | 'settings'

interface BottomNavigationProps {
  currentTab: NavTab
  onTabChange: (tab: NavTab) => void
  unreadChatCount?: number
  isLoggedIn?: boolean
  isAdmin?: boolean
}

export default function BottomNavigation({
  currentTab,
  onTabChange,
  unreadChatCount = 0,
  isLoggedIn = false,
  isAdmin = false,
}: BottomNavigationProps) {
  const baseTabs = [
    {
      id: 'listings' as NavTab,
      label: 'Listings',
      icon: Building2,
      isStarPower: false,
    },
    {
      id: 'chat' as NavTab,
      label: 'Socials',
      icon: Users,
      badge: unreadChatCount > 0 ? unreadChatCount : undefined,
      isStarPower: false,
    },
    {
      id: 'support' as NavTab,
      label: 'Support',
      icon: LifeBuoy,
      isStarPower: false,
    },
  ]

  const starPowerTab = {
    id: 'star_power' as NavTab,
    label: 'Star Power',
    icon: null,
    isStarPower: true,
  }

  const trailingTabs = [
    {
      id: 'me' as NavTab,
      label: 'Me',
      icon: User,
      isStarPower: false,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      isStarPower: false,
    },
  ]

  // Insert 'Star Power' between 'chat' and 'me' exclusively for Administrators
  const tabs = isAdmin
    ? [...baseTabs, starPowerTab, ...trailingTabs]
    : [...baseTabs, ...trailingTabs]

  return (
    <nav
      aria-label="Bottom Navigation"
      className="shrink-0 w-full z-40 bg-white/95 dark:bg-[#1A120B]/95 border-t border-[#E5DAC8] dark:border-[#382618] backdrop-blur-md shadow-lg transition-colors py-1.5 px-3 sm:px-6"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id

          if (tab.isStarPower) {
            return (
              <button
                key="star_power"
                onClick={() => onTabChange('star_power')}
                className="relative flex flex-col items-center justify-center -mt-3.5 group cursor-pointer px-1.5 focus:outline-none"
                title="Star Power — Administrator Database & Systems Center"
              >
                {/* Outer Golden Aura / Glow */}
                <div
                  className={`absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 transition-all duration-300 ${
                    isActive
                      ? 'opacity-100 blur-lg scale-110'
                      : 'opacity-50 blur-md group-hover:opacity-85'
                  }`}
                />

                {/* Shiny Glassy Yellow Star Emblem */}
                <div
                  className={`relative h-11 w-11 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 p-0.5 shadow-lg shadow-amber-500/50 border border-yellow-100/90 dark:border-yellow-200/90 backdrop-blur-md transition-all duration-200 group-hover:scale-108 ${
                    isActive
                      ? 'scale-110 ring-2 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-[#1A120B] shadow-amber-400/80'
                      : ''
                  }`}
                >
                  {/* Glossy sheen reflection */}
                  <div className="absolute inset-0 rounded-[14px] bg-gradient-to-b from-white/70 via-white/20 to-transparent pointer-events-none" />

                  <div className="h-full w-full rounded-[14px] flex items-center justify-center bg-gradient-to-b from-amber-200/40 to-amber-600/40 relative">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6 text-amber-950 fill-amber-950 drop-shadow-sm filter transition-transform group-hover:rotate-12 duration-200"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {/* Sparkle Ping */}
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white shadow-xs animate-ping" />
                  </div>
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] mt-1 tracking-tight font-extrabold transition-colors ${
                    isActive
                      ? 'text-[#78350F] dark:text-[#E0904E] scale-105'
                      : 'text-amber-800 dark:text-amber-300/90'
                  }`}
                >
                  Star Power
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 w-6 h-0.5 bg-[#78350F] dark:bg-[#E0904E] rounded-full" />
                )}
              </button>
            )
          }

          const Icon = tab.icon!
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative min-w-[56px] sm:min-w-[64px] ${
                isActive
                  ? 'text-[#78350F] dark:text-[#E0904E] font-bold'
                  : 'text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-[#FAF6F0] font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#78350F] dark:bg-[#B45309] text-[9px] font-bold text-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[#78350F] dark:bg-[#E0904E] rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, HelpCircle, X, Navigation, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NewUserBannerProps {
  onOpenGuide: () => void
}

const STORAGE_BANNER_KEY = 'mapstar_has_dismissed_welcome_banner'

export default function NewUserBanner({ onOpenGuide }: NewUserBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_BANNER_KEY)
      if (!dismissed) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_BANNER_KEY, 'true')
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="shrink-0 mb-3 mx-0.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-blue-50/90 dark:from-blue-950/40 dark:via-[#0E172C] dark:to-blue-950/30 p-3 sm:p-3.5 shadow-xs relative text-slate-900 dark:text-slate-100 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                👋 First time on Mapstar?
              </span>
              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                New User Guide
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Green pins = Available lodges. Orange pins = Coming soon. Click <strong>Inspect</strong> on any card for regulated fee breakdowns, or use <strong>Directions</strong> to route directly to the gate with spoken GPS.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={onOpenGuide}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-white dark:bg-[#070A12] border border-blue-200 dark:border-blue-800/80 px-2.5 py-1 rounded-lg shadow-2xs hover:shadow-xs transition cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Show Me the Ropes (1-Min Tour)</span>
                <ArrowRight className="h-3 w-3 ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer shrink-0"
          title="Dismiss tip"
          aria-label="Dismiss welcome banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

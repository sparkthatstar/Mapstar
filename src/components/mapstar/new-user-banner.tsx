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
    <div className="shrink-0 mb-3 mx-0.5 rounded-xl border border-[#E5DAC8] dark:border-[#382618] bg-gradient-to-r from-[#FAF7F2] via-amber-50/70 to-[#FAF7F2] dark:from-[#1F140D] dark:via-[#24160E] dark:to-[#18100A] p-3 sm:p-3.5 shadow-xs relative text-[#271810] dark:text-[#FAF6F0] animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[#78350F] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 dark:bg-[#B45309]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0]">
                👋 First time on Mapstar?
              </span>
              <span className="text-[10px] font-semibold text-[#78350F] dark:text-[#E0904E] bg-amber-100/80 dark:bg-[#2A1810] px-1.5 py-0.2 rounded border border-amber-300 dark:border-[#523018]">
                New User Guide
              </span>
            </div>
            <p className="text-xs text-[#7C6859] dark:text-[#B8A598] mt-1 leading-relaxed">
              Green pins = Available lodges. Orange pins = Coming soon. Click <strong>Inspect</strong> on any card for regulated fee breakdowns, or use <strong>Directions</strong> to route directly to the gate with spoken GPS.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={onOpenGuide}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#78350F] hover:text-[#92400E] dark:text-[#E0904E] dark:hover:text-amber-200 bg-white dark:bg-[#120C08] border border-[#E5DAC8] dark:border-[#382618] px-2.5 py-1 rounded-lg shadow-2xs hover:shadow-xs transition cursor-pointer"
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
          className="text-[#7C6859] hover:text-[#271810] dark:text-[#B8A598] dark:hover:text-white p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer shrink-0"
          title="Dismiss tip"
          aria-label="Dismiss welcome banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Compass,
  MapPin,
  ShieldCheck,
  Navigation,
  SlidersHorizontal,
  Home,
  Droplet,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Building2,
  ExternalLink,
  HelpCircle,
  X,
  Play,
  Radio,
  Move,
} from 'lucide-react'
import MapstarAppIcon from '@/components/mapstar/app-icon'

interface WelcomeOnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectCity?: (city: string) => void
  onExplore?: () => void
}

const STORAGE_KEY = 'mapstar_has_seen_onboarding'

export default function WelcomeOnboardingModal({
  open,
  onOpenChange,
  onSelectCity,
  onExplore,
}: WelcomeOnboardingModalProps) {
  // Step 0: Welcome overview with choice to take tour or jump in
  // Step 1: Browse & Filter
  // Step 2: Floating Map Tools & Radar Scan
  // Step 3: Live Map & Voice GPS Directions
  // Step 4: Transparent Regulated Fees
  // Step 5: Request Inspection & Done
  const [currentStep, setCurrentStep] = useState<number>(0)

  // Mark as seen whenever closed or completed
  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}
    onOpenChange(false)
    if (onExplore) onExplore()
  }

  const startTour = () => {
    setCurrentStep(1)
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleDismiss()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    } else {
      setCurrentStep(0)
    }
  }

  const handleCityPick = (city: string) => {
    if (onSelectCity) onSelectCity(city)
    handleDismiss()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white dark:bg-[#1A120B] border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] shadow-2xl z-[9999] transition-colors">
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-[#4A2810] via-[#5C3317] to-[#2E180A] p-5 sm:p-6 text-white border-b border-[#382618]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapstarAppIcon className="h-8 w-8 shadow-md" />
              <div>
                <span className="font-extrabold tracking-tight text-lg text-white">Mapstar</span>
                <span className="ml-1.5 text-[10px] font-mono bg-[#2E180A]/80 px-1.5 py-0.5 rounded border border-[#B45309]/50 text-amber-200">
                  Quick Guide
                </span>
              </div>
            </div>

            {currentStep > 0 && (
              <span className="text-xs font-semibold text-amber-100 bg-[#78350F]/70 border border-[#B45309]/60 rounded-full px-2.5 py-0.5">
                Step {currentStep} of 5
              </span>
            )}
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold text-white mt-3 leading-snug">
            {currentStep === 0 && 'Welcome to Mapstar 👋'}
            {currentStep === 1 && '1. Find Verified Lodges 🔍'}
            {currentStep === 2 && '2. Floating Map Tools & Radar Scan 🧭'}
            {currentStep === 3 && '3. Live Map & GPS Directions 🗺️'}
            {currentStep === 4 && '4. Transparent Regulated Fees 🛡️'}
            {currentStep === 5 && '5. Inspect & Move In Safely 🎉'}
          </DialogTitle>

          <DialogDescription className="text-amber-100/90 text-xs sm:text-sm mt-1 leading-relaxed">
            {currentStep === 0 &&
              'Finding a verified student lodge or apartment in Nigeria without agent extortion just got 10x easier.'}
            {currentStep === 1 &&
              'Filter by running borehole water, prepaid meter, private toilet, and your budget range.'}
            {currentStep === 2 &&
              'Discover movable map tools, the spinning GPS locator, and the 30-second glassy radar wave scan.'}
            {currentStep === 3 &&
              'Get turn-by-turn navigation straight to the lodge gate from IMSU, FUTO, UNN, or your current GPS location.'}
            {currentStep === 4 &&
              'No surprise agent charges or duplicate payments. Every fee is regulated and broken down transparently.'}
            {currentStep === 5 &&
              'Request a physical inspection, chat directly with verified landlords, and secure your key handover.'}
          </DialogDescription>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* STEP 0: WELCOME CHOICE */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={startTour}
                  className="flex flex-col items-start p-4 rounded-xl border border-amber-300 dark:border-[#523018] bg-amber-50/80 dark:bg-[#2A1810] hover:bg-amber-100/70 dark:hover:bg-[#341F14] text-left transition cursor-pointer group shadow-xs"
                >
                  <div className="h-9 w-9 rounded-lg bg-[#78350F] dark:bg-[#B45309] text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-sm">
                    <Play className="h-4 w-4 fill-white" />
                  </div>
                  <span className="font-bold text-sm text-[#271810] dark:text-[#FAF6F0]">
                    Show Me the Ropes
                  </span>
                  <span className="text-xs text-[#7C6859] dark:text-[#B8A598] mt-1">
                    Take a 1-minute interactive walkthrough to learn how Mapstar works.
                  </span>
                  <span className="mt-3 inline-flex items-center text-xs font-semibold text-[#78350F] dark:text-[#E0904E] group-hover:translate-x-1 transition">
                    Start Tour <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex flex-col items-start p-4 rounded-xl border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] hover:bg-[#F3ECE2] dark:hover:bg-[#1F140D] text-left transition cursor-pointer group shadow-xs"
                >
                  <div className="h-9 w-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-sm">
                    <Compass className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm text-[#271810] dark:text-[#FAF6F0]">
                    Explore on My Own
                  </span>
                  <span className="text-xs text-[#7C6859] dark:text-[#B8A598] mt-1">
                    Jump straight to the live lodge listings and interactive map now.
                  </span>
                  <span className="mt-3 inline-flex items-center text-xs font-semibold text-[#7C6859] dark:text-[#B8A598] group-hover:translate-x-1 transition">
                    Skip directly to lodges <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </span>
                </button>
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="pt-3 border-t border-[#E5DAC8] dark:border-[#382618]">
                <span className="text-xs font-semibold text-[#7C6859] dark:text-[#B8A598] block mb-2">
                  Or jump directly to your campus city:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCityPick('Owerri')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5DAC8] dark:border-[#382618] bg-white dark:bg-[#120C08] hover:border-[#78350F] text-xs font-medium text-[#271810] dark:text-[#FAF6F0] shadow-2xs transition cursor-pointer"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" />
                    <span>Owerri (IMSU / FUTO / Nekede)</span>
                  </button>
                  <button
                    onClick={() => handleCityPick('Enugu')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5DAC8] dark:border-[#382618] bg-white dark:bg-[#120C08] hover:border-[#78350F] text-xs font-medium text-[#271810] dark:text-[#FAF6F0] shadow-2xs transition cursor-pointer"
                  >
                    <MapPin className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Enugu (UNN / ESUT / IMT)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: BROWSE & FILTER */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="rounded-xl border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-[#78350F] dark:bg-[#B45309] text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0]">
                    Live Status Pins & Badges
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-[#1A120B] border border-[#E5DAC8] dark:border-[#382618]">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[#3B2314] dark:text-[#FAF6F0] font-medium">Available Now</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-[#1A120B] border border-[#E5DAC8] dark:border-[#382618]">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-[#3B2314] dark:text-[#FAF6F0] font-medium">Coming Soon</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] p-4 space-y-2">
                <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0] flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" />
                  Quick Essential Filters
                </span>
                <p className="text-xs text-[#7C6859] dark:text-[#B8A598]">
                  Tap the quick filter pills at the top of the feed to immediately isolate lodges with <strong>Borehole Water</strong>, <strong>Prepaid NEPA Meters</strong>, or <strong>Fair Price Certification</strong>.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: FLOATING MAP TOOLS & RADAR SCAN */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* 1. Movable Toolbar */}
              <div className="rounded-xl border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-[#78350F] dark:text-[#E0904E]">
                    <Move className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0]">
                    Floating & Movable Map Toolbar
                  </span>
                </div>
                <p className="text-xs text-[#7C6859] dark:text-[#B8A598] leading-relaxed">
                  Located directly on the map canvas. Drag its top grip handle to reposition the toolbar anywhere on your screen for convenient access on both desktop and mobile.
                </p>
              </div>

              {/* 2. Spinning GPS Locator Tool */}
              <div className="rounded-xl border border-sky-300 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#78350F] dark:bg-[#B45309] text-white flex items-center justify-center shrink-0 shadow-xs">
                    {/* Round GPS Crosshair */}
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="7" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                      <line x1="12" y1="2" x2="12" y2="5" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="5" y2="12" />
                      <line x1="19" y1="12" x2="22" y2="12" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0]">
                    Round GPS Locator Tool
                  </span>
                  <span className="text-[10px] bg-sky-200/80 dark:bg-sky-900/80 text-sky-900 dark:text-sky-200 px-1.5 py-0.5 rounded font-medium">
                    Spins & Pinpoints
                  </span>
                </div>
                <p className="text-xs text-[#3B2314] dark:text-[#E2D9D2] leading-relaxed">
                  Tap the round GPS sign tool. The icon <strong>spins continuously</strong> while acquiring your actual GPS position, drops a pulsing beacon at your coordinates, and smoothly glides the camera there.
                </p>
              </div>

              {/* 3. Glassy Radar Wave Scan */}
              <div className="rounded-xl border border-amber-300 dark:border-[#523018] bg-amber-50/80 dark:bg-[#2A1810] p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0]">
                    Glassy Radar Wave Scan (30s Highlight)
                  </span>
                  <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-medium">
                    Right-Click or Long-Press
                  </span>
                </div>
                <p className="text-xs text-[#3B2314] dark:text-[#E2D9D2] leading-relaxed">
                  <strong>Right-click</strong> on the map, <strong>long-press</strong> on mobile screens (hold for 0.5s), or tap the <strong>Radar Tool</strong>. Transparent light-blue glassy waves ripple across the map, making nearby lodge pins <strong>enlarge and glow with a bright golden aura for 30 seconds</strong>.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: MAP & DIRECTIONS */}
          {currentStep === 3 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0]">
                    One-Click Spoken Voice GPS Navigation
                  </span>
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                  Click the <strong>Get Directions</strong> tab above the map. Choose your start point (like <em>IMSU Main Gate</em>, <em>FUTO Gate</em>, or your <em>Live GPS</em>), and Mapstar instantly plots the shortest route.
                </p>
              </div>

              <div className="rounded-xl border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] p-4 space-y-1.5">
                <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#78350F] dark:text-[#E0904E]" />
                  Exact Compound Pins
                </span>
                <p className="text-xs text-[#7C6859] dark:text-[#B8A598]">
                  Unlike generic listings that give vague area names, Mapstar pins pinpoint the actual compound gates so you can inspect without confusion.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: REGULATED FEES */}
          {currentStep === 4 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="rounded-xl border border-amber-300 dark:border-[#523018] bg-amber-50/70 dark:bg-[#2A1810] p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#78350F] dark:text-[#E0904E]" />
                  <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0]">
                    Zero Excess Agent Extortion
                  </span>
                </div>
                <p className="text-xs text-[#3B2314] dark:text-amber-100/90 leading-relaxed">
                  Mapstar legally caps all agent commissions to regulated ceilings. On direct landlord listings, <strong>tenant agent fee is 0%</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] p-3 text-xs space-y-1.5">
                <span className="font-bold text-[#271810] dark:text-[#FAF6F0]">Every listing displays a full itemized breakdown:</span>
                <ul className="list-disc pl-4 text-[#7C6859] dark:text-[#B8A598] space-y-0.5">
                  <li>Annual rent</li>
                  <li>Refundable caution deposit</li>
                  <li>Legal & agreement preparation</li>
                  <li>Total payable in escrow — no surprise cash demands</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 5: INSPECT & MOVE IN */}
          {currentStep === 5 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0]">
                    You are All Set! Ready to Find Your Lodge?
                  </span>
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                  Browse the lodges on the left feed, tap any lodge card to review details, and click <strong>Inspect</strong> to view photos, verify facilities, or request an inspection.
                </p>
              </div>

              <div className="rounded-xl border border-[#E5DAC8] dark:border-[#382618] bg-[#FAF7F2] dark:bg-[#120C08] p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#271810] dark:text-[#FAF6F0] block">Direct Landlord Contact</span>
                  <span className="text-[11px] text-[#7C6859] dark:text-[#B8A598]">
                    Verified phone numbers and chat are available directly inside each lodge details page.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#FAF7F2] dark:bg-[#120C08] border-t border-[#E5DAC8] dark:border-[#382618] flex items-center justify-between gap-3">
          {currentStep === 0 ? (
            <>
              <span className="text-[11px] text-[#7C6859] dark:text-[#B8A598]">
                You can reopen this guide anytime from the top bar.
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs text-[#7C6859] dark:text-[#B8A598] hover:text-[#271810] dark:hover:text-white cursor-pointer"
              >
                Got it, skip
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-9 text-xs border-[#E5DAC8] dark:border-[#382618] bg-white dark:bg-[#1A120B] text-[#3B2314] dark:text-[#FAF6F0] hover:bg-[#FAF7F2] dark:hover:bg-[#24160E] cursor-pointer shadow-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-9 text-xs text-[#7C6859] dark:text-[#B8A598] hover:text-[#271810] dark:hover:text-white cursor-pointer"
                >
                  Skip Tour
                </Button>
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-9 px-4 bg-[#78350F] hover:bg-[#854D0E] dark:bg-[#B45309] dark:hover:bg-[#C2783B] text-white font-semibold text-xs shadow-md shadow-[#78350F]/25 cursor-pointer transition"
                >
                  {currentStep === 5 ? (
                    <>
                      <span>Start Exploring</span>
                      <CheckCircle2 className="h-3.5 w-3.5 ml-1.5" />
                    </>
                  ) : (
                    <>
                      <span>Next Step</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

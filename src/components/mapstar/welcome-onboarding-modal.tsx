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
} from 'lucide-react'

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
  // Step 2: Map & Voice GPS Directions
  // Step 3: Transparent Regulated Fees
  // Step 4: Request Inspection & Done
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
    if (currentStep < 4) {
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
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white dark:bg-[#090D18] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl z-[9999] transition-colors">
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-950 p-5 sm:p-6 text-white border-b border-blue-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-blue-500/25 border border-blue-400/40 flex items-center justify-center shadow-inner">
                <Sparkles className="h-4 w-4 text-blue-300" />
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-lg text-white">Mapstar</span>
                <span className="ml-1.5 text-[10px] font-mono bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-600/50 text-blue-200">
                  Quick Guide
                </span>
              </div>
            </div>

            {currentStep > 0 && (
              <span className="text-xs font-semibold text-blue-200 bg-blue-900/70 border border-blue-700/60 rounded-full px-2.5 py-0.5">
                Step {currentStep} of 4
              </span>
            )}
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold text-white mt-3 leading-snug">
            {currentStep === 0 && 'Welcome to Mapstar 👋'}
            {currentStep === 1 && '1. Find Verified Lodges 🔍'}
            {currentStep === 2 && '2. Live Map & GPS Directions 🗺️'}
            {currentStep === 3 && '3. Transparent Regulated Fees 🛡️'}
            {currentStep === 4 && '4. Inspect & Move In Safely 🎉'}
          </DialogTitle>

          <DialogDescription className="text-blue-100/90 text-xs sm:text-sm mt-1 leading-relaxed">
            {currentStep === 0 &&
              'Finding a verified student lodge or apartment in Nigeria without agent extortion just got 10x easier.'}
            {currentStep === 1 &&
              'Filter by running borehole water, prepaid meter, private toilet, and your budget range.'}
            {currentStep === 2 &&
              'Get turn-by-turn navigation straight to the lodge gate from IMSU, FUTO, UNN, or your current GPS location.'}
            {currentStep === 3 &&
              'No surprise agent charges or duplicate payments. Every fee is regulated and broken down transparently.'}
            {currentStep === 4 &&
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
                  className="flex flex-col items-start p-4 rounded-xl border border-blue-300 dark:border-blue-600/60 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-left transition cursor-pointer group shadow-xs"
                >
                  <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-sm">
                    <Play className="h-4 w-4 fill-white" />
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Show Me the Ropes
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Take a 1-minute interactive walkthrough to learn how Mapstar works.
                  </span>
                  <span className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition">
                    Start Tour <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A12] hover:bg-slate-100 dark:hover:bg-slate-850 text-left transition cursor-pointer group shadow-xs"
                >
                  <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-sm">
                    <Compass className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Explore on My Own
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Jump straight to the live lodge listings and interactive map now.
                  </span>
                  <span className="mt-3 inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:translate-x-1 transition">
                    Skip directly to lodges <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </span>
                </button>
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                  Or jump directly to your campus city:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCityPick('Owerri')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] hover:border-blue-500 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs transition cursor-pointer"
                  >
                    <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Owerri (IMSU / FUTO / Nekede)</span>
                  </button>
                  <button
                    onClick={() => handleCityPick('Enugu')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] hover:border-blue-500 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs transition cursor-pointer"
                  >
                    <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Enugu (UNN / ESUT / IMT)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: BROWSE & FILTER */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A12] p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Live Status Pins & Badges
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Available Now</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Coming Soon</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A12] p-4 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Quick Essential Filters
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Tap the quick filter pills at the top of the feed to immediately isolate lodges with <strong>Borehole Water</strong>, <strong>Prepaid NEPA Meters</strong>, or <strong>Fair Price Certification</strong>.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: MAP & DIRECTIONS */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    One-Click Spoken Voice GPS Navigation
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Click the <strong>Get Directions</strong> tab above the map. Choose your start point (like <em>IMSU Main Gate</em>, <em>FUTO Gate</em>, or your <em>Live GPS</em>), and Mapstar instantly plots the shortest route.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A12] p-4 space-y-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Exact Compound Pins
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Unlike generic listings that give vague area names, Mapstar pins pinpoint the actual compound gates so you can inspect without confusion.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REGULATED FEES */}
          {currentStep === 3 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="rounded-xl border border-blue-300 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-950/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Zero Excess Agent Extortion
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Mapstar legally caps all agent commissions to regulated ceilings. On direct landlord listings, <strong>tenant agent fee is 0%</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A12] p-3 text-xs space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">Every listing displays a full itemized breakdown:</span>
                <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-0.5">
                  <li>Annual rent</li>
                  <li>Refundable caution deposit</li>
                  <li>Legal & agreement preparation</li>
                  <li>Total payable in escrow — no surprise cash demands</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 4: INSPECT & MOVE IN */}
          {currentStep === 4 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    You are All Set! Ready to Find Your Lodge?
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Browse the lodges on the left feed, tap any lodge card to review details, and click <strong>Inspect</strong> to view photos, verify facilities, or request an inspection.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A12] p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Theme preference</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    You can switch between Bright and Midnight theme anytime using the button in the top bar.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-100/70 dark:bg-[#070A12] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          {currentStep === 0 ? (
            <>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                You can reopen this guide anytime from the top bar.
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
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
                className="h-9 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D18] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer shadow-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-9 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Skip Tour
                </Button>
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 cursor-pointer transition"
                >
                  {currentStep === 4 ? (
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

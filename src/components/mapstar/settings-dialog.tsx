'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Sun,
  Moon,
  LogIn,
  UserPlus,
  LogOut,
  Shield,
  HelpCircle,
  ExternalLink,
  Info,
  DollarSign,
  Scale,
  Sparkles,
} from 'lucide-react'
import { AuthedUser } from '@/components/mapstar/login-signup-dialog'
import Link from 'next/link'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AuthedUser | null
  onOpenAuth: (mode?: 'login' | 'signup') => void
  onLogout: () => void
  onOpenGuide: () => void
  onOpenStarPower?: () => void
}

export default function SettingsDialog({
  open,
  onOpenChange,
  user,
  onOpenAuth,
  onLogout,
  onOpenGuide,
  onOpenStarPower,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            Settings & Preferences
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Customize display mode, manage your account session, and view platform fee policies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 1. Theme / Appearance Mode */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 bg-slate-50/50 dark:bg-[#070A12]/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-amber-500 dark:hidden" />
                  <Moon className="h-4 w-4 text-blue-400 hidden dark:block" />
                  Appearance Mode
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Toggle between Light & Obsidian Dark theme
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* 2. Authentication & Account Management */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 bg-slate-50/50 dark:bg-[#070A12]/50">
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">
              Account & Session
            </div>

            {user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Signed in as</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {user.email}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onLogout()
                    onOpenChange(false)
                  }}
                  className="w-full h-9 border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Sign in to save lodges, contact landlords directly, and chat with verified agents.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false)
                      onOpenAuth('login')
                    }}
                    className="h-9 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    <LogIn className="h-3.5 w-3.5 mr-1.5" /> Sign In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false)
                      onOpenAuth('signup')
                    }}
                    className="h-9 border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Sign Up
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Platform Regulations & Guide */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onOpenGuide()
              }}
              className="w-full h-9 justify-start text-xs border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              How Mapstar Works (User Guide)
            </Button>

            {user?.role === 'ADMIN' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onOpenStarPower?.()
                }}
                className="w-full h-9 justify-start text-xs border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-yellow-300 hover:bg-amber-500/20 cursor-pointer font-bold"
              >
                <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                Star Power (Admin Database Center)
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full h-9 justify-start text-xs border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
            >
              <Link href="/admin">
                <Shield className="h-4 w-4 mr-2 text-sky-600 dark:text-sky-400" />
                Administrator Portal
                <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
              </Link>
            </Button>
          </div>

          {/* Fee Policy Footnote */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Scale className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <span>
              <strong>Regulated Fees Guarantee:</strong> Agent inspection and finding fees are legally capped at 5%. Direct landlord tenancies are 100% free of agent charges.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

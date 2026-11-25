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
  HelpCircle,
  Scale,
} from 'lucide-react'
import { AuthedUser } from '@/components/mapstar/login-signup-dialog'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AuthedUser | null
  onOpenAuth: (mode?: 'login' | 'signup') => void
  onLogout: () => void
  onOpenGuide: () => void
}

export default function SettingsDialog({
  open,
  onOpenChange,
  user,
  onOpenAuth,
  onLogout,
  onOpenGuide,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-[#1A120B] border border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] rounded-3xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#271810] dark:text-white">
            Settings & Preferences
          </DialogTitle>
          <DialogDescription className="text-xs text-[#7C6859] dark:text-[#B8A598]">
            Customize display mode, manage your account session, and view platform fee policies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 1. Theme / Appearance Mode */}
          <div className="rounded-2xl border border-[#E5DAC8] dark:border-[#382618] p-4 bg-[#FAF7F2]/70 dark:bg-[#120C08]/70">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#271810] dark:text-white flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-amber-600 dark:hidden" />
                  <Moon className="h-4 w-4 text-amber-400 hidden dark:block" />
                  Appearance Mode
                </div>
                <div className="text-[11px] text-[#7C6859] dark:text-[#B8A598] mt-0.5">
                  Toggle between Warm Linen Light & Midnight Walnut Dark
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* 2. Authentication & Account Management */}
          <div className="rounded-2xl border border-[#E5DAC8] dark:border-[#382618] p-4 bg-[#FAF7F2]/70 dark:bg-[#120C08]/70">
            <div className="text-xs font-bold text-[#271810] dark:text-white mb-2">
              Account & Session
            </div>

            {user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7C6859] dark:text-[#B8A598]">Signed in as</span>
                  <span className="font-semibold text-[#271810] dark:text-[#FAF6F0] truncate max-w-[200px]">
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
                  className="w-full h-9 border-[#E5DAC8] dark:border-[#382618] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-[#7C6859] dark:text-[#B8A598] mb-3">
                  Sign in to save lodges, contact landlords directly, and chat with verified agents.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false)
                      onOpenAuth('login')
                    }}
                    className="h-9 bg-[#78350F] hover:bg-[#854D0E] dark:bg-[#B45309] dark:hover:bg-[#C2783B] text-white font-semibold text-xs shadow-md shadow-[#78350F]/25 cursor-pointer"
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
                    className="h-9 border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] hover:bg-[#FAF7F2] dark:hover:bg-[#24160E] text-xs font-semibold cursor-pointer"
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
              className="w-full h-9 justify-start text-xs border-[#E5DAC8] dark:border-[#382618] text-[#3B2314] dark:text-[#FAF6F0] hover:bg-[#FAF7F2] dark:hover:bg-[#24160E] cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 mr-2 text-[#78350F] dark:text-[#E0904E]" />
              How Mapstar Works (User Guide)
            </Button>
          </div>

          {/* Fee Policy Footnote */}
          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-[#2A1810] border border-amber-300 dark:border-[#523018] text-[11px] text-[#78350F] dark:text-[#E0904E] flex items-start gap-2">
            <Scale className="h-4 w-4 shrink-0 mt-0.5 text-[#78350F] dark:text-[#E0904E]" />
            <span>
              <strong>Regulated Fees Guarantee:</strong> Agent inspection and finding fees are legally capped at 5%. Direct landlord tenancies are 100% free of agent charges.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

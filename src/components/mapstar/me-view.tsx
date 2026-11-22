'use client'

import {
  User,
  Shield,
  CheckCircle2,
  Building,
  Plus,
  LogOut,
  Mail,
  Phone,
  Calendar,
  Lock,
  LogIn,
  KeyRound,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AuthedUser } from '@/components/mapstar/login-signup-dialog'

interface MeViewProps {
  user: AuthedUser | null
  onOpenAuth: (mode?: 'login' | 'signup') => void
  onLogout: () => void
  onOpenListProperty: () => void
}

export default function MeView({
  user,
  onOpenAuth,
  onLogout,
  onOpenListProperty,
}: MeViewProps) {
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F8FAFC] dark:bg-[#070A12]">
        <div className="max-w-md w-full bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center mb-5 shadow-inner">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Log in to view your profile
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
            Access your saved lodges, direct-from-landlord applications, verified tenancy agreements, and rental payment escrow history.
          </p>

          <div className="space-y-2.5">
            <Button
              className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
              onClick={() => onOpenAuth('login')}
            >
              <LogIn className="h-4 w-4 mr-2" /> Log in to Mapstar
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A12] text-xs font-semibold cursor-pointer"
              onClick={() => onOpenAuth('signup')}
            >
              Create a free Mapstar account
            </Button>
          </div>

          {/* Landlord / Agent Callout */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Landlord or Agent?
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              List your lodges, self-contain units, or apartments directly on Mapstar. Benefit from verified tenant leads and zero unfair middleman fees.
            </p>
            <Button
              variant="outline"
              className="w-full h-9 border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold cursor-pointer"
              onClick={() => onOpenAuth('login')}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Sign in to List Property
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const roleLabel =
    user.role === 'ADMIN'
      ? 'Administrator'
      : user.role === 'LANDLORD'
      ? 'Landlord / Property Owner'
      : user.role === 'AGENT'
      ? 'Mapstar-Verified Agent'
      : 'Student / Tenant'

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#F8FAFC] dark:bg-[#070A12]">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-950 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-600/30 border border-blue-400/30 shrink-0">
              {(user.fullName || user.email || '?').charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
                  {user.fullName || 'Mapstar User'}
                </h1>
                <Badge className="w-fit mx-auto sm:mx-0 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 font-semibold text-[10px]">
                  {roleLabel}
                </Badge>
              </div>

              <div className="mt-2.5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              {/* Verification Badges */}
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  NIN Verified
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  BVN Verified
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Escrow Protected
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-slate-100 dark:bg-slate-800" />

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={onOpenListProperty}
              className="h-10 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" /> List a Property
            </Button>
            <Button
              variant="outline"
              onClick={onLogout}
              className="h-10 border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Landlord & Agent Hub - List Property Card */}
        <div className="bg-white dark:bg-[#090D18] border border-blue-200/80 dark:border-blue-800/60 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Building className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  List Your Property on Mapstar
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                Have a lodge, self-contain, or flat to rent out? Connect directly with verified tenants, set capped fees, and receive payments securely.
              </p>
            </div>
            <Button
              onClick={onOpenListProperty}
              className="w-full sm:w-auto h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4 mr-1.5" /> List Property
            </Button>
          </div>
        </div>

        {/* Security & Account Details */}
        <div className="bg-white dark:bg-[#090D18] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-blue-600" /> Account Security & Protection
          </h2>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span>Account ID</span>
              <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{user.id}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span>User Role</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{roleLabel}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Security Guarantee</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Standard 5% Capped Agent Fees</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

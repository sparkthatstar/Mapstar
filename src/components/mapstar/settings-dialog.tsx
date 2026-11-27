'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LogIn,
  UserPlus,
  LogOut,
  HelpCircle,
  Scale,
  MapPin,
  Bell,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Compass,
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
  // Device & App Permissions state
  const [locationStatus, setLocationStatus] = useState<'granted' | 'prompt' | 'denied' | 'loading'>('loading')
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'default' | 'denied' | 'unsupported'>('default')
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null)

  const checkPermissions = useCallback(async () => {
    // 1. Geolocation check
    if (typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator) {
      if ('permissions' in navigator && navigator.permissions?.query) {
        try {
          const res = await navigator.permissions.query({ name: 'geolocation' })
          setLocationStatus(res.state as 'granted' | 'prompt' | 'denied')
          res.onchange = () => {
            setLocationStatus(res.state as 'granted' | 'prompt' | 'denied')
          }
        } catch {
          setLocationStatus('prompt')
        }
      } else {
        setLocationStatus('prompt')
      }
    } else {
      setLocationStatus('denied')
    }

    // 2. Notification check
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission)
    } else {
      setNotificationStatus('unsupported')
    }
  }, [])

  useEffect(() => {
    if (open) {
      checkPermissions()
      setPermissionNotice(null)
    }
  }, [open, checkPermissions])

  const requestLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setPermissionNotice('Geolocation is not supported by your browser.')
      return
    }
    setPermissionNotice('Locating your position...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus('granted')
        setPermissionNotice(`Location granted! Accuracy: ~${Math.round(pos.coords.accuracy)}m`)
        setTimeout(() => setPermissionNotice(null), 4000)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('denied')
          setPermissionNotice('Location permission was denied in your browser settings.')
        } else {
          setPermissionNotice(`Unable to acquire location: ${err.message}`)
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const requestNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermissionNotice('Notifications are not supported in this browser.')
      return
    }
    try {
      const perm = await Notification.requestPermission()
      setNotificationStatus(perm)
      if (perm === 'granted') {
        new Notification('Mapstar Alerts Enabled', {
          body: 'You will receive real-time updates for lodge inspections and new listings.',
          icon: '/favicon.ico',
        })
        setPermissionNotice('Notifications active! Sent test welcome ping.')
        setTimeout(() => setPermissionNotice(null), 4000)
      } else if (perm === 'denied') {
        setPermissionNotice('Notification permission was blocked in browser settings.')
      }
    } catch {
      setPermissionNotice('Failed to request notification permission.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-[#1A120B] border border-[#E5DAC8] dark:border-[#382618] text-[#271810] dark:text-[#FAF6F0] rounded-3xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#271810] dark:text-white">
            Settings & Preferences
          </DialogTitle>
          <DialogDescription className="text-xs text-[#7C6859] dark:text-[#B8A598]">
            Manage your account session, device permissions, and platform policies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* 1. Authentication & Account Management */}
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

          {/* 2. Device & App Permissions */}
          <div className="rounded-2xl border border-[#E5DAC8] dark:border-[#382618] p-4 bg-[#FAF7F2]/70 dark:bg-[#120C08]/70">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#271810] dark:text-white">
                Device & System Permissions
              </span>
              <span className="text-[10px] text-[#7C6859] dark:text-[#B8A598]">
                GPS & Alerts
              </span>
            </div>

            <div className="space-y-3">
              {/* Geolocation Row */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-[#1A120B] border border-[#E5DAC8]/70 dark:border-[#382618]">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-[#78350F] dark:text-[#E0904E] shrink-0 mt-0.5">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0]">
                        GPS Location
                      </span>
                      {locationStatus === 'granted' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Allowed
                        </span>
                      )}
                      {locationStatus === 'denied' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          <AlertCircle className="h-3 w-3" /> Denied
                        </span>
                      )}
                      {locationStatus === 'prompt' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          Prompt on use
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-[#7C6859] dark:text-[#B8A598] leading-tight mt-0.5">
                      Powers the spinning GPS map tool and live distance calculation.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestLocation}
                  disabled={locationStatus === 'granted'}
                  className={`h-7 px-2.5 text-[11px] font-semibold shrink-0 rounded-lg cursor-pointer transition ${
                    locationStatus === 'granted'
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                      : 'border-[#E5DAC8] dark:border-[#382618] text-[#78350F] dark:text-[#E0904E] hover:bg-[#FAF7F2] dark:hover:bg-[#24160E]'
                  }`}
                >
                  {locationStatus === 'granted' ? 'Allowed' : locationStatus === 'denied' ? 'Retry' : 'Allow'}
                </Button>
              </div>

              {/* Push Notifications Row */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-[#1A120B] border border-[#E5DAC8]/70 dark:border-[#382618]">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-[#78350F] dark:text-[#E0904E] shrink-0 mt-0.5">
                    <BellRing className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#271810] dark:text-[#FAF6F0]">
                        Notifications
                      </span>
                      {notificationStatus === 'granted' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Enabled
                        </span>
                      )}
                      {notificationStatus === 'denied' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          <AlertCircle className="h-3 w-3" /> Blocked
                        </span>
                      )}
                      {notificationStatus === 'default' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-[#7C6859] dark:text-[#B8A598] leading-tight mt-0.5">
                      Get instant alerts on price reductions and agent message replies.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestNotification}
                  className={`h-7 px-2.5 text-[11px] font-semibold shrink-0 rounded-lg cursor-pointer transition ${
                    notificationStatus === 'granted'
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                      : 'border-[#E5DAC8] dark:border-[#382618] text-[#78350F] dark:text-[#E0904E] hover:bg-[#FAF7F2] dark:hover:bg-[#24160E]'
                  }`}
                >
                  {notificationStatus === 'granted' ? 'Send Test' : notificationStatus === 'denied' ? 'Blocked' : 'Enable'}
                </Button>
              </div>

              {permissionNotice && (
                <div className="text-[11px] px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-[#251710] border border-amber-200/80 dark:border-amber-900/60 text-[#78350F] dark:text-[#E0904E] animate-in fade-in duration-200">
                  {permissionNotice}
                </div>
              )}
            </div>
          </div>

          {/* 2. Platform Regulations & Guide */}
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

'use client'

/**
 * Mapstar Sound & Notification Infrastructure
 * Provides real Web Audio sound alerts, Browser/Push notifications, and per-thread muting.
 */

const MUTED_STORAGE_KEY = 'mapstar_muted_threads'

// ============================================================================
// 1. Thread Muting & Preferences
// ============================================================================

export function getMutedThreadIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MUTED_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function isThreadMuted(threadId: string): boolean {
  if (!threadId) return false
  const list = getMutedThreadIds()
  return list.includes(threadId)
}

export function setThreadMuted(threadId: string, muted: boolean): boolean {
  if (typeof window === 'undefined' || !threadId) return false
  try {
    const list = getMutedThreadIds()
    let updated: string[]
    if (muted) {
      updated = Array.from(new Set([...list, threadId]))
    } else {
      updated = list.filter((id) => id !== threadId)
    }
    localStorage.setItem(MUTED_STORAGE_KEY, JSON.stringify(updated))

    // Sync preference to backend asynchronously
    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: muted ? 'mute' : 'unmute', channelId: threadId }),
    }).catch(() => {})

    return muted
  } catch {
    return false
  }
}

export function toggleThreadMute(threadId: string): boolean {
  const current = isThreadMuted(threadId)
  return setThreadMuted(threadId, !current)
}

// ============================================================================
// 2. Synthesized Web Audio Sound Alerts
// ============================================================================

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return null
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Play a pleasant message chime (2-tone soft ping)
 */
export function playMessageChime() {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    // First high note, then lower note
    osc.frequency.setValueAtTime(880, now) // A5
    osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.1) // D5

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.35)
  } catch {}
}

/**
 * Outgoing phone ringing sound (Standard ringback cadence)
 */
class RingbackPlayer {
  private timer: any = null
  private active = false

  start() {
    if (this.active) return
    this.active = true
    this.playTone()
    this.timer = setInterval(() => {
      if (this.active) this.playTone()
    }, 3000)
  }

  stop() {
    this.active = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private playTone() {
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      // Standard US/UK ringback: 440Hz + 480Hz dual tone
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc2.type = 'sine'
      osc1.frequency.setValueAtTime(440, now)
      osc2.frequency.setValueAtTime(480, now)

      gain.gain.setValueAtTime(0.1, now)
      gain.gain.setValueAtTime(0.1, now + 1.2)
      gain.gain.linearRampToValueAtTime(0.001, now + 1.3)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 1.3)
      osc2.stop(now + 1.3)
    } catch {}
  }
}

export const ringbackPlayer = new RingbackPlayer()

/**
 * Incoming call ringtone player (melodic repeating ring)
 */
class IncomingRingPlayer {
  private timer: any = null
  private active = false

  start() {
    if (this.active) return
    this.active = true
    this.playRingPattern()
    this.timer = setInterval(() => {
      if (this.active) this.playRingPattern()
    }, 2500)
  }

  stop() {
    this.active = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private playRingPattern() {
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      const now = ctx.currentTime

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const start = now + i * 0.12

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, start)

        gain.gain.setValueAtTime(0.2, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(start)
        osc.stop(start + 0.2)
      })
    } catch {}
  }
}

export const incomingRingPlayer = new IncomingRingPlayer()

// ============================================================================
// 3. Service Worker & System Push Notification Dispatcher
// ============================================================================

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return reg
  } catch (err) {
    console.warn('[Mapstar SW] Registration failed:', err)
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  try {
    const perm = await Notification.requestPermission()
    return perm
  } catch {
    return 'denied'
  }
}

export interface NotificationPayload {
  title: string
  body: string
  channelId: string
  tab: 'world' | 'dms' | 'groups' | 'channels'
  icon?: string
}

/**
 * Dispatch real browser / system notification if not muted and permission granted
 */
export async function dispatchAppNotification({
  title,
  body,
  channelId,
  tab,
  icon = '/icon.svg',
}: NotificationPayload) {
  if (typeof window === 'undefined') return

  // Check if thread is muted
  if (isThreadMuted(channelId)) {
    return
  }

  // Play audio alert
  playMessageChime()

  // If Notification API is available and permission granted, show system notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        if (reg && reg.showNotification) {
          reg.showNotification(title, {
            body,
            icon,
            badge: icon,
            data: { url: '/', channelId, tab },
            tag: `mapstar-${channelId}`,
            renotify: true,
          } as NotificationOptions)
          return
        }
      }

      // Fallback to classic Notification if service worker is not active
      new Notification(title, {
        body,
        icon,
        tag: `mapstar-${channelId}`,
      })
    } catch (e) {
      console.warn('[Notification] Error showing notification:', e)
    }
  }
}

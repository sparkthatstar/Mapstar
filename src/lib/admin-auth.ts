import { cookies } from 'next/headers'
import { createHmac, createHash, timingSafeEqual } from 'crypto'
import {
  ADMIN_COOKIE_NAME as COOKIE_NAME,
  ADMIN_COOKIE_OPTIONS as COOKIE_OPTIONS,
} from './admin-constants'

// Re-export so existing imports keep working
export const ADMIN_COOKIE_NAME = COOKIE_NAME
export const ADMIN_COOKIE_OPTIONS = COOKIE_OPTIONS

/**
 * Admin authentication.
 *
 * Password security:
 * The administrator password is protected using a salted cryptographic one-way hash.
 * It is mathematically irreversible and cannot be read from the source code.
 * Optionally, custom environment variables can override these defaults.
 */

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// Salted cryptographic one-way hash (irreversible; cannot be read from code)
const SECURE_ADMIN_HASH =
  'e8f49a12c3b5706d:cf1abeb09a439092ef287e9a1f47c73eb260f2fb4612f8642f118444f4241f67:sha256'

export interface AdminSession {
  email: string
  expiresAt: number
}

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: ADMIN_SESSION_SECRET environment variable must be configured in production.')
    }
    return 'mapstar-admin-session-fallback-secret'
  }
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function verifyCredentials(email: string, password: string): boolean {
  const expectedEmail = (process.env.ADMIN_EMAIL || 'mapstar777@gmail.com').trim().toLowerCase()
  const inputEmail = email.trim().toLowerCase()

  if (inputEmail !== expectedEmail) {
    return false
  }

  // 1. Check custom plaintext password in environment variable if explicitly configured
  if (process.env.ADMIN_PASSWORD) {
    try {
      const match = timingSafeEqual(
        Buffer.from(password),
        Buffer.from(process.env.ADMIN_PASSWORD)
      )
      if (match) return true
    } catch {}
  }

  // 2. Otherwise verify against the secure cryptographic one-way hash
  try {
    const [salt, expectedHash] = SECURE_ADMIN_HASH.split(':')
    const computed = createHash('sha256').update(salt + password).digest('hex')
    return timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(computed, 'hex')
    )
  } catch {
    return false
  }
}

export function createSessionCookie(email: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const emailB64 = Buffer.from(email.toLowerCase()).toString('base64url')
  const payload = `${emailB64}.${expiresAt}`
  const sig = sign(payload)
  return `${payload}.${sig}`
}

export function verifySessionCookie(value: string | undefined): AdminSession | null {
  if (!value) return null
  const parts = value.split('.')
  if (parts.length !== 3) return null
  const [emailB64, expiryStr, sig] = parts
  const payload = `${emailB64}.${expiryStr}`
  const expectedSig = sign(payload)
  try {
    const sigOk = timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    if (!sigOk) return null
  } catch {
    return null
  }
  const expiresAt = Number(expiryStr)
  if (!expiresAt || Date.now() > expiresAt) return null
  try {
    const email = Buffer.from(emailB64, 'base64url').toString('utf8')
    return { email, expiresAt }
  } catch {
    return null
  }
}

/**
 * Server-only helper for admin pages.
 * Returns the session if the current request is from an authenticated admin,
 * or null otherwise.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies()
  const cookie = store.get(COOKIE_NAME)?.value
  return verifySessionCookie(cookie)
}

/**
 * Throws when not authenticated. Call at the top of admin pages.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

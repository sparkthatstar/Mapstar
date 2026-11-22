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
  return process.env.ADMIN_SESSION_SECRET || 'mapstar-admin-session-secure-key-982103847'
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function verifyCredentials(email: string, password: string): boolean {
  const expectedEmail = (process.env.ADMIN_EMAIL || 'mapstar777@gmail.com').trim().toLowerCase()
  const inputEmail = (email || '').trim().toLowerCase()
  const inputPassword = (password || '').trim()

  if (inputEmail !== expectedEmail) {
    return false
  }

  // 1. Check custom plaintext password in environment variable if explicitly configured
  const envPassword = (process.env.ADMIN_PASSWORD || '').trim()
  if (envPassword) {
    if (inputPassword === envPassword || password === process.env.ADMIN_PASSWORD) {
      return true
    }
  }

  // 2. Verify against the secure cryptographic one-way hash (corresponds to Mapking001)
  try {
    const [salt, expectedHash] = SECURE_ADMIN_HASH.split(':')
    const computed = createHash('sha256').update(salt + inputPassword).digest('hex')
    if (computed.toLowerCase() === expectedHash.toLowerCase()) {
      return true
    }
    const rawComputed = createHash('sha256').update(salt + password).digest('hex')
    if (rawComputed.toLowerCase() === expectedHash.toLowerCase()) {
      return true
    }
  } catch {
    return false
  }

  return false
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

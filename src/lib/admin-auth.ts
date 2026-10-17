import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
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
 * For MVP we use a single admin account configured via env vars:
 *   ADMIN_EMAIL — admin login email
 *   ADMIN_PASSWORD — admin login password (plaintext for sandbox; hash in prod)
 *   ADMIN_SESSION_SECRET — secret used to sign the session cookie
 *
 * In production, swap verifyCredentials() to call Supabase Auth
 * with role=ADMIN check.
 *
 * The session is a signed cookie (HTTP-only, SameSite=Lax, 7-day expiry).
 * The cookie value is `${b64email}.${expiry}.${hmac}` where hmac signs
 * b64email + expiry with ADMIN_SESSION_SECRET.
 *
 * IMPORTANT: This module imports Node-only 'crypto' and 'next/headers' —
 * do NOT import it from Edge middleware. Use admin-constants.ts instead.
 */

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface AdminSession {
  email: string
  expiresAt: number
}

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s) {
    // Sandbox default — NEVER use in production
    return 'sandbox-default-secret-change-me'
  }
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function verifyCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL || 'admin@mapstar.ng'
  const expectedPassword = process.env.ADMIN_PASSWORD || 'mapstar2026'
  try {
    const emailOk = timingSafeEqual(
      Buffer.from(email.toLowerCase()),
      Buffer.from(expectedEmail.toLowerCase())
    )
    const passOk = timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword))
    return emailOk && passOk
  } catch {
    return false
  }
}

export function createSessionCookie(email: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS
  // Encode email in base64url so it can't contain dots that would
  // confuse the parser. Final format: b64email.expiry.hmac
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
 * or null otherwise. Use this in server components to gate the dashboard.
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

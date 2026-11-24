import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import {
  ADMIN_COOKIE_NAME as COOKIE_NAME,
  ADMIN_COOKIE_OPTIONS as COOKIE_OPTIONS,
} from './admin-constants'
import { db } from './db'
import { verifyPassword } from './user-auth'

// Re-export so existing imports keep working
export const ADMIN_COOKIE_NAME = COOKIE_NAME
export const ADMIN_COOKIE_OPTIONS = COOKIE_OPTIONS

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface AdminSession {
  email: string
  expiresAt: number
}

const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET?.trim()
if (!ADMIN_SESSION_SECRET) {
  throw new Error('ADMIN_SESSION_SECRET must be set')
}

function getSecret(): string {
  return ADMIN_SESSION_SECRET
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

/**
 * Authenticates an administrator against the User table in PostgreSQL.
 * Verifies that the user exists, has role=ADMIN, and validates their password
 * using the standard scrypt verifyPassword routine.
 */
export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  const inputEmail = (email || '').trim().toLowerCase()
  const inputPassword = (password || '').trim()

  if (!inputEmail || !inputPassword) {
    return false
  }

  try {
    const user = await db.user.findUnique({
      where: { email: inputEmail },
    })

    if (!user || user.role !== 'ADMIN' || !user.passwordHash) {
      return false
    }

    return (
      verifyPassword(inputPassword, user.passwordHash) ||
      verifyPassword(password, user.passwordHash)
    )
  } catch (err) {
    console.error('verifyCredentials database error:', err)
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

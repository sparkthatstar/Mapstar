import { cookies } from 'next/headers'
import { createHmac, createHash, scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import { db } from './db'
import { sendEmail } from './email'

export const USER_COOKIE_NAME = 'mapstar_user_session'

export const USER_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export interface AuthedUser {
  id: string
  email: string
  fullName: string | null
  phone?: string | null
  role: 'TENANT' | 'LANDLORD' | 'AGENT' | 'ADMIN'
  ninVerified?: boolean
  bvnVerified?: boolean
  avatarUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

interface StoredUser extends AuthedUser {
  passwordHash: string
  createdAt: string
}

interface PasswordResetRecord {
  email: string
  code: string // 6-digit verification code
  token: string // URL reset token
  expiresAt: number
  createdAt: string
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000 // 15 minutes

// In-memory store for pending password reset requests
const resetTokenStore = new Map<string, PasswordResetRecord>()

function cleanExpiredResetTokens(): void {
  const now = Date.now()
  for (const [key, val] of resetTokenStore.entries()) {
    if (val.expiresAt <= now) {
      resetTokenStore.delete(key)
    }
  }
}

function getSecret(): string {
  return process.env.USER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'mapstar-user-session-secure-key-749201948'
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split(':')
    if (parts.length === 3 && parts[2] === 'sha256') {
      const [salt, expectedHash] = parts
      const computed = createHash('sha256').update(salt + password).digest('hex')
      return timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(computed, 'hex'))
    }
    const [salt, hash] = parts
    if (!salt || !hash) return false
    const computed = scryptSync(password, salt, 64).toString('hex')
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'))
  } catch {
    return false
  }
}

export function createUserSessionCookie(user: AuthedUser): string {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const payload = {
    u: {
      id: user.id,
      email: user.email.toLowerCase(),
      fullName: user.fullName,
      phone: user.phone || null,
      role: user.role,
      ninVerified: !!user.ninVerified,
      bvnVerified: !!user.bvnVerified,
      avatarUrl: user.avatarUrl || null,
    },
    exp: expiresAt,
  }
  const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = sign(serialized)
  return `${serialized}.${sig}`
}

export function verifyUserSessionCookie(cookieValue: string | undefined): AuthedUser | null {
  if (!cookieValue) return null
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return null
  const [serialized, sig] = parts
  const expectedSig = sign(serialized)

  try {
    const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    if (!ok) return null
  } catch {
    return null
  }

  try {
    const raw = Buffer.from(serialized, 'base64url').toString('utf8')
    const data = JSON.parse(raw)
    if (!data || !data.exp || Date.now() > data.exp) return null
    return data.u as AuthedUser
  } catch {
    return null
  }
}

export async function getUserSession(): Promise<AuthedUser | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(USER_COOKIE_NAME)?.value
  const user = verifyUserSessionCookie(cookie)
  if (user) return user

  // Admin session fallback: allow seamless admin access on main app
  try {
    const adminCookie = cookieStore.get('mapstar_admin_session')?.value
    if (adminCookie) {
      const parts = adminCookie.split('.')
      if (parts.length === 3) {
        const [emailB64, expiryStr] = parts
        const expiresAt = Number(expiryStr)
        if (expiresAt && Date.now() <= expiresAt) {
          const email = Buffer.from(emailB64, 'base64url').toString('utf8').toLowerCase()
          const adminUser = await findUserByEmail(email)
          if (adminUser && adminUser.role === 'ADMIN') {
            const { passwordHash: _, ...authed } = adminUser
            return authed
          }
        }
      }
    }
  } catch {}

  return null
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return null

  try {
    const dbUser = await db.user.findUnique({
      where: { email: normalized },
    })

    if (!dbUser) return null

    return {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      phone: dbUser.phone,
      role: dbUser.role as any,
      ninVerified: dbUser.ninVerified,
      bvnVerified: dbUser.bvnVerified,
      avatarUrl: dbUser.avatarUrl,
      passwordHash: dbUser.passwordHash || '',
      createdAt: dbUser.createdAt.toISOString(),
    }
  } catch (err: any) {
    console.error('findUserByEmail database error:', err)
    throw err
  }
}

export async function registerUser(data: {
  email: string
  password: string
  fullName: string
  phone?: string
  role?: 'TENANT' | 'LANDLORD' | 'AGENT' | 'ADMIN'
}): Promise<AuthedUser> {
  const normalizedEmail = (data.email || '').trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error('Email is required')
  }

  const passwordHash = hashPassword(data.password)
  const trimmedName = (data.fullName || '').trim()
  const sanitizedPhone = data.phone?.trim() || null
  const role = (data.role || 'TENANT') as any

  try {
    const created = await db.user.create({
      data: {
        email: normalizedEmail,
        fullName: trimmedName,
        phone: sanitizedPhone,
        role,
        passwordHash,
      },
    })

    return {
      id: created.id,
      email: created.email,
      fullName: created.fullName,
      phone: created.phone,
      role: created.role as any,
      ninVerified: created.ninVerified,
      bvnVerified: created.bvnVerified,
      avatarUrl: created.avatarUrl,
    }
  } catch (err: any) {
    console.error('registerUser database error:', err)
    if (err?.code === 'P2002' || err?.message?.includes('Unique constraint')) {
      throw new Error('An account with this email already exists')
    }
    throw err
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthedUser | null> {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail || !password) return null

  const user = await findUserByEmail(normalizedEmail)
  if (!user || !user.passwordHash) {
    return null
  }

  const isMatch =
    verifyPassword(password, user.passwordHash) ||
    verifyPassword(password.trim(), user.passwordHash)

  if (!isMatch) {
    return null
  }

  const { passwordHash: _, ...authed } = user
  return authed
}

export async function listAllUsers(): Promise<AuthedUser[]> {
  try {
    const dbUsers = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return dbUsers.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role as any,
      ninVerified: u.ninVerified,
      bvnVerified: u.bvnVerified,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt ? u.createdAt.toISOString() : undefined,
      updatedAt: u.updatedAt ? u.updatedAt.toISOString() : undefined,
    }))
  } catch (err: any) {
    console.error('listAllUsers database error:', err)
    throw err
  }
}

export async function deleteUserAccount(id: string): Promise<{ success: boolean; message: string }> {
  try {
    // Delete dependent relations first to protect FK constraints
    await db.review.deleteMany({ where: { authorId: id } }).catch(() => {})
    await db.report.deleteMany({ where: { reporterId: id } }).catch(() => {})
    await db.savedSearch.deleteMany({ where: { userId: id } }).catch(() => {})
    await db.referral.deleteMany({ where: { referrerId: id } }).catch(() => {})
    await db.landlord.deleteMany({ where: { userId: id } }).catch(() => {})
    await db.agent.deleteMany({ where: { userId: id } }).catch(() => {})
    await db.user.delete({ where: { id } })

    return {
      success: true,
      message: 'User account deleted successfully',
    }
  } catch (err: any) {
    console.error('deleteUserAccount database error:', err)
    throw err
  }
}

export async function updateUserRole(
  userId: string,
  newRole: 'LANDLORD' | 'AGENT' | 'TENANT'
): Promise<AuthedUser | null> {
  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: { role: newRole as any },
    })

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      phone: updated.phone,
      role: updated.role as any,
      ninVerified: updated.ninVerified,
      bvnVerified: updated.bvnVerified,
      avatarUrl: updated.avatarUrl,
    }
  } catch (err: any) {
    console.error('updateUserRole database error:', err)
    throw err
  }
}

// ---------------------------------------------------------------------
// Password Reset (Forgot Password) Management
// ---------------------------------------------------------------------

export async function createPasswordResetRequest(email: string): Promise<{
  code: string
  token: string
  expiresAt: number
}> {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await findUserByEmail(normalizedEmail)

  if (!user) {
    throw new Error('No account found with this email address')
  }

  cleanExpiredResetTokens()

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const token = randomBytes(24).toString('hex')
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS

  resetTokenStore.set(normalizedEmail, {
    email: normalizedEmail,
    code,
    token,
    expiresAt,
    createdAt: new Date().toISOString(),
  })

  const subject = 'Reset Your Mapstar Password'
  const message = `Hello ${user.fullName || 'Mapstar User'},\n\nYour 6-digit password reset code is: ${code}\nAlternatively, use token: ${token}\nThis code expires in 15 minutes.`

  await sendEmail({
    to: normalizedEmail,
    subject,
    body: message,
  })

  return { code, token, expiresAt }
}

export async function verifyResetCode(email: string, codeOrToken: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  const trimmed = codeOrToken.trim()

  cleanExpiredResetTokens()

  const record = resetTokenStore.get(normalizedEmail)
  if (!record) return false

  return record.code === trimmed || record.token === trimmed
}

export async function resetPasswordWithCode(
  email: string,
  codeOrToken: string,
  newPassword: string
): Promise<AuthedUser> {
  const normalizedEmail = email.trim().toLowerCase()

  const isValid = await verifyResetCode(normalizedEmail, codeOrToken)
  if (!isValid) {
    throw new Error('Invalid or expired reset code. Please request a new one.')
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.')
  }

  const newHash = hashPassword(newPassword)

  try {
    const updated = await db.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash: newHash },
    })

    resetTokenStore.delete(normalizedEmail)

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      phone: updated.phone,
      role: updated.role as any,
      ninVerified: updated.ninVerified,
      bvnVerified: updated.bvnVerified,
      avatarUrl: updated.avatarUrl,
    }
  } catch (err: any) {
    console.error('resetPasswordWithCode database error:', err)
    throw err
  }
}

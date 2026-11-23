import { cookies } from 'next/headers'
import { createHmac, createHash, scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import fs from 'fs'
import path from 'path'
import { db, directDb } from './db'
import { createServerClient } from './supabase'

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

// Salted cryptographic one-way hash (irreversible; cannot be read from code)
const SECURE_ADMIN_HASH =
  'e8f49a12c3b5706d:cf1abeb09a439092ef287e9a1f47c73eb260f2fb4612f8642f118444f4241f67:sha256'

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
          return {
            id: 'user_admin_01',
            email,
            fullName: process.env.ADMIN_NAME || 'Mapking',
            role: 'ADMIN',
            ninVerified: true,
            bvnVerified: true,
          }
        }
      }
    }
  } catch {}

  return null
}

// ---------------------------------------------------------------------
// Built-in Admin & Supabase Integration (No dummy seed users)
// ---------------------------------------------------------------------

const SEED_USERS: StoredUser[] = [
  {
    id: 'user_admin_01',
    email: 'mapstar777@gmail.com',
    fullName: 'Mapking',
    phone: '08000000000',
    role: 'ADMIN',
    ninVerified: true,
    bvnVerified: true,
    passwordHash: SECURE_ADMIN_HASH,
    createdAt: new Date().toISOString(),
  },
]

const DATA_DIR = path.join(process.cwd(), '.data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const RESET_TOKENS_FILE = path.join(DATA_DIR, 'reset-tokens.json')
const OUTBOX_LOG_FILE = path.join(DATA_DIR, 'email-outbox.log')

function readUsers(): StoredUser[] {
  const expectedAdminEmail = (process.env.ADMIN_EMAIL || 'mapstar777@gmail.com').trim().toLowerCase()
  const adminObj: StoredUser = {
    id: 'user_admin_01',
    email: expectedAdminEmail,
    fullName: process.env.ADMIN_NAME || 'Mapking',
    phone: '08000000000',
    role: 'ADMIN',
    ninVerified: true,
    bvnVerified: true,
    passwordHash: process.env.ADMIN_PASSWORD ? hashPassword(process.env.ADMIN_PASSWORD) : SECURE_ADMIN_HASH,
    createdAt: new Date().toISOString(),
  }

  try {
    let list: StoredUser[] = []
    if (!fs.existsSync(USERS_FILE)) {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
      }
      list = [...SEED_USERS]
    } else {
      const content = fs.readFileSync(USERS_FILE, 'utf8')
      const parsed = JSON.parse(content)
      list = Array.isArray(parsed) ? parsed : [...SEED_USERS]
    }

    const adminIdx = list.findIndex(
      (u) => u.id === 'user_admin_01' || u.role === 'ADMIN' || u.email.toLowerCase() === expectedAdminEmail
    )
    if (adminIdx >= 0) {
      list[adminIdx] = adminObj
    } else {
      list.unshift(adminObj)
    }

    return list
  } catch {
    const fallback = [...SEED_USERS]
    const adminIdx = fallback.findIndex((u) => u.id === 'user_admin_01' || u.role === 'ADMIN')
    if (adminIdx >= 0) fallback[adminIdx] = adminObj
    else fallback.unshift(adminObj)
    return fallback
  }
}

function writeUsers(users: StoredUser[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to persist users:', err)
  }
}

function readResetTokens(): PasswordResetRecord[] {
  try {
    if (!fs.existsSync(RESET_TOKENS_FILE)) return []
    const content = fs.readFileSync(RESET_TOKENS_FILE, 'utf8')
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeResetTokens(tokens: PasswordResetRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(RESET_TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to persist reset tokens:', err)
  }
}

function logOutboxEmail(to: string, subject: string, body: string): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    const entry = `[${new Date().toISOString()}] TO: ${to} | SUBJECT: ${subject}\n${body}\n----------------------------------------\n`
    fs.appendFileSync(OUTBOX_LOG_FILE, entry, 'utf8')
  } catch {}
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return null

  const expectedAdminEmail = (process.env.ADMIN_EMAIL || 'mapstar777@gmail.com').trim().toLowerCase()

  // Dedicated Master Admin
  if (normalized === expectedAdminEmail) {
    return {
      id: 'user_admin_01',
      email: expectedAdminEmail,
      fullName: process.env.ADMIN_NAME || 'Mapking',
      phone: '08000000000',
      role: 'ADMIN',
      ninVerified: true,
      bvnVerified: true,
      avatarUrl: null,
      passwordHash: process.env.ADMIN_PASSWORD ? hashPassword(process.env.ADMIN_PASSWORD) : SECURE_ADMIN_HASH,
      createdAt: new Date().toISOString(),
    }
  }

  // 1. Try querying Supabase PostgreSQL database via Prisma (pooled)
  try {
    const dbUser = await db.user.findUnique({
      where: { email: normalized },
    })
    if (dbUser) {
      return {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.fullName,
        phone: dbUser.phone,
        role: dbUser.role as any,
        ninVerified: dbUser.ninVerified,
        bvnVerified: dbUser.bvnVerified,
        avatarUrl: dbUser.avatarUrl,
        passwordHash: (dbUser as any).passwordHash || '',
        createdAt: dbUser.createdAt.toISOString(),
      }
    }
  } catch (err: any) {
    console.error('db.user.findUnique pooled error:', err?.message || err)
    // Try direct connection if pooled connection failed
    try {
      const dbUser = await directDb.user.findUnique({
        where: { email: normalized },
      })
      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          fullName: dbUser.fullName,
          phone: dbUser.phone,
          role: dbUser.role as any,
          ninVerified: dbUser.ninVerified,
          bvnVerified: dbUser.bvnVerified,
          avatarUrl: dbUser.avatarUrl,
          passwordHash: (dbUser as any).passwordHash || '',
          createdAt: dbUser.createdAt.toISOString(),
        }
      }
    } catch (directErr: any) {
      console.error('directDb.user.findUnique error:', directErr?.message || directErr)
    }
  }

  // 2. Try querying Supabase PostgreSQL via REST SDK
  try {
    const supabase = createServerClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('email', normalized)
        .maybeSingle()
      if (data && !error) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.fullName,
          phone: data.phone,
          role: data.role as any,
          ninVerified: !!data.ninVerified,
          bvnVerified: !!data.bvnVerified,
          avatarUrl: data.avatarUrl,
          passwordHash: data.passwordHash || '',
          createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date(data.createdAt).toISOString(),
        }
      }
    }
  } catch (err: any) {
    console.error('supabase REST findUserByEmail error:', err?.message || err)
  }

  const users = readUsers()
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null
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

  // 1. Check if user already exists
  const existing = await findUserByEmail(normalizedEmail)
  if (existing) {
    throw new Error('An account with this email already exists')
  }

  const passwordHash = hashPassword(data.password)
  const trimmedName = (data.fullName || '').trim()
  const sanitizedPhone = data.phone?.trim() || null
  const role = (data.role || 'TENANT') as any

  let authedUser: AuthedUser | null = null

  // 2. Try saving to Supabase / PostgreSQL via Prisma (pooled)
  try {
    const created = await db.user.create({
      data: {
        email: normalizedEmail,
        fullName: trimmedName,
        phone: sanitizedPhone,
        role,
        passwordHash,
      } as any,
    })
    authedUser = {
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
    console.error('Prisma pooled db.user.create failed:', err?.message || err)
    if (err?.code === 'P2002' || err?.message?.includes('Unique constraint')) {
      throw new Error('An account with this email already exists')
    }

    // Try direct connection if pooled connection failed
    try {
      const created = await directDb.user.create({
        data: {
          email: normalizedEmail,
          fullName: trimmedName,
          phone: sanitizedPhone,
          role,
          passwordHash,
        } as any,
      })
      authedUser = {
        id: created.id,
        email: created.email,
        fullName: created.fullName,
        phone: created.phone,
        role: created.role as any,
        ninVerified: created.ninVerified,
        bvnVerified: created.bvnVerified,
        avatarUrl: created.avatarUrl,
      }
    } catch (directErr: any) {
      console.error('directDb.user.create failed:', directErr?.message || directErr)
      if (directErr?.code === 'P2002' || directErr?.message?.includes('Unique constraint')) {
        throw new Error('An account with this email already exists')
      }
    }
  }

  // 3. Try saving to Supabase / PostgreSQL via REST SDK if Prisma was unreachable
  if (!authedUser) {
    try {
      const supabase = createServerClient()
      if (supabase) {
        const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        const { data: created, error } = await supabase
          .from('User')
          .insert({
            id: newId,
            email: normalizedEmail,
            fullName: trimmedName,
            phone: sanitizedPhone,
            role,
            passwordHash,
            ninVerified: false,
            bvnVerified: false,
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single()
        if (created && !error) {
          authedUser = {
            id: created.id,
            email: created.email,
            fullName: created.fullName,
            phone: created.phone,
            role: created.role as any,
            ninVerified: created.ninVerified,
            bvnVerified: created.bvnVerified,
            avatarUrl: created.avatarUrl,
          }
        } else if (error) {
          console.error('Supabase REST insert error:', error.message)
        }
      }
    } catch (restErr: any) {
      console.error('Supabase REST registerUser error:', restErr?.message || restErr)
    }
  }

  // 4. Fallback to local storage if remote databases failed
  if (!authedUser) {
    const newUser: StoredUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      fullName: trimmedName,
      phone: sanitizedPhone,
      role,
      ninVerified: false,
      bvnVerified: false,
      passwordHash,
      createdAt: new Date().toISOString(),
    }

    const users = readUsers()
    users.push(newUser)
    writeUsers(users)

    authedUser = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      phone: newUser.phone,
      role: newUser.role,
      ninVerified: newUser.ninVerified,
      bvnVerified: newUser.bvnVerified,
      avatarUrl: newUser.avatarUrl,
    }
  } else {
    // Keep local storage mirror in sync with database record
    try {
      const users = readUsers()
      if (!users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        users.push({
          id: authedUser.id,
          email: authedUser.email,
          fullName: authedUser.fullName,
          phone: authedUser.phone,
          role: authedUser.role,
          ninVerified: authedUser.ninVerified,
          bvnVerified: authedUser.bvnVerified,
          avatarUrl: authedUser.avatarUrl,
          passwordHash,
          createdAt: new Date().toISOString(),
        })
        writeUsers(users)
      }
    } catch {}
  }

  return authedUser
}

export async function authenticateUser(email: string, password: string): Promise<AuthedUser | null> {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail || !password) return null

  const expectedAdminEmail = (process.env.ADMIN_EMAIL || 'mapstar777@gmail.com').trim().toLowerCase()

  // 1. Check if user is logging in with the admin account
  if (normalizedEmail === expectedAdminEmail) {
    let passwordMatches = false
    const inputPassword = (password || '').trim()

    // Check custom plaintext password in environment variable if explicitly configured
    const envPassword = (process.env.ADMIN_PASSWORD || '').trim()
    if (envPassword && (inputPassword === envPassword || password === process.env.ADMIN_PASSWORD)) {
      passwordMatches = true
    }

    // Otherwise verify against the secure cryptographic one-way hash
    if (!passwordMatches) {
      passwordMatches =
        verifyPassword(inputPassword, SECURE_ADMIN_HASH) ||
        verifyPassword(password, SECURE_ADMIN_HASH)
    }

    if (passwordMatches) {
      return {
        id: 'user_admin_01',
        email: expectedAdminEmail,
        fullName: process.env.ADMIN_NAME || 'Mapking',
        phone: '08000000000',
        role: 'ADMIN',
        ninVerified: true,
        bvnVerified: true,
        avatarUrl: null,
      }
    }
  }

  // 2. Regular user authentication
  const user = await findUserByEmail(normalizedEmail)
  if (!user || !user.passwordHash) {
    console.warn(`authenticateUser: user not found or missing passwordHash for ${normalizedEmail}`)
    return null
  }

  const isMatch =
    verifyPassword(password, user.passwordHash) ||
    verifyPassword(password.trim(), user.passwordHash)

  if (!isMatch) {
    console.warn(`authenticateUser: password mismatch for ${normalizedEmail}`)
    return null
  }

  const { passwordHash: _, ...authed } = user
  return authed
}

export async function listAllUsers(): Promise<AuthedUser[]> {
  try {
    const dbUsers = await db.user.findMany()
    if (dbUsers && dbUsers.length > 0) {
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
    }
  } catch (err: any) {
    try {
      const dbUsers = await directDb.user.findMany()
      if (dbUsers && dbUsers.length > 0) {
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
      }
    } catch {}
  }

  try {
    const supabase = createServerClient()
    if (supabase) {
      const { data, error } = await supabase.from('User').select('*')
      if (data && !error && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role as any,
          ninVerified: u.ninVerified,
          bvnVerified: u.bvnVerified,
          avatarUrl: u.avatarUrl,
          createdAt: u.createdAt || undefined,
          updatedAt: u.updatedAt || undefined,
        }))
      }
    }
  } catch (err) {}

  const users = readUsers()
  return users.map(({ passwordHash: _, ...u }) => u)
}

export async function deleteUserAccount(id: string): Promise<{ success: boolean; message: string }> {
  let deleted = false

  // 1. Prisma: cascade delete dependent relational records first to protect FK constraints
  try {
    await db.review.deleteMany({ where: { authorId: id } }).catch(() => {})
    await db.report.deleteMany({ where: { reporterId: id } }).catch(() => {})
    await db.savedSearch.deleteMany({ where: { userId: id } }).catch(() => {})
    await db.referral.deleteMany({ where: { referrerId: id } }).catch(() => {})
    await db.landlord.deleteMany({ where: { userId: id } }).catch(() => {})
    await db.agent.deleteMany({ where: { userId: id } }).catch(() => {})
    await db.user.delete({ where: { id } })
    deleted = true
  } catch (err) {
    try {
      await directDb.user.delete({ where: { id } })
      deleted = true
    } catch {}
  }

  // 2. Supabase REST fallback
  try {
    const supabase = createServerClient()
    if (supabase) {
      await supabase.from('Review').delete().eq('authorId', id)
      await supabase.from('Report').delete().eq('reporterId', id)
      await supabase.from('SavedSearch').delete().eq('userId', id)
      await supabase.from('Referral').delete().eq('referrerId', id)
      await supabase.from('Landlord').delete().eq('userId', id)
      await supabase.from('Agent').delete().eq('userId', id)
      const { error } = await supabase.from('User').delete().eq('id', id)
      if (!error) deleted = true
    }
  } catch (err) {}

  // 3. Local JSON fallback
  try {
    const users = readUsers()
    const filtered = users.filter((u) => u.id !== id && u.email !== id)
    if (filtered.length !== users.length) {
      writeUsers(filtered)
      deleted = true
    }
  } catch (err) {}

  return {
    success: true,
    message: deleted ? 'User account deleted successfully' : 'User account removed',
  }
}

export async function updateUserRole(
  userId: string,
  newRole: 'LANDLORD' | 'AGENT' | 'TENANT'
): Promise<AuthedUser | null> {
  // 1. Try updating in Supabase PostgreSQL via Prisma
  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: { role: newRole as any },
    })
    if (updated) {
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
    }
  } catch (err) {
    try {
      const updated = await directDb.user.update({
        where: { id: userId },
        data: { role: newRole as any },
      })
      if (updated) {
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
      }
    } catch {}
  }

  // 2. Try updating via Supabase REST SDK
  try {
    const supabase = createServerClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('User')
        .update({ role: newRole, updatedAt: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()
      if (data && !error) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.fullName,
          phone: data.phone,
          role: data.role as any,
          ninVerified: data.ninVerified,
          bvnVerified: data.bvnVerified,
          avatarUrl: data.avatarUrl,
        }
      }
    }
  } catch (err) {}

  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) return null
  user.role = newRole
  writeUsers(users)
  const { passwordHash: _, ...authed } = user
  return authed
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

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const token = randomBytes(24).toString('hex')
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS

  const tokens = readResetTokens().filter((t) => t.email !== normalizedEmail)
  tokens.push({
    email: normalizedEmail,
    code,
    token,
    expiresAt,
    createdAt: new Date().toISOString(),
  })
  writeResetTokens(tokens)

  const subject = 'Reset Your Mapstar Password'
  const message = `Hello ${user.fullName || 'Mapstar User'},\n\nYour 6-digit password reset code is: ${code}\nAlternatively, use token: ${token}\nThis code expires in 15 minutes.`
  logOutboxEmail(normalizedEmail, subject, message)

  return { code, token, expiresAt }
}

export async function verifyResetCode(email: string, codeOrToken: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  const trimmed = codeOrToken.trim()
  const tokens = readResetTokens()

  const match = tokens.find(
    (t) =>
      t.email === normalizedEmail &&
      (t.code === trimmed || t.token === trimmed) &&
      t.expiresAt > Date.now()
  )

  return !!match
}

export async function resetPasswordWithCode(
  email: string,
  codeOrToken: string,
  newPassword: string
): Promise<AuthedUser> {
  const normalizedEmail = email.trim().toLowerCase()
  const trimmed = codeOrToken.trim()
  const tokens = readResetTokens()

  const matchIndex = tokens.findIndex(
    (t) =>
      t.email === normalizedEmail &&
      (t.code === trimmed || t.token === trimmed) &&
      t.expiresAt > Date.now()
  )

  if (matchIndex === -1) {
    throw new Error('Invalid or expired reset code. Please request a new one.')
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.')
  }

  const newHash = hashPassword(newPassword)

  // 1. Try updating in Supabase / PostgreSQL database via Prisma
  try {
    const updated = await db.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash: newHash } as any,
    })
    // Invalidate ALL pending reset tokens for this user
    const remainingTokens = tokens.filter((t) => t.email !== normalizedEmail)
    writeResetTokens(remainingTokens)
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
  } catch (err) {
    try {
      const updated = await directDb.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash: newHash } as any,
      })
      const remainingTokens = tokens.filter((t) => t.email !== normalizedEmail)
      writeResetTokens(remainingTokens)
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
    } catch {}
  }

  // 2. Try updating via Supabase REST SDK
  try {
    const supabase = createServerClient()
    if (supabase) {
      const { data: updated, error } = await supabase
        .from('User')
        .update({ passwordHash: newHash, updatedAt: new Date().toISOString() })
        .eq('email', normalizedEmail)
        .select()
        .single()
      if (updated && !error) {
        // Invalidate ALL pending reset tokens for this user
        const remainingTokens = tokens.filter((t) => t.email !== normalizedEmail)
        writeResetTokens(remainingTokens)
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
      }
    }
  } catch (err) {}

  const users = readUsers()
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail)

  if (!user) {
    throw new Error('User not found.')
  }

  user.passwordHash = newHash
  writeUsers(users)

  // Invalidate ALL pending reset tokens for this user
  const remainingTokens = tokens.filter((t) => t.email !== normalizedEmail)
  writeResetTokens(remainingTokens)

  const { passwordHash: _, ...authed } = user
  return authed
}

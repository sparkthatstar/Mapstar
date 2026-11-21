import { cookies } from 'next/headers'
import { createHmac, scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import fs from 'fs'
import path from 'path'

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

function getSecret(): string {
  return process.env.USER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'mapstar-user-session-fallback-secret'
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
    const [salt, hash] = stored.split(':')
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
  return verifyUserSessionCookie(cookie)
}

// ---------------------------------------------------------------------
// Built-in Seed Users & Local Persistence for instant MVP functionality
// ---------------------------------------------------------------------

const SEED_USERS: StoredUser[] = [
  {
    id: 'user_tenant_01',
    email: 'tenant@mapstar.ng',
    fullName: 'Chinedu Okeke',
    phone: '08031234567',
    role: 'TENANT',
    ninVerified: true,
    bvnVerified: false,
    passwordHash: hashPassword('password123'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_landlord_01',
    email: 'landlord@mapstar.ng',
    fullName: 'Chief Emeka Eze',
    phone: '08029876543',
    role: 'LANDLORD',
    ninVerified: true,
    bvnVerified: true,
    passwordHash: hashPassword('password123'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_agent_01',
    email: 'agent@mapstar.ng',
    fullName: 'Amaka Nwachukwu',
    phone: '08145556789',
    role: 'AGENT',
    ninVerified: true,
    bvnVerified: true,
    passwordHash: hashPassword('password123'),
    createdAt: new Date().toISOString(),
  },
]

const DATA_DIR = path.join(process.cwd(), '.data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const RESET_TOKENS_FILE = path.join(DATA_DIR, 'reset-tokens.json')
const OUTBOX_LOG_FILE = path.join(DATA_DIR, 'email-outbox.log')

function getAdminUser(): StoredUser | null {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return null

  return {
    id: 'user_admin_01',
    email: email.trim().toLowerCase(),
    fullName: process.env.ADMIN_NAME || 'Admin',
    phone: '08000000000',
    role: 'ADMIN',
    ninVerified: true,
    bvnVerified: true,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  }
}

function readUsers(): StoredUser[] {
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

    // Dynamically inject/sync configured admin from environment variables
    const adminUser = getAdminUser()
    if (adminUser) {
      const adminIdx = list.findIndex((u) => u.role === 'ADMIN' || u.email.toLowerCase() === adminUser.email)
      if (adminIdx >= 0) {
        list[adminIdx] = adminUser
      } else {
        list.push(adminUser)
      }
    }

    return list
  } catch {
    const fallback = [...SEED_USERS]
    const adminUser = getAdminUser()
    if (adminUser) fallback.push(adminUser)
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
    console.error('Failed to write users file:', err)
  }
}

function readResetTokens(): PasswordResetRecord[] {
  try {
    if (!fs.existsSync(RESET_TOKENS_FILE)) return []
    const content = fs.readFileSync(RESET_TOKENS_FILE, 'utf8')
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return parsed.filter((r) => r.expiresAt > Date.now())
    }
    return []
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
    console.error('Failed to write reset tokens file:', err)
  }
}

function logOutboxEmail(to: string, subject: string, body: string) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    const entry = `[${new Date().toISOString()}] TO: ${to} | SUBJECT: ${subject}\n${body}\n----------------------------------------\n`
    fs.appendFileSync(OUTBOX_LOG_FILE, entry, 'utf8')
  } catch {}
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase()
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
  const normalizedEmail = data.email.trim().toLowerCase()
  const users = readUsers()

  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail)
  if (existing) {
    throw new Error('An account with this email already exists')
  }

  const newUser: StoredUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    fullName: data.fullName.trim(),
    phone: data.phone?.trim() || null,
    role: data.role || 'TENANT',
    ninVerified: false,
    bvnVerified: false,
    passwordHash: hashPassword(data.password),
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  writeUsers(users)

  const { passwordHash: _, ...authed } = newUser
  return authed
}

export async function authenticateUser(email: string, password: string): Promise<AuthedUser | null> {
  const normalizedEmail = email.trim().toLowerCase()

  // First check if credentials match the securely configured admin in environment variables
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (
    adminEmail &&
    adminPassword &&
    normalizedEmail === adminEmail.trim().toLowerCase() &&
    password === adminPassword
  ) {
    return {
      id: 'user_admin_01',
      email: adminEmail.trim().toLowerCase(),
      fullName: process.env.ADMIN_NAME || 'Admin',
      phone: '08000000000',
      role: 'ADMIN',
      ninVerified: true,
      bvnVerified: true,
      avatarUrl: null,
    }
  }

  const user = await findUserByEmail(email)
  if (!user) return null

  const isMatch = verifyPassword(password, user.passwordHash)
  if (!isMatch) return null

  const { passwordHash: _, ...authed } = user
  return authed
}

export async function listAllUsers(): Promise<AuthedUser[]> {
  const users = readUsers()
  return users.map(({ passwordHash: _, ...u }) => u)
}

export async function updateUserRole(
  userId: string,
  newRole: 'LANDLORD' | 'AGENT' | 'TENANT'
): Promise<AuthedUser | null> {
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

  // 6-digit numeric verification code (e.g., 482910)
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

  const users = readUsers()
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail)

  if (!user) {
    throw new Error('User not found.')
  }

  user.passwordHash = hashPassword(newPassword)
  writeUsers(users)

  tokens.splice(matchIndex, 1)
  writeResetTokens(tokens)

  const { passwordHash: _, ...authed } = user
  return authed
}

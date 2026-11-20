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

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getSecret(): string {
  return process.env.USER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'mapstar-user-session-secret-2026'
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
  {
    id: 'user_admin_01',
    email: 'admin@mapstar.ng',
    fullName: 'Mapstar Super Admin',
    phone: '08000000000',
    role: 'ADMIN',
    ninVerified: true,
    bvnVerified: true,
    passwordHash: hashPassword('mapstar2026'),
    createdAt: new Date().toISOString(),
  },
]

const DATA_DIR = path.join(process.cwd(), '.data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

function readUsers(): StoredUser[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(SEED_USERS, null, 2), 'utf8')
      return SEED_USERS
    }
    const content = fs.readFileSync(USERS_FILE, 'utf8')
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed
    return SEED_USERS
  } catch {
    return SEED_USERS
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
  role?: 'TENANT' | 'LANDLORD' | 'AGENT'
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
  const user = await findUserByEmail(email)
  if (!user) return null

  const isMatch = verifyPassword(password, user.passwordHash)
  if (!isMatch) return null

  const { passwordHash: _, ...authed } = user
  return authed
}

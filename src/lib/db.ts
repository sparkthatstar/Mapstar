import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  directPrisma: PrismaClient | undefined
}

/**
 * Ensures PostgreSQL connection strings for Supabase include sslmode=require.
 * AWS EU-West-1 Supabase instances strictly enforce encrypted connections.
 */
function ensureSsl(url?: string): string | undefined {
  if (!url) return undefined
  let cleaned = url.trim()
  if (!cleaned.includes('sslmode=')) {
    const separator = cleaned.includes('?') ? '&' : '?'
    cleaned = `${cleaned}${separator}sslmode=require`
  }
  return cleaned
}

const pooledUrl = ensureSsl(process.env.DATABASE_URL)
const directUrl = ensureSsl(process.env.DIRECT_URL)

/**
 * Primary Prisma Client connected via Supabase PgBouncer pooled connection (port 6543).
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: pooledUrl ? { db: { url: pooledUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

/**
 * Direct fallback Prisma Client connected to Supabase PostgreSQL (port 5432).
 * Used as fallback if PgBouncer pooler experiences connection throttling.
 */
export const directDb =
  globalForPrisma.directPrisma ??
  new PrismaClient({
    datasources: directUrl ? { db: { url: directUrl } } : (pooledUrl ? { db: { url: pooledUrl } } : undefined),
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.directPrisma = directDb
}


import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
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

/**
 * Prisma Client connected to Supabase PostgreSQL database.
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: pooledUrl ? { db: { url: pooledUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

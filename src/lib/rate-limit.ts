import { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export interface RateLimitOptions {
  maxAttempts?: number
  windowMs?: number
  prefix?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

// ---------------------------------------------------------------------
// In-Memory Fallback Store (Used when Upstash credentials are missing)
// ---------------------------------------------------------------------

interface MemoryRecord {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, MemoryRecord>()
let lastCleanup = Date.now()

function cleanupMemoryStore() {
  const now = Date.now()
  if (now - lastCleanup < 5 * 60 * 1000) return
  lastCleanup = now
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key)
    }
  }
}

function checkInMemoryRateLimit(
  ip: string,
  prefix: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  cleanupMemoryStore()

  const key = `${prefix}:${ip}`
  const now = Date.now()
  let record = memoryStore.get(key)

  if (!record || record.resetAt <= now) {
    record = {
      count: 1,
      resetAt: now + windowMs,
    }
    memoryStore.set(key, record)
    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - 1),
      resetAt: record.resetAt,
      retryAfterSeconds: 0,
    }
  }

  record.count += 1
  const remaining = Math.max(0, maxAttempts - record.count)
  const allowed = record.count <= maxAttempts
  const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000))

  return {
    allowed,
    remaining,
    resetAt: record.resetAt,
    retryAfterSeconds: allowed ? 0 : retryAfterSeconds,
  }
}

// ---------------------------------------------------------------------
// Upstash Redis & Ratelimit Configuration
// ---------------------------------------------------------------------

let hasLoggedWarning = false

function getRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url || !token || url.includes('[YOUR-') || token.includes('your-token')) {
    if (!hasLoggedWarning) {
      console.warn(
        '[RATE_LIMIT] UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN missing. Falling back to in-memory rate limiter.'
      )
      hasLoggedWarning = true
    }
    return null
  }

  return { url, token }
}

const redisConfig = getRedisConfig()

/**
 * Upstash Redis Client initialized from environment variables.
 */
export const redis = redisConfig
  ? new Redis({
      url: redisConfig.url,
      token: redisConfig.token,
    })
  : null

/**
 * Extracts client IP safely from NextRequest headers.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return '127.0.0.1'
}

/**
 * Checks and increments rate limit for an IP and prefix.
 * Uses the @upstash/ratelimit SDK slidingWindow backed by Upstash Redis across serverless instances,
 * with resilient in-memory fallback if Redis is unconfigured or unreachable.
 */
export async function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const {
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000,
    prefix = 'global',
  } = options

  const ip = getClientIp(req)
  const currentConfig = getRedisConfig()

  if (currentConfig && redis) {
    try {
      const windowSeconds = Math.max(1, Math.round(windowMs / 1000))
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxAttempts, `${windowSeconds} s`),
        prefix: `@upstash/ratelimit:${prefix}`,
      })

      const res = await limiter.limit(ip)
      const now = Date.now()
      const retryAfterSeconds = res.success ? 0 : Math.max(1, Math.ceil((res.reset - now) / 1000))

      return {
        allowed: res.success,
        remaining: res.remaining,
        resetAt: res.reset,
        retryAfterSeconds,
      }
    } catch (err) {
      console.error('[RATE_LIMIT] Upstash Redis call error:', err)
    }
  }

  return checkInMemoryRateLimit(ip, prefix, maxAttempts, windowMs)
}

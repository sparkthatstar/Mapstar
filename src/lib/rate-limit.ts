import { NextRequest } from 'next/server'

interface RateLimitRecord {
  count: number
  resetAt: number
}

// In-memory store for sliding window rate limiting
const store = new Map<string, RateLimitRecord>()

// Periodic cleanup to avoid memory leaks (runs at most once every 5 minutes)
let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 5 * 60 * 1000) return
  lastCleanup = now
  for (const [key, record] of store.entries()) {
    if (record.resetAt <= now) {
      store.delete(key)
    }
  }
}

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
 * Default: 5 requests per 15 minutes.
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): RateLimitResult {
  cleanup()

  const {
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000,
    prefix = 'global',
  } = options

  const ip = getClientIp(req)
  const key = `${prefix}:${ip}`
  const now = Date.now()

  let record = store.get(key)

  if (!record || record.resetAt <= now) {
    record = {
      count: 1,
      resetAt: now + windowMs,
    }
    store.set(key, record)
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetAt: record.resetAt,
      retryAfterSeconds: 0,
    }
  }

  record.count += 1
  const remaining = Math.max(0, maxAttempts - record.count)
  const allowed = record.count <= maxAttempts
  const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000)

  return {
    allowed,
    remaining,
    resetAt: record.resetAt,
    retryAfterSeconds: allowed ? 0 : retryAfterSeconds,
  }
}

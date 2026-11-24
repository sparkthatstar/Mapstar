import { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { spawnSync } from 'child_process'

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
  then?: (onfulfilled?: (value: RateLimitResult) => any, onrejected?: (reason: any) => any) => Promise<any>
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
 * Upstash Ratelimit slidingWindow instance backed by Redis.
 */
export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '15 m'),
      prefix: '@upstash/ratelimit:mapstar',
    })
  : null

// Sliding Window Counter Lua script matching @upstash/ratelimit algorithm
const UPSTASH_SLIDING_WINDOW_LUA = `
local currentKey = KEYS[1]
local previousKey = KEYS[2]
local tokens = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local window = tonumber(ARGV[3])
local incrementBy = tonumber(ARGV[4] or 1)

local requestsInCurrentWindow = tonumber(redis.call('GET', currentKey) or 0)
local requestsInPreviousWindow = tonumber(redis.call('GET', previousKey) or 0)

local percentageInCurrent = (now % window) / window
requestsInPreviousWindow = math.floor((1 - percentageInCurrent) * requestsInPreviousWindow)

if incrementBy > 0 and (requestsInPreviousWindow + requestsInCurrentWindow) >= tokens then
    return {-1, tokens}
end

local newValue = redis.call('INCRBY', currentKey, incrementBy)
if newValue == incrementBy then
    redis.call('PEXPIRE', currentKey, math.floor(window * 2 / 1000))
end

return {requestsInPreviousWindow + newValue, tokens}
`.trim()

/**
 * Executes the Upstash sliding window algorithm synchronously against the Upstash REST endpoint.
 * Ensures serverless route handlers calling checkRateLimit synchronously remain fully shared across instances.
 */
function checkUpstashRateLimitSync(
  url: string,
  token: string,
  prefix: string,
  ip: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult | null {
  try {
    const now = Date.now()
    const currentWindow = Math.floor(now / windowMs)
    const currentKey = `@upstash/ratelimit:${prefix}:${ip}:${currentWindow}`
    const previousKey = `@upstash/ratelimit:${prefix}:${ip}:${currentWindow - 1}`
    const resetAt = (currentWindow + 1) * windowMs

    const commandPayload = JSON.stringify([
      'EVAL',
      UPSTASH_SLIDING_WINDOW_LUA,
      '2',
      currentKey,
      previousKey,
      maxAttempts.toString(),
      now.toString(),
      windowMs.toString(),
      '1',
    ])

    const curlCmd = process.platform === 'win32' ? 'curl.exe' : 'curl'
    const proc = spawnSync(
      curlCmd,
      [
        '-s',
        '-m',
        '2',
        '-X',
        'POST',
        url,
        '-H',
        `Authorization: Bearer ${token}`,
        '-H',
        'Content-Type: application/json',
        '-d',
        commandPayload,
      ],
      { timeout: 2500, encoding: 'utf8' }
    )

    if (proc.error || proc.status !== 0 || !proc.stdout) {
      return null
    }

    const response = JSON.parse(proc.stdout)
    if (!response || response.error || !Array.isArray(response.result)) {
      return null
    }

    const [count, effectiveLimit] = response.result
    if (count === -1) {
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000))
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfterSeconds,
      }
    }

    const remaining = Math.max(0, Number(effectiveLimit) - Number(count))
    return {
      allowed: true,
      remaining,
      resetAt,
      retryAfterSeconds: 0,
    }
  } catch (err) {
    console.error('[RATE_LIMIT] Sync Upstash Redis call error:', err)
    return null
  }
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
 * Standardized on Upstash Redis slidingWindow across serverless instances,
 * with resilient in-memory fallback if Redis is unconfigured or unreachable.
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): RateLimitResult {
  const {
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000,
    prefix = 'global',
  } = options

  const ip = getClientIp(req)
  const currentConfig = getRedisConfig()

  let result: RateLimitResult | null = null

  if (currentConfig) {
    result = checkUpstashRateLimitSync(
      currentConfig.url,
      currentConfig.token,
      prefix,
      ip,
      maxAttempts,
      windowMs
    )
  }

  // Fallback to in-memory store if Redis was unconfigured or timed out
  if (!result) {
    result = checkInMemoryRateLimit(ip, prefix, maxAttempts, windowMs)
  }

  // Attach thenable interface so that callers with or without await execute seamlessly
  return Object.assign(result, {
    then(onfulfilled?: (val: RateLimitResult) => any, onrejected?: (err: any) => any) {
      return Promise.resolve(result!).then(onfulfilled, onrejected)
    },
  })
}

/**
 * Asynchronous rate limit check using the official @upstash/ratelimit SDK directly.
 */
export async function checkRateLimitAsync(
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
      console.error('[RATE_LIMIT] Async Upstash Redis call error:', err)
    }
  }

  return checkInMemoryRateLimit(ip, prefix, maxAttempts, windowMs)
}

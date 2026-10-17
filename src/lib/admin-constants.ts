/**
 * Shared constants for admin auth — safe to import from Edge middleware.
 * Keep this file free of Node-only imports (no 'crypto', no 'next/headers').
 */

export const ADMIN_COOKIE_NAME = 'mapstar_admin_session'

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

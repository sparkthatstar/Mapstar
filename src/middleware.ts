import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/admin-constants'

/**
 * Middleware — runs on the Edge Runtime.
 *
 * We don't verify the session cookie here (HMAC crypto isn't available in Edge).
 * The server component at /admin/page.tsx does the actual session verification
 * and renders either the login form or the dashboard.
 *
 * For admin API endpoints (other than login/logout), the route handlers
 * themselves check the session via getAdminSession() (runs in Node runtime).
 *
 * This middleware's only job is to:
 *   1. Add a noindex header on /admin pages so they don't get indexed
 *   2. Pass through cookie presence as a header for logging
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value

  const res = NextResponse.next()

  // Prevent indexing of admin pages
  if (pathname.startsWith('/admin')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }

  // Pass through cookie presence as a header for logging (NOT for auth — auth happens server-side)
  if (cookie) {
    res.headers.set('x-mapstar-admin-session', 'present')
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

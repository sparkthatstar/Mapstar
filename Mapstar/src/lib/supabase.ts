import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser-side Supabase client.
 * Uses the anon key — protected by Row Level Security policies.
 */
export function createBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon || url.includes('your-project-ref')) {
    // Sandbox / not-yet-configured: return null so the UI falls back to mock data.
    return null
  }
  return createClient(url, anon)
}

/**
 * Server-side Supabase client.
 * Uses the service-role key — bypasses RLS. Only import from server components / API routes.
 */
export function createServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service || url.includes('your-project-ref')) {
    return null
  }
  return createClient(url, service, {
    auth: { persistSession: false },
  })
}

/**
 * Convenience flag — true when Supabase is actually wired up.
 */
export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!url && !url.includes('your-project-ref')
}

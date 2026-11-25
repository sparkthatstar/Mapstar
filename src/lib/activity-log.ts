/**
 * Mapstar Activity & Login Audit Log
 * Tracks live user authentication events, session history, and administrative actions.
 */

export interface LoginActivityEntry {
  id: string
  userId?: string
  email: string
  fullName?: string
  role?: string
  status: 'SUCCESS' | 'FAILED'
  ip?: string
  userAgent?: string
  timestamp: string
  details?: string
}

// In-memory ring buffer of recent login events
const MAX_LOGS = 100
let activityLogs: LoginActivityEntry[] = [
  {
    id: 'log-seed-1',
    userId: 'user_admin_01',
    email: 'admin@mapstar.ng',
    fullName: 'Administrator',
    role: 'ADMIN',
    status: 'SUCCESS',
    ip: '127.0.0.1',
    userAgent: 'Admin Dashboard (Active)',
    timestamp: new Date().toISOString(),
    details: 'Master Admin authentication via password',
  },
  {
    id: 'log-seed-2',
    userId: 'user_landlord_01',
    email: 'landlord.amadi@example.com',
    fullName: 'Chief Emeka Amadi',
    role: 'LANDLORD',
    status: 'SUCCESS',
    ip: '102.89.44.12',
    userAgent: 'Mobile Chrome 124 / Android',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    details: 'Landlord session renewed',
  },
  {
    id: 'log-seed-3',
    userId: 'user_tenant_01',
    email: 'chidi.okafor@futo.edu.ng',
    fullName: 'Chidi Okafor',
    role: 'TENANT',
    status: 'SUCCESS',
    ip: '102.88.23.90',
    userAgent: 'Desktop Safari / macOS',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    details: 'Student tenant verified search',
  },
]

export function recordLoginActivity(entry: Omit<LoginActivityEntry, 'id' | 'timestamp'>) {
  const newEntry: LoginActivityEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  }

  activityLogs.unshift(newEntry)
  if (activityLogs.length > MAX_LOGS) {
    activityLogs = activityLogs.slice(0, MAX_LOGS)
  }

  return newEntry
}

export function getRecentLoginActivity(limit = 50): LoginActivityEntry[] {
  return activityLogs.slice(0, limit)
}

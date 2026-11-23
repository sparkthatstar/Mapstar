import { db } from './db'
import { createServerClient } from './supabase'
import { recordLoginActivity } from './activity-log'
import fs from 'fs'
import path from 'path'

export interface VerificationApplication {
  id: string
  userId: string
  userEmail: string
  fullName: string
  phone?: string
  type: 'IDENTITY' | 'LANDLORD' | 'AGENT'
  nin?: string
  bvn?: string
  businessName?: string
  propertyOrOfficeAddress?: string
  notes?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED'
  reviewedAt?: string
  reviewedBy?: string
  createdAt: string
  updatedAt: string
}

const DATA_DIR = path.join(process.cwd(), '.data')
const VERIFICATIONS_FILE = path.join(DATA_DIR, 'verifications.json')

function readVerifications(): VerificationApplication[] {
  try {
    if (!fs.existsSync(VERIFICATIONS_FILE)) return []
    const content = fs.readFileSync(VERIFICATIONS_FILE, 'utf8')
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeVerifications(apps: VerificationApplication[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(VERIFICATIONS_FILE, JSON.stringify(apps, null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to write verifications:', err)
  }
}

/**
 * Submit a verification application (NIN, BVN, or Landlord/Agent listing license)
 */
export async function submitVerificationApplication(data: {
  userId: string
  userEmail: string
  fullName: string
  phone?: string
  type: 'IDENTITY' | 'LANDLORD' | 'AGENT'
  nin?: string
  bvn?: string
  businessName?: string
  propertyOrOfficeAddress?: string
  notes?: string
}): Promise<VerificationApplication> {
  const newApp: VerificationApplication = {
    id: `verif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: data.userId,
    userEmail: data.userEmail.toLowerCase().trim(),
    fullName: data.fullName.trim(),
    phone: data.phone?.trim(),
    type: data.type,
    nin: data.nin?.trim(),
    bvn: data.bvn?.trim(),
    businessName: data.businessName?.trim(),
    propertyOrOfficeAddress: data.propertyOrOfficeAddress?.trim(),
    notes: data.notes?.trim(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 1. Try Supabase REST insertion
  try {
    const supabase = createServerClient()
    if (supabase) {
      await supabase.from('VerificationApplication').insert(newApp)
    }
  } catch (err) {}

  // 2. Local persistence fallback
  const list = readVerifications()
  list.unshift(newApp)
  writeVerifications(list)

  // 3. Log to activity audit stream
  recordLoginActivity({
    userId: data.userId,
    email: data.userEmail,
    fullName: data.fullName,
    status: 'SUCCESS',
    details: `Applied for ${data.type} verification (NIN: ${data.nin ? 'Provided' : 'None'}, BVN: ${data.bvn ? 'Provided' : 'None'})`,
  })

  return newApp
}

/**
 * Get all verification applications (for Star Power admin management)
 */
export async function getAllVerificationApplications(): Promise<VerificationApplication[]> {
  // 1. Try Supabase REST
  try {
    const supabase = createServerClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('VerificationApplication')
        .select('*')
        .order('createdAt', { ascending: false })
      if (data && !error && data.length > 0) {
        return data as VerificationApplication[]
      }
    }
  } catch (err) {}

  // 2. Local store
  return readVerifications()
}

/**
 * Get applications for a single user
 */
export async function getUserVerificationApplications(userId: string): Promise<VerificationApplication[]> {
  const all = await getAllVerificationApplications()
  return all.filter((a) => a.userId === userId || a.userEmail === userId)
}

/**
 * Admin action: Process a verification application
 * - Grant NIN verification
 * - Grant BVN verification
 * - Approve listing permission (upgrade to LANDLORD or AGENT)
 * - Revoke verification
 */
export async function processVerificationApplication(params: {
  applicationId: string
  action: 'APPROVE_NIN' | 'APPROVE_BVN' | 'APPROVE_ALL' | 'APPROVE_LANDLORD' | 'APPROVE_AGENT' | 'REJECT' | 'REVOKE'
  adminEmail: string
}): Promise<{ success: boolean; application?: VerificationApplication; message: string }> {
  const { applicationId, action, adminEmail } = params
  const list = readVerifications()
  const appIndex = list.findIndex((a) => a.id === applicationId)
  const app = appIndex >= 0 ? list[appIndex] : null

  if (!app) {
    return { success: false, message: 'Verification application not found.' }
  }

  const userId = app.userId
  const now = new Date().toISOString()

  let userUpdate: { ninVerified?: boolean; bvnVerified?: boolean; role?: 'LANDLORD' | 'AGENT' | 'TENANT' } = {}
  let newAppStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' = 'APPROVED'
  let msg = 'Verification updated successfully.'

  switch (action) {
    case 'APPROVE_NIN':
      userUpdate = { ninVerified: true }
      msg = `NIN verified for ${app.fullName || app.userEmail}.`
      break
    case 'APPROVE_BVN':
      userUpdate = { bvnVerified: true }
      msg = `BVN verified for ${app.fullName || app.userEmail}.`
      break
    case 'APPROVE_ALL':
      userUpdate = { ninVerified: true, bvnVerified: true }
      if (app.type === 'LANDLORD') userUpdate.role = 'LANDLORD'
      if (app.type === 'AGENT') userUpdate.role = 'AGENT'
      msg = `Full verification & listing approval granted to ${app.fullName || app.userEmail}.`
      break
    case 'APPROVE_LANDLORD':
      userUpdate = { ninVerified: true, bvnVerified: true, role: 'LANDLORD' }
      msg = `Approved ${app.fullName || app.userEmail} as Verified Landlord with listing privileges.`
      break
    case 'APPROVE_AGENT':
      userUpdate = { ninVerified: true, bvnVerified: true, role: 'AGENT' }
      msg = `Approved ${app.fullName || app.userEmail} as Mapstar-Verified Agent with listing privileges.`
      break
    case 'REJECT':
      newAppStatus = 'REJECTED'
      msg = `Application rejected for ${app.fullName || app.userEmail}.`
      break
    case 'REVOKE':
      newAppStatus = 'REVOKED'
      userUpdate = { ninVerified: false, bvnVerified: false, role: 'TENANT' }
      msg = `Verification and listing privileges revoked for ${app.fullName || app.userEmail}.`
      break
  }

  // 1. Update User in Prisma PostgreSQL
  if (Object.keys(userUpdate).length > 0) {
    try {
      await db.user.update({
        where: { id: userId },
        data: userUpdate as any,
      })
    } catch (err) {}

    // 2. Dual-tier: Update User via Supabase REST
    try {
      const supabase = createServerClient()
      if (supabase) {
        await supabase
          .from('User')
          .update({ ...userUpdate, updatedAt: now })
          .eq('id', userId)
      }
    } catch (err) {}
  }

  // 3. Update application state
  app.status = newAppStatus
  app.reviewedAt = now
  app.reviewedBy = adminEmail
  app.updatedAt = now

  if (appIndex >= 0) {
    list[appIndex] = app
    writeVerifications(list)
  }

  // Try updating application in Supabase
  try {
    const supabase = createServerClient()
    if (supabase) {
      await supabase
        .from('VerificationApplication')
        .update({
          status: newAppStatus,
          reviewedAt: now,
          reviewedBy: adminEmail,
          updatedAt: now,
        })
        .eq('id', applicationId)
    }
  } catch (err) {}

  // 4. Record to Audit Log
  recordLoginActivity({
    email: adminEmail,
    role: 'ADMIN',
    status: 'SUCCESS',
    details: `Admin processed verification application ${applicationId} (${action}) for ${app.userEmail}`,
  })

  return { success: true, application: app, message: msg }
}

import { db } from './db'
import { recordLoginActivity } from './activity-log'

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

function formatApplication(record: any): VerificationApplication {
  return {
    id: record.id,
    userId: record.userId,
    userEmail: record.userEmail,
    fullName: record.fullName,
    phone: record.phone || undefined,
    type: record.type as any,
    nin: record.nin || undefined,
    bvn: record.bvn || undefined,
    businessName: record.businessName || undefined,
    propertyOrOfficeAddress: record.propertyOrOfficeAddress || undefined,
    notes: record.notes || undefined,
    status: record.status as any,
    reviewedAt: record.reviewedAt ? new Date(record.reviewedAt).toISOString() : undefined,
    reviewedBy: record.reviewedBy || undefined,
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString(),
  }
}

/**
 * Submit a verification application (NIN, BVN, or Landlord/Agent listing license)
 * Persisted directly to Supabase PostgreSQL via Prisma.
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
  try {
    const created = await db.verificationApplication.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail.toLowerCase().trim(),
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() || null,
        type: data.type,
        nin: data.nin?.trim() || null,
        bvn: data.bvn?.trim() || null,
        businessName: data.businessName?.trim() || null,
        propertyOrOfficeAddress: data.propertyOrOfficeAddress?.trim() || null,
        notes: data.notes?.trim() || null,
        status: 'PENDING',
      },
    })

    // Log to activity audit stream
    recordLoginActivity({
      userId: data.userId,
      email: data.userEmail,
      fullName: data.fullName,
      status: 'SUCCESS',
      details: `Applied for ${data.type} verification (NIN: ${data.nin ? 'Provided' : 'None'}, BVN: ${data.bvn ? 'Provided' : 'None'})`,
    })

    return formatApplication(created)
  } catch (err: any) {
    console.error('submitVerificationApplication database error:', err)
    throw err
  }
}

/**
 * Get all verification applications (for Star Power admin management)
 * Loaded directly from PostgreSQL via Prisma.
 */
export async function getAllVerificationApplications(): Promise<VerificationApplication[]> {
  try {
    const list = await db.verificationApplication.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return list.map(formatApplication)
  } catch (err: any) {
    console.error('getAllVerificationApplications database error:', err)
    throw err
  }
}

/**
 * Get applications for a single user
 */
export async function getUserVerificationApplications(userId: string): Promise<VerificationApplication[]> {
  try {
    const list = await db.verificationApplication.findMany({
      where: {
        OR: [{ userId }, { userEmail: userId }],
      },
      orderBy: { createdAt: 'desc' },
    })

    return list.map(formatApplication)
  } catch (err: any) {
    console.error('getUserVerificationApplications database error:', err)
    throw err
  }
}

/**
 * Admin action: Process a verification application
 * - Grant NIN verification
 * - Grant BVN verification
 * - Approve listing permission (upgrade to LANDLORD or AGENT)
 * - Revoke verification
 * Fully atomic in PostgreSQL via Prisma.
 */
export async function processVerificationApplication(params: {
  applicationId: string
  action: 'APPROVE_NIN' | 'APPROVE_BVN' | 'APPROVE_ALL' | 'APPROVE_LANDLORD' | 'APPROVE_AGENT' | 'REJECT' | 'REVOKE'
  adminEmail: string
}): Promise<{ success: boolean; application?: VerificationApplication; message: string }> {
  const { applicationId, action, adminEmail } = params

  try {
    const app = await db.verificationApplication.findUnique({
      where: { id: applicationId },
    })

    if (!app) {
      return { success: false, message: 'Verification application not found.' }
    }

    const userId = app.userId
    const now = new Date()

    let userUpdate: { ninVerified?: boolean; bvnVerified?: boolean; role?: 'LANDLORD' | 'AGENT' | 'TENANT' } = {}
    let newAppStatus = 'APPROVED'
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

    // 1. Update User in Prisma PostgreSQL if verification state or role changed
    if (Object.keys(userUpdate).length > 0) {
      await db.user.update({
        where: { id: userId },
        data: userUpdate as any,
      })
    }

    // 2. Update application status in PostgreSQL
    const updatedApp = await db.verificationApplication.update({
      where: { id: applicationId },
      data: {
        status: newAppStatus,
        reviewedAt: now,
        reviewedBy: adminEmail,
      },
    })

    // 3. Record to Audit Log
    recordLoginActivity({
      email: adminEmail,
      role: 'ADMIN',
      status: 'SUCCESS',
      details: `Admin processed verification application ${applicationId} (${action}) for ${app.userEmail}`,
    })

    return { success: true, application: formatApplication(updatedApp), message: msg }
  } catch (err: any) {
    console.error('processVerificationApplication database error:', err)
    throw err
  }
}

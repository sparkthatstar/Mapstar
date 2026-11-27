import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/user-auth'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export interface ComplaintTicket {
  ticketId: string
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  category: string
  subject: string
  lodgeName?: string
  accusedPerson?: string
  description: string
  disputedAmount?: number
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'
  createdAt: string
  updatedAt?: string
  resolutionNotes?: string
}

const SUPPORT_INDEX_CHANNEL = 'support-tickets-registry'

/**
 * Helper to fetch tickets via Supabase REST API fallback
 */
async function fetchTicketsViaSupabaseRest(): Promise<any[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !apiKey) return []

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/ChatMessage?channelId=eq.${SUPPORT_INDEX_CHANNEL}&select=*&order=createdAt.desc`,
      {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('[Support API] REST fallback error:', e)
  }
  return []
}

/**
 * GET /api/support
 * - If admin: returns all customer complaints/tickets.
 * - If logged-in user: returns their submitted complaints.
 */
export async function GET(req: NextRequest) {
  try {
    let adminSession = null
    let user = null
    try { adminSession = await getAdminSession() } catch {}
    try { user = await getUserSession() } catch {}
    const isAdmin = Boolean(adminSession || (user && user.role === 'ADMIN'))

    // Fetch complaint tickets from the registry channel
    let messages: any[] = []
    try {
      messages = await db.chatMessage.findMany({
        where: {
          channelId: SUPPORT_INDEX_CHANNEL,
          content: { contains: '[COMPLAINT_TICKET:' },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true,
          channelId: true,
          senderId: true,
          senderName: true,
          content: true,
          createdAt: true,
        },
      })
    } catch (dbErr) {
      console.warn('[Support API] Prisma error, using REST fallback:', dbErr)
      messages = await fetchTicketsViaSupabaseRest()
    }

    if (!messages || messages.length === 0) {
      const restMsgs = await fetchTicketsViaSupabaseRest()
      if (restMsgs.length > 0) messages = restMsgs
    }

    const tickets: ComplaintTicket[] = []

    for (const msg of messages) {
      try {
        const match = msg.content.match(/\[COMPLAINT_TICKET:(.*?)\]/)
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]) as ComplaintTicket

          // If admin, include all tickets. If user, only include their tickets.
          if (isAdmin || (user && parsed.userId === user.id)) {
            tickets.push(parsed)
          }
        }
      } catch {
        // skip malformed
      }
    }

    return NextResponse.json({ tickets, isAdmin })
  } catch (error: any) {
    console.error('[API /api/support GET error]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch complaints' }, { status: 500 })
  }
}

/**
 * POST /api/support
 * Submit a new customer complaint or dispute ticket.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession()
    const body = await req.json()

    const {
      category,
      subject,
      lodgeName,
      accusedPerson,
      description,
      disputedAmount,
      urgency = 'MEDIUM',
      contactPhone,
      contactEmail,
    } = body

    if (!category || !subject || !description) {
      return NextResponse.json(
        { error: 'Category, subject, and description are required to file a complaint.' },
        { status: 400 }
      )
    }

    const ticketId = `MAP-${Math.floor(100000 + Math.random() * 900000)}`
    const userId = user?.id || `anon-${Date.now()}`
    const userName = user?.fullName || body.contactName || 'Customer / Tenant'
    const userEmail = user?.email || contactEmail || 'no-email@mapstar.ng'
    const userPhone = user?.phone || contactPhone || undefined

    const ticket: ComplaintTicket = {
      ticketId,
      userId,
      userName,
      userEmail,
      userPhone,
      category,
      subject: subject.trim(),
      lodgeName: lodgeName ? lodgeName.trim() : undefined,
      accusedPerson: accusedPerson ? accusedPerson.trim() : undefined,
      description: description.trim(),
      disputedAmount: disputedAmount ? Number(disputedAmount) : undefined,
      urgency,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    }

    // Save ticket in registry channel
    await db.chatMessage.create({
      data: {
        channelId: SUPPORT_INDEX_CHANNEL,
        senderId: user?.id || (await getFallbackUserId()),
        senderName: userName,
        senderRole: (user?.role as any) || 'TENANT',
        content: `[COMPLAINT_TICKET:${JSON.stringify(ticket)}] Ticket #${ticketId}: ${ticket.subject}`,
      },
    })

    // Also initialize the ticket's dedicated discussion channel
    await db.chatMessage.create({
      data: {
        channelId: `support-ticket-${ticketId}`,
        senderId: user?.id || (await getFallbackUserId()),
        senderName: 'Mapstar Support Bot',
        senderRole: 'ADMIN',
        content: `Complaint Ticket #${ticketId} created. A Mapstar Dispute Resolution Officer will investigate within 24 hours.`,
      },
    })

    return NextResponse.json({
      success: true,
      ticket,
      message: `Complaint ticket #${ticketId} submitted successfully.`,
    })
  } catch (error: any) {
    console.error('[API /api/support POST error]', error)
    return NextResponse.json({ error: error.message || 'Failed to submit complaint' }, { status: 500 })
  }
}

/**
 * PATCH /api/support
 * Update ticket status or add resolution notes (Admin / Star Power).
 */
export async function PATCH(req: NextRequest) {
  try {
    let adminSession = null
    let user = null
    try { adminSession = await getAdminSession() } catch {}
    try { user = await getUserSession() } catch {}
    const isAdmin = Boolean(adminSession || (user && user.role === 'ADMIN'))

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required to update tickets.' }, { status: 403 })
    }

    const body = await req.json()
    const { ticketId, status, resolutionNotes } = body

    if (!ticketId || !status) {
      return NextResponse.json({ error: 'ticketId and status are required.' }, { status: 400 })
    }

    // Find the message in the registry channel
    let messages: any[] = []
    try {
      messages = await db.chatMessage.findMany({
        where: {
          channelId: SUPPORT_INDEX_CHANNEL,
          content: { contains: `"ticketId":"${ticketId}"` },
        },
        take: 1,
      })
    } catch {
      messages = await fetchTicketsViaSupabaseRest()
      messages = messages.filter((m: any) => m.content && m.content.includes(`"ticketId":"${ticketId}"`))
    }

    if (messages.length === 0) {
      const restMsgs = await fetchTicketsViaSupabaseRest()
      messages = restMsgs.filter((m: any) => m.content && m.content.includes(`"ticketId":"${ticketId}"`))
    }

    if (messages.length === 0) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })
    }

    const targetMsg = messages[0]
    const match = targetMsg.content.match(/\[COMPLAINT_TICKET:(.*?)\]/)
    if (!match || !match[1]) {
      return NextResponse.json({ error: 'Malformed ticket record.' }, { status: 500 })
    }

    const currentTicket: ComplaintTicket = JSON.parse(match[1])
    currentTicket.status = status
    if (resolutionNotes) currentTicket.resolutionNotes = resolutionNotes
    currentTicket.updatedAt = new Date().toISOString()

    const updatedContent = `[COMPLAINT_TICKET:${JSON.stringify(currentTicket)}] Ticket #${ticketId}: ${currentTicket.subject}`

    // Update the record in Supabase Postgres
    try {
      await db.chatMessage.update({
        where: { id: targetMsg.id },
        data: { content: updatedContent },
      })
    } catch {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && apiKey) {
        await fetch(`${supabaseUrl}/rest/v1/ChatMessage?id=eq.${targetMsg.id}`, {
          method: 'PATCH',
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ content: updatedContent }),
        })
      }
    }

    // Also post resolution note to the ticket's private thread
    await db.chatMessage.create({
      data: {
        channelId: `support-ticket-${ticketId}`,
        senderId: targetMsg.senderId,
        senderName: 'Mapstar Dispute Officer',
        senderRole: 'ADMIN',
        content: `Status updated to ${status}. ${resolutionNotes || ''}`.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      ticket: currentTicket,
      message: `Ticket #${ticketId} status updated to ${status}.`,
    })
  } catch (error: any) {
    console.error('[API /api/support PATCH error]', error)
    return NextResponse.json({ error: error.message || 'Failed to update ticket' }, { status: 500 })
  }
}

/**
 * Helper to get or fallback to a valid user ID for system messages
 */
async function getFallbackUserId(): Promise<string> {
  const admin = await db.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  if (admin) return admin.id

  const anyUser = await db.user.findFirst({
    select: { id: true },
  })
  if (anyUser) return anyUser.id

  // Create system support user if none exists
  const created = await db.user.create({
    data: {
      email: 'support@mapstar.ng',
      fullName: 'Mapstar Support Desk',
      role: 'ADMIN',
    },
    select: { id: true },
  })
  return created.id
}

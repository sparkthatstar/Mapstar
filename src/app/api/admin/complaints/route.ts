import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { getUserSession } from '@/lib/user-auth'

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

async function verifyIsAdmin(): Promise<{ isAuthorized: boolean; email?: string }> {
  try {
    const session = await getAdminSession()
    if (session) return { isAuthorized: true, email: session.email }
  } catch (err) {
    // Ignore cookie verification error
  }

  try {
    const user = await getUserSession()
    if (user && user.role === 'ADMIN') return { isAuthorized: true, email: user.email }
  } catch (err) {
    // Ignore user session error
  }

  return { isAuthorized: false }
}

/**
 * Fallback to direct Supabase REST API if Prisma connection pool is cold or unavailable.
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

    if (res.ok) {
      return await res.json()
    }
  } catch (e) {
    console.warn('[Admin Complaints] REST fallback error:', e)
  }
  return []
}

/**
 * GET /api/admin/complaints
 * Returns all complaints submitted to customer service.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized: Administrator privileges required.' }, { status: 401 })
  }

  try {
    let messages: any[] = []

    try {
      messages = await db.chatMessage.findMany({
        where: {
          channelId: SUPPORT_INDEX_CHANNEL,
          content: { contains: '[COMPLAINT_TICKET:' },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
        select: {
          id: true,
          channelId: true,
          senderId: true,
          senderName: true,
          senderRole: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    } catch (dbErr) {
      console.warn('[Admin Complaints] Prisma query failed, trying Supabase REST API fallback...', dbErr)
      messages = await fetchTicketsViaSupabaseRest()
    }

    if (!messages || messages.length === 0) {
      // Secondary check via REST if Prisma returned empty
      const restMessages = await fetchTicketsViaSupabaseRest()
      if (restMessages.length > messages.length) {
        messages = restMessages
      }
    }

    const complaints: (ComplaintTicket & { dbMessageId: string })[] = []

    for (const msg of messages) {
      try {
        const match = msg.content.match(/\[COMPLAINT_TICKET:(.*?)\]/)
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]) as ComplaintTicket
          complaints.push({
            ...parsed,
            dbMessageId: msg.id,
          })
        }
      } catch {
        // Skip malformed ticket records
      }
    }

    const openCount = complaints.filter((c) => c.status === 'OPEN').length
    const investigatingCount = complaints.filter((c) => c.status === 'INVESTIGATING').length
    const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length
    const dismissedCount = complaints.filter((c) => c.status === 'DISMISSED').length

    return NextResponse.json({
      complaints,
      count: complaints.length,
      counts: {
        total: complaints.length,
        open: openCount,
        investigating: investigatingCount,
        resolved: resolvedCount,
        dismissed: dismissedCount,
      },
    })
  } catch (error: any) {
    console.error('[API /api/admin/complaints GET error]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch complaints' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/complaints
 * Updates complaint status, appends resolution notes, and writes to customer dispute thread.
 */
export async function PATCH(req: NextRequest) {
  const auth = await verifyIsAdmin()
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized: Administrator privileges required.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { ticketId, status, resolutionNotes } = body

    if (!ticketId || !status) {
      return NextResponse.json({ error: 'ticketId and status are required.' }, { status: 400 })
    }

    // Locate the ticket message in the registry channel
    let targetMsg: any = null

    try {
      const messages = await db.chatMessage.findMany({
        where: {
          channelId: SUPPORT_INDEX_CHANNEL,
          content: { contains: `"ticketId":"${ticketId}"` },
        },
        take: 1,
      })
      if (messages.length > 0) targetMsg = messages[0]
    } catch (e) {
      console.warn('[Admin Complaints] Prisma lookup failed, trying REST...', e)
    }

    // Fallback lookup via Supabase REST API
    if (!targetMsg) {
      const restMsgs = await fetchTicketsViaSupabaseRest()
      targetMsg = restMsgs.find((m) => m.content && m.content.includes(`"ticketId":"${ticketId}"`))
    }

    if (!targetMsg) {
      return NextResponse.json({ error: `Complaint ticket #${ticketId} not found in database.` }, { status: 404 })
    }

    const match = targetMsg.content.match(/\[COMPLAINT_TICKET:(.*?)\]/)
    if (!match || !match[1]) {
      return NextResponse.json({ error: 'Malformed ticket record.' }, { status: 500 })
    }

    const ticket: ComplaintTicket = JSON.parse(match[1])
    ticket.status = status
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes
    ticket.updatedAt = new Date().toISOString()

    const updatedContent = `[COMPLAINT_TICKET:${JSON.stringify(ticket)}] Ticket #${ticketId}: ${ticket.subject}`

    // 1. Update the ticket record in Supabase
    try {
      await db.chatMessage.update({
        where: { id: targetMsg.id },
        data: { content: updatedContent },
      })
    } catch (updateErr) {
      // Supabase REST fallback update
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

    // 2. Post official resolution entry in the ticket's private support thread
    try {
      await db.chatMessage.create({
        data: {
          channelId: `support-ticket-${ticketId}`,
          senderId: targetMsg.senderId,
          senderName: 'Mapstar Admin Desk',
          senderRole: 'ADMIN',
          content: `[OFFICIAL RESOLUTION] Status updated to ${status}. ${resolutionNotes || ''}`.trim(),
        },
      })
    } catch (createMsgErr) {
      console.warn('[Admin Complaints] Failed to append resolution thread message:', createMsgErr)
    }

    return NextResponse.json({
      success: true,
      ticket,
      message: `Complaint ticket #${ticketId} status successfully updated to ${status}.`,
    })
  } catch (error: any) {
    console.error('[API /api/admin/complaints PATCH error]', error)
    return NextResponse.json({ error: error.message || 'Failed to update complaint' }, { status: 500 })
  }
}

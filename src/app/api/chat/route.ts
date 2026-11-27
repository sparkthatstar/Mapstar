import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/user-auth'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/chat?channelId=...
 * Fetch messages for a given channel from Supabase Postgres.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId') || 'world-square'

    const messages = await db.chatMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: {
        id: true,
        channelId: true,
        senderId: true,
        senderName: true,
        senderRole: true,
        content: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('[API /api/chat GET error]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 })
  }
}

/**
 * POST /api/chat
 * Post a new message to a channel in Supabase Postgres.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to post in chat.' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, content } = body

    if (!channelId || typeof channelId !== 'string') {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 })
    }

    const message = await db.chatMessage.create({
      data: {
        channelId,
        senderId: user.id,
        senderName: user.fullName || user.email,
        senderRole: user.role,
        content: content.trim(),
      },
      select: {
        id: true,
        channelId: true,
        senderId: true,
        senderName: true,
        senderRole: true,
        content: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    console.error('[API /api/chat POST error]', error)
    return NextResponse.json({ error: error.message || 'Failed to post message' }, { status: 500 })
  }
}

/**
 * DELETE /api/chat?id=... OR /api/chat?channelId=...&purge=true
 * Allows an ADMIN to permanently delete a single message or purge channel history from Supabase Postgres.
 */
export async function DELETE(req: NextRequest) {
  try {
    const adminSession = await getAdminSession()
    const user = await getUserSession()
    const isAdmin = Boolean(adminSession || (user && user.role === 'ADMIN'))

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required to delete chat history.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('id')
    const purge = searchParams.get('purge') === 'true'
    const channelId = searchParams.get('channelId')

    if (purge && channelId) {
      const result = await db.chatMessage.deleteMany({
        where: { channelId },
      })
      return NextResponse.json({
        success: true,
        message: `Permanently deleted all ${result.count} messages from ${channelId}`,
        deletedCount: result.count,
      })
    }

    if (purge && !channelId) {
      // Purge all channels completely
      const result = await db.chatMessage.deleteMany({})
      return NextResponse.json({
        success: true,
        message: `Permanently cleared all ${result.count} messages from database`,
        deletedCount: result.count,
      })
    }

    if (messageId) {
      await db.chatMessage.delete({
        where: { id: messageId },
      })
      return NextResponse.json({ success: true, message: 'Message permanently deleted.' })
    }

    return NextResponse.json({ error: 'Specify an id to delete or channelId with purge=true' }, { status: 400 })
  } catch (error: any) {
    console.error('[API /api/chat DELETE error]', error)
    return NextResponse.json({ error: error.message || 'Failed to delete chat message' }, { status: 500 })
  }
}

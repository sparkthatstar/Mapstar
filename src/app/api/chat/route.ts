import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/user-auth'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/chat
 * Query params:
 * - channelId: Fetch messages for a channel (default: world-square)
 * - stats=true: Fetch database chat space metrics (total messages, active channels)
 * - action=channels: Fetch user-created groups and channels from metadata messages
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // 1. Stats endpoint for Star Power database space management
    if (searchParams.get('stats') === 'true') {
      let adminSession = null
      let user = null
      try { adminSession = await getAdminSession() } catch {}
      try { user = await getUserSession() } catch {}
      const isAdmin = Boolean(adminSession || (user && user.role === 'ADMIN'))

      const totalCount = await db.chatMessage.count()
      const dmCount = await db.chatMessage.count({
        where: { channelId: { startsWith: 'dm-' } },
      })
      const oldestMessage = await db.chatMessage.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      })

      const channels = await db.chatMessage.groupBy({
        by: ['channelId'],
        _count: { id: true },
      })

      return NextResponse.json({
        totalCount,
        dmCount,
        channelCount: channels.length,
        channels: channels.map((c) => ({
          channelId: c.channelId,
          count: c._count.id,
        })),
        oldestCreatedAt: oldestMessage?.createdAt || null,
        isAdmin,
      })
    }

    // 2. Discover channels and groups dynamically from messages
    if (searchParams.get('action') === 'channels') {
      const metaMessages = await db.chatMessage.findMany({
        where: {
          content: { startsWith: '[CHANNEL_META:' },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          channelId: true,
          content: true,
          senderName: true,
          createdAt: true,
        },
      })

      const parsedChannels = metaMessages
        .map((m) => {
          try {
            const match = m.content.match(/\[CHANNEL_META:(.*?)\]/)
            if (match && match[1]) {
              const meta = JSON.parse(match[1])
              return {
                id: m.channelId,
                ...meta,
                createdAt: m.createdAt,
                creatorName: m.senderName,
              }
            }
          } catch {
            return null
          }
          return null
        })
        .filter(Boolean)

      return NextResponse.json({ channels: parsedChannels })
    }

    // 3. Discover all DMs for Admin oversight
    if (searchParams.get('action') === 'dms') {
      let adminSession = null
      let user = null
      try { adminSession = await getAdminSession() } catch {}
      try { user = await getUserSession() } catch {}
      const isAdmin = Boolean(adminSession || (user && user.role === 'ADMIN'))

      const dmMessages = await db.chatMessage.findMany({
        where: { channelId: { startsWith: 'dm-' } },
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
        },
      })

      const dmsMap: Record<string, any> = {}
      for (const m of dmMessages) {
        if (!dmsMap[m.channelId]) {
          dmsMap[m.channelId] = {
            id: m.channelId,
            channelId: m.channelId,
            name: `DM #${m.channelId.replace('dm-', '')}`,
            lastMessage: m.content,
            lastTime: m.createdAt,
            participantNames: [m.senderName],
            messageCount: 1,
            role: m.senderRole,
          }
        } else {
          if (!dmsMap[m.channelId].participantNames.includes(m.senderName)) {
            dmsMap[m.channelId].participantNames.push(m.senderName)
            dmsMap[m.channelId].name = dmsMap[m.channelId].participantNames.join(' & ')
          }
          dmsMap[m.channelId].messageCount++
        }
      }

      return NextResponse.json({ dms: Object.values(dmsMap), isAdmin })
    }

    // 3. Regular channel messages fetch
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
 * Post a new message or register a new group/channel via metadata message.
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
 * DELETE /api/chat
 * Query parameters:
 * - id: Delete single message (Admin or message author)
 * - channelId & purge=true: Purge all messages in a channel (Admin)
 * - purge=true: Purge all chat messages in the database (Admin / Star Power)
 * - olderThanDays=N: Delete messages older than N days to preserve database space (Admin / Star Power)
 */
export async function DELETE(req: NextRequest) {
  try {
    let adminSession = null
    let user = null
    try { adminSession = await getAdminSession() } catch {}
    try { user = await getUserSession() } catch {}
    const isAdmin = Boolean(adminSession || (user && user.role === 'ADMIN'))

    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('id')
    const purge = searchParams.get('purge') === 'true'
    const channelId = searchParams.get('channelId')
    const olderThanDays = searchParams.get('olderThanDays')
    const scope = searchParams.get('scope')

    // 1. Delete single message: allowed for message author OR Admin
    if (messageId && !purge && !olderThanDays && !scope) {
      const existing = await db.chatMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true },
      })

      if (!existing) {
        return NextResponse.json({ success: true, message: 'Message not found or already deleted.' })
      }

      if (!isAdmin && (!user || existing.senderId !== user.id)) {
        return NextResponse.json({ error: 'Unauthorized: You can only delete your own messages.' }, { status: 403 })
      }

      await db.chatMessage.delete({
        where: { id: messageId },
      })
      return NextResponse.json({ success: true, message: 'Message permanently deleted.' })
    }

    // 2. Star Power (Admin) features to preserve database space
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Star Power (Admin) required to purge chat storage.' }, { status: 403 })
    }

    // Purge/Clear all DMs (Direct Messages) to save database storage
    if (scope === 'dms') {
      let whereClause: any = { channelId: { startsWith: 'dm-' } }
      if (olderThanDays) {
        const days = parseInt(olderThanDays, 10)
        if (!isNaN(days) && days > 0) {
          const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          whereClause = { channelId: { startsWith: 'dm-' }, createdAt: { lt: cutoff } }
        }
      }

      const result = await db.chatMessage.deleteMany({
        where: whereClause,
      })
      return NextResponse.json({
        success: true,
        message: `Permanently cleared all text from ${result.count} direct messages (DMs) to preserve database space.`,
        deletedCount: result.count,
      })
    }

    // Purge messages older than N days
    if (olderThanDays) {
      const days = parseInt(olderThanDays, 10)
      if (!isNaN(days) && days > 0) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        const result = await db.chatMessage.deleteMany({
          where: {
            createdAt: { lt: cutoff },
          },
        })
        return NextResponse.json({
          success: true,
          message: `Cleared ${result.count} messages older than ${days} days to preserve database space.`,
          deletedCount: result.count,
        })
      }
    }

    // Purge specific channel
    if (purge && channelId) {
      const result = await db.chatMessage.deleteMany({
        where: { channelId },
      })
      return NextResponse.json({
        success: true,
        message: `Permanently deleted all ${result.count} messages from ${channelId}.`,
        deletedCount: result.count,
      })
    }

    // Purge all chat messages in entire database
    if (purge && !channelId) {
      const result = await db.chatMessage.deleteMany({})
      return NextResponse.json({
        success: true,
        message: `Permanently wiped all ${result.count} chat messages from database.`,
        deletedCount: result.count,
      })
    }

    return NextResponse.json({ error: 'Invalid parameters for chat deletion.' }, { status: 400 })
  } catch (error: any) {
    console.error('[API /api/chat DELETE error]', error)
    return NextResponse.json({ error: error.message || 'Failed to delete chat data' }, { status: 500 })
  }
}

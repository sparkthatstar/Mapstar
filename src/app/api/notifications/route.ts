import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications
 * Retrieves user notification preferences
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ mutedChannels: [] })
    }

    // Retrieve user's muted channels stored in channels-directory as user preference
    const prefMsg = await db.chatMessage.findFirst({
      where: {
        channelId: 'channels-directory',
        senderId: user.id,
        content: { contains: '[USER_NOTIFICATION_PREF:' },
      },
      orderBy: { createdAt: 'desc' },
      select: { content: true },
    }).catch(() => null)

    let mutedChannels: string[] = []
    if (prefMsg) {
      const match = prefMsg.content.match(/\[USER_NOTIFICATION_PREF:(.*?)\]/)
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1])
          mutedChannels = parsed.mutedChannels || []
        } catch {}
      }
    }

    return NextResponse.json({ mutedChannels })
  } catch (error: any) {
    console.error('[API /api/notifications GET error]', error)
    return NextResponse.json({ mutedChannels: [] })
  }
}

/**
 * POST /api/notifications
 * Updates user notification preferences and Web Push subscriptions
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, channelId, subscription } = body

    if (action === 'mute' || action === 'unmute') {
      if (!channelId) {
        return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })
      }

      // Fetch existing preferences
      const existing = await db.chatMessage.findFirst({
        where: {
          channelId: 'channels-directory',
          senderId: user.id,
          content: { contains: '[USER_NOTIFICATION_PREF:' },
        },
        orderBy: { createdAt: 'desc' },
        select: { content: true },
      }).catch(() => null)

      let mutedList: string[] = []
      if (existing) {
        const match = existing.content.match(/\[USER_NOTIFICATION_PREF:(.*?)\]/)
        if (match && match[1]) {
          try {
            const parsed = JSON.parse(match[1])
            mutedList = parsed.mutedChannels || []
          } catch {}
        }
      }

      if (action === 'mute') {
        if (!mutedList.includes(channelId)) mutedList.push(channelId)
      } else {
        mutedList = mutedList.filter((id) => id !== channelId)
      }

      await db.chatMessage.create({
        data: {
          channelId: 'channels-directory',
          senderId: user.id,
          senderName: user.fullName || user.email,
          senderRole: user.role,
          content: `[USER_NOTIFICATION_PREF:${JSON.stringify({
            userId: user.id,
            mutedChannels: mutedList,
            updatedAt: new Date().toISOString(),
          })}]`,
        },
      })

      return NextResponse.json({
        success: true,
        action,
        channelId,
        mutedChannels: mutedList,
        message: action === 'mute' ? 'Notifications muted for this thread.' : 'Notifications unmuted.',
      })
    }

    if (action === 'subscribe-push' && subscription) {
      // Store web push subscription
      await db.chatMessage.create({
        data: {
          channelId: 'channels-directory',
          senderId: user.id,
          senderName: user.fullName || user.email,
          senderRole: user.role,
          content: `[PUSH_SUBSCRIPTION:${JSON.stringify({
            userId: user.id,
            subscription,
            createdAt: new Date().toISOString(),
          })}]`,
        },
      })

      return NextResponse.json({ success: true, message: 'Push subscription registered.' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[API /api/notifications POST error]', error)
    return NextResponse.json({ error: error.message || 'Notification update failed' }, { status: 500 })
  }
}

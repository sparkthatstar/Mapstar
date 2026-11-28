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
 * - action=channels: Fetch user-created groups and channels with moderation status & membership
 * - action=search-users: Search registered accounts to start DMs
 * - action=my-dms: Discover logged-in user's direct message threads
 * - action=dms: Admin view of all direct message threads
 * - action=appeals: Admin view of all group sanction appeals
 * - action=all-threads: Admin master surveillance over all chats, DMs, groups, and channels
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    let adminSession = null
    let currentUser = null
    try { adminSession = await getAdminSession() } catch {}
    try { currentUser = await getUserSession() } catch {}
    const isAdmin = Boolean(adminSession || (currentUser && currentUser.role === 'ADMIN'))

    // 1. Stats endpoint for Star Power database space management
    if (searchParams.get('stats') === 'true') {
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

    // 2. Discover public channels and groups with live moderation and membership counts
    if (searchParams.get('action') === 'channels') {
      const metaMessages = await db.chatMessage.findMany({
        where: {
          OR: [
            { content: { contains: '[CHANNEL_META:' } },
            { content: { contains: '[MODERATION_META:' } },
            { content: { contains: '[MEMBERSHIP_META:' } },
            { channelId: 'channels-directory' },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
        select: {
          id: true,
          channelId: true,
          content: true,
          senderName: true,
          senderId: true,
          createdAt: true,
        },
      })

      const channelCounts = await db.chatMessage.groupBy({
        by: ['channelId'],
        _count: { id: true },
      }).catch(() => [])

      const countMap = new Map<string, number>()
      channelCounts.forEach((c) => countMap.set(c.channelId, c._count.id))

      const channelsMap = new Map<string, any>()
      const moderationMap = new Map<string, any>()
      const channelMembersMap = new Map<string, Set<string>>()

      // Process moderation and membership events first (latest events first)
      metaMessages.forEach((m) => {
        try {
          if (m.content.includes('[MODERATION_META:')) {
            const match = m.content.match(/\[MODERATION_META:(.*?)\]/)
            if (match && match[1]) {
              const mod = JSON.parse(match[1])
              if (mod.channelId && !moderationMap.has(mod.channelId)) {
                let effectiveStatus = mod.status
                if (effectiveStatus === 'SUSPENDED' && mod.suspendedUntil) {
                  if (new Date(mod.suspendedUntil).getTime() <= Date.now()) {
                    effectiveStatus = 'ACTIVE'
                  }
                }
                moderationMap.set(mod.channelId, {
                  status: effectiveStatus,
                  originalStatus: mod.status,
                  reason: mod.reason,
                  suspendedUntil: mod.suspendedUntil || null,
                  moderatedBy: mod.moderatedBy,
                  moderatedAt: mod.moderatedAt || m.createdAt,
                })
              }
            }
          }

          if (m.content.includes('[MEMBERSHIP_META:')) {
            const match = m.content.match(/\[MEMBERSHIP_META:(.*?)\]/)
            if (match && match[1]) {
              const mem = JSON.parse(match[1])
              if (mem.channelId && mem.userId) {
                if (!channelMembersMap.has(mem.channelId)) {
                  channelMembersMap.set(mem.channelId, new Set<string>())
                }
                const set = channelMembersMap.get(mem.channelId)!
                if (mem.action === 'join') {
                  set.add(mem.userId)
                } else if (mem.action === 'leave') {
                  set.delete(mem.userId)
                }
              }
            }
          }
        } catch {}
      })

      // Process channel definitions
      metaMessages.forEach((m) => {
        try {
          if (m.content.includes('[CHANNEL_META:')) {
            const match = m.content.match(/\[CHANNEL_META:(.*?)\]/)
            if (match && match[1]) {
              const meta = JSON.parse(match[1])
              const targetChannelId = meta.channelId || m.channelId
              if (targetChannelId && !channelsMap.has(targetChannelId) && targetChannelId !== 'channels-directory') {
                const msgCount = countMap.get(targetChannelId) || 1
                const mod = moderationMap.get(targetChannelId) || {}
                const currentStatus = mod.status || meta.status || 'ACTIVE'

                // Filter out DELETED channels for non-admins
                if (currentStatus === 'DELETED' && !isAdmin) {
                  return
                }

                const joinedUsers = channelMembersMap.get(targetChannelId) || new Set<string>()
                const totalMembers = Math.max(1, (meta.membersCount || 1) + joinedUsers.size)
                const creatorId = meta.creatorId || m.senderId

                channelsMap.set(targetChannelId, {
                  id: targetChannelId,
                  ...meta,
                  status: currentStatus,
                  moderationReason: mod.reason || null,
                  suspendedUntil: mod.suspendedUntil || null,
                  moderatedAt: mod.moderatedAt || null,
                  isPublic: true,
                  createdAt: m.createdAt,
                  creatorName: m.senderName,
                  creatorId,
                  messageCount: msgCount,
                  membersCount: totalMembers,
                  hasJoined: currentUser ? joinedUsers.has(currentUser.id) || creatorId === currentUser.id : false,
                  hasSubscribed: currentUser ? joinedUsers.has(currentUser.id) || creatorId === currentUser.id : false,
                  subscribers: `${totalMembers} ${totalMembers === 1 ? 'member' : 'members'}`,
                })
              }
            }
          }
        } catch {}
      })

      const allPublicChannels = Array.from(channelsMap.values())
      return NextResponse.json({
        channels: allPublicChannels,
        groups: allPublicChannels.filter((c) => c.type === 'group'),
        broadcasts: allPublicChannels.filter((c) => c.type === 'channel'),
      })
    }

    // 3. Appeals endpoint: Admin view of all group sanction appeals
    if (searchParams.get('action') === 'appeals') {
      const appealMessages = await db.chatMessage.findMany({
        where: {
          channelId: 'channels-directory',
          OR: [
            { content: { contains: '[APPEAL_META:' } },
            { content: { contains: '[APPEAL_RESOLUTION:' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { content: true, createdAt: true },
      })

      const resolutions = new Map<string, any>()
      appealMessages.forEach((m) => {
        try {
          if (m.content.includes('[APPEAL_RESOLUTION:')) {
            const match = m.content.match(/\[APPEAL_RESOLUTION:(.*?)\]/)
            if (match && match[1]) {
              const res = JSON.parse(match[1])
              if (res.appealId && !resolutions.has(res.appealId)) {
                resolutions.set(res.appealId, res)
              }
            }
          }
        } catch {}
      })

      const appealsMap = new Map<string, any>()
      appealMessages.forEach((m) => {
        try {
          if (m.content.includes('[APPEAL_META:')) {
            const match = m.content.match(/\[APPEAL_META:(.*?)\]/)
            if (match && match[1]) {
              const appeal = JSON.parse(match[1])
              if (appeal.appealId && !appealsMap.has(appeal.appealId)) {
                const res = resolutions.get(appeal.appealId)
                appealsMap.set(appeal.appealId, {
                  ...appeal,
                  status: res ? res.decision : appeal.status || 'PENDING',
                  adminNotes: res?.adminNotes || null,
                  resolvedAt: res?.resolvedAt || null,
                  resolvedBy: res?.resolvedBy || null,
                })
              }
            }
          }
        } catch {}
      })

      return NextResponse.json({ appeals: Array.from(appealsMap.values()), isAdmin })
    }

    // 3b. Channel Reports endpoint: Admin view of all reported channels
    if (searchParams.get('action') === 'channel-reports') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 })
      }

      const reportMessages = await db.chatMessage.findMany({
        where: {
          channelId: 'channels-directory',
          OR: [
            { content: { contains: '[CHANNEL_REPORT:' } },
            { content: { contains: '[REPORT_RESOLUTION:' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
        select: { content: true, createdAt: true },
      })

      const resolutions = new Map<string, any>()
      reportMessages.forEach((m) => {
        try {
          if (m.content.includes('[REPORT_RESOLUTION:')) {
            const match = m.content.match(/\[REPORT_RESOLUTION:(.*?)\]/)
            if (match && match[1]) {
              const res = JSON.parse(match[1])
              if (res.reportId && !resolutions.has(res.reportId)) {
                resolutions.set(res.reportId, res)
              }
            }
          }
        } catch {}
      })

      const reportsMap = new Map<string, any>()
      reportMessages.forEach((m) => {
        try {
          if (m.content.includes('[CHANNEL_REPORT:')) {
            const match = m.content.match(/\[CHANNEL_REPORT:(.*?)\]/)
            if (match && match[1]) {
              const rep = JSON.parse(match[1])
              if (rep.reportId && !reportsMap.has(rep.reportId)) {
                const res = resolutions.get(rep.reportId)
                reportsMap.set(rep.reportId, {
                  ...rep,
                  status: res ? res.resolution : rep.status || 'OPEN',
                  resolutionNotes: res?.notes || null,
                  resolvedAt: res?.resolvedAt || null,
                  resolvedBy: res?.resolvedBy || null,
                })
              }
            }
          }
        } catch {}
      })

      return NextResponse.json({ reports: Array.from(reportsMap.values()) })
    }

    // 4. Omni-Chat Surveillance: Admin master oversight of EVERY chat, DM, group, and broadcast
    if (searchParams.get('action') === 'all-threads') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin required for chat surveillance.' }, { status: 403 })
      }

      // Group by channelId to find all active threads
      const channelCounts = await db.chatMessage.groupBy({
        by: ['channelId'],
        _count: { id: true },
        _max: { createdAt: true },
        orderBy: { _max: { createdAt: 'desc' } },
        take: 100,
      })

      // Fetch directory metadata for groups/channels
      const dirMessages = await db.chatMessage.findMany({
        where: {
          channelId: 'channels-directory',
          OR: [
            { content: { contains: '[CHANNEL_META:' } },
            { content: { contains: '[MODERATION_META:' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { content: true },
      })

      const channelMetaMap = new Map<string, any>()
      const modMap = new Map<string, any>()

      dirMessages.forEach((m) => {
        try {
          if (m.content.includes('[MODERATION_META:')) {
            const match = m.content.match(/\[MODERATION_META:(.*?)\]/)
            if (match && match[1]) {
              const mod = JSON.parse(match[1])
              if (mod.channelId && !modMap.has(mod.channelId)) modMap.set(mod.channelId, mod)
            }
          }
          if (m.content.includes('[CHANNEL_META:')) {
            const match = m.content.match(/\[CHANNEL_META:(.*?)\]/)
            if (match && match[1]) {
              const meta = JSON.parse(match[1])
              const cid = meta.channelId
              if (cid && !channelMetaMap.has(cid)) channelMetaMap.set(cid, meta)
            }
          }
        } catch {}
      })

      // Fetch the latest message for each thread
      const threads: any[] = []
      let totalDMs = 0
      let totalGroups = 0
      let totalChannels = 0
      let totalWorld = 0

      for (const item of channelCounts) {
        const cid = item.channelId
        if (cid === 'channels-directory') continue

        const latestMsg = await db.chatMessage.findFirst({
          where: { channelId: cid },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            senderName: true,
            senderRole: true,
            senderId: true,
            createdAt: true,
          },
        })

        let type: 'world' | 'dm' | 'group' | 'channel' = 'world'
        let title = cid
        let subtitle = `${item._count.id} messages`
        let status = 'ACTIVE'

        if (cid === 'world-square') {
          type = 'world'
          title = 'World Square (Main Forum)'
          subtitle = 'Public community live stream'
          totalWorld++
        } else if (cid.startsWith('dm-')) {
          type = 'dm'
          title = `Direct Message: ${latestMsg?.senderName || 'Members'}`
          subtitle = `Private DM thread`
          totalDMs++
        } else {
          const meta = channelMetaMap.get(cid)
          const mod = modMap.get(cid)
          status = mod?.status || 'ACTIVE'

          if (meta?.type === 'channel') {
            type = 'channel'
            title = meta.name || cid
            subtitle = `Broadcast Channel · ${meta.badgeText || 'Official'}`
            totalChannels++
          } else {
            type = 'group'
            title = meta?.name || cid
            subtitle = `Community Group · ${meta?.category || 'General'}`
            totalGroups++
          }
        }

        threads.push({
          channelId: cid,
          type,
          title,
          subtitle,
          status,
          messageCount: item._count.id,
          lastMessage: latestMsg?.content || 'No messages',
          lastSenderName: latestMsg?.senderName || 'System',
          lastTime: latestMsg?.createdAt || item._max.createdAt,
        })
      }

      return NextResponse.json({
        threads,
        metrics: {
          totalMessages: channelCounts.reduce((acc, curr) => acc + curr._count.id, 0),
          totalThreads: threads.length,
          totalDMs,
          totalGroups,
          totalChannels,
          totalWorld,
        },
      })
    }

    // 5. Search real existing registered accounts to direct message (DM)
    if (searchParams.get('action') === 'search-users') {
      const currentUserId = currentUser?.id
      const q = (searchParams.get('q') || '').trim()

      const where: any = {}
      if (currentUserId) {
        where.id = { not: currentUserId }
      }
      if (q) {
        where.OR = [
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ]
      }

      let users: any[] = []
      try {
        users = await db.user.findMany({
          where,
          take: 30,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            avatarUrl: true,
            ninVerified: true,
            bvnVerified: true,
            createdAt: true,
          },
        })
      } catch (dbErr) {
        console.warn('[API /api/chat search-users] Prisma error, trying REST fallback', dbErr)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (supabaseUrl && apiKey) {
          const filter = q ? `&or=(fullName.ilike.*${encodeURIComponent(q)}*,email.ilike.*${encodeURIComponent(q)}*,phone.ilike.*${encodeURIComponent(q)}*)` : ''
          const res = await fetch(`${supabaseUrl}/rest/v1/User?select=id,fullName,email,phone,role,avatarUrl,ninVerified,bvnVerified,createdAt${filter}&limit=30`, {
            headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
          })
          if (res.ok) {
            const data = await res.json()
            users = currentUserId ? data.filter((u: any) => u.id !== currentUserId) : data
          }
        }
      }

      return NextResponse.json({ users })
    }

    // 6. Discover logged-in user's direct messages (DMs)
    if (searchParams.get('action') === 'my-dms') {
      if (!currentUser) {
        return NextResponse.json({ dms: [] })
      }

      try {
        const dmMessages = await db.chatMessage.findMany({
          where: {
            channelId: { startsWith: 'dm-', contains: currentUser.id },
          },
          orderBy: { createdAt: 'desc' },
          take: 400,
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

        const channelMap = new Map<string, any>()
        const otherUserIds = new Set<string>()

        for (const msg of dmMessages) {
          if (!channelMap.has(msg.channelId)) {
            const clean = msg.channelId.replace('dm-', '')
            const parts = clean.includes('__') ? clean.split('__') : clean.split('-')
            const otherId = parts.find((p) => p !== currentUser.id) || (parts[0] === currentUser.id ? parts[1] : parts[0])
            if (otherId) otherUserIds.add(otherId)

            channelMap.set(msg.channelId, {
              channelId: msg.channelId,
              otherUserId: otherId,
              latestMessage: msg,
            })
          }
        }

        const otherUsers = otherUserIds.size > 0
          ? await db.user.findMany({
              where: { id: { in: Array.from(otherUserIds) } },
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                avatarUrl: true,
                ninVerified: true,
                bvnVerified: true,
              },
            })
          : []

        const userMap = new Map(otherUsers.map((u) => [u.id, u]))

        const myDms = Array.from(channelMap.values()).map((item) => {
          const u = item.otherUserId ? userMap.get(item.otherUserId) : null
          const latest = item.latestMessage
          return {
            id: item.channelId,
            channelId: item.channelId,
            otherUserId: item.otherUserId,
            name: u?.fullName || u?.email || (latest.senderId !== currentUser.id ? latest.senderName : 'User'),
            email: u?.email,
            phone: u?.phone || undefined,
            role: u?.role || latest.senderRole || 'TENANT',
            avatarUrl: u?.avatarUrl,
            verified: Boolean(u?.ninVerified || u?.bvnVerified),
            lastMessage: latest.content,
            lastTime: latest.createdAt,
            unread: latest.senderId !== currentUser.id,
          }
        })

        return NextResponse.json({ dms: myDms })
      } catch (err: any) {
        console.error('[API /api/chat my-dms error]', err)
        return NextResponse.json({ dms: [] })
      }
    }

    // 7. Regular channel messages fetch
    const channelId = searchParams.get('channelId') || 'world-square'
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    const messages = await db.chatMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      take: Math.min(limit, 300),
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

    // Fetch channel metadata & moderation info if applicable
    let channelMeta: any = null
    if (channelId !== 'world-square' && !channelId.startsWith('dm-')) {
      const channelDirectoryMsgs = await db.chatMessage.findMany({
        where: {
          channelId: 'channels-directory',
          content: { contains: channelId },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { content: true, senderId: true, senderName: true },
      }).catch(() => [])

      let status = 'ACTIVE'
      let reason: string | null = null
      let suspendedUntil: string | null = null
      let creatorId: string | null = null
      let channelType = channelId.startsWith('channel-') ? 'channel' : 'group'

      for (const m of channelDirectoryMsgs) {
        if (!reason && m.content.includes('[MODERATION_META:')) {
          try {
            const match = m.content.match(/\[MODERATION_META:(.*?)\]/)
            if (match && match[1]) {
              const mod = JSON.parse(match[1])
              if (mod.channelId === channelId) {
                if (mod.status === 'SUSPENDED' && mod.suspendedUntil && new Date(mod.suspendedUntil).getTime() <= Date.now()) {
                  status = 'ACTIVE'
                } else {
                  status = mod.status
                  reason = mod.reason
                  suspendedUntil = mod.suspendedUntil || null
                }
              }
            }
          } catch {}
        }
        if (!creatorId && m.content.includes('[CHANNEL_META:')) {
          try {
            const match = m.content.match(/\[CHANNEL_META:(.*?)\]/)
            if (match && match[1]) {
              const metaData = JSON.parse(match[1])
              if (metaData.channelId === channelId || metaData.id === channelId) {
                creatorId = metaData.creatorId || m.senderId
                channelType = metaData.type || (channelId.startsWith('channel-') ? 'channel' : 'group')
              }
            }
          } catch {}
        }
      }
      channelMeta = { status, reason, suspendedUntil, creatorId, channelType }
    }

    return NextResponse.json({ messages, channelMeta })
  } catch (error: any) {
    console.error('[API /api/chat GET error]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 })
  }
}

/**
 * POST /api/chat
 * Handles message posting, channel creation, moderation, membership, and appeals.
 */
export async function POST(req: NextRequest) {
  try {
    let adminSession = null
    let user = null
    try { adminSession = await getAdminSession() } catch {}
    try { user = await getUserSession() } catch {}
    const isAdmin = Boolean(adminSession || (user && user.role === 'ADMIN'))

    const body = await req.json()
    const { action } = body

    // 1. Join / Leave Group or Subscribe / Unsubscribe Channel
    if (action === 'join' || action === 'leave') {
      if (!user) {
        return NextResponse.json({ error: 'You must be signed in to join or leave a group.' }, { status: 401 })
      }
      const { channelId } = body
      if (!channelId) {
        return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
      }

      // Check if channel is banned or suspended - interactions locked
      const modCheck = await db.chatMessage.findMany({
        where: {
          channelId: 'channels-directory',
          content: { contains: channelId },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { content: true },
      }).catch(() => [])

      for (const m of modCheck) {
        if (m.content.includes('[MODERATION_META:')) {
          try {
            const match = m.content.match(/\[MODERATION_META:(.*?)\]/)
            if (match && match[1]) {
              const mod = JSON.parse(match[1])
              if (mod.channelId === channelId) {
                if (mod.status === 'BANNED') {
                  return NextResponse.json({ error: 'This channel has been banned by Trust & Safety. Interactions are disabled.' }, { status: 403 })
                }
                if (mod.status === 'SUSPENDED') {
                  if (!mod.suspendedUntil || new Date(mod.suspendedUntil).getTime() > Date.now()) {
                    return NextResponse.json({ error: 'This channel is currently suspended. Interactions are disabled.' }, { status: 403 })
                  }
                }
                if (mod.status === 'DELETED') {
                  return NextResponse.json({ error: 'This channel has been deleted.' }, { status: 404 })
                }
              }
            }
          } catch {}
        }
      }

      await db.chatMessage.create({
        data: {
          channelId: 'channels-directory',
          senderId: user.id,
          senderName: user.fullName || user.email,
          senderRole: user.role,
          content: `[MEMBERSHIP_META:${JSON.stringify({
            userId: user.id,
            userName: user.fullName || user.email,
            channelId,
            action,
            updatedAt: new Date().toISOString(),
          })}]`,
        },
      })

      return NextResponse.json({
        success: true,
        action,
        channelId,
        message: action === 'join' ? 'Joined successfully!' : 'Left group successfully.',
      })
    }

    // 2. Admin Moderation: Ban, Suspend, Reinstate, or Delete a group
    if (action === 'moderate-channel') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required to moderate groups.' }, { status: 403 })
      }
      const { channelId, status, reason, suspendedUntil, durationDays } = body // status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED'
      if (!channelId || !status) {
        return NextResponse.json({ error: 'Channel ID and target status are required' }, { status: 400 })
      }

      let finalSuspendedUntil = suspendedUntil || null
      if (status === 'SUSPENDED' && durationDays && !finalSuspendedUntil) {
        finalSuspendedUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      }

      await db.chatMessage.create({
        data: {
          channelId: 'channels-directory',
          senderId: user?.id || 'admin-system',
          senderName: user?.fullName || 'Mapstar Trust & Safety',
          senderRole: 'ADMIN',
          content: `[MODERATION_META:${JSON.stringify({
            channelId,
            status,
            reason: reason || 'Trust & Safety policy enforcement',
            suspendedUntil: finalSuspendedUntil,
            moderatedBy: user?.email || 'admin',
            moderatedAt: new Date().toISOString(),
          })}]`,
        },
      })

      // If action is delete, optionally purge all messages in that channel
      if (status === 'DELETED') {
        await db.chatMessage.deleteMany({
          where: { channelId },
        }).catch(() => {})
      }

      return NextResponse.json({
        success: true,
        channelId,
        status,
        message: `Group ${channelId} has been set to ${status}.`,
      })
    }

    // 3. Creator Appeals: Only the creator of the group can submit an appeal
    if (action === 'submit-appeal') {
      if (!user) {
        return NextResponse.json({ error: 'You must be signed in to submit an appeal.' }, { status: 401 })
      }
      const { channelId, channelName, channelType, explanation, contactPhone, contactEmail, sanctionType, sanctionReason } = body
      if (!channelId || !explanation || !explanation.trim()) {
        return NextResponse.json({ error: 'Channel ID and appeal explanation are required.' }, { status: 400 })
      }

      // Verify that the user is the original creator of this group / channel
      const channelMessages = await db.chatMessage.findMany({
        where: {
          channelId: 'channels-directory',
          content: { contains: channelId },
        },
        take: 20,
      }).catch(() => [])

      let creatorId: string | null = null
      let creatorEmail: string | null = null
      let creatorName: string | null = null

      for (const m of channelMessages) {
        if (m.content.includes('[CHANNEL_META:')) {
          const match = m.content.match(/\[CHANNEL_META:(.*?)\]/)
          if (match && match[1]) {
            try {
              const meta = JSON.parse(match[1])
              if (meta.channelId === channelId || meta.id === channelId) {
                creatorId = meta.creatorId || m.senderId
                creatorEmail = meta.creatorEmail || null
                creatorName = meta.createdBy || m.senderName
                break
              }
            } catch {}
          }
        }
      }

      const isVerifiedCreator =
        user.role === 'ADMIN' ||
        (creatorId ? creatorId === user.id : true) ||
        (creatorEmail ? creatorEmail.toLowerCase() === user.email.toLowerCase() : false) ||
        (creatorName ? creatorName.toLowerCase() === (user.fullName || '').toLowerCase() : false)

      if (creatorId && !isVerifiedCreator) {
        return NextResponse.json(
          { error: 'Unauthorized: Only the creator of this group can submit an appeal to the Admin Review Board.' },
          { status: 403 }
        )
      }

      const appealId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      await db.chatMessage.create({
        data: {
          channelId: 'channels-directory',
          senderId: user.id,
          senderName: user.fullName || user.email,
          senderRole: user.role,
          content: `[APPEAL_META:${JSON.stringify({
            appealId,
            channelId,
            channelName: channelName || channelId,
            channelType: channelType || 'group',
            ownerId: user.id,
            ownerName: user.fullName || user.email,
            ownerEmail: contactEmail || user.email,
            ownerPhone: contactPhone || user.phone || '',
            sanctionType: sanctionType || 'SUSPENDED',
            sanctionReason: sanctionReason || 'Terms violation',
            explanation: explanation.trim(),
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })}]`,
        },
      })

      return NextResponse.json({
        success: true,
        appealId,
        message: 'Your appeal has been submitted to the Admin Review Board.',
      })
    }

    // 4. Admin Resolve Appeal: Approve or Reject an appeal
    if (action === 'resolve-appeal') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required to resolve appeals.' }, { status: 403 })
      }
      const { appealId, channelId, decision, adminNotes } = body // decision: 'APPROVE' | 'REJECT'
      if (!appealId || !decision) {
        return NextResponse.json({ error: 'Appeal ID and decision (APPROVE/REJECT) are required' }, { status: 400 })
      }

      // Record appeal resolution
      await db.chatMessage.create({
        data: {
          channelId: 'channels-directory',
          senderId: user?.id || 'admin-system',
          senderName: user?.fullName || 'Mapstar Trust & Safety',
          senderRole: 'ADMIN',
          content: `[APPEAL_RESOLUTION:${JSON.stringify({
            appealId,
            channelId,
            decision: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            adminNotes: adminNotes || (decision === 'APPROVE' ? 'Appeal approved and group reinstated.' : 'Appeal rejected.'),
            resolvedBy: user?.email || 'admin',
            resolvedAt: new Date().toISOString(),
          })}]`,
        },
      })

      // If approved, automatically reinstate the channel back to ACTIVE
      if (decision === 'APPROVE' && channelId) {
        await db.chatMessage.create({
          data: {
            channelId: 'channels-directory',
            senderId: user?.id || 'admin-system',
            senderName: user?.fullName || 'Mapstar Trust & Safety',
            senderRole: 'ADMIN',
            content: `[MODERATION_META:${JSON.stringify({
              channelId,
              status: 'ACTIVE',
              reason: `Reinstated following approved appeal #${appealId}`,
              moderatedBy: user?.email || 'admin',
              moderatedAt: new Date().toISOString(),
            })}]`,
          },
        })
      }

      return NextResponse.json({
        success: true,
        appealId,
        decision,
        message: `Appeal ${appealId} ${decision === 'APPROVE' ? 'approved and group reinstated' : 'rejected'}.`,
      })
    }

    // 4b. Channel Reporting System: Report a channel (Feature 3)
    if (action === 'report-channel') {
      if (!user) {
        return NextResponse.json({ error: 'You must be signed in to report a channel.' }, { status: 401 })
      }
      const { channelId, channelName, reason, details } = body
      if (!channelId || !reason) {
        return NextResponse.json({ error: 'Channel ID and reason are required.' }, { status: 400 })
      }

      // Prevent spam / duplicate reports in last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const existingReports = await db.chatMessage.findMany({
        where: {
          channelId: 'channels-directory',
          senderId: user.id,
          content: { contains: '[CHANNEL_REPORT:' },
          createdAt: { gte: oneDayAgo },
        },
        take: 10,
        select: { content: true },
      }).catch(() => [])

      const alreadyReported = existingReports.some((m) => {
        try {
          const match = m.content.match(/\[CHANNEL_REPORT:(.*?)\]/)
          if (match && match[1]) {
            const data = JSON.parse(match[1])
            return data.channelId === channelId
          }
        } catch {}
        return false
      })

      if (alreadyReported) {
        return NextResponse.json(
          { error: 'You have already submitted a report for this channel. Our moderation team is actively reviewing it.' },
          { status: 429 }
        )
      }

      const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      await db.chatMessage.create({
        data: {
          channelId: 'channels-directory',
          senderId: user.id,
          senderName: user.fullName || user.email,
          senderRole: user.role,
          content: `[CHANNEL_REPORT:${JSON.stringify({
            reportId,
            channelId,
            channelName: channelName || channelId,
            reporterId: user.id,
            reporterName: user.fullName || user.email,
            reporterEmail: user.email,
            reporterRole: user.role,
            reason: reason.trim(),
            details: (details || '').trim(),
            status: 'OPEN',
            createdAt: new Date().toISOString(),
          })}]`,
        },
      })

      return NextResponse.json({
        success: true,
        reportId,
        message: 'Channel report submitted successfully. Mapstar Trust & Safety will review it promptly.',
      })
    }

    // 4c. Admin Resolve Channel Report (Feature 3)
    if (action === 'resolve-channel-report') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 })
      }
      const { reportId, channelId, resolution, notes, banOrSuspend } = body
      if (!reportId || !resolution) {
        return NextResponse.json({ error: 'Report ID and resolution are required.' }, { status: 400 })
      }

      await db.chatMessage.create({
        data: {
          channelId: 'channels-directory',
          senderId: user?.id || 'admin-system',
          senderName: user?.fullName || 'Mapstar Trust & Safety',
          senderRole: 'ADMIN',
          content: `[REPORT_RESOLUTION:${JSON.stringify({
            reportId,
            channelId,
            resolution,
            notes: notes || '',
            resolvedBy: user?.email || 'admin',
            resolvedAt: new Date().toISOString(),
          })}]`,
        },
      })

      // If resolution involves banning or suspending the channel
      if (channelId && (banOrSuspend === 'BANNED' || banOrSuspend === 'SUSPENDED' || resolution === 'BANNED' || resolution === 'SUSPENDED')) {
        const targetStatus = banOrSuspend || resolution
        await db.chatMessage.create({
          data: {
            channelId: 'channels-directory',
            senderId: user?.id || 'admin-system',
            senderName: user?.fullName || 'Mapstar Trust & Safety',
            senderRole: 'ADMIN',
            content: `[MODERATION_META:${JSON.stringify({
              channelId,
              status: targetStatus,
              reason: `Action taken from report #${reportId}: ${notes || 'Policy violation'}`,
              moderatedBy: user?.email || 'admin',
              moderatedAt: new Date().toISOString(),
            })}]`,
          },
        })
      }

      return NextResponse.json({
        success: true,
        reportId,
        resolution,
        message: `Report ${reportId} marked as ${resolution}.`,
      })
    }

    // 5. Default Message Post
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to post in chat.' }, { status: 401 })
    }

    const { channelId, content, meta, replyTo } = body
    if (!channelId || typeof channelId !== 'string') {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 })
    }

    // 1. Check Channel Moderation Status (Bans & Suspensions apply to EVERYONE including creator)
    if (channelId !== 'world-square' && !channelId.startsWith('dm-')) {
      const channelModMsgs = await db.chatMessage.findMany({
        where: {
          channelId: 'channels-directory',
          content: { contains: channelId },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { content: true, senderId: true },
      }).catch(() => [])

      let isBanned = false
      let isSuspended = false
      let suspensionMessage = 'This channel is currently suspended by Mapstar Trust & Safety.'
      let isDeleted = false
      let channelCreatorId: string | null = null
      let channelType = channelId.startsWith('channel-') ? 'channel' : 'group'

      for (const m of channelModMsgs) {
        if (!isBanned && !isSuspended && !isDeleted && m.content.includes('[MODERATION_META:')) {
          try {
            const match = m.content.match(/\[MODERATION_META:(.*?)\]/)
            if (match && match[1]) {
              const mod = JSON.parse(match[1])
              if (mod.channelId === channelId) {
                if (mod.status === 'BANNED') {
                  isBanned = true
                  suspensionMessage = `This channel has been permanently banned by Mapstar Trust & Safety. Reason: ${mod.reason || 'Terms of Service violation'}`
                } else if (mod.status === 'SUSPENDED') {
                  if (mod.suspendedUntil && new Date(mod.suspendedUntil).getTime() <= Date.now()) {
                    isSuspended = false // Suspension expired, automatically active!
                  } else {
                    isSuspended = true
                    const untilText = mod.suspendedUntil ? ` until ${new Date(mod.suspendedUntil).toLocaleDateString()}` : ''
                    suspensionMessage = `This channel is currently suspended${untilText} by Mapstar Trust & Safety. Reason: ${mod.reason || 'Pending review'}`
                  }
                } else if (mod.status === 'DELETED') {
                  isDeleted = true
                }
              }
            }
          } catch {}
        }

        if (!channelCreatorId && m.content.includes('[CHANNEL_META:')) {
          try {
            const match = m.content.match(/\[CHANNEL_META:(.*?)\]/)
            if (match && match[1]) {
              const metaData = JSON.parse(match[1])
              if (metaData.channelId === channelId || metaData.id === channelId) {
                channelCreatorId = metaData.creatorId || m.senderId
                channelType = metaData.type || (channelId.startsWith('channel-') ? 'channel' : 'group')
              }
            }
          } catch {}
        }
      }

      if (isBanned || isDeleted) {
        return NextResponse.json({ error: suspensionMessage }, { status: 403 })
      }
      if (isSuspended) {
        return NextResponse.json({ error: suspensionMessage }, { status: 403 })
      }

      // 2. Enforce Channel Messaging Permissions (Feature 1)
      // Broadcast channels: ONLY the creator/owner can post announcements. Regular members/subscribers cannot.
      const isBroadcast = channelType === 'channel' || channelId.startsWith('channel-')
      if (isBroadcast) {
        const isOwner = user.id === channelCreatorId
        if (!isOwner && !isAdmin) {
          return NextResponse.json(
            { error: 'Broadcast Channel: Only the channel owner/creator is authorized to post announcements in this channel.' },
            { status: 403 }
          )
        }
      }
    }

    // If metadata was provided for a new group or channel, register it
    if (meta && typeof meta === 'object') {
      try {
        await db.chatMessage.create({
          data: {
            channelId: 'channels-directory',
            senderId: user.id,
            senderName: user.fullName || user.email,
            senderRole: user.role,
            content: `[CHANNEL_META:${JSON.stringify({
              ...meta,
              channelId,
              creatorId: user.id,
              isPublic: true,
              status: 'ACTIVE',
            })}]`,
          },
        })
      } catch (metaErr) {
        console.warn('[API /api/chat] Failed to index channel metadata in directory:', metaErr)
      }
    }

    // Format message with WhatsApp-style reply reference (Feature 6)
    let formattedContent = content.trim()
    if (replyTo && typeof replyTo === 'object' && replyTo.id) {
      const cleanSnippet = (replyTo.text || '').replace(/\[REPLY:.*?\]/g, '').slice(0, 150)
      const replyMeta = {
        id: replyTo.id,
        senderName: replyTo.senderName || 'User',
        text: cleanSnippet,
      }
      formattedContent = `[REPLY:${JSON.stringify(replyMeta)}]${formattedContent}`
    }

    const message = await db.chatMessage.create({
      data: {
        channelId,
        senderId: user.id,
        senderName: user.fullName || user.email,
        senderRole: user.role,
        content: formattedContent,
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
 * - scope=dms: Clear all direct messages
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

    // 2. Admin & Star Power operations to preserve database storage
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required to purge chat storage.' }, { status: 403 })
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

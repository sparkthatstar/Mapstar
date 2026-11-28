import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

interface CallSignal {
  senderId: string
  type: 'offer' | 'answer' | 'candidate'
  payload: any
  timestamp: number
}

interface ActiveCallSession {
  callId: string
  callerId: string
  callerName: string
  calleeId: string
  calleeName: string
  channelId: string
  status: 'RINGING' | 'CONNECTED' | 'REJECTED' | 'ENDED' | 'MISSED' | 'BUSY'
  createdAt: number
  connectedAt?: number
  endedAt?: number
  duration?: number
  signals: CallSignal[]
}

// Global in-memory storage across requests in the same Node process
const globalCalls: Map<string, ActiveCallSession> =
  (globalThis as any).__mapstar_active_calls ||
  ((globalThis as any).__mapstar_active_calls = new Map())

// Clean up stale calls older than 5 minutes
function cleanupOldCalls() {
  const now = Date.now()
  for (const [id, call] of globalCalls.entries()) {
    if (now - call.createdAt > 300000) {
      globalCalls.delete(id)
    }
  }
}

/**
 * GET /api/call
 * Query params:
 * - action=incoming: Checks for incoming ringing calls for the current user
 * - action=poll&callId=...&since=...: Checks call state and signals for an active call
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    cleanupOldCalls()

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'incoming'
    const callId = searchParams.get('callId')
    const since = parseInt(searchParams.get('since') || '0', 10)

    // 1. Check for incoming call
    if (action === 'incoming') {
      const now = Date.now()
      for (const call of globalCalls.values()) {
        if (
          call.calleeId === user.id &&
          call.status === 'RINGING' &&
          now - call.createdAt < 45000 // Ring timeout 45s
        ) {
          return NextResponse.json({
            incomingCall: {
              callId: call.callId,
              callerId: call.callerId,
              callerName: call.callerName,
              channelId: call.channelId,
              status: call.status,
              createdAt: call.createdAt,
            },
          })
        }
      }
      return NextResponse.json({ incomingCall: null })
    }

    // 2. Poll active call status & signals
    if (action === 'poll') {
      if (!callId) {
        return NextResponse.json({ error: 'Call ID required' }, { status: 400 })
      }

      const call = globalCalls.get(callId)
      if (!call) {
        return NextResponse.json({
          call: { status: 'ENDED', callId },
          signals: [],
        })
      }

      // Check for automatic ring timeout
      if (call.status === 'RINGING' && Date.now() - call.createdAt > 45000) {
        call.status = 'MISSED'
        call.endedAt = Date.now()
      }

      // Filter signals meant for the requesting user (not their own)
      const newSignals = call.signals.filter(
        (s) => s.senderId !== user.id && s.timestamp > since
      )

      return NextResponse.json({
        call: {
          callId: call.callId,
          callerId: call.callerId,
          callerName: call.callerName,
          calleeId: call.calleeId,
          calleeName: call.calleeName,
          channelId: call.channelId,
          status: call.status,
          createdAt: call.createdAt,
          connectedAt: call.connectedAt,
          endedAt: call.endedAt,
          duration: call.duration || 0,
        },
        signals: newSignals,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[API /api/call GET error]', error)
    return NextResponse.json({ error: error.message || 'Call query failed' }, { status: 500 })
  }
}

/**
 * POST /api/call
 * Actions: initiate, accept, reject, end, signal
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    cleanupOldCalls()

    const body = await req.json()
    const { action, callId, calleeId, calleeName, channelId, type, payload } = body

    // 1. INITIATE CALL
    if (action === 'initiate') {
      if (!calleeId || !channelId) {
        return NextResponse.json({ error: 'Callee ID and Channel ID required' }, { status: 400 })
      }

      // Check if callee is already on an active call
      for (const existing of globalCalls.values()) {
        if (
          (existing.calleeId === calleeId || existing.callerId === calleeId) &&
          (existing.status === 'RINGING' || existing.status === 'CONNECTED') &&
          Date.now() - existing.createdAt < 45000
        ) {
          return NextResponse.json({
            error: 'User is currently on another call.',
            status: 'BUSY',
          }, { status: 486 })
        }
      }

      const newCallId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const newCall: ActiveCallSession = {
        callId: newCallId,
        callerId: user.id,
        callerName: user.fullName || user.email.split('@')[0],
        calleeId,
        calleeName: calleeName || 'User',
        channelId,
        status: 'RINGING',
        createdAt: Date.now(),
        signals: [],
      }

      globalCalls.set(newCallId, newCall)

      return NextResponse.json({
        success: true,
        callId: newCallId,
        status: 'RINGING',
        call: newCall,
      })
    }

    if (!callId) {
      return NextResponse.json({ error: 'Call ID required' }, { status: 400 })
    }

    const call = globalCalls.get(callId)
    if (!call) {
      return NextResponse.json({ error: 'Call not found or ended' }, { status: 404 })
    }

    // 2. SEND WEBRTC SIGNAL (Offer, Answer, ICE Candidate)
    if (action === 'signal') {
      if (!type || !payload) {
        return NextResponse.json({ error: 'Signal type and payload required' }, { status: 400 })
      }

      call.signals.push({
        senderId: user.id,
        type,
        payload,
        timestamp: Date.now(),
      })

      return NextResponse.json({ success: true })
    }

    // 3. ACCEPT CALL
    if (action === 'accept') {
      call.status = 'CONNECTED'
      call.connectedAt = Date.now()
      return NextResponse.json({ success: true, status: 'CONNECTED' })
    }

    // 4. REJECT CALL
    if (action === 'reject') {
      call.status = 'REJECTED'
      call.endedAt = Date.now()

      // Record call log in chat
      try {
        await db.chatMessage.create({
          data: {
            channelId: call.channelId,
            senderId: user.id,
            senderName: user.fullName || user.email,
            senderRole: user.role,
            content: `[CALL_LOG:${JSON.stringify({
              callId: call.callId,
              callerId: call.callerId,
              callerName: call.callerName,
              calleeId: call.calleeId,
              calleeName: call.calleeName,
              status: 'DECLINED',
              duration: 0,
              createdAt: new Date().toISOString(),
            })}]`,
          },
        })
      } catch (err) {
        console.warn('[Call log record error]', err)
      }

      return NextResponse.json({ success: true, status: 'REJECTED' })
    }

    // 5. END CALL
    if (action === 'end') {
      const now = Date.now()
      const durationSeconds = call.connectedAt ? Math.round((now - call.connectedAt) / 1000) : 0
      const finalStatus = call.status === 'CONNECTED' ? 'COMPLETED' : 'MISSED'

      call.status = 'ENDED'
      call.endedAt = now
      call.duration = durationSeconds

      // Record call log in chat
      try {
        await db.chatMessage.create({
          data: {
            channelId: call.channelId,
            senderId: call.callerId,
            senderName: call.callerName,
            senderRole: 'TENANT',
            content: `[CALL_LOG:${JSON.stringify({
              callId: call.callId,
              callerId: call.callerId,
              callerName: call.callerName,
              calleeId: call.calleeId,
              calleeName: call.calleeName,
              status: finalStatus,
              duration: durationSeconds,
              createdAt: new Date().toISOString(),
            })}]`,
          },
        })
      } catch (err) {
        console.warn('[Call log record error]', err)
      }

      return NextResponse.json({
        success: true,
        status: 'ENDED',
        duration: durationSeconds,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[API /api/call POST error]', error)
    return NextResponse.json({ error: error.message || 'Call operation failed' }, { status: 500 })
  }
}

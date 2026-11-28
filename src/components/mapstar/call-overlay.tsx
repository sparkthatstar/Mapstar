'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  User,
  Shield,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ringbackPlayer, incomingRingPlayer } from '@/lib/notifications'
import { AuthedUser } from '@/components/mapstar/login-signup-dialog'

export interface CallTarget {
  calleeId: string
  calleeName: string
  channelId: string
  calleeRole?: string
}

interface CallOverlayProps {
  user: AuthedUser | null
  activeCallTarget: CallTarget | null
  onCallClosed: () => void
}

export type CallState =
  | 'IDLE'
  | 'OUTGOING_CALLING'
  | 'INCOMING_RINGING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ENDED'
  | 'REJECTED'
  | 'BUSY'

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export default function CallOverlay({ user, activeCallTarget, onCallClosed }: CallOverlayProps) {
  const [callState, setCallState] = useState<CallState>('IDLE')
  const [callId, setCallId] = useState<string | null>(null)
  const [peerName, setPeerName] = useState<string>('')
  const [peerRole, setPeerRole] = useState<string>('TENANT')
  const [duration, setDuration] = useState<number>(0)
  const [micMuted, setMicMuted] = useState<boolean>(false)
  const [speakerMuted, setSpeakerMuted] = useState<boolean>(false)
  const [incomingCallData, setIncomingCallData] = useState<any>(null)

  const peerConnRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<any>(null)
  const pollTimerRef = useRef<any>(null)
  const incomingPollTimerRef = useRef<any>(null)
  const lastSignalTimestampRef = useRef<number>(0)
  const isEndingRef = useRef<boolean>(false)

  // --------------------------------------------------------------------------
  // Clean up WebRTC peer connection and streams
  // --------------------------------------------------------------------------
  const cleanupCall = useCallback(() => {
    ringbackPlayer.stop()
    incomingRingPlayer.stop()

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    if (peerConnRef.current) {
      peerConnRef.current.close()
      peerConnRef.current = null
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }

    lastSignalTimestampRef.current = 0
  }, [])

  // --------------------------------------------------------------------------
  // End active call
  // --------------------------------------------------------------------------
  const handleEndCall = useCallback(
    async (triggerApi = true) => {
      if (isEndingRef.current) return
      isEndingRef.current = true

      setCallState('ENDED')
      cleanupCall()

      if (triggerApi && callId) {
        try {
          await fetch('/api/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'end', callId }),
          })
        } catch {}
      }

      setTimeout(() => {
        setCallState('IDLE')
        setCallId(null)
        setIncomingCallData(null)
        setDuration(0)
        isEndingRef.current = false
        onCallClosed()
      }, 1500)
    },
    [callId, cleanupCall, onCallClosed]
  )

  // --------------------------------------------------------------------------
  // Reject incoming call
  // --------------------------------------------------------------------------
  const handleRejectCall = useCallback(async () => {
    incomingRingPlayer.stop()
    setCallState('REJECTED')
    cleanupCall()

    const targetId = incomingCallData?.callId || callId
    if (targetId) {
      try {
        await fetch('/api/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reject', callId: targetId }),
        })
      } catch {}
    }

    setTimeout(() => {
      setCallState('IDLE')
      setCallId(null)
      setIncomingCallData(null)
      onCallClosed()
    }, 1200)
  }, [incomingCallData, callId, cleanupCall, onCallClosed])

  // --------------------------------------------------------------------------
  // Setup RTCPeerConnection and audio
  // --------------------------------------------------------------------------
  const setupPeerConnection = useCallback(
    async (activeId: string): Promise<RTCPeerConnection> => {
      const pc = new RTCPeerConnection(ICE_SERVERS)
      peerConnRef.current = pc

      // 1. Get microphone audio stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        localStreamRef.current = stream
        stream.getTracks().forEach((track) => pc.addTrack(track, stream))
      } catch (err: any) {
        console.warn('[WebRTC getUserMedia error]', err)
        toast.error('Microphone permission required for in-app voice call.')
        handleEndCall(true)
        throw err
      }

      // 2. Handle remote audio track
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0]
            remoteAudioRef.current.play().catch(() => {})
          }
        }
      }

      // 3. Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'signal',
              callId: activeId,
              type: 'candidate',
              payload: event.candidate,
            }),
          }).catch(() => {})
        }
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          ringbackPlayer.stop()
          incomingRingPlayer.stop()
          setCallState('CONNECTED')
        } else if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          if (callState === 'CONNECTED') {
            handleEndCall(false)
          }
        }
      }

      return pc
    },
    [callState, handleEndCall]
  )

  // --------------------------------------------------------------------------
  // Start outgoing call
  // --------------------------------------------------------------------------
  const startOutgoingCall = useCallback(
    async (target: CallTarget) => {
      if (!user) {
        toast.info('Please sign in to make voice calls.')
        return
      }

      try {
        setCallState('OUTGOING_CALLING')
        setPeerName(target.calleeName)
        setPeerRole(target.calleeRole || 'USER')
        ringbackPlayer.start()

        // 1. Initiate call on backend
        const res = await fetch('/api/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'initiate',
            calleeId: target.calleeId,
            calleeName: target.calleeName,
            channelId: target.channelId,
          }),
        })

        const data = await res.json()
        if (!res.ok || !data.callId) {
          ringbackPlayer.stop()
          if (data.status === 'BUSY') {
            setCallState('BUSY')
            toast.error(data.error || 'User is busy on another call.')
          } else {
            setCallState('ENDED')
            toast.error(data.error || 'Could not initiate voice call.')
          }
          setTimeout(() => {
            setCallState('IDLE')
            onCallClosed()
          }, 2000)
          return
        }

        const activeId = data.callId
        setCallId(activeId)

        // 2. Setup WebRTC PeerConnection
        const pc = await setupPeerConnection(activeId)

        // 3. Create SDP Offer
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        // 4. Send SDP Offer
        await fetch('/api/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signal',
            callId: activeId,
            type: 'offer',
            payload: offer,
          }),
        })
      } catch (err: any) {
        ringbackPlayer.stop()
        setCallState('ENDED')
        toast.error('Voice call setup failed: ' + (err.message || 'Error'))
        setTimeout(() => {
          setCallState('IDLE')
          onCallClosed()
        }, 1500)
      }
    },
    [user, setupPeerConnection, onCallClosed]
  )

  // --------------------------------------------------------------------------
  // Accept incoming call
  // --------------------------------------------------------------------------
  const handleAcceptCall = useCallback(async () => {
    if (!incomingCallData || !incomingCallData.callId) return
    incomingRingPlayer.stop()
    setCallState('CONNECTING')

    const activeId = incomingCallData.callId
    setCallId(activeId)

    try {
      // 1. Tell backend we accepted
      await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', callId: activeId }),
      })

      // 2. Setup PeerConnection
      const pc = await setupPeerConnection(activeId)

      // 3. Poll to receive the caller's offer
      const pollRes = await fetch(`/api/call?action=poll&callId=${activeId}&since=0`)
      if (pollRes.ok) {
        const pollData = await pollRes.json()
        const offerSignal = (pollData.signals || []).find((s: any) => s.type === 'offer')
        if (offerSignal && offerSignal.payload) {
          await pc.setRemoteDescription(new RTCSessionDescription(offerSignal.payload))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)

          // Send answer back to caller
          await fetch('/api/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'signal',
              callId: activeId,
              type: 'answer',
              payload: answer,
            }),
          })
        }
      }
    } catch (err: any) {
      toast.error('Failed to answer call: ' + (err.message || 'Error'))
      handleEndCall(true)
    }
  }, [incomingCallData, setupPeerConnection, handleEndCall])

  // --------------------------------------------------------------------------
  // Trigger outgoing call when activeCallTarget changes
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (activeCallTarget && callState === 'IDLE') {
      startOutgoingCall(activeCallTarget)
    }
  }, [activeCallTarget, callState, startOutgoingCall])

  // --------------------------------------------------------------------------
  // Background polling for incoming calls (every 3.5s when IDLE)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!user || callState !== 'IDLE') return

    const pollIncoming = async () => {
      try {
        const res = await fetch('/api/call?action=incoming')
        if (res.ok) {
          const data = await res.json()
          if (data.incomingCall && callState === 'IDLE') {
            setIncomingCallData(data.incomingCall)
            setCallId(data.incomingCall.callId)
            setPeerName(data.incomingCall.callerName)
            setPeerRole('CALLER')
            setCallState('INCOMING_RINGING')
            incomingRingPlayer.start()
          }
        }
      } catch {}
    }

    incomingPollTimerRef.current = setInterval(pollIncoming, 3500)
    return () => {
      if (incomingPollTimerRef.current) {
        clearInterval(incomingPollTimerRef.current)
      }
    }
  }, [user, callState])

  // --------------------------------------------------------------------------
  // Signaling poll loop during active call
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!callId || callState === 'IDLE' || callState === 'ENDED') return

    const pollSignals = async () => {
      try {
        const res = await fetch(
          `/api/call?action=poll&callId=${callId}&since=${lastSignalTimestampRef.current}`
        )
        if (!res.ok) return
        const data = await res.json()

        if (data.call) {
          if (data.call.status === 'ENDED' || data.call.status === 'MISSED') {
            if (callState !== 'ENDED') {
              handleEndCall(false)
            }
            return
          }
          if (data.call.status === 'REJECTED') {
            ringbackPlayer.stop()
            setCallState('REJECTED')
            setTimeout(() => {
              setCallState('IDLE')
              onCallClosed()
            }, 1500)
            return
          }
        }

        const pc = peerConnRef.current
        if (data.signals && data.signals.length > 0 && pc) {
          for (const s of data.signals) {
            if (s.timestamp > lastSignalTimestampRef.current) {
              lastSignalTimestampRef.current = s.timestamp
            }

            if (s.type === 'answer' && pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(s.payload))
              ringbackPlayer.stop()
              setCallState('CONNECTED')
            } else if (s.type === 'candidate') {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(s.payload))
              } catch {}
            }
          }
        }
      } catch {}
    }

    pollTimerRef.current = setInterval(pollSignals, 1500)
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
      }
    }
  }, [callId, callState, handleEndCall, onCallClosed])

  // --------------------------------------------------------------------------
  // Duration timer when connected
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (callState === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [callState])

  // --------------------------------------------------------------------------
  // Toggle Microphone
  // --------------------------------------------------------------------------
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setMicMuted(!audioTrack.enabled)
        toast.info(audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted')
      }
    }
  }

  // --------------------------------------------------------------------------
  // Toggle Speaker / Remote Audio
  // --------------------------------------------------------------------------
  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted
      setSpeakerMuted(remoteAudioRef.current.muted)
    }
  }

  // Format MM:SS
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (callState === 'IDLE') {
    return <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
  }

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Floating / Full WhatsApp-style call card overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-sm rounded-3xl bg-[#090D18] border border-slate-800 text-white shadow-2xl p-6 flex flex-col items-center justify-between min-h-[460px] relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#78350F]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Top Status & End-to-End Encryption Banner */}
          <div className="w-full flex flex-col items-center gap-1.5 z-10">
            <div className="flex items-center gap-1 text-[11px] text-amber-200/70">
              <Shield className="h-3 w-3 text-amber-400" />
              <span>Mapstar Private Voice Call</span>
            </div>
            <p className="text-xs font-semibold tracking-wide uppercase text-slate-400">
              {callState === 'OUTGOING_CALLING' && 'Ringing...'}
              {callState === 'INCOMING_RINGING' && 'Incoming Call...'}
              {callState === 'CONNECTING' && 'Connecting audio...'}
              {callState === 'CONNECTED' && (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {formatDuration(duration)}
                </span>
              )}
              {callState === 'BUSY' && <span className="text-amber-400">User is Busy</span>}
              {callState === 'REJECTED' && <span className="text-rose-400">Call Declined</span>}
              {callState === 'ENDED' && <span className="text-slate-400">Call Ended</span>}
            </p>
          </div>

          {/* Center: Avatar & Caller Info */}
          <div className="flex flex-col items-center gap-3 my-6 z-10">
            <div className="relative">
              {/* Pulsing ring animation while ringing or connected */}
              {(callState === 'OUTGOING_CALLING' ||
                callState === 'INCOMING_RINGING' ||
                callState === 'CONNECTED') && (
                <div className="absolute inset-0 rounded-full bg-[#78350F]/40 animate-ping opacity-60" />
              )}
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-[#78350F] to-amber-700 flex items-center justify-center border-4 border-slate-800 shadow-xl relative z-10">
                <User className="h-12 w-12 text-amber-100" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white tracking-tight">{peerName}</h2>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <Badge
                  variant="outline"
                  className="bg-slate-900/80 border-slate-700 text-amber-200 text-[10px] px-2 py-0.5"
                >
                  {peerRole}
                </Badge>
                <span className="text-[11px] text-slate-400">Direct In-App Call</span>
              </div>
            </div>
          </div>

          {/* Bottom Call Controls */}
          <div className="w-full flex items-center justify-around z-10 pt-4 border-t border-slate-800/80">
            {/* INCOMING CALL ACTIONS */}
            {callState === 'INCOMING_RINGING' && (
              <div className="w-full flex items-center justify-around">
                {/* Decline Button (Red) */}
                <button
                  onClick={handleRejectCall}
                  className="flex flex-col items-center gap-1.5 group transition"
                  title="Decline Call"
                >
                  <div className="h-14 w-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/40 transition-transform active:scale-95">
                    <PhoneOff className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium">Decline</span>
                </button>

                {/* Accept Button (Green) */}
                <button
                  onClick={handleAcceptCall}
                  className="flex flex-col items-center gap-1.5 group transition"
                  title="Accept Call"
                >
                  <div className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/40 animate-bounce transition-transform active:scale-95">
                    <Phone className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold">Accept</span>
                </button>
              </div>
            )}

            {/* ACTIVE / OUTGOING CONTROLS */}
            {callState !== 'INCOMING_RINGING' && (
              <div className="w-full flex items-center justify-around">
                {/* Mute Mic */}
                <button
                  onClick={toggleMic}
                  disabled={callState !== 'CONNECTED'}
                  className={`flex flex-col items-center gap-1.5 group transition ${
                    callState !== 'CONNECTED' ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                  title={micMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center border transition ${
                      micMuted
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {micMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {micMuted ? 'Unmute' : 'Mute'}
                  </span>
                </button>

                {/* End Call Button (Red) */}
                <button
                  onClick={() => handleEndCall(true)}
                  className="flex flex-col items-center gap-1.5 group transition"
                  title="End Call"
                >
                  <div className="h-14 w-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/40 transition-transform active:scale-95">
                    <PhoneOff className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] text-rose-300 font-semibold">End Call</span>
                </button>

                {/* Speaker Toggle */}
                <button
                  onClick={toggleSpeaker}
                  disabled={callState !== 'CONNECTED'}
                  className={`flex flex-col items-center gap-1.5 group transition ${
                    callState !== 'CONNECTED' ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                  title={speakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
                >
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center border transition ${
                      speakerMuted
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {speakerMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {speakerMuted ? 'Unmute Spk' : 'Speaker'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/user-auth'
import { submitVerificationApplication } from '@/lib/verification'

export const dynamic = 'force-dynamic'

/**
 * POST /api/verification/persona
 * Initiates an identity verification inquiry using the official Persona API.
 */
export async function POST(req: NextRequest) {
  const user = await getUserSession()
  if (!user) {
    return NextResponse.json({ error: 'Please log in to verify your identity.' }, { status: 401 })
  }

  const personaApiKey = process.env.PERSONA_API_KEY
  const templateId =
    process.env.PERSONA_INQUIRY_TEMPLATE_ID ||
    process.env.PERSONA_TEMPLATE_ID ||
    process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID ||
    'itmpl_mapstar_identity'
  const environmentId = process.env.PERSONA_ENVIRONMENT_ID || process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID

  const nameParts = (user.fullName || '').trim().split(' ')
  const firstName = nameParts[0] || undefined
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined

  try {
    let inquiryId: string | null = null
    let sessionToken: string | null = null
    let inquiryUrl: string | null = null
    let mode: 'live' | 'sandbox' = 'sandbox'

    // If Persona API Key is configured, create live inquiry via Persona REST API
    if (personaApiKey) {
      mode = 'live'
      const personaRes = await fetch('https://withpersona.com/api/v1/inquiries', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${personaApiKey}`,
          'Persona-Version': '2023-01-05',
          'Key-Inflection': 'camel',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              inquiryTemplateId: templateId,
              referenceId: user.id,
              fields: {
                ...(firstName ? { nameFirst: firstName } : {}),
                ...(lastName ? { nameLast: lastName } : {}),
                ...(user.email ? { emailAddress: user.email } : {}),
                ...(user.phone ? { phoneNumber: user.phone } : {}),
              },
            },
          },
        }),
      })

      if (personaRes.ok) {
        const personaData = await personaRes.json()
        inquiryId = personaData?.data?.id || null
        sessionToken = personaData?.data?.attributes?.sessionToken || null
        inquiryUrl = personaData?.data?.attributes?.redirectUrl || null
      } else {
        const errorText = await personaRes.text()
        console.warn('Persona API inquiry creation warning:', personaRes.status, errorText)
      }
    }

    // Record pending identity verification in database
    await submitVerificationApplication({
      userId: user.id,
      userEmail: user.email,
      fullName: user.fullName || user.email,
      phone: user.phone || undefined,
      type: 'IDENTITY',
      notes: `Persona Identity API inquiry initiated (${mode} mode, inquiry: ${inquiryId || 'pending'})`,
    })

    return NextResponse.json({
      success: true,
      mode,
      inquiryId: inquiryId || `inq_${user.id}_${Date.now()}`,
      sessionToken,
      inquiryUrl,
      templateId,
      environmentId,
      referenceId: user.id,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    })
  } catch (err: any) {
    console.error('Error initiating Persona verification:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to initiate Persona verification' },
      { status: 500 }
    )
  }
}

import { Resend } from 'resend'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  body: string
  html?: string
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Sends a transactional email using Resend.
 *
 * Configured via RESEND_API_KEY and MAPSTAR_FROM_EMAIL.
 * If RESEND_API_KEY is unset, logs the message and reset code to the server console (dev mode).
 * This is the only allowed fallback.
 */
export async function sendEmail({
  to,
  subject,
  body,
  html,
}: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()

  if (!apiKey) {
    const recipients = Array.isArray(to) ? to.join(', ') : to
    console.log('[EMAIL_DEV_MODE] RESEND_API_KEY is unset. Logging email to server console:')
    console.log(`[EMAIL_DEV_MODE] To: ${recipients}`)
    console.log(`[EMAIL_DEV_MODE] Subject: ${subject}`)
    console.log(`[EMAIL_DEV_MODE] Body:\n${body}`)
    return {
      success: true,
      id: 'dev-mode',
    }
  }

  try {
    const resend = new Resend(apiKey)
    const from =
      process.env.MAPSTAR_FROM_EMAIL?.trim() || 'Mapstar <onboarding@resend.dev>'

    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      text: body,
      html: html || body.replace(/\n/g, '<br/>'),
    })

    if (error) {
      console.error('[EMAIL] Failed to send email via Resend:', error)
      throw new Error(`Failed to send email via Resend: ${error.message || JSON.stringify(error)}`)
    }

    return {
      success: true,
      id: data?.id,
    }
  } catch (err: any) {
    console.error('[EMAIL] Unexpected error sending email via Resend:', err)
    throw err
  }
}

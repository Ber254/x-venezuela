import { google } from 'googleapis'

/**
 * Creates a Google Calendar event with Google Meet link.
 * Uses a Service Account with Domain-Wide Delegation so no
 * user OAuth flow is needed — the service account impersonates
 * the calendar owner (GOOGLE_CALENDAR_DELEGATION_EMAIL).
 */
export async function createMeetEvent({
  date,
  hour,
  psicName,
  psicEmail,
  patientName,
  patientEmail,
}: {
  date: string       // YYYY-MM-DD
  hour: string       // HH:00
  psicName: string
  psicEmail: string
  patientName: string
  patientEmail: string
}): Promise<{ meetLink: string; eventId: string } | null> {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject: process.env.GOOGLE_CALENDAR_DELEGATION_EMAIL,
    })

    const calendar = google.calendar({ version: 'v3', auth })

    const [h] = hour.split(':').map(Number)
    const startDateTime = `${date}T${String(h).padStart(2, '0')}:00:00`
    const endDateTime   = `${date}T${String(h + 1).padStart(2, '0')}:00:00`

    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: {
        summary: `Sesión psicológica — Parcuve Sin Fronteras`,
        description: [
          `Sesión de atención psicológica gratuita`,
          `Psicólogo/a: ${psicName}`,
          `Paciente: ${patientName}`,
        ].join('\n'),
        start: { dateTime: startDateTime, timeZone: 'America/Caracas' },
        end:   { dateTime: endDateTime,   timeZone: 'America/Caracas' },
        attendees: [
          { email: psicEmail,    displayName: psicName },
          { email: patientEmail, displayName: patientName },
        ],
        conferenceData: {
          createRequest: {
            requestId: `xve-${date}-${hour}-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
      },
    })

    const meetLink = event.data.conferenceData?.entryPoints?.find(
      e => e.entryPointType === 'video'
    )?.uri

    if (!meetLink || !event.data.id) return null

    return { meetLink, eventId: event.data.id }
  } catch (err) {
    console.error('[Google Calendar] Error creating event:', err)
    return null
  }
}

export async function deleteMeetEvent(eventId: string): Promise<void> {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject: process.env.GOOGLE_CALENDAR_DELEGATION_EMAIL,
    })
    const calendar = google.calendar({ version: 'v3', auth })
    await calendar.events.delete({ calendarId: 'primary', eventId, sendUpdates: 'all' })
  } catch (err) {
    console.error('[Google Calendar] Error deleting event:', err)
  }
}

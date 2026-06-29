import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createMeetEvent } from '@/lib/google/calendar'
import { sendBookingConfirmation } from '@/lib/email/send'

const CreateBookingSchema = z.object({
  date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hour:    z.string().regex(/^\d{2}:00$/),
  psic_id: z.string().uuid(),
})

/** GET /api/bookings — returns bookings visible to current user */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  let query = supabase
    .from('bookings')
    .select('*, psic:profiles!psic_id(id,full_name,specialty,color,email), patient:profiles!patient_id(id,full_name,email)')
    .order('date').order('hour')

  if (from) query = query.gte('date', from)
  if (to)   query = query.lte('date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

/** POST /api/bookings — create booking + Google Meet + email */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = CreateBookingSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { date, hour, psic_id } = parsed.data

  // Enforce 3-per-week quota
  const weekStart = getWeekStart(date)
  const weekEnd   = getWeekEnd(date)

  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', user.id)
    .gte('date', weekStart)
    .lte('date', weekEnd)

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'Quota semanal alcanzada (máx. 3 turnos)' }, { status: 422 })
  }

  // Check slot availability (race-condition safe via unique constraint)
  const service = await createServiceClient()

  const { data: booking, error: insertErr } = await service
    .from('bookings')
    .insert({ date, hour, psic_id, patient_id: user.id })
    .select('*, psic:profiles!psic_id(id,full_name,specialty,color,email), patient:profiles!patient_id(id,full_name,email)')
    .single()

  if (insertErr) {
    if (insertErr.code === '23505') {
      return NextResponse.json({ error: 'Este turno ya fue tomado' }, { status: 409 })
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Create Google Meet (non-blocking — don't fail if Calendar is down)
  const psic    = booking.psic    as { full_name: string; email: string }
  const patient = booking.patient as { full_name: string; email: string }

  const meetResult = await createMeetEvent({
    date, hour,
    psicName:    psic.full_name,    psicEmail:    psic.email,
    patientName: patient.full_name, patientEmail: patient.email,
  })

  if (meetResult) {
    await service.from('bookings').update({
      meet_link:         meetResult.meetLink,
      calendar_event_id: meetResult.eventId,
    }).eq('id', booking.id)

    booking.meet_link = meetResult.meetLink
  }

  // Send confirmation emails (non-blocking)
  sendBookingConfirmation({
    patientEmail: patient.email, patientName: patient.full_name,
    psicEmail:    psic.email,    psicName:    psic.full_name,
    date, hour, meetLink: booking.meet_link ?? undefined,
  }).catch(console.error)

  return NextResponse.json(booking, { status: 201 })
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().split('T')[0]
}

function getWeekEnd(dateStr: string): string {
  const start = new Date(getWeekStart(dateStr) + 'T12:00:00')
  start.setDate(start.getDate() + 6)
  return start.toISOString().split('T')[0]
}

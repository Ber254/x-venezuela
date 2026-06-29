import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { deleteMeetEvent } from '@/lib/google/calendar'
import { sendBookingCancellation } from '@/lib/email/send'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  // Fetch booking with relations
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('*, psic:profiles!psic_id(full_name,email), patient:profiles!patient_id(full_name,email)')
    .eq('id', id)
    .single()

  if (fetchErr || !booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner  = booking.patient_id === user.id
  const isAdmin  = ['admin','superadmin'].includes(profile?.role ?? '')
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = await createServiceClient()

  // Delete calendar event (non-blocking)
  if (booking.calendar_event_id) {
    deleteMeetEvent(booking.calendar_event_id).catch(console.error)
  }

  const { error: deleteErr } = await service.from('bookings').delete().eq('id', id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  const psic    = booking.psic    as { full_name: string; email: string }
  const patient = booking.patient as { full_name: string; email: string }

  sendBookingCancellation({
    patientEmail: patient.email, patientName: patient.full_name,
    psicEmail:    psic.email,    psicName:    psic.full_name,
    date: booking.date, hour: booking.hour,
  }).catch(console.error)

  return NextResponse.json({ ok: true })
}

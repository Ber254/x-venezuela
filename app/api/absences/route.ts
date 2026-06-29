import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const CreateAbsenceSchema = z.object({ booking_id: z.string().uuid() })

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('absences')
    .select('*')
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: actorProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!actorProfile || actorProfile.role !== 'psic') {
    return NextResponse.json({ error: 'Solo psicólogos pueden registrar inasistencias' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = CreateAbsenceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Fetch booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, patient:profiles!patient_id(full_name,email)')
    .eq('id', parsed.data.booking_id)
    .eq('psic_id', user.id)       // psic can only register their own bookings
    .single()

  if (!booking) return NextResponse.json({ error: 'Turno no encontrado o no autorizado' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]
  if (booking.date >= today) {
    return NextResponse.json({ error: 'Solo se puede registrar inasistencia de turnos pasados' }, { status: 422 })
  }

  const patient = booking.patient as { full_name: string; email: string }
  const service = await createServiceClient()

  const { data, error } = await service.from('absences').insert({
    booking_id:    booking.id,
    date:          booking.date,
    hour:          booking.hour,
    psic_id:       user.id,
    patient_id:    booking.patient_id,
    patient_name:  patient.full_name,
    patient_email: patient.email,
    registered_by: user.id,
  }).select().single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Inasistencia ya registrada' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

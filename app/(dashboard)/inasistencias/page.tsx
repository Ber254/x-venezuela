import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InasistenciasClient from './InasistenciasClient'

export default async function InasistenciasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role,id').eq('id', user.id).single()
  if (!profile || profile.role !== 'psic') redirect('/calendario')

  const today     = new Date().toISOString().split('T')[0]
  const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30)
  const from      = thirtyAgo.toISOString().split('T')[0]

  const [bookingsRes, absencesRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id,date,hour,patient_id,patient:profiles!patient_id(full_name,email)')
      .eq('psic_id', profile.id)
      .lt('date', today)
      .gte('date', from)
      .order('date', { ascending: false }),
    supabase
      .from('absences')
      .select('*')
      .eq('psic_id', profile.id)
      .order('date', { ascending: false }),
  ])

  // Supabase returns joined relation as array; cast to the local type the client expects
  type BookingRow = { id: string; date: string; hour: string; patient_id: string; patient: { full_name: string; email: string } }
  const bookings = (bookingsRes.data ?? []).map(b => ({
    ...b,
    patient: Array.isArray(b.patient) ? b.patient[0] : b.patient,
  })) as BookingRow[]

  return (
    <InasistenciasClient
      psicId={profile.id}
      bookings={bookings}
      absences={absencesRes.data ?? []}
    />
  )
}

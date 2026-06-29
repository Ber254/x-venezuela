import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminCalendar from '@/components/calendar/AdminCalendar'

export default async function CalendarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/acceso-profesional')

  const { data: profile } = await supabase.from('profiles').select('role,id').eq('id', user.id).single()
  if (!profile || profile.role === 'user') redirect('/reservar')

  const today = new Date()
  const from  = new Date(today); from.setDate(from.getDate() - 7)
  const to    = new Date(today); to.setDate(to.getDate()   + 21)

  const [bookingsRes, availRes, psicsRes] = await Promise.all([
    supabase.from('bookings').select('*').gte('date', from.toISOString().split('T')[0]).lte('date', to.toISOString().split('T')[0]),
    supabase.from('availability').select('*'),
    supabase.from('profiles').select('id,full_name,color,specialty,active,email,role,created_at').eq('role','psic'),
  ])

  return (
    <AdminCalendar
      role={profile.role}
      psicId={profile.role === 'psic' ? profile.id : undefined}
      bookings={bookingsRes.data ?? []}
      availability={availRes.data ?? []}
      psics={psicsRes.data ?? []}
    />
  )
}

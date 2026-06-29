import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReservarClient from './ReservarClient'

export default async function ReservarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'user') redirect('/calendario')

  const today    = new Date()
  const from     = today.toISOString().split('T')[0]
  const twoWeeks = new Date(today); twoWeeks.setDate(twoWeeks.getDate() + 14)
  const to       = twoWeeks.toISOString().split('T')[0]

  const weekStart = getWeekStart(from)
  const weekEnd   = getWeekEnd(from)

  const [psicsRes, availRes, bookingsRes, myWeekRes] = await Promise.all([
    supabase.from('profiles').select('id,full_name,specialty,color,email,active,role,created_at').eq('role','psic').eq('active', true),
    supabase.from('availability').select('*').lte('valid_from', to).gte('valid_until', from),
    supabase.from('bookings').select('id,date,hour,psic_id,patient_id,meet_link').gte('date', from).lte('date', to),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('patient_id', user.id).gte('date', weekStart).lte('date', weekEnd),
  ])

  return (
    <ReservarClient
      profile={profile}
      psics={psicsRes.data ?? []}
      availability={availRes.data ?? []}
      bookings={bookingsRes.data ?? []}
      weekUsed={myWeekRes.count ?? 0}
    />
  )
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().split('T')[0]
}
function getWeekEnd(dateStr: string): string {
  const s = new Date(getWeekStart(dateStr) + 'T12:00:00')
  s.setDate(s.getDate() + 6)
  return s.toISOString().split('T')[0]
}
